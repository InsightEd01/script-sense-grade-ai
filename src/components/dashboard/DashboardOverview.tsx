
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, BookOpen, Pen, CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStudents, getSubjects, getExaminationsBySubject } from "@/services/dataService";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/loading";

export function DashboardOverview() {
  const { user } = useAuth();
  
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    enabled: !!user
  });
  
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
    enabled: !!user
  });
  
  const isLoading = isLoadingStudents || isLoadingSubjects;
  
  if (isLoading) {
    return <Loading className="h-40" text="Loading dashboard data..." />;
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{students?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Students in your classes
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{subjects?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Subject areas you teach
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Examinations</CardTitle>
          <Pen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {subjects?.length ? "Loading..." : "0"}
          </div>
          <p className="text-xs text-muted-foreground">
            Across all subjects
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Graded Scripts</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">--</div>
          <p className="text-xs text-muted-foreground">
            Recently processed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
