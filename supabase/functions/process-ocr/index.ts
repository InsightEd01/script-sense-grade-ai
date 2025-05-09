
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_API_KEY = 'AIzaSyBBe5atwksC1l0hXhCudRs6oYIcu7ZdxhA';
const MODEL_NAME = 'gemini-2.0-flash';

// Use ML-based segmentation with Gemini
async function mlSegmentation(extractedText, questions) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = `
      Objective: Segment this extracted text into ${questions.length} separate answers.
      
      Extracted text from student exam (from OCR): "${extractedText}"
      
      The questions asked were:
      ${questions.map((q, i) => `${i+1}. ${q.question_text}`).join('\n')}
      
      Instructions:
      1. Identify where each answer starts and ends
      2. Return a JSON array with each segmented answer
      3. If a question appears to be unanswered, return an empty string for that answer
      
      Output format:
      {
        "segments": ["answer1", "answer2", ...]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    });
    
    const response = result.response;
    const resultText = response.text().trim();
    
    try {
      // Extract JSON part from the response
      const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
      const parsed = JSON.parse(cleanedJson);
      
      return {
        method: 'ml',
        segments: parsed.segments || [],
        confidence: 0.95
      };
    } catch (parseError) {
      console.error('Failed to parse ML segmentation result:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('ML segmentation failed:', error);
    // Fall back to simple segmentation
    return simpleSegmentation(extractedText, questions.length);
  }
}

// Simple fallback segmentation method - divides text evenly
function simpleSegmentation(extractedText, questionCount) {
  console.log("Using simple segmentation as fallback");
  const segments = [];
  
  // Divide text evenly
  const avgLength = Math.floor(extractedText.length / questionCount);
  for (let i = 0; i < questionCount; i++) {
    const start = i * avgLength;
    const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
    segments.push(extractedText.substring(start, end).trim());
  }
  
  return {
    method: 'evenly',
    segments: segments,
    confidence: 0.5
  };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log("OCR function called to process extracted text")
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://pppteoxncuuraqjlrhir.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { answerScriptId, extractedText, autoGrade = false, isMultiScript = false } = requestData;
    
    if (!answerScriptId) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Processing script ${answerScriptId}, autoGrade: ${autoGrade}, isMultiScript: ${isMultiScript}`)
    
    // Get the examination details for this script
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, examination:examinations(*), student:students(*)')
      .eq('id', answerScriptId)
      .maybeSingle()
    
    if (scriptError || !scriptData) {
      const errorMsg = `Failed to fetch answer script: ${scriptError?.message || 'No script found'}`
      console.error(errorMsg)
      
      try {
        // Update status to error
        await supabase
          .from('answer_scripts')
          .update({ processing_status: 'error' })
          .eq('id', answerScriptId)
      } catch (updateError) {
        console.error(`Error updating script status to error: ${updateError.message}`);
      }
        
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get all questions for this examination
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('examination_id', scriptData.examination_id)
      .order('created_at')
    
    if (questionsError || !questions || questions.length === 0) {
      const warningMsg = `No questions found for this examination: ${scriptData.examination_id}`;
      console.warn(warningMsg);
      
      // Update to error status
      await supabase
        .from('answer_scripts')
        .update({ processing_status: 'error' })
        .eq('id', answerScriptId);
      
      return new Response(
        JSON.stringify({ error: warningMsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if we have extracted text
    if (!extractedText) {
      // Check if we have existing extracted text
      const { data: existingText } = await supabase
        .from('answer_scripts')
        .select('full_extracted_text')
        .eq('id', answerScriptId)
        .maybeSingle();
        
      if (existingText?.full_extracted_text) {
        extractedText = existingText.full_extracted_text;
      } else {
        const errorMsg = 'No extracted text provided and none found in database';
        console.error(errorMsg);
        
        await supabase
          .from('answer_scripts')
          .update({ processing_status: 'error' })
          .eq('id', answerScriptId);
        
        return new Response(
          JSON.stringify({ error: errorMsg }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Store full extracted text in the answer_script if not already done
    await supabase
      .from('answer_scripts')
      .update({ 
        full_extracted_text: extractedText,
        processing_status: 'ocr_complete'
      })
      .eq('id', answerScriptId);
      
    console.log(`Stored full extracted text for script ${answerScriptId}`);
    
    // Use ML segmentation to divide text into answers
    let segmentationResult;
    
    try {
      segmentationResult = await mlSegmentation(extractedText, questions);
      console.log(`Used ${segmentationResult.method} segmentation with ${segmentationResult.confidence} confidence`);
    } catch (segmentError) {
      console.error(`Error in ML segmentation: ${segmentError.message}`);
      // Fall back to simple segmentation
      segmentationResult = simpleSegmentation(extractedText, questions.length);
      console.log(`Fallback to ${segmentationResult.method} segmentation with ${segmentationResult.confidence} confidence`);
    }
    
    // Store the extracted text for each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionText = i < segmentationResult.segments.length ? 
        segmentationResult.segments[i] : 
        `No text extracted for question ${i+1}`;
      
      try {
        // Check if answer already exists and create or update accordingly
        const { data: existingAnswer } = await supabase
          .from('answers')
          .select('id')
          .eq('answer_script_id', answerScriptId)
          .eq('question_id', question.id)
          .maybeSingle();
          
        if (existingAnswer) {
          // Update existing answer
          await supabase
            .from('answers')
            .update({ 
              extracted_text: questionText,
              segmentation_method: segmentationResult.method,
              segmentation_confidence: segmentationResult.confidence
            })
            .eq('id', existingAnswer.id);
        } else {
          // Insert new answer
          await supabase
            .from('answers')
            .insert({
              answer_script_id: answerScriptId,
              question_id: question.id,
              extracted_text: questionText,
              segmentation_method: segmentationResult.method,
              segmentation_confidence: segmentationResult.confidence,
              is_overridden: false
            });
        }
      } catch (answerError) {
        console.error(`Error saving answer for question ${question.id}:`, answerError);
      }
    }
    
    // Update script status to grading pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_pending' })
      .eq('id', answerScriptId);
      
    console.log(`Updated script ${answerScriptId} status to grading_pending`);
    
    // If autoGrade is true, trigger grading
    if (autoGrade) {
      try {
        console.log(`Auto-triggering grading for script ${answerScriptId}`);
        const { data: gradingData, error: gradingError } = await supabase.functions.invoke('grade-answers', {
          body: { answerScriptId: answerScriptId }
        });
        
        if (gradingError) {
          console.error(`Error auto-grading: ${gradingError.message}`);
        } else {
          console.log(`Auto-grading complete for script ${answerScriptId}: ${JSON.stringify(gradingData)}`);
        }
      } catch (gradingErr) {
        console.error(`Exception during auto-grading: ${gradingErr.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Answer script processed successfully',
        segmentationMethod: segmentationResult.method,
        segmentationConfidence: segmentationResult.confidence
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing OCR:', error)
    
    // If we have an answerScriptId, update its status to error
    try {
      let answerScriptId = null;
      try {
        const requestData = await req.clone().json();
        answerScriptId = requestData.answerScriptId;
      } catch (e) {
        // Request body was already consumed or invalid
        console.error('Could not get answerScriptId from request:', e);
      }
      
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
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
