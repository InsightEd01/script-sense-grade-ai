
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { Loading } from '@/components/ui/loading';
import { supabase } from '@/lib/supabase';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { addDays, format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ExamStatsResponse {
  total_exams: number;
  total_questions: number;
  total_students: number;
  avg_score_percentage: number;
  passing_rate: number;
  subject_data: SubjectData[];
}

interface SubjectData {
  subject_name: string;
  exam_count: number;
  avg_score: number;
}

interface ScoreDistribution {
  score_range: string;
  count: number;
}

interface QuestionDifficulty {
  question_text: string;
  avg_score: number;
  max_marks: number;
}

interface ScriptScore {
  score: number;
  possible: number;
}

interface SubjectStat {
  subject_name: string;
  exam_count: number;
  total_score: number;
  total_possible: number;
}

export default function AnalyticsPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Get all subjects for filtering
  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch overall exam statistics
  const { data: examStats, isLoading: statsLoading } = useQuery({
    queryKey: ['examStats', selectedSubject, dateRange],
    queryFn: async () => {
      // In a real application, this would be a single database query with aggregations
      // Here we're simulating the results for demonstration purposes
      
      // Get exams within date range and subject filter
      let examQuery = supabase.from('examinations').select(`
        id, 
        name,
        total_marks,
        subject:subjects(name),
        created_at
      `);
      
      if (selectedSubject !== 'all') {
        examQuery = examQuery.eq('subject_id', selectedSubject);
      }
      
      if (dateRange?.from) {
        examQuery = examQuery.gte('created_at', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        examQuery = examQuery.lte('created_at', dateRange.to.toISOString());
      }
      
      const { data: exams, error: examError } = await examQuery;
      if (examError) throw examError;
      
      // Get questions for these exams
      const examIds = exams?.map(e => e.id) || [];
      const { data: questions, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .in('examination_id', examIds);
      
      if (questionError) throw questionError;
      
      // Get answer scripts for these exams
      const { data: scripts, error: scriptError } = await supabase
        .from('answer_scripts')
        .select(`
          id,
          student_id,
          processing_status,
          examination_id
        `)
        .in('examination_id', examIds);
      
      if (scriptError) throw scriptError;
      
      // Get unique students
      const uniqueStudents = new Set(scripts?.map(s => s.student_id) || []);
      
      // Get answers to calculate scores
      const scriptIds = scripts?.map(s => s.id) || [];
      const { data: answers, error: answerError } = await supabase
        .from('answers')
        .select(`
          id,
          answer_script_id,
          question_id,
          assigned_grade,
          is_overridden,
          manual_grade
        `)
        .in('answer_script_id', scriptIds);
      
      if (answerError) throw answerError;
      
      // Calculate statistics
      const totalExams = exams?.length || 0;
      const totalQuestions = questions?.length || 0;
      const totalStudents = uniqueStudents.size;
      
      // Calculate average scores
      let totalScore = 0;
      let totalPossibleScore = 0;
      let passingScripts = 0;
      const subjectStats: Record<string, SubjectStat> = {};
      
      // Group answers by script
      const scriptAnswers: Record<string, any[]> = {};
      answers?.forEach(answer => {
        if (!scriptAnswers[answer.answer_script_id]) {
          scriptAnswers[answer.answer_script_id] = [];
        }
        scriptAnswers[answer.answer_script_id].push(answer);
      });
      
      // Calculate script scores
      scripts?.forEach(script => {
        const scriptAnswersArray = scriptAnswers[script.id] || [];
        let scriptScore = 0;
        
        scriptAnswersArray.forEach(answer => {
          const score = answer.is_overridden ? answer.manual_grade : answer.assigned_grade;
          scriptScore += score || 0;
        });
        
        const exam = exams?.find(e => e.id === script.examination_id);
        if (exam) {
          totalScore += scriptScore;
          totalPossibleScore += exam.total_marks;
          
          // Count passing scripts (>= 50%)
          if (scriptScore / exam.total_marks >= 0.5) {
            passingScripts++;
          }
          
          // Aggregate by subject
          const subjectName = exam.subject?.name || 'Unknown';
          if (!subjectStats[subjectName]) {
            subjectStats[subjectName] = {
              subject_name: subjectName,
              exam_count: 0,
              total_score: 0,
              total_possible: 0
            };
          }
          
          subjectStats[subjectName].exam_count++;
          subjectStats[subjectName].total_score += scriptScore;
          subjectStats[subjectName].total_possible += exam.total_marks;
        }
      });
      
      const avgScorePercentage = totalPossibleScore > 0 
        ? (totalScore / totalPossibleScore) * 100 
        : 0;
        
      const passingRate = scripts && scripts.length > 0 
        ? (passingScripts / scripts.length) * 100 
        : 0;
      
      // Format subject data for visualization
      const subjectData = Object.values(subjectStats).map(subject => ({
        subject_name: subject.subject_name,
        exam_count: subject.exam_count,
        avg_score: subject.total_possible > 0 
          ? (subject.total_score / subject.total_possible) * 100 
          : 0
      }));
      
      return {
        total_exams: totalExams,
        total_questions: totalQuestions,
        total_students: totalStudents,
        avg_score_percentage: avgScorePercentage,
        passing_rate: passingRate,
        subject_data: subjectData
      } as ExamStatsResponse;
    }
  });

  // Fetch score distribution
  const { data: scoreDistribution, isLoading: distributionLoading } = useQuery({
    queryKey: ['scoreDistribution', selectedSubject, dateRange],
    queryFn: async () => {
      // This would be a database query with aggregations in real application
      // For demonstration, we'll create simulated data
      
      // Get exams with filters
      let examQuery = supabase.from('examinations').select(`
        id, 
        total_marks
      `);
      
      if (selectedSubject !== 'all') {
        examQuery = examQuery.eq('subject_id', selectedSubject);
      }
      
      if (dateRange?.from) {
        examQuery = examQuery.gte('created_at', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        examQuery = examQuery.lte('created_at', dateRange.to.toISOString());
      }
      
      const { data: exams, error: examError } = await examQuery;
      if (examError) throw examError;
      
      // Get scripts for these exams
      const examIds = exams?.map(e => e.id) || [];
      const { data: scripts, error: scriptError } = await supabase
        .from('answer_scripts')
        .select(`
          id,
          examination_id
        `)
        .in('examination_id', examIds);
      
      if (scriptError) throw scriptError;
      
      // Get answers to calculate scores
      const scriptIds = scripts?.map(s => s.id) || [];
      const { data: answers, error: answerError } = await supabase
        .from('answers')
        .select(`
          id,
          answer_script_id,
          question_id,
          assigned_grade,
          is_overridden,
          manual_grade,
          question:questions(marks)
        `)
        .in('answer_script_id', scriptIds);
      
      if (answerError) throw answerError;
      
      // Calculate score percentages for each script
      const scriptScores: Record<string, ScriptScore> = {};
      
      answers?.forEach(answer => {
        if (!scriptScores[answer.answer_script_id]) {
          scriptScores[answer.answer_script_id] = {
            score: 0,
            possible: 0
          };
        }
        
        const score = answer.is_overridden ? answer.manual_grade : answer.assigned_grade;
        scriptScores[answer.answer_script_id].score += score || 0;
        scriptScores[answer.answer_script_id].possible += answer.question?.marks || 0;
      });
      
      // Create distribution ranges
      const distribution: Record<string, number> = {
        "0-20%": 0,
        "21-40%": 0,
        "41-60%": 0,
        "61-80%": 0,
        "81-100%": 0
      };
      
      // Count scripts in each range
      Object.values(scriptScores).forEach(script => {
        if (script.possible === 0) return;
        
        const percentage = (script.score / script.possible) * 100;
        
        if (percentage <= 20) distribution["0-20%"]++;
        else if (percentage <= 40) distribution["21-40%"]++;
        else if (percentage <= 60) distribution["41-60%"]++;
        else if (percentage <= 80) distribution["61-80%"]++;
        else distribution["81-100%"]++;
      });
      
      // Format for visualization
      return Object.entries(distribution).map(([range, count]) => ({
        score_range: range,
        count
      }));
    }
  });

  // Fetch question difficulty data
  const { data: questionDifficulty, isLoading: questionLoading } = useQuery({
    queryKey: ['questionDifficulty', selectedSubject, dateRange],
    queryFn: async () => {
      // In a real app, this would be a complex database query
      // For demonstration, we'll get the data in multiple steps
      
      // Get exams with filters
      let examQuery = supabase.from('examinations').select(`
        id
      `);
      
      if (selectedSubject !== 'all') {
        examQuery = examQuery.eq('subject_id', selectedSubject);
      }
      
      if (dateRange?.from) {
        examQuery = examQuery.gte('created_at', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        examQuery = examQuery.lte('created_at', dateRange.to.toISOString());
      }
      
      const { data: exams, error: examError } = await examQuery;
      if (examError) throw examError;
      
      const examIds = exams?.map(e => e.id) || [];
      
      // Get questions for these exams
      const { data: questions, error: questionError } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          marks
        `)
        .in('examination_id', examIds)
        .limit(10); // Limit to 10 questions for demonstration
      
      if (questionError) throw questionError;
      
      // Get answers for these questions
      const questionIds = questions?.map(q => q.id) || [];
      const { data: answers, error: answerError } = await supabase
        .from('answers')
        .select(`
          id,
          question_id,
          assigned_grade,
          is_overridden,
          manual_grade
        `)
        .in('question_id', questionIds);
      
      if (answerError) throw answerError;
      
      // Calculate average scores for each question
      interface QuestionStat {
        question_text: string;
        max_marks: number;
        total_score: number;
        count: number;
      }
      
      const questionStats: Record<string, QuestionStat> = {};
      
      questions?.forEach(question => {
        questionStats[question.id] = {
          question_text: question.question_text,
          max_marks: question.marks,
          total_score: 0,
          count: 0
        };
      });
      
      answers?.forEach(answer => {
        if (questionStats[answer.question_id]) {
          const score = answer.is_overridden ? answer.manual_grade : answer.assigned_grade;
          questionStats[answer.question_id].total_score += score || 0;
          questionStats[answer.question_id].count++;
        }
      });
      
      // Calculate averages and format for visualization
      return Object.values(questionStats)
        .map(stat => ({
          question_text: stat.question_text,
          avg_score: stat.count > 0 ? stat.total_score / stat.count : 0,
          max_marks: stat.max_marks
        }))
        .sort((a, b) => (a.avg_score / a.max_marks) - (b.avg_score / b.max_marks));
    }
  });

  // Format data for score trends over time
  const { data: scoreTrends, isLoading: trendsLoading } = useQuery({
    queryKey: ['scoreTrends', selectedSubject, dateRange],
    queryFn: async () => {
      // Get exams with filters, ordered by date
      let examQuery = supabase.from('examinations').select(`
        id,
        name,
        total_marks,
        created_at
      `);
      
      if (selectedSubject !== 'all') {
        examQuery = examQuery.eq('subject_id', selectedSubject);
      }
      
      if (dateRange?.from) {
        examQuery = examQuery.gte('created_at', dateRange.from.toISOString());
      }
      
      if (dateRange?.to) {
        examQuery = examQuery.lte('created_at', dateRange.to.toISOString());
      }
      
      examQuery = examQuery.order('created_at');
      
      const { data: exams, error: examError } = await examQuery;
      if (examError) throw examError;
      
      // For each exam, get average score
      const examScores = await Promise.all((exams || []).map(async exam => {
        const { data: scripts } = await supabase
          .from('answer_scripts')
          .select('id')
          .eq('examination_id', exam.id);
          
        const scriptIds = scripts?.map(s => s.id) || [];
        
        const { data: answers } = await supabase
          .from('answers')
          .select(`
            id,
            answer_script_id,
            assigned_grade,
            is_overridden,
            manual_grade,
            question:questions(marks)
          `)
          .in('answer_script_id', scriptIds);
          
        // Group answers by script
        const scriptScores: Record<string, ScriptScore> = {};
        
        answers?.forEach(answer => {
          if (!scriptScores[answer.answer_script_id]) {
            scriptScores[answer.answer_script_id] = {
              score: 0,
              possible: 0
            };
          }
          
          const score = answer.is_overridden ? answer.manual_grade : answer.assigned_grade;
          scriptScores[answer.answer_script_id].score += score || 0;
          scriptScores[answer.answer_script_id].possible += answer.question?.marks || 0;
        });
        
        // Calculate average
        let totalScore = 0;
        let totalPossible = 0;
        
        Object.values(scriptScores).forEach(script => {
          totalScore += script.score;
          totalPossible += script.possible;
        });
        
        const avgPercentage = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 0;
        
        return {
          id: exam.id,
          name: exam.name,
          date: format(new Date(exam.created_at), 'yyyy-MM-dd'),
          avgScore: avgPercentage
        };
      }));
      
      return [
        {
          id: "average_score",
          data: examScores.map(exam => ({
            x: exam.date,
            y: Math.round(exam.avgScore),
            examName: exam.name
          }))
        }
      ];
    }
  });

  // Prepare pie chart data for passing rates
  const passingRateData = examStats ? [
    {
      id: "passing",
      label: "Passing",
      value: Math.round(examStats.passing_rate)
    },
    {
      id: "failing",
      label: "Failing",
      value: Math.round(100 - examStats.passing_rate)
    }
  ] : [];
  
  // Handle loading states
  if (statsLoading || distributionLoading || questionLoading || trendsLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
          <Loading text="Loading analytics data..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-1">Subject</label>
            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects?.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium mb-1">Date Range</label>
            <DatePickerWithRange 
              date={dateRange}
              setDate={setDateRange} 
            />
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Exams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{examStats?.total_exams || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{examStats?.total_students || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(examStats?.avg_score_percentage || 0)}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Passing Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(examStats?.passing_rate || 0)}%
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="score-distribution" className="space-y-4">
          <TabsList>
            <TabsTrigger value="score-distribution">Score Distribution</TabsTrigger>
            <TabsTrigger value="question-difficulty">Question Difficulty</TabsTrigger>
            <TabsTrigger value="score-trends">Score Trends</TabsTrigger>
            <TabsTrigger value="subject-performance">Subject Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="score-distribution" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {scoreDistribution && scoreDistribution.length > 0 ? (
                    <ResponsiveBar
                      data={scoreDistribution}
                      keys={['count']}
                      indexBy="score_range"
                      margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                      padding={0.3}
                      colors={{ scheme: 'blues' }}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Score Range',
                        legendPosition: 'middle',
                        legendOffset: 40
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Number of Students',
                        legendPosition: 'middle',
                        legendOffset: -50
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      animate={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p>No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Passing Rate</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {passingRateData && passingRateData.length > 0 ? (
                    <ResponsivePie
                      data={passingRateData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      innerRadius={0.6}
                      padAngle={0.7}
                      cornerRadius={3}
                      colors={["#4CAF50", "#F44336"]}
                      borderWidth={1}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                      radialLabelsSkipAngle={10}
                      radialLabelsTextXOffset={6}
                      radialLabelsTextColor="#333333"
                      radialLabelsLinkOffset={0}
                      radialLabelsLinkDiagonalLength={16}
                      radialLabelsLinkHorizontalLength={24}
                      radialLabelsLinkStrokeWidth={1}
                      radialLabelsLinkColor={{ from: 'color' }}
                      slicesLabelsSkipAngle={10}
                      slicesLabelsTextColor="#333333"
                      animate={true}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          translateY: 56,
                          itemWidth: 100,
                          itemHeight: 18,
                          itemTextColor: '#999',
                          symbolSize: 18,
                          symbolShape: 'circle',
                          effects: [
                            {
                              on: 'hover',
                              style: {
                                itemTextColor: '#000'
                              }
                            }
                          ]
                        }
                      ]}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p>No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="question-difficulty">
            <Card>
              <CardHeader>
                <CardTitle>Question Difficulty Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                {questionDifficulty && questionDifficulty.length > 0 ? (
                  <ResponsiveBar
                    data={questionDifficulty.map(q => ({
                      question: q.question_text.substring(0, 30) + (q.question_text.length > 30 ? '...' : ''),
                      "average score": q.avg_score,
                      "max marks": q.max_marks,
                      percentage: Math.round((q.avg_score / q.max_marks) * 100)
                    }))}
                    keys={['average score']}
                    indexBy="question"
                    margin={{ top: 20, right: 50, bottom: 100, left: 60 }}
                    padding={0.3}
                    layout="horizontal"
                    valueScale={{ type: 'linear' }}
                    colors={{ scheme: 'blues' }}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Average Score',
                      legendPosition: 'middle',
                      legendOffset: 40
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    markers={[
                      {
                        axis: 'x',
                        value: 0,
                        lineStyle: { stroke: '#b0413e', strokeWidth: 2 },
                        legend: 'Value Threshold',
                        legendPosition: 'top-left',
                      }
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="score-trends">
            <Card>
              <CardHeader>
                <CardTitle>Score Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                {scoreTrends && scoreTrends[0]?.data?.length > 0 ? (
                  <ResponsiveLine
                    data={scoreTrends}
                    margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{
                      type: 'linear',
                      min: 0,
                      max: 100,
                      stacked: false,
                      reverse: false
                    }}
                    yFormat=" >-.2f"
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Date',
                      legendOffset: 40,
                      legendPosition: 'middle'
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Average Score (%)',
                      legendOffset: -50,
                      legendPosition: 'middle'
                    }}
                    pointSize={10}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    enableSlices="x"
                    sliceTooltip={({ slice }) => {
                      return (
                        <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
                          {slice.points.map((point) => (
                            <div key={point.id} className="text-sm">
                              <strong>{point.data.examName}</strong>
                              <div>{point.data.y}% average score</div>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                    legends={[
                      {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemBackground: 'rgba(0, 0, 0, .03)',
                              itemOpacity: 1
                            }
                          }
                        ]
                      }
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subject-performance">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                {examStats?.subject_data && examStats.subject_data.length > 0 ? (
                  <ResponsiveBar
                    data={examStats.subject_data.map(subject => ({
                      subject: subject.subject_name,
                      "average score": Math.round(subject.avg_score),
                      exams: subject.exam_count
                    }))}
                    keys={['average score']}
                    indexBy="subject"
                    margin={{ top: 20, right: 50, bottom: 70, left: 60 }}
                    padding={0.3}
                    valueScale={{ type: 'linear' }}
                    colors={{ scheme: 'blues' }}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: -45,
                      legend: 'Subject',
                      legendPosition: 'middle',
                      legendOffset: 50
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Average Score (%)',
                      legendPosition: 'middle',
                      legendOffset: -45
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    animate={true}
                    tooltip={({ data }) => (
                      <div className="bg-white p-2 border border-gray-200 shadow-md rounded-md">
                        <div><strong>{data.subject}</strong></div>
                        <div>Average Score: {data["average score"]}%</div>
                        <div>Exams Count: {data.exams}</div>
                      </div>
                    )}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p>No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
