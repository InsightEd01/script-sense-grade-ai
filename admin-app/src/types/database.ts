export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'teacher' | 'master_admin'
          school_id: string | null
        }
        Insert: {
          id: string
          email: string
          role: 'admin' | 'teacher' | 'master_admin'
          school_id?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'teacher' | 'master_admin'
          school_id?: string | null
        }
      }
      schools: {
        Row: {
          id: string
          name: string
          address: string | null
          created_at: string
          created_by: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          created_at?: string
          created_by: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          created_at?: string
          created_by?: string
          updated_at?: string | null
        }
      }
      teachers: {
        Row: {
          id: string
          name: string
          school_id: string
        }
        Insert: {
          id: string
          name: string
          school_id: string
        }
        Update: {
          id?: string
          name?: string
          school_id?: string
        }
      }
      students: {
        Row: {
          id: string
          name: string
          teacher_id: string
          school_id: string
          unique_student_id: string
        }
        Insert: {
          id?: string
          name: string
          teacher_id: string
          school_id: string
          unique_student_id: string
        }
        Update: {
          id?: string
          name?: string
          teacher_id?: string
          school_id?: string
          unique_student_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validate_school_access: {
        Args: { school_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
