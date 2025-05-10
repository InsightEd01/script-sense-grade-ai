import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question } from "@/types/supabase";
import { SegmentationResult } from "@/types/supabase";

const GEMINI_API_KEY = "AIzaSyDI-Dlnosnc5js38cj8d6O-y-Icl2EXzV0";
const MODEL_NAME = "gemini-1.5-flash";

// ML-based segmentation using Gemini
export async function mlSegmentation(extractedText: string, questions: Question[], hasIllustration: boolean = false): Promise<SegmentationResult> {
  try {
    console.log("Using ML segmentation with Gemini API");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    
    let diagramInstructions = '';
    if (hasIllustration) {
      diagramInstructions = 'Note that there is an illustration/diagram provided separately. When segmenting answers, be aware that some answers may refer to the diagram.';
    }
    
    // Page markers help maintain order across multiple uploaded scripts
    const pageMarkerPattern = /---\s*PAGE\s*(\d+)\s*---/gi;
    const hasPageMarkers = pageMarkerPattern.test(extractedText);
    
    const prompt = `
      Objective: Segment this extracted text into ${questions.length} separate answers.
      
      Extracted text from student exam (from OCR): "${extractedText}"
      
      The questions asked were:
      ${questions.map((q, i) => `${i+1}. ${q.question_text}`).join('\n')}
      
      ${diagramInstructions}
      
      ${hasPageMarkers ? 'This text contains page markers (--- PAGE X ---) as the text spans multiple pages/scripts. Maintain the correct order of content across page breaks.' : ''}
      
      Instructions:
      1. Identify where each answer starts and ends in the extracted text
      2. Return a JSON array with each segmented answer
      3. If a question appears to be unanswered, return an empty string for that answer
      4. Identify and flag any diagrams or mathematical notations in the answers
      
      Output format:
      {
        "segments": ["answer1", "answer2", ...],
        "containsDiagrams": [true/false, true/false, ...],
        "diagramDescriptions": ["description or empty string", "description or empty string", ...]
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
      
      // Ensure we have the expected format
      if (!parsed.segments) {
        parsed.segments = [];
      }
      
      // Fill any missing segments with empty strings
      while (parsed.segments.length < questions.length) {
        parsed.segments.push('');
      }
      
      // If diagram info is missing, initialize it
      if (!parsed.containsDiagrams) {
        parsed.containsDiagrams = Array(questions.length).fill(false);
      }
      
      if (!parsed.diagramDescriptions) {
        parsed.diagramDescriptions = Array(questions.length).fill('');
      }
      
      return {
        method: 'ml',
        segments: parsed.segments || [],
        confidence: 0.95,
        metadata: {
          containsDiagrams: parsed.containsDiagrams,
          diagramDescriptions: parsed.diagramDescriptions
        }
      };
    } catch (parseError) {
      console.error('Failed to parse ML segmentation result:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('ML segmentation failed:', error);
    // Fallback to enhanced segmentation if ML fails
    return enhancedSegmentation(extractedText, questions.length);
  }
}

// Enhanced segmentation with page break detection
export function enhancedSegmentation(extractedText: string, questionCount: number): SegmentationResult {
  console.log("Using enhanced segmentation with page break handling");
  
  // Look for page markers
  const pageMarkers = extractedText.match(/---\s*PAGE\s*\d+\s*---/gi);
  
  // If we have page markers, process differently
  if (pageMarkers && pageMarkers.length > 0) {
    return segmentMultiPageText(extractedText, questionCount);
  }
  
  // Otherwise, use standard paragraph-based segmentation
  const segments: string[] = [];
  
  // First try question number detection
  const questionMarkers = detectQuestionNumbers(extractedText);
  
  if (questionMarkers.length >= questionCount) {
    // We have enough question markers to segment properly
    for (let i = 0; i < questionCount; i++) {
      const startIdx = questionMarkers[i].index;
      const endIdx = i < questionMarkers.length - 1 ? questionMarkers[i + 1].index : extractedText.length;
      
      // Extract text between question markers, removing the marker itself
      const markerLength = questionMarkers[i][0].length;
      const segment = extractedText.substring(startIdx + markerLength, endIdx).trim();
      segments.push(segment);
    }
    
    return { method: 'question_markers', segments, confidence: 0.85 };
  }
  
  // Next try paragraph-based segmentation
  const paragraphs = extractedText.split(/\n\s*\n/);
  
  if (paragraphs.length >= questionCount) {
    // We have enough paragraphs to match questions
    for (let i = 0; i < questionCount; i++) {
      segments.push(paragraphs[i].trim());
    }
    return { method: 'paragraphs', segments, confidence: 0.7 };
  }
  
  // As a last resort, divide text evenly
  const avgLength = Math.floor(extractedText.length / questionCount);
  for (let i = 0; i < questionCount; i++) {
    const start = i * avgLength;
    const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
    segments.push(extractedText.substring(start, end).trim());
  }
  
  return { method: 'evenly', segments, confidence: 0.5 };
}

// Handle multi-page text properly
function segmentMultiPageText(extractedText: string, questionCount: number): SegmentationResult {
  // Split text by page markers
  const pages = extractedText.split(/---\s*PAGE\s*\d+\s*---/gi)
    .map(p => p.trim())
    .filter(p => p.length > 0);
  
  // If we have more pages than questions, we could assume one question per page
  if (pages.length >= questionCount) {
    return { 
      method: 'pages', 
      segments: pages.slice(0, questionCount),
      confidence: 0.8 
    };
  }
  
  // Otherwise, combine all pages and try regular segmentation on the combined text
  const combinedText = pages.join('\n\n');
  const paragraphs = combinedText.split(/\n\s*\n/);
  
  if (paragraphs.length >= questionCount) {
    // We have enough paragraphs to match questions
    const segments: string[] = [];
    for (let i = 0; i < questionCount; i++) {
      segments.push(paragraphs[i].trim());
    }
    return { method: 'combined_pages_paragraphs', segments, confidence: 0.6 };
  }
  
  // As a last resort, divide the combined text evenly
  const segments: string[] = [];
  const avgLength = Math.floor(combinedText.length / questionCount);
  for (let i = 0; i < questionCount; i++) {
    const start = i * avgLength;
    const end = (i + 1 === questionCount) ? combinedText.length : (i + 1) * avgLength;
    segments.push(combinedText.substring(start, end).trim());
  }
  
  return { method: 'combined_pages_evenly', segments, confidence: 0.4 };
}

// Helper function to detect question numbers
function detectQuestionNumbers(extractedText: string): Array<RegExpMatchArray> {
  const patterns = [
    /(?:^|\n)(?:question|q)[\s.:]*([\d]+)/gi,  // Matches "Question 1" or "Q1"
    /(?:^|\n)(\d+)[\s.:]*\)/gi,                // Matches "1)" format
    /(?:^|\n)(\d+)[\s.:]*(?=\w)/gi             // Matches numbers at start of paragraphs
  ];
  
  let matches: RegExpMatchArray[] = [];
  for (const pattern of patterns) {
    const patternMatches = Array.from(extractedText.matchAll(pattern));
    matches = [...matches, ...patternMatches];
  }
  
  // Sort by position in text
  return matches.sort((a, b) => (a.index || 0) - (b.index || 0));
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
