-- Add admin_id to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_teachers_admin_id ON teachers(admin_id);

-- Update existing teachers to set admin_id from the admin who created them
UPDATE teachers t
SET admin_id = u.id
FROM users u
WHERE u.role = 'admin'
AND t.admin_id IS NULL
LIMIT 1;

-- Make admin_id NOT NULL after setting default value
ALTER TABLE teachers ALTER COLUMN admin_id SET NOT NULL;

-- Create function to validate teacher operations
CREATE OR REPLACE FUNCTION check_teacher_admin_custody()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT: Ensure the admin_id is set to the current user if they are an admin
  IF TG_OP = 'INSERT' THEN
    IF NOT EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can create teachers';
    END IF;
    
    NEW.admin_id = auth.uid();
    RETURN NEW;
  END IF;
  
  -- For UPDATE or DELETE: Check if the current user is the admin who owns this teacher
  IF NOT EXISTS (
    SELECT 1 FROM teachers t
    JOIN users u ON u.id = auth.uid()
    WHERE t.id = OLD.id 
    AND t.admin_id = auth.uid()
    AND u.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'You can only modify teachers under your custody';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for teacher operations
DROP TRIGGER IF EXISTS ensure_teacher_admin_custody ON teachers;
CREATE TRIGGER ensure_teacher_admin_custody
  BEFORE INSERT OR UPDATE OR DELETE ON teachers
  FOR EACH ROW
  EXECUTE FUNCTION check_teacher_admin_custody();

-- Add RLS policies for teacher management
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Policy for viewing teachers (admins can only view their own teachers)
DROP POLICY IF EXISTS view_teachers ON teachers;
CREATE POLICY view_teachers ON teachers
  FOR SELECT
  USING (
    -- Teachers can view their own record
    (auth.uid() = id) OR
    -- Admins can view teachers they created
    (EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND (teachers.admin_id = auth.uid())
    ))
  );

-- Policy for inserting teachers (only admins)
DROP POLICY IF EXISTS insert_teachers ON teachers;
CREATE POLICY insert_teachers ON teachers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy for updating teachers (admin can only update their own teachers)
DROP POLICY IF EXISTS update_teachers ON teachers;
CREATE POLICY update_teachers ON teachers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND teachers.admin_id = auth.uid()
    )
  );

-- Policy for deleting teachers (admin can only delete their own teachers)
DROP POLICY IF EXISTS delete_teachers ON teachers;
CREATE POLICY delete_teachers ON teachers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'admin'
      AND teachers.admin_id = auth.uid()
    )
  );

-- Add RLS policies for student management
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Policy for viewing students (teachers can only view their own students)
DROP POLICY IF EXISTS view_students ON students;
CREATE POLICY view_students ON students
  FOR SELECT
  USING (
    -- Teachers can view their own students
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        -- User is the teacher who owns these students
        (role = 'teacher' AND students.teacher_id = auth.uid())
        OR
        -- User is an admin who owns the teacher who owns these students
        (role = 'admin' AND EXISTS (
          SELECT 1 FROM teachers
          WHERE teachers.id = students.teacher_id
          AND teachers.admin_id = auth.uid()
        ))
      )
    )
  );

-- Policy for inserting students (only teachers and their admins)
DROP POLICY IF EXISTS insert_students ON students;
CREATE POLICY insert_students ON students
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        -- User is the teacher trying to add students for themselves
        (role = 'teacher' AND students.teacher_id = auth.uid())
        OR
        -- User is an admin trying to add students for their teachers
        (role = 'admin' AND EXISTS (
          SELECT 1 FROM teachers
          WHERE teachers.id = students.teacher_id
          AND teachers.admin_id = auth.uid()
        ))
      )
    )
  );

-- Policy for updating students (teachers can only update their own students)
DROP POLICY IF EXISTS update_students ON students;
CREATE POLICY update_students ON students
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        -- User is the teacher who owns these students
        (role = 'teacher' AND students.teacher_id = auth.uid())
        OR
        -- User is an admin who owns the teacher who owns these students
        (role = 'admin' AND EXISTS (
          SELECT 1 FROM teachers
          WHERE teachers.id = students.teacher_id
          AND teachers.admin_id = auth.uid()
        ))
      )
    )
  );

-- Policy for deleting students (teachers can only delete their own students)
DROP POLICY IF EXISTS delete_students ON students;
CREATE POLICY delete_students ON students
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND (
        -- User is the teacher who owns these students
        (role = 'teacher' AND students.teacher_id = auth.uid())
        OR
        -- User is an admin who owns the teacher who owns these students
        (role = 'admin' AND EXISTS (
          SELECT 1 FROM teachers
          WHERE teachers.id = students.teacher_id
          AND teachers.admin_id = auth.uid()
        ))
      )
    )
  );

-- Create function to validate student operations
CREATE OR REPLACE FUNCTION check_student_teacher_custody()
RETURNS TRIGGER AS $$
BEGIN
  -- For INSERT or UPDATE: Ensure the teacher_id belongs to a teacher under the admin's custody if admin is creating/updating
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Check if current user is a teacher
    IF EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'teacher'
    ) THEN
      -- Teachers can only create/update students for themselves
      IF NEW.teacher_id != auth.uid() THEN
        RAISE EXCEPTION 'Teachers can only manage their own students';
      END IF;
    -- Check if current user is an admin
    ELSIF EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN
      -- Admin can only create/update students for teachers under their custody
      IF NOT EXISTS (
        SELECT 1 FROM teachers
        WHERE id = NEW.teacher_id
        AND admin_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'Admins can only manage students for teachers under their custody';
      END IF;
    ELSE
      RAISE EXCEPTION 'Only teachers and admins can manage students';
    END IF;
  END IF;

  -- For DELETE: Similar checks as above
  IF TG_OP = 'DELETE' THEN
    -- Check if current user is a teacher
    IF EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'teacher'
    ) THEN
      -- Teachers can only delete their own students
      IF OLD.teacher_id != auth.uid() THEN
        RAISE EXCEPTION 'Teachers can only manage their own students';
      END IF;
    -- Check if current user is an admin
    ELSIF EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    ) THEN
      -- Admin can only delete students of teachers under their custody
      IF NOT EXISTS (
        SELECT 1 FROM teachers
        WHERE id = OLD.teacher_id
        AND admin_id = auth.uid()
      ) THEN
        RAISE EXCEPTION 'Admins can only manage students for teachers under their custody';
      END IF;
    ELSE
      RAISE EXCEPTION 'Only teachers and admins can manage students';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for student operations
DROP TRIGGER IF EXISTS ensure_student_teacher_custody ON students;
CREATE TRIGGER ensure_student_teacher_custody
  BEFORE INSERT OR UPDATE OR DELETE ON students
  FOR EACH ROW
  EXECUTE FUNCTION check_student_teacher_custody();
