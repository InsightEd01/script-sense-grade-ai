
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

  return data as AnswerScript[];
}

export async function getAnswerScriptById(id: string): Promise<AnswerScript> {
  const { data, error } = await supabase
    .from('answer_scripts')
    .select('*, student:students(*), examination:examinations(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching answer script:', error);
    throw error;
  }

  return data as AnswerScript;
}

export async function deleteAnswerScript(id: string): Promise<void> {
  const { error } = await supabase
    .from('answer_scripts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting answer script:', error);
    throw error;
  }
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
export async function getSubjects(context?: unknown): Promise<Subject[]> {
  // The context parameter can be the React Query context or a teacherId string
  let teacherId: string | undefined;
  
  // Check if context is from React Query or a direct teacherId
  if (typeof context === 'object' && context !== null) {
    // It's likely a QueryFunctionContext
    const queryKey = (context as any).queryKey;
    if (Array.isArray(queryKey) && queryKey.length > 1) {
      teacherId = queryKey[1] as string;
    }
  } else if (typeof context === 'string') {
    // It's a direct teacherId
    teacherId = context;
  }
  
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

  return data as Question[];
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

  return data as Question;
}

// Teachers
export async function getTeachers(): Promise<Teacher[]> {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*, users(*)')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getTeachers error:', error);
    throw error;
  }
}

export async function deleteTeacher(id: string): Promise<void> {
  try {
    // First, get the user email to delete their auth account
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('*, users(*)')
      .eq('id', id)
      .single();
    
    if (teacherError) {
      console.error('Error getting teacher details:', teacherError);
      throw teacherError;
    }
    
    // Delete the teacher record
    const { error: deleteError } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting teacher:', deleteError);
      throw deleteError;
    }
    
    // Delete the user record - auth user will be cascaded automatically
    if (teacher && teacher.id) {
      const { error: userDeleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
        
      if (userDeleteError) {
        console.error('Error deleting user record:', userDeleteError);
        // Don't throw error here as the teacher was already deleted
      }
    }
  } catch (error) {
    console.error('deleteTeacher error:', error);
    throw error;
  }
}

// Answers
export async function getAnswersByScriptId(scriptId: string) {
  const { data, error } = await supabase
    .from('answers')
    .select('*, question:questions(*)')
    .eq('answer_script_id', scriptId)
    .order('question(created_at)', { ascending: true });

  if (error) {
    console.error('Error fetching answers:', error);
    throw error;
  }

  return data;
}

export async function updateAnswer(answerId: string, updates: { 
  manual_grade?: number; 
  is_overridden?: boolean;
  override_justification?: string;
}) {
  const { data, error } = await supabase
    .from('answers')
    .update(updates)
    .eq('id', answerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating answer:', error);
    throw error;
  }

  return data;
}

// Chat Functions
export async function createChatRoom(name: string, userId: string) {
  try {
    // Create the chat room
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({ name, created_by: userId })
      .select()
      .single();
      
    if (roomError) throw roomError;
    
    // Add the creator as a participant
    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert({ room_id: roomData.id, user_id: userId });
      
    if (participantError) throw participantError;
    
    return roomData;
  } catch (error) {
    console.error('createChatRoom error:', error);
    throw error;
  }
}

export async function getChatRooms() {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('getChatRooms error:', error);
    throw error;
  }
}

export async function sendMessage(roomId: string, senderId: string, message: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ room_id: roomId, sender_id: senderId, message_text: message })
      .select()
      .single();
      
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('sendMessage error:', error);
    throw error;
  }
}
