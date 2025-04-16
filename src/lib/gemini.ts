
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = 'AIzaSyBBe5atwksC1l0hXhCudRs6oYIcu7ZdxhA';
const MODEL_NAME = 'gemini-2.0-flash'; // Using the correct model name

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const generationConfig = {
  temperature: 0.0,
  topP: 0.1,
  topK: 1,
  maxOutputTokens: 1024,
};

export async function generateModelAnswer(subject: string, question: string): Promise<string> {
  const prompt = `
    Objective: Generate a concise and accurate model answer for an academic question suitable for grading handwritten student responses.
    Subject: ${subject}
    Question: "${question}"
    Instructions: Produce a model answer that is clear, factually correct according to standard curriculum for this subject, and represents a high-quality response worth full marks. The answer should be easy for a teacher to review and potentially edit. Format the response as plain text.

    Model Answer:
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
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
  let customGradingInfo = '';
  if (customInstructions) {
    customGradingInfo = `Additional Grading Instructions: ${customInstructions}
    `;
  }

  const prompt = `
    Objective: Evaluate a student's handwritten answer against a model answer based on semantic meaning and assign a score.
    Subject: ${subject}
    Question: "${question}"
    Maximum Marks for this Question: ${maxMarks}
    Required Semantic Similarity Tolerance: ${tolerance} (A higher value means the student's answer must be closer in meaning to the model answer).
    Model Answer: "${modelAnswer}"
    Student's Answer (from OCR): "${studentAnswer}"
    ${customGradingInfo}
    Instructions:
    1. Analyze the semantic meaning and key concepts present in the "Student's Answer".
    2. Compare this meaning to the "Model Answer".
    3. Determine the degree of semantic alignment between the student's answer and the model answer.
    4. Assign a score from 0 to ${maxMarks} based on this alignment, considering the "Required Semantic Similarity Tolerance". A score of ${maxMarks} should be given if the alignment meets or exceeds the tolerance threshold. Award partial credit proportionately if key concepts are partially present or alignment is close but below the threshold.
    5. Provide a brief, one-sentence explanation for the assigned score, mentioning key alignments or deviations.
    6. Look for potential academic misconduct like cheating or plagiarism signs, and add any flags to an array.

    Output Format (JSON):
    {
      "score": <assigned score (float)>,
      "explanation": "<brief explanation (string)>",
      "flags": ["<potential issue or warning>"]
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const resultText = response.text().trim();
    
    try {
      // Parse the JSON from the response text
      const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
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
