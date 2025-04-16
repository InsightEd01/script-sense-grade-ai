import { supabase } from '@/integrations/supabase/client';
import { AnswerScript, Examination, Student, Subject } from '@/types/supabase';

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

export async function getSubjects(teacherId?: string): Promise<Subject[]> {
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
