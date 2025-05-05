
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from '@/components/ui/use-toast';
import { getExaminationsBySubject, getAnswerScriptsByExamination, getStudents, deleteAnswerScript } from '@/services/dataService';
import { useAuth } from '@/contexts/AuthContext';
import { Examination } from '@/types/supabase';
import { UploadScriptForm } from '@/components/grading/UploadScriptForm';
import { GradingInstructions } from '@/components/grading/GradingInstructions';
import { ExaminationSelector } from '@/components/grading/ExaminationSelector';
import { ScriptList } from '@/components/grading/ScriptList';

const GradingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedExamination, setSelectedExamination] = useState<Examination | null>(null);
  const [customInstructions, setCustomInstructions] = useState('');

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

  useState(() => {
    if (examinationId && examinations) {
      const examination = examinations.find(e => e.id === examinationId);
      if (examination) {
        setSelectedExamination(examination);
      }
    }
  });

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    refetchScripts();
    toast({
      title: "Script Uploaded",
      description: "The answer script has been uploaded successfully",
    });
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

  const handleSelectExamination = (id: string) => {
    navigate(`/grading?examinationId=${id}`);
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
        
        {!examinationId && (
          <ExaminationSelector 
            examinations={examinations} 
            isLoading={isLoadingExaminations}
            onSelect={handleSelectExamination}
          />
        )}
        
        {selectedExamination && (
          <>
            <GradingInstructions 
              value={customInstructions} 
              onChange={setCustomInstructions} 
            />
            
            <ScriptList 
              scripts={answerScripts}
              isLoading={isLoadingScripts}
              customInstructions={customInstructions}
              onDelete={handleDeleteScript}
              onRefetch={() => refetchScripts()}
              onUpload={() => setIsUploadOpen(true)}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GradingPage;
