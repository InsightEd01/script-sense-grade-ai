
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from './supabase';

export type Role = 'admin' | 'teacher' | 'master_admin';

export interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isMasterAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, role: Role) => Promise<{ user: SupabaseUser | null; session: Session | null }>;
  signUp: (email: string, password: string, role: Role, name: string) => Promise<{ user: SupabaseUser | null; session: Session | null }>;
  signOut: () => Promise<void>;
}
