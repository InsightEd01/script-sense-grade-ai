
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
    console.log("OCR function called")
    
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
    
    if (!questions || questions.length === 0) {
      console.error('No questions found for this examination')
      throw new Error('No questions found for this examination')
    }
    
    // Set the script to OCR complete status
    await supabase
      .from('answer_scripts')
      .update({ 
        processing_status: 'ocr_complete'
      })
      .eq('id', answerScriptId)
    
    // Create placeholder answers for each question
    const sampleTexts = [
      "The three branches of government are the Executive, Legislative, and Judicial branches. The Executive branch is headed by the President and carries out laws. The Legislative branch makes laws and includes Congress. The Judicial branch evaluates laws and is led by the Supreme Court.",
      "Photosynthesis is the process by which plants convert light energy into chemical energy. The equation is 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. This process takes place in the chloroplasts of plant cells and is essential for producing oxygen.",
      "The water cycle consists of evaporation, condensation, precipitation, and collection. Water evaporates from surfaces, forms clouds through condensation, falls as precipitation, and collects in bodies of water to restart the cycle.",
      "Chemical reactions involve breaking bonds in reactants and forming new bonds to create products. The law of conservation of mass states that mass is neither created nor destroyed in a chemical reaction."
    ];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      // Choose a sample text based on question index, cycling through available ones
      const sampleText = sampleTexts[i % sampleTexts.length];
      // Add question-specific context
      const placeholderText = `${sampleText} This answer addresses question ${i+1} about ${question.question_text.substring(0, 30)}...`;
      
      const { error: answerInsertError } = await supabase.from('answers').upsert({
        answer_script_id: answerScriptId,
        question_id: question.id,
        extracted_text: placeholderText
      }, { onConflict: 'answer_script_id,question_id' });
      
      if (answerInsertError) {
        console.error(`Error inserting answer for question ${question.id}:`, answerInsertError);
        throw new Error(`Error inserting answer: ${answerInsertError.message}`);
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
        message: 'Answer script processed successfully',
        note: 'OCR placeholder responses created.',
        extractedText: sampleTexts.join('\n\n---\n\n')
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
