
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Upload, Search, ChevronLeft, FileText, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/loading';
import { useAuth } from '@/contexts/AuthContext';
import { getExaminationsBySubject, getAnswerScriptsByExamination, getStudents } from '@/services/dataService';
import { AnswerScript, Examination, Student } from '@/types/supabase';
import { UploadScriptForm } from '@/components/grading/UploadScriptForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const GradingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState<Examination | null>(null);
  
  // Get the examinationId from the URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const examinationId = searchParams.get('examinationId');
  
  // Fetch all examinations (that the user has access to)
  const { 
    data: examinations,
    isLoading: isLoadingExaminations
  } = useQuery({
    queryKey: ['all_examinations'],
    queryFn: async () => {
      const allSubjects = await getExaminationsBySubject('all');
      return allSubjects;
    },
    enabled: !!user
  });
  
  // Fetch answer scripts for the selected examination
  const {
    data: answerScripts,
    isLoading: isLoadingScripts,
    isError,
    refetch: refetchScripts
  } = useQuery({
    queryKey: ['answer_scripts', examinationId],
    queryFn: () => examinationId ? getAnswerScriptsByExamination(examinationId) : Promise.resolve([]),
    enabled: !!user && !!examinationId
  });
  
  // Fetch all students for using in the upload form
  const {
    data: students,
    isLoading: isLoadingStudents
  } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    enabled: !!user
  });
  
  // Set the selected examination based on the URL parameter
  useEffect(() => {
    if (examinationId && examinations) {
      const examination = examinations.find(e => e.id === examinationId);
      if (examination) {
        setSelectedExamination(examination);
      }
    }
  }, [examinationId, examinations]);
  
  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    refetchScripts();
    toast({
      title: "Script Uploaded",
      description: "The answer script has been uploaded successfully",
    });
  };
  
  const handleProcessScript = async (scriptId: string) => {
    try {
      // Call the Supabase edge function to process the script
      const { data, error } = await supabase.functions.invoke('process-ocr', {
        body: {
          answerScriptId: scriptId,
          imageUrl: answerScripts?.find(s => s.id === scriptId)?.script_image_url
        }
      });
      
      if (error) {
        throw error;
      }
      
      refetchScripts();
      toast({
        title: "OCR Processing Started",
        description: "The answer script is being processed. This may take a few moments.",
      });
    } catch (error) {
      console.error('Error processing script:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the script. Please try again.",
      });
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pending OCR</Badge>;
      case 'ocr_pending':
        return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> OCR Processing</Badge>;
      case 'ocr_complete':
        return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" /> OCR Complete</Badge>;
      case 'grading_pending':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3 text-yellow-500" /> Pending Grading</Badge>;
      case 'grading_complete':
        return <Badge variant="outline"><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Graded</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Error</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" /> Unknown</Badge>;
    }
  };
  
  const filteredScripts = answerScripts?.filter(script => 
    script.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.student?.unique_student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/examinations")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Examinations
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedExamination ? `Grading: ${selectedExamination.name}` : 'Answer Scripts'}
            </h1>
            <p className="text-gray-500">Upload, process, and grade answer scripts.</p>
          </div>
          {selectedExamination && (
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-scriptsense-primary hover:bg-blue-800">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Scripts
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload Answer Script</DialogTitle>
                </DialogHeader>
                {selectedExamination && students && (
                  <UploadScriptForm 
                    examinationId={selectedExamination.id} 
                    students={students}
                    onSuccess={handleUploadSuccess} 
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {isLoadingExaminations ? (
          <Loading text="Loading examinations..." />
        ) : !examinationId && examinations && examinations.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Select an Examination</CardTitle>
              <CardDescription>
                Choose an examination to view and grade answer scripts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {examinations.map((examination) => (
                  <Card 
                    key={examination.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => navigate(`/grading?examinationId=${examination.id}`)}
                  >
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg">{examination.name}</CardTitle>
                      <CardDescription>
                        Total: {examination.total_marks} marks
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : selectedExamination && (
          <Card>
            <CardHeader>
              <CardTitle>Answer Script Management</CardTitle>
              <CardDescription>
                Process and grade student answer scripts using OCR and AI.
              </CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search by student name or ID..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingScripts ? (
                <Loading text="Loading answer scripts..." />
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  <p>Failed to load answer scripts. Please try again later.</p>
                </div>
              ) : filteredScripts && filteredScripts.length > 0 ? (
                <div className="space-y-4">
                  {filteredScripts.map((script) => (
                    <Card key={script.id} className="overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/4 p-4 bg-muted/30 flex items-center justify-center">
                          <div className="text-center">
                            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                            <h3 className="mt-2 font-medium">
                              {script.student?.name || 'Unknown Student'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              ID: {script.student?.unique_student_id || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="mb-2">
                                {getStatusBadge(script.processing_status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Uploaded: {format(new Date(script.upload_timestamp), 'PPP')}
                              </p>
                            </div>
                            <div className="space-x-2">
                              {script.processing_status === 'uploaded' && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleProcessScript(script.id)}
                                >
                                  <Clock className="mr-1 h-4 w-4" />
                                  Process with OCR
                                </Button>
                              )}
                              {script.processing_status === 'grading_complete' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => navigate(`/grading/${script.id}`)}
                                >
                                  <FileText className="mr-1 h-4 w-4" />
                                  View Results
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(script.script_image_url, '_blank')}
                              >
                                View Image
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No answer scripts found for this examination. Upload your first script to get started.</p>
                  <Button 
                    onClick={() => setIsUploadOpen(true)} 
                    className="mt-4 bg-scriptsense-primary"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload First Script
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GradingPage;
