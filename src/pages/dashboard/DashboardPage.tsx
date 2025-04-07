
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  FileText, 
  ClipboardCheck,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PlusCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const DashboardPage = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    subjects: 0,
    examinations: 0,
    scriptsToGrade: 0,
    scriptsPending: 0,
    scriptsComplete: 0,
    scriptsError: 0,
    recentExams: [],
    pendingScripts: []
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // For now we're just setting mock data
        // In a real implementation, this would fetch from Supabase
        setStats({
          students: 42,
          subjects: 5,
          examinations: 8,
          scriptsToGrade: 23,
          scriptsPending: 15,
          scriptsComplete: 120,
          scriptsError: 3,
          recentExams: [
            { id: '1', name: 'Midterm Physics 2025', created: '2025-03-15', subject: 'Physics', status: 'active', scriptCount: 28 },
            { id: '2', name: 'Final Literature Analysis', created: '2025-03-10', subject: 'Literature', status: 'complete', scriptCount: 34 },
            { id: '3', name: 'History Quiz 3', created: '2025-03-05', subject: 'History', status: 'active', scriptCount: 42 }
          ],
          pendingScripts: [
            { id: '1', student: 'Sophia Johnson', exam: 'Midterm Physics 2025', status: 'grading_pending', uploaded: '2025-03-15T10:30:00Z' },
            { id: '2', student: 'Ethan Williams', exam: 'Midterm Physics 2025', status: 'ocr_complete', uploaded: '2025-03-15T11:15:00Z' },
            { id: '3', student: 'Olivia Brown', exam: 'History Quiz 3', status: 'ocr_pending', uploaded: '2025-03-14T14:45:00Z' },
            { id: '4', student: 'Noah Martinez', exam: 'History Quiz 3', status: 'error', uploaded: '2025-03-14T15:20:00Z' }
          ]
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.id]);

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case 'complete':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Complete</span>;
      case 'draft':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Draft</span>;
      case 'grading_pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Grading Pending</span>;
      case 'ocr_complete':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">OCR Complete</span>;
      case 'ocr_pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">OCR Pending</span>;
      case 'error':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-500">Welcome back to scriptSense grading platform.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Students Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.students}</div>
              <p className="text-xs text-muted-foreground">
                Students in your classes
              </p>
            </CardContent>
          </Card>
          
          {/* Subjects Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subjects}</div>
              <p className="text-xs text-muted-foreground">
                Active subject areas
              </p>
            </CardContent>
          </Card>
          
          {/* Examinations Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Examinations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.examinations}</div>
              <p className="text-xs text-muted-foreground">
                Total active examinations
              </p>
            </CardContent>
          </Card>
          
          {/* Scripts to Grade Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scriptsToGrade}</div>
              <p className="text-xs text-muted-foreground">
                Scripts awaiting grading
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Grading Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Grading Progress</CardTitle>
            <CardDescription>
              Overview of all answer script processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Processing</p>
                    <p className="text-sm text-muted-foreground">{stats.scriptsPending} scripts</p>
                  </div>
                </div>
                <Progress value={stats.scriptsPending / (stats.scriptsPending + stats.scriptsComplete + stats.scriptsError) * 100} className="h-2 w-[60%]" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Completed</p>
                    <p className="text-sm text-muted-foreground">{stats.scriptsComplete} scripts</p>
                  </div>
                </div>
                <Progress value={stats.scriptsComplete / (stats.scriptsPending + stats.scriptsComplete + stats.scriptsError) * 100} className="h-2 w-[60%]" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Errors</p>
                    <p className="text-sm text-muted-foreground">{stats.scriptsError} scripts</p>
                  </div>
                </div>
                <Progress value={stats.scriptsError / (stats.scriptsPending + stats.scriptsComplete + stats.scriptsError) * 100} className="h-2 w-[60%]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Recent Examinations */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Examinations</CardTitle>
                <CardDescription>
                  Your recently created examinations
                </CardDescription>
              </div>
              <Link to="/examinations">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{exam.name}</p>
                      <p className="text-sm text-muted-foreground">{exam.subject} · {exam.scriptCount} scripts</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(exam.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link to="/examinations/new" className="w-full">
                <Button variant="outline" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Examination
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          {/* Pending Scripts */}
          <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Scripts</CardTitle>
                <CardDescription>
                  Scripts awaiting processing or grading
                </CardDescription>
              </div>
              <Link to="/grading">
                <Button variant="outline" size="sm">Process All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.pendingScripts.map((script) => (
                  <div key={script.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{script.student}</p>
                      <p className="text-sm text-muted-foreground">{script.exam}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(script.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Link to="/grading/upload" className="w-full">
                <Button variant="outline" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Upload Answer Scripts
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
