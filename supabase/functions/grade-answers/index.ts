
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = "AIzaSyB1kwBAyXJHDJI9QDScFsDNOpIPaFitDBY";
const MODEL_NAME = "gemini-1.5-flash";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.0, // Zero temperature for consistent, deterministic results
  topP: 0.1,
  topK: 1,
  maxOutputTokens: 1024,
};

async function gradeStudentAnswer(
  subject: string,
  question: string,
  maxMarks: number,
  tolerance: number,
  modelAnswer: string,
  studentAnswer: string,
  customInstructions?: string
): Promise<{ score: number; explanation: string; flags?: string[] }> {
  console.log(`Grading answer for subject "${subject}", max marks: ${maxMarks}`);
  
  let customGradingInfo = '';
  if (customInstructions) {
    customGradingInfo = `Additional Grading Instructions: ${customInstructions}
    `;
  }

  const prompt = `
    Objective: Rigorously evaluate a student's handwritten answer against the model answer, ensuring high standards of academic assessment.
    Subject: ${subject}
    Question: "${question}"
    Maximum Marks for this Question: ${maxMarks}
    Required Semantic Similarity Tolerance: ${tolerance} (Used as a strict threshold for concept alignment)
    Model Answer: "${modelAnswer}"
    Student's Answer (from OCR): "${studentAnswer}"
    ${customGradingInfo}
    
    Grading Context: This is a handwritten exam response that has been processed through OCR. While accounting for:
    - OCR-related minor spelling variations
    - Basic grammatical variations
    - Different but valid technical terminology
    
    Strict Grading Instructions:
    1. Core Concepts Assessment (Essential):
       - Deduct 40-50% of allocated marks for missing primary concepts
       - Deduct 20-30% for incomplete explanation of core concepts
       - Require explicit demonstration of understanding, not just keyword matching
    
    2. Precision and Completeness:
       - Deduct 10-20% for missing supporting details or examples
       - Deduct 10-15% for imprecise or vague explanations
       - Require proper technical terminology where applicable
    
    3. Partial Credit Guidelines:
       - Award 0-20% for minimal understanding
       - Award 30-50% for partial understanding with significant gaps
       - Award 60-80% for good understanding with minor omissions
       - Reserve 90-100% for comprehensive, accurate answers only
    
    4. Common Error Penalties:
       - Deduct 10% for significant conceptual ambiguity
       - Deduct 15% for incorrect use of technical terms
       - Deduct 20% for logical inconsistencies
       - Deduct 25% for fundamental misunderstandings
    
    5. Grading Process:
       a) Identify all required concepts from the model answer
       b) Check for presence and accuracy of each concept
       c) Apply deductions for missing or incorrect elements
       d) Consider partial credit based on demonstrated understanding
       e) Apply additional penalties for errors
       f) Provide specific justification for marks deducted
    
    6. Misconduct Flags:
       - Flag exact copying from external sources
       - Flag completely off-topic responses
       - Flag answers showing impossible knowledge or context
       - Flag suspicious patterns or inconsistencies

    Output Format (JSON):
    {
      "score": <assigned score (float)>,
      "explanation": "<brief explanation focusing on understanding>",
      "flags": ["<only include for clear misconduct, not for wording similarities>"]
    }
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: generationConfig
    });
    
    const response = result.response;
    const resultText = response.text().trim();
    
    try {
      const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
      console.log('Parsed grading result successfully');
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", resultText);
      throw new Error("Failed to parse grading result from Gemini API");
    }
  } catch (error) {
    console.error('Error grading student answer:', error);
    throw new Error(`Failed to grade student answer: ${error.message}`);
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("Starting grade-answers function");
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pppteoxncuuraqjlrhir.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { answerScriptId, customInstructions, forceRegrade = false } = await req.json();
    
    if (!answerScriptId) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Processing grading for script ${answerScriptId}, forceRegrade: ${forceRegrade}`);
    
    // Get the examination details and subject for this script
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, examination:examinations(*), student:students(*)')
      .eq('id', answerScriptId)
      .maybeSingle();
    
    if (scriptError || !scriptData) {
      const errorMsg = `Failed to fetch answer script: ${scriptError?.message || 'No script found'}`;
      console.error(errorMsg);
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If the script is already graded and forceRegrade is false, return early
    if (scriptData.processing_status === 'grading_complete' && !forceRegrade) {
      console.log(`Script ${answerScriptId} is already graded and forceRegrade is false, skipping`);
      return new Response(
        JSON.stringify({ message: 'Script is already graded', alreadyGraded: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Update status to grading_pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_pending' })
      .eq('id', answerScriptId);
    
    // Get the subject name
    const subjectId = scriptData.examination?.subject_id;
    let subjectName = "Unknown Subject";
    
    if (subjectId) {
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', subjectId)
        .maybeSingle();
        
      if (subjectData) {
        subjectName = subjectData.name;
      }
    }
    
    // Get all answers for this script with their questions
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*, question:questions(*)')
      .eq('answer_script_id', answerScriptId);
    
    if (answersError) {
      const errorMsg = `Failed to fetch answers: ${answersError.message}`;
      console.error(errorMsg);
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!answers || answers.length === 0) {
      const errorMsg = 'No answers found for this script';
      console.error(errorMsg);
      
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Found ${answers.length} answers to grade`);
    
    // Process each answer
    const flags: string[] = [];
    const gradingPromises = answers.map(async (answer: any) => {
      if (!answer.question || !answer.extracted_text) {
        console.warn(`Skipping answer ${answer.id} - missing question or extracted text`);
        return null;
      }
      
      try {
        const gradeResult = await gradeStudentAnswer(
          subjectName,
          answer.question.question_text,
          answer.question.marks,
          answer.question.tolerance || 0.7,
          answer.question.model_answer,
          answer.extracted_text,
          customInstructions
        );
        
        console.log(`Graded answer ${answer.id} - score: ${gradeResult.score}/${answer.question.marks}`);
        
        // Save the grading result
        await supabase
          .from('answers')
          .update({
            assigned_grade: gradeResult.score,
            llm_explanation: gradeResult.explanation,
            flags: gradeResult.flags || []
          })
          .eq('id', answer.id);
          
        // Add flags to the master list if any
        if (gradeResult.flags && gradeResult.flags.length > 0) {
          flags.push(...gradeResult.flags);
        }
        
        return {
          answerId: answer.id,
          score: gradeResult.score,
          explanation: gradeResult.explanation,
          flags: gradeResult.flags || []
        };
      } catch (error) {
        console.error(`Error grading answer ${answer.id}:`, error);
        return {
          answerId: answer.id,
          error: error.message || 'Unknown error'
        };
      }
    });
    
    const results = await Promise.all(gradingPromises);
    
    // Update the script status to grading_complete and store any flags
    await supabase
      .from('answer_scripts')
      .update({ 
        processing_status: 'grading_complete',
        flags: flags.length > 0 ? flags : null 
      })
      .eq('id', answerScriptId);
    
    console.log(`Grading complete for script ${answerScriptId}`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Grading completed successfully',
        results: results.filter(Boolean)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in grade-answers function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
