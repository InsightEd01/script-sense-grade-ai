import { useQuery } from '@tanstack/react-query';
import { getSchools } from '@/services/masterAdminService';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MasterAnalytics } from '@/components/analytics/MasterAnalytics';
import { SchoolAnalytics } from '@/components/analytics/SchoolAnalytics';
import { Loading } from '@/components/ui/loading';

const MasterDashboardPage = () => {
  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loading text="Loading schools data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Master Dashboard</h1>
              <p className="text-lg text-gray-600">
                Manage and monitor all schools in the system
              </p>
            </div>
            <Link to="/schools/new">
              <Button className="bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add School
              </Button>
            </Link>
          </div>
        </div>

        <MasterAnalytics />

        {schools && schools.length > 0 ? (
          <Tabs defaultValue={schools[0].id} className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              {schools.map((school) => (
                <TabsTrigger key={school.id} value={school.id} className="text-sm">
                  {school.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {schools.map((school) => (
              <TabsContent key={school.id} value={school.id}>
                <Card>
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">{school.name}</CardTitle>
                        <CardDescription>Domain: {school.domain}</CardDescription>
                      </div>
                      <Link to={`/schools/${school.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SchoolAnalytics school={school} />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="mt-4 text-lg font-medium">No schools yet</p>
              <p className="mt-2 text-muted-foreground">
                Add your first school to start managing the platform
              </p>
              <Link to="/schools/new" className="mt-6 inline-block">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First School
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MasterDashboardPage;
