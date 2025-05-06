import { OCRResult } from '@/types/supabase';
import fetch from 'node-fetch'; // Ensure this is installed and imported

const GEMINI_API_KEY = "AIzaSyDCq_tAdO5lqgsU5wlYtjhI0vpdk_jKr28";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

export async function extractTextWithGemini(imageBase64OrUrl: string): Promise<OCRResult> {
  try {
    let base64Data;

    if (imageBase64OrUrl.startsWith('http')) {
      // If the input is a URL, fetch the image and convert it to Base64
      const response = await fetch(imageBase64OrUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      base64Data = Buffer.from(buffer).toString('base64');
    } else {
      // Clean the base64 data if it includes the data URL prefix
      base64Data = imageBase64OrUrl.includes('base64,') 
        ? imageBase64OrUrl.split('base64,')[1]
        : imageBase64OrUrl;
    }

    // Ensure we don't exceed maximum payload size
    if (base64Data.length > 10000000) { // 10MB limit
      throw new Error('Image file size too large for Gemini API');
    }

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
        temperature: 0.1, // Low temperature for more deterministic output
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
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error?.message || 'Unknown error'}`;
      } catch (e) {
        // If we can't parse JSON, use text
        const errorText = await response.text();
        errorMessage += ` - ${errorText.substring(0, 100)}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Extract the text from the response
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
