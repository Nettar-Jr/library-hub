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

-- 3. Security Policies:
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

-- Allow library managers to remove titles
CREATE POLICY "Allow delete access to books"
  ON public.books
  FOR DELETE
  TO anon, authenticated
  USING (true);
