import { supabase } from '@/lib/supabase';

export interface School {
  id: string;
  name: string;
  domain?: string;
  settings: {
    allowStudentUpload: boolean;
  };
  totalStudents?: number;
  createdAt: string;
}

export interface SchoolAdmin {
  id: string;
  email: string;
  name?: string;
  schoolId: string;
  role: 'admin';
  createdAt: string;
}

export interface SchoolStats {
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalAssessments: number;
  activeUsers: number;
}

export async function getSchools(): Promise<School[]> {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('*');

  if (error) throw error;

  // Get total students for each school
  const schoolsWithStats = await Promise.all(
    schools.map(async (school) => {
      const stats = await getSchoolStats(school.id);
      return {
        ...school,
        totalStudents: stats.totalStudents
      };
    })
  );

  return schoolsWithStats;
}

export async function getSchoolById(id: string): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createSchool(school: Omit<School, 'id' | 'createdAt'>): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .insert([school])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSchool(id: string, updates: Partial<School>): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSchoolStats(schoolId: string): Promise<SchoolStats> {
  // Get total admins for the school
  const { data: admins, error: adminError } = await supabase
    .from('users')
    .select('id')
    .eq('school_id', schoolId)
    .eq('role', 'admin');

  if (adminError) throw adminError;

  // Get total teachers for the school
  const { data: teachers, error: teacherError } = await supabase
    .from('teachers')
    .select('id')
    .eq('school_id', schoolId);

  if (teacherError) throw teacherError;

  // Get total students for the school
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', schoolId);

  if (studentError) throw studentError;

  // Get total assessments for the school
  const { data: assessments, error: assessmentError } = await supabase
    .from('assessments')
    .select('id')
    .eq('school_id', schoolId);

  if (assessmentError) throw assessmentError;

  // Get active users (users who have logged in within the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: activeUsers, error: activeUsersError } = await supabase
    .from('users')
    .select('id')
    .eq('school_id', schoolId)
    .gte('last_login', thirtyDaysAgo.toISOString());

  if (activeUsersError) throw activeUsersError;

  return {
    totalAdmins: admins?.length || 0,
    totalTeachers: teachers?.length || 0,
    totalStudents: students?.length || 0,
    totalAssessments: assessments?.length || 0,
    activeUsers: activeUsers?.length || 0,
  };
}

export async function getSystemStats(): Promise<{
  totalSchools: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
}> {
  // Get total schools
  const { data: schools, error: schoolError } = await supabase
    .from('schools')
    .select('id');

  if (schoolError) throw schoolError;

  // Get total admins
  const { data: admins, error: adminError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin');

  if (adminError) throw adminError;

  // Get total teachers
  const { data: teachers, error: teacherError } = await supabase
    .from('teachers')
    .select('id');

  if (teacherError) throw teacherError;

  // Get total students
  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id');

  if (studentError) throw studentError;

  return {
    totalSchools: schools?.length || 0,
    totalAdmins: admins?.length || 0,
    totalTeachers: teachers?.length || 0,
    totalStudents: students?.length || 0,
  };
}

export async function createSchoolAdmin(
  email: string,
  password: string,
  schoolId: string
): Promise<void> {
  // Create the user account with admin role
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'admin',
      },
    },
  });

  if (authError) throw authError;

  if (!authData.user) {
    throw new Error('Failed to create admin user');
  }

  // Add the user to the users table with school_id
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email: email,
      role: 'admin',
      school_id: schoolId,
    });

  if (userError) {
    // Cleanup: Delete the auth user if user record creation fails
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw userError;
  }
}

export async function removeSchoolAdmin(adminId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', adminId)
    .eq('role', 'admin');

  if (error) throw error;
}

// Keep only this version of deleteSchool (adjust as needed for your app logic)
export async function deleteSchool(id: string): Promise<void> {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getSchoolAdmins(schoolId: string): Promise<SchoolAdmin[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'admin');

  if (error) throw error;
  return data;
}
