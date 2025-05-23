
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loading } from '@/components/ui/loading';
import { useEffect, useState } from 'react';
import { Answer } from '@/types/supabase';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const AnalyticsPage = () => {
  const [gradeDistributionData, setGradeDistributionData] = useState<any[]>([]);
  const [questionDifficultyData, setQuestionDifficultyData] = useState<any[]>([]);

  // Fetch all answer data
  const { data: answers, isLoading: isLoadingAnswers } = useQuery({
    queryKey: ['analytics_answers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('answers')
        .select(`
          *,
          question:questions(
            question_text,
            marks
          )
        `)
        .not('assigned_grade', 'is', null);

      if (error) throw error;
      return data as Answer[];
    }
  });

  // Process data for charts when answers change
  useEffect(() => {
    if (answers) {
      // Calculate grade distribution
      const gradeRanges = new Map<string, number>();
      
      answers.forEach(answer => {
        if (!answer.assigned_grade || !answer.question?.marks) return;
        
        const percentage = (answer.assigned_grade / answer.question.marks) * 100;
        let grade = 'F';
        
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';
        
        gradeRanges.set(grade, (gradeRanges.get(grade) || 0) + 1);
      });

      const distributionData = Array.from(gradeRanges.entries())
        .map(([grade, count]) => ({
          grade,
          count,
          fill: grade === 'A' ? '#10B981' : // Green
                grade === 'B' ? '#3B82F6' : // Blue
                grade === 'C' ? '#F59E0B' : // Yellow
                grade === 'D' ? '#F97316' : // Orange
                '#EF4444'  // Red for F
        }))
        .sort((a, b) => ['A', 'B', 'C', 'D', 'F'].indexOf(a.grade) - ['A', 'B', 'C', 'D', 'F'].indexOf(b.grade));

      setGradeDistributionData(distributionData);

      // Calculate question difficulty
      const questionScores = new Map<string, { total: number; count: number; text: string }>();
      
      answers.forEach(answer => {
        if (!answer.assigned_grade || !answer.question?.marks || !answer.question?.question_text) return;
        
        const questionId = answer.question_id;
        const questionText = answer.question.question_text;
        const scorePercentage = (answer.assigned_grade / answer.question.marks) * 100;
        
        const current = questionScores.get(questionId) || { total: 0, count: 0, text: questionText };
        questionScores.set(questionId, {
          total: current.total + scorePercentage,
          count: current.count + 1,
          text: questionText
        });
      });

      const difficultyData = Array.from(questionScores.entries())
        .map(([id, { total, count, text }]) => ({
          question: text.length > 20 ? text.substring(0, 20) + '...' : text,
          avgScore: Math.round(total / count),
          fill: '#3B82F6'
        }))
        .sort((a, b) => b.avgScore - a.avgScore);

      setQuestionDifficultyData(difficultyData);
    }
  }, [answers]);

  if (isLoadingAnswers) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loading text="Loading analytics data..." />
        </div>
      </DashboardLayout>
    );
  }

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
                Distribution of grades across all answers
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
                  <YAxis label={{ value: 'Number of Answers', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Number of Answers" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Question Difficulty Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Question Difficulty Analysis</CardTitle>
              <CardDescription>
                Average scores per question across all answers
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
                  <Bar dataKey="avgScore" name="Average Score (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Advanced Analytics</CardTitle>
            <CardDescription>
              Insights into answer patterns and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium mb-1">Total Answers Graded</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {answers?.length || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium mb-1">Average Score</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {answers && answers.length > 0
                      ? Math.round(
                          answers.reduce((sum, ans) => {
                            if (!ans.assigned_grade || !ans.question?.marks) return sum;
                            return sum + (ans.assigned_grade / ans.question.marks) * 100;
                          }, 0) / answers.length
                        )
                      : 0}%
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium mb-1">Passing Rate</h3>
                  <p className="text-2xl font-bold text-yellow-600">
                    {answers && answers.length > 0
                      ? Math.round(
                          (answers.filter(ans => {
                            if (!ans.assigned_grade || !ans.question?.marks) return false;
                            return (ans.assigned_grade / ans.question.marks) * 100 >= 60;
                          }).length /
                            answers.length) *
                            100
                        )
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
