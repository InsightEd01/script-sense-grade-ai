
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
  // Get the current user's information first to fetch students in their school
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('Error getting user:', userError);
    throw userError;
  }
  
  // Get the user's school_id from the users table
  const { data: currentUser, error: currentUserError } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', userData.user.id)
    .single();
  
  if (currentUserError) {
    console.error('Error getting current user data:', currentUserError);
    throw currentUserError;
  }

  let query = supabase
    .from('students')
    .select('*');
    
  // Filter students based on role
  if (currentUser.role === 'teacher') {
    // Teachers can only see their own students
    query = query.eq('teacher_id', userData.user.id);
  } else if (currentUser.role === 'admin' && currentUser.school_id) {
    // Admins can see all students in their school
    query = query.eq('school_id', currentUser.school_id);
  }
  
  query = query.order('name', { ascending: true });
  
  const { data, error } = await query;

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
  // Get the teacher's school_id
  const { data: teacherData, error: teacherError } = await supabase
    .from('teachers')
    .select('school_id')
    .eq('id', student.teacher_id)
    .single();
    
  if (teacherError) {
    console.error('Error getting teacher data:', teacherError);
    throw teacherError;
  }
  
  // Add the school_id to the student record
  const studentWithSchool = {
    ...student,
    school_id: teacherData.school_id
  };

  const { data, error } = await supabase
    .from('students')
    .insert(studentWithSchool)
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
  let teacherId: string | undefined;
  
  if (typeof context === 'object' && context !== null) {
    const queryKey = (context as any).queryKey;
    if (Array.isArray(queryKey) && queryKey.length > 1) {
      teacherId = queryKey[1] as string;
    }
  } else if (typeof context === 'string') {
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

export async function updateQuestion(
  questionId: string,
  updates: {
    question_text?: string;
    model_answer?: string;
    model_answer_source?: 'uploaded' | 'ai_generated';
    marks?: number;
    tolerance?: number;
  }
): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating question:', error);
    throw error;
  }

  return data as Question;
}

// Teachers - Updated to use the new teacher_details view and proper joins
export async function getTeachers(): Promise<Teacher[]> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Get current user's role and school_id
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('role, school_id')
      .eq('id', userData.user.id)
      .single();
      
    if (currentUserError) throw currentUserError;

    // Use the new teacher_details view for better data access
    let query = supabase.from('teacher_details').select('*');
    
    // Filter teachers based on role
    if (currentUser.role === 'admin' && currentUser.school_id) {
      // Admins can only see teachers in their school
      query = query.eq('school_id', currentUser.school_id);
    }
    
    query = query.order('name', { ascending: true });
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }

    // Transform the data to match the expected Teacher interface
    const teachers = data?.map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      admin_id: teacher.admin_id,
      school_id: teacher.school_id,
      email: teacher.email,
      school_name: teacher.school_name
    })) || [];

    return teachers;
  } catch (error) {
    console.error('getTeachers error:', error);
    throw error;
  }
}

export async function deleteTeacher(id: string): Promise<void> {
  try {
    // First delete the teacher record (this will cascade to related data)
    const { error: deleteError } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting teacher:', deleteError);
      throw deleteError;
    }
    
    // Then delete the user record if it exists
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
        
    if (userDeleteError) {
      console.error('Error deleting user record:', userDeleteError);
      // Don't throw here as the teacher is already deleted
    }
  } catch (error) {
    console.error('deleteTeacher error:', error);
    throw error;
  }
}

export async function updateTeacher(id: string, updates: { name: string }): Promise<void> {
  try {
    const { error: updateError } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating teacher:', updateError);
      throw updateError;
    }
  } catch (error) {
    console.error('updateTeacher error:', error);
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
    const { data: roomData, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        name,
        created_by: userId
      })
      .select()
      .single();

    if (roomError) throw roomError;

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert({
        room_id: roomData.id,
        user_id: userId
      });

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
      .select(`
        *,
        chat_participants:chat_participants(user_id)
      `)
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
