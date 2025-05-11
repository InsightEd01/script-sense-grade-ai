
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Define types for our analytics data
interface GradeDistribution {
  grade: string;
  count: number;
  fill: string;
}

interface QuestionDifficulty {
  question: string;
  avgScore: number;
  fill: string;
}

interface ExamPerformance {
  name: string;
  avgScore: number;
  passRate: number;
}

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([]);
  const [questionDifficulty, setQuestionDifficulty] = useState<QuestionDifficulty[]>([]);
  const [examPerformance, setExamPerformance] = useState<ExamPerformance[]>([]);
  
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];
  
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch grade distribution data from answers
        const { data: answerData, error: answerError } = await supabase
          .from('answers')
          .select(`
            assigned_grade,
            is_overridden,
            manual_grade,
            answer_script(
              student_id,
              examination_id,
              examination:examinations(
                subject_id,
                total_marks,
                subject:subjects(teacher_id)
              )
            )
          `)
          .eq('answer_script.examination.subject.teacher_id', user.id);
        
        if (answerError) throw answerError;
        
        // Process grade distribution
        const grades = calculateGradeDistribution(answerData);
        setGradeDistribution(grades);
        
        // Fetch question difficulty data
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select(`
            id,
            question_text,
            marks,
            examination_id,
            examination:examinations(
              subject_id,
              subject:subjects(teacher_id)
            ),
            answers:answers(
              assigned_grade,
              is_overridden,
              manual_grade
            )
          `)
          .eq('examination.subject.teacher_id', user.id);
        
        if (questionError) throw questionError;
        
        // Process question difficulty
        const questions = calculateQuestionDifficulty(questionData);
        setQuestionDifficulty(questions);
        
        // Fetch examination performance data
        const { data: examData, error: examError } = await supabase
          .from('examinations')
          .select(`
            id,
            name,
            total_marks,
            subject_id,
            subject:subjects(teacher_id),
            answer_scripts:answer_scripts(
              id,
              answers:answers(
                assigned_grade,
                is_overridden,
                manual_grade,
                question:questions(marks)
              )
            )
          `)
          .eq('subject.teacher_id', user.id);
        
        if (examError) throw examError;
        
        // Process exam performance
        const exams = calculateExamPerformance(examData);
        setExamPerformance(exams);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [user]);
  
  // Function to calculate grade distribution from answers
  const calculateGradeDistribution = (answerData: any[]): GradeDistribution[] => {
    if (!answerData || answerData.length === 0) {
      return getDefaultGradeDistribution();
    }
    
    const gradeCounts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0
    };
    
    answerData.forEach(answer => {
      // Skip answers without valid grades
      if (!answer.assigned_grade && !answer.manual_grade) return;
      
      // Get the effective grade (manual if overridden, otherwise assigned)
      const grade = answer.is_overridden ? answer.manual_grade : answer.assigned_grade;
      const totalMarks = answer.answer_script?.examination?.total_marks || 100;
      const percentage = (grade / totalMarks) * 100;
      
      // Categorize based on percentage
      if (percentage >= 90) gradeCounts.A++;
      else if (percentage >= 80) gradeCounts.B++;
      else if (percentage >= 70) gradeCounts.C++;
      else if (percentage >= 60) gradeCounts.D++;
      else gradeCounts.F++;
    });
    
    return [
      { grade: 'A', count: gradeCounts.A, fill: '#10B981' },
      { grade: 'B', count: gradeCounts.B, fill: '#3B82F6' },
      { grade: 'C', count: gradeCounts.C, fill: '#F59E0B' },
      { grade: 'D', count: gradeCounts.D, fill: '#FB923C' },
      { grade: 'F', count: gradeCounts.F, fill: '#EF4444' },
    ];
  };
  
  // Function to calculate question difficulty from question data
  const calculateQuestionDifficulty = (questionData: any[]): QuestionDifficulty[] => {
    if (!questionData || questionData.length === 0) {
      return getDefaultQuestionDifficulty();
    }
    
    return questionData
      .filter(q => q.answers && q.answers.length > 0)
      .map((question, index) => {
        const answers = question.answers;
        let totalScore = 0;
        
        // Calculate average score for this question
        answers.forEach(answer => {
          const score = answer.is_overridden ? answer.manual_grade : answer.assigned_grade;
          if (score !== null && score !== undefined) {
            totalScore += score;
          }
        });
        
        const avgScore = answers.length > 0 ? 
          (totalScore / answers.length / question.marks) * 100 : 0;
        
        return {
          question: `Q${index + 1}`,
          avgScore: Math.round(avgScore),
          fill: '#3B82F6'
        };
      })
      .slice(0, 10); // Limit to 10 questions for readability
  };
  
  // Function to calculate exam performance
  const calculateExamPerformance = (examData: any[]): ExamPerformance[] => {
    if (!examData || examData.length === 0) {
      return [];
    }
    
    return examData
      .filter(exam => exam.answer_scripts && exam.answer_scripts.length > 0)
      .map(exam => {
        let totalScore = 0;
        let passCount = 0;
        const scriptsWithAnswers = exam.answer_scripts.filter(
          script => script.answers && script.answers.length > 0
        );
        
        scriptsWithAnswers.forEach(script => {
          let scriptTotal = 0;
          
          script.answers.forEach(answer => {
            const score = answer.is_overridden ? answer.manual_grade : answer.assigned_grade;
            if (score !== null && score !== undefined) {
              scriptTotal += score;
            }
          });
          
          // Add to totals
          totalScore += scriptTotal;
          
          // Calculate if this script passed (> 60%)
          const scriptPercentage = (scriptTotal / exam.total_marks) * 100;
          if (scriptPercentage >= 60) {
            passCount++;
          }
        });
        
        const avgScore = scriptsWithAnswers.length > 0 ? 
          (totalScore / scriptsWithAnswers.length / exam.total_marks) * 100 : 0;
        
        const passRate = scriptsWithAnswers.length > 0 ?
          (passCount / scriptsWithAnswers.length) * 100 : 0;
          
        return {
          name: exam.name,
          avgScore: Math.round(avgScore),
          passRate: Math.round(passRate)
        };
      });
  };
  
  // Default data for when real data isn't available
  const getDefaultGradeDistribution = (): GradeDistribution[] => [
    { grade: 'A', count: 0, fill: '#10B981' },
    { grade: 'B', count: 0, fill: '#3B82F6' },
    { grade: 'C', count: 0, fill: '#F59E0B' },
    { grade: 'D', count: 0, fill: '#FB923C' },
    { grade: 'F', count: 0, fill: '#EF4444' },
  ];
  
  const getDefaultQuestionDifficulty = (): QuestionDifficulty[] => [
    { question: 'Q1', avgScore: 0, fill: '#3B82F6' },
    { question: 'Q2', avgScore: 0, fill: '#3B82F6' },
    { question: 'Q3', avgScore: 0, fill: '#3B82F6' },
    { question: 'Q4', avgScore: 0, fill: '#3B82F6' },
    { question: 'Q5', avgScore: 0, fill: '#3B82F6' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Visualize examination and grading data.</p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="grades" className="space-y-6">
            <TabsList>
              <TabsTrigger value="grades">Grade Distribution</TabsTrigger>
              <TabsTrigger value="questions">Question Difficulty</TabsTrigger>
              <TabsTrigger value="exams">Exam Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grades" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Grade Distribution Bar Chart */}
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
                        data={gradeDistribution}
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
                
                {/* Grade Distribution Pie Chart */}
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Grade Distribution (Pie Chart)</CardTitle>
                    <CardDescription>
                      Relative distribution of grades
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gradeDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="questions">
              {/* Question Difficulty Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Difficulty Analysis</CardTitle>
                  <CardDescription>
                    Average scores per question across examinations
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={questionDifficulty}
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
            </TabsContent>
            
            <TabsContent value="exams">
              {/* Exam Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Examination Performance</CardTitle>
                  <CardDescription>
                    Average scores and pass rates for each examination
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={examPerformance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgScore" name="Average Score (%)" fill="#3B82F6" />
                      <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
