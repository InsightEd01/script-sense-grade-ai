import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSchoolById, getSchoolAdmins } from '@/services/masterAdminService';
import type { SchoolAdmin } from '@/services/masterAdminService';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useSchoolManagement } from '@/hooks/use-school-management';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

function Loading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 h-40">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function SchoolAdminsPage() {
  const { id } = useParams<{ id: string }>();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { createAdmin, removeAdmin, isCreatingAdmin, isRemovingAdmin } = useSchoolManagement();

  const { data: school, isLoading: isLoadingSchool } = useQuery({
    queryKey: ['school', id],
    queryFn: () => getSchoolById(id!)
  });

  const { data: admins, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins', id],
    queryFn: () => getSchoolAdmins(id!)
  });

  if (isLoadingSchool || isLoadingAdmins) {
    return <Loading text="Loading school admins..." />;
  }

  const handleAddAdmin = async () => {
    if (!id || !email || !password) return;

    await createAdmin({ email, password, schoolId: id });
    setIsAddDialogOpen(false);
    setEmail('');
    setPassword('');
  };

  const handleDeleteClick = (adminId: string) => {
    setSelectedAdminId(adminId);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAdminId) return;

    await removeAdmin(selectedAdminId);
    setIsDeleteAlertOpen(false);
    setSelectedAdminId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Administrators</h1>
          <p className="text-gray-500">Manage administrators for {school?.name}</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Administrator</DialogTitle>
              <DialogDescription>
                Create a new administrator account for this school
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="admin@school.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddAdmin}
                disabled={isCreatingAdmin}
              >
                {isCreatingAdmin ? "Creating..." : "Create Admin"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrator List</CardTitle>
          <CardDescription>
            All administrators for {school?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {admins && admins.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin: SchoolAdmin) => (
                  <TableRow key={admin.id}>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(admin.id)}
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
              <p className="text-muted-foreground">No administrators yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The administrator will lose access to this school.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-700"
              disabled={isRemovingAdmin}
            >
              {isRemovingAdmin ? "Removing..." : "Remove Admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
