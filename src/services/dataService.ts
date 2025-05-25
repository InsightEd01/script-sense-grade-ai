
import { supabase } from '@/integrations/supabase/client';
import type { Teacher, Student, Subject, Examination, Question, AnswerScript, School } from '@/types/supabase';

// Teacher management functions
export const getTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from('teacher_details')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }

  return data || [];
};

export const createTeacher = async (teacherData: {
  email: string;
  password: string;
  name: string;
}): Promise<void> => {
  // Get current user's school ID
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();

  if (userError || !currentUser) {
    throw new Error('Failed to get current user information');
  }

  if (currentUser.role !== 'admin' && currentUser.role !== 'master_admin') {
    throw new Error('Insufficient permissions to create teachers');
  }

  // Create user with proper metadata for the trigger
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: teacherData.email,
    password: teacherData.password,
    options: {
      data: {
        role: 'teacher',
        name: teacherData.name,
        school_id: currentUser.school_id,
      }
    }
  });

  if (authError) {
    throw new Error(`Failed to create teacher account: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('Failed to create teacher account');
  }

  // The trigger will automatically create the teacher record
  // We just need to update the created_by_admin field
  const { error: updateError } = await supabase
    .from('teachers')
    .update({ 
      created_by_admin: (await supabase.auth.getUser()).data.user?.id 
    })
    .eq('id', authData.user.id);

  if (updateError) {
    console.error('Warning: Failed to update teacher created_by_admin:', updateError);
    // Don't throw here as the teacher was created successfully
  }
};

export const updateTeacher = async (id: string, updates: Partial<Teacher>): Promise<void> => {
  const { error } = await supabase
    .from('teachers')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
};

export const deleteTeacher = async (id: string): Promise<void> => {
  // Delete from auth.users (this will cascade to teachers table via foreign key)
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  
  if (authError) {
    console.error('Error deleting teacher from auth:', authError);
    throw authError;
  }
};

// Student management functions
export const getStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching students:', error);
    throw error;
  }

  return data || [];
};

export const createStudent = async (studentData: Omit<Student, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('students')
    .insert([studentData]);

  if (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const updateStudent = async (id: string, updates: Partial<Student>): Promise<void> => {
  const { error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

export const deleteStudent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// Subject management functions
export const getSubjects = async (): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }

  return data || [];
};

export const createSubject = async (subjectData: Omit<Subject, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('subjects')
    .insert([subjectData]);

  if (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
};

export const updateSubject = async (id: string, updates: Partial<Subject>): Promise<void> => {
  const { error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
};

export const deleteSubject = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};

// Examination management functions
export const getExaminations = async (): Promise<Examination[]> => {
  const { data, error } = await supabase
    .from('examinations')
    .select(`
      *,
      subject:subjects(name)
    `)
    .order('name');

  if (error) {
    console.error('Error fetching examinations:', error);
    throw error;
  }

  return data || [];
};

export const createExamination = async (examinationData: Omit<Examination, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('examinations')
    .insert([examinationData]);

  if (error) {
    console.error('Error creating examination:', error);
    throw error;
  }
};

export const updateExamination = async (id: string, updates: Partial<Examination>): Promise<void> => {
  const { error } = await supabase
    .from('examinations')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating examination:', error);
    throw error;
  }
};

export const deleteExamination = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('examinations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting examination:', error);
    throw error;
  }
};

// Question management functions
export const getQuestions = async (): Promise<Question[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      examination:examinations(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }

  return data || [];
};

export const createQuestion = async (questionData: Omit<Question, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .insert([questionData]);

  if (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

export const updateQuestion = async (id: string, updates: Partial<Question>): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating question:', error);
    throw error;
  }
};

export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
};

// School management functions (for master admin)
export const getSchools = async (): Promise<School[]> => {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching schools:', error);
    throw error;
  }

  return data || [];
};

export const createSchool = async (schoolData: Omit<School, 'id' | 'created_at'>): Promise<void> => {
  const { error } = await supabase
    .from('schools')
    .insert([schoolData]);

  if (error) {
    console.error('Error creating school:', error);
    throw error;
  }
};

export const updateSchool = async (id: string, updates: Partial<School>): Promise<void> => {
  const { error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', id);

  if (error) {
    console.error('Error updating school:', error);
    throw error;
  }
};

export const deleteSchool = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting school:', error);
    throw error;
  }
};

// Answer script management functions
export const getAnswerScripts = async (): Promise<AnswerScript[]> => {
  const { data, error } = await supabase
    .from('answer_scripts')
    .select(`
      *,
      student:students(name, unique_student_id),
      examination:examinations(name)
    `)
    .order('upload_timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching answer scripts:', error);
    throw error;
  }

  return data || [];
};
