
-- Enable RLS on schools table if not already enabled
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own schools
CREATE POLICY IF NOT EXISTS "Users can view their own schools"
ON public.schools
FOR SELECT
USING (
    auth.uid() = created_by OR
    auth.uid() IN (
        SELECT id FROM public.users 
        WHERE school_id = public.schools.id AND role IN ('admin', 'master_admin')
    )
);

-- Allow admin users to create schools
CREATE POLICY IF NOT EXISTS "Admins can create schools"
ON public.schools
FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'master_admin')
);

-- Allow admin users to update their own schools
CREATE POLICY IF NOT EXISTS "Admins can update their own schools"
ON public.schools
FOR UPDATE
USING (
    auth.uid() = created_by OR
    (auth.jwt() ->> 'role' = 'admin' AND auth.uid() IN (
        SELECT id FROM public.users 
        WHERE school_id = public.schools.id AND role = 'admin'
    ))
);

-- Allow master_admin to update any school
CREATE POLICY IF NOT EXISTS "Master admin can update any school"
ON public.schools
FOR ALL
USING (auth.jwt() ->> 'role' = 'master_admin');
