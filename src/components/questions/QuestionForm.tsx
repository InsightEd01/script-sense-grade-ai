
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw } from 'lucide-react';
import { useGeminiApi } from '@/hooks/useGeminiApi';
import { createQuestion } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
  model_answer: z.string().min(1, 'Model answer is required'),
  marks: z.coerce.number().int().positive('Marks must be a positive number'),
  tolerance: z.coerce.number().min(0.1).max(1, 'Tolerance must be between 0.1 and 1'),
  model_answer_source: z.enum(['uploaded', 'ai_generated'])
});

type QuestionFormValues = z.infer<typeof formSchema>;

interface QuestionFormProps {
  examinationId: string;
  onSuccess: () => void;
}

export const QuestionForm = ({ examinationId, onSuccess }: QuestionFormProps) => {
  const [answerTab, setAnswerTab] = useState<'manual' | 'ai'>('manual');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [generatedAnswer, setGeneratedAnswer] = useState('');
  const [generationError, setGenerationError] = useState('');
  const { generateModelAnswer } = useGeminiApi();
  const { toast } = useToast();

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: '',
      model_answer: '',
      marks: 10,
      tolerance: 0.7,
      model_answer_source: 'uploaded'
    }
  });

  const questionText = form.watch('question_text');

  const handleGenerateAnswer = async () => {
    if (!questionText.trim()) {
      setGenerationError('Please enter a question first');
      return;
    }

    try {
      setIsGeneratingAnswer(true);
      setGenerationError('');
      const answer = await generateModelAnswer(questionText);
      setGeneratedAnswer(answer);
      form.setValue('model_answer', answer);
      form.setValue('model_answer_source', 'ai_generated');
    } catch (error) {
      console.error('Error generating answer:', error);
      setGenerationError('Failed to generate answer. Please try again or enter manually.');
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const onSubmit = async (values: QuestionFormValues) => {
    try {
      // Set the model_answer_source based on which tab is active
      values.model_answer_source = answerTab === 'ai' ? 'ai_generated' : 'uploaded';
      
      await createQuestion({
        ...values,
        examination_id: examinationId
      });
      
      onSuccess();
      form.reset();
      setGeneratedAnswer('');
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: 'Error',
        description: 'Failed to create question. Please try again.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter the question text..." 
                  className="min-h-24" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Tabs value={answerTab} onValueChange={(v) => setAnswerTab(v as 'manual' | 'ai')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="ai">AI Generated</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <FormField
              control={form.control}
              name="model_answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Answer</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter the model answer..." 
                      className="min-h-32" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4">
            <div className="flex justify-between items-start mb-2">
              <FormLabel>AI Generated Model Answer</FormLabel>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={handleGenerateAnswer}
                disabled={isGeneratingAnswer || !questionText.trim()}
              >
                {isGeneratingAnswer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : generatedAnswer ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </>
                ) : (
                  'Generate Answer'
                )}
              </Button>
            </div>
            
            {generationError && (
              <Alert variant="destructive">
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="model_answer"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea 
                      placeholder={isGeneratingAnswer ? "Generating answer..." : "AI generated answer will appear here..."}
                      className="min-h-32" 
                      {...field}
                      value={field.value || generatedAnswer}
                      readOnly={isGeneratingAnswer}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marks</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tolerance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grading Tolerance (0.1-1.0)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0.1" 
                    max="1" 
                    step="0.1" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="submit">
            Create Question
          </Button>
        </div>
      </form>
    </Form>
  );
};
