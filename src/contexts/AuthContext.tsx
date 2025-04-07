
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { User } from '@/types/supabase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: 'admin' | 'teacher', name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session?.user) {
          // Get user role from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            throw profileError;
          }

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: profileData.role
          });
        }
      } catch (error) {
        if (error instanceof Error) {
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Get user role from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          setUser(null);
        } else {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role: profileData.role
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
      
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'admin' | 'teacher', name: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        throw error;
      }
      
      if (data.user) {
        // Create profile entry
        const { error: profileError } = await supabase.from('users').insert([
          { id: data.user.id, email, role }
        ]);
        
        if (profileError) {
          throw profileError;
        }
        
        // If teacher, create teacher entry
        if (role === 'teacher') {
          const { error: teacherError } = await supabase.from('teachers').insert([
            { id: data.user.id, name }
          ]);
          
          if (teacherError) {
            throw teacherError;
          }
        }
        
        toast({
          title: "Account created",
          description: "Your account has been successfully created!"
        });
        
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out."
      });
      
      navigate('/');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isTeacher, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
