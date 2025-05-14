import { extractTextWithGemini } from '@/services/geminiOcrService';
import { OCRResult, Question, SegmentationResult } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { mlSegmentation, simpleSegmentation } from './textSegmentation';

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function performOCR(imageUrl: string): Promise<OCRResult> {
  try {
    console.log('Starting OCR process with Gemini for image:', imageUrl);

    if (!imageUrl || !(imageUrl.startsWith('http') || imageUrl.startsWith('data:'))) {
      throw new Error('Invalid image URL provided for OCR');
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
    
    // Call the process-ocr edge function with the extracted text
    console.log('Calling process-ocr function with extracted text');
    const { data, error } = await supabase.functions.invoke('process-ocr', {
      body: { 
        answerScriptId,
        extractedText: combinedText || currentScriptText,
        autoGrade,
        isMultiScript: validScripts.length > 1
      }
    });
    
    if (error) {
      console.error('Error calling process-ocr function:', error);
      throw new Error(`Failed to process OCR result: ${error.message}`);
    }
    
    console.log('Successfully processed answer script:', data);
    return data;
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

// New function that relies on our ML segmentation
export async function segmentAnswers(extractedText: string, questions: Question[]): Promise<SegmentationResult> {
  console.log('Segmenting answers using ML approach, question count:', questions.length);
  
  if (!extractedText || extractedText.trim() === '') {
    console.warn('Empty text provided for segmentation');
    return simpleSegmentation('', questions.length);
  }
  
  try {
    // Use ML-based segmentation as primary method
    return await mlSegmentation(extractedText, questions);
  } catch (error) {
    console.error('Error in ML segmentation, falling back to simple method:', error);
    // Fallback to simple segmentation
    return simpleSegmentation(extractedText, questions.length);
  }
}
