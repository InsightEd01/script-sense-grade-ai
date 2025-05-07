
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question } from '@/types/supabase';

const GEMINI_API_KEY = 'AIzaSyBBe5atwksC1l0hXhCudRs6oYIcu7ZdxhA';
const MODEL_NAME = 'gemini-2.0-flash';

/**
 * Use Gemini AI model to segment text based on question context
 * @param extractedText The OCR extracted text
 * @param questions Array of questions
 * @returns Object with segmentation method, segments and confidence level
 */
export async function mlSegmentation(extractedText: string, questions: Question[]) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    const prompt = `
      Objective: Segment this extracted text into ${questions.length} separate answers.
      
      Extracted text from student exam (from OCR): "${extractedText}"
      
      The questions asked were:
      ${questions.map((q, i) => `${i+1}. ${q.question_text}`).join('\n')}
      
      Instructions:
      1. Identify where each answer starts and ends
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
      
      // If parsing fails, use a basic fallback
      return fallbackSegmentation(extractedText, questions.length);
    }
  } catch (error) {
    console.error('ML segmentation failed:', error);
    // Fall back to basic segmentation
    return fallbackSegmentation(extractedText, questions.length);
  }
}

/**
 * Fallback simple segmentation dividing text evenly
 * @param extractedText The OCR extracted text
 * @param questionCount Number of questions
 * @returns Object with segmentation method, segments and confidence
 */
function fallbackSegmentation(extractedText: string, questionCount: number) {
  const segments: string[] = [];
  const avgLength = Math.floor(extractedText.length / questionCount);
  
  for (let i = 0; i < questionCount; i++) {
    const start = i * avgLength;
    const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
    segments.push(extractedText.substring(start, end).trim());
  }
  
  return {
    method: 'basic',
    segments,
    confidence: 0.5
  };
}

/**
 * Main segmentation function that uses ML approach with fallback
 * @param extractedText The OCR extracted text
 * @param questions Array of questions
 * @returns Promise with segmentation result
 */
export async function segmentAnswers(extractedText: string, questions: Question[]) {
  if (!extractedText || extractedText.trim() === '') {
    const emptySegments = Array(questions.length).fill('');
    return {
      method: 'basic',
      segments: emptySegments,
      confidence: 0.0
    };
  }
  
  try {
    return await mlSegmentation(extractedText, questions);
  } catch (error) {
    console.error('Segmentation failed:', error);
    return fallbackSegmentation(extractedText, questions.length);
  }
}
