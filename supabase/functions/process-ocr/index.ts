
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

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
    
    if (!answerScriptId || !extractedText) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId and extractedText are required' }),
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
    
    if (questionsError) {
      console.error(`Error fetching questions: ${questionsError.message}`);
    }
    
    if (!questions || questions.length === 0) {
      const warningMsg = `No questions found for this examination: ${scriptData.examination_id}`;
      console.warn(warningMsg);
      
      // We'll continue but won't be able to segment properly
      // This is a recoverable condition, not a fatal error
    }
    
    // If this is part of a multi-script submission, handle it differently
    if (isMultiScript) {
      console.log(`Processing as part of a multi-script submission`);
      
      // Find the script with the lowest script_number (usually 1) to store the combined text
      const { data: firstScript } = await supabase
        .from('answer_scripts')
        .select('id, script_number')
        .eq('student_id', scriptData.student_id)
        .eq('examination_id', scriptData.examination_id)
        .order('script_number')
        .limit(1)
        .single();
        
      if (firstScript && firstScript.id !== answerScriptId) {
        console.log(`This is not the first script. First script ID is ${firstScript.id}`);
        // Store full extracted text in the current script only
        await supabase
          .from('answer_scripts')
          .update({ 
            full_extracted_text: extractedText,
            processing_status: 'ocr_complete'
          })
          .eq('id', answerScriptId);
          
        console.log(`Updated script ${answerScriptId} with extracted text`);
        
        // We'll continue the processing on the first script where we store the combined text
        const { data: combinedScriptData } = await supabase
          .from('answer_scripts')
          .select('combined_extracted_text')
          .eq('id', firstScript.id)
          .single();
          
        if (combinedScriptData?.combined_extracted_text) {
          console.log(`Using combined text from first script for further processing`);
          // Continue processing using the combined text from the first script
        }
      }
    }
    
    // Store full extracted text in the answer_script if not already done
    try {
      await supabase
        .from('answer_scripts')
        .update({ 
          full_extracted_text: extractedText,
          processing_status: 'ocr_complete'
        })
        .eq('id', answerScriptId)
        
      console.log(`Stored full extracted text for script ${answerScriptId}`)
    } catch (updateError) {
      console.error(`Error storing full extracted text: ${updateError.message}`);
      // Continue despite error
    }
    
    if (questions && questions.length > 0) {
      // Segment the extracted text for each question
      let segmentedAnswers;
      try {
        // Simple segmentation logic - divide text evenly if needed
        if (questions.length > 1) {
          const paragraphs = extractedText.split(/\n\s*\n/);
          
          if (paragraphs.length >= questions.length) {
            // Use paragraphs for segmentation
            segmentedAnswers = paragraphs.slice(0, questions.length);
          } else {
            // Divide text evenly
            const avgLength = Math.floor(extractedText.length / questions.length);
            segmentedAnswers = Array(questions.length).fill('').map((_, i) => {
              const start = i * avgLength;
              const end = (i + 1 === questions.length) ? extractedText.length : (i + 1) * avgLength;
              return extractedText.substring(start, end).trim();
            });
          }
        } else {
          // Only one question, use all text
          segmentedAnswers = [extractedText];
        }
        
        // Store the extracted text for each question
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const questionText = segmentedAnswers[i] || `No text extracted for question ${i+1}`;
          
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
                .update({ extracted_text: questionText })
                .eq('id', existingAnswer.id);
            } else {
              // Insert new answer
              await supabase
                .from('answers')
                .insert({
                  answer_script_id: answerScriptId,
                  question_id: question.id,
                  extracted_text: questionText
                });
            }
          } catch (answerError) {
            console.error(`Error saving answer for question ${question.id}:`, answerError);
          }
        }
      } catch (segmentError) {
        console.error(`Error segmenting text: ${segmentError.message}`);
        // If segmentation fails, we'll still continue processing
      }
    }
    
    // Update script status to grading pending
    try {
      await supabase
        .from('answer_scripts')
        .update({ processing_status: 'grading_pending' })
        .eq('id', answerScriptId)
        
      console.log(`Updated script ${answerScriptId} status to grading_pending`)
    } catch (updateError) {
      console.error(`Error updating script status to grading_pending: ${updateError.message}`);
      // Continue despite error
    }
    
    // If autoGrade is true, trigger grading
    if (autoGrade && questions && questions.length > 0) {
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
        extractedText: extractedText
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
