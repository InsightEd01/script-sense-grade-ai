
import Tesseract from 'tesseract.js';

export async function performOCR(imageUrl: string): Promise<string> {
  try {
    const worker = await Tesseract.createWorker('eng');
    const result = await worker.recognize(imageUrl);
    await worker.terminate();
    return result.data.text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Failed to extract text from image');
  }
}

export function preprocessImage(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
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
      
      // Simple binarization for better OCR results
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const threshold = 128;
        const newColor = avg > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = newColor;
      }
      
      // Put processed image back to canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for preprocessing'));
    };
    
    img.src = imageData;
  });
}

export async function segmentAnswers(extractedText: string, questionCount: number): Promise<string[]> {
  // Basic segmentation: Try to identify question markers
  const segmentedAnswers: string[] = [];
  
  // Common patterns for question markers
  const patterns = [
    // Question number at beginning of line
    /(?:^|\n)\s*(?:q(?:uestion)?\s*(\d+)|(\d+)\s*[\)\.:])/gi,
    // Answer number at beginning of line
    /(?:^|\n)\s*(?:a(?:nswer)?\s*(\d+)|(\d+)\s*[\)\.:])/gi,
    // Look for paragraph breaks as potential answer boundaries
    /(?:^|\n\n|\r\n\r\n)/g
  ];
  
  let matches: RegExpExecArray | null = null;
  let lastIndex = 0;
  let currentQuestion = 0;
  
  // Try to find question/answer markers first
  for (const pattern of patterns) {
    const matches = Array.from(extractedText.matchAll(pattern));
    
    if (matches.length >= questionCount) {
      // We found enough markers to segment by
      for (let i = 0; i < questionCount; i++) {
        const start = matches[i].index || 0;
        const end = i < matches.length - 1 ? matches[i + 1].index : extractedText.length;
        if (end !== undefined && start !== undefined) {
          segmentedAnswers[i] = extractedText.substring(start, end).trim();
        }
      }
      break;
    }
  }
  
  // If we couldn't segment by markers, try dividing the text evenly
  if (segmentedAnswers.length < questionCount) {
    const avgLength = Math.floor(extractedText.length / questionCount);
    for (let i = 0; i < questionCount; i++) {
      const start = i * avgLength;
      const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
      segmentedAnswers[i] = extractedText.substring(start, end).trim();
    }
  }
  
  return segmentedAnswers;
}
