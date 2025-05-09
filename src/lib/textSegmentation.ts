
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question } from "@/types/supabase";
import { SegmentationResult } from "@/types/supabase";

const GEMINI_API_KEY = "AIzaSyDCq_tAdO5lqgsU5wlYtjhI0vpdk_jKr28";
const MODEL_NAME = "gemini-2.0-flash";

// ML-based segmentation using Gemini
export async function mlSegmentation(extractedText: string, questions: Question[]): Promise<SegmentationResult> {
  try {
    console.log("Using ML segmentation with Gemini API");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = `
      Objective: Segment this extracted text into ${questions.length} separate answers.
      
      Extracted text from student exam (from OCR): "${extractedText}"
      
      The questions asked were:
      ${questions.map((q, i) => `${i+1}. ${q.question_text}`).join('\n')}
      
      Instructions:
      1. Identify where each answer starts and ends in the extracted text
      2. Return a JSON array with each segmented answer
      3. If a question appears to be unanswered, return an empty string for that answer
      
      Output format:
      {
        "segments": ["answer1", "answer2", ...]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    });
    
    const response = result.response;
    const resultText = response.text().trim();
    
    try {
      // Extract JSON part from the response
      const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
      const parsed = JSON.parse(cleanedJson);
      
      return {
        method: 'ml',
        segments: parsed.segments || [],
        confidence: 0.95
      };
    } catch (parseError) {
      console.error('Failed to parse ML segmentation result:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('ML segmentation failed:', error);
    // Fallback to simple segmentation if ML fails
    return simpleSegmentation(extractedText, questions.length);
  }
}

// Simple fallback segmentation method - divides text evenly
export function simpleSegmentation(extractedText: string, questionCount: number): SegmentationResult {
  console.log("Using simple segmentation as fallback");
  const segments: string[] = [];
  
  // First try paragraph-based segmentation
  const paragraphs = extractedText.split(/\n\s*\n/);
  
  if (paragraphs.length >= questionCount) {
    // We have enough paragraphs to match questions
    for (let i = 0; i < questionCount; i++) {
      segments.push(paragraphs[i].trim());
    }
    return { method: 'paragraphs', segments, confidence: 0.7 };
  } else {
    // Divide text evenly
    const avgLength = Math.floor(extractedText.length / questionCount);
    for (let i = 0; i < questionCount; i++) {
      const start = i * avgLength;
      const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
      segments.push(extractedText.substring(start, end).trim());
    }
    return { method: 'evenly', segments, confidence: 0.5 };
  }
}
