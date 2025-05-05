
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Upload } from 'lucide-react';
import { AnswerScript } from '@/types/supabase';
import { Loading } from '@/components/ui/loading';
import { ScriptItem } from './ScriptItem';
import { supabase } from '@/integrations/supabase/client';

interface ScriptListProps {
  scripts: AnswerScript[] | undefined;
  isLoading: boolean;
  customInstructions: string;
  onDelete: (id: string) => Promise<void>;
  onRefetch: () => void;
  onUpload: () => void;
}

export function ScriptList({ 
  scripts, 
  isLoading, 
  customInstructions,
  onDelete, 
  onRefetch,
  onUpload
}: ScriptListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [extractedTexts, setExtractedTexts] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    if (scripts) {
      const scriptsToLoad = scripts.filter(script => 
        ['ocr_complete', 'grading_pending', 'grading_complete'].includes(script.processing_status)
      );
      
      scriptsToLoad.forEach(script => {
        if (!extractedTexts[script.id]) {
          fetchExtractedText(script.id);
        }
      });
    }
  }, [scripts]);
  
  const fetchExtractedText = async (scriptId: string) => {
    if (extractedTexts[scriptId]) return;
    
    try {
      const { data, error } = await supabase
        .from('answers')
        .select('extracted_text')
        .eq('answer_script_id', scriptId);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        const fullText = data.map(answer => answer.extracted_text).join('\n\n---\n\n');
        setExtractedTexts(prev => ({ ...prev, [scriptId]: fullText }));
      }
    } catch (error) {
      console.error('Error fetching extracted text:', error);
    }
  };
  
  const filteredScripts = scripts?.filter(script => 
    script.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    script.student?.unique_student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer Script Management</CardTitle>
        <CardDescription>
          Process and grade student answer scripts using OCR and AI.
        </CardDescription>
        <div className="flex items-center space-x-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search by student name or ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loading text="Loading answer scripts..." />
        ) : !scripts ? (
          <div className="text-center py-10 text-red-500">
            <p>Failed to load answer scripts. Please try again later.</p>
          </div>
        ) : filteredScripts && filteredScripts.length > 0 ? (
          <div className="space-y-4">
            {filteredScripts.map((script) => (
              <ScriptItem 
                key={script.id}
                script={script}
                extractedText={extractedTexts[script.id]}
                customInstructions={customInstructions}
                onDelete={onDelete}
                onRefetch={onRefetch}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No answer scripts found for this examination. Upload your first script to get started.</p>
            <Button 
              onClick={onUpload} 
              className="mt-4 bg-scriptsense-primary"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload First Script
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
