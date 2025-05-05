
import { extractTextWithGemini } from '@/services/geminiOcrService';
import { OCRResult } from '@/types/supabase';

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
    if (imageUrl.startsWith('data:') && imageUrl.length > 10000000) { // Reduced from 20MB to 10MB
      console.warn('Image exceeds recommended size limit, attempting to resize');
      imageUrl = await resizeImage(imageUrl);
    }

    // Use retryOperation for better reliability
    return await retryOperation(() => extractTextWithGemini(imageUrl));
  } catch (error) {
    console.error('OCR processing failed:', error);
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
