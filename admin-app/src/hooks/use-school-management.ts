import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { School } from '@/services/masterAdminService';
import { createSchool, updateSchool, deleteSchool, createSchoolAdmin, removeSchoolAdmin } from '@/services/masterAdminService';

export function useSchoolManagement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSchoolMutation = useMutation({
    mutationFn: createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: 'School created',
        description: 'The school has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create school: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateSchoolMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<School> }) =>
      updateSchool(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: 'School updated',
        description: 'The school has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update school: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: 'School deleted',
        description: 'The school has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to delete school: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: ({ email, password, schoolId }: { email: string; password: string; schoolId: string }) =>
      createSchoolAdmin(email, password, schoolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({
        title: 'Admin created',
        description: 'The school admin has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to create admin: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const removeAdminMutation = useMutation({
    mutationFn: removeSchoolAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast({
        title: 'Admin removed',
        description: 'The admin has been successfully removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to remove admin: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    createSchool: createSchoolMutation.mutate,
    updateSchool: updateSchoolMutation.mutate,
    deleteSchool: deleteSchoolMutation.mutate,
    isCreating: createSchoolMutation.isPending,
    isUpdating: updateSchoolMutation.isPending,
    isDeleting: deleteSchoolMutation.isPending,
    createAdmin: createAdminMutation.mutate,
    removeAdmin: removeAdminMutation.mutate,
    isCreatingAdmin: createAdminMutation.isPending,
    isRemovingAdmin: removeAdminMutation.isPending,
  };
}
