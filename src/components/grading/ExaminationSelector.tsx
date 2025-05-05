
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Examination } from '@/types/supabase';
import { Loading } from '@/components/ui/loading';

interface ExaminationSelectorProps {
  examinations: Examination[] | undefined;
  isLoading: boolean;
  onSelect: (examinationId: string) => void;
}

export function ExaminationSelector({ examinations, isLoading, onSelect }: ExaminationSelectorProps) {
  if (isLoading) {
    return <Loading text="Loading examinations..." />;
  }
  
  if (!examinations || examinations.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No examinations found. Please create an examination first.</p>
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select an Examination</CardTitle>
        <CardDescription>
          Choose an examination to view and grade answer scripts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {examinations.map((examination) => (
            <Card 
              key={examination.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelect(examination.id)}
            >
              <CardHeader className="p-4">
                <CardTitle className="text-lg">{examination.name}</CardTitle>
                <CardDescription>
                  Total: {examination.total_marks} marks
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
