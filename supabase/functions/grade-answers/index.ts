
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = 'AIzaSyDI-Dlnosnc5js38cj8d6O-y-Icl2EXzV0';
const MODEL_NAME = 'gemma-3-27b-it';

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("Grading function called")
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pppteoxncuuraqjlrhir.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const requestData = await req.json()
    const { answerScriptId, customInstructions } = requestData
    
    if (!answerScriptId) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Grading script ${answerScriptId}`)
    
    // Update status to grading_pending if not already
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_pending' })
      .eq('id', answerScriptId)
      .eq('processing_status', 'ocr_complete')
    
    // Get the necessary information: answers, questions, and script details
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*, question:questions(*)')
      .eq('answer_script_id', answerScriptId)
    
    if (answersError || !answers || answers.length === 0) {
      const errorMsg = `No answers found for script ${answerScriptId}. Error: ${answersError?.message || 'No data'}`
      console.error(errorMsg)
      
      // Update status to error
      await supabase
        .from('answer_scripts')
        .update({ processing_status: 'error' })
        .eq('id', answerScriptId)
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get script details for subject information
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, examination:examinations(*, subject:subjects(*))')
      .eq('id', answerScriptId)
      .single()
    
    if (scriptError || !scriptData) {
      const errorMsg = `Failed to fetch script data: ${scriptError?.message || 'No data'}`
      console.error(errorMsg)
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const subjectName = scriptData.examination?.subject?.name || 'General'
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: MODEL_NAME })
    
    console.log(`Found ${answers.length} answers to grade`)
    
    // Grade each answer
    let totalScore = 0
    let totalPossibleScore = 0
    const scriptFlags = []
    
    for (const answer of answers) {
      if (!answer.extracted_text || answer.is_overridden) {
        console.log(`Skipping answer ${answer.id}: No extracted text or already overridden`)
        if (answer.is_overridden && answer.manual_grade !== null) {
          totalScore += answer.manual_grade
        }
        if (answer.question) {
          totalPossibleScore += answer.question.marks
        }
        continue
      }
      
      const question = answer.question
      if (!question) {
        console.error(`No question found for answer ${answer.id}`)
        continue
      }
      
      console.log(`Grading answer for question: ${question.question_text.substring(0, 50)}...`)
      
      // Prepare grading prompt with custom instructions if provided
      let customGradingInfo = ''
      if (customInstructions) {
        customGradingInfo = `Additional Grading Instructions: ${customInstructions}
        `
      }
      
      // Create prompt for grading
      const prompt = `
        Objective: Evaluate a student's handwritten answer against a model answer, focusing on understanding and core concepts rather than exact wording.
        Subject: ${subjectName}
        Question: "${question.question_text}"
        Maximum Marks for this Question: ${question.marks}
        Required Semantic Similarity Tolerance: ${question.tolerance} (Used as a general guide for conceptual alignment rather than strict matching)
        Model Answer: "${question.model_answer}"
        Student's Answer (from OCR): "${answer.extracted_text}"
        ${customGradingInfo}
        
        Grading Context: This is a handwritten exam response that has been processed through OCR. Expect and allow for:
        - Natural variations in wording and expression
        - Minor spelling or grammar issues
        - Different ways of explaining the same concept
        - Informal language while conveying correct understanding
        
        Instructions:
        1. Focus on the core concepts and overall understanding demonstrated in the student's answer.
        2. Look for evidence that the student grasps the fundamental ideas, even if expressed differently from the model answer.
        3. Consider partial credit for partially correct understanding.
        4. Assign a score from 0 to ${question.marks}. Award full marks if the core concepts are present and understanding is demonstrated, even if the wording differs significantly.
        5. Provide a brief explanation focusing on the demonstrated understanding and any missing key concepts.
        6. Only flag for misconduct if there is clear evidence of exact copying from unseen sources (not just similarity to the model answer) or completely off-topic responses.

        Output Format (JSON):
        {
          "score": <assigned score (float)>,
          "explanation": "<brief explanation focusing on understanding>",
          "flags": ["<only include for clear misconduct, not for wording similarities>"]
        }
      `
      
      try {
        console.log(`Student answer length: ${answer.extracted_text.length} chars`)
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.0,
            topK: 1,
            topP: 0.1,
            maxOutputTokens: 1024
          }
        })
        
        const responseText = result.response.text().trim()
        
        // Parse the result JSON
        try {
          const cleanedJson = responseText.replace(/^```json\n|\n```$/g, '')
          const gradingResult = JSON.parse(cleanedJson)
          
          console.log(`Grading result: score=${gradingResult.score}, explanation=${gradingResult.explanation.substring(0, 50)}...`)
          
          // Update the answer with the grading results
          await supabase
            .from('answers')
            .update({
              assigned_grade: gradingResult.score,
              llm_explanation: gradingResult.explanation,
              flags: gradingResult.flags || []
            })
            .eq('id', answer.id)
          
          totalScore += gradingResult.score
          totalPossibleScore += question.marks
          
          // Collect any flags for the script level
          if (gradingResult.flags && gradingResult.flags.length > 0) {
            scriptFlags.push(...gradingResult.flags)
          }
        } catch (parseError) {
          console.error('Failed to parse grading result JSON:', parseError)
          console.error('Raw response:', responseText)
          
          // Update the answer with error information
          await supabase
            .from('answers')
            .update({
              llm_explanation: `Error parsing grading result: ${parseError.message}`,
              flags: ['grading_error']
            })
            .eq('id', answer.id)
        }
      } catch (gradingError) {
        console.error(`Error grading answer ${answer.id}:`, gradingError)
        
        // Update the answer with error information
        await supabase
          .from('answers')
          .update({
            llm_explanation: `Error during grading: ${gradingError.message}`,
            flags: ['grading_error']
          })
          .eq('id', answer.id)
      }
    }
    
    // Update the script with total score and status
    await supabase
      .from('answer_scripts')
      .update({
        processing_status: 'grading_complete',
        flags: scriptFlags.length > 0 ? [...new Set(scriptFlags)] : null
      })
      .eq('id', answerScriptId)
    
    console.log(`Grading complete for script ${answerScriptId}, total score: ${totalScore}/${totalPossibleScore}`)
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Grading complete',
        totalScore,
        totalPossibleScore
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error during grading process:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred during grading' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
