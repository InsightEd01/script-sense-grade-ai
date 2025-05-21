import { supabase } from '@/lib/supabase';

interface SchoolStats {
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
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

  return {
    totalAdmins: admins?.length || 0,
    totalTeachers: teachers?.length || 0,
    totalStudents: students?.length || 0,
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

export async function deleteSchool(schoolId: string): Promise<void> {
  // Start a transaction to delete all related data
  const { error } = await supabase.rpc('delete_school', {
    school_id: schoolId,
  });

  if (error) throw error;
}
