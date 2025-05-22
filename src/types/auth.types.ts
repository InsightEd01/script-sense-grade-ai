
import type { User, Session } from '@supabase/supabase-js';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isMasterAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string, role: 'admin' | 'teacher' | 'master_admin') => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string, role: 'admin' | 'teacher' | 'master_admin', name: string) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
};
