
import React from 'react';
import { Answer } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';

interface SegmentationDetailsProps {
  answers: Answer[];
}

export function SegmentationDetails({ answers }: SegmentationDetailsProps) {
  // Calculate overall segmentation confidence
  const averageConfidence = answers.length > 0
    ? answers.reduce((sum, answer) => sum + (answer.segmentation_confidence || 0.5), 0) / answers.length
    : 0;
    
  // Count the distribution of segmentation methods
  const methodCounts: Record<string, number> = {};
  answers.forEach(answer => {
    const method = answer.segmentation_method || 'basic';
    methodCounts[method] = (methodCounts[method] || 0) + 1;
  });
  
  // Find the predominant method
  let predominantMethod = 'basic';
  let maxCount = 0;
  
  Object.entries(methodCounts).forEach(([method, count]) => {
    if (count > maxCount) {
      maxCount = count;
      predominantMethod = method;
    }
  });
  
  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'ml':
        return 'AI Segmentation';
      default:
        return 'Basic Segmentation';
    }
  };
  
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) {
      return 'High';
    } else if (confidence >= 0.7) {
      return 'Medium';
    } else {
      return 'Low';
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) {
      return 'bg-green-500';
    } else if (confidence >= 0.7) {
      return 'bg-blue-500';
    } else {
      return 'bg-amber-500';
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Badge variant="outline">
        {getMethodLabel(predominantMethod)}
      </Badge>
      <Badge className={getConfidenceColor(averageConfidence)}>
        {getConfidenceLabel(averageConfidence)} Confidence ({Math.round(averageConfidence * 100)}%)
      </Badge>
      <span className="text-xs text-muted-foreground">
        {answers.length} answers extracted
      </span>
    </div>
  );
}
