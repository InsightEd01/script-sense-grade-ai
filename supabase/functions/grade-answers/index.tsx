import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getExamination, getQuestions } from '@/services/dataService';
import { Question, Examination } from '@/types/database.types';

export default function QuestionsPage() {
  const router = useRouter();
  const { examinationId } = router.query;
  const [examination, setExamination] = useState<Examination | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (examinationId && typeof examinationId === 'string') {
      loadExamination(examinationId);
      loadQuestions(examinationId);
    }
  }, [examinationId]);

  const loadExamination = async (id: string) => {
    try {
      const exam = await getExamination(id);
      setExamination(exam);
    } catch (error) {
      console.error('Error loading examination:', error);
    }
  };

  const loadQuestions = async (id: string) => {
    try {
      const questionsList = await getQuestions(id);
      setQuestions(questionsList);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const handleAddQuestion = () => {
    router.push(`/questions/${examinationId}/add`);
  };

  const handleBack = () => {
    router.push('/examinations');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Examinations
          </Button>
          <Button onClick={handleAddQuestion} className="bg-scriptsense-primary">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{examination?.name || 'Questions'}</CardTitle>
            <CardDescription>
              Manage questions and their model answers for this examination.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question) => (
                  <Card key={question.id}>
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">{question.question_text}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Marks: {question.marks}</p>
                        <p>Model Answer Source: {question.model_answer_source}</p>
                        <div className="border-l-2 pl-4 mt-2">
                          <p className="text-xs uppercase mb-1">Model Answer:</p>
                          <p>{question.model_answer}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No questions added yet.</p>
                <Button 
                  onClick={handleAddQuestion} 
                  className="mt-4 bg-scriptsense-primary"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
