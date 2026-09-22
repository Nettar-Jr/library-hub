/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, LibraryUser } from '../types';

/**
 * Robust CSV Line & Cell Parser compliant with RFC 4180.
 * Handles delimiters inside quotes, escaped quotes (""), multiline cells, and varied line breaks.
 */
export function parseCSV(rawText: string): string[][] {
  if (!rawText || !rawText.trim()) return [];

  // Strip byte order mark (BOM) if present
  let cleanText = rawText.replace(/^\uFEFF/, '');

  // Detect delimiter: check comma, semicolon, tab
  const sampleLines = cleanText.split(/\r?\n/).slice(0, 5).filter(l => l.trim().length > 0);
  let delimiter = ',';
  if (sampleLines.length > 0) {
    const commaCount = (sampleLines[0].match(/,/g) || []).length;
    const semiCount = (sampleLines[0].match(/;/g) || []).length;
    const tabCount = (sampleLines[0].match(/\t/g) || []).length;
    if (semiCount > commaCount && semiCount > tabCount) {
      delimiter = ';';
    } else if (tabCount > commaCount && tabCount > semiCount) {
      delimiter = '\t';
    }
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" -> "
        currentCell += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      // Cell boundary
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      // Line boundary
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in \r\n
      }
      currentRow.push(currentCell.trim());
      // Only push non-empty rows
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Add final cell & row if remaining
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts tabular object records to standard CSV format.
 */
export function generateCSV<T extends Record<string, any>>(
  records: T[],
  columnConfigs: { key: keyof T; header: string; format?: (val: any) => string }[]
): string {
  const headerRow = columnConfigs.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');
  
  const dataRows = records.map(record => {
    return columnConfigs.map(col => {
      const rawVal = record[col.key];
      let strVal = '';
      if (col.format) {
        strVal = col.format(rawVal);
      } else if (rawVal === null || rawVal === undefined) {
        strVal = '';
      } else if (typeof rawVal === 'boolean') {
        strVal = rawVal ? 'Yes' : 'No';
      } else {
        strVal = String(rawVal);
      }
      // Escape quotes and wrap with quotes
      return `"${strVal.replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Triggers a browser file download of CSV content
 */
export function downloadCSVFile(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --------------------------------------------------------------------------
// Column Aliases & Matching
// --------------------------------------------------------------------------

export const ROSTER_FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'full name', 'fullname', 'student name', 'pupil name', 'patron name', 'user name', 'borrower name', 'borrower'],
  firstName: ['first name', 'firstname', 'given name', 'forename'],
  lastName: ['last name', 'lastname', 'surname', 'family name'],
  email: ['email', 'e-mail', 'school email', 'student email', 'staff email', 'email address', 'mail'],
  role: ['role', 'user role', 'type', 'account type', 'user type', 'category', 'status'],
  gradeOrYear: ['grade', 'year', 'class', 'form', 'grade/year', 'grade or year', 'year group', 'level', 'classroom'],
  department: ['department', 'dept', 'faculty', 'subject', 'subject department', 'division'],
  libraryCardId: ['card id', 'library card id', 'library card', 'card number', 'barcode', 'patron id', 'student id', 'staff id', 'id number'],
  assignedTeacherName: ['teacher', 'assigned teacher', 'advisor', 'tutor', 'homeroom teacher', 'form tutor', 'mentor'],
};

export const CATALOG_FIELD_ALIASES: Record<string, string[]> = {
  title: ['title', 'book title', 'resource title', 'name', 'item title'],
  author: ['author', 'author(s)', 'authors', 'writer', 'creator', 'by'],
  isbn: ['isbn', 'isbn-13', 'isbn13', 'isbn-10', 'isbn10', 'barcode', 'book barcode', 'ean'],
  category: ['category', 'genre', 'subject', 'section', 'collection', 'classification'],
  totalCopies: ['total copies', 'copies', 'quantity', 'count', 'qty', 'num copies', 'stock'],
  availableCopies: ['available copies', 'available', 'copies available'],
  deweyCode: ['dewey code', 'dewey', 'dewey decimal', 'call number', 'call num', 'shelf mark', 'ddc'],
  deweyClass: ['dewey class', 'class number', 'class', 'dewey category'],
  description: ['description', 'summary', 'synopsis', 'blurb', 'notes', 'about'],
  ageRange: ['age range', 'age', 'ages', 'target age', 'grade level', 'audience'],
  readingLevel: ['reading level', 'lexile', 'lexile level', 'ar level', 'reading grade', 'reading stage'],
  hasAudio: ['audio', 'audiobook', 'has audio', 'audio format', 'narration'],
  usageType: ['usage type', 'usage', 'circulation type', 'loan type', 'borrowable'],
  coverImage: ['cover image', 'cover', 'cover url', 'image url', 'image', 'book cover'],
};

/**
 * Attempts to automatically map recognized CSV headers to required system keys.
 */
export function autoMapColumns(headers: string[], aliasMap: Record<string, string[]>): Record<string, string> {
  const mapping: Record<string, string> = {};

  headers.forEach(header => {
    const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [key, aliases] of Object.entries(aliasMap)) {
      if (mapping[key]) continue; // already mapped
      const matched = aliases.some(alias => {
        const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        return clean === cleanAlias || clean.includes(cleanAlias) || cleanAlias.includes(clean);
      });
      if (matched) {
        mapping[key] = header;
        break;
      }
    }
  });

  return mapping;
}

// --------------------------------------------------------------------------
// Sample Templates
// --------------------------------------------------------------------------

export const SAMPLE_ROSTER_CSV = `Full Name,Email,Role,Grade/Year,Department,Library Card ID,Assigned Teacher
Chidi Okafor,chidi.okafor@school.edu,Student,Year 9,,LIB-STUD-1001,Mrs. Emily Cole
Amara Diallo,amara.diallo@school.edu,Student,Year 10,,LIB-STUD-1002,Dr. Marcus Vance
Kwame Mensah,kwame.mensah@school.edu,Student,Year 8,,LIB-STUD-1003,Mrs. Emily Cole
Zainab Bello,zainab.bello@school.edu,Student,Year 11,,LIB-STUD-1004,Mr. Tariq Al-Mansoor
Kofi Boateng,kofi.boateng@school.edu,Student,Year 7,,LIB-STUD-1005,Mrs. Emily Cole
Fatima Zahra,fatima.zahra@school.edu,Student,Year 9,,LIB-STUD-1006,Dr. Marcus Vance
Dr. Marcus Vance,marcus.vance@school.edu,Teacher,,Science Department,LIB-TEACH-2001,
Mrs. Emily Cole,emily.cole@school.edu,Teacher,,English Department,LIB-TEACH-2002,
Mr. Tariq Al-Mansoor,tariq.mansoor@school.edu,Teacher,,Computer Science Department,LIB-TEACH-2003,
Ms. Grace Adeyemi,grace.adeyemi@school.edu,Teacher,,Humanities & History,LIB-TEACH-2004,`;

export const SAMPLE_CATALOG_CSV = `Title,Author,ISBN,Category,Copies,Dewey Code,Reading Level,Age Range,Audio Available,Usage Type,Description
Things Fall Apart,Chinua Achebe,9780385474542,African Literature,6,896.3,Lexile 890L,Ages 12-18,Yes,circulation,"The classic post-colonial narrative tracing the life of Okonkwo and the tragic transformation of Igbo society."
The Boy Who Harnessed the Wind,William Kamkwamba & Bryan Mealer,9780061729867,STEM & Space,4,621.312,Lexile 910L,Ages 10-16,Yes,circulation,"Inspiring true story of a Malawian boy who built a windmill from scrap metal to bring electricity and water to his village."
Half of a Yellow Sun,Chimamanda Ngozi Adichie,9781400095209,African Literature,5,823.914,Lexile 950L,Ages 14-18,No,circulation,"A haunting story of love, war, and political upheaval during the Biafran conflict in the late 1960s."
Astrophysics for Young People in a Hurry,Neil deGrasse Tyson,9780393356502,STEM & Space,5,520.1,Lexile 820L,Ages 9-14,Yes,circulation,"A dynamic, witty journey through fundamental cosmic questions of space, matter, time, and gravity."
Python for Young Programmers,Al Sweigart,9781593274079,Coding & Tech,4,005.133,Lexile 780L,Ages 10-18,No,circulation,"Hands-on project-based introduction to Python syntax, loops, game development, and algorithmic logic."
Selected Poems of Maya Angelou,Maya Angelou,9780440211976,Classics,3,811.54,Lexile 850L,Ages 12-18,Yes,circulation,"Moving verses celebrating resilience, human dignity, civil rights, identity, and personal empowerment."
Encyclopedia of African History,Kevin Shillington,9781579582456,History & World Culture,2,960.03,Lexile 1100L,Ages 14-18,No,reserve,"Comprehensive reference volume chronicling ancient civilisations, trade routes, independence movements, and post-colonial developments."`;

/**
 * Infer Dewey decimal class and code from category
 */
export function inferDeweyFromCategory(category: string): { deweyClass: string; deweyCode: string } {
  const cat = category.toLowerCase();
  if (cat.includes('africa') || cat.includes('lit') || cat.includes('novel')) {
    return { deweyClass: '800', deweyCode: '896.3' };
  }
  if (cat.includes('stem') || cat.includes('space') || cat.includes('physic') || cat.includes('astro')) {
    return { deweyClass: '500', deweyCode: '520.1' };
  }
  if (cat.includes('code') || cat.includes('tech') || cat.includes('computer') || cat.includes('programm')) {
    return { deweyClass: '000', deweyCode: '005.1' };
  }
  if (cat.includes('classic') || cat.includes('curriculum')) {
    return { deweyClass: '800', deweyCode: '823.9' };
  }
  if (cat.includes('comic') || cat.includes('graphic') || cat.includes('art')) {
    return { deweyClass: '700', deweyCode: '741.5' };
  }
  if (cat.includes('history') || cat.includes('culture') || cat.includes('geograph')) {
    return { deweyClass: '900', deweyCode: '909.8' };
  }
  if (cat.includes('nature') || cat.includes('wild') || cat.includes('biol')) {
    return { deweyClass: '500', deweyCode: '590.2' };
  }
  if (cat.includes('audio') || cat.includes('media')) {
    return { deweyClass: '800', deweyCode: '808.8' };
  }
  return { deweyClass: '800', deweyCode: '800' };
}

// --------------------------------------------------------------------------
// Validation & Normalization
// --------------------------------------------------------------------------

export interface ParsedRosterRow {
  raw: Record<string, string>;
  rowNumber: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'learner' | 'staff';
  gradeOrYear?: string;
  department?: string;
  libraryCardId: string;
  assignedTeacherName?: string;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
}

export interface ParsedCatalogRow {
  raw: Record<string, string>;
  rowNumber: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  deweyCode: string;
  deweyClass: string;
  description: string;
  readingLevel?: string;
  ageRange?: string;
  hasAudio: boolean;
  usageType: 'circulation' | 'reserve';
  coverImage?: string;
  status: 'valid' | 'warning' | 'error';
  messages: string[];
}

/**
 * Validate and normalize parsed Roster rows
 */
export function normalizeRosterRows(
  rawRows: string[][],
  mapping: Record<string, string>,
  existingUsers: LibraryUser[]
): ParsedRosterRow[] {
  if (rawRows.length < 2) return [];

  const headers = rawRows[0];
  const dataRows = rawRows.slice(1);

  // Pre-index existing emails and card IDs for duplicate detection
  const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
  const existingCards = new Set(existingUsers.map(u => u.libraryCardId?.toLowerCase()));

  // In-batch tracking
  const batchEmails = new Set<string>();
  const batchCards = new Set<string>();

  return dataRows.map((row, index) => {
    const rowNumber = index + 2; // header is row 1
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      raw[h] = row[i] || '';
    });

    const messages: string[] = [];
    let status: 'valid' | 'warning' | 'error' = 'valid';

    // 1. Name
    let name = raw[mapping.name] || '';
    if (!name && mapping.firstName && mapping.lastName) {
      const first = raw[mapping.firstName] || '';
      const last = raw[mapping.lastName] || '';
      name = `${first} ${last}`.trim();
    }
    name = name.trim();

    if (!name) {
      status = 'error';
      messages.push('Missing required name.');
    }

    // 2. Email
    let email = (raw[mapping.email] || '').trim().toLowerCase();
    if (!email) {
      // Auto-generate fallback email if missing
      const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
      email = `${sanitized || 'patron'}@school.edu`;
      messages.push('Email missing, auto-generated placeholder.');
      if (status !== 'error') status = 'warning';
    } else if (!email.includes('@')) {
      status = 'error';
      messages.push('Invalid email address format.');
    } else if (existingEmails.has(email) || batchEmails.has(email)) {
      messages.push('Duplicate email detected; will update existing patron if selected.');
      if (status !== 'error') status = 'warning';
    }
    batchEmails.add(email);

    // 3. Role
    const rawRole = (raw[mapping.role] || '').trim().toLowerCase();
    let role: 'student' | 'teacher' | 'admin' | 'learner' | 'staff' = 'student';
    if (rawRole.includes('teach') || rawRole.includes('staff') || rawRole.includes('faculty') || rawRole.includes('prof')) {
      role = 'teacher';
    } else if (rawRole.includes('admin') || rawRole.includes('lib')) {
      role = 'admin';
    } else {
      role = 'student';
    }

    // 4. Grade / Year or Department
    let gradeOrYear = (raw[mapping.gradeOrYear] || '').trim();
    let department = (raw[mapping.department] || '').trim();

    if (role === 'student' && !gradeOrYear) {
      gradeOrYear = 'Year 9';
      messages.push('Grade/Year unassigned, defaulted to Year 9.');
      if (status !== 'error') status = 'warning';
    }

    if (role === 'teacher' && !department) {
      department = 'General Faculty';
      messages.push('Department unassigned, defaulted to General Faculty.');
      if (status !== 'error') status = 'warning';
    }

    // 5. Library Card ID
    let libraryCardId = (raw[mapping.libraryCardId] || '').trim().toUpperCase();
    if (!libraryCardId) {
      const randNum = Math.floor(1000 + Math.random() * 9000);
      libraryCardId = role === 'student' ? `LIB-STUD-${randNum}` : `LIB-TEACH-${randNum}`;
      messages.push(`No Card ID provided, generated ${libraryCardId}.`);
      if (status !== 'error') status = 'warning';
    } else if (existingCards.has(libraryCardId.toLowerCase()) || batchCards.has(libraryCardId.toLowerCase())) {
      messages.push('Library Card ID already in use; updating patron record.');
      if (status !== 'error') status = 'warning';
    }
    batchCards.add(libraryCardId.toLowerCase());

    // 6. Assigned Teacher
    const assignedTeacherName = (raw[mapping.assignedTeacherName] || '').trim() || undefined;

    return {
      raw,
      rowNumber,
      name,
      email,
      role,
      gradeOrYear: role === 'student' ? gradeOrYear : undefined,
      department: role === 'teacher' || role === 'admin' ? department : undefined,
      libraryCardId,
      assignedTeacherName,
      status,
      messages,
    };
  });
}

/**
 * Validate and normalize parsed Catalog rows
 */
export function normalizeCatalogRows(
  rawRows: string[][],
  mapping: Record<string, string>,
  existingBooks: Book[]
): ParsedCatalogRow[] {
  if (rawRows.length < 2) return [];

  const headers = rawRows[0];
  const dataRows = rawRows.slice(1);

  const existingISBNs = new Set(existingBooks.map(b => b.isbn.replace(/[^0-9X]/gi, '').toLowerCase()));
  const existingTitles = new Set(existingBooks.map(b => b.title.trim().toLowerCase()));

  const batchISBNs = new Set<string>();

  return dataRows.map((row, index) => {
    const rowNumber = index + 2;
    const raw: Record<string, string> = {};
    headers.forEach((h, i) => {
      raw[h] = row[i] || '';
    });

    const messages: string[] = [];
    let status: 'valid' | 'warning' | 'error' = 'valid';

    // 1. Title
    const title = (raw[mapping.title] || '').trim();
    if (!title) {
      status = 'error';
      messages.push('Missing required book title.');
    }

    // 2. Author
    let author = (raw[mapping.author] || '').trim();
    if (!author) {
      author = 'Unknown Author';
      messages.push('Missing author; marked as Unknown Author.');
      if (status !== 'error') status = 'warning';
    }

    // 3. ISBN
    let isbn = (raw[mapping.isbn] || '').trim();
    const cleanISBN = isbn.replace(/[^0-9X]/gi, '').toLowerCase();
    if (!isbn) {
      // Auto generate pseudocode ISBN
      const fakeNum = Math.floor(1000000000 + Math.random() * 9000000000);
      isbn = `978${fakeNum}`;
      messages.push('No ISBN provided; generated accession ISBN.');
      if (status !== 'error') status = 'warning';
    } else if (cleanISBN && (existingISBNs.has(cleanISBN) || batchISBNs.has(cleanISBN))) {
      messages.push('Duplicate ISBN; copies will be merged/restocked.');
      if (status !== 'error') status = 'warning';
    } else if (existingTitles.has(title.toLowerCase())) {
      messages.push('Matching book title already in catalog.');
      if (status !== 'error') status = 'warning';
    }
    if (cleanISBN) batchISBNs.add(cleanISBN);

    // 4. Category
    let category = (raw[mapping.category] || '').trim();
    if (!category) {
      category = 'Curriculum Classics';
      messages.push('Category unassigned; defaulted to Curriculum Classics.');
      if (status !== 'error') status = 'warning';
    }

    // 5. Copies
    let totalCopies = parseInt(raw[mapping.totalCopies] || '1', 10);
    if (isNaN(totalCopies) || totalCopies < 1) {
      totalCopies = 1;
      messages.push('Copies invalid or omitted; defaulted to 1 copy.');
      if (status !== 'error') status = 'warning';
    }

    let availableCopies = parseInt(raw[mapping.availableCopies] || `${totalCopies}`, 10);
    if (isNaN(availableCopies) || availableCopies > totalCopies) {
      availableCopies = totalCopies;
    }

    // 6. Dewey Code & Class
    const inferred = inferDeweyFromCategory(category);
    let deweyCode = (raw[mapping.deweyCode] || '').trim();
    let deweyClass = (raw[mapping.deweyClass] || '').trim();

    if (!deweyCode) {
      deweyCode = inferred.deweyCode;
      messages.push(`Inferred Dewey Code ${deweyCode} from genre.`);
      if (status !== 'error') status = 'warning';
    }
    if (!deweyClass) {
      deweyClass = deweyCode.split('.')[0].padEnd(3, '0').slice(0, 3);
    }

    // 7. Description
    let description = (raw[mapping.description] || '').trim();
    if (!description) {
      description = `Educational and curriculum reading accession: ${title} by ${author}.`;
    }

    // 8. Reading level & Age range
    const readingLevel = (raw[mapping.readingLevel] || '').trim() || 'General';
    const ageRange = (raw[mapping.ageRange] || '').trim() || 'All Ages';

    // 9. Audio
    const rawAudio = (raw[mapping.hasAudio] || '').trim().toLowerCase();
    const hasAudio = rawAudio === 'true' || rawAudio === 'yes' || rawAudio === '1' || rawAudio === 'audio';

    // 10. Usage Type
    const rawUsage = (raw[mapping.usageType] || '').trim().toLowerCase();
    const usageType: 'circulation' | 'reserve' = rawUsage.includes('reserve') ? 'reserve' : 'circulation';

    // 11. Cover Image
    const coverImage = (raw[mapping.coverImage] || '').trim() || undefined;

    return {
      raw,
      rowNumber,
      title,
      author,
      isbn,
      category,
      totalCopies,
      availableCopies,
      deweyCode,
      deweyClass,
      description,
      readingLevel,
      ageRange,
      hasAudio,
      usageType,
      coverImage,
      status,
      messages,
    };
  });
}
