import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, ChevronLeft, File, Edit } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import { getExaminationById, getQuestionsByExamination } from '@/services/dataService';
import { QuestionForm } from '@/components/questions/QuestionForm';

const QuestionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const examinationId = searchParams.get('examinationId');

  const {
    data: examination,
    isLoading: isLoadingExamination,
  } = useQuery({
    queryKey: ['examination', examinationId],
    queryFn: () => examinationId ? getExaminationById(examinationId) : Promise.resolve(null),
    enabled: !!examinationId
  });

  const {
    data: questions,
    isLoading: isLoadingQuestions,
    isError,
    refetch: refetchQuestions
  } = useQuery({
    queryKey: ['questions', examinationId],
    queryFn: () => examinationId ? getQuestionsByExamination(examinationId) : Promise.resolve([]),
    enabled: !!examinationId
  });

  useEffect(() => {
    if (!examinationId) {
      navigate('/examinations');
    }
  }, [examinationId, navigate]);

  const handleCreateSuccess = () => {
    setIsFormOpen(false);
    refetchQuestions();
    toast({
      title: "Question Created",
      description: "Your new question has been successfully created"
    });
  };

  const filteredQuestions = questions?.filter(question => 
    question.question_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!examinationId) {
    return null;
  }

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
              {examination ? `Questions: ${examination.name}` : 'Questions'}
            </h1>
            <p className="text-gray-500">Create and manage questions for this examination.</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-scriptsense-primary hover:bg-blue-800">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Question</DialogTitle>
              </DialogHeader>
              {examinationId && (
                <QuestionForm 
                  examinationId={examinationId}
                  onSuccess={handleCreateSuccess}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Question Management</CardTitle>
            <CardDescription>
              Create questions, model answers, and set grading criteria.
            </CardDescription>
            <div className="flex items-center space-x-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search questions..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingExamination || isLoadingQuestions ? (
              <Loading text="Loading questions..." />
            ) : isError ? (
              <div className="text-center py-10 text-red-500">
                <p>Failed to load questions. Please try again later.</p>
              </div>
            ) : filteredQuestions && filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <Card key={question.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-2">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="text-base font-medium mb-1">
                            {question.question_text}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{question.marks} points</Badge>
                            <Badge variant="outline">
                              Tolerance: {Math.round(question.tolerance * 100)}%
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            toast({
                              title: "Edit Feature",
                              description: "Question editing will be available soon."
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">MODEL ANSWER:</p>
                        <div className="bg-muted p-3 rounded-md text-sm">
                          {question.model_answer}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Source: {question.model_answer_source === 'ai_generated' ? 'AI Generated' : 'Manually Uploaded'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No questions found for this examination. Add your first question to get started.</p>
                <Button 
                  onClick={() => setIsFormOpen(true)} 
                  className="mt-4 bg-scriptsense-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QuestionsPage;
