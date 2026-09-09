/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Book } from '../types';

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
