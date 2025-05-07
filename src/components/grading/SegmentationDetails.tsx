
import React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Answer } from '@/types/supabase';
import { AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SegmentationDetailsProps {
  answers: Answer[];
}

export function SegmentationDetails({ answers }: SegmentationDetailsProps) {
  if (!answers || answers.length === 0) {
    return null;
  }
  
  // Calculate overall confidence
  const totalConfidence = answers.reduce((sum, answer) => sum + (answer.segmentation_confidence || 0.5), 0);
  const averageConfidence = answers.length ? totalConfidence / answers.length : 0;
  
  // Count methods used
  const methodCounts: Record<string, number> = {};
  answers.forEach(answer => {
    const method = answer.segmentation_method || 'unknown';
    methodCounts[method] = (methodCounts[method] || 0) + 1;
  });
  
  // Find the primary method (most used)
  let primaryMethod = 'unknown';
  let maxCount = 0;
  for (const [method, count] of Object.entries(methodCounts)) {
    if (count > maxCount) {
      maxCount = count;
      primaryMethod = method;
    }
  }
  
  // Format methods for display
  const getMethodDisplay = (method: string) => {
    switch (method) {
      case 'ml': return 'AI Segmentation';
      case 'markers': return 'Question Markers';
      case 'paragraphs': return 'Paragraph Based';
      case 'whitespace': return 'Whitespace Based';
      case 'teacher': return 'Teacher Optimized';
      case 'heuristic': return 'Heuristic Analysis';
      default: return 'Basic Segmentation';
    }
  };
  
  // Get confidence badge color
  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500';
    if (confidence >= 0.7) return 'bg-blue-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const lowConfidenceAnswers = answers.filter(a => (a.segmentation_confidence || 0.5) < 0.7);
  
  return (
    <Collapsible className="w-full border rounded-md">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4">
          <div className="flex items-center">
            <span className="font-medium">Segmentation Details</span>
            <Badge className={`ml-2 ${getConfidenceBadgeColor(averageConfidence)}`}>
              {Math.round(averageConfidence * 100)}% confidence
            </Badge>
            
            {lowConfidenceAnswers.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="ml-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {lowConfidenceAnswers.length} answer(s) have low confidence segmentation
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <span className="text-xs text-muted-foreground">(Click to view details)</span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Segmentation Methods Used:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(methodCounts).map(([method, count]) => (
                    <Badge key={method} variant="outline" className="flex items-center space-x-1">
                      <span>{getMethodDisplay(method)}</span>
                      <span className="bg-muted text-muted-foreground rounded-full px-1 text-xs">
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Primary Segmentation Method:</p>
                <p className="text-sm">{getMethodDisplay(primaryMethod)}</p>
              </div>
              
              {lowConfidenceAnswers.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                  <p className="text-sm font-medium text-amber-800">
                    Low Confidence Answers:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-700 mt-1">
                    {lowConfidenceAnswers.map((answer, i) => (
                      <li key={i}>
                        Question #{i+1} - {Math.round((answer.segmentation_confidence || 0) * 100)}% confidence
                        using {getMethodDisplay(answer.segmentation_method || 'unknown')}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2 text-amber-600">
                    You may want to check these answers and adjust the text segmentation if needed.
                  </p>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Segmentation is the process of dividing the extracted text into separate answers.
                Higher confidence means the system is more certain about which text belongs to which question.
              </p>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
