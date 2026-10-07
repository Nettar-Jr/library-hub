/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'LEARNER' | 'STAFF' | 'ADMIN' | 'learner' | 'staff' | 'admin' | 'librarian' | 'student' | 'teacher';
export type AppRole = 'LEARNER' | 'STAFF' | 'ADMIN';

export type LibrarySection = 'college' | 'primary' | 'all';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  avatar?: string;
  assignedStaffId?: string; // For Learners linked to a Teacher
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  gradeOrYear?: string;
  department?: string;
  libraryCardId?: string;
  section?: LibrarySection;
  createdAt?: string;
}

export type NavView = 
  | 'EXPLORE' 
  | 'BOOKSHELF' 
  | 'COMMUNITY' 
  | 'BULLETIN'
  | 'SUBMIT'
  | 'MODERATION' 
  | 'CIRCULATION' 
  | 'DESK_UTILITIES' 
  | 'ANALYTICS' 
  | 'LOGIN';

export interface HeroSpotlightData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  featuredBookId: string;
  badgeText: string;
  bgGradient: string; // e.g., "from-blue-600 via-indigo-600 to-purple-600"
  coverUrl?: string;
  section?: 'college' | 'primary';
}

export type CatalogViewMode = 'CAROUSEL' | 'GRID';

export const BOOK_CATEGORIES = [
  'Popular',
  'African Literature',
  'Classics',
  'Fantasy & Adventure',
  'Children\'s Fiction',
  'Comics & Graphic Novels',
  'STEM & Space',
  'Coding & Tech',
  'Philosophy & Ethics',
  'History & Culture',
  'Economics & Society',
  'Audiobooks & Read-Aloud',
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number];

export interface BookReview {
  id: string;
  reviewerName: string;
  reviewerRole: 'student' | 'teacher' | 'librarian' | 'learner' | 'staff' | 'admin';
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
}

export type BookInventoryType = 'physical' | 'ebook';
export type InventoryFilter = 'all' | 'physical' | 'ebook';

export interface InventoryMetrics {
  totalOverallCount: number;
  totalPhysicalCount: number;
  totalEbookCount: number;
  physicalCopiesTotal: number;
  physicalCopiesAvailable: number;
  physicalCopiesOnLoan: number;
  ebookActiveReaders: number;
  ebookCompletedReads: number;
  ebookHalfwayReads: number;
}

export interface EBookPage {
  pageNumber: number;
  chapterTitle?: string;
  content: string;
  imageUrl?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  description: string;
  summary?: string;
  coverImage?: string;
  coverUrl?: string;
  readsCount: number;
  deweyClass: string; // e.g. "000", "500", "800"
  deweyCode: string;  // e.g. "005.1", "523.1", "813"
  callNumber?: string;
  reviews?: BookReview[];
  rating?: number; // Average star rating
  usageType?: 'circulation' | 'reserve'; // 'circulation' = can be borrowed, 'reserve' = library use only
  ageRange?: string; // e.g. "Ages 8-12", "All Ages", "Young Adult"
  readingLevel?: string; // e.g. "Lexile 740L", "AR 4.8"
  pageCount?: number;
  themeColor?: string; // Accent styling for card
  hasAudio?: boolean;
  isAudiobook?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isTeacherPick?: boolean;
  section?: 'college' | 'primary'; // Branch affiliation
  // Digital eBook extension
  inventoryType?: BookInventoryType; // 'physical' (default) or 'ebook'
  ebookFormat?: 'pages' | 'pdf' | 'text' | 'epub';
  ebookPages?: EBookPage[];
  ebookFileUrl?: string;
  ebookFileSize?: string;
  ebookFileName?: string;
}

export type ReadingMilestone = 'not-started' | 'just-started' | 'more-than-half' | 'completed';

export interface PageDwellRecord {
  pageNumber: number;
  durationSeconds: number; // dwell time on this page
  timestamp: string;
}

export interface ReadingProgressRecord {
  id: string; // `${userId}_${bookId}`
  userId: string;
  learnerName: string;
  bookId: string;
  bookTitle: string;
  author: string;
  coverUrl?: string;
  totalPages: number;
  currentPage: number; // page reader stopped on
  highestPageRead: number;
  pagesFlippedCount: number;
  totalDurationSeconds: number; // total reading duration in seconds
  pageDwells: PageDwellRecord[]; // tracking duration per page
  status: ReadingMilestone;
  percentCompleted: number; // 0 - 100
  startedAt: string;
  lastReadAt: string; // timestamp when they left the book
  completedAt?: string;
  notificationsEnabled: boolean; // reader can toggle notifications on/off per book
  lastNotifiedAt?: string; // timestamp when last reminder nudge was shown
}

export interface ReaderAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number; // 0 - 100
  target: number;
  current: number;
  category: 'books' | 'streak' | 'creative' | 'genres';
}

export type CirculationStatus = 'borrowed' | 'returned' | 'overdue' | 'lost' | 'misplaced';

export interface CirculationRecord {
  id: string;
  learnerName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: CirculationStatus;
  alertSent: boolean;
  isReplaced?: boolean;
  section?: 'college' | 'primary';
}

export interface LibraryUser {
  id: string;
  name: string;
  nickname?: string; // Preferred name or nickname
  username?: string; // Unique username or handle
  role: 'learner' | 'staff' | 'admin' | 'student' | 'teacher' | 'librarian';
  gradeOrYear?: string; // e.g., '9E', 'Year 9', 'Primary 5'
  department?: string;  // e.g., 'English Department', 'Science Department'
  libraryCardId: string; // e.g. 'LIB-STUD-1001'
  admissionNumber?: string; // e.g. 'PIS/SS/23/2345'
  email: string;
  password?: string; // Hashed or stored credential for authentication
  avatar?: string;
  assignedTeacherId?: string; // ID of assigned teacher/advisor
  assignedTeacherName?: string; // Name of assigned teacher/advisor
  section?: LibrarySection; // School section: college (secondary), primary (pupils), or all (global staff)
  createdAt: string;
}

export interface BookHold {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  holdDate: string;
  expiryDate: string; // 24 hours later
  status: 'active' | 'claimed' | 'released';
}

export type SubmissionCategory = 
  | 'short-story' 
  | 'poetry' 
  | 'academic-essay' 
  | 'digital-art' 
  | 'audio-podcast' 
  | 'video-multimedia';

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  rating?: number; // Peer rating out of 5 stars
}

export interface StudentSubmission {
  id: string;
  authorName: string;
  gradeOrYear: string;
  title: string;
  category: SubmissionCategory;
  content: string; // Text content or description
  imageUrl?: string; // Optional image URL for digital art or cover
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  moderationFeedback?: string;
  likesCount: number;
  likedByCurrentUser?: boolean;
  comments: Comment[];
  // Teacher delegation / vetting assignment
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  assignedTeacherDepartment?: string;
  assignedBy?: string;
  assignedAt?: string;
  assignmentNotes?: string;
  section?: 'college' | 'primary';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'info' | 'alert' | 'achievement';
  section?: 'college' | 'primary' | 'all';
}
