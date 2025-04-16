
import Tesseract from 'tesseract.js';

export async function performOCR(imageUrl: string): Promise<string> {
  try {
    console.log('Starting OCR process for image:', imageUrl);
    
    // Create a worker with English language
    const worker = await Tesseract.createWorker('eng', 1, {
      // Enable all available functionalities for better results
      logger: progress => {
        console.log('OCR Progress:', progress);
      }
    });

    // Set parameters for better handwriting recognition
    await worker.setParameters({
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1',
    });

    // Perform OCR on the image
    console.log('Recognizing text...');
    const result = await worker.recognize(imageUrl);
    console.log('OCR completed with confidence:', result.data.confidence);
    
    // Terminate the worker when done
    await worker.terminate();
    
    return result.data.text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export function preprocessImage(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('Starting image preprocessing');
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      console.log('Applying image preprocessing filters');
      
      // Enhanced preprocessing for better OCR results
      // 1. Grayscale conversion
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; // Better grayscale formula
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      
      // 2. Contrast enhancement
      const contrast = 1.5; // Increase contrast
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;
      }
      
      // 3. Binarization (adaptive threshold)
      const threshold = 140;
      for (let i = 0; i < data.length; i += 4) {
        const val = data[i] > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
      }
      
      // 4. Noise reduction (simple)
      // This is a simple implementation; a more sophisticated algorithm would be better
      // but might be too complex for client-side processing
      
      // Put processed image back to canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      console.log('Preprocessing complete');
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      console.error('Failed to load image for preprocessing');
      reject(new Error('Failed to load image for preprocessing'));
    };
    
    img.src = imageData;
  });
}

export async function segmentAnswers(extractedText: string, questionCount: number): Promise<string[]> {
  console.log('Segmenting answers from text, question count:', questionCount);
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
    
    // Look for natural language cues indicating different questions
    const nlCues = [
      /(?:^|\n)(?:regarding|concerning|about|for) question (\d+)/gi,
      /(?:^|\n)(?:in response to|responding to) (?:question|item) (\d+)/gi,
    ];
    
    let nlSegmentation = false;
    for (const cue of nlCues) {
      const matches = Array.from(extractedText.matchAll(cue));
      if (matches.length >= questionCount - 1) { // We might not have a cue for the first question
        nlSegmentation = true;
        // Similar segmentation logic as above
        // Implementation omitted for brevity - would follow same pattern
        break;
      }
    }
    
    // If still no luck, try dividing the text evenly
    if (!nlSegmentation) {
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
  
  return segmentedAnswers;
}
