/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Book, StudentSubmission, CirculationRecord, BookHold } from '../types';

// Load Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.trim() !== '' && 
  supabaseAnonKey.trim() !== ''
);

// Lazy singleton client creation
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
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
    rating: Number(row.rating ?? 5.0),
    pageCount: Number(row.page_count ?? row.pageCount ?? 200),
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
      format: book.usageType || 'circulation',
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
