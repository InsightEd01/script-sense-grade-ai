import { useState } from 'react';
import type { Row } from '@tanstack/react-table';
import { Building2, Search, Users, Settings, Pencil, Eye, Trash2, PlusCircle } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '../../hooks/use-toast';
import { createSchool, getSchools, updateSchool, deleteSchool } from '../../services/schoolService';
import type { School } from '../../types/school.types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ColorPicker } from '../../components/ui/color-picker';

type SchoolRow = Row<School>;

export interface CreateSchoolRequest {
  name: string;
  address: string;
  maxTeachers?: number;
  maxStudents?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export interface UpdateSchoolRequest extends CreateSchoolRequest {
  id: string;
}

interface FormData {
  name: string;
  address: string;
  primaryColor: string;
  secondaryColor: string;
  maxTeachers: number;
  maxStudents: number;
}

export function SchoolsPage() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#818cf8',
    maxTeachers: 50,
    maxStudents: 1000,
  });

  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  const createSchoolMutation = useMutation({
    mutationFn: createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'School created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create school',
        variant: 'destructive',
      });
    },
  });

  const updateSchoolMutation = useMutation({
    mutationFn: (school: School) => updateSchool(school.id, {
      id: school.id,
      name: school.name,
      address: school.address || '',
      maxTeachers: school.maxTeachers,
      maxStudents: school.maxStudents,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      toast({
        title: 'Success',
        description: 'School updated successfully',
      });
    },
  });

  const deleteSchoolMutation = useMutation({
    mutationFn: deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setViewMode('list');
      toast({
        title: 'Success',
        description: 'School deleted successfully',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      primaryColor: '#4f46e5',
      secondaryColor: '#818cf8',
      maxTeachers: 50,
      maxStudents: 1000,
    });
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'School Name',
      cell: ({ row }: { row: SchoolRow }) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Address',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: SchoolRow }) => (
        <Badge variant={row.getValue('status') === 'active' ? 'success' : 'secondary'}>
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created At',
      cell: ({ row }: { row: SchoolRow }) => {
        return new Date(row.getValue('created_at')).toLocaleDateString();
      },
    },
    {
      id: 'actions',
      cell: ({ row }: { row: SchoolRow }) => {
        const school = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setSelectedSchool(school);
                setViewMode('details');
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setSelectedSchool(school);
                setFormData({
                  name: school.name,
                  address: school.address || '',
                  primaryColor: school.primaryColor || '#4f46e5',
                  secondaryColor: school.secondaryColor || '#818cf8',
                  maxTeachers: school.maxTeachers || 50,
                  maxStudents: school.maxStudents || 1000,
                });
                setOpen(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-red-500"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this school?')) {
                  deleteSchoolMutation.mutate(school.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filteredSchools = schools?.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (school.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  if (viewMode === 'details' && selectedSchool) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight">{selectedSchool.name}</h2>
              <p className="text-muted-foreground">{selectedSchool.address}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewMode('list')}>
                Back to List
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this school?')) {
                    deleteSchoolMutation.mutate(selectedSchool.id);
                  }
                }}
              >
                Delete School
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSchool.studentCount || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSchool.teacherCount || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedSchool.storageUsed || '0 GB'}</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage teachers and students in this school
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* User management content */}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>School Settings</CardTitle>
                  <CardDescription>
                    Configure school-specific settings and appearance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label>School Name</Label>
                      <Input
                        value={selectedSchool.name}
                        onChange={(e) =>
                          updateSchoolMutation.mutate({
                            ...selectedSchool,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <ColorPicker
                        value={selectedSchool.primaryColor || '#4f46e5'}
                        onChange={(color) =>
                          updateSchoolMutation.mutate({
                            ...selectedSchool,
                            primaryColor: color,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <ColorPicker
                        value={selectedSchool.secondaryColor || '#818cf8'}
                        onChange={(color) =>
                          updateSchoolMutation.mutate({
                            ...selectedSchool,
                            secondaryColor: color,
                          })
                        }
                      />
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Schools</h2>
            <p className="text-muted-foreground">
              Manage all schools in the system
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedSchool ? 'Edit School' : 'Add New School'}</DialogTitle>
                <DialogDescription>
                  {selectedSchool ? 'Edit school details' : 'Create a new school in the system'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedSchool) {
                  updateSchoolMutation.mutate({ ...selectedSchool, ...formData });
                } else {
                  createSchoolMutation.mutate(formData);
                }
              }}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">School Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter school address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxTeachers">Maximum Teachers</Label>
                    <Input
                      id="maxTeachers"
                      type="number"
                      value={formData.maxTeachers}
                      onChange={(e) => setFormData({ ...formData, maxTeachers: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents">Maximum Students</Label>
                    <Input
                      id="maxStudents"
                      type="number"
                      value={formData.maxStudents}
                      onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Theme Colors</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Primary</Label>
                        <ColorPicker
                          value={formData.primaryColor}
                          onChange={(color) => setFormData({ ...formData, primaryColor: color })}
                        />
                      </div>
                      <div>
                        <Label>Secondary</Label>
                        <ColorPicker
                          value={formData.secondaryColor}
                          onChange={(color) => setFormData({ ...formData, secondaryColor: color })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createSchoolMutation.isPending || updateSchoolMutation.isPending}
                  >
                    {createSchoolMutation.isPending || updateSchoolMutation.isPending
                      ? 'Saving...'
                      : selectedSchool
                      ? 'Save Changes'
                      : 'Create School'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredSchools || []}
          isLoading={isLoading}
        />
      </div>
    </DashboardLayout>
  );
}
