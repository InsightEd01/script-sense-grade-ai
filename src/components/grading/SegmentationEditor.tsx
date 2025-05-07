
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, RotateCcw, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Answer, Question } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';

interface SegmentationEditorProps {
  answer: Answer;
  question: Question;
  onUpdate?: (updatedAnswer: Answer) => void;
  teacherId?: string;
}

export function SegmentationEditor({ answer, question, onUpdate, teacherId }: SegmentationEditorProps) {
  const [editedText, setEditedText] = useState(answer.extracted_text || '');
  const [originalText] = useState(answer.extracted_text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedText(e.target.value);
    setIsChanged(e.target.value !== originalText);
  };
  
  const handleReset = () => {
    setEditedText(originalText);
    setIsChanged(false);
  };
  
  const handleSave = async () => {
    if (!isChanged) return;
    
    setIsSaving(true);
    try {
      // Update the answer text
      const { data, error } = await supabase
        .from('answers')
        .update({ extracted_text: editedText })
        .eq('id', answer.id)
        .select();
        
      if (error) throw error;
      
      // If we have a teacher ID, store the correction to improve future segmentation
      if (teacherId) {
        await supabase.from('segmentation_corrections').insert({
          teacher_id: teacherId,
          answer_id: answer.id,
          original_text: originalText,
          corrected_text: editedText
        });
      }
      
      toast({
        title: "Text Updated",
        description: "Answer text has been successfully updated",
      });
      
      setIsChanged(false);
      if (onUpdate && data && data[0]) {
        onUpdate(data[0] as unknown as Answer);
      }
    } catch (error) {
      console.error('Error saving segmentation correction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your changes. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const getConfidenceBadge = () => {
    const confidence = answer.segmentation_confidence || 0.5;
    
    if (confidence >= 0.9) {
      return <Badge className="bg-green-500">High Confidence</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge className="bg-blue-500">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-amber-500">Low Confidence</Badge>;
    }
  };
  
  const getMethodBadge = () => {
    const method = answer.segmentation_method || 'basic';
    
    switch (method) {
      case 'ml':
        return <Badge className="bg-purple-500">AI Segmented</Badge>;
      case 'markers':
        return <Badge className="bg-indigo-500">Question Markers</Badge>;
      case 'paragraphs':
        return <Badge className="bg-blue-500">Paragraph Based</Badge>;
      case 'whitespace':
        return <Badge className="bg-teal-500">Whitespace Based</Badge>;
      case 'teacher':
        return <Badge className="bg-green-500">Teacher Optimized</Badge>;
      default:
        return <Badge className="bg-gray-500">Basic Segmentation</Badge>;
    }
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">
            Question: {question.question_text.substring(0, 60)}
            {question.question_text.length > 60 ? '...' : ''}
          </CardTitle>
          <div className="flex gap-2">
            {getMethodBadge()}
            {getConfidenceBadge()}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    This text was extracted using {answer.segmentation_method || 'basic'} segmentation
                    with {Math.round((answer.segmentation_confidence || 0.5) * 100)}% confidence.
                    You can edit it if needed.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            value={editedText}
            onChange={handleTextChange}
            className="min-h-[150px] font-mono text-sm"
            placeholder="No text extracted for this question"
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              disabled={!isChanged || isSaving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!isChanged || isSaving}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
