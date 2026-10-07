/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Book, StudentSubmission, CirculationRecord, BookHold, LibraryUser, HeroSpotlightData } from '../types';

// Load Vite environment variables with production project fallback
const DEFAULT_SUPABASE_URL = 'https://dlaxjarpxjopktzijizn.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsYXhqYXJweGpvcGt0emlqaXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDAyOTgsImV4cCI6MjEwNDUxNjI5OH0.00MAj4WbyiEyzuAOygFCorGCcmZZBVeD9EP0xaikm8w';

const supabaseUrl = ((typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_URL) || DEFAULT_SUPABASE_URL).trim();
const supabaseAnonKey = ((typeof import.meta !== 'undefined' && import.meta?.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== '' && 
  supabaseAnonKey !== ''
);

// Lazy singleton client creation
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return clientInstance;
}

export const supabase = getSupabaseClient();

/**
 * Maps database row (snake_case or camelCase) to the application's Book interface
 */
export function mapRowToBook(row: Record<string, any>): Book {
  const dewey = row.dewey_decimal || row.dewey_code || row.deweyCode || row.deweyClass || '000';
  const deweyClass = row.dewey_class || (dewey ? `${dewey.toString().charAt(0)}00` : '000');
  const cover = row.cover_url || row.cover_image || row.coverUrl || row.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700';

  let derivedSection: 'primary' | 'college' = 'college';
  if (
    row.section === 'primary' ||
    row.format === 'primary' ||
    (row.category && (row.category.toLowerCase().includes('children') || row.category.toLowerCase().includes('early') || row.category.toLowerCase().includes('primary'))) ||
    (row.title && row.title.toLowerCase().includes('glow! be confident'))
  ) {
    derivedSection = 'primary';
  }

  return {
    id: String(row.id),
    title: row.title || 'Untitled Book',
    author: row.author || 'Unknown Author',
    isbn: row.isbn || 'N/A',
    category: row.category || 'General Fiction',
    totalCopies: Number(row.total_copies ?? row.totalCopies ?? 1),
    availableCopies: Number(row.available_copies ?? row.availableCopies ?? 1),
    description: row.description || '',
    summary: row.description || '',
    coverImage: cover,
    coverUrl: cover,
    readsCount: Number(row.reads_count ?? row.readsCount ?? 0),
    deweyCode: String(dewey),
    deweyClass: String(deweyClass),
    callNumber: row.call_number || `${deweyClass} ${(row.author || 'LIB').slice(0, 3).toUpperCase()}`,
    hasAudio: Boolean(row.is_audiobook || row.audio_url || row.hasAudio),
    isAudiobook: Boolean(row.is_audiobook || row.audio_url || row.isAudiobook),
    isNew: Boolean(row.is_new ?? row.isNew ?? false),
    isPopular: Boolean(row.is_popular ?? row.isPopular ?? false),
    isTeacherPick: Boolean(row.is_teacher_pick ?? row.isTeacherPick ?? false),
    ageRange: row.age_range || row.ageRange || 'All Ages',
    readingLevel: row.reading_level || row.readingLevel || 'Standard',
    usageType: row.usage_type || row.format === 'reserve' ? 'reserve' : 'circulation',
    inventoryType: (row.format === 'ebook' || row.inventory_type === 'ebook' || row.inventoryType === 'ebook') ? 'ebook' : 'physical',
    ebookFormat: row.ebook_format || row.ebookFormat || 'pages',
    ebookPages: row.ebook_pages ? (typeof row.ebook_pages === 'string' ? JSON.parse(row.ebook_pages) : row.ebook_pages) : (row.ebookPages || undefined),
    ebookFileUrl: row.ebook_file_url || row.ebookFileUrl,
    ebookFileSize: row.ebook_file_size || row.ebookFileSize,
    ebookFileName: row.ebook_file_name || row.ebookFileName,
    rating: Number(row.rating ?? 5.0),
    pageCount: Number(row.page_count ?? row.pageCount ?? 200),
    section: derivedSection,
  };
}

/**
 * Fetch all books from Supabase
 */
export async function fetchBooksFromSupabase(): Promise<{ data: Book[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    const { data, error } = await client
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: [], error: null };
    }

    const books = data.map(mapRowToBook);
    return { data: books, error: null };
  } catch (err: any) {
    console.error('Error fetching from Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Insert a book into Supabase table
 */
export async function insertBookToSupabase(
  book: Omit<Book, 'id' | 'readsCount'> & { id?: string }
): Promise<{ data: Book | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const payload: Record<string, any> = {
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      description: book.description || '',
      cover_url: book.coverImage || book.coverUrl || '',
      total_copies: book.totalCopies,
      available_copies: book.availableCopies,
      reads_count: 0,
      dewey_decimal: book.deweyCode || '000',
      is_audiobook: Boolean(book.hasAudio || book.isAudiobook),
      is_new: Boolean(book.isNew),
      format: book.inventoryType === 'ebook' ? 'ebook' : (book.usageType || (book.section === 'primary' ? 'primary' : 'circulation')),
    };

    const { data, error } = await client
      .from('books')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: mapRowToBook(data), error: null };
  } catch (err: any) {
    console.error('Error inserting to Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Delete a book from Supabase
 */
export async function deleteBookFromSupabase(id: string): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await client
      .from('books')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error deleting from Supabase:', err);
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Update an existing book in Supabase
 */
export async function updateBookInSupabase(
  id: string, 
  updates: Partial<Book>
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.author !== undefined) payload.author = updates.author;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.isbn !== undefined) payload.isbn = updates.isbn;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.coverImage !== undefined || updates.coverUrl !== undefined) {
      payload.cover_url = updates.coverImage || updates.coverUrl;
    }
    if (updates.totalCopies !== undefined) payload.total_copies = updates.totalCopies;
    if (updates.availableCopies !== undefined) payload.available_copies = updates.availableCopies;
    if (updates.readsCount !== undefined) payload.reads_count = updates.readsCount;
    if (updates.deweyCode !== undefined) payload.dewey_decimal = updates.deweyCode;
    if (updates.inventoryType !== undefined) {
      payload.format = updates.inventoryType === 'ebook' ? 'ebook' : (updates.usageType || 'circulation');
    }

    const { error } = await client
      .from('books')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Maps database row to StudentSubmission interface
 */
export function mapRowToSubmission(row: Record<string, any>): StudentSubmission {
  return {
    id: String(row.id),
    authorName: row.author_name || row.authorName || 'Student Author',
    gradeOrYear: row.grade_or_year || row.gradeOrYear || 'Standard Grade',
    title: row.title || 'Untitled Submission',
    category: row.category || 'short-story',
    content: row.content || '',
    imageUrl: row.image_url || row.imageUrl || undefined,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    status: (row.status === 'approved' || row.status === 'rejected') ? row.status : 'pending',
    moderationFeedback: row.moderation_feedback || row.moderationFeedback || undefined,
    likesCount: Number(row.likes_count ?? row.likesCount ?? 0),
    likedByCurrentUser: false,
    comments: Array.isArray(row.comments) ? row.comments : [],
    assignedTeacherId: row.assigned_teacher_id || row.assignedTeacherId || undefined,
    assignedTeacherName: row.assigned_teacher_name || row.assignedTeacherName || undefined,
    assignedTeacherDepartment: row.assigned_teacher_department || row.assignedTeacherDepartment || undefined,
    assignedBy: row.assigned_by || row.assignedBy || undefined,
    assignedAt: row.assigned_at || row.assignedAt || undefined,
    assignmentNotes: row.assignment_notes || row.assignmentNotes || undefined,
  };
}

/**
 * Fetch all student submissions from Supabase
 */
export async function fetchSubmissionsFromSupabase(): Promise<{ data: StudentSubmission[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase client is not configured' };
  }

  try {
    const { data, error } = await client
      .from('student_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch submissions error:', error.message);
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: [], error: null };
    }

    const subs = data.map(mapRowToSubmission);
    return { data: subs, error: null };
  } catch (err: any) {
    console.error('Error fetching submissions from Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Insert a new student submission into Supabase
 */
export async function insertSubmissionToSupabase(
  sub: StudentSubmission
): Promise<{ data: StudentSubmission | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const payload: Record<string, any> = {
      id: sub.id,
      author_name: sub.authorName,
      grade_or_year: sub.gradeOrYear,
      title: sub.title,
      category: sub.category,
      content: sub.content,
      image_url: sub.imageUrl || null,
      status: sub.status || 'pending',
      moderation_feedback: sub.moderationFeedback || null,
      assigned_teacher_id: sub.assignedTeacherId || null,
      assigned_teacher_name: sub.assignedTeacherName || null,
      assigned_teacher_department: sub.assignedTeacherDepartment || null,
      assigned_by: sub.assignedBy || null,
      assigned_at: sub.assignedAt || null,
      assignment_notes: sub.assignmentNotes || null,
      likes_count: sub.likesCount || 0,
      created_at: sub.createdAt || new Date().toISOString(),
    };

    const { data, error } = await client
      .from('student_submissions')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert submission error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: mapRowToSubmission(data), error: null };
  } catch (err: any) {
    console.error('Error inserting submission to Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Update an existing submission in Supabase
 */
export async function updateSubmissionInSupabase(
  id: string,
  updates: Partial<StudentSubmission>
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const payload: Record<string, any> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.moderationFeedback !== undefined) payload.moderation_feedback = updates.moderationFeedback;
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
    if (updates.likesCount !== undefined) payload.likes_count = updates.likesCount;
    if (updates.assignedTeacherId !== undefined) payload.assigned_teacher_id = updates.assignedTeacherId;
    if (updates.assignedTeacherName !== undefined) payload.assigned_teacher_name = updates.assignedTeacherName;
    if (updates.assignedTeacherDepartment !== undefined) payload.assigned_teacher_department = updates.assignedTeacherDepartment;
    if (updates.assignedBy !== undefined) payload.assigned_by = updates.assignedBy;
    if (updates.assignedAt !== undefined) payload.assigned_at = updates.assignedAt;
    if (updates.assignmentNotes !== undefined) payload.assignment_notes = updates.assignmentNotes;

    const { error } = await client
      .from('student_submissions')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Delete a submission from Supabase
 */
export async function deleteSubmissionFromSupabase(id: string): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await client
      .from('student_submissions')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Maps circulation database row to CirculationRecord interface
 */
export function mapRowToCirculation(row: Record<string, any>): CirculationRecord {
  return {
    id: String(row.id),
    learnerName: row.learner_name || row.learnerName || 'Student',
    bookId: String(row.book_id || row.bookId || ''),
    bookTitle: row.book_title || row.bookTitle || 'Unknown Title',
    borrowDate: row.borrow_date || row.borrowDate || new Date().toISOString().split('T')[0],
    dueDate: row.due_date || row.dueDate || new Date().toISOString().split('T')[0],
    returnDate: row.return_date || row.returnDate || undefined,
    status: row.status || 'borrowed',
    alertSent: Boolean(row.alert_sent ?? row.alertSent ?? false),
    isReplaced: Boolean(row.is_replaced ?? row.isReplaced ?? false),
  };
}

/**
 * Fetch all circulation records from Supabase
 */
export async function fetchCirculationFromSupabase(): Promise<{ data: CirculationRecord[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await client
      .from('circulation_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch circulation error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: (data || []).map(mapRowToCirculation), error: null };
  } catch (err: any) {
    console.error('Error fetching circulation from Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Insert a new circulation record to Supabase
 */
export async function insertCirculationToSupabase(
  record: CirculationRecord
): Promise<{ data: CirculationRecord | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const payload: Record<string, any> = {
      learner_name: record.learnerName,
      book_title: record.bookTitle,
      borrow_date: record.borrowDate,
      due_date: record.dueDate,
      return_date: record.returnDate || null,
      status: record.status,
      alert_sent: record.alertSent,
      is_replaced: record.isReplaced || false,
    };

    const { data, error } = await client
      .from('circulation_records')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert circulation error:', error.message);
      return { data: null, error: error.message };
    }

    return { data: mapRowToCirculation(data), error: null };
  } catch (err: any) {
    console.error('Error inserting circulation to Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Update an existing circulation record in Supabase
 */
export async function updateCirculationInSupabase(
  id: string,
  updates: Partial<CirculationRecord>
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const payload: Record<string, any> = {};
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.returnDate !== undefined) payload.return_date = updates.returnDate;
    if (updates.alertSent !== undefined) payload.alert_sent = updates.alertSent;
    if (updates.isReplaced !== undefined) payload.is_replaced = updates.isReplaced;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;

    const { error } = await client
      .from('circulation_records')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Delete a circulation record from Supabase
 */
export async function deleteCirculationRecordFromSupabase(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await client
      .from('circulation_records')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Maps book_holds table row to BookHold interface
 */
export function mapRowToHold(row: Record<string, any>): BookHold {
  return {
    id: String(row.id),
    bookId: String(row.book_id || row.bookId || ''),
    bookTitle: row.book_title || row.bookTitle || 'Untitled Book',
    userId: String(row.user_id || row.userId || ''),
    userName: row.user_name || row.userName || 'Library User',
    holdDate: row.hold_date || row.holdDate || new Date().toISOString(),
    expiryDate: row.expiry_date || row.expiryDate || new Date().toISOString(),
    status: row.status || 'active',
  };
}

/**
 * Fetch all holds from Supabase
 */
export async function fetchHoldsFromSupabase(): Promise<{ data: BookHold[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await client
      .from('book_holds')
      .select('*')
      .order('hold_date', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data || []).map(mapRowToHold), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Insert a book hold into Supabase
 */
export async function insertHoldToSupabase(
  hold: BookHold
): Promise<{ data: BookHold | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const payload = {
      book_title: hold.bookTitle,
      user_name: hold.userName,
      expiry_date: hold.expiryDate,
      status: hold.status,
    };

    const { data, error } = await client
      .from('book_holds')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: mapRowToHold(data), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Update a book hold status in Supabase
 */
export async function updateHoldInSupabase(
  id: string,
  status: 'active' | 'claimed' | 'released'
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await client
      .from('book_holds')
      .update({ status })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Maps a Supabase row to LibraryUser interface
 */
export function mapRowToUser(row: Record<string, any>): LibraryUser {
  const dept = (row.department || '').toLowerCase();
  const email = (row.email || '').toLowerCase();
  const name = (row.name || row.full_name || '').toLowerCase();
  const grade = (row.grade_or_year || row.gradeOrYear || row.class || '').toLowerCase();

  // Section classification: Primary vs College
  let derivedSection: 'primary' | 'college' = 'college';
  if (
    row.section === 'primary' ||
    dept.includes('primary') ||
    dept.includes('nursery') ||
    email.includes('adelekev') ||
    name.includes('adeleke') ||
    grade.includes('primary') ||
    grade.includes('nursery') ||
    grade.includes('pri') ||
    /^([1-6])[dgeor]\b/i.test(grade) ||
    /^year\s*[1-6]\b/i.test(grade)
  ) {
    derivedSection = 'primary';
  } else if (
    row.section === 'college' ||
    row.section === 'secondary' ||
    dept.includes('college') ||
    dept.includes('secondary') ||
    email.includes('alabia') ||
    name.includes('alabi') ||
    grade.includes('year') ||
    grade.includes('jss') ||
    grade.includes('sss') ||
    /^([7-9]|1[0-2])[dgeor]\b/i.test(grade) ||
    /^year\s*(7|8|9|10|11|12)\b/i.test(grade)
  ) {
    derivedSection = 'college';
  }

  return {
    id: String(row.id),
    name: row.name || row.full_name || 'Unnamed User',
    role: row.role || 'learner',
    email: row.email || '',
    password: row.password || '',
    admissionNumber: row.admission_number || row.admissionNumber || '',
    gradeOrYear: row.grade_or_year || row.gradeOrYear || row.class || '',
    department: row.department || '',
    libraryCardId: row.library_card_id || row.libraryCardId || `LIB-${String(row.id).slice(-4)}`,
    avatar: row.avatar || row.avatar_url || '',
    assignedTeacherId: row.assigned_teacher_id || row.assignedTeacherId || '',
    assignedTeacherName: row.assigned_teacher_name || row.assignedTeacherName || '',
    section: derivedSection,
    createdAt: row.created_at ? String(row.created_at).split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

/**
 * Fetch all library users from Supabase
 */
export async function fetchUsersFromSupabase(): Promise<{ data: LibraryUser[] | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await client
      .from('library_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data || []).map(mapRowToUser), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Insert a new library user into Supabase
 */
export async function insertUserToSupabase(
  user: LibraryUser
): Promise<{ data: LibraryUser | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email.toLowerCase().trim(),
      password: user.password || '',
      admission_number: user.admissionNumber || null,
      grade_or_year: user.gradeOrYear || null,
      department: user.department || null,
      library_card_id: user.libraryCardId,
      avatar: user.avatar || null,
      assigned_teacher_id: user.assignedTeacherId || null,
      assigned_teacher_name: user.assignedTeacherName || null,
    };

    const { data, error } = await client
      .from('library_users')
      .insert([payload])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: mapRowToUser(data), error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export const DEFAULT_USER_AVATARS: Record<string, string> = {
  'user-admin-1': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'user-admin-2': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  'alabia@premierinternationalschool.org': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'adelekev@premierinternationalschool.org': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
};

/**
 * Returns default avatar for a user when database avatar is empty
 */
export function getDefaultAvatarForUser(userId?: string, email?: string): string {
  if (userId && DEFAULT_USER_AVATARS[userId]) return DEFAULT_USER_AVATARS[userId];
  if (email && DEFAULT_USER_AVATARS[email.toLowerCase().trim()]) return DEFAULT_USER_AVATARS[email.toLowerCase().trim()];
  return '';
}

/**
 * Update an existing library user in Supabase
 */
export async function updateUserInSupabase(
  userId: string,
  updates: Partial<LibraryUser>
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.email !== undefined) payload.email = updates.email.toLowerCase().trim();
    if (updates.password !== undefined) payload.password = updates.password;
    if (updates.admissionNumber !== undefined) payload.admission_number = updates.admissionNumber;
    if (updates.gradeOrYear !== undefined) payload.grade_or_year = updates.gradeOrYear;
    if (updates.department !== undefined) payload.department = updates.department;
    if (updates.libraryCardId !== undefined) payload.library_card_id = updates.libraryCardId;
    if (updates.avatar !== undefined) {
      const trimmed = (updates.avatar || '').trim();
      const isCustom = trimmed !== '' && !DEFAULT_USER_AVATARS[trimmed] && !Object.values(DEFAULT_USER_AVATARS).includes(trimmed);
      payload.avatar = isCustom ? trimmed : null;
    }
    if (updates.assignedTeacherId !== undefined) payload.assigned_teacher_id = updates.assignedTeacherId;
    if (updates.assignedTeacherName !== undefined) payload.assigned_teacher_name = updates.assignedTeacherName;
    if (updates.section !== undefined) payload.section = updates.section;

    // 1. Attempt update by ID
    const { data: updatedRows, error: updateError } = await client
      .from('library_users')
      .update(payload)
      .eq('id', userId)
      .select('id, email, avatar');

    if (updateError) {
      console.warn('Direct update by id failed, attempting fallback:', updateError.message);
    }

    // If ID update affected a row, succeed immediately
    if (updatedRows && updatedRows.length > 0) {
      return { success: true, error: null };
    }

    // 2. If ID update did not touch any row, try matching by email
    const emailToMatch = updates.email ? updates.email.toLowerCase().trim() : null;
    if (emailToMatch) {
      const { data: emailRows, error: emailError } = await client
        .from('library_users')
        .update(payload)
        .eq('email', emailToMatch)
        .select('id, email, avatar');

      if (!emailError && emailRows && emailRows.length > 0) {
        return { success: true, error: null };
      }
    }

    // 3. If record doesn't exist yet, insert/upsert user record into database
    const insertPayload: Record<string, any> = {
      id: userId,
      name: updates.name || 'Library User',
      role: updates.role || 'learner',
      email: (updates.email || `${userId}@premierinternationalschool.org`).toLowerCase().trim(),
      password: updates.password || '',
      admission_number: updates.admissionNumber || null,
      grade_or_year: updates.gradeOrYear || null,
      department: updates.department || null,
      library_card_id: updates.libraryCardId || `LIB-${userId.slice(-4).toUpperCase()}`,
      avatar: updates.avatar || null,
      assigned_teacher_id: updates.assignedTeacherId || null,
      assigned_teacher_name: updates.assignedTeacherName || null,
      section: updates.section || 'college',
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await client
      .from('library_users')
      .upsert([insertPayload], { onConflict: 'email' });

    if (upsertError) {
      console.warn('Upsert to library_users failed:', upsertError.message);
      return { success: false, error: upsertError.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Delete a library user from Supabase
 */
export async function deleteUserFromSupabase(userId: string): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const { error } = await client
      .from('library_users')
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown network error' };
  }
}

/**
 * Query user from Supabase by identifier (email, admission number, or library card ID)
 */
export async function queryUserFromSupabase(identifier: string): Promise<{ data: LibraryUser | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  const cleanId = identifier.trim();
  const cleanLower = cleanId.toLowerCase();

  try {
    let query = client.from('library_users').select('*');

    if (cleanLower.includes('@')) {
      query = query.ilike('email', cleanLower);
    } else {
      query = query.or(
        `email.ilike.%${cleanLower}%,admission_number.ilike.${cleanId},library_card_id.ilike.${cleanId},name.ilike.%${cleanId}%`
      );
    }

    const { data, error } = await query.limit(1);

    if (error) {
      return { data: null, error: error.message };
    }

    if (data && data.length > 0) {
      return { data: mapRowToUser(data[0]), error: null };
    }

    return { data: null, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Fetch Book of the Week document from Supabase database based on student's grade level ('primary' or 'secondary')
 */
export async function fetchBookOfWeekFromDatabase(
  gradeLevel: 'primary' | 'secondary'
): Promise<{ data: HeroSpotlightData | null; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    // 1. Try dedicated book_of_week / bookOfWeek table if present
    try {
      const { data, error } = await client
        .from('book_of_week')
        .select('*')
        .or(`grade_level.eq.${gradeLevel},section.eq.${gradeLevel === 'primary' ? 'primary' : 'college'}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        const row = data[0];
        return {
          data: {
            id: row.id || `spotlight-${gradeLevel}`,
            title: row.title,
            subtitle: row.subtitle || (row.author ? `By ${row.author} • ${row.category || 'Featured'}` : ''),
            description: row.description || row.summary || '',
            featuredBookId: row.featured_book_id || row.featuredBookId || row.id,
            badgeText: row.badge_text || row.badgeText || '⭐ BOOK OF THE WEEK',
            bgGradient: row.bg_gradient || row.bgGradient || (gradeLevel === 'primary' ? 'from-emerald-950 via-slate-900 to-teal-950' : 'from-blue-900 via-indigo-950 to-slate-900'),
            coverUrl: row.cover_url || row.cover_image || row.coverUrl,
            section: gradeLevel === 'primary' ? 'primary' : 'college',
          },
          error: null,
        };
      }
    } catch {
      // Table may not exist yet, fallback to document storage in books table
    }

    // 2. Fetch specific 'bookOfWeek' document from books table
    const targetId = gradeLevel === 'primary' 
      ? 'b0000000-0000-0000-0000-000000000001' 
      : 'b0000000-0000-0000-0000-000000000002';

    const { data: bookDoc, error: bookError } = await client
      .from('books')
      .select('*')
      .or(`id.eq.${targetId},format.eq.book_of_week_${gradeLevel}`)
      .limit(1);

    if (!bookError && bookDoc && bookDoc.length > 0) {
      const row = bookDoc[0];
      let meta: any = {};
      if (row.isbn) {
        try {
          meta = JSON.parse(row.isbn);
        } catch {
          // not json
        }
      }

      return {
        data: {
          id: row.id,
          title: row.title || 'Featured Masterpiece',
          subtitle: meta.subtitle || (row.author ? `By ${row.author} • ${row.category || 'Featured'}` : 'Featured Book of the Week'),
          description: row.description || '',
          featuredBookId: meta.featuredBookId || row.id,
          badgeText: meta.badgeText || '⭐ BOOK OF THE WEEK',
          bgGradient: meta.bgGradient || (gradeLevel === 'primary' 
            ? 'from-emerald-950 via-slate-900 to-teal-950' 
            : 'from-blue-900 via-indigo-950 to-slate-900'),
          coverUrl: row.cover_url || row.cover_image,
          section: gradeLevel === 'primary' ? 'primary' : 'college',
        },
        error: null,
      };
    }

    return { data: null, error: bookError ? bookError.message : 'No document found' };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error fetching bookOfWeek document' };
  }
}

/**
 * Save / update Book of the Week document in Supabase database
 */
export async function saveBookOfWeekToDatabase(
  spotlight: HeroSpotlightData,
  gradeLevel: 'primary' | 'secondary'
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase client is not configured' };
  }

  const targetId = gradeLevel === 'primary' 
    ? 'b0000000-0000-0000-0000-000000000001' 
    : 'b0000000-0000-0000-0000-000000000002';

  const authorName = spotlight.subtitle.replace(/^By\s+/i, '').split('•')[0].trim() || 'Featured Author';
  const categoryName = spotlight.subtitle.includes('•') ? spotlight.subtitle.split('•')[1].trim() : 'Featured';

  const metaJson = JSON.stringify({
    featuredBookId: spotlight.featuredBookId,
    badgeText: spotlight.badgeText,
    bgGradient: spotlight.bgGradient,
    subtitle: spotlight.subtitle,
  });

  const row = {
    id: targetId,
    title: spotlight.title,
    author: authorName,
    category: categoryName,
    description: spotlight.description,
    cover_url: spotlight.coverUrl,
    format: `book_of_week_${gradeLevel}`,
    dewey_decimal: '800',
    isbn: metaJson,
    total_copies: 1,
    available_copies: 1,
    reads_count: 0,
    is_new: true,
    is_audiobook: false,
  };

  try {
    // 1. Save to books table
    const { error } = await client.from('books').upsert(row);
    if (error) {
      console.warn('Could not save bookOfWeek document to books table:', error);
    }

    // 2. Also try dedicated book_of_week table if it exists
    try {
      await client.from('book_of_week').upsert({
        id: `bow-${gradeLevel}`,
        grade_level: gradeLevel,
        section: gradeLevel === 'primary' ? 'primary' : 'college',
        title: spotlight.title,
        subtitle: spotlight.subtitle,
        description: spotlight.description,
        featured_book_id: spotlight.featuredBookId,
        badge_text: spotlight.badgeText,
        bg_gradient: spotlight.bgGradient,
        cover_url: spotlight.coverUrl,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Table may not exist, non-fatal
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error saving bookOfWeek document' };
  }
}


