
import { useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QuestionsList from "@/components/questions/QuestionsList";
import QuestionForm from "@/components/questions/QuestionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const QuestionsPage = () => {
  const { examinationId } = useParams();

  if (!examinationId) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Please select an examination first</h1>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Questions Management</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionForm examinationId={examinationId} />
            <Separator className="my-6" />
            <QuestionsList examinationId={examinationId} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default QuestionsPage;
