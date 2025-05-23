
import type { User, Session } from '@supabase/supabase-js';

export type Role = 'admin' | 'teacher' | 'master_admin';

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isMasterAdmin: boolean;
  isLoading: boolean;
  schoolId?: string;
  schoolName?: string;
  signIn: (email: string, password: string, role: Role) => Promise<{ user: User | null; session: Session | null }>;
  signUp: (email: string, password: string, role: Role, name: string, schoolInfo?: { name: string, address?: string }) => Promise<{ user: User | null; session: Session | null }>;
  signOut: () => Promise<void>;
};
