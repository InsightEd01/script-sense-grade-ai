export interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  unique_student_id: string;
  teacher_id: string;
  created_at: string;
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
}

export interface AnswerScript {
  id: string;
  examination_id: string;
  student_id: string;
  script_url: string;
  status: 'pending' | 'graded' | 'failed';
  created_at: string;
  identification_method: 'manual' | 'qr';
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
}

export interface GradingResult {
  score: number;
  explanation: string;
}
