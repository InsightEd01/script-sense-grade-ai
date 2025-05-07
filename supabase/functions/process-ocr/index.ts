
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

// Import segmentation functions directly in edge function since we can't import from project
function detectQuestionNumbers(extractedText) {
  const patterns = [
    /(?:^|\n)(?:question|q)[\s.:]*([\d]+)/gi,  // Matches "Question 1" or "Q1"
    /(?:^|\n)(\d+)[\s.:]*\)/gi,                // Matches "1)" format
    /(?:^|\n)(\d+)[\s.:]*(?=\w)/gi             // Matches numbers at start of paragraphs
  ];
  
  let matches = [];
  for (const pattern of patterns) {
    const patternMatches = Array.from(extractedText.matchAll(pattern));
    matches = [...matches, ...patternMatches];
  }
  
  // Sort by position in text
  return matches.sort((a, b) => (a.index || 0) - (b.index || 0));
}

function segmentByMarkers(extractedText, markers, questionCount) {
  const segments = [];
  
  // Use markers to segment text
  for (let i = 0; i < Math.min(markers.length, questionCount); i++) {
    const currentMarker = markers[i];
    const nextMarker = markers[i + 1];
    
    const startPos = currentMarker.index + currentMarker[0].length;
    const endPos = nextMarker ? nextMarker.index : extractedText.length;
    
    segments.push(extractedText.substring(startPos, endPos).trim());
  }
  
  // If we don't have enough segments, add empty ones
  while (segments.length < questionCount) {
    segments.push('');
  }
  
  return segments;
}

function segmentByParagraphs(extractedText, questionCount) {
  const paragraphs = extractedText.split(/\n\s*\n/);
  
  if (paragraphs.length >= questionCount) {
    // We have enough paragraphs, use the first questionCount paragraphs
    return paragraphs.slice(0, questionCount);
  } else {
    // Not enough paragraphs, try to combine or split them
    return segmentEvenly(extractedText, questionCount);
  }
}

function segmentByWhitespace(extractedText, questionCount) {
  // Look for patterns of multiple newlines or large whitespace gaps
  const segments = extractedText.split(/\n{3,}|\s{5,}/);
  
  if (segments.length >= questionCount) {
    return segments.slice(0, questionCount);
  } else {
    return segmentEvenly(extractedText, questionCount);
  }
}

function segmentEvenly(extractedText, questionCount) {
  const avgLength = Math.floor(extractedText.length / questionCount);
  const segments = [];
  
  for (let i = 0; i < questionCount; i++) {
    const start = i * avgLength;
    const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
    segments.push(extractedText.substring(start, end).trim());
  }
  
  return segments;
}

function improvedSegmentation(extractedText, questions) {
  // Try to detect question numbers/markers
  const questionMarkers = detectQuestionNumbers(extractedText);
  const questionCount = questions.length;
  
  if (questionMarkers.length >= questionCount) {
    // Use detected question markers to segment
    return {
      method: 'markers',
      segments: segmentByMarkers(extractedText, questionMarkers, questionCount),
      confidence: 0.9
    };
  } else {
    const strategies = [
      {
        method: 'paragraphs',
        segments: segmentByParagraphs(extractedText, questionCount),
        confidence: 0.7
      },
      {
        method: 'whitespace',
        segments: segmentByWhitespace(extractedText, questionCount),
        confidence: 0.6
      },
      {
        method: 'evenly',
        segments: segmentEvenly(extractedText, questionCount),
        confidence: 0.5
      }
    ];
    
    // Simple implementation - prefer paragraph-based segmentation
    return strategies[0];
  }
}

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
    // Fall back to non-ML methods
    return improvedSegmentation(extractedText, questions);
  }
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
    
    const { answerScriptId, imageUrl, autoGrade = false, isMultiScript = false } = requestData;
    
    if (!answerScriptId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'answerScriptId and imageUrl are required' }),
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
    }
    
    // If this is part of a multi-script submission, handle it differently
    if (isMultiScript) {
      console.log(`Processing as part of a multi-script submission`);
      
      // Handle multi-script logic here...
      // For now we'll just continue with normal processing
    }
    
    // Perform OCR to extract text from the image
    // In this edge function, we assume OCR has already been performed
    // and we're just receiving the extracted text directly or via image URL
    
    // For demo purposes, we'll just use a mock extracted text
    // In a real scenario, you'd call your OCR service here
    let extractedText;
    
    // Check if we have existing extracted text
    const { data: existingText } = await supabase
      .from('answer_scripts')
      .select('full_extracted_text')
      .eq('id', answerScriptId)
      .maybeSingle();
    
    if (existingText && existingText.full_extracted_text) {
      extractedText = existingText.full_extracted_text;
      console.log('Using existing extracted text');
    } else {
      // In a real scenario, you'd call your OCR service here
      // For now, we'll just use a placeholder
      extractedText = `This is placeholder extracted text. In a real scenario, this would be obtained via OCR.
        
      Question 1 answer would be here.
        
      Question 2 answer would appear here.`;
      
      console.log('Using placeholder extracted text - in production, call your OCR service');
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
      // Use our new advanced segmentation approach
      let segmentedAnswers;
      let segmentationMethod = 'basic';
      let segmentationConfidence = 0.5;
      let segmentationResult;
      
      try {
        // Try to use ML segmentation
        segmentationResult = await mlSegmentation(extractedText, questions);
        segmentedAnswers = segmentationResult.segments;
        segmentationMethod = segmentationResult.method;
        segmentationConfidence = segmentationResult.confidence;
        console.log(`Used ${segmentationMethod} segmentation with ${segmentationConfidence} confidence`);
      } catch (segmentError) {
        console.error(`Error in ML segmentation: ${segmentError.message}`);
        
        // Fall back to improved segmentation
        segmentationResult = improvedSegmentation(extractedText, questions);
        segmentedAnswers = segmentationResult.segments;
        segmentationMethod = segmentationResult.method;
        segmentationConfidence = segmentationResult.confidence;
        console.log(`Fallback to ${segmentationMethod} segmentation with ${segmentationConfidence} confidence`);
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
              .update({ 
                extracted_text: questionText,
                segmentation_method: segmentationMethod,
                segmentation_confidence: segmentationConfidence
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
                segmentation_method: segmentationMethod,
                segmentation_confidence: segmentationConfidence,
                is_overridden: false
              });
          }
        } catch (answerError) {
          console.error(`Error saving answer for question ${question.id}:`, answerError);
        }
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
        extractedText: extractedText,
        segmentationMethod,
        segmentationConfidence
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
