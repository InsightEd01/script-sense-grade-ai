
import { useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Trash } from "lucide-react";
import { getQuestionsByExamination, deleteQuestion } from "@/services/dataService";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface QuestionsListProps {
  examinationId: string;
}

const QuestionsList = ({ examinationId }: QuestionsListProps) => {
  const { toast } = useToast();
  
  const { data: questions, isLoading, refetch } = useQuery({
    queryKey: ['questions', examinationId],
    queryFn: () => getQuestionsByExamination(examinationId),
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteQuestion(id);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!questions?.length) {
    return (
      <div className="text-center p-4">
        No questions added yet.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Question</TableHead>
          <TableHead>Marks</TableHead>
          <TableHead>Tolerance</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((question) => (
          <TableRow key={question.id}>
            <TableCell className="max-w-md truncate">{question.question_text}</TableCell>
            <TableCell>{question.marks}</TableCell>
            <TableCell>{question.tolerance}</TableCell>
            <TableCell>{question.model_answer_source}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(question.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default QuestionsList;
