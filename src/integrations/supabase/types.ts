export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      answer_scripts: {
        Row: {
          additional_image_urls: string[] | null
          combined_extracted_text: string | null
          custom_instructions: string | null
          enable_misconduct_detection: boolean | null
          examination_id: string
          flags: string[] | null
          full_extracted_text: string | null
          id: string
          page_count: number | null
          page_order: number[] | null
          processing_status: string
          script_image_url: string
          script_number: number | null
          student_id: string
          upload_timestamp: string
        }
        Insert: {
          additional_image_urls?: string[] | null
          combined_extracted_text?: string | null
          custom_instructions?: string | null
          enable_misconduct_detection?: boolean | null
          examination_id: string
          flags?: string[] | null
          full_extracted_text?: string | null
          id?: string
          page_count?: number | null
          page_order?: number[] | null
          processing_status: string
          script_image_url: string
          script_number?: number | null
          student_id: string
          upload_timestamp?: string
        }
        Update: {
          additional_image_urls?: string[] | null
          combined_extracted_text?: string | null
          custom_instructions?: string | null
          enable_misconduct_detection?: boolean | null
          examination_id?: string
          flags?: string[] | null
          full_extracted_text?: string | null
          id?: string
          page_count?: number | null
          page_order?: number[] | null
          processing_status?: string
          script_image_url?: string
          script_number?: number | null
          student_id?: string
          upload_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_scripts_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_scripts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          answer_script_id: string
          assigned_grade: number | null
          extracted_text: string | null
          flags: string[] | null
          id: string
          is_overridden: boolean
          llm_explanation: string | null
          manual_grade: number | null
          override_justification: string | null
          question_id: string
          segmentation_confidence: number | null
          segmentation_method: string | null
          spatial_location: Json | null
        }
        Insert: {
          answer_script_id: string
          assigned_grade?: number | null
          extracted_text?: string | null
          flags?: string[] | null
          id?: string
          is_overridden?: boolean
          llm_explanation?: string | null
          manual_grade?: number | null
          override_justification?: string | null
          question_id: string
          segmentation_confidence?: number | null
          segmentation_method?: string | null
          spatial_location?: Json | null
        }
        Update: {
          answer_script_id?: string
          assigned_grade?: number | null
          extracted_text?: string | null
          flags?: string[] | null
          id?: string
          is_overridden?: boolean
          llm_explanation?: string | null
          manual_grade?: number | null
          override_justification?: string | null
          question_id?: string
          segmentation_confidence?: number | null
          segmentation_method?: string | null
          spatial_location?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_answer_script_id_fkey"
            columns: ["answer_script_id"]
            isOneToOne: false
            referencedRelation: "answer_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          id: string
          message_text: string | null
          room_id: string
          sender_id: string
          sent_at: string
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          id?: string
          message_text?: string | null
          room_id: string
          sender_id: string
          sent_at?: string
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          id?: string
          message_text?: string | null
          room_id?: string
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      examinations: {
        Row: {
          created_at: string
          id: string
          name: string
          subject_id: string
          total_marks: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          subject_id: string
          total_marks: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          subject_id?: string
          total_marks?: number
        }
        Relationships: [
          {
            foreignKeyName: "examinations_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          examination_id: string
          id: string
          marks: number
          model_answer: string
          model_answer_source: string
          question_text: string
          tolerance: number
        }
        Insert: {
          created_at?: string
          examination_id: string
          id?: string
          marks: number
          model_answer: string
          model_answer_source: string
          question_text: string
          tolerance: number
        }
        Update: {
          created_at?: string
          examination_id?: string
          id?: string
          marks?: number
          model_answer?: string
          model_answer_source?: string
          question_text?: string
          tolerance?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_examination_id_fkey"
            columns: ["examination_id"]
            isOneToOne: false
            referencedRelation: "examinations"
            referencedColumns: ["id"]
          },
        ]
      }
      segmentation_corrections: {
        Row: {
          answer_id: string | null
          corrected_text: string | null
          created_at: string | null
          id: string
          original_text: string | null
          teacher_id: string | null
        }
        Insert: {
          answer_id?: string | null
          corrected_text?: string | null
          created_at?: string | null
          id?: string
          original_text?: string | null
          teacher_id?: string | null
        }
        Update: {
          answer_id?: string | null
          corrected_text?: string | null
          created_at?: string | null
          id?: string
          original_text?: string | null
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "segmentation_corrections_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segmentation_corrections_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          id: string
          name: string
          teacher_id: string
          unique_student_id: string
        }
        Insert: {
          id?: string
          name: string
          teacher_id: string
          unique_student_id: string
        }
        Update: {
          id?: string
          name?: string
          teacher_id?: string
          unique_student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
          role: string
        }
        Insert: {
          email: string
          id: string
          role: string
        }
        Update: {
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_room_participant: {
        Args: { room_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
