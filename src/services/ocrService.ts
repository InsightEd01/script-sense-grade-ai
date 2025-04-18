
import Tesseract from 'tesseract.js';

interface OCRMetrics {
  attempts: number;
  errors: number;
  processingTimes: number[];
}

let metrics: OCRMetrics = {
  attempts: 0,
  errors: 0,
  processingTimes: []
};

export async function preprocessImage(imageData: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and adjust contrast
      for (let i = 0; i < data.length; i += 4) {
        const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        data[i] = brightness;     // Red
        data[i + 1] = brightness; // Green
        data[i + 2] = brightness; // Blue
      }
      
      // Apply threshold for better text detection
      for (let i = 0; i < data.length; i += 4) {
        const threshold = 128;
        const value = data[i] > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = value;
      }
      
      // Put processed data back on canvas
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to data URL
      resolve(canvas.toDataURL('image/png'));
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

export async function performEnhancedOCR(imageUrl: string): Promise<{ text: string; confidence: number }> {
  console.log('Starting enhanced OCR process for image:', imageUrl);
  const startTime = performance.now();
  metrics.attempts++;
  
  try {
    // Create worker with optimized settings
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => console.log(`Tesseract [${m.status}]: ${Math.floor(m.progress * 100)}%`)
    });
    
    // Configure for better handwriting recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?()[]{}+-=/*@#$%&\'";: ', // Allow common characters
      tessedit_ocr_engine_mode: 1, // LSTM_ONLY mode
      tessedit_pageseg_mode: 6,  // Fixed: Using numeric value instead of string
      tessjs_create_pdf: '0',      // Disable PDF output for faster processing
      tessjs_create_hocr: '0',     // Disable HOCR output
      preserve_interword_spaces: '1',
    });
    
    // Try different preprocessing settings for best results
    const preprocessOptions = [
      { contrast: 1.5, threshold: 140 },
      { contrast: 2.0, threshold: 160 },
      { contrast: 1.0, threshold: 120 }
    ];
    
    let bestResult = null;
    let highestConfidence = -1;
    
    for (const options of preprocessOptions) {
      try {
        // Preprocess image with current settings
        const processedImageUrl = await preprocessImage(imageUrl);
        
        // Perform OCR
        const result = await worker.recognize(processedImageUrl);
        
        if (result.data.confidence > highestConfidence) {
          bestResult = result;
          highestConfidence = result.data.confidence;
        }
        
        // If we got a good enough result, stop trying
        if (result.data.confidence > 70) {
          break;
        }
      } catch (error) {
        console.warn('Processing attempt failed:', error);
        continue;
      }
    }
    
    await worker.terminate();
    
    if (!bestResult) {
      throw new Error('Failed to achieve acceptable OCR confidence');
    }
    
    // Record metrics
    const endTime = performance.now();
    metrics.processingTimes.push(endTime - startTime);
    
    return {
      text: bestResult.data.text,
      confidence: bestResult.data.confidence
    };
  } catch (error) {
    console.error('Enhanced OCR failed:', error);
    metrics.errors++;
    throw error;
  }
}

export function getOCRMetrics(): OCRMetrics & { averageProcessingTime: number } {
  // Return a new object with the added computed property
  const average = metrics.processingTimes.length > 0 
    ? metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length
    : 0;
    
  return {
    ...metrics,
    averageProcessingTime: average
  };
}

// Reset metrics (useful for testing)
export function resetOCRMetrics(): void {
  metrics = {
    attempts: 0,
    errors: 0,
    processingTimes: []
  };
}
