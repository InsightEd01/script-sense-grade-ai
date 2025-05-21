-- Create schools table
create table public.schools (
  id uuid not null default gen_random_uuid() primary key,
  name text not null,
  address text,
  created_at timestamp with time zone not null default now(),
  created_by uuid references auth.users(id) not null,
  updated_at timestamp with time zone
);

-- Add RLS policies for schools
alter table public.schools enable row level security;

-- Schools are viewable by any authenticated user
create policy "Schools are viewable by authenticated users" on public.schools
  for select using (auth.role() = 'authenticated');

-- Schools can only be created by master_admin
create policy "Schools can only be created by master_admin" on public.schools
  for insert with check (auth.jwt()->>'role' = 'master_admin');

-- Schools can only be updated by master_admin
create policy "Schools can only be updated by master_admin" on public.schools
  for update using (auth.jwt()->>'role' = 'master_admin');

-- Schools can only be deleted by master_admin
create policy "Schools can only be deleted by master_admin" on public.schools
  for delete using (auth.jwt()->>'role' = 'master_admin');

-- Add school_id to users table
alter table public.users 
add column school_id uuid references public.schools(id);

-- Add RLS policies for school scoping
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.examinations enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.answer_scripts enable row level security;

-- Add school_id to teachers table
alter table public.teachers 
add column school_id uuid references public.schools(id);

-- Add school_id to students table
alter table public.students 
add column school_id uuid references public.schools(id);

-- Update user roles enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'teacher', 'master_admin');
  else
    alter type public.app_role add value if not exists 'master_admin';
  end if;
end$$;

-- Function to get user's school_id
create or replace function get_user_school_id() 
returns uuid 
language sql stable 
as $$
  select school_id 
  from public.users 
  where id = auth.uid()
$$;

-- Update RLS policies to include school_id checks
create policy "Users can only see their school's teachers" on public.teachers
  for select using (
    auth.jwt()->>'role' = 'master_admin' or 
    (school_id = get_user_school_id())
  );

create policy "Users can only see their school's students" on public.students
  for select using (
    auth.jwt()->>'role' = 'master_admin' or 
    (school_id = get_user_school_id())
  );

create policy "Users can only see their school's subjects" on public.subjects
  for select using (
    auth.jwt()->>'role' = 'master_admin' or 
    (school_id = get_user_school_id())
  );

create policy "Users can only see their school's examinations" on public.examinations
  for select using (
    auth.jwt()->>'role' = 'master_admin' or 
    (school_id = get_user_school_id())
  );

-- Add indexes for school_id columns
create index idx_teachers_school_id on public.teachers(school_id);
create index idx_students_school_id on public.students(school_id);

-- Add triggers to automatically set school_id
create or replace function set_school_id() 
returns trigger 
language plpgsql 
as $$
begin
  if new.school_id is null then
    new.school_id := get_user_school_id();
  end if;
  return new;
end;
$$;

create trigger set_teacher_school_id
  before insert on public.teachers
  for each row
  execute function set_school_id();

create trigger set_student_school_id
  before insert on public.students
  for each row
  execute function set_school_id();

-- Function to validate school access
create or replace function validate_school_access(school_id uuid) 
returns boolean 
language plpgsql stable 
as $$
begin
  if auth.jwt()->>'role' = 'master_admin' then
    return true;
  end if;
  return school_id = get_user_school_id();
end;
$$;