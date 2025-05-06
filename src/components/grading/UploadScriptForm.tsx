import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAnswerScript } from '@/services/dataService';
import { uploadAnswerScript } from '@/lib/storage';
import { processAnswerScript } from '@/lib/ocr';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Student } from '@/types/supabase';
import { Upload, Loader2, QrCode, UserPlus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { scanBarcodeFromImage } from '@/lib/barcodeScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

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
  custom_instructions: z.string().optional(),
  enable_misconduct_detection: z.boolean().default(true),
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
  const [scanningQrCode, setScanningQrCode] = useState(false);
  const [qrCodeResult, setQrCodeResult] = useState<string | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  
  const form = useForm<UploadScriptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: '',
      identification_method: 'manual',
      custom_instructions: '',
      enable_misconduct_detection: true,
    },
  });
  
  const identificationMethod = form.watch('identification_method');
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const previewUrl = event.target?.result as string;
          setFilePreview(previewUrl);
          
          // If QR code mode is selected, attempt to scan the barcode
          if (identificationMethod === 'qr') {
            scanQrCode(previewUrl);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // For PDF files, just clear the preview
        setFilePreview(null);
      }
    }
  };
  
  const scanQrCode = async (imageUrl: string) => {
    try {
      setScanningQrCode(true);
      const result = await scanBarcodeFromImage(imageUrl);
      if (result) {
        setQrCodeResult(result);
        
        // Try to find a matching student
        const student = students.find(s => s.unique_student_id === result);
        if (student) {
          setMatchedStudent(student);
          form.setValue('student_id', student.id);
          toast({
            title: "Student Identified",
            description: `Found student: ${student.name}`,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Student Not Found",
            description: `No student found with ID: ${result}`,
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "QR Code Not Detected",
          description: "Could not detect a valid QR code in the image.",
        });
      }
    } catch (error) {
      console.error('QR code scanning error:', error);
      toast({
        variant: "destructive",
        title: "Scanning Error",
        description: "Failed to scan QR code from image.",
      });
    } finally {
      setScanningQrCode(false);
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
      const scriptResponse = await createAnswerScript({
        student_id: data.student_id,
        examination_id: examinationId,
        script_image_url: imageUrl,
        processing_status: 'uploaded',
        upload_timestamp: new Date().toISOString(),
        custom_instructions: data.custom_instructions,
        enable_misconduct_detection: data.enable_misconduct_detection
      });
      
      if (scriptResponse && scriptResponse.id) {
        // Process the script with our centralized OCR module
        try {
          await processAnswerScript(scriptResponse.id, imageUrl, true);
          toast({
            title: "Script Uploaded",
            description: "The answer script has been uploaded and OCR processing has started.",
          });
        } catch (ocrError) {
          console.error('OCR processing error:', ocrError);
          toast({
            variant: "destructive",
            title: "OCR Processing Error",
            description: "The script was uploaded but OCR processing failed. You can retry processing later.",
          });
        }
      }
      
      form.reset();
      setFilePreview(null);
      setQrCodeResult(null);
      setMatchedStudent(null);
      
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
                <Tabs 
                  defaultValue={field.value} 
                  onValueChange={field.onChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual" disabled={isUploading}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Manual Selection
                    </TabsTrigger>
                    <TabsTrigger value="qr" disabled={isUploading}>
                      <QrCode className="mr-2 h-4 w-4" />
                      QR Code Scan
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {identificationMethod === 'manual' && (
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
        
        {identificationMethod === 'qr' && (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/40">
              <h3 className="font-medium mb-2">QR Code Scanning</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload an image containing a QR code with the student ID. The system will automatically
                detect and match the student.
              </p>
              
              {qrCodeResult && (
                <div className="mb-4">
                  <p className="text-sm font-medium">Detected Code:</p>
                  <p className="text-sm bg-muted p-2 rounded">{qrCodeResult}</p>
                </div>
              )}
              
              {matchedStudent && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-4">
                  <p className="text-sm font-medium text-green-800">Student Matched:</p>
                  <p className="text-sm text-green-700">{matchedStudent.name} ({matchedStudent.unique_student_id})</p>
                </div>
              )}
              
              {!matchedStudent && qrCodeResult && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                  <p className="text-sm font-medium text-amber-800">No student matched with ID: {qrCodeResult}</p>
                  <p className="text-sm text-amber-700">Please select a student manually or try another image.</p>
                </div>
              )}
              
              {!matchedStudent && identificationMethod === 'qr' && (
                <FormField
                  control={form.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backup: Select Student Manually</FormLabel>
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
            </div>
          </div>
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
                      disabled={isUploading || scanningQrCode}
                      onChange={(e) => {
                        onChange(e.target.files);
                        handleFileChange(e);
                      }}
                      {...rest}
                    />
                  </div>
                  {filePreview && (
                    <div className="mt-4 border rounded-md overflow-hidden">
                      <img 
                        src={filePreview} 
                        alt="Script preview" 
                        className="w-full h-auto max-h-[300px] object-contain"
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
        
        <FormField
          control={form.control}
          name="custom_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Grading Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any specific instructions for the AI grading engine, such as: 'Focus on concept understanding rather than exact wording' or 'Pay attention to mathematical notation correctness'"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="enable_misconduct_detection"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Academic Misconduct Detection</FormLabel>
                <FormDescription className="text-xs text-muted-foreground">
                  Enable AI to flag potential plagiarism or cheating in student answers
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-scriptsense-primary" disabled={isUploading || scanningQrCode}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : scanningQrCode ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning QR Code...
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

interface FormDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

function FormDescription({ className, children }: FormDescriptionProps) {
  return (
    <p className={className}>
      {children}
    </p>
  );
}
