import { supabase } from '@/lib/supabase';
import { School, CreateSchoolRequest, UpdateSchoolRequest } from '@/types/school.types';

export async function getSchools(): Promise<School[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching schools:', error);
    throw error;
  }

  return data;
}

export async function createSchool(school: CreateSchoolRequest): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .insert(school)
    .select()
    .single();

  if (error) {
    console.error('Error creating school:', error);
    throw error;
  }

  return data;
}

export async function updateSchool(id: string, school: UpdateSchoolRequest): Promise<School> {
  const { data, error } = await supabase
    .from('schools')
    .update(school)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating school:', error);
    throw error;
  }

  return data;
}

export async function deleteSchool(id: string): Promise<void> {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting school:', error);
    throw error;
  }
}

export async function getSchoolAdmins(schoolId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('school_id', schoolId)
    .eq('role', 'admin');

  if (error) {
    console.error('Error fetching school admins:', error);
    throw error;
  }

  return data;
}

export async function assignAdminToSchool(userId: string, schoolId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ school_id: schoolId })
    .eq('id', userId);

  if (error) {
    console.error('Error assigning admin to school:', error);
    throw error;
  }
}
