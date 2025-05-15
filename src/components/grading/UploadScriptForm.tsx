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
import { Upload, Loader2, QrCode, UserPlus, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { scanBarcodeFromImage } from '@/lib/barcodeScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Function to upload image to storage and get URL
async function uploadImageToStorage(base64Data: string, pageNumber: number): Promise<string> {
  const timestamp = Date.now();
  const filename = `${timestamp}_page${pageNumber}.jpg`;
  
  // Convert base64 to blob
  const base64Response = await fetch(base64Data);
  const blob = await base64Response.blob();

  try {
    // Upload to Supabase storage directly since bucket is created via migrations
    const { data, error: uploadError } = await supabase.storage
      .from('answer-scripts')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('answer-scripts')
      .getPublicUrl(data.path);

    if (!publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    return publicUrl;
  } catch (error) {
    console.error('Storage operation failed:', error);
    throw error;
  }
}

const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

const formSchema = z.object({
  student_id: z.string().min(1, { message: 'Please select a student' }),
  script_file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Please upload at least one file')
    .refine(
      (files) => Array.from(files).every(file => file.size <= FILE_SIZE_LIMIT),
      `Each file must be 5MB or less`
    )
    .refine(
      (files) => Array.from(files).every(file => ACCEPTED_FILE_TYPES.includes(file.type)),
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
  const [showPreview, setShowPreview] = useState(false);
  const [scanningQrCode, setScanningQrCode] = useState(false);
  const [qrCodeResult, setQrCodeResult] = useState<string | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  
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
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Clear existing previews
    setFilePreviews([]);
    const newPreviews: string[] = [];

    // Process each file
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const previewUrl = event.target?.result as string;
          newPreviews.push(previewUrl);
          setFilePreviews(prev => [...prev, previewUrl]);
          setShowPreview(true);

          // If QR code mode is selected, attempt to scan the first image
          if (filePreviews.length === 0 && form.getValues('identification_method') === 'qr') {
            scanQrCode(previewUrl);
          }
        };
        reader.readAsDataURL(file);
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
      const uploadedUrls: string[] = [];

      // Upload each file
      for (let i = 0; i < filePreviews.length; i++) {
        const base64Data = filePreviews[i];
        const imageUrl = await uploadImageToStorage(base64Data, i + 1);
        uploadedUrls.push(imageUrl);
      }

      // Create the answer script record
      const { data: scriptResponse, error: scriptError } = await supabase
        .from('answer_scripts')
        .insert({
          student_id: data.student_id,
          examination_id: examinationId,
          script_image_url: uploadedUrls[0], // Store first image as main image
          additional_image_urls: uploadedUrls.slice(1), // Store additional images
          processing_status: 'uploaded',
          upload_timestamp: new Date().toISOString(),
          custom_instructions: data.custom_instructions,
          enable_misconduct_detection: data.enable_misconduct_detection,
          page_count: uploadedUrls.length
        })
        .select()
        .single();

      if (scriptError) throw scriptError;

      if (scriptResponse) {
        // Process all images with OCR
        try {
          await processAnswerScript(scriptResponse.id, uploadedUrls, true);
          toast({
            title: "Script Uploaded",
            description: `The answer script with ${uploadedUrls.length} pages has been uploaded and OCR processing has started.`,
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
      setFilePreviews([]);
      setShowPreview(false);
      setQrCodeResult(null);
      setMatchedStudent(null);
      onSuccess();
    } catch (error) {
      console.error('Error uploading script:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "Failed to upload the answer script. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
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
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="script_file"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel>Answer Script Files</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="w-full items-center gap-1.5">
                        <Label htmlFor="script-file">Upload Files</Label>
                        <Input
                          id="script-file"
                          type="file"
                          multiple
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          disabled={isUploading || scanningQrCode}
                          onChange={(e) => {
                            onChange(e.target.files);
                            handleFileChange(e);
                          }}
                          {...rest}
                        />
                      </div>
                      {filePreviews.length > 0 && (
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            className="mb-2"
                            onClick={() => setShowPreview(!showPreview)}
                          >
                            {showPreview ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Previews
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Previews ({filePreviews.length} files)
                              </>
                            )}
                          </Button>
                          {showPreview && filePreviews.length > 0 && (
                            <div className="w-full relative">
                              <Carousel className="w-full max-w-4xl mx-auto">
                                <CarouselContent>
                                  {filePreviews.map((preview, index) => (
                                    <CarouselItem key={index}>
                                      <div className="border rounded-md overflow-hidden bg-muted/10">
                                        <div className="p-2 bg-muted/20 border-b">
                                          <span className="text-sm font-medium">Page {index + 1} of {filePreviews.length}</span>
                                        </div>
                                        <div className="p-4">
                                          <img 
                                            src={preview} 
                                            alt={`Script preview ${index + 1}`} 
                                            className="w-full h-auto max-h-[400px] object-contain"
                                          />
                                        </div>
                                      </div>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                              </Carousel>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted file types: JPEG, PNG, PDF. Maximum size per file: 5MB. You can select multiple files.
                  </p>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="custom_instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Grading Instructions (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter any specific instructions for the AI grading engine, such as: 'Focus on concept understanding rather than exact wording' or 'Pay attention to mathematical notation correctness'"
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="enable_misconduct_detection"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start justify-between rounded-lg border p-4 shadow-sm h-full">
                  <div className="space-y-1">
                    <FormLabel className="text-base">Academic Misconduct Detection</FormLabel>
                    <FormDescription className="text-sm text-muted-foreground">
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
          </div>
        </div>
        
        <div className="flex justify-end pt-6">
          <Button 
            type="submit" 
            className="bg-scriptsense-primary px-6" 
            disabled={isUploading || scanningQrCode}
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading...
              </>
            ) : scanningQrCode ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Scanning QR Code...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
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
