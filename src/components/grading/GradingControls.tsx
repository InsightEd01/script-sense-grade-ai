
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, 
  AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface GradingControlsProps {
  scriptId: string;
  processingStatus: string;
  customInstructions?: string;
  onGradingComplete: () => void;
}

export function GradingControls({ 
  scriptId, 
  processingStatus, 
  customInstructions,
  onGradingComplete 
}: GradingControlsProps) {
  const [isGrading, setIsGrading] = useState(false);
  
  const canTriggerGrading = ['ocr_complete'].includes(processingStatus);
  
  const handleStartGrading = async () => {
    try {
      setIsGrading(true);
      
      const { data, error } = await supabase.functions.invoke('grade-answers', {
        body: {
          answerScriptId: scriptId,
          customInstructions: customInstructions || undefined
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Grading Started",
        description: "The answer script grading process has been initiated.",
      });
      
      onGradingComplete();
    } catch (error) {
      console.error('Error triggering grading:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start grading process. Please try again.",
      });
    } finally {
      setIsGrading(false);
    }
  };
  
  if (!canTriggerGrading) {
    return null;
  }
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isGrading || !canTriggerGrading}
        >
          {isGrading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Start Grading
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start Grading Process</AlertDialogTitle>
          <AlertDialogDescription>
            This will trigger the AI grading process for this answer script. 
            {customInstructions && (
              <div className="mt-2">
                <p className="font-semibold">Custom grading instructions will be applied:</p>
                <p className="text-sm italic mt-1 bg-muted p-2 rounded">{customInstructions}</p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleStartGrading}
            className="bg-green-600 hover:bg-green-700"
          >
            Start Grading
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
