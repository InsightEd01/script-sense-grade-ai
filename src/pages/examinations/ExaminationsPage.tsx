
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, Search, ChevronLeft, Book, Calendar, CheckCircle2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/loading';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjects, getExaminationsBySubject, createExamination, deleteExamination } from '@/services/dataService';
import { Subject, Examination } from '@/types/supabase';
import { ExaminationForm } from '@/components/examinations/ExaminationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';

const ExaminationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // Get the subjectId from the URL query parameters
  const searchParams = new URLSearchParams(location.search);
  const subjectId = searchParams.get('subjectId');
  
  // Fetch all subjects
  const { 
    data: subjects,
    isLoading: isLoadingSubjects
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
    enabled: !!user
  });
  
  // Fetch examinations for the selected subject
  const {
    data: examinations,
    isLoading: isLoadingExaminations,
    isError,
    refetch: refetchExaminations
  } = useQuery({
    queryKey: ['examinations', subjectId],
    queryFn: () => subjectId ? getExaminationsBySubject(subjectId) : Promise.resolve([]),
    enabled: !!user && !!subjectId
  });
  
  // Set the selected subject based on the URL parameter
  useEffect(() => {
    if (subjectId && subjects) {
      const subject = subjects.find(s => s.id === subjectId);
      if (subject) {
        setSelectedSubject(subject);
      }
    } else if (!subjectId && subjects && subjects.length > 0) {
      // If no subject is selected, redirect to the first subject
      navigate(`/examinations?subjectId=${subjects[0].id}`);
    }
  }, [subjectId, subjects, navigate]);
  
  const handleCreateSuccess = () => {
    setIsFormOpen(false);
    refetchExaminations();
    toast({
      title: "Examination Created",
      description: "Your new examination has been successfully created",
    });
  };
  
  const handleDeleteExamination = async (id: string) => {
    try {
      await deleteExamination(id);
      refetchExaminations();
      toast({
        title: "Examination Deleted",
        description: "The examination has been removed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete examination. Try again later.",
      });
    }
  };
  
  const filteredExaminations = examinations?.filter(exam => 
    exam.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSubjectChange = (subject: Subject) => {
    navigate(`/examinations?subjectId=${subject.id}`);
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/subjects")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Subjects
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {selectedSubject ? `Examinations: ${selectedSubject.name}` : 'Examinations'}
            </h1>
            <p className="text-gray-500">Create and manage your assessments.</p>
          </div>
          {selectedSubject && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button className="bg-scriptsense-primary hover:bg-blue-800">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Examination
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Examination</DialogTitle>
                </DialogHeader>
                {selectedSubject && (
                  <ExaminationForm 
                    subjectId={selectedSubject.id} 
                    onSuccess={handleCreateSuccess} 
                  />
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {isLoadingSubjects ? (
          <Loading text="Loading subjects..." />
        ) : subjects && subjects.length > 0 ? (
          <div className="flex overflow-x-auto pb-2 space-x-2">
            {subjects.map((subject) => (
              <Button
                key={subject.id}
                variant={selectedSubject?.id === subject.id ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => handleSubjectChange(subject)}
              >
                <Book className="mr-2 h-4 w-4" />
                {subject.name}
              </Button>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">You haven't created any subjects yet.</p>
              <Button 
                onClick={() => navigate('/subjects')} 
                className="bg-scriptsense-primary"
              >
                Create Your First Subject
              </Button>
            </CardContent>
          </Card>
        )}
        
        {selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle>Examination Management</CardTitle>
              <CardDescription>
                Set up examinations with questions, model answers, and grading criteria.
              </CardDescription>
              <div className="flex items-center space-x-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search examinations..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingExaminations ? (
                <Loading text="Loading examinations..." />
              ) : isError ? (
                <div className="text-center py-10 text-red-500">
                  <p>Failed to load examinations. Please try again later.</p>
                </div>
              ) : filteredExaminations && filteredExaminations.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredExaminations.map((examination) => (
                    <Card key={examination.id}>
                      <CardHeader className="bg-muted/50 p-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-semibold">{examination.name}</CardTitle>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${examination.name}?`)) {
                                handleDeleteExamination(examination.id);
                              }
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </Button>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>
                            {examination.created_at ? format(new Date(examination.created_at), 'PPP') : 'N/A'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex items-center text-sm mb-2">
                          <Badge variant="secondary" className="mr-2">
                            {examination.total_marks} points
                          </Badge>
                        </div>
                        <div className="mt-4 flex justify-between">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/questions?examinationId=${examination.id}`)}
                          >
                            <FileText className="mr-1 h-4 w-4" />
                            Questions
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => navigate(`/grading?examinationId=${examination.id}`)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Grade Scripts
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No examinations found for this subject. Create your first examination to get started.</p>
                  <Button 
                    onClick={() => setIsFormOpen(true)} 
                    className="mt-4 bg-scriptsense-primary"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create First Examination
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

export default ExaminationsPage;
