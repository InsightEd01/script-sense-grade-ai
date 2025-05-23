import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Search, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getStudents, createStudent, deleteStudent } from '@/services/dataService';
import { Student } from '@/types/supabase';
import { Loading } from '@/components/ui/loading';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const studentFormSchema = z.object({
  name: z.string().min(2, { message: 'Student name must be at least 2 characters' }),
  unique_student_id: z.string().min(2, { message: 'Student ID must be at least 2 characters' }),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const StudentsPage = () => {
  const { user, schoolId } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);

  useEffect(() => {
    // Check if the teacher record exists for the current user
    const checkTeacherRecord = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('teachers')
          .select('id, school_id') // Make sure to fetch school_id as well
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking teacher record:', error);
          // If teacher record doesn't exist, create it
          if (error.code === 'PGRST116') {
            const { data: userData } = await supabase
              .from('users')
              .select('role, email, school_id')
              .eq('id', user.id)
              .single();
            
            if (userData && userData.role === 'teacher') {
              // Ensure we have a school_id from the user record
              if (!userData.school_id) {
                toast({
                  variant: "destructive",
                  title: "School Association Missing",
                  description: "You need to be associated with a school. Please contact your administrator.",
                });
                return;
              }
              
              const { error: insertError } = await supabase
                .from('teachers')
                .insert({
                  id: user.id,
                  name: userData.email.split('@')[0], // Use email prefix as name if not available
                  school_id: userData.school_id // Include required school_id
                });
              
              if (!insertError) {
                setTeacherId(user.id);
              } else {
                console.error('Failed to create teacher record:', insertError);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Failed to create teacher record. Please contact your administrator.",
                });
              }
            }
          }
        } else if (data) {
          setTeacherId(data.id);
        }
      }
    };
    
    checkTeacherRecord();
  }, [user, toast]);

  const { 
    data: students,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    enabled: !!user
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: '',
      unique_student_id: '',
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    if (!user || !teacherId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in as a teacher to create a student",
      });
      return;
    }
    
    try {
      await createStudent({
        teacher_id: teacherId,
        name: data.name,
        unique_student_id: data.unique_student_id,
      });
      
      setIsFormOpen(false);
      form.reset();
      refetch();
      
      toast({
        title: "Student Created",
        description: "The student has been successfully added",
      });
    } catch (error) {
      console.error('Failed to create student:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create student. Please try again.",
      });
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      await deleteStudent(id);
      refetch();
      toast({
        title: "Student Deleted",
        description: "The student has been removed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete student. Try again later.",
      });
    }
  };
  
  const filteredStudents = students?.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.unique_student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Students</h1>
            <p className="text-gray-500">Manage your students and their information.</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-stylus-primary hover:bg-blue-800">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unique_student_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ST12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-stylus-primary">
                      Add Student
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Student Management</CardTitle>
            <CardDescription>
              View and manage all students associated with your account.
            </CardDescription>
            <div className="flex items-center space-x-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading text="Loading students..." />
            ) : isError ? (
              <div className="text-center py-10 text-red-500">
                <p>Failed to load students. Please try again later.</p>
              </div>
            ) : filteredStudents && filteredStudents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.unique_student_id}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
                                handleDeleteStudent(student.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No students found. Add your first student to get started.</p>
                <Button 
                  onClick={() => setIsFormOpen(true)} 
                  className="mt-4 bg-stylus-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add First Student
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StudentsPage;
