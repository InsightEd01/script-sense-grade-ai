
-- Create a function that can bypass RLS to create a school
CREATE OR REPLACE FUNCTION public.create_school(
    school_name TEXT,
    school_address TEXT,
    user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_school_id UUID;
BEGIN
    -- Insert the new school
    INSERT INTO public.schools (name, address, created_by)
    VALUES (school_name, school_address, user_id)
    RETURNING id INTO new_school_id;
    
    -- Return the new school ID
    RETURN new_school_id;
END;
$$;

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION public.create_school TO authenticated;
