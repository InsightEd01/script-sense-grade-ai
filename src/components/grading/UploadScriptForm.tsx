
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAnswerScript } from '@/services/dataService';
import { uploadAnswerScript } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Student } from '@/types/supabase';
import { Upload, Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const formSchema = z.object({
  student_id: z.string().min(1, { message: 'Please select a student' }),
  script_file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Please upload a file')
    .refine(
      (files) => files[0]?.size <= FILE_SIZE_LIMIT,
      `Max file size is 5MB`
    )
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files[0]?.type),
      'Only JPEG, PNG, and PDF files are accepted'
    ),
  identification_method: z.enum(['manual', 'qr'], {
    required_error: 'Please select an identification method',
  }),
});

type UploadScriptFormValues = z.infer<typeof formSchema>;

interface UploadScriptFormProps {
  examinationId: string;
  students: Student[];
  onSuccess?: () => void;
}

export function UploadScriptForm({ examinationId, students, onSuccess }: UploadScriptFormProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const form = useForm<UploadScriptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: '',
      identification_method: 'manual',
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For PDF files, just clear the preview
        setFilePreview(null);
      }
    }
  };
  
  const onSubmit = async (data: UploadScriptFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to upload scripts",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      const file = data.script_file[0];
      
      // Upload the file to Supabase Storage
      const imageUrl = await uploadAnswerScript(
        file,
        user.id,
        data.student_id,
        examinationId
      );
      
      // Create the answer script record in the database
      await createAnswerScript({
        student_id: data.student_id,
        examination_id: examinationId,
        script_image_url: imageUrl,
        processing_status: 'uploaded',
      });
      
      form.reset();
      setFilePreview(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to upload script:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload script. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const watchIdentificationMethod = form.watch('identification_method');
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="identification_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student Identification Method</FormLabel>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isUploading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select identification method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Selection</SelectItem>
                    <SelectItem value="qr" disabled>QR Code (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {watchIdentificationMethod === 'manual' && (
          <FormField
            control={form.control}
            name="student_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isUploading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.unique_student_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="script_file"
          render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
              <FormLabel>Answer Script File</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="script-file">Upload File</Label>
                    <Input
                      id="script-file"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      disabled={isUploading}
                      onChange={(e) => {
                        onChange(e.target.files);
                        handleFileChange(e);
                      }}
                      {...rest}
                    />
                  </div>
                  {filePreview && (
                    <div className="mt-4 border rounded-md overflow-hidden max-w-xs mx-auto">
                      <img 
                        src={filePreview} 
                        alt="Script preview" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground mt-1">
                Accepted file types: JPEG, PNG, PDF. Maximum size: 5MB.
              </p>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-scriptsense-primary" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Script
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
