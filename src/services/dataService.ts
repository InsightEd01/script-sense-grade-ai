
import { supabase } from '@/integrations/supabase/client';
import { Student, Subject, Examination, Question, AnswerScript, Answer } from '@/types/supabase';

// Student methods
export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name');
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createStudent(student: Omit<Student, 'id'>): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
}

// Subject methods
export async function getSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('name');
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createSubject(subject: Omit<Subject, 'id'>): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subject)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function updateSubject(id: string, updates: Partial<Subject>): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function deleteSubject(id: string): Promise<void> {
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
}

// Examination methods
export async function getExaminationsBySubject(subjectId: string): Promise<Examination[]> {
  const { data, error } = await supabase
    .from('examinations')
    .select('*')
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createExamination(examination: Omit<Examination, 'id'>): Promise<Examination> {
  const { data, error } = await supabase
    .from('examinations')
    .insert(examination)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function updateExamination(id: string, updates: Partial<Examination>): Promise<Examination> {
  const { data, error } = await supabase
    .from('examinations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function deleteExamination(id: string): Promise<void> {
  const { error } = await supabase
    .from('examinations')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
}

// Question methods
export async function getQuestionsByExamination(examinationId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('examination_id', examinationId)
    .order('created_at');
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createQuestion(question: Omit<Question, 'id'>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
}

// Answer Script methods
export async function getAnswerScriptsByExamination(examinationId: string): Promise<AnswerScript[]> {
  const { data, error } = await supabase
    .from('answer_scripts')
    .select('*, students(*)')
    .eq('examination_id', examinationId)
    .order('upload_timestamp', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createAnswerScript(answerScript: Omit<AnswerScript, 'id'>): Promise<AnswerScript> {
  const { data, error } = await supabase
    .from('answer_scripts')
    .insert(answerScript)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function updateAnswerScriptStatus(
  id: string, 
  status: 'uploaded' | 'ocr_pending' | 'ocr_complete' | 'grading_pending' | 'grading_complete' | 'error'
): Promise<AnswerScript> {
  const { data, error } = await supabase
    .from('answer_scripts')
    .update({ processing_status: status })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function deleteAnswerScript(id: string): Promise<void> {
  const { error } = await supabase
    .from('answer_scripts')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
}

// Answer methods
export async function getAnswersByAnswerScript(answerScriptId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*, questions(*)')
    .eq('answer_script_id', answerScriptId);
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function createAnswer(answer: Omit<Answer, 'id'>): Promise<Answer> {
  const { data, error } = await supabase
    .from('answers')
    .insert(answer)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function updateAnswer(id: string, updates: Partial<Answer>): Promise<Answer> {
  const { data, error } = await supabase
    .from('answers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function overrideGrade(
  id: string, 
  manualGrade: number, 
  justification: string
): Promise<Answer> {
  const { data, error } = await supabase
    .from('answers')
    .update({
      is_overridden: true,
      manual_grade: manualGrade,
      override_justification: justification
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
}

// Admin methods
export async function getTeachers() {
  const { data, error } = await supabase
    .from('teachers')
    .select('*, users(*)');
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function deleteTeacher(id: string): Promise<void> {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);
  
  if (error) {
    throw error;
  }
}
