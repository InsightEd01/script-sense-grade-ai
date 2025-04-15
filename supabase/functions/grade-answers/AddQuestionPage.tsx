import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { QuestionForm } from '@/components/questions/QuestionForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AddQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { examinationId } = router.query;

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Question created successfully",
    });
    router.push(`/questions/${examinationId}`);
  };

  const handleBack = () => {
    router.push(`/questions/${examinationId}`);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Questions
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add New Question</CardTitle>
            <CardDescription>
              Create a new question and provide a model answer either manually or using AI generation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {examinationId && typeof examinationId === 'string' && (
              <QuestionForm 
                examinationId={examinationId}
                onSuccess={handleSuccess}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
