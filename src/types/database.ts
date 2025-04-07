
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'teacher';
        };
        Insert: {
          id: string;
          email: string;
          role: 'admin' | 'teacher';
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'teacher';
        };
      };
      teachers: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      students: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          unique_student_id: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          name: string;
          unique_student_id: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          name?: string;
          unique_student_id?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          description?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          name: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          name?: string;
          description?: string;
          created_at?: string;
        };
      };
      examinations: {
        Row: {
          id: string;
          subject_id: string;
          name: string;
          total_marks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          name: string;
          total_marks: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          name?: string;
          total_marks?: number;
          created_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          examination_id: string;
          question_text: string;
          model_answer: string;
          model_answer_source: 'uploaded' | 'ai_generated';
          marks: number;
          tolerance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          examination_id: string;
          question_text: string;
          model_answer: string;
          model_answer_source: 'uploaded' | 'ai_generated';
          marks: number;
          tolerance: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          examination_id?: string;
          question_text?: string;
          model_answer?: string;
          model_answer_source?: 'uploaded' | 'ai_generated';
          marks?: number;
          tolerance?: number;
          created_at?: string;
        };
      };
      answer_scripts: {
        Row: {
          id: string;
          student_id: string;
          examination_id: string;
          script_image_url: string;
          upload_timestamp: string;
          processing_status: 'uploaded' | 'ocr_pending' | 'ocr_complete' | 'grading_pending' | 'grading_complete' | 'error';
        };
        Insert: {
          id?: string;
          student_id: string;
          examination_id: string;
          script_image_url: string;
          upload_timestamp?: string;
          processing_status: 'uploaded' | 'ocr_pending' | 'ocr_complete' | 'grading_pending' | 'grading_complete' | 'error';
        };
        Update: {
          id?: string;
          student_id?: string;
          examination_id?: string;
          script_image_url?: string;
          upload_timestamp?: string;
          processing_status?: 'uploaded' | 'ocr_pending' | 'ocr_complete' | 'grading_pending' | 'grading_complete' | 'error';
        };
      };
      answers: {
        Row: {
          id: string;
          answer_script_id: string;
          question_id: string;
          extracted_text?: string;
          assigned_grade?: number;
          llm_explanation?: string;
          is_overridden: boolean;
          manual_grade?: number;
          override_justification?: string;
        };
        Insert: {
          id?: string;
          answer_script_id: string;
          question_id: string;
          extracted_text?: string;
          assigned_grade?: number;
          llm_explanation?: string;
          is_overridden?: boolean;
          manual_grade?: number;
          override_justification?: string;
        };
        Update: {
          id?: string;
          answer_script_id?: string;
          question_id?: string;
          extracted_text?: string;
          assigned_grade?: number;
          llm_explanation?: string;
          is_overridden?: boolean;
          manual_grade?: number;
          override_justification?: string;
        };
      };
    };
    Functions: {
      [key: string]: unknown;
    };
    Enums: {
      app_role: 'admin' | 'teacher';
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string;
          name: string;
          owner: string | null;
          created_at: string | null;
          updated_at: string | null;
          public: boolean | null;
        };
        Insert: {
          id: string;
          name: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          public?: boolean | null;
        };
        Update: {
          id?: string;
          name?: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          public?: boolean | null;
        };
      };
      objects: {
        Row: {
          id: string;
          bucket_id: string;
          name: string;
          owner: string | null;
          created_at: string | null;
          updated_at: string | null;
          last_accessed_at: string | null;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          bucket_id: string;
          name: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_accessed_at?: string | null;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          bucket_id?: string;
          name?: string;
          owner?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          last_accessed_at?: string | null;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Functions: {
      [key: string]: unknown;
    };
    Enums: {
      [key: string]: unknown;
    };
  };
}
