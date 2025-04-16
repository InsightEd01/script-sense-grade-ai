import { supabase } from '@/integrations/supabase/client';
import { Subject, Examination, Student, Teacher, AnswerScript } from '@/types/supabase';

export const getSubjects = async (): Promise<Subject[]> => {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }

  return data || [];
};

export const createSubject = async (subject: { teacher_id: string; name: string; description?: string }) => {
  const { data, error } = await supabase
    .from('subjects')
    .insert([subject])
    .select()
    .single();

  if (error) {
    console.error('Error creating subject:', error);
    throw error;
  }

  return data;
};

export const updateSubject = async (subjectId: string, updates: { name: string; description?: string }) => {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', subjectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating subject:', error);
    throw error;
  }

  return data;
};

export const deleteSubject = async (subjectId: string) => {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId);

  if (error) {
    console.error('Error deleting subject:', error);
    throw error;
  }
};

export const getExaminationsBySubject = async (subjectId: string): Promise<Examination[]> => {
  const { data, error } = await supabase
    .from('examinations')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching examinations:', error);
    throw error;
  }

  return data || [];
};

export const createExamination = async (examination: { subject_id: string; name: string; total_marks: number }) => {
  const { data, error } = await supabase
    .from('examinations')
    .insert([examination])
    .select()
    .single();

  if (error) {
    console.error('Error creating examination:', error);
    throw error;
  }

  return data;
};

export const deleteExamination = async (examinationId: string) => {
  const { error } = await supabase
    .from('examinations')
    .delete()
    .eq('id', examinationId);

  if (error) {
    console.error('Error deleting examination:', error);
    throw error;
  }
};

export const getExaminationById = async (examinationId: string) => {
  const { data, error } = await supabase
    .from('examinations')
    .select('*')
    .eq('id', examinationId)
    .single();
    
  if (error) {
    console.error('Error fetching examination:', error);
    throw error;
  }
  
  return data;
};

export const getQuestionsByExamination = async (examinationId: string) => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('examination_id', examinationId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
  
  return data;
};

export const createQuestion = async (question: {
  examination_id: string;
  question_text: string;
  model_answer: string;
  model_answer_source: 'uploaded' | 'ai_generated';
  marks: number;
  tolerance: number;
}) => {
  const { data, error } = await supabase
    .from('questions')
    .insert([question])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating question:', error);
    throw error;
  }
  
  return data;
};

export const getStudents = async (): Promise<Student[]> => {
  const { data, error } = await supabase
    .from('students')
    .select('*');
    
  if (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
  
  return data as Student[] || [];
};

export const createStudent = async (student: { teacher_id: string; name: string; unique_student_id: string }): Promise<Student> => {
  const { data, error } = await supabase
    .from('students')
    .insert([student])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating student:', error);
    throw error;
  }
  
  return data as Student;
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

export const getTeachers = async (): Promise<Teacher[]> => {
  const { data, error } = await supabase
    .from('teachers')
    .select('*');
    
  if (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
  
  return data as Teacher[] || [];
};

export const deleteTeacher = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
};

export const createAnswerScript = async (script: {
  student_id: string;
  examination_id: string;
  script_image_url: string;
  processing_status: 'uploaded' | 'ocr_pending' | 'ocr_complete' | 'grading_pending' | 'grading_complete' | 'error';
  upload_timestamp?: string;
}): Promise<AnswerScript> => {
  const { data: newScript, error } = await supabase
    .from('answer_scripts')
    .insert([script])
    .select()
    .single();
    
  if (error) {
    console.error('Error creating answer script:', error);
    throw error;
  }
  
  return newScript as AnswerScript;
};

export const getAnswerScriptsByExamination = async (examinationId: string): Promise<AnswerScript[]> => {
  const { data, error } = await supabase
    .from('answer_scripts')
    .select('*, student:students(*)')
    .eq('examination_id', examinationId);
    
  if (error) {
    console.error('Error fetching answer scripts:', error);
    throw error;
  }
  
  return data as AnswerScript[] || [];
};
