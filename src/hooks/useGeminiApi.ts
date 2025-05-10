
import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GradingResult } from '@/types/supabase';

const GEMINI_API_KEY = 'AIzaSyDI-Dlnosnc5js38cj8d6O-y-Icl2EXzV0';
const MODEL_NAME = 'gemini-1.5-flash';

export function useGeminiApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const generateModelAnswer = useCallback(async (subject: string, question: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      const prompt = `
        Objective: Generate a concise and accurate model answer for an academic question suitable for grading handwritten student responses.
        Subject: ${subject}
        Question: "${question}"
        Instructions: Produce a model answer that is clear, factually correct according to standard curriculum for this subject, and represents a high-quality response worth full marks. The answer should be easy for a teacher to review and potentially edit. Format the response as plain text.

        Model Answer:
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text().trim();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const gradeStudentAnswer = useCallback(async (
    subject: string, 
    question: string, 
    maxMarks: number, 
    tolerance: number, 
    modelAnswer: string, 
    studentAnswer: string,
    customInstructions?: string,
    hasIllustration?: boolean,
    illustrationUrl?: string
  ): Promise<GradingResult> => {
    setIsLoading(true);
    setError(null);
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      let customGradingInfo = '';
      if (customInstructions) {
        customGradingInfo = `Additional Grading Instructions: ${customInstructions}
        `;
      }
      
      let illustrationInfo = '';
      if (hasIllustration && illustrationUrl) {
        illustrationInfo = `
        Note: The student has included a diagram/illustration in their answer. The illustration URL is: ${illustrationUrl}
        When grading, consider any references to diagrams or illustrations in the student's written answer.
        `;
      }
      
      const diagramInstructions = hasIllustration ? `
      6. If the student's answer refers to diagrams or illustrations, evaluate the relevance and accuracy of these references.
      7. Check if there are any mathematical notations or formulas that might be hard to capture as plain text.
      ` : '';
      
      const prompt = `
        Objective: Evaluate a student's handwritten answer against a model answer based on semantic meaning and assign a score.
        Subject: ${subject}
        Question: "${question}"
        Maximum Marks for this Question: ${maxMarks}
        Required Semantic Similarity Tolerance: ${tolerance} (A higher value means the student's answer must be closer in meaning to the model answer).
        Model Answer: "${modelAnswer}"
        Student's Answer (from OCR): "${studentAnswer}"
        ${customGradingInfo}
        ${illustrationInfo}
        
        Instructions:
        1. Analyze the semantic meaning and key concepts present in the "Student's Answer".
        2. Compare this meaning to the "Model Answer".
        3. Determine the degree of semantic alignment between the student's answer and the model answer.
        4. Assign a score from 0 to ${maxMarks} based on this alignment, considering the "Required Semantic Similarity Tolerance". A score of ${maxMarks} should be given if the alignment meets or exceeds the threshold. Award partial credit proportionately if key concepts are partially present or alignment is close but below the threshold.
        5. Provide a brief, one-sentence explanation for the assigned score, mentioning key alignments or deviations.
        ${diagramInstructions}
        8. Look for potential academic misconduct like cheating or plagiarism signs, and add any flags to an array.

        Output Format (JSON):
        {
          "score": <assigned score (float)>,
          "explanation": "<brief explanation (string)>",
          "flags": ["<potential issue or warning>"],
          "diagramEvaluation": "<evaluation of diagram references or null>"
        }
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const resultText = response.text().trim();
      
      try {
        // Parse the JSON from the response text
        // The API might return the JSON string with markdown backticks, so we need to clean it
        const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
        const parsed = JSON.parse(cleanedJson);
        
        // Ensure we have all properties defined
        return {
          score: parsed.score,
          explanation: parsed.explanation,
          flags: parsed.flags || [],
          diagramEvaluation: parsed.diagramEvaluation || null
        };
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", resultText);
        throw new Error("Failed to parse grading result from Gemini API");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const analyzeIllustration = useCallback(async (
    subject: string,
    question: string,
    illustrationUrl: string
  ): Promise<{ description: string; relevance: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      // Convert the URL to base64 if needed
      let imageContent;
      
      try {
        // Fetch the image and convert to base64
        const response = await fetch(illustrationUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        imageContent = {
          inlineData: {
            mimeType: "image/jpeg", // Assuming JPEG, adjust as needed
            data: base64Data
          }
        };
      } catch (imageError) {
        console.error('Failed to fetch image:', imageError);
        throw new Error(`Failed to analyze illustration: ${imageError}`);
      }
      
      const prompt = `
        Analyze this image which is a student's diagram or illustration for the following question:
        
        Subject: ${subject}
        Question: "${question}"
        
        Instructions:
        1. Describe what the diagram/illustration shows
        2. Evaluate how relevant the diagram is to the question
        3. Note any key concepts or elements shown in the diagram
        
        Output Format (JSON):
        {
          "description": "<detailed description of what the diagram shows>",
          "relevance": "<assessment of how relevant the diagram is to answering the question>",
          "keyElements": ["<list of important elements in the diagram>"]
        }
      `;
      
      const result = await model.generateContent([
        { text: prompt },
        imageContent
      ]);
      
      const response = result.response;
      const resultText = response.text().trim();
      
      try {
        const cleanedJson = resultText.replace(/^```json\n|\n```$/g, '');
        return JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error("Failed to parse image analysis result:", resultText);
        return {
          description: "Failed to analyze illustration",
          relevance: "Unknown"
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      return {
        description: "Error analyzing illustration: " + errorMessage,
        relevance: "Error"
      };
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    generateModelAnswer,
    gradeStudentAnswer,
    analyzeIllustration,
    isLoading,
    error
  };
}
