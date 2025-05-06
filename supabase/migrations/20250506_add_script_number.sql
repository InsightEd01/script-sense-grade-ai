
-- Add script_number column to answer_scripts table to track multiple scripts per student
ALTER TABLE IF EXISTS public.answer_scripts 
ADD COLUMN IF NOT EXISTS script_number INTEGER DEFAULT 1;

-- Add combined_extracted_text column to support combining multiple scripts
ALTER TABLE IF EXISTS public.answer_scripts 
ADD COLUMN IF NOT EXISTS combined_extracted_text TEXT;

-- Add index to make queries faster when looking up multiple scripts
CREATE INDEX IF NOT EXISTS idx_scripts_student_exam 
ON public.answer_scripts(student_id, examination_id);
