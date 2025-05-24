
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'master_admin';
  school_id?: string;
}

export interface Teacher {
  id: string;
  name: string;
  created_by_admin?: string; // Updated from admin_id to created_by_admin
  school_id?: string;
  user?: User;
  email?: string; // Added email field
  school_name?: string; // Added school_name field
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  unique_student_id: string;
  school_id: string;
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

// New interface for school admins
export interface SchoolAdmin {
  id: string;
  user_id: string;
  school_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_active: boolean;
  school_name?: string;
  role?: string;
}
