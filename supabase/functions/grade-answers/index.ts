
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = "AIzaSyBBguG3m3mglvQzUXALiTccH73gpRFM1c8"
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

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
    const { answerScriptId } = await req.json()
    
    if (!answerScriptId) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Update script status to grading pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_pending' })
      .eq('id', answerScriptId)
    
    // Get all data needed for grading
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, examinations(*)')
      .eq('id', answerScriptId)
      .single()
    
    if (scriptError) {
      throw new Error(`Failed to fetch answer script: ${scriptError.message}`)
    }
    
    // Get the answers for this script
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*, questions(*)')
      .eq('answer_script_id', answerScriptId)
    
    if (answersError) {
      throw new Error(`Failed to fetch answers: ${answersError.message}`)
    }
    
    // Get the subject information
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', scriptData.examinations.subject_id)
      .single()
    
    if (subjectError) {
      throw new Error(`Failed to fetch subject: ${subjectError.message}`)
    }
    
    // Grade each answer
    const gradingResults = []
    for (const answer of answers) {
      if (!answer.extracted_text) {
        console.log(`Skipping answer ${answer.id} - no extracted text`)
        continue
      }
      
      const question = answer.questions
      
      // Grade the answer
      const result = await gradeStudentAnswer(
        subjectData.name,
        question.question_text,
        question.marks,
        question.tolerance,
        question.model_answer,
        answer.extracted_text
      )
      
      // Update the answer with the grade
      const { error: updateError } = await supabase
        .from('answers')
        .update({
          assigned_grade: result.score,
          llm_explanation: result.explanation
        })
        .eq('id', answer.id)
      
      if (updateError) {
        throw new Error(`Failed to update answer grade: ${updateError.message}`)
      }
      
      gradingResults.push({
        answerId: answer.id,
        score: result.score,
        explanation: result.explanation
      })
    }
    
    // Update script status to grading complete
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_complete' })
      .eq('id', answerScriptId)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Grading complete',
        results: gradingResults
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error grading answers:', error)
    
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

async function gradeStudentAnswer(
  subject: string, 
  question: string, 
  maxMarks: number, 
  tolerance: number, 
  modelAnswer: string, 
  studentAnswer: string
): Promise<{ score: number; explanation: string }> {
  const prompt = `
    Objective: Evaluate a student's handwritten answer against a model answer based on semantic meaning and assign a score.
    Subject: ${subject}
    Question: "${question}"
    Maximum Marks for this Question: ${maxMarks}
    Required Semantic Similarity Tolerance: ${tolerance} (A higher value means the student's answer must be closer in meaning to the model answer).
    Model Answer: "${modelAnswer}"
    Student's Answer (from OCR): "${studentAnswer}"

    Instructions:
    1. Analyze the semantic meaning and key concepts present in the "Student's Answer".
    2. Compare this meaning to the "Model Answer".
    3. Determine the degree of semantic alignment between the student's answer and the model answer.
    4. Assign a score from 0 to ${maxMarks} based on this alignment, considering the "Required Semantic Similarity Tolerance". A score of ${maxMarks} should be given if the alignment meets or exceeds the tolerance threshold. Award partial credit proportionately if key concepts are partially present or alignment is close but below the threshold.
    5. Provide a brief, one-sentence explanation for the assigned score, mentioning key alignments or deviations.

    Output Format (JSON):
    {
      "score": <assigned score (float)>,
      "explanation": "<brief explanation (string)>"
    }
  `

  try {
    const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.0,
          topP: 0.1,
          topK: 16,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${errorText}`)
    }

    const data = await response.json()
    const resultText = data.candidates[0].content.parts[0].text.trim()
    
    try {
      // Parse the JSON from the response text
      const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '')
      return JSON.parse(cleanedJson)
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", resultText)
      // If parsing fails, create a fallback response
      return {
        score: 0,
        explanation: "Failed to parse grading result from Gemini API"
      }
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    throw error
  }
}
