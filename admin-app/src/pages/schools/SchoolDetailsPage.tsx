import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getSchoolById } from '@/services/masterAdminService';
import type { School } from '@/services/masterAdminService';
import { useSchool } from '@/contexts/SchoolContext';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SchoolAnalytics } from '@/components/analytics/SchoolAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function Loading({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 h-40">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function SchoolDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { setSelectedSchool } = useSchool();

  const { data: school, isLoading } = useQuery<School, Error>({
    queryKey: ['school', id],
    queryFn: () => getSchoolById(id!),
    enabled: !!id
  });

  React.useEffect(() => {
    if (school) {
      setSelectedSchool(school);
    }
  }, [school, setSelectedSchool]);

  if (isLoading || !school) {
    return <Loading text="Loading school details..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{school.name}</h1>
          <p className="text-gray-500">Domain: {school.domain}</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>School Overview</CardTitle>
              <CardDescription>
                Analytics and performance metrics for {school.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolAnalytics school={school} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage administrators and users for {school.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* User management will be implemented here */}
              <p>User management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>School Settings</CardTitle>
              <CardDescription>
                Configure settings and preferences for {school.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Settings will be implemented here */}
              <p>Settings management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
