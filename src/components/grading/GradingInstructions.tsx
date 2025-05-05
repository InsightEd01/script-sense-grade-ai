
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GradingInstructionsProps {
  value: string;
  onChange: (value: string) => void;
}

export function GradingInstructions({ value, onChange }: GradingInstructionsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Grading Instructions</CardTitle>
        <CardDescription>
          Add custom instructions for the AI grading engine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Textarea 
            placeholder="Enter custom instructions for grading (optional)..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground">
            These instructions will be applied when grading scripts. Examples: "Focus on concept understanding rather than exact wording" or "Pay special attention to correct mathematical notation"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
