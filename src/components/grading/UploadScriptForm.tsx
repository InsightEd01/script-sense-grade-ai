
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useDropzone } from 'react-dropzone';
import { createAnswerScript } from '@/services/dataService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Student } from '@/types/supabase';

const formSchema = z.object({
  studentId: z.string().uuid(),
  imageFile: z.any().refine((file) => file, {
    message: 'An image file is required.',
  }),
  autoGrade: z.boolean().default(false),
});

interface UploadScriptFormProps {
  examinationId: string;
  students: Student[];
  onSuccess: () => void;
}

export function UploadScriptForm({ examinationId, students, onSuccess }: UploadScriptFormProps) {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: "",
      imageFile: undefined,
      autoGrade: true,
    },
  });
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10485760, // 10MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        form.setValue('imageFile', file);
        
        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
      }
    },
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0]?.message || 'File upload failed';
      toast({
        title: "Upload Error",
        description: error,
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      
      // Upload image to Supabase Storage
      const imageFile = values.imageFile;
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${examinationId}/${values.studentId}/${fileName}`;
      
      // Create or ensure the bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === 'answer_scripts')) {
        await supabase.storage.createBucket('answer_scripts', {
          public: true
        });
      }
      
      // Upload the file with progress tracking
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('answer_scripts')
        .upload(filePath, imageFile, {
          upsert: true,
          onUploadProgress: (progress) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          },
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('answer_scripts')
        .getPublicUrl(filePath);
      
      // Create answer script record in database
      const answerScript = await createAnswerScript({
        student_id: values.studentId,
        examination_id: examinationId,
        script_image_url: urlData.publicUrl,
        processing_status: 'uploaded'
      });
      
      // Trigger OCR processing using the edge function
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('process-ocr', {
        body: {
          answerScriptId: answerScript.id,
          imageUrl: urlData.publicUrl,
          autoGrade: values.autoGrade
        }
      });
      
      if (ocrError) {
        throw ocrError;
      }
      
      toast({
        title: "Success",
        description: `Script uploaded and ${values.autoGrade ? 'processing and grading started' : 'processing started'}`,
      });
      
      onSuccess();
      
    } catch (error) {
      console.error('Error uploading script:', error);
      toast({
        title: "Error",
        description: "Failed to upload answer script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      
      // Clean up preview URL
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.unique_student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="imageFile"
          render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel>Upload Answer Script</FormLabel>
              <FormControl>
                <div className="flex flex-col space-y-4">
                  <div 
                    {...getRootProps()} 
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Input 
                      {...getInputProps()} 
                      {...field}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          onChange(file);
                          const objectUrl = URL.createObjectURL(file);
                          setPreview(objectUrl);
                        }
                      }}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                    />
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or click to upload an image of the answer script
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Supported formats: JPG, PNG, WEBP - Max size: 10MB)
                    </p>
                  </div>
                  
                  {preview && (
                    <Card className="overflow-hidden">
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full max-h-[300px] object-contain"
                      />
                    </Card>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="autoGrade"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Automatically grade after OCR
                </FormLabel>
                <FormDescription>
                  The system will process OCR and then immediately grade the script
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Separator />

        <div className="flex justify-end">
          <Button type="submit" disabled={isProcessing} className="bg-scriptsense-primary">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadProgress > 0 && uploadProgress < 100
                  ? `Uploading ${uploadProgress}%`
                  : 'Processing...'}
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
