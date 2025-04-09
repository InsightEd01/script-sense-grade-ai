
import { User } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'admin' | 'teacher', name: string) => Promise<void>;
  signOut: () => Promise<void>;
}
