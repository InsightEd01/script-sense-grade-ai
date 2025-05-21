import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getSchools } from '@/services/schoolService';
import {
  Building2,
  GraduationCap,
  School,
  Users,
} from 'lucide-react';

const statCards = [
  {
    title: 'Total Schools',
    icon: Building2,
    getValue: (data: any) => data?.length || 0,
    description: 'Active schools in the system',
  },
  {
    title: 'Total Admins',
    icon: Users,
    getValue: (data: any) => data?.reduce((acc: number, school: any) => acc + (school.admins?.length || 0), 0) || 0,
    description: 'School administrators',
  },
  {
    title: 'Total Teachers',
    icon: GraduationCap,
    getValue: (data: any) => data?.reduce((acc: number, school: any) => acc + (school.teachers?.length || 0), 0) || 0,
    description: 'Active teachers',
  },
  {
    title: 'Total Students',
    icon: School,
    getValue: (data: any) => data?.reduce((acc: number, school: any) => acc + (school.students?.length || 0), 0) || 0,
    description: 'Enrolled students',
  },
];

export function DashboardPage() {
  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of all schools in the system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : card.getValue(schools)}
              </div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add more dashboard components here */}
    </div>
  );
}
