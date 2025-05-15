
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getSubjects, getStudents } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { BookOpen, Pen, Plus, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
    enabled: !!user
  });
  
  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    enabled: !!user
  });
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Welcome back
            <span className="text-scriptsense-primary"> {user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-lg text-gray-600">
            Here's what's happening with your assessments today.
          </p>
        </div>
        
        <DashboardOverview />
        
        <Tabs defaultValue="recent" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="recent" className="text-sm">Recent Activity</TabsTrigger>
            <TabsTrigger value="subjects" className="text-sm">Subjects</TabsTrigger>
            <TabsTrigger value="students" className="text-sm">Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Recent Activity</CardTitle>
                <CardDescription>
                  Your most recent examination activity and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center">
                  <Pen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No recent activity</p>
                  <p className="mt-2 text-muted-foreground">
                    Start by creating an examination or uploading answer scripts.
                  </p>
                  <Link to="/examinations" className="mt-6 inline-block">
                    <Button>
                      Create Examination
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Subjects</h2>
              <Link to="/subjects">
                <Button className="bg-scriptsense-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subject
                </Button>
              </Link>
            </div>
            
            {subjects && subjects.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="group hover:shadow-lg transition-all">
                    <CardHeader className="space-y-1">
                      <CardTitle className="flex items-center text-xl">
                        <BookOpen className="mr-2 h-5 w-5 text-scriptsense-primary" />
                        {subject.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {subject.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link to={`/examinations?subjectId=${subject.id}`}>
                        <Button variant="outline" className="w-full group-hover:bg-scriptsense-primary group-hover:text-white">
                          View Examinations
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No subjects yet</p>
                  <p className="mt-2 text-muted-foreground">
                    Create your first subject to get started with examinations.
                  </p>
                  <Link to="/subjects" className="mt-6 inline-block">
                    <Button className="bg-scriptsense-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Subject
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="students" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Students</h2>
              <Link to="/students">
                <Button className="bg-scriptsense-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </Link>
            </div>
            
            {students && students.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {students.slice(0, 6).map((student) => (
                  <Card key={student.id} className="hover:shadow-lg transition-all">
                    <CardHeader className="space-y-1">
                      <CardTitle className="flex items-center text-lg">
                        <User className="mr-2 h-4 w-4 text-scriptsense-primary" />
                        {student.name}
                      </CardTitle>
                      <CardDescription>ID: {student.unique_student_id}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium">No students yet</p>
                  <p className="mt-2 text-muted-foreground">
                    Add students to start managing their assessments.
                  </p>
                  <Link to="/students" className="mt-6 inline-block">
                    <Button className="bg-scriptsense-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Student
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
            
            {students && students.length > 6 && (
              <div className="text-center mt-6">
                <Link to="/students">
                  <Button variant="outline">
                    View all {students.length} students
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
