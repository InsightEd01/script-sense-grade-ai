import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = 'AIzaSyBBe5atwksC1l0hXhCudRs6oYIcu7ZdxhA';
const MODEL_NAME = 'gemini-2.0-flash'; // Using the correct model name

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
    Objective: Grade a handwritten exam answer using structured criteria while allowing for natural variations in expression.
    Subject: ${subject}
    Question: "${question}"
    Maximum Marks: ${maxMarks}
    Model Answer Key Concepts:
    ${modelAnswer}

    Student's Answer (from OCR): 
    ${studentAnswer}
    ${customGradingInfo}
    
    Grading Context: This is a handwritten exam response processed through OCR. Expect and allow for:
    - Different ways of expressing the same concept
    - Informal language that demonstrates understanding
    - Minor spelling/grammar variations
    - OCR transcription imperfections
    
    Scoring Criteria (Total: ${maxMarks} marks):
    1. Core Concept Coverage (${(maxMarks * 0.6).toFixed(1)} marks):
       - Identify the main concepts from the model answer
       - Award marks for each core concept that is clearly demonstrated, even if expressed differently
       - Partial marks for partially demonstrated concepts
       
    2. Understanding & Application (${(maxMarks * 0.4).toFixed(1)} marks):
       - Logical flow and connection between concepts
       - Appropriate use of subject terminology
       - Application of concepts to answer the specific question
       
    Tolerance Factor (${tolerance}):
    - Use this as a minimum threshold for accepting alternative explanations
    - Higher tolerance (e.g. 0.8-1.0) means accept broader range of expressions
    - Lower tolerance (e.g. 0.1-0.3) requires closer alignment to key terms
    
    Instructions:
    1. First identify which core concepts from the model answer are present in the student's response
    2. For each concept, assess if it's fully, partially, or not demonstrated
    3. Evaluate the overall understanding shown
    4. Calculate component scores and sum for final score
    5. Provide a brief explanation listing key concepts found/missing
    6. Only flag for misconduct if there's clear evidence of external copying or completely off-topic response

    Required Output Format (JSON):
    {
      "score": <total_score as float>,
      "explanation": "<brief explanation listing key concepts found/missing>",
      "flags": ["<only for clear misconduct, not wording similarities>"]
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
