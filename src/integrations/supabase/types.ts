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
          school_id: string | null
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
          school_id?: string | null
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
          school_id?: string | null
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
            foreignKeyName: "answer_scripts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_scripts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["school_id"]
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
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users_view"
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
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_view"
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
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
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
      grade_distribution: {
        Row: {
          created_at: string
          grade_range: string
          id: string
          percentage: number
          report_date: string
          students_count: number
        }
        Insert: {
          created_at?: string
          grade_range: string
          id?: string
          percentage: number
          report_date?: string
          students_count: number
        }
        Update: {
          created_at?: string
          grade_range?: string
          id?: string
          percentage?: number
          report_date?: string
          students_count?: number
        }
        Relationships: []
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
          school_id: string | null
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
          school_id?: string | null
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
          school_id?: string | null
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
          {
            foreignKeyName: "questions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["school_id"]
          },
        ]
      }
      school_performance: {
        Row: {
          avg_grade: number
          created_at: string
          exams_count: number
          id: string
          improvement: number
          report_date: string
          school_id: string
        }
        Insert: {
          avg_grade: number
          created_at?: string
          exams_count: number
          id?: string
          improvement: number
          report_date?: string
          school_id: string
        }
        Update: {
          avg_grade?: number
          created_at?: string
          exams_count?: number
          id?: string
          improvement?: number
          report_date?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_performance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_performance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["school_id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          id: string
          max_students: number | null
          max_teachers: number | null
          name: string
          primary_color: string | null
          secondary_color: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          max_students?: number | null
          max_teachers?: number | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_view"
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
          school_id: string | null
          teacher_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id?: string | null
          teacher_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      system_backups: {
        Row: {
          backup_type: string
          completed_at: string | null
          created_at: string
          id: string
          initiated_by: string | null
          status: string
        }
        Insert: {
          backup_type: string
          completed_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          status: string
        }
        Update: {
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          initiated_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_backups_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics: {
        Row: {
          created_at: string
          id: string
          metric_date: string
          metric_name: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          metric_date?: string
          metric_name: string
          metric_value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric_date?: string
          metric_name?: string
          metric_value?: number
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          auto_backup_enabled: boolean
          backup_frequency: string
          created_at: string
          id: string
          maintenance_mode: boolean
          notifications_enabled: boolean
          support_email: string
          system_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_backup_enabled?: boolean
          backup_frequency?: string
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          notifications_enabled?: boolean
          support_email?: string
          system_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_backup_enabled?: boolean
          backup_frequency?: string
          created_at?: string
          id?: string
          maintenance_mode?: boolean
          notifications_enabled?: boolean
          support_email?: string
          system_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          admin_id: string | null
          id: string
          name: string
          school_id: string | null
        }
        Insert: {
          admin_id?: string | null
          id: string
          name: string
          school_id?: string | null
        }
        Update: {
          admin_id?: string | null
          id?: string
          name?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["school_id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
          role: string
          school_id: string | null
        }
        Insert: {
          email: string
          id: string
          role: string
          school_id?: string | null
        }
        Update: {
          email?: string
          id?: string
          role?: string
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "users_view"
            referencedColumns: ["school_id"]
          },
        ]
      }
    }
    Views: {
      users_view: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_sign_in_at: string | null
          name: string | null
          role: string | null
          school_id: string | null
          school_name: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_master_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_room_participant: {
        Args: { room_id: string }
        Returns: boolean
      }
      validate_school_access: {
        Args: { school_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "master_admin"
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
    Enums: {
      app_role: ["admin", "teacher", "master_admin"],
    },
  },
} as const
