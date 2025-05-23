
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User as CustomUser, School } from '@/types/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from './use-toast';
import { Role } from '@/types/auth.types';

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [customUser, setCustomUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
  const [schoolName, setSchoolName] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const navigate = useNavigate();

  const isAdmin = customUser?.role === 'admin';
  const isTeacher = customUser?.role === 'teacher';
  const isMasterAdmin = customUser?.role === 'master_admin';

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Using setTimeout to avoid Supabase auth deadlocks
          setTimeout(async () => {
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
                setUser(currentSession.user);
                setCustomUser({
                  id: currentSession.user.id,
                  email: currentSession.user.email || '',
                  role: userData.role as Role,
                  school_id: userData.school_id
                });
                
                if (userData.school_id) {
                  fetchSchoolInfo(userData.school_id);
                }
              }
            } catch (error) {
              console.error('Error in auth state change handler:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setUser(null);
          setCustomUser(null);
          setSchoolId(undefined);
          setSchoolName(undefined);
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
              setUser(currentSession.user);
              setCustomUser({
                id: currentSession.user.id,
                email: currentSession.user.email || '',
                role: userData.role as Role,
                school_id: userData.school_id
              });
              
              if (userData.school_id) {
                fetchSchoolInfo(userData.school_id);
              }
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
  
  const fetchSchoolInfo = async (schoolId: string) => {
    try {
      const { data: schoolData, error } = await supabase
        .from('schools')
        .select('name')
        .eq('id', schoolId)
        .single();
        
      if (error) {
        console.error('Error fetching school data:', error.message);
        return;
      }
      
      if (schoolData) {
        setSchoolId(schoolId);
        setSchoolName(schoolData.name);
      }
    } catch (error) {
      console.error('Error fetching school info:', error);
    }
  };

  const signIn = async (email: string, password: string, role: Role) => {
    try {
      setIsLoading(true);
      const { error, data } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) {
        throw error;
      }
      
      // Verify user role matches requested role
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, school_id')
          .eq('id', data.user.id)
          .single();

        if (userError) {
          throw new Error('Failed to verify user role');
        }

        if (userData.role !== role) {
          // Allow master_admin to sign in as admin for testing
          if (!(userData.role === 'master_admin' && role === 'admin')) {
            throw new Error(`Invalid credentials for ${role} login`);
          }
        }
        
        // Fetch school data if applicable
        if (userData.school_id) {
          fetchSchoolInfo(userData.school_id);
        }
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
      
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
      }
      return {
        user: null,
        session: null
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: Role, name: string, schoolInfo?: { name: string, address?: string }) => {
    try {
      setIsLoading(true);
      
      // For admin role, school info is required
      if (role === 'admin' && (!schoolInfo || !schoolInfo.name)) {
        throw new Error("School name is required for admin registration");
      }
      
      // First create the user account with proper role
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            role,
            name
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error("Failed to create user account");
      }
      
      // Now handle the user's database records separately
      let schoolId: string | undefined = undefined;
      
      // If role is admin, create a school first
      if (role === 'admin' && schoolInfo) {
        try {
          // Create school record via custom function
          const { data: schoolData, error: schoolError } = await supabase.functions.invoke('create-school', {
            body: {
              schoolName: schoolInfo.name,
              schoolAddress: schoolInfo.address || null,
              userId: data.user.id
            }
          });
            
          if (schoolError) {
            console.error('Error creating school record:', schoolError);
            throw schoolError;
          }
          
          schoolId = schoolData.id;
          setSchoolId(schoolId);
          setSchoolName(schoolInfo.name);
        } catch (schoolCreateError) {
          console.error('Failed during school creation:', schoolCreateError);
          // Continue with user creation even if school creation fails
          // We'll handle the school assignment later if needed
        }
      }
      
      // Create user record in users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          role: role,
          school_id: schoolId || null
        });
          
      if (insertError) {
        console.error('Error creating user record:', insertError);
        throw insertError;
      }
      
      // Create teacher record if role is teacher
      if (role === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            id: data.user.id,
            name: name,
            school_id: null  // Will be set when admin assigns teacher
          });
            
        if (teacherError) {
          console.error('Error creating teacher record:', teacherError);
          throw teacherError;
        }
      }
      
      toast({
        title: "Account created",
        description: "Your account has been successfully created!"
      });
      
      return {
        user: data.user,
        session: data.session
      };
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      }
      return {
        user: null,
        session: null
      };
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
      
      setUser(null);
      setCustomUser(null);
      setSession(null);
      setSchoolId(undefined);
      setSchoolName(undefined);
      navigate('/signin');
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
    isMasterAdmin,
    isLoading,
    schoolId,
    schoolName,
    signIn,
    signUp,
    signOut
  };
};
