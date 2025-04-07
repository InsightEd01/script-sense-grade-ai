
import { supabase } from '@/integrations/supabase/client';

export async function uploadAnswerScript(
  file: File,
  teacherId: string,
  studentId: string,
  examinationId: string
): Promise<string> {
  try {
    // Create a unique filename with path structure: teacher_id/student_id/examination_id/timestamp_originalname
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const filePath = `${teacherId}/${studentId}/${examinationId}/${timestamp}_${file.name}`;
    
    // Upload the file to the answer_scripts bucket
    const { data, error } = await supabase.storage
      .from('answer_scripts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('answer_scripts')
      .getPublicUrl(data.path);
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading answer script:', error);
    throw new Error('Failed to upload answer script');
  }
}

export async function deleteAnswerScript(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from('answer_scripts')
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting answer script:', error);
    throw new Error('Failed to delete answer script');
  }
}

export function getScriptPublicUrl(filePath: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from('answer_scripts')
    .getPublicUrl(filePath);
  
  return publicUrl;
}
