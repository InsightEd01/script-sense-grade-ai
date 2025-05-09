
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || 'AIzaSyBBe5atwksC1l0hXhCudRs6oYIcu7ZdxhA'
const MODEL_NAME = 'gemini-2.0-flash'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: MODEL_NAME })

const generationConfig = {
  temperature: 0.0,
  topP: 0.1,
  topK: 1,
  maxOutputTokens: 1024,
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log("Grading function called")
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pppteoxncuuraqjlrhir.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { answerScriptId, customInstructions } = await req.json()
    
    if (!answerScriptId) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Grading script ${answerScriptId}`)
    
    // Update script status to grading in progress
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_pending' })
      .eq('id', answerScriptId)
    
    // Get the script and examination details
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, examination:examinations(*), student:students(*)')
      .eq('id', answerScriptId)
      .single()
    
    if (scriptError) {
      console.error(`Failed to fetch answer script: ${scriptError.message}`)
      throw new Error(`Failed to fetch answer script: ${scriptError.message}`)
    }
    
    // Get the subject for this examination
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', scriptData.examination.subject_id)
      .single()
    
    if (subjectError) {
      console.error(`Failed to fetch subject: ${subjectError.message}`)
      throw new Error(`Failed to fetch subject: ${subjectError.message}`)
    }
    
    const subjectName = subjectData.name
    
    // Get all answers for this script
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*, question:questions(*)')
      .eq('answer_script_id', answerScriptId)
    
    if (answersError) {
      console.error(`Failed to fetch answers: ${answersError.message}`)
      throw new Error(`Failed to fetch answers: ${answersError.message}`)
    }
    
    console.log(`Found ${answers.length} answers to grade`)
    
    const scriptFlags: string[] = []
    let totalScore = 0
    
    // Process each answer
    for (const answer of answers) {
      try {
        if (!answer.extracted_text || answer.extracted_text.trim() === '') {
          console.log(`No extracted text for answer ${answer.id}, skipping grading`)
          continue
        }
        
        console.log(`Grading answer for question: ${answer.question.question_text.substring(0, 30)}...`)
        
        // Call Gemini API to grade the answer
        const gradingResult = await gradeStudentAnswer(
          subjectName,
          answer.question.question_text,
          answer.question.marks,
          answer.question.tolerance,
          answer.question.model_answer,
          answer.extracted_text,
          customInstructions
        )
        
        console.log(`Grading result: score=${gradingResult.score}, explanation=${gradingResult.explanation.substring(0, 50)}...`)
        
        // Update the answer with the grading results
        await supabase
          .from('answers')
          .update({
            assigned_grade: gradingResult.score,
            llm_explanation: gradingResult.explanation,
            flags: gradingResult.flags
          })
          .eq('id', answer.id)
        
        // Add to total score
        totalScore += gradingResult.score
        
        // Collect any flags for the script level
        if (gradingResult.flags && gradingResult.flags.length > 0) {
          scriptFlags.push(...gradingResult.flags)
        }
      } catch (answerError) {
        console.error(`Error grading answer ${answer.id}: ${answerError.message}`)
      }
    }
    
    // Update the answer script with the total score and flags
    await supabase
      .from('answer_scripts')
      .update({ 
        processing_status: 'grading_complete',
        flags: scriptFlags.length > 0 ? scriptFlags : null
      })
      .eq('id', answerScriptId)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Grading complete',
        totalScore
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
  studentAnswer: string,
  customInstructions?: string
): Promise<{ score: number; explanation: string; flags?: string[] }> {
  console.log(`Grading answer for subject "${subject}", max marks: ${maxMarks}, tolerance: ${tolerance}`)
  console.log(`Student answer length: ${studentAnswer.length} chars`)
  
  let customGradingInfo = ''
  if (customInstructions) {
    customGradingInfo = `Additional Grading Instructions: ${customInstructions}
    `
  }

  const prompt = `
    Objective: Evaluate a student's handwritten answer against a model answer based on semantic meaning and assign a score.
    Subject: ${subject}
    Question: "${question}"
    Maximum Marks for this Question: ${maxMarks}
    Required Semantic Similarity Tolerance: ${tolerance} (A higher value means the student's answer must be closer in meaning to the model answer).
    Model Answer: "${modelAnswer}"
    Student's Answer (from OCR): "${studentAnswer}"
    ${customGradingInfo}
    Instructions:
    1. Analyze the semantic meaning and key concepts present in the "Student's Answer".
    2. Compare this meaning to the "Model Answer".
    3. Determine the degree of semantic alignment between the student's answer and the model answer.
    4. Assign a score from 0 to ${maxMarks} based on this alignment, considering the "Required Semantic Similarity Tolerance". A score of ${maxMarks} should be given if the alignment meets or exceeds the tolerance threshold. Award partial credit proportionately if key concepts are partially present or alignment is close but below the threshold.
    5. Provide a brief, one-sentence explanation for the assigned score, mentioning key alignments or deviations.
    6. Look for potential academic misconduct like cheating or plagiarism signs, and add any flags to an array.

    Output Format (JSON):
    {
      "score": <assigned score (float)>,
      "explanation": "<brief explanation (string)>",
      "flags": ["<potential issue or warning>"]
    }
  `

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { ...generationConfig, temperature: 0.0 }
    })
    
    const response = result.response
    const resultText = response.text().trim()
    
    try {
      // Parse the JSON from the response text
      const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '')
      console.log('Parsed grading result successfully')
      return JSON.parse(cleanedJson)
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", resultText)
      // Return a default response
      return {
        score: 0,
        explanation: "Failed to parse grading result: " + parseError.message,
        flags: ["Grading error occurred"]
      }
    }
  } catch (error) {
    console.error('Error grading student answer:', error)
    throw new Error(`Failed to grade student answer: ${error.message}`)
  }
}
