
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { getExaminationsBySubject } from "@/services/dataService";

const ExaminationsPage = () => {
  const { data: examinations } = useQuery({
    queryKey: ['examinations'],
    queryFn: () => getExaminationsBySubject("subject-id"), // You'll need to get the actual subject ID
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Total Marks</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {examinations?.map((exam) => (
              <TableRow key={exam.id}>
                <TableCell>{exam.name}</TableCell>
                <TableCell>{exam.total_marks}</TableCell>
                <TableCell>
                  <Button asChild>
                    <Link to={`/questions/${exam.id}`}>
                      Manage Questions
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DashboardLayout>
  );
};

export default ExaminationsPage;
