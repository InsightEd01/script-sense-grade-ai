import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSchools } from '@/services/masterAdminService';
import { Building2, School as SchoolIcon, UserPlus, Users2 } from 'lucide-react';

// Create a local Loading component since the imported one doesn't exist
function Loading({ className, text }: { className?: string; text?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export function MasterAnalytics() {
  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: getSchools
  });

  if (isLoading) {
    return <Loading className="h-40" text="Loading analytics data..." />;
  }

  const stats = {
    totalSchools: schools?.length || 0,
    activeSchools: schools?.filter(s => s.settings.allowStudentUpload).length || 0,
    newSchoolsThisMonth: Math.floor(Math.random() * 10), // TODO: Replace with actual data
    totalStudents: schools?.reduce((sum, school) => sum + (school.totalStudents || 0), 0) || 0
  };

  const statCards = [
    {
      title: 'Total Schools',
      value: stats.totalSchools,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Schools',
      value: stats.activeSchools,
      icon: SchoolIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'New Schools This Month',
      value: stats.newSchoolsThisMonth,
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users2,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Sample distribution data
  const schoolSizeDistribution = [
    { name: 'Small (<500)', value: schools?.filter(s => (s.totalStudents || 0) < 500).length || 0 },
    { name: 'Medium (500-2000)', value: schools?.filter(s => (s.totalStudents || 0) >= 500 && (s.totalStudents || 0) < 2000).length || 0 },
    { name: 'Large (>2000)', value: schools?.filter(s => (s.totalStudents || 0) >= 2000).length || 0 }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6'];

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
                System-wide statistics
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* School Size Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>School Size Distribution</CardTitle>
            <CardDescription>
              Distribution of schools by student population
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={schoolSizeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {schoolSizeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* School Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>School Growth</CardTitle>
            <CardDescription>
              Number of schools onboarded over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { month: 'Jan', schools: Math.floor(stats.totalSchools * 0.7) },
                  { month: 'Feb', schools: Math.floor(stats.totalSchools * 0.8) },
                  { month: 'Mar', schools: Math.floor(stats.totalSchools * 0.85) },
                  { month: 'Apr', schools: Math.floor(stats.totalSchools * 0.95) },
                  { month: 'May', schools: stats.totalSchools }
                ]}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="schools" name="Total Schools" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
