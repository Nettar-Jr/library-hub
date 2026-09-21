/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OpenLibraryBookResult {
  title: string;
  authors: string[];
  publishDate?: string;
  publishers?: string[];
  description?: string;
  coverUrl?: string;
  numberOfPages?: number;
  isbn13?: string;
  isbn10?: string;
  subjects?: string[];
  deweyCode?: string;
}

/**
 * Looks up book metadata from Open Library by ISBN (ISBN-10 or ISBN-13)
 * Free, open, and requires no API key.
 */
export async function lookupBookByISBN(isbnInput: string): Promise<{
  success: boolean;
  book?: OpenLibraryBookResult;
  error?: string;
}> {
  const cleanIsbn = isbnInput.replace(/[^0-9X]/gi, '').trim();

  if (!cleanIsbn || (cleanIsbn.length !== 10 && cleanIsbn.length !== 13)) {
    return {
      success: false,
      error: 'Please enter a valid 10-digit or 13-digit ISBN format.',
    };
  }

  try {
    const bibKey = `ISBN:${cleanIsbn}`;
    const url = `https://openlibrary.org/api/books?bibkeys=${bibKey}&jscmd=data&format=json`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, error: `Lookup service responded with status ${res.status}` };
    }

    const data = await res.json();
    const item = data[bibKey];

    if (!item) {
      return {
        success: false,
        error: `No catalog record found for ISBN "${cleanIsbn}" in Open Library.`,
      };
    }

    const authors = item.authors ? item.authors.map((a: any) => a.name) : ['Unknown Author'];
    const publishers = item.publishers ? item.publishers.map((p: any) => p.name) : [];
    const subjects = item.subjects ? item.subjects.map((s: any) => s.name).slice(0, 5) : [];

    let description = '';
    if (typeof item.notes === 'string') {
      description = item.notes;
    } else if (item.description) {
      description = typeof item.description === 'string' ? item.description : item.description.value || '';
    }

    const coverUrl = item.cover?.large || item.cover?.medium || item.cover?.small || undefined;
    const deweyCode = item.classifications?.dewey_decimal_class?.[0] || item.dewey_decimal_class?.[0] || undefined;

    return {
      success: true,
      book: {
        title: item.title || 'Untitled Volume',
        authors,
        publishDate: item.publish_date,
        publishers,
        description,
        coverUrl,
        numberOfPages: item.number_of_pages,
        isbn13: cleanIsbn.length === 13 ? cleanIsbn : undefined,
        isbn10: cleanIsbn.length === 10 ? cleanIsbn : undefined,
        subjects,
        deweyCode,
      },
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Lookup timed out. Please check your internet connection.' };
    }
    return { success: false, error: err.message || 'Failed to query book database.' };
  }
}
