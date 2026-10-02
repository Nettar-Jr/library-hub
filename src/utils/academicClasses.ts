/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StreamInfo {
  code: 'D' | 'G' | 'E' | 'O' | 'R';
  name: 'Diamond' | 'Gold' | 'Emerald' | 'Onyx' | 'Ruby';
}

export const ACADEMIC_STREAMS: StreamInfo[] = [
  { code: 'D', name: 'Diamond' },
  { code: 'G', name: 'Gold' },
  { code: 'E', name: 'Emerald' },
  { code: 'O', name: 'Onyx' },
  { code: 'R', name: 'Ruby' },
];

export interface AcademicClass {
  code: string;            // e.g. '1G', '9E', '12D'
  year: number;            // 1 to 12
  streamCode: 'D' | 'G' | 'E' | 'O' | 'R';
  streamName: string;      // 'Diamond' | 'Gold' | 'Emerald' | 'Onyx' | 'Ruby'
  label: string;           // e.g. '1G (Year 1 Gold)'
  fullLabel: string;       // e.g. 'Year 1 Gold (1G)'
  section: 'primary' | 'secondary';
  stage: 'primary' | 'junior-secondary' | 'senior-secondary';
  maxBorrowLimit: number | null; // null for primary (manual), 2 for Year 7-9, 3 for Year 10-12
}

/**
 * Generate all 60 academic classes across Year 1 to 12
 * and streams Diamond, Gold, Emerald, Onyx, and Ruby
 */
export const ALL_ACADEMIC_CLASSES: AcademicClass[] = [];

for (let y = 1; y <= 12; y++) {
  const isPrimary = y <= 6;
  const isJuniorSec = y >= 7 && y <= 9;
  const stage = isPrimary ? 'primary' : isJuniorSec ? 'junior-secondary' : 'senior-secondary';
  const section = isPrimary ? 'primary' : 'secondary';
  const maxBorrowLimit = isPrimary ? null : isJuniorSec ? 2 : 3;

  for (const stream of ACADEMIC_STREAMS) {
    const code = `${y}${stream.code}`;
    ALL_ACADEMIC_CLASSES.push({
      code,
      year: y,
      streamCode: stream.code,
      streamName: stream.name,
      label: `${code} - Year ${y} ${stream.name}`,
      fullLabel: `Year ${y} ${stream.name} (${code})`,
      section,
      stage,
      maxBorrowLimit,
    });
  }
}

export const PRIMARY_ACADEMIC_CLASSES = ALL_ACADEMIC_CLASSES.filter(c => c.section === 'primary');
export const JUNIOR_SECONDARY_CLASSES = ALL_ACADEMIC_CLASSES.filter(c => c.stage === 'junior-secondary');
export const SENIOR_SECONDARY_CLASSES = ALL_ACADEMIC_CLASSES.filter(c => c.stage === 'senior-secondary');
export const SECONDARY_ACADEMIC_CLASSES = ALL_ACADEMIC_CLASSES.filter(c => c.section === 'secondary');

/**
 * Quick lookup set of all class codes (e.g. '1G', '9E')
 */
export const VALID_CLASS_CODES = new Set(ALL_ACADEMIC_CLASSES.map(c => c.code));

export const ALL_YEARS = Array.from({ length: 12 }, (_, i) => i + 1);

export function getClassesForYear(year: number): AcademicClass[] {
  return ALL_ACADEMIC_CLASSES.filter(c => c.year === year);
}

/**
 * Parse an academic class string like '9E', 'Year 9E', 'Year 9 Emerald', '1G', 'Primary 5', '10 R'
 */
export function parseAcademicClass(raw: string | null | undefined): AcademicClass | null {
  if (!raw) return null;
  const trimmed = raw.trim().toUpperCase();

  // Direct code match: e.g. '1G', '12D'
  const direct = ALL_ACADEMIC_CLASSES.find(c => c.code === trimmed);
  if (direct) return direct;

  // Regex match for Year/Grade/Class/Primary <number> <Stream>: e.g. 'YEAR 1 GOLD', 'YEAR 9E', 'CLASS 10 RUBY', '10 R'
  const match = trimmed.match(/(?:YEAR|GRADE|CLASS|PRIMARY|PRI)?\s*([1-9]|1[0-2])\s*[-/]?\s*([DGEO R]|DIAMOND|GOLD|EMERALD|ONYX|RUBY)?/i);
  if (match) {
    const yearNum = parseInt(match[1], 10);
    const streamPart = (match[2] || '').trim();
    let streamCode: 'D' | 'G' | 'E' | 'O' | 'R' = 'D';

    if (streamPart.startsWith('G')) streamCode = 'G';
    else if (streamPart.startsWith('E')) streamCode = 'E';
    else if (streamPart.startsWith('O')) streamCode = 'O';
    else if (streamPart.startsWith('R')) streamCode = 'R';
    else streamCode = 'D';

    const code = `${yearNum}${streamCode}`;
    return ALL_ACADEMIC_CLASSES.find(c => c.code === code) || null;
  }

  return null;
}
