
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import { Tesseract, type Page } from 'npm:tesseract.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pppteoxncuuraqjlrhir.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { answerScriptId, imageUrl } = await req.json()
    
    if (!answerScriptId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId and imageUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Update script status to OCR pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'ocr_pending' })
      .eq('id', answerScriptId)
    
    // Get the examination details for this script
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, examinations(*)')
      .eq('id', answerScriptId)
      .single()
    
    if (scriptError) {
      throw new Error(`Failed to fetch answer script: ${scriptError.message}`)
    }
    
    // Get all questions for this examination
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('examination_id', scriptData.examination_id)
      .order('created_at')
    
    if (questionsError) {
      throw new Error(`Failed to fetch questions: ${questionsError.message}`)
    }
    
    // Perform OCR on the image
    console.log(`Performing OCR on image: ${imageUrl}`)
    const result = await performOCR(imageUrl)
    console.log('OCR complete, extracted text:', result.text.substring(0, 100) + '...')
    
    // Update script status to OCR complete
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'ocr_complete' })
      .eq('id', answerScriptId)
    
    // Segment the extracted text into answers based on the number of questions
    const segmentedAnswers = segmentAnswers(result.text, questions.length)
    
    // Create answer records for each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const extractedText = segmentedAnswers[i] || ''
      
      // Create or update the answer record
      await supabase.from('answers').upsert({
        answer_script_id: answerScriptId,
        question_id: question.id,
        extracted_text: extractedText
      }, { onConflict: 'answer_script_id,question_id' })
    }
    
    // Update script status to grading pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_pending' })
      .eq('id', answerScriptId)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OCR processing complete',
        extractedText: result.text
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing OCR:', error)
    
    // If we have an answerScriptId, update its status to error
    try {
      const { answerScriptId } = await req.json()
      if (answerScriptId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pppteoxncuuraqjlrhir.supabase.co'
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        
        await supabase
          .from('answer_scripts')
          .update({ processing_status: 'error' })
          .eq('id', answerScriptId)
      }
    } catch (updateError) {
      console.error('Error updating script status:', updateError)
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function performOCR(imageUrl: string): Promise<{ text: string }> {
  try {
    const worker = await Tesseract.createWorker('eng')
    const result = await worker.recognize(imageUrl)
    await worker.terminate()
    return { text: result.data.text }
  } catch (error) {
    console.error('Tesseract OCR error:', error)
    throw new Error('Failed to extract text from image')
  }
}

function segmentAnswers(extractedText: string, questionCount: number): string[] {
  // Basic segmentation algorithm
  const segmentedAnswers: string[] = []
  
  // Try to identify question markers
  const questionRegex = /(?:^|\n)\s*(?:q(?:uestion)?\s*(\d+)|(\d+)\s*[\)\.:])/gi
  const matches = [...extractedText.matchAll(questionRegex)]
  
  if (matches.length >= questionCount) {
    // We found enough markers to segment by
    for (let i = 0; i < questionCount; i++) {
      const start = matches[i].index || 0
      const end = i < matches.length - 1 ? matches[i + 1].index : extractedText.length
      segmentedAnswers[i] = extractedText.substring(start, end).trim()
    }
  } else {
    // If we couldn't segment by markers, try dividing the text evenly
    const avgLength = Math.floor(extractedText.length / questionCount)
    for (let i = 0; i < questionCount; i++) {
      const start = i * avgLength
      const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength
      segmentedAnswers[i] = extractedText.substring(start, end).trim()
    }
  }
  
  return segmentedAnswers
}
