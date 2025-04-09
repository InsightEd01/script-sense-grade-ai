
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/supabase';
import { Session } from '@supabase/supabase-js';
import { useToast } from './use-toast';

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();

            if (error) {
              console.error('Error fetching user data:', error.message);
              return;
            }

            if (userData) {
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                role: userData.role as 'admin' | 'teacher'
              });
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
          } finally {
            setIsLoading(false);
          }
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        // Fetch user data from database
        supabase
          .from('users')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()
          .then(({ data: userData, error }) => {
            if (error) {
              console.error('Error fetching user data:', error.message);
              setIsLoading(false);
              return;
            }

            if (userData) {
              setUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                role: userData.role as 'admin' | 'teacher'
              });
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
      
      // Navigate to dashboard immediately after successful sign-in
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'admin' | 'teacher', name: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role,
            name
          },
          // Disable email verification
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Create user record manually to ensure it's available immediately
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: email,
            role: role
          });
          
        if (role === 'teacher') {
          const { error: teacherError } = await supabase
            .from('teachers')
            .insert({
              id: data.user.id,
              name: name
            });
            
          if (teacherError) {
            console.error('Error creating teacher record:', teacherError);
          }
        }
        
        if (insertError) {
          console.error('Error creating user record:', insertError);
        }
      }
      
      toast({
        title: "Account created",
        description: "Your account has been successfully created! You can now sign in."
      });
      
      // Redirect to signin page after signup
      navigate('/signin');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      }
      throw error;
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

  return {
    user,
    session,
    isAdmin,
    isTeacher,
    isLoading,
    signIn,
    signUp,
    signOut
  };
};
