
import { supabase } from '@/integrations/supabase/client';
import { AnswerScript, Examination, Question, Student, Subject, Teacher } from '@/types/supabase';

// Answer Scripts
export async function createAnswerScript(answerScript: {
  student_id: string;
  examination_id: string;
  script_image_url: string;
  processing_status: AnswerScript['processing_status'];
  upload_timestamp?: string;
  custom_instructions?: string;
  enable_misconduct_detection?: boolean;
  flags?: string[];
}) {
  const { data, error } = await supabase
    .from('answer_scripts')
    .insert(answerScript)
    .select()
    .single();

  if (error) {
    console.error('Error creating answer script:', error);
    throw error;
  }

  return data;
}

export async function getAnswerScriptsByExamination(examinationId: string): Promise<AnswerScript[]> {
  const { data, error } = await supabase
    .from('answer_scripts')
    .select('*, student:students(*)')
    .eq('examination_id', examinationId)
    .order('upload_timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching answer scripts:', error);
    throw error;
  }

  return data || [];
}

// Students
export async function getStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching students:', error);
    throw error;
  }

  return data || [];
}

export async function createStudent(student: {
  teacher_id: string;
  name: string;
  unique_student_id: string;
}): Promise<Student> {
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();

  if (error) {
    console.error('Error creating student:', error);
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
    console.error('Error deleting student:', error);
    throw error;
  }
}

// Subjects
export async function getSubjects(queryContext?: unknown): Promise<Subject[]> {
  // Check if the context is from React Query
  const teacherId = typeof queryContext === 'string' ? queryContext : undefined;
  
  let query = supabase
    .from('subjects')
    .select('*')
    .order('name', { ascending: true });

  if (teacherId) {
    query = query.eq('teacher_id', teacherId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }

  return data || [];
}

export async function createSubject(subject: {
  teacher_id: string;
  name: string;
  description?: string;
}): Promise<Subject> {
  const { data, error } = await supabase
    .from('subjects')
    .insert(subject)
    .select()
    .single();

  if (error) {
    console.error('Error creating subject:', error);
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
    console.error('Error deleting subject:', error);
    throw error;
  }
}

// Examinations
export async function getExaminationsBySubject(subjectId: string): Promise<Examination[]> {
  let query = supabase
    .from('examinations')
    .select('*')
    .order('created_at', { ascending: false });

  if (subjectId !== 'all') {
    query = query.eq('subject_id', subjectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching examinations:', error);
    throw error;
  }

  return data || [];
}

export async function getExaminationById(id: string): Promise<Examination> {
  const { data, error } = await supabase
    .from('examinations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching examination:', error);
    throw error;
  }

  return data;
}

export async function createExamination(examination: {
  subject_id: string;
  name: string;
  total_marks: number;
}): Promise<Examination> {
  const { data, error } = await supabase
    .from('examinations')
    .insert(examination)
    .select()
    .single();

  if (error) {
    console.error('Error creating examination:', error);
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
    console.error('Error deleting examination:', error);
    throw error;
  }
}

// Questions
export async function getQuestionsByExamination(examinationId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('examination_id', examinationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }

  return data || [];
}

export async function createQuestion(question: {
  examination_id: string;
  question_text: string;
  model_answer: string;
  model_answer_source: 'uploaded' | 'ai_generated';
  marks: number;
  tolerance: number;
}): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single();

  if (error) {
    console.error('Error creating question:', error);
    throw error;
  }

  return data;
}

// Teachers
export async function getTeachers(): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*, users(*)')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }

  return data || [];
}

export async function deleteTeacher(id: string): Promise<void> {
  const { error } = await supabase
    .from('teachers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting teacher:', error);
    throw error;
  }
}
