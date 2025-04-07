
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createExamination } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Examination name must be at least 2 characters' }).max(100),
  total_marks: z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total marks must be a positive number',
      });
      return z.NEVER;
    }
    return parsed;
  }),
});

type ExaminationFormValues = z.infer<typeof formSchema>;

interface ExaminationFormProps {
  subjectId: string;
  onSuccess?: () => void;
}

export function ExaminationForm({ subjectId, onSuccess }: ExaminationFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ExaminationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      total_marks: '100',
    },
  });
  
  const onSubmit = async (data: ExaminationFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create an examination",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create the examination in the database
      await createExamination({
        subject_id: subjectId,
        name: data.name,
        total_marks: data.total_marks,
      });
      
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create examination:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create examination. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Examination Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Midterm Exam 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="total_marks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Marks</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1"
                  placeholder="e.g., 100" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-scriptsense-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Examination'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
