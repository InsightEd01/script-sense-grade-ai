
import { useState } from 'react';
import { format } from 'date-fns';
import { AnswerScript } from '@/types/supabase';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Clock, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Flag, 
  EyeIcon, 
  Trash2 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { GradingControls } from './GradingControls';

interface ScriptItemProps {
  script: AnswerScript;
  extractedText?: string;
  customInstructions?: string;
  onDelete: (id: string) => Promise<void>;
  onRefetch: () => void;
}

export function ScriptItem({ script, extractedText, customInstructions, onDelete, onRefetch }: ScriptItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const handleProcessScript = async () => {
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('process-ocr', {
        body: {
          answerScriptId: script.id,
          imageUrl: script.script_image_url,
          autoGrade: false
        }
      });
      
      if (error) {
        throw error;
      }
      
      onRefetch();
      toast({
        title: "Processing Complete",
        description: data?.message || "The answer script has been processed successfully.",
      });
    } catch (error) {
      console.error('Error processing script:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the script. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelProcessing = async () => {
    try {
      setIsCancelling(true);
      
      const { error } = await supabase
        .from('answer_scripts')
        .update({ processing_status: 'error' })
        .eq('id', script.id);

      if (error) throw error;

      onRefetch();
      toast({
        title: "Processing Cancelled",
        description: "The script processing has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling processing:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel processing. Please try again.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: string, flags?: string[]) => {
    const hasMisconductFlags = flags && flags.length > 0;
    
    switch (status) {
      case 'uploaded':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> Pending OCR</Badge>;
      case 'ocr_pending':
        return <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> OCR Processing</Badge>;
      case 'ocr_complete':
        return <Badge variant="secondary"><CheckCircle className="mr-1 h-3 w-3" /> OCR Complete</Badge>;
      case 'grading_pending':
        return <Badge variant="outline"><Clock className="mr-1 h-3 w-3 text-yellow-500" /> Pending Grading</Badge>;
      case 'grading_complete':
        return (
          <div className="flex gap-2">
            <Badge variant="outline"><CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Graded</Badge>
            {hasMisconductFlags && (
              <Badge variant="destructive"><Flag className="mr-1 h-3 w-3" /> Misconduct Flags</Badge>
            )}
          </div>
        );
      case 'error':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" /> Error</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="mr-1 h-3 w-3" /> Unknown</Badge>;
    }
  };

  return (
    <Card key={script.id} className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/4 p-4 bg-muted/30 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="mt-2 font-medium">
              {script.student?.name || 'Unknown Student'}
            </h3>
            <p className="text-sm text-muted-foreground">
              ID: {script.student?.unique_student_id || 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="mb-2">
                {getStatusBadge(script.processing_status, script.flags)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Uploaded: {format(new Date(script.upload_timestamp), 'PPP')}
              </p>
            </div>
            <div className="space-x-2">
              {script.processing_status === 'uploaded' && (
                <Button 
                  size="sm" 
                  onClick={handleProcessScript}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Clock className="mr-1 h-4 w-4" />
                  )}
                  Process with OCR
                </Button>
              )}
              
              {script.processing_status === 'ocr_complete' && (
                <GradingControls 
                  scriptId={script.id}
                  processingStatus={script.processing_status}
                  customInstructions={customInstructions}
                  onGradingComplete={onRefetch}
                />
              )}
              
              {script.processing_status === 'ocr_pending' && (
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelProcessing}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-1 h-4 w-4" />
                  )}
                  Cancel Processing
                </Button>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete Script
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The answer script and all associated data will be permanently deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(script.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(script.script_image_url, '_blank')}
              >
                View Image
              </Button>
            </div>
          </div>
          
          {(script.processing_status === 'ocr_complete' || 
            script.processing_status === 'grading_pending' || 
            script.processing_status === 'grading_complete') && (
            <div className="mt-4">
              <Collapsible className="border rounded-md p-2 bg-muted/20">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center w-full justify-between">
                    <span className="flex items-center">
                      <EyeIcon className="mr-1 h-4 w-4" />
                      View Extracted Text
                    </span>
                    <span className="text-xs text-muted-foreground">(Click to expand)</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-3 mt-2 bg-muted/30 rounded-md">
                  {extractedText ? (
                    <pre className="whitespace-pre-wrap text-sm font-mono p-3 bg-muted/20 rounded overflow-auto max-h-60">
                      {extractedText}
                    </pre>
                  ) : (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading extracted text...
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
          
          {script.flags && script.flags.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm font-semibold text-red-800 flex items-center">
                <Flag className="h-4 w-4 mr-2" /> Potential Misconduct Flags:
              </p>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {script.flags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
