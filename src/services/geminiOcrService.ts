import { OCRResult } from '@/types/supabase';

const GEMINI_API_KEY = "AIzaSyB1kwBAyXJHDJI9QDScFsDNOpIPaFitDBY";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

interface GeminiApiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiApiError {
  error?: {
    message?: string;
  };
}

async function getBase64FromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
}

export async function extractTextWithGemini(imageBase64OrUrl: string): Promise<OCRResult> {
  try {
    console.log('Starting text extraction with Gemini');
    
    // Get base64 data whether input is URL or base64
    let base64Data = imageBase64OrUrl.startsWith('http') 
      ? await getBase64FromUrl(imageBase64OrUrl)
      : imageBase64OrUrl.includes('base64,')
        ? imageBase64OrUrl.split('base64,')[1]
        : imageBase64OrUrl;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: "Extract all text from this image exactly as written. Preserve formatting, including paragraph breaks. Do not correct spelling or grammar. Return only the extracted text without any additional commentary."
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
        temperature: 0.1,
        maxOutputTokens: 2048,
      }
    };

    console.log('Sending request to Gemini API for OCR');
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorMessage = `Gemini API error: Status ${response.status}`;
      try {
        const errorData: GeminiApiError = await response.json();
        errorMessage += ` - ${errorData.error?.message || 'Unknown error'}`;
      } catch (e) {
        const errorText = await response.text();
        errorMessage += ` - ${errorText.substring(0, 100)}`;
      }
      throw new Error(errorMessage);
    }

    const data: GeminiApiResponse = await response.json();

    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text extracted';
    console.log('OCR successful, extracted text length:', extractedText.length);

    return {
      text: extractedText,
      confidence: 0.95 // Default high confidence for Gemini
    };
  } catch (error) {
    console.error('Error in Gemini text extraction:', error);
    throw new Error(`Failed to extract text with Gemini: ${error.message}`);
  }
}
