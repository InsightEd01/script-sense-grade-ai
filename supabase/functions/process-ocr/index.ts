
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import { createWorker } from "https://esm.sh/tesseract.js@4.0.3"

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
    console.log("OCR function called")
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pppteoxncuuraqjlrhir.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const requestData = await req.json()
    const { answerScriptId, imageUrl } = requestData
    
    if (!answerScriptId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId and imageUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Processing script ${answerScriptId} with image ${imageUrl}`)
    
    // Update script status to OCR pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'ocr_pending' })
      .eq('id', answerScriptId)
    
    // Get the examination details for this script
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, examination:examinations(*)')
      .eq('id', answerScriptId)
      .single()
    
    if (scriptError) {
      console.error(`Failed to fetch answer script: ${scriptError.message}`)
      throw new Error(`Failed to fetch answer script: ${scriptError.message}`)
    }
    
    // Get all questions for this examination
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('examination_id', scriptData.examination_id)
      .order('created_at')
    
    if (questionsError) {
      console.error(`Failed to fetch questions: ${questionsError.message}`)
      throw new Error(`Failed to fetch questions: ${questionsError.message}`)
    }
    
    // Instead of trying to perform OCR directly in the edge function,
    // we'll return a success response and instruct the client-side to handle OCR
    // This approach avoids using browser APIs in the edge function
    
    // Set the script to OCR complete status (for demonstration)
    await supabase
      .from('answer_scripts')
      .update({ 
        processing_status: 'ocr_complete'
      })
      .eq('id', answerScriptId)
    
    // Create placeholder answers for each question
    // In a real implementation, the OCR text would be extracted client-side
    // and then sent to this function or another endpoint
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      // Create placeholder text
      const placeholderText = `Sample extracted text for question ${i+1}. In a production system, this text would be extracted from the image using client-side OCR.`
      
      await supabase.from('answers').upsert({
        answer_script_id: answerScriptId,
        question_id: question.id,
        extracted_text: placeholderText
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
        message: 'Answer script processed successfully',
        note: 'OCR placeholder responses created. In production, implement client-side OCR or use a service that supports server-side image processing.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing OCR:', error)
    
    // If we have an answerScriptId, update its status to error
    try {
      const requestData = await req.json()
      const { answerScriptId } = requestData
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
