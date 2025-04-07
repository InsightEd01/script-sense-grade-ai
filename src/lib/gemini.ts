
const GEMINI_API_KEY = "AIzaSyBBguG3m3mglvQzUXALiTccH73gpRFM1c8";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

export async function generateModelAnswer(subject: string, question: string): Promise<string> {
  const prompt = `
    Objective: Generate a concise and accurate model answer for an academic question suitable for grading handwritten student responses.
    Subject: ${subject}
    Question: "${question}"
    Instructions: Produce a model answer that is clear, factually correct according to standard curriculum for this subject, and represents a high-quality response worth full marks. The answer should be easy for a teacher to review and potentially edit. Format the response as plain text.

    Model Answer:
  `;

  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.0,
        topP: 0.1,
        topK: 16,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json() as GeminiResponse;
  return data.candidates[0].content.parts[0].text.trim();
}

export async function gradeStudentAnswer(
  subject: string, 
  question: string, 
  maxMarks: number, 
  tolerance: number, 
  modelAnswer: string, 
  studentAnswer: string
): Promise<{ score: number; explanation: string }> {
  const prompt = `
    Objective: Evaluate a student's handwritten answer against a model answer based on semantic meaning and assign a score.
    Subject: ${subject}
    Question: "${question}"
    Maximum Marks for this Question: ${maxMarks}
    Required Semantic Similarity Tolerance: ${tolerance} (A higher value means the student's answer must be closer in meaning to the model answer).
    Model Answer: "${modelAnswer}"
    Student's Answer (from OCR): "${studentAnswer}"

    Instructions:
    1. Analyze the semantic meaning and key concepts present in the "Student's Answer".
    2. Compare this meaning to the "Model Answer".
    3. Determine the degree of semantic alignment between the student's answer and the model answer.
    4. Assign a score from 0 to ${maxMarks} based on this alignment, considering the "Required Semantic Similarity Tolerance". A score of ${maxMarks} should be given if the alignment meets or exceeds the tolerance threshold. Award partial credit proportionately if key concepts are partially present or alignment is close but below the threshold.
    5. Provide a brief, one-sentence explanation for the assigned score, mentioning key alignments or deviations.

    Output Format (JSON):
    {
      "score": <assigned score (float)>,
      "explanation": "<brief explanation (string)>"
    }
  `;

  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.0,
        topP: 0.1,
        topK: 16,
        maxOutputTokens: 1024,
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json() as GeminiResponse;
  const resultText = data.candidates[0].content.parts[0].text.trim();
  
  try {
    // Parse the JSON from the response text
    // The API might return the JSON string with markdown backticks, so we need to clean it
    const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("Failed to parse Gemini response as JSON:", resultText);
    throw new Error("Failed to parse grading result from Gemini API");
  }
}
