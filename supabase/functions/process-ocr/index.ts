
// @ts-nocheck
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js"

const GEMINI_API_KEY = "AIzaSyDCq_tAdO5lqgsU5wlYtjhI0vpdk_jKr28";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to perform OCR using the Gemini API
async function extractTextWithGemini(imageUrl: string): Promise<string> {
  try {
    // Fetch the image data
    console.log(`Fetching image from URL: ${imageUrl}`);
    const imgResponse = await fetch(imageUrl);
    
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch image: ${imgResponse.statusText}`);
    }
    
    // Get the image as arrayBuffer and convert to base64
    const arrayBuffer = await imgResponse.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Validate image size
    if (bytes.length > 20000000) { // ~20MB limit check
      throw new Error('Image file size too large for Gemini API');
    }
    
    // Convert to base64 safely
    let base64Data = '';
    for (let i = 0; i < bytes.length; i++) {
      base64Data += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(base64Data);
    
    console.log(`Image converted to base64, length: ${base64Data.length}`);
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Extract all text from this image exactly as written. Do not correct spelling or grammar. Return only the extracted text without any additional commentary."
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1, // Low temperature for more deterministic output
        maxOutputTokens: 2048,
      }
    };

    console.log(`Sending request to Gemini API`);
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    console.log(`Received response from Gemini API`);
    const data = await response.json();
    
    // Extract the text from the response
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text extracted';
    console.log(`Extracted text length: ${extractedText.length}`);
    return extractedText;
  } catch (error) {
    console.error(`Error in Gemini text extraction: ${error.message}`);
    throw new Error(`Failed to extract text with Gemini: ${error.message}`);
  }
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    console.log("OCR function called with Gemini API")
    
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
    
    const { answerScriptId, imageUrl } = requestData;
    
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
      .maybeSingle()
    
    if (scriptError || !scriptData) {
      const errorMsg = `Failed to fetch answer script: ${scriptError?.message || 'No script found'}`
      console.error(errorMsg)
      
      // Update status to error
      await supabase
        .from('answer_scripts')
        .update({ processing_status: 'error' })
        .eq('id', answerScriptId)
        
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
      const errorMsg = `Failed to fetch questions: ${questionsError?.message || 'No questions found for this examination'}`
      console.error(errorMsg)
      
      // Update status to error
      await supabase
        .from('answer_scripts')
        .update({ processing_status: 'error' })
        .eq('id', answerScriptId)
        
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Perform OCR using Gemini API
    let extractedText;
    try {
      console.log(`Extracting text from image using Gemini API: ${imageUrl}`)
      extractedText = await extractTextWithGemini(imageUrl);
      console.log(`Text extraction successful, length: ${extractedText.length}`)
    } catch (ocrError) {
      console.error(`OCR processing failed: ${ocrError.message}`)
      
      // Update status to error
      await supabase
        .from('answer_scripts')
        .update({ processing_status: 'error' })
        .eq('id', answerScriptId)
        
      return new Response(
        JSON.stringify({ error: `OCR processing failed: ${ocrError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
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
    } catch (segmentError) {
      console.error(`Error segmenting text: ${segmentError.message}`);
      // If segmentation fails, use the whole text for each question
      segmentedAnswers = Array(questions.length).fill(extractedText);
    }
    
    // Set the script to OCR complete status
    await supabase
      .from('answer_scripts')
      .update({ 
        processing_status: 'ocr_complete'
      })
      .eq('id', answerScriptId)
    
    // Store the extracted text for each question
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionText = segmentedAnswers[i] || `No text extracted for question ${i+1}`;
      
      const { error: answerInsertError } = await supabase
        .from('answers')
        .upsert({
          answer_script_id: answerScriptId,
          question_id: question.id,
          extracted_text: questionText
        }, { onConflict: 'answer_script_id,question_id' });
      
      if (answerInsertError) {
        console.error(`Error inserting answer for question ${question.id}:`, answerInsertError);
      }
    }
    
    // Update script status to grading pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'grading_pending' })
      .eq('id', answerScriptId)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Answer script processed successfully with Gemini OCR',
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
        const requestData = await req.json();
        answerScriptId = requestData.answerScriptId;
      } catch (e) {
        // Request body was already consumed
        const url = new URL(req.url);
        answerScriptId = url.searchParams.get('answerScriptId');
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
