import { extractTextWithGemini } from '@/services/geminiOcrService';
import { OCRResult } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { segmentAnswers } from '@/utils/textSegmentation';

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  throw lastError;
}

export async function performOCR(imageUrl: string): Promise<OCRResult> {
  try {
    console.log('Starting OCR process with Gemini for image:', imageUrl);

    if (!validateImage(imageUrl)) {
      throw new Error('Invalid image URL provided for OCR');
    }

    // Check if the image is a large base64 string
    if (imageUrl.startsWith('data:') && imageUrl.length > 10000000) { // 10MB limit
      console.warn('Image exceeds recommended size limit, attempting to resize');
      imageUrl = await resizeImage(imageUrl);
    }

    // Use retryOperation for better reliability
    const ocrResult = await retryOperation(() => extractTextWithGemini(imageUrl));
    console.log('OCR completed successfully with result:', ocrResult.text.substring(0, 100) + '...');
    return ocrResult;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
}

// Process an answer script with OCR and update the database
export async function processAnswerScript(answerScriptId: string, imageUrl: string, autoGrade: boolean = false): Promise<void> {
  try {
    console.log(`Processing answer script ${answerScriptId} with OCR`);
    
    // Update status to OCR pending
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'ocr_pending' })
      .eq('id', answerScriptId);
      
    // Get script details to determine if it's part of a multi-script submission
    const { data: scriptData, error: scriptError } = await supabase
      .from('answer_scripts')
      .select('*, student:students(*), examination:examinations(*)')
      .eq('id', answerScriptId)
      .single();
      
    if (scriptError || !scriptData) {
      throw new Error(`Failed to retrieve script data: ${scriptError?.message || 'Script not found'}`);
    }
    
    // Perform OCR on the current script
    const ocrResult = await performOCR(imageUrl);
    const currentScriptText = ocrResult.text;
    
    // Find all scripts for this student and examination
    const { data: allScripts, error: scriptsError } = await supabase
      .from('answer_scripts')
      .select('id, script_number, full_extracted_text')
      .eq('student_id', scriptData.student_id)
      .eq('examination_id', scriptData.examination_id)
      .order('script_number');
      
    if (scriptsError) {
      console.error('Error retrieving all scripts:', scriptsError);
    }
    
    // Update the current script with the extracted text
    await supabase
      .from('answer_scripts')
      .update({ 
        full_extracted_text: currentScriptText,
        processing_status: 'ocr_complete' 
      })
      .eq('id', answerScriptId);
    
    console.log('Updated script with extracted text, checking for multiple scripts');
    
    // Determine if we need to combine texts from multiple scripts
    let combinedText = currentScriptText;
    const validScripts = allScripts?.filter(s => s.full_extracted_text) || [];
    
    if (validScripts.length > 1) {
      console.log(`Found ${validScripts.length} scripts for this student and examination, combining texts`);
      
      // Combine texts in order of script_number
      combinedText = validScripts
        .sort((a, b) => (a.script_number || 1) - (b.script_number || 1))
        .map(s => s.full_extracted_text)
        .filter(Boolean)
        .join('\n\n--- Next Script ---\n\n');
        
      // Update the first script with the combined text
      const firstScriptId = validScripts[0].id;
      await supabase
        .from('answer_scripts')
        .update({ combined_extracted_text: combinedText })
        .eq('id', firstScriptId);
        
      console.log(`Combined text from ${validScripts.length} scripts and saved to script ${firstScriptId}`);
    }
    
    // Get the questions for this examination
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('examination_id', scriptData.examination_id)
      .order('created_at');
      
    if (questionsError || !questions || questions.length === 0) {
      console.error('Failed to retrieve questions:', questionsError || 'No questions found');
      throw new Error('No questions found for this examination');
    }
    
    // Use the ML segmentation to divide the text into answers
    const textToSegment = combinedText || currentScriptText;
    const segmentationResult = await segmentAnswers(textToSegment, questions);
    const { segments, method, confidence } = segmentationResult;
    
    console.log(`Segmentation completed using ${method} with ${confidence} confidence`);
    
    // Store each segment as an answer
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const extractedText = segments[i] || `No text extracted for question ${i+1}`;
      
      // Check if answer already exists
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
            extracted_text: extractedText,
            segmentation_method: method,
            segmentation_confidence: confidence
          })
          .eq('id', existingAnswer.id);
      } else {
        // Insert new answer
        await supabase
          .from('answers')
          .insert({
            answer_script_id: answerScriptId,
            question_id: question.id,
            extracted_text: extractedText,
            segmentation_method: method,
            segmentation_confidence: confidence,
            is_overridden: false
          });
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
          console.log(`Auto-grading complete for script ${answerScriptId}`);
        }
      } catch (gradingErr) {
        console.error(`Exception during auto-grading: ${gradingErr.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error in processAnswerScript:', error);
    
    // Update status to error
    await supabase
      .from('answer_scripts')
      .update({ processing_status: 'error' })
      .eq('id', answerScriptId);
      
    throw error;
  }
}

function validateImage(imageUrl: string): boolean {
  if (!imageUrl) return false;
  if (imageUrl.length < 10) return false;
  if (!(imageUrl.startsWith('data:image/') || 
        imageUrl.startsWith('blob:') || 
        imageUrl.startsWith('http'))) {
    return false;
  }
  return true;
}

// Image preprocessing for better OCR results
export async function handleImagePreprocessing(imageData: string, options = { contrast: 1.5, threshold: 140 }): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    const processImage = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply image enhancements for better OCR
        for (let i = 0; i < data.length; i += 4) {
          const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const adjusted = options.contrast * (avg - 128) + 128;
          data[i] = data[i + 1] = data[i + 2] = adjusted;
        }

        // Apply threshold for cleaner text
        for (let i = 0; i < data.length; i += 4) {
          const val = data[i] > options.threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = val;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    };

    img.onload = processImage;
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

// New function to resize large images
async function resizeImage(imageData: string, maxWidth = 1200, maxHeight = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Reduced quality for base64 to minimize data size
        const resizedData = canvas.toDataURL('image/jpeg', 0.7);
        console.log(`Image resized from ${img.width}x${img.height} to ${width}x${height}`);
        resolve(resizedData);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for resizing'));
    img.src = imageData;
  });
}

export async function segmentAnswers(extractedText: string, questionCount: number): Promise<string[]> {
  console.log('Segmenting answers from text, question count:', questionCount);
  
  if (!extractedText || extractedText.trim() === '') {
    console.warn('Empty text provided for segmentation');
    return Array(questionCount).fill('No text extracted');
  }
  
  console.log('Sample of extracted text:', extractedText.substring(0, 100) + '...');
  
  // Basic segmentation: Try to identify question markers
  const segmentedAnswers: string[] = [];
  
  // Common patterns for question markers (enhanced)
  const patterns = [
    // Question number at beginning of line (more comprehensive)
    /(?:^|\n)\s*(?:q(?:uestion)?\s*(\d+)|(\d+)[\.\):]|\b(?:answer|ans)[\s\.]*(?:to question)?[\s\.]*(\d+))/gi,
    
    // Answer number at beginning of line
    /(?:^|\n)\s*(?:a(?:nswer)?\s*(\d+)|(\d+)\s*[\)\.:])/gi,
    
    // Look for paragraph breaks as potential answer boundaries
    /(?:^|\n\n|\r\n\r\n)/g
  ];
  
  // Try to find question/answer markers first
  let markerFound = false;
  for (const pattern of patterns) {
    const matches = Array.from(extractedText.matchAll(pattern));
    console.log(`Found ${matches.length} matches with pattern:`, pattern);
    
    if (matches.length >= questionCount) {
      // We found enough markers to segment by
      markerFound = true;
      console.log('Using markers for segmentation');
      
      for (let i = 0; i < questionCount; i++) {
        const start = matches[i].index || 0;
        const end = i < matches.length - 1 ? matches[i + 1].index : extractedText.length;
        if (end !== undefined && start !== undefined) {
          segmentedAnswers[i] = extractedText.substring(start, end).trim();
          console.log(`Answer ${i+1} length: ${segmentedAnswers[i].length} chars`);
        }
      }
      break;
    }
  }
  
  // If we couldn't segment by markers, try a more sophisticated approach
  if (!markerFound) {
    console.log('No reliable markers found, using alternative segmentation');
    
    // Try using paragraph breaks if available
    const paragraphs = extractedText.split(/\n\s*\n/);
    if (paragraphs.length >= questionCount) {
      console.log('Using paragraph breaks for segmentation');
      for (let i = 0; i < questionCount; i++) {
        segmentedAnswers[i] = paragraphs[i].trim();
        console.log(`Answer ${i+1} length: ${segmentedAnswers[i].length} chars`);
      }
    } else {
      // Last resort: dividing the text evenly
      console.log('Using equal division for segmentation');
      const avgLength = Math.floor(extractedText.length / questionCount);
      for (let i = 0; i < questionCount; i++) {
        const start = i * avgLength;
        const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
        segmentedAnswers[i] = extractedText.substring(start, end).trim();
        console.log(`Answer ${i+1} length: ${segmentedAnswers[i].length} chars`);
      }
    }
  }
  
  // Ensure we have exactly the right number of answers
  while (segmentedAnswers.length < questionCount) {
    segmentedAnswers.push('No text extracted for this question');
  }
  
  return segmentedAnswers.slice(0, questionCount);
}
