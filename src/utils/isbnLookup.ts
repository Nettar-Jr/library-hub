/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BOOK_CATEGORIES } from '../types';

export interface OpenLibraryBookResult {
  title: string;
  subtitle?: string;
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
  deweyClass?: string;
  suggestedCategory?: string;
  suggestedAgeRange?: string;
  suggestedReadingLevel?: string;
  opacSource?: string;
}

/**
 * Converts a 10-digit ISBN into a 13-digit ISBN (Bookland 978 prefix)
 */
export function isbn10to13(isbn10: string): string | null {
  const clean = isbn10.replace(/[^0-9X]/gi, '');
  if (clean.length !== 10) return null;
  const base = '978' + clean.slice(0, 9);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + check;
}

/**
 * Converts a 13-digit ISBN starting with 978 into a 10-digit ISBN
 */
export function isbn13to10(isbn13: string): string | null {
  const clean = isbn13.replace(/[^0-9X]/gi, '');
  if (clean.length !== 13 || !clean.startsWith('978')) return null;
  const base = clean.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(base[i], 10) * (10 - i);
  }
  const check = (11 - (sum % 11)) % 11;
  return base + (check === 10 ? 'X' : String(check));
}

/**
 * Intelligently maps book subjects and keywords to library categories
 */
function inferCategoryFromKeywords(text: string): string {
  const lower = text.toLowerCase();
  if (lower.match(/africa|nigeria|kenya|ghana|colonial|yoruba|igbo|achebe|adichie|african/)) {
    return 'African Literature';
  }
  if (lower.match(/space|physics|astronomy|chemistry|biology|science|math|stem|quantum|cosmology/)) {
    return 'STEM & Space';
  }
  if (lower.match(/program|python|javascript|coding|computer|algorithm|software|tech|data|code/)) {
    return 'Coding & Tech';
  }
  if (lower.match(/history|civilisation|war|ancient|empire|biography|memoir|political|government/)) {
    return 'History & World Culture';
  }
  if (lower.match(/animal|wildlife|nature|ecology|environment|botany|ocean|earth/)) {
    return 'Nature & Wildlife';
  }
  if (lower.match(/poem|poetry|drama|play|shakespear|classic|fiction|epic|mythology/)) {
    return 'Curriculum Classics';
  }
  if (lower.match(/comic|manga|graphic novel|illustration/)) {
    return 'Comics & Graphic Novels';
  }
  return 'Curriculum Classics';
}

/**
 * Infers standard Dewey Decimal classification code and class
 */
function inferDewey(category: string, rawDewey?: string): { code: string; classNum: string } {
  if (rawDewey && rawDewey.trim()) {
    const clean = rawDewey.trim();
    const classNum = clean.split('.')[0].padEnd(3, '0').slice(0, 3);
    return { code: clean, classNum };
  }

  const map: Record<string, { code: string; classNum: string }> = {
    'African Literature': { code: '896.3', classNum: '800' },
    'STEM & Space': { code: '520.1', classNum: '500' },
    'Coding & Tech': { code: '005.1', classNum: '000' },
    'History & World Culture': { code: '909.8', classNum: '900' },
    'Nature & Wildlife': { code: '590.2', classNum: '500' },
    'Curriculum Classics': { code: '823.9', classNum: '800' },
    'Comics & Graphic Novels': { code: '741.5', classNum: '700' },
  };

  return map[category] || { code: '800', classNum: '800' };
}

/**
 * Synthesizes an audible confirmation or error tone via browser Web Audio API
 * Replicates the familiar high-speed chime of POS laser barcode scanners
 */
export function playScannerBeep(type: 'success' | 'warning' = 'success'): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Crisp POS double-tone (1350Hz -> 1850Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1350, ctx.currentTime);
      osc.frequency.setValueAtTime(1850, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.18);
    } else {
      // Lower warning tone (380Hz)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch {
    // AudioContext blocked or unsupported in environment
  }
}

/**
 * Looks up comprehensive book metadata by querying global library OPAC databases:
 * 1. Open Library (Internet Archive OPAC)
 * 2. Google Books API (Client-side global index)
 * Returns normalized title, author, description, Dewey decimal classification,
 * categories, age range, and cover image.
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
      error: 'Please enter or scan a standard 10-digit or 13-digit ISBN barcode.',
    };
  }

  // Calculate alternative representation for maximum OPAC hit rate
  const altIsbn = cleanIsbn.length === 10 ? isbn10to13(cleanIsbn) : isbn13to10(cleanIsbn);
  const isbnsToQuery = [cleanIsbn, altIsbn].filter(Boolean) as string[];

  let resultBook: OpenLibraryBookResult | null = null;
  let errorMsg = '';

  // 1. Query Open Library Data API
  for (const queryIsbn of isbnsToQuery) {
    try {
      const bibKey = `ISBN:${queryIsbn}`;
      const url = `https://openlibrary.org/api/books?bibkeys=${bibKey}&jscmd=data&format=json`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const item = data[bibKey];
        if (item) {
          const authors = item.authors ? item.authors.map((a: any) => a.name) : ['Unknown Author'];
          const publishers = item.publishers ? item.publishers.map((p: any) => p.name) : [];
          const subjects = item.subjects ? item.subjects.map((s: any) => s.name).slice(0, 8) : [];

          let description = '';
          if (typeof item.notes === 'string') {
            description = item.notes;
          } else if (item.description) {
            description = typeof item.description === 'string' ? item.description : item.description.value || '';
          }

          const coverUrl = item.cover?.large || item.cover?.medium || item.cover?.small || undefined;
          const deweyRaw = item.classifications?.dewey_decimal_class?.[0] || item.dewey_decimal_class?.[0] || undefined;
          const keywordHaystack = `${item.title} ${subjects.join(' ')} ${description}`;
          const category = inferCategoryFromKeywords(keywordHaystack);
          const dewey = inferDewey(category, deweyRaw);

          resultBook = {
            title: item.title || 'Untitled Volume',
            subtitle: item.subtitle,
            authors,
            publishDate: item.publish_date,
            publishers,
            description,
            coverUrl,
            numberOfPages: item.number_of_pages,
            isbn13: cleanIsbn.length === 13 ? cleanIsbn : (altIsbn?.length === 13 ? altIsbn : undefined),
            isbn10: cleanIsbn.length === 10 ? cleanIsbn : (altIsbn?.length === 10 ? altIsbn : undefined),
            subjects,
            deweyCode: dewey.code,
            deweyClass: dewey.classNum,
            suggestedCategory: category,
            suggestedAgeRange: item.number_of_pages && item.number_of_pages > 300 ? 'Ages 13-18' : 'Ages 9-16',
            suggestedReadingLevel: item.number_of_pages && item.number_of_pages > 250 ? 'Lexile 880L' : 'Lexile 750L',
            opacSource: 'Open Library OPAC (Internet Archive)',
          };
          break;
        }
      }
    } catch {
      // Continue to next query
    }
  }

  // 2. If description is empty, attempt Open Library direct JSON endpoint for synopsis
  if (resultBook && !resultBook.description) {
    try {
      const jsonRes = await fetch(`https://openlibrary.org/isbn/${cleanIsbn}.json`);
      if (jsonRes.ok) {
        const jsonData = await jsonRes.json();
        if (jsonData.description) {
          resultBook.description = typeof jsonData.description === 'string'
            ? jsonData.description
            : jsonData.description.value || '';
        }
      }
    } catch {}
  }

  // 3. Fallback or augment with Google Books API if available
  try {
    const gbRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
    if (gbRes.ok) {
      const gbData = await gbRes.json();
      if (gbData.items && gbData.items[0]?.volumeInfo) {
        const info = gbData.items[0].volumeInfo;
        const gbAuthors = info.authors || [];
        const gbCategories = info.categories || [];
        const gbCover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail;

        if (!resultBook) {
          const keywordHaystack = `${info.title} ${gbCategories.join(' ')} ${info.description || ''}`;
          const category = inferCategoryFromKeywords(keywordHaystack);
          const dewey = inferDewey(category);

          resultBook = {
            title: info.title || 'Untitled Volume',
            subtitle: info.subtitle,
            authors: gbAuthors.length > 0 ? gbAuthors : ['Unknown Author'],
            publishDate: info.publishedDate,
            publishers: info.publisher ? [info.publisher] : [],
            description: info.description || '',
            coverUrl: gbCover ? gbCover.replace('http://', 'https://') : undefined,
            numberOfPages: info.pageCount,
            isbn13: cleanIsbn.length === 13 ? cleanIsbn : undefined,
            isbn10: cleanIsbn.length === 10 ? cleanIsbn : undefined,
            subjects: gbCategories,
            deweyCode: dewey.code,
            deweyClass: dewey.classNum,
            suggestedCategory: category,
            suggestedAgeRange: info.pageCount && info.pageCount > 300 ? 'Ages 13-18' : 'Ages 9-16',
            suggestedReadingLevel: 'Lexile 850L',
            opacSource: 'Google Books Global OPAC',
          };
        } else {
          // Merge missing fields
          if (!resultBook.coverUrl && gbCover) {
            resultBook.coverUrl = gbCover.replace('http://', 'https://');
          }
          if (!resultBook.description && info.description) {
            resultBook.description = info.description;
          }
          if (resultBook.authors.length === 0 && gbAuthors.length > 0) {
            resultBook.authors = gbAuthors;
          }
        }
      }
    }
  } catch {}

  if (resultBook) {
    return {
      success: true,
      book: resultBook,
    };
  }

  return {
    success: false,
    error: `No bibliographic record found for ISBN "${cleanIsbn}" in Open Library or Google Books OPAC. You can enter details manually.`,
  };
}
