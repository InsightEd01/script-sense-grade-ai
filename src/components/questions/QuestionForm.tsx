
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useGeminiApi } from "@/hooks/useGeminiApi";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createQuestion } from "@/services/dataService";

const questionSchema = z.object({
  question_text: z.string().min(10, "Question must be at least 10 characters long"),
  marks: z.number().min(1, "Marks must be at least 1"),
  tolerance: z.number().min(0.1).max(1.0).default(0.7),
  model_answer: z.string().min(20, "Model answer must be at least 20 characters long"),
});

type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  examinationId: string;
}

const QuestionForm = ({ examinationId }: QuestionFormProps) => {
  const { toast } = useToast();
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const { generateModelAnswer } = useGeminiApi();
  
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      tolerance: 0.7,
    },
  });

  const onSubmit = async (data: QuestionFormData) => {
    try {
      await createQuestion({
        examination_id: examinationId,
        question_text: data.question_text,
        marks: data.marks,
        tolerance: data.tolerance,
        model_answer: data.model_answer,
        model_answer_source: form.getValues("model_answer") === data.model_answer ? "uploaded" : "ai_generated",
      });

      toast({
        title: "Success",
        description: "Question created successfully",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAnswer = async () => {
    const questionText = form.getValues("question_text");
    if (!questionText) {
      toast({
        title: "Error",
        description: "Please enter a question first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAnswer(true);
    try {
      const generatedAnswer = await generateModelAnswer("General", questionText);
      form.setValue("model_answer", generatedAnswer);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate model answer",
        variant: "destructive",
      });
    }
    setIsGeneratingAnswer(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="question_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter the question text" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marks</FormLabel>
                <FormControl>
                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
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
                <FormLabel>Grading Tolerance (0.1 - 1.0)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0.1" 
                    max="1.0" 
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="model_answer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Answer</FormLabel>
              <div className="space-y-2">
                <FormControl>
                  <Textarea {...field} placeholder="Enter or generate the model answer" />
                </FormControl>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleGenerateAnswer}
                  disabled={isGeneratingAnswer}
                >
                  {isGeneratingAnswer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate AI Model Answer
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Question</Button>
      </form>
    </Form>
  );
};

export default QuestionForm;
