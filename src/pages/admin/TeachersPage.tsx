import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, Search, Trash2, UserPlus, Pencil } from 'lucide-react';
import { getTeachers, deleteTeacher, updateTeacher } from '@/services/dataService';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TeacherWithUser {
  id: string;
  name: string;
  admin_id?: string;
  users?: {
    email: string;
  } | null;
}

const TeachersPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { signUp, user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState('');

  const { data: teachers, isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers
  });

  const updateTeacherMutation = useMutation({
    mutationFn: (data: { id: string; name: string }) => updateTeacher(data.id, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['teachers']});
      toast({
        title: "Teacher updated",
        description: "The teacher has been successfully updated.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update teacher: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['teachers']});
      toast({
        title: "Teacher deleted",
        description: "The teacher has been successfully deleted.",
      });
      setIsDeleteAlertOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete teacher: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  });

  const handleAddTeacher = async () => {
    if (!name.trim() || !email.trim() || !password || password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Please check all required fields and password confirmation.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({ email, password, role: 'teacher', name });
      
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Teacher added successfully",
      });
      
      queryClient.invalidateQueries({queryKey: ['teachers']});
    } catch (error) {
      console.error('Add teacher error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to add teacher',
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setSelectedTeacherId(id);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTeacherId) {
      deleteTeacherMutation.mutate(selectedTeacherId);
    }
  };

  const handleEditClick = (teacher: TeacherWithUser) => {
    setSelectedTeacherId(teacher.id);
    setEditName(teacher.name);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTeacher = async () => {
    if (!selectedTeacherId || !editName.trim()) {
      toast({
        title: "Validation Error",
        description: "Teacher name is required",
        variant: "destructive"
      });
      return;
    }

    updateTeacherMutation.mutate({ id: selectedTeacherId, name: editName });
  };

  // Filter teachers by current admin
  const filteredTeachers = teachers?.filter((teacher: TeacherWithUser) => {
    const matchesSearch = teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.users?.email && teacher.users.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const belongsToAdmin = user && (!teacher.admin_id || teacher.admin_id === user.id);
    return matchesSearch && belongsToAdmin;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
            <p className="text-gray-500">Manage teacher accounts and permissions.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-scriptsense-primary hover:bg-blue-800">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new teacher account. They will receive access to manage students, subjects, and examinations.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirm-password" className="text-right">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddTeacher} 
                  disabled={isSubmitting}
                  className="bg-scriptsense-primary hover:bg-blue-800"
                >
                  {isSubmitting ? <Loading size="sm" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  Add Teacher
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Teacher Management</CardTitle>
            <CardDescription>
              View and manage all teacher accounts in the system.
            </CardDescription>
            <div className="flex items-center space-x-2 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search teachers..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">
                <Loading text="Loading teachers..." />
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">
                <p>Error loading teachers. Please try again.</p>
                <pre className="mt-2 text-xs overflow-auto max-w-full">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </pre>
              </div>
            ) : filteredTeachers && filteredTeachers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher: TeacherWithUser) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>{teacher.users?.email}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(teacher)}
                          className="hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(teacher.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No teachers found.</p>
                {searchTerm && (
                  <p className="text-muted-foreground text-sm mt-2">
                    Try adjusting your search terms.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update the teacher's information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateTeacher}
              className="bg-scriptsense-primary hover:bg-blue-800"
            >
              Update Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the teacher account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default TeachersPage;
