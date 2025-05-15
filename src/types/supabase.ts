export interface Teacher {
  id: string;
  name: string;
  email?: string;
  created_at?: string;
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  unique_student_id: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface Examination {
  id: string;
  subject_id: string;
  name: string;
  total_marks: number;
  created_at?: string;
}

export interface Question {
  id: string;
  examination_id: string;
  question_text: string;
  model_answer: string;
  model_answer_source: 'uploaded' | 'ai_generated';
  marks: number;
  tolerance: number;
  created_at?: string;
}

export interface AnswerScript {
  id: string;
  student_id: string;
  examination_id: string;
  script_image_url: string;
  additional_image_urls: string[];
  processing_status: 'uploaded' | 'ocr_pending' | 'ocr_complete' | 'grading_complete' | 'error';
  upload_timestamp: string;
  custom_instructions?: string;
  enable_misconduct_detection: boolean;
  full_extracted_text?: string;
  script_number?: number;
  page_count: number;
  page_order: number[];
  student?: Student;
  examination?: Examination;
}

export interface Answer {
  id: string;
  answer_script_id: string;
  question_id: string;
  extracted_text?: string;
  assigned_grade?: number;
  llm_explanation?: string;
  is_overridden: boolean;
  manual_grade?: number;
  override_justification?: string;
  flags?: string[];
  question?: Question;
  segmentation_confidence?: number;
  segmentation_method?: string;
  spatial_location?: any;
}

export interface GradingResult {
  score: number;
  explanation: string;
  flags?: string[];
}

export interface OCRResult {
  text: string;
  confidence?: number;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher';
}

export interface SegmentationResult {
  method: string;
  segments: string[];
  confidence: number;
}
