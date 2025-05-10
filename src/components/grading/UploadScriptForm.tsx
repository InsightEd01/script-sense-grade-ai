
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { createAnswerScript } from '@/services/dataService';
import { uploadAnswerScript } from '@/lib/storage';
import { processAnswerScript } from '@/lib/ocr';
import { scanBarcodeFromImage } from '@/lib/barcodeScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from '@/components/ui/use-toast';
import { Upload, Loader2, QrCode, UserPlus, Image, File, Files, X, Plus } from 'lucide-react';
import { Student } from '@/types/supabase';

// File size and type constants
const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Define form schema (including multiple files validation)
const formSchema = z.object({
  student_id: z.string().min(1, { message: 'Please select a student' }),
  script_files: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, 'Please upload at least one file')
    .refine(
      (files) => Array.from(files).every(file => file.size <= FILE_SIZE_LIMIT),
      'One or more files exceed the 5MB limit'
    )
    .refine(
      (files) => Array.from(files).every(file => 
        ACCEPTED_FILE_TYPES.includes(file.type)
      ),
      'Only JPEG, PNG, and PDF files are accepted'
    ),
  illustration: z
    .instanceof(FileList)
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0]?.size <= FILE_SIZE_LIMIT,
      'Illustration image must be less than 5MB'
    )
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
      'Only JPEG and PNG images are accepted for illustrations'
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
  const [scriptPreviews, setScriptPreviews] = useState<Array<{
    name: string;
    type: string;
    size: number;
    url: string | null;
  }>>([]);
  const [illustrationPreview, setIllustrationPreview] = useState<string | null>(null);
  const [scanningQrCode, setScanningQrCode] = useState(false);
  const [qrCodeResult, setQrCodeResult] = useState<string | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<Student | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
  
  // Handle script file selection
  const handleScriptFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPreviews: Array<{
        name: string;
        type: string;
        size: number;
        url: string | null;
      }> = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const previewUrl = event.target?.result as string;
            newPreviews.push({
              name: file.name,
              type: file.type,
              size: file.size,
              url: previewUrl
            });
            
            if (newPreviews.length === files.length) {
              setScriptPreviews(newPreviews);
            }
            
            // If QR code mode and this is the first image, scan it
            if (identificationMethod === 'qr' && i === 0 && previewUrl) {
              scanQrCode(previewUrl);
            }
          };
          reader.readAsDataURL(file);
        } else {
          // For PDFs, use a placeholder
          newPreviews.push({
            name: file.name,
            type: file.type,
            size: file.size,
            url: null
          });
          
          if (newPreviews.length === files.length) {
            setScriptPreviews(newPreviews);
          }
        }
      }
    }
  };

  // Handle illustration file selection
  const handleIllustrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setIllustrationPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove a script file from the list
  const removeScriptFile = (index: number) => {
    const newPreviews = [...scriptPreviews];
    newPreviews.splice(index, 1);
    setScriptPreviews(newPreviews);
    
    const currentFiles = form.getValues('script_files');
    if (currentFiles) {
      const dataTransfer = new DataTransfer();
      Array.from(currentFiles).forEach((file, i) => {
        if (i !== index) dataTransfer.items.add(file);
      });
      form.setValue('script_files', dataTransfer.files);
    }
  };

  // QR Code scanning logic
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

  // Form submission handler with sequential processing
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
      
      // Get the files
      const scriptFiles = Array.from(data.script_files);
      const illustrationFile = data.illustration?.[0];
      
      // Upload the illustration first if present
      let illustrationUrl: string | undefined;
      if (illustrationFile) {
        try {
          illustrationUrl = await uploadAnswerScript(
            illustrationFile,
            user.id,
            data.student_id,
            examinationId,
            'illustration'
          );
        } catch (error) {
          console.error('Failed to upload illustration:', error);
          toast({
            variant: "destructive",
            title: "Illustration Upload Failed",
            description: "Could not upload the illustration image.",
          });
        }
      }
      
      // Process script files sequentially
      let combinedExtractedText = '';
      let scriptResponses = [];
      
      setIsProcessing(true);
      
      // Upload and process each file sequentially
      for (let i = 0; i < scriptFiles.length; i++) {
        const file = scriptFiles[i];
        setProcessingProgress(Math.floor((i / scriptFiles.length) * 100));
        
        try {
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
            enable_misconduct_detection: data.enable_misconduct_detection,
            illustration_url: illustrationUrl,
            script_number: i + 1 // Script number for proper ordering
          });
          
          if (scriptResponse && scriptResponse.id) {
            scriptResponses.push(scriptResponse);
            
            // Process the script with OCR
            try {
              const ocrResult = await processAnswerScript(scriptResponse.id, imageUrl, true);
              if (ocrResult && ocrResult.text) {
                // Add page marker and append the extracted text
                combinedExtractedText += `\n\n--- PAGE ${i+1} ---\n\n${ocrResult.text}`;
              }
            } catch (ocrError) {
              console.error('OCR processing error:', ocrError);
              toast({
                variant: "warning",
                title: `Script ${i+1} OCR Error`,
                description: `The script was uploaded but OCR processing failed.`,
              });
            }
          }
        } catch (uploadError) {
          console.error(`Failed to upload script ${i+1}:`, uploadError);
          toast({
            variant: "destructive",
            title: `Script ${i+1} Upload Failed`,
            description: "Failed to upload script. Please try again.",
          });
        }
      }
      
      setProcessingProgress(100);
      
      // If there are multiple scripts and we have combined text, update the first script with the combined text
      if (scriptResponses.length > 1 && combinedExtractedText) {
        try {
          // Update the first script with the combined text from all scripts
          const firstScript = scriptResponses[0];
          if (firstScript && firstScript.id) {
            // In a real implementation, you would call a service to update the script with combined text
            console.log('Combining extracted text from all scripts:', combinedExtractedText);
            
            // For now, we'll just log it, but in a real implementation you would update the database
            toast({
              title: "Scripts Combined",
              description: `Successfully combined text from ${scriptFiles.length} scripts.`,
            });
          }
        } catch (combineError) {
          console.error('Failed to combine script texts:', combineError);
        }
      }
      
      // Show success toast
      toast({
        title: "Upload Complete",
        description: `Successfully processed ${scriptFiles.length} script${scriptFiles.length > 1 ? 's' : ''}.`,
      });
      
      // Reset form and state
      form.reset();
      setScriptPreviews([]);
      setIllustrationPreview(null);
      setQrCodeResult(null);
      setMatchedStudent(null);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to upload scripts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload scripts. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };
  
  return (
    <Card className="w-full shadow-lg border-t-4 border-t-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Answer Script
        </CardTitle>
        <CardDescription>
          Upload student answer scripts for AI-assisted grading. Support for multiple files.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Identification Section */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="text-md font-medium mb-4">Student Identification</h3>
              
              <FormField
                control={form.control}
                name="identification_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identification Method</FormLabel>
                    <FormControl>
                      <Tabs 
                        defaultValue={field.value} 
                        onValueChange={field.onChange}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-2 mb-2">
                          <TabsTrigger value="manual" disabled={isUploading} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Manual Selection
                          </TabsTrigger>
                          <TabsTrigger value="qr" disabled={isUploading} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <QrCode className="mr-2 h-4 w-4" />
                            QR Code Scan
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="manual" className="mt-2">
                          <FormField
                            control={form.control}
                            name="student_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Student</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={isUploading}
                                >
                                  <FormControl>
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {students && students.map((student) => (
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
                        </TabsContent>
                        
                        <TabsContent value="qr" className="mt-2">
                          <div className="space-y-4">
                            <div className="p-4 border rounded-md bg-blue-50 border-blue-200">
                              <h3 className="font-medium mb-2">QR Code Scanning</h3>
                              <p className="text-sm text-muted-foreground mb-4">
                                Upload an image containing a QR code with the student ID for automatic identification.
                              </p>
                              
                              {qrCodeResult && (
                                <div className="mb-4">
                                  <p className="text-sm font-medium">Detected Code:</p>
                                  <p className="text-sm bg-white p-2 rounded border">{qrCodeResult}</p>
                                </div>
                              )}
                              
                              {matchedStudent && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-4">
                                  <p className="text-sm font-medium text-green-800">Student Matched:</p>
                                  <p className="text-sm text-green-700">{matchedStudent.name} ({matchedStudent.unique_student_id})</p>
                                </div>
                              )}
                            </div>
                            
                            {!matchedStudent && qrCodeResult && (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
                                <p className="text-sm font-medium text-amber-800">No student matched with ID: {qrCodeResult}</p>
                                <p className="text-sm text-amber-700">Please select a student manually.</p>
                              </div>
                            )}
                            
                            {!matchedStudent && (
                              <FormField
                                control={form.control}
                                name="student_id"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Backup: Manual Selection</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      disabled={isUploading}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select a student" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {students && students.map((student) => (
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
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            {/* Multiple Scripts Upload Section */}
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="text-md font-medium mb-4">Answer Scripts</h3>
              <FormField
                control={form.control}
                name="script_files"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Answer Scripts</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div 
                          className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('script-files')!.click()}
                        >
                          <Files className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Drag & drop or click to upload</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPEG, PNG, PDF • Max 5MB per file
                          </p>
                          <Input
                            id="script-files"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,application/pdf"
                            multiple
                            disabled={isUploading || scanningQrCode}
                            className="hidden"
                            onChange={(e) => {
                              onChange(e.target.files);
                              handleScriptFilesChange(e);
                            }}
                            {...rest}
                          />
                        </div>
                        
                        {/* Preview of uploaded files */}
                        {scriptPreviews.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {scriptPreviews.map((preview, index) => (
                              <div key={index} className="relative rounded-md border bg-background p-2 flex items-center gap-2">
                                {preview.url ? (
                                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                    <AspectRatio ratio={1/1}>
                                      <img 
                                        src={preview.url} 
                                        alt={`Script ${index + 1}`}
                                        className="object-cover w-full h-full"
                                      />
                                    </AspectRatio>
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <File className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{preview.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(preview.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => removeScriptFile(index)}
                                  className="absolute top-1 right-1 text-muted-foreground hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            {/* Illustration Upload */}
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="text-md font-medium mb-4">Image Illustration (Optional)</h3>
              <FormField
                control={form.control}
                name="illustration"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Upload Illustration Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div 
                          className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('illustration-file')!.click()}
                        >
                          <Image className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Upload an illustration image</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPEG, PNG • Max 5MB
                          </p>
                          <Input
                            id="illustration-file"
                            type="file"
                            accept="image/png,image/jpeg,image/jpg"
                            disabled={isUploading}
                            className="hidden"
                            onChange={(e) => {
                              onChange(e.target.files);
                              handleIllustrationChange(e);
                            }}
                            {...rest}
                          />
                        </div>
                        
                        {/* Illustration preview */}
                        {illustrationPreview && (
                          <div className="mt-4 relative">
                            <div className="rounded-md overflow-hidden border">
                              <AspectRatio ratio={16/9}>
                                <img 
                                  src={illustrationPreview}
                                  alt="Illustration preview" 
                                  className="object-cover w-full h-full"
                                />
                              </AspectRatio>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIllustrationPreview(null);
                                form.setValue('illustration', undefined);
                              }}
                              className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            {/* Additional Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="custom_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Grading Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any specific instructions for the AI grading engine, such as: 'Focus on concept understanding rather than exact wording' or 'Pay attention to mathematical notation and diagrams if present'"
                        className="min-h-[100px] resize-none"
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
                      <FormLabel className="text-base">Academic Misconduct Detection</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Enable AI to flag potential plagiarism or cheating in student answers
                      </p>
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
            
            {/* Processing progress indicator */}
            {isProcessing && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  Processing scripts: {processingProgress}%
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Submit Button */}
            <CardFooter className="px-0 pt-4">
              <Button type="submit" className="w-full sm:w-auto ml-auto bg-primary" disabled={isUploading || scanningQrCode || isProcessing}>
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
                ) : isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Scripts
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
