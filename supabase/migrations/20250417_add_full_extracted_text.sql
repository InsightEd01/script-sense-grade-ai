
-- Add full_extracted_text column to answer_scripts table
ALTER TABLE IF EXISTS public.answer_scripts 
ADD COLUMN IF NOT EXISTS full_extracted_text TEXT;
