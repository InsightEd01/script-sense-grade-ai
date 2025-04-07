
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AnalyticsPage = () => {
  // Mock data for charts
  const gradeDistributionData = [
    { grade: 'A', count: 15, fill: '#3B82F6' },
    { grade: 'B', count: 22, fill: '#10B981' },
    { grade: 'C', count: 18, fill: '#F59E0B' },
    { grade: 'D', count: 8, fill: '#EF4444' },
    { grade: 'F', count: 3, fill: '#6B7280' },
  ];

  const questionDifficultyData = [
    { question: 'Q1', avgScore: 85, fill: '#3B82F6' },
    { question: 'Q2', avgScore: 72, fill: '#3B82F6' },
    { question: 'Q3', avgScore: 45, fill: '#3B82F6' },
    { question: 'Q4', avgScore: 65, fill: '#3B82F6' },
    { question: 'Q5', avgScore: 78, fill: '#3B82F6' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500">Visualize examination and grading data.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Grade Distribution Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
              <CardDescription>
                Distribution of grades across all examinations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gradeDistributionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="grade" />
                  <YAxis label={{ value: 'Number of Students', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Number of Students" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Question Difficulty Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Question Difficulty Analysis</CardTitle>
              <CardDescription>
                Average scores per question across examinations
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={questionDifficultyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" />
                  <YAxis label={{ value: 'Average Score (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgScore" name="Average Score (%)" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Advanced Analytics</CardTitle>
            <CardDescription>
              Detailed insights and analytics will be displayed here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <p className="text-muted-foreground">Additional analytics features will be available here once implemented.</p>
              <p className="text-muted-foreground text-sm mt-2">This section is under development.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
