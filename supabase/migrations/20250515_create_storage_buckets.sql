-- Enable Row Level Security
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for bucket management
CREATE POLICY "Allow Full Access to Buckets" ON storage.buckets
FOR ALL USING (true);

-- Create storage buckets for answer scripts and chat attachments if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'answer-scripts') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('answer-scripts', 'answer-scripts', true);
    END IF;
    
    IF NOT EXISTS (SELECT FROM storage.buckets WHERE id = 'chat-attachments') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('chat-attachments', 'chat-attachments', true);
    END IF;
END $$;

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Public Answer Scripts Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Chat Attachments Access" ON storage.objects;  
DROP POLICY IF EXISTS "Auth Users Answer Scripts Upload" ON storage.objects;  
DROP POLICY IF EXISTS "Auth Users Chat Attachments Upload" ON storage.objects;  

-- Set up bucket policies for public access and authenticated uploads
CREATE POLICY "Public Answer Scripts Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'answer-scripts');

CREATE POLICY "Auth Users Answer Scripts Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'answer-scripts');

CREATE POLICY "Public Chat Attachments Access" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Auth Users Chat Attachments Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');

COMMENT ON TABLE storage.objects IS 'Contains information about all storage objects.';
COMMENT ON TABLE storage.buckets IS 'Contains information about all storage buckets.';