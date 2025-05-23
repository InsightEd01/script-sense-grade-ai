
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'master_admin';
  school_id?: string;
}

export interface Teacher {
  id: string;
  name: string;
  admin_id?: string;
  school_id?: string;
  user?: User;
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  unique_student_id: string;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  max_teachers?: number;
  max_students?: number;
  primary_color?: string;
  secondary_color?: string;
  created_by?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  teacher_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Examination {
  id: string;
  subject_id: string;
  name: string;
  total_marks: number;
  created_at: string;
}

export interface Question {
  id: string;
  examination_id: string;
  question_text: string;
  model_answer: string;
  model_answer_source: 'uploaded' | 'ai_generated';
  marks: number;
  tolerance: number;
  created_at: string;
}

export interface AnswerScript {
  id: string;
  student_id: string;
  examination_id: string;
  script_image_url: string;
  upload_timestamp: string;
  processing_status: 'uploaded' | 'ocr_pending' | 'ocr_complete' | 'grading_pending' | 'grading_complete' | 'error';
  student?: Student;
  script_number?: number;
  full_extracted_text?: string;
  combined_extracted_text?: string;
  custom_instructions?: string;
  enable_misconduct_detection?: boolean;
  flags?: string[];
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
  question?: Question;
  flags?: string[];
  segmentation_confidence?: number;
  segmentation_method?: string;
  spatial_location?: any;
}

export interface GradingResult {
  score: number;
  explanation: string;
  flags?: string[];
}
