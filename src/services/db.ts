/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, CirculationRecord, StudentSubmission, Announcement, LibraryUser, BookHold, BookReview } from '../types';
import { initialBooks, initialCirculation, initialSubmissions, initialAnnouncements } from '../data';

// Environment variables check for Supabase
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

export const isCloudDatabaseConnected = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Storage keys for durable local and hybrid cloud state
 */
const STORAGE_KEYS = {
  BOOKS: 'pis_library_books_v2',
  CIRCULATION: 'pis_library_circulation_v2',
  SUBMISSIONS: 'pis_library_submissions_v2',
  ANNOUNCEMENTS: 'pis_library_announcements_v2',
  USERS: 'pis_library_users_v2',
  HOLDS: 'pis_library_holds_v2',
  EMAIL_LOGS: 'pis_library_email_logs_v2',
  FAVORITES: 'pis_library_favorites_v2',
  STUDENT_XP: 'pis_library_student_xp_v2',
};

export interface DatabaseState {
  books: Book[];
  circulation: CirculationRecord[];
  submissions: StudentSubmission[];
  announcements: Announcement[];
  users: LibraryUser[];
  holds: BookHold[];
}

/**
 * Loads all data from persistent storage
 */
export function loadPersistentData(): DatabaseState {
  try {
    const savedBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
    const savedCirc = localStorage.getItem(STORAGE_KEYS.CIRCULATION);
    const savedSubs = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    const savedAnn = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    const savedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const savedHolds = localStorage.getItem(STORAGE_KEYS.HOLDS);

    return {
      books: savedBooks ? JSON.parse(savedBooks) : initialBooks,
      circulation: savedCirc ? JSON.parse(savedCirc) : initialCirculation,
      submissions: savedSubs ? JSON.parse(savedSubs) : initialSubmissions,
      announcements: savedAnn ? JSON.parse(savedAnn) : initialAnnouncements,
      users: savedUsers ? JSON.parse(savedUsers) : [
        {
          id: 'user-1',
          name: 'Chidi Okafor',
          role: 'student',
          gradeOrYear: 'Year 9',
          libraryCardId: 'LIB-STUD-1001',
          email: 'chidi.okafor@school.edu',
          createdAt: '2026-01-10',
        },
        {
          id: 'user-2',
          name: 'Amina Bello',
          role: 'student',
          gradeOrYear: 'Primary 5',
          libraryCardId: 'LIB-STUD-1002',
          email: 'amina.bello@school.edu',
          createdAt: '2026-01-12',
        },
        {
          id: 'user-3',
          name: 'Sarah J.',
          role: 'student',
          gradeOrYear: 'Primary 4',
          libraryCardId: 'LIB-STUD-1003',
          email: 'sarah.j@school.edu',
          createdAt: '2026-01-15',
        },
        {
          id: 'user-4',
          name: 'Tunde Williams',
          role: 'student',
          gradeOrYear: 'Year 11',
          libraryCardId: 'LIB-STUD-1004',
          email: 'tunde.williams@school.edu',
          createdAt: '2026-01-18',
        },
        {
          id: 'user-5',
          name: 'Mrs. Emily Cole',
          role: 'teacher',
          department: 'English Department',
          libraryCardId: 'LIB-TEACH-2001',
          email: 'emily.cole@school.edu',
          createdAt: '2026-01-05',
        },
        {
          id: 'user-6',
          name: 'Mr. David Mensah',
          role: 'teacher',
          department: 'Science Department',
          libraryCardId: 'LIB-TEACH-2002',
          email: 'david.mensah@school.edu',
          createdAt: '2026-01-08',
        },
      ],
      holds: savedHolds ? JSON.parse(savedHolds) : [],
    };
  } catch (error) {
    console.error('Error loading persistent library data:', error);
    return {
      books: initialBooks,
      circulation: initialCirculation,
      submissions: initialSubmissions,
      announcements: initialAnnouncements,
      users: [],
      holds: [],
    };
  }
}

/**
 * Saves specific dataset to persistent storage
 */
export function savePersistentItem<T>(key: keyof typeof STORAGE_KEYS, data: T): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (err) {
    console.warn(`Failed to save ${key} to persistence:`, err);
  }
}

/**
 * SQL DDL Schema generator for users setting up Supabase or PostgreSQL
 */
export const SUPABASE_SQL_SCHEMA = `
-- ====================================================================
-- PREMIER INTERNATIONAL SCHOOL DIGITAL LIBRARY & CREATIVE PORTAL
-- Complete Database Schema for Supabase / PostgreSQL
-- ====================================================================

-- 1. USERS & PATRONS
CREATE TABLE IF NOT EXISTS public.library_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'librarian')),
  grade_or_year TEXT,
  department TEXT,
  library_card_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BOOKS & CATALOG INVENTORY
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  total_copies INT NOT NULL DEFAULT 1,
  available_copies INT NOT NULL DEFAULT 1,
  description TEXT,
  cover_image TEXT,
  reads_count INT DEFAULT 0,
  dewey_class TEXT,
  dewey_code TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  age_range TEXT,
  reading_level TEXT,
  usage_type TEXT DEFAULT 'circulation',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CIRCULATION LOANS & OVERDUE TRACKING
CREATE TABLE IF NOT EXISTS public.circulation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_name TEXT NOT NULL,
  user_id UUID REFERENCES public.library_users(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  borrow_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT NOT NULL CHECK (status IN ('borrowed', 'returned', 'overdue', 'lost', 'misplaced')),
  alert_sent BOOLEAN DEFAULT false,
  is_replaced BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. STUDENT CREATIVE WRITING & ART SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.student_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  user_id UUID REFERENCES public.library_users(id) ON DELETE SET NULL,
  grade_or_year TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('short-story', 'poetry', 'academic-essay', 'digital-art')),
  content TEXT NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderation_feedback TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SUBMISSION COMMENTS & PEER REVIEWS
CREATE TABLE IF NOT EXISTS public.submission_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.student_submissions(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. BOOK REVIEWS & RATINGS
CREATE TABLE IF NOT EXISTS public.book_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. BOOK HOLDS & RESERVATIONS
CREATE TABLE IF NOT EXISTS public.book_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  user_id UUID REFERENCES public.library_users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  hold_date TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'claimed', 'released'))
);

-- 8. EMAIL DISPATCH & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('overdue', 'lost', 'general')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('info', 'alert', 'achievement')),
  date DATE DEFAULT CURRENT_DATE
);
`;
