
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { PlusCircle, Search, Edit, Trash2, Pen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loading } from '@/components/ui/loading';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSubjects, createSubject, deleteSubject } from '@/services/dataService';
import { Subject } from '@/types/supabase';
import { SubjectForm } from '@/components/subjects/SubjectForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const SubjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { 
    data: subjects,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
    enabled: !!user
  });
  
  const handleCreateSuccess = () => {
    setIsFormOpen(false);
    refetch();
    toast({
      title: "Subject Created",
      description: "Your new subject has been successfully created",
    });
  };
  
  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteSubject(id);
      refetch();
      toast({
        title: "Subject Deleted",
        description: "The subject has been removed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subject. Try again later.",
      });
    }
  };
  
  const filteredSubjects = subjects?.filter(subject => 
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
            <p className="text-gray-500">Manage your academic subjects and courses.</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="bg-scriptsense-primary hover:bg-blue-800">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
              </DialogHeader>
              <SubjectForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Subject Management</CardTitle>
            <CardDescription>
              Create and manage subjects for your examinations.
            </CardDescription>
            <div className="flex items-center space-x-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search subjects..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loading text="Loading subjects..." />
            ) : isError ? (
              <div className="text-center py-10 text-red-500">
                <p>Failed to load subjects. Please try again later.</p>
              </div>
            ) : filteredSubjects && filteredSubjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map((subject) => (
                  <Card key={subject.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 p-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{subject.name}</CardTitle>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => navigate(`/examinations?subjectId=${subject.id}`)}
                          >
                            <Pen className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${subject.name}?`)) {
                                handleDeleteSubject(subject.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                        {subject.description || "No description provided"}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Link to={`/examinations?subjectId=${subject.id}`}>
                          <Button size="sm">View Examinations</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No subjects found. Create your first subject to get started.</p>
                <Button 
                  onClick={() => setIsFormOpen(true)} 
                  className="mt-4 bg-scriptsense-primary"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create First Subject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubjectsPage;
