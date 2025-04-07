
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getSubjects, getStudents } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Plus, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
    enabled: !!user
  });
  
  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    enabled: !!user
  });
  
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back to scriptSense! Here's an overview of your assessment data.
          </p>
        </div>
        
        <DashboardOverview />
        
        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your most recent examination activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-muted-foreground">
                  <p>No recent activity to display.</p>
                  <p className="mt-2">Create an examination to get started.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Subjects</h3>
              <Link to="/subjects">
                <Button size="sm" className="bg-scriptsense-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Subject
                </Button>
              </Link>
            </div>
            
            {subjects && subjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 p-4">
                      <CardTitle className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        {subject.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">
                        {subject.description || "No description provided"}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <Link to={`/examinations?subjectId=${subject.id}`}>
                          <Button variant="outline" size="sm">View Examinations</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 text-muted" />
                  <p className="mt-4">No subjects created yet.</p>
                  <p className="mt-2">Create a subject to organize your examinations.</p>
                  <Link to="/subjects" className="mt-4 inline-block">
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Students</h3>
              <Link to="/students">
                <Button size="sm" className="bg-scriptsense-primary">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Student
                </Button>
              </Link>
            </div>
            
            {students && students.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {students.slice(0, 6).map((student) => (
                  <Card key={student.id}>
                    <CardHeader className="p-4">
                      <CardTitle className="flex items-center text-base">
                        <User className="mr-2 h-4 w-4" />
                        {student.name}
                      </CardTitle>
                      <CardDescription>ID: {student.unique_student_id}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <User className="mx-auto h-12 w-12 text-muted" />
                  <p className="mt-4">No students added yet.</p>
                  <p className="mt-2">Add students to associate with examinations.</p>
                  <Link to="/students" className="mt-4 inline-block">
                    <Button className="bg-scriptsense-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Student
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
            
            {students && students.length > 6 && (
              <div className="text-center mt-2">
                <Link to="/students">
                  <Button variant="link">View all {students.length} students</Button>
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
