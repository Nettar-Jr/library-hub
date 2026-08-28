/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'LEARNER' | 'STAFF' | 'ADMIN' | 'learner' | 'staff' | 'admin' | 'librarian' | 'student' | 'teacher';
export type AppRole = 'LEARNER' | 'STAFF' | 'ADMIN';

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
}

export type CatalogViewMode = 'CAROUSEL' | 'GRID';

export interface BookReview {
  id: string;
  reviewerName: string;
  reviewerRole: 'student' | 'teacher' | 'librarian' | 'learner' | 'staff' | 'admin';
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
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
}

export interface LibraryUser {
  id: string;
  name: string;
  role: 'learner' | 'staff' | 'admin' | 'student' | 'teacher' | 'librarian';
  gradeOrYear?: string; // e.g., 'Year 9', 'Primary 5'
  department?: string;  // e.g., 'English Department', 'Science Department'
  libraryCardId: string; // e.g. 'LIB-STUD-1001'
  email: string;
  avatar?: string;
  assignedTeacherId?: string; // ID of assigned teacher/advisor
  assignedTeacherName?: string; // Name of assigned teacher/advisor
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
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'info' | 'alert' | 'achievement';
}
