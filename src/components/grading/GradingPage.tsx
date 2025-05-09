
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { 
  Upload, 
  Search, 
  ChevronLeft, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Flag, 
  EyeIcon, 
  Trash2,
  Play,
  RefreshCcw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getExaminationsBySubject, 
  getAnswerScriptsByExamination, 
  getStudents, 
  deleteAnswerScript 
} from '@/services/dataService';
import { supabase } from '@/integrations/supabase/client';
import { Examination, AnswerScript, Answer, Question } from '@/types/supabase';
import { format } from 'date-fns';
import { UploadScriptForm } from '@/components/grading/UploadScriptForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SegmentationDetails, SegmentationEditor } from '@/components/grading/Segmentation';

const GradingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState<Examination | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState<{ [key: string]: boolean }>({});
  const [extractedTexts, setExtractedTexts] = useState<{ [key: string]: string }>({});
  const [cancellingScripts, setCancellingScripts] = useState<{ [key: string]: boolean }>({});
  const [gradingResults, setGradingResults] = useState<{ [key: string]: any }>({});
  const [showResults, setShowResults] = useState<{ [key: string]: boolean }>({});
  const [showSegmentationEditor, setShowSegmentationEditor] = useState<{ [key: string]: boolean }>({});
  const [answersByScript, setAnswersByScript] = useState<{ [key: string]: Answer[] }>({});
  const [isRegrading, setIsRegrading] = useState<{ [key: string]: boolean }>({});
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(location.search);
  const examinationId = searchParams.get('examinationId');

  const { 
    data: examinations,
    isLoading: isLoadingExaminations
  } = useQuery({
    queryKey: ['all_examinations'],
    queryFn: async () => {
      try {
        const allSubjects = await getExaminationsBySubject('all');
        return allSubjects;
      } catch (error) {
        console.error('Error fetching examinations:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load examinations. Please try again.",
        });
        return [];
      }
    },
    enabled: !!user
  });

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

  const {
    data: students,
    isLoading: isLoadingStudents
  } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    enabled: !!user
  });

  useEffect(() => {
    if (examinationId && examinations) {
      const examination = examinations.find(e => e.id === examinationId);
      if (examination) {
        setSelectedExamination(examination);
      }
    }
  }, [examinationId, examinations]);

  useEffect(() => {
    if (answerScripts) {
      const scriptsToLoad = answerScripts.filter(script => 
        ['ocr_complete', 'grading_pending', 'grading_complete'].includes(script.processing_status)
      );
      
      scriptsToLoad.forEach(script => {
        if (!extractedTexts[script.id]) {
          fetchExtractedText(script.id);
        }
        
        // For scripts that are already complete, fetch answer details
        if (script.processing_status === 'grading_complete' || script.processing_status === 'ocr_complete') {
          fetchAnswerDetails(script.id);
        }
      });
    }
  }, [answerScripts]);

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
      setIsProcessing(prev => ({ ...prev, [scriptId]: true }));
      
      const script = answerScripts?.find(s => s.id === scriptId);
      if (!script) {
        throw new Error('Script not found');
      }
      
      const { data, error } = await supabase.functions.invoke('process-ocr', {
        body: {
          answerScriptId: scriptId,
          imageUrl: script.script_image_url
        }
      });
      
      if (error) {
        throw error;
      }
      
      // Fetch answer details after processing
      await fetchAnswerDetails(scriptId);
      
      refetchScripts();
      toast({
        title: "Processing Complete",
        description: data?.message || "The answer script has been processed successfully.",
      });
    } catch (error) {
      console.error('Error processing script:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the script. Please try again.",
      });
    } finally {
      setIsProcessing(prev => ({ ...prev, [scriptId]: false }));
    }
  };

  const fetchExtractedText = async (scriptId: string) => {
    if (extractedTexts[scriptId]) return;
    
    try {
      const { data, error } = await supabase
        .from('answer_scripts')
        .select('full_extracted_text')
        .eq('id', scriptId)
        .maybeSingle();
        
      if (error) throw error;
      
      if (data && data.full_extracted_text) {
        setExtractedTexts(prev => ({ ...prev, [scriptId]: data.full_extracted_text }));
      }
    } catch (error) {
      console.error('Error fetching extracted text:', error);
    }
  };

  const fetchAnswerDetails = async (scriptId: string) => {
    try {
      console.log('Fetching answer details for script:', scriptId);
      
      const { data, error } = await supabase
        .from('answers')
        .select('*, question:questions(*)')
        .eq('answer_script_id', scriptId)
        .order('question:questions(created_at)');
        
      if (error) {
        console.error('Error in query:', error);
        throw error;
      }
      
      if (data) {
        console.log('Received answer details:', data.length, 'answers');
        
        // Properly cast the data to Answer[] type
        const typedAnswers = data as unknown as Answer[];
        
        setAnswersByScript(prev => ({ 
          ...prev, 
          [scriptId]: typedAnswers 
        }));
        
        // If this is a graded script, also update the grading results
        if (answerScripts?.find(s => s.id === scriptId)?.processing_status === 'grading_complete') {
          setGradingResults(prev => ({ ...prev, [scriptId]: typedAnswers }));
          setShowResults(prev => ({ ...prev, [scriptId]: true }));
        }
      }
    } catch (error) {
      console.error('Error fetching answer details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch answer details. Please try refreshing the page.",
      });
    }
  };

  const handleGradeScript = async (scriptId: string) => {
    try {
      setIsProcessing(prev => ({ ...prev, [scriptId]: true }));
      
      const { data, error } = await supabase.functions.invoke('grade-answers', {
        body: {
          answerScriptId: scriptId,
          customInstructions: customInstructions || undefined
        }
      });
      
      if (error) {
        throw error;
      }
      
      refetchScripts();
      
      // Fetch grading results
      await fetchAnswerDetails(scriptId);
      
      toast({
        title: "Grading Complete",
        description: "The answer script has been graded successfully.",
      });
    } catch (error) {
      console.error('Error grading script:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to grade the script. Please try again.",
      });
    } finally {
      setIsProcessing(prev => ({ ...prev, [scriptId]: false }));
    }
  };

  const handleStartGrading = async (scriptId: string) => {
    try {
      const script = answerScripts?.find(s => s.id === scriptId);
      if (!script) {
        throw new Error('Script not found');
      }
      
      if (script.processing_status === 'uploaded') {
        // If script is not processed yet, run OCR first
        await handleProcessScript(scriptId);
      }
      
      // Then grade the script
      await handleGradeScript(scriptId);
    } catch (error) {
      console.error('Error starting grading process:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to complete the grading process. Please try again.",
      });
    }
  };

  // Add new function for regrading
  const handleRegradeScript = async (scriptId: string) => {
    try {
      setIsRegrading(prev => ({ ...prev, [scriptId]: true }));
      
      // First, let's make sure we have the latest segmented answers
      await fetchAnswerDetails(scriptId);
      
      // Then, trigger the grading process
      await handleGradeScript(scriptId);
      
      toast({
        title: "Regrading Complete",
        description: "The answer script has been regraded successfully."
      });
    } catch (error) {
      console.error('Error regrading script:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to regrade the script. Please try again.",
      });
    } finally {
      setIsRegrading(prev => ({ ...prev, [scriptId]: false }));
    }
  };

  const handleToggleResults = (scriptId: string) => {
    setShowResults(prev => ({ ...prev, [scriptId]: !prev[scriptId] }));
  };

  const handleCancelProcessing = async (scriptId: string) => {
    try {
      setCancellingScripts(prev => ({ ...prev, [scriptId]: true }));
      
      const { error } = await supabase
        .from('answer_scripts')
        .update({ processing_status: 'error' })
        .eq('id', scriptId);

      if (error) throw error;

      refetchScripts();
      toast({
        title: "Processing Cancelled",
        description: "The script processing has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling processing:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel processing. Please try again.",
      });
    } finally {
      setCancellingScripts(prev => ({ ...prev, [scriptId]: false }));
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    try {
      await deleteAnswerScript(scriptId);
      refetchScripts();
      toast({
        title: "Script Deleted",
        description: "The answer script has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting script:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete the script. Please try again.",
      });
    }
  };

  const getStatusBadge = (status: string, flags?: string[]) => {
    const hasMisconductFlags = flags && flags.length > 0;
    
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
        return (
          <div className="flex gap-2">
            <Badge variant="outline"><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Graded</Badge>
            {hasMisconductFlags && (
              <Badge variant="destructive"><Flag className="mr-1 h-3 w-3" /> Misconduct Flags</Badge>
            )}
          </div>
        );
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

  const handleToggleSegmentationEditor = (scriptId: string) => {
    setShowSegmentationEditor(prev => {
      const newState = { ...prev };
      newState[scriptId] = !newState[scriptId];
      
      if (newState[scriptId] && !answersByScript[scriptId]) {
        fetchAnswerDetails(scriptId);
      }
      
      return newState;
    });
  };

  const handleAnswerUpdate = (scriptId: string, updatedAnswer: Answer) => {
    setAnswersByScript(prev => {
      const currentAnswers = prev[scriptId] || [];
      const updatedAnswers = currentAnswers.map(answer => 
        answer.id === updatedAnswer.id ? updatedAnswer : answer
      );
      
      return { 
        ...prev, 
        [scriptId]: updatedAnswers 
      };
    });
    
    toast({
      title: "Answer Updated",
      description: "The answer text has been updated successfully.",
    });
  };

  const renderActionButtons = (script: any) => {
    return (
      <div className="space-x-2">
        {script.processing_status === 'grading_complete' && (
          <Button 
            size="sm" 
            className="bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => handleRegradeScript(script.id)}
            disabled={isRegrading[script.id]}
          >
            {isRegrading[script.id] ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-1 h-4 w-4" />
            )}
            Regrade
          </Button>
        )}
        
        {(script.processing_status === 'uploaded' || 
          script.processing_status === 'ocr_complete') && (
          <Button 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => handleStartGrading(script.id)}
            disabled={isProcessing[script.id]}
          >
            {isProcessing[script.id] ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-1 h-4 w-4" />
            )}
            Start Grading
          </Button>
        )}
        
        {script.processing_status === 'uploaded' && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleProcessScript(script.id)}
            disabled={isProcessing[script.id]}
          >
            {isProcessing[script.id] ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Clock className="mr-1 h-4 w-4" />
            )}
            Process OCR Only
          </Button>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Script
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The answer script and all associated data will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDeleteScript(script.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => window.open(script.script_image_url, '_blank')}
        >
          View Image
        </Button>
      </div>
    );
  };

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
              <DialogContent className="sm:max-w-[650px]">
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
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Grading Instructions</CardTitle>
                <CardDescription>
                  Add custom instructions for the AI grading engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea 
                    placeholder="Enter custom instructions for grading (optional)..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    These instructions will be applied when grading scripts. Examples: "Focus on concept understanding rather than exact wording" or "Pay special attention to correct mathematical notation"
                  </p>
                </div>
              </CardContent>
            </Card>
            
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
                                  {getStatusBadge(script.processing_status, script.flags)}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Uploaded: {format(new Date(script.upload_timestamp), 'PPP')}
                                </p>
                              </div>
                              <div className="space-x-2">
                                {renderActionButtons(script)}
                              </div>
                            </div>
                            
                            {(script.processing_status === 'ocr_complete' || 
                              script.processing_status === 'grading_pending' || 
                              script.processing_status === 'grading_complete') && (
                              <div className="mt-4 space-y-2">
                                {answersByScript[script.id] && (
                                  <SegmentationDetails answers={answersByScript[script.id]} />
                                )}
                                
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleSegmentationEditor(script.id)}
                                  >
                                    {showSegmentationEditor[script.id] ? 'Hide' : 'Show'} Segmentation Editor
                                  </Button>
                                  
                                  <Collapsible className="border rounded-md p-2 bg-muted/20 w-full">
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm" className="flex items-center w-full justify-between">
                                        <span className="flex items-center">
                                          <EyeIcon className="mr-1 h-4 w-4" />
                                          View Raw Extracted Text
                                        </span>
                                        <span className="text-xs text-muted-foreground">(Click to expand)</span>
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="p-3 mt-2 bg-muted/30 rounded-md">
                                      {extractedTexts[script.id] ? (
                                        <pre className="whitespace-pre-wrap text-sm font-mono p-3 bg-muted/20 rounded overflow-auto max-h-60">
                                          {extractedTexts[script.id]}
                                        </pre>
                                      ) : (
                                        <div className="flex items-center justify-center p-4">
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                          Loading extracted text...
                                        </div>
                                      )}
                                    </CollapsibleContent>
                                  </Collapsible>
                                </div>
                                
                                {showSegmentationEditor[script.id] && (
                                  <div className="mt-4 border-t pt-4">
                                    <h4 className="font-medium mb-4">Answer Segmentation Editor</h4>
                                    
                                    {answersByScript[script.id] ? (
                                      <div className="space-y-4">
                                        {answersByScript[script.id].map((answer) => (
                                          <SegmentationEditor
                                            key={answer.id}
                                            answer={answer}
                                            question={answer.question}
                                            onUpdate={(updatedAnswer) => handleAnswerUpdate(script.id, updatedAnswer)}
                                            teacherId={user?.id}
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading answer details...
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {script.processing_status === 'grading_complete' && (
                              <div className="mt-4">
                                <Collapsible 
                                  className="border rounded-md p-2 bg-green-50"
                                  open={showResults[script.id]}
                                  onOpenChange={(open) => setShowResults(prev => ({ ...prev, [script.id]: open }))}
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="flex items-center w-full justify-between text-green-700"
                                    >
                                      <span className="flex items-center">
                                        <CheckCircle className="mr-1 h-4 w-4" />
                                        View Grading Results
                                      </span>
                                      <span className="text-xs">(Click to {showResults[script.id] ? 'hide' : 'show'})</span>
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="p-3 mt-2 bg-white rounded-md border">
                                    {gradingResults[script.id] ? (
                                      <div className="space-y-4">
                                        <h4 className="font-medium text-center">Grading Results</h4>
                                        <div className="space-y-3">
                                          {gradingResults[script.id].map((answer: any) => (
                                            <div key={answer.id} className="border-b pb-3">
                                              <p className="font-medium">Question: {answer.question?.question_text}</p>
                                              <p className="text-sm mt-1">
                                                <span className="font-medium">Score:</span> {answer.assigned_grade} / {answer.question?.marks}
                                              </p>
                                              <p className="text-sm italic mt-1">"{answer.llm_explanation}"</p>
                                              {answer.flags && answer.flags.length > 0 && (
                                                <div className="mt-2 p-2 bg-red-50 rounded-md">
                                                  <p className="text-xs font-medium text-red-700">Flags:</p>
                                                  <ul className="text-xs text-red-600 list-disc list-inside">
                                                    {answer.flags.map((flag: string, i: number) => (
                                                      <li key={i}>{flag}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 mt-2 border-t">
                                          <p className="font-medium">Total Score:</p>
                                          <p className="font-bold text-lg">
                                            {gradingResults[script.id].reduce((total: number, answer: any) => 
                                              total + (answer.assigned_grade || 0), 0).toFixed(1)} / {selectedExamination?.total_marks}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading grading results...
                                      </div>
                                    )}
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            )}
                            
                            {script.flags && script.flags.length > 0 && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm font-semibold text-red-800 flex items-center">
                                  <Flag className="h-4 w-4 mr-2" /> Potential Misconduct Flags:
                                </p>
                                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                                  {script.flags.map((flag, index) => (
                                    <li key={index}>{flag}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GradingPage;
