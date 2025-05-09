
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = 'AIzaSyDI-Dlnosnc5js38cj8d6O-y-Icl2EXzV0';
const MODEL_NAME = 'gemma-3-27b-it';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.0, // Zero temperature for consistent, deterministic results
  topP: 0.1,
  topK: 1,
  maxOutputTokens: 1024,
};

export async function generateModelAnswer(subject: string, question: string): Promise<string> {
  console.log(`Generating model answer for subject "${subject}", question: "${question.substring(0, 50)}..."`);
  
  const prompt = `
    Objective: Generate a concise and accurate model answer for an academic question suitable for grading handwritten student responses.
    Subject: ${subject}
    Question: "${question}"
    Instructions: Produce a model answer that is clear, factually correct according to standard curriculum for this subject, and represents a high-quality response worth full marks. The answer should be easy for a teacher to review and potentially edit. Format the response as plain text.

    Model Answer:
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig
    });
    
    const response = result.response;
    const answer = response.text().trim();
    console.log(`Generated model answer (${answer.length} chars)`);
    return answer;
  } catch (error) {
    console.error('Error generating model answer:', error);
    throw new Error(`Failed to generate model answer: ${error.message}`);
  }
}

export async function gradeStudentAnswer(
  subject: string, 
  question: string, 
  maxMarks: number, 
  tolerance: number, 
  modelAnswer: string, 
  studentAnswer: string,
  customInstructions?: string
): Promise<{ score: number; explanation: string; flags?: string[] }> {
  console.log(`Grading answer for subject "${subject}", max marks: ${maxMarks}, tolerance: ${tolerance}`);
  console.log(`Student answer length: ${studentAnswer.length} chars`);
  
  let customGradingInfo = '';
  if (customInstructions) {
    customGradingInfo = `Additional Grading Instructions: ${customInstructions}
    `;
  }

  const prompt = `
    Objective: Evaluate a student's handwritten answer against a model answer, focusing on understanding and core concepts rather than exact wording.
    Subject: ${subject}
    Question: "${question}"
    Maximum Marks for this Question: ${maxMarks}
    Required Semantic Similarity Tolerance: ${tolerance} (Used as a general guide for conceptual alignment rather than strict matching)
    Model Answer: "${modelAnswer}"
    Student's Answer (from OCR): "${studentAnswer}"
    ${customGradingInfo}
    
    Grading Context: This is a handwritten exam response that has been processed through OCR. Expect and allow for:
    - Natural variations in wording and expression
    - Minor spelling or grammar issues
    - Different ways of explaining the same concept
    - Informal language while conveying correct understanding
    
    Instructions:
    1. Focus on the core concepts and overall understanding demonstrated in the student's answer.
    2. Look for evidence that the student grasps the fundamental ideas, even if expressed differently from the model answer.
    3. Consider partial credit for partially correct understanding.
    4. Assign a score from 0 to ${maxMarks}. Award full marks if the core concepts are present and understanding is demonstrated, even if the wording differs significantly.
    5. Provide a brief explanation focusing on the demonstrated understanding and any missing key concepts.
    6. Only flag for misconduct if there is clear evidence of exact copying from unseen sources (not just similarity to the model answer) or completely off-topic responses.

    Output Format (JSON):
    {
      "score": <assigned score (float)>,
      "explanation": "<brief explanation focusing on understanding>",
      "flags": ["<only include for clear misconduct, not for wording similarities>"]
    }
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { ...generationConfig, temperature: 0.0 }
    });
    
    const response = result.response;
    const resultText = response.text().trim();
    
    try {
      const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
      console.log('Parsed grading result successfully');
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", resultText);
      throw new Error("Failed to parse grading result from Gemini API");
    }
  } catch (error) {
    console.error('Error grading student answer:', error);
    throw new Error(`Failed to grade student answer: ${error.message}`);
  }
}
