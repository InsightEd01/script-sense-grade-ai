import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createSchoolAdmin } from '@/services/masterAdminService';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  school_id: string;
}

export function useAdminUsers(schoolId: string) {
  const queryClient = useQueryClient();

  const {
    data: admins,
    isLoading,
    error,
  } = useQuery<AdminUser[]>({
    queryKey: ['admins', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'admin');

      if (error) throw error;
      return data;
    },
  });

  const createAdmin = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      await createSchoolAdmin(email, password, schoolId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins', schoolId] });
      toast({
        title: 'Success',
        description: 'School admin created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create admin',
        variant: 'destructive',
      });
    },
  });

  const removeAdmin = useMutation({
    mutationFn: async (adminId: string) => {
      const { error } = await supabase
        .from('users')
        .update({ school_id: null })
        .eq('id', adminId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins', schoolId] });
      toast({
        title: 'Success',
        description: 'Admin removed from school',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove admin',
        variant: 'destructive',
      });
    },
  });

  return {
    admins,
    isLoading,
    error,
    createAdmin,
    removeAdmin,
  };
}
