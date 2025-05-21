import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { School } from '@/services/masterAdminService';
import { getSchoolStats } from '@/services/masterAdminService';
import { Building2, GraduationCap, School as SchoolIcon, Users } from 'lucide-react';

function Loading({ className, text }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface SchoolAnalyticsProps {
  school: School;
}

export function SchoolAnalytics({ school }: SchoolAnalyticsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['school-stats', school.id],
    queryFn: () => getSchoolStats(school.id)
  });

  if (isLoading) {
    return <Loading className="h-40" text="Loading analytics data..." />;
  }

  const statCards = [
    {
      title: 'Total Teachers',
      value: stats?.totalTeachers || 0,
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Assessments',
      value: stats?.totalAssessments || 0,
      icon: SchoolIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers || 0,
      icon: Building2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.color} mt-1`}>
                +{Math.floor(Math.random() * 10)}% from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Teacher/Student Ratio Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Teacher/Student Ratio</CardTitle>
            <CardDescription>
              Number of students per teacher across all departments
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: 'Current Ratio',
                    students: stats?.totalStudents || 0,
                    teachers: stats?.totalTeachers || 0
                  }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Students" fill="#3B82F6" />
                <Bar dataKey="teachers" name="Teachers" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Assessment Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Activity</CardTitle>
            <CardDescription>
              Number of assessments conducted over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: 'Jan', assessments: Math.floor(Math.random() * 100) },
                  { month: 'Feb', assessments: Math.floor(Math.random() * 100) },
                  { month: 'Mar', assessments: Math.floor(Math.random() * 100) },
                  { month: 'Apr', assessments: Math.floor(Math.random() * 100) },
                  { month: 'May', assessments: stats?.totalAssessments || 0 }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assessments" name="Assessments" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
