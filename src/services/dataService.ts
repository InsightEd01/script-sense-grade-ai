import { supabase } from '@/integrations/supabase/client';
import { Subject, Examination } from '@/types/supabase';

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
