import { GoogleGenerativeAI } from "@google/generative-ai";
import { Question } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';

const GEMINI_API_KEY = 'AIzaSyBBe5atwksC1l0hXhCudRs6oYIcu7ZdxhA';
const MODEL_NAME = 'gemini-2.0-flash';

/**
 * Detects question numbers in extracted text using multiple regex patterns
 * @param extractedText The OCR extracted text
 * @returns Array of matches with their positions in the text
 */
export function detectQuestionNumbers(extractedText: string): Array<RegExpMatchArray> {
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

/**
 * Segments text by detected markers
 * @param extractedText The OCR extracted text
 * @param markers Array of marker positions
 * @param questionCount Number of expected questions
 * @returns Array of segmented text portions
 */
export function segmentByMarkers(
  extractedText: string,
  markers: RegExpMatchArray[],
  questionCount: number
): string[] {
  const segments: string[] = [];
  
  // Use markers to segment text
  for (let i = 0; i < Math.min(markers.length, questionCount); i++) {
    const currentMarker = markers[i];
    const nextMarker = markers[i + 1];
    
    const startPos = currentMarker.index! + currentMarker[0].length;
    const endPos = nextMarker ? nextMarker.index! : extractedText.length;
    
    segments.push(extractedText.substring(startPos, endPos).trim());
  }
  
  // If we don't have enough segments, add empty ones
  while (segments.length < questionCount) {
    segments.push('');
  }
  
  return segments;
}

/**
 * Segments text by paragraphs
 * @param extractedText The OCR extracted text
 * @param questionCount Number of expected questions
 * @returns Array of segmented text portions
 */
export function segmentByParagraphs(extractedText: string, questionCount: number): string[] {
  const paragraphs = extractedText.split(/\n\s*\n/);
  
  if (paragraphs.length >= questionCount) {
    // We have enough paragraphs, use the first questionCount paragraphs
    return paragraphs.slice(0, questionCount);
  } else {
    // Not enough paragraphs, try to combine or split them
    return segmentEvenly(extractedText, questionCount);
  }
}

/**
 * Segments text by whitespace patterns
 * @param extractedText The OCR extracted text
 * @param questionCount Number of expected questions
 * @returns Array of segmented text portions
 */
export function segmentByWhitespace(extractedText: string, questionCount: number): string[] {
  // Look for patterns of multiple newlines or large whitespace gaps
  const segments = extractedText.split(/\n{3,}|\s{5,}/);
  
  if (segments.length >= questionCount) {
    return segments.slice(0, questionCount);
  } else {
    return segmentEvenly(extractedText, questionCount);
  }
}

/**
 * Segments text evenly based on character count
 * @param extractedText The OCR extracted text
 * @param questionCount Number of expected questions
 * @returns Array of segmented text portions
 */
export function segmentEvenly(extractedText: string, questionCount: number): string[] {
  const avgLength = Math.floor(extractedText.length / questionCount);
  const segments: string[] = [];
  
  for (let i = 0; i < questionCount; i++) {
    const start = i * avgLength;
    const end = (i + 1 === questionCount) ? extractedText.length : (i + 1) * avgLength;
    segments.push(extractedText.substring(start, end).trim());
  }
  
  return segments;
}

/**
 * Apply multiple segmentation strategies and select the best result
 * @param extractedText The OCR extracted text
 * @param questions Array of questions
 * @returns Array of segmented text portions
 */
export function multiStrategySegmentation(extractedText: string, questions: Question[]): string[] {
  const questionCount = questions.length;
  
  // Try multiple strategies
  const strategiesResults = [
    {
      method: 'paragraphs',
      segments: segmentByParagraphs(extractedText, questionCount)
    },
    {
      method: 'whitespace',
      segments: segmentByWhitespace(extractedText, questionCount)
    },
    {
      method: 'evenly',
      segments: segmentEvenly(extractedText, questionCount)
    }
  ];
  
  // Select best segmentation based on heuristics
  // Simple implementation - prefer paragraph-based segmentation if available
  const bestStrategy = strategiesResults.find(s => s.method === 'paragraphs') 
    || strategiesResults.find(s => s.method === 'whitespace')
    || strategiesResults[2]; // evenly as fallback
    
  return bestStrategy.segments;
}

/**
 * Improved segmentation that tries multiple strategies
 * @param extractedText The OCR extracted text
 * @param questions Array of questions
 * @returns Object with segmentation method and text segments
 */
export function improvedSegmentation(extractedText: string, questions: Question[]) {
  // Try to detect question numbers/markers
  const questionMarkers = detectQuestionNumbers(extractedText);
  
  if (questionMarkers.length >= questions.length) {
    // Use detected question markers to segment
    return {
      method: 'markers',
      segments: segmentByMarkers(extractedText, questionMarkers, questions.length),
      confidence: 0.9
    };
  } else {
    // Fall back to more advanced heuristics
    return {
      method: 'heuristic',
      segments: multiStrategySegmentation(extractedText, questions),
      confidence: 0.7
    };
  }
}

/**
 * Use Gemini AI model to segment text based on question context
 * @param extractedText The OCR extracted text
 * @param questions Array of questions
 * @returns Array of segmented text portions
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
      throw parseError;
    }
  } catch (error) {
    console.error('ML segmentation failed:', error);
    // Fall back to non-ML methods
    return improvedSegmentation(extractedText, questions);
  }
}

/**
 * Process multiple scripts and segment answers across them
 * @param scripts Array of answer scripts
 * @param questions Array of questions
 * @returns Array of segmented text portions
 */
export function processMultipleScripts(scripts: any[], questions: Question[]) {
  // Sort scripts by script number
  scripts.sort((a, b) => (a.script_number || 1) - (b.script_number || 1));
  
  // Combine text from all scripts
  const allExtractedText = scripts
    .map(s => s.full_extracted_text || '')
    .filter(text => text.length > 0)
    .join('\n\n--- PAGE BREAK ---\n\n');
  
  // Detect page transitions
  const pageTransitions = Array.from(allExtractedText.matchAll(/--- PAGE BREAK ---/g))
    .map(match => match.index);
  
  // For simple implementation, fall back to regular segmentation
  // A more advanced implementation would handle cross-page answers
  return improvedSegmentation(allExtractedText, questions);
}

/**
 * Hybrid segmentation approach that tries multiple methods
 * @param extractedText The OCR extracted text
 * @param questions Array of questions
 * @param teacherId Optional teacher ID for feedback-based improvements
 * @returns Promise resolving to object with method, segments and confidence
 */
export async function hybridSegmentation(
  extractedText: string, 
  questions: Question[],
  teacherId?: string
) {
  const results = [];
  
  // Try ML segmentation first
  try {
    const mlResult = await mlSegmentation(extractedText, questions);
    results.push(mlResult);
    
    // If ML confidence is high, just use it
    if (mlResult.confidence > 0.9) {
      return mlResult;
    }
  } catch (e) {
    console.error('ML segmentation failed in hybrid approach:', e);
  }
  
  // Try teacher feedback-based segmentation if we have a teacher ID
  if (teacherId) {
    try {
      const teacherResult = await segmentWithTeacherFeedback(extractedText, questions, teacherId);
      results.push(teacherResult);
    } catch (e) {
      console.error('Teacher feedback segmentation failed:', e);
    }
  }
  
  // Always add the improved heuristic method as fallback
  const heuristicResult = improvedSegmentation(extractedText, questions);
  results.push(heuristicResult);
  
  // Select best result based on confidence
  results.sort((a, b) => b.confidence - a.confidence);
  return results[0];
}

/**
 * Use teacher's previous corrections to improve segmentation
 * @param extractedText The OCR extracted text
 * @param questions Array of questions
 * @param teacherId Teacher ID for fetching personalized corrections
 * @returns Object with segmentation method, segments, and confidence
 */
export async function segmentWithTeacherFeedback(
  extractedText: string, 
  questions: Question[], 
  teacherId: string
) {
  try {
    // Get previous manual corrections for this teacher
    const { data: priorCorrections, error } = await supabase
      .from('segmentation_corrections')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (!priorCorrections || priorCorrections.length === 0) {
      // No prior corrections, fall back to default segmentation
      return improvedSegmentation(extractedText, questions);
    }
    
    // Very basic analysis - if teacher has made corrections, prefer paragraph-based
    // segmentation if they've corrected more paragraph-based segmentations
    const methodCounts = priorCorrections.reduce((acc: Record<string, number>, curr: any) => {
      const method = curr.segmentation_method || 'unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    
    // Find preferred method (most corrected = most used by teacher)
    let preferredMethod = 'heuristic';
    let maxCount = 0;
    
    for (const [method, count] of Object.entries(methodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        preferredMethod = method;
      }
    }
    
    // Apply preferred segmentation approach based on teacher history
    switch (preferredMethod) {
      case 'markers':
        const markers = detectQuestionNumbers(extractedText);
        if (markers.length >= questions.length) {
          return {
            method: 'markers',
            segments: segmentByMarkers(extractedText, markers, questions.length),
            confidence: 0.85
          };
        }
        break;
      case 'paragraphs':
        return {
          method: 'paragraphs',
          segments: segmentByParagraphs(extractedText, questions.length),
          confidence: 0.8
        };
      case 'whitespace':
        return {
          method: 'whitespace',
          segments: segmentByWhitespace(extractedText, questions.length),
          confidence: 0.75
        };
    }
    
    // Default to improved segmentation if no strong preference found
    return improvedSegmentation(extractedText, questions);
    
  } catch (error) {
    console.error('Error in teacher feedback segmentation:', error);
    return improvedSegmentation(extractedText, questions);
  }
}
