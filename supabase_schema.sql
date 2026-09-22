-- ==============================================================================
-- Supabase Schema for Premier Ink & Imagination School Library Portal
-- Paste this script into your Supabase Dashboard -> SQL Editor and click "Run"
-- ==============================================================================

-- 1. Create the books table
CREATE TABLE IF NOT EXISTS public.books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  category TEXT DEFAULT 'African Literature',
  total_copies INTEGER DEFAULT 5,
  available_copies INTEGER DEFAULT 5,
  description TEXT,
  summary TEXT,
  cover_image TEXT,
  dewey_class TEXT,
  dewey_code TEXT,
  call_number TEXT,
  age_range TEXT,
  reading_level TEXT,
  page_count INTEGER DEFAULT 200,
  has_audio BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  is_new BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 5.0,
  reads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- 3. Security Policies for books:
-- Drop existing policies first to ensure the script can be re-run safely
DROP POLICY IF EXISTS "Allow public read access to books" ON public.books;
DROP POLICY IF EXISTS "Allow insert access to books" ON public.books;
DROP POLICY IF EXISTS "Allow update access to books" ON public.books;
DROP POLICY IF EXISTS "Allow delete access to books" ON public.books;

-- Allow anyone (visitors, students, staff) to view the books
CREATE POLICY "Allow public read access to books"
  ON public.books
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow library managers to add new titles
CREATE POLICY "Allow insert access to books"
  ON public.books
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow library managers to update title copies and details
CREATE POLICY "Allow update access to books"
  ON public.books
  FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Allow delete access to books
CREATE POLICY "Allow delete access to books"
  ON public.books
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 4. Create the library_users table
CREATE TABLE IF NOT EXISTS public.library_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'learner', -- 'admin', 'staff', 'learner'
  email TEXT NOT NULL UNIQUE,
  password TEXT,                       -- Admission number for student, or password for staff/admin
  admission_number TEXT,               -- Format: PIS/SS/23/2345
  grade_or_year TEXT,                  -- e.g. '9E', 'Year 9'
  department TEXT,                     -- e.g. 'English & Literature Department'
  library_card_id TEXT NOT NULL,       -- e.g. 'LIB-ADMIN-0001', 'LIB-STUD-2345'
  avatar TEXT,
  assigned_teacher_id TEXT,
  assigned_teacher_name TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. Enable Row Level Security (RLS) on library_users
ALTER TABLE public.library_users ENABLE ROW LEVEL SECURITY;

-- 6. Security Policies for library_users
-- Drop existing policies first to ensure the script can be re-run safely
DROP POLICY IF EXISTS "Allow public read access to library_users" ON public.library_users;
DROP POLICY IF EXISTS "Allow insert access to library_users" ON public.library_users;
DROP POLICY IF EXISTS "Allow update access to library_users" ON public.library_users;
DROP POLICY IF EXISTS "Allow delete access to library_users" ON public.library_users;

CREATE POLICY "Allow public read access to library_users"
  ON public.library_users
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert access to library_users"
  ON public.library_users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to library_users"
  ON public.library_users
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow delete access to library_users"
  ON public.library_users
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 7. Seed Initial Production Users (Admin, Staff, Student)
-- Real Admin:
INSERT INTO public.library_users (
  id, name, role, email, password, admission_number, grade_or_year, department, library_card_id, avatar
) VALUES (
  'user-admin-1',
  'Alabi Abdulmumuni',
  'admin',
  'alabia@premierinternationalschool.org',
  'Admin321',
  NULL,
  NULL,
  'Library Administration & Curation',
  'LIB-ADMIN-0001',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role;

-- Test Staff:
INSERT INTO public.library_users (
  id, name, role, email, password, admission_number, grade_or_year, department, library_card_id, avatar
) VALUES (
  'user-staff-1',
  'David Mensah',
  'staff',
  'davidm@premierinternationalschool.org',
  'StaffPass123',
  NULL,
  NULL,
  'Science & STEM Department',
  'LIB-TEACH-2001',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role;

-- Test Student (Class 9E, admission number password format):
INSERT INTO public.library_users (
  id, name, role, email, password, admission_number, grade_or_year, department, library_card_id, avatar, assigned_teacher_id, assigned_teacher_name
) VALUES (
  'user-student-1',
  'Chidi Okafor',
  'learner',
  'chidio@premierinternationalschool.org',
  'PIS/SS/23/2345',
  'PIS/SS/23/2345',
  '9E',
  NULL,
  'LIB-STUD-2345',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  'user-staff-1',
  'David Mensah'
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  admission_number = EXCLUDED.admission_number,
  grade_or_year = EXCLUDED.grade_or_year;

