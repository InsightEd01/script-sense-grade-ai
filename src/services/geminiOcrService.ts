
import { OCRResult } from '@/types/supabase';

const GEMINI_API_KEY = "AIzaSyDCq_tAdO5lqgsU5wlYtjhI0vpdk_jKr28";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

export async function extractTextWithGemini(imageBase64: string): Promise<OCRResult> {
  try {
    // Clean the base64 data if it includes the data URL prefix
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1]
      : imageBase64;
    
    // Ensure we don't exceed maximum payload size
    if (base64Data.length > 20000000) { // ~20MB limit check
      throw new Error('Image file size too large for Gemini API');
    }
    
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

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract the text from the response
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No text extracted';
    
    return {
      text: extractedText,
      confidence: 0.95 // Default high confidence for Gemini
    };
  } catch (error) {
    console.error('Error in Gemini text extraction:', error);
    throw new Error(`Failed to extract text with Gemini: ${error.message}`);
  }
}
