/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BookReview {
  id: string;
  reviewerName: string;
  reviewerRole: 'student' | 'teacher' | 'librarian';
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
  coverImage?: string;
  readsCount: number;
  deweyClass: string; // e.g. "000", "500", "800"
  deweyCode: string;  // e.g. "005.1", "523.1", "813"
  reviews?: BookReview[];
  rating?: number; // Average star rating
  usageType?: 'circulation' | 'reserve'; // 'circulation' = can be borrowed, 'reserve' = library use only
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
  role: 'student' | 'teacher';
  gradeOrYear?: string; // e.g., 'Year 9', 'Primary 5'
  department?: string;  // e.g., 'Science Department', 'English Department'
  libraryCardId: string; // e.g. 'LIB-STUD-9128'
  email: string;
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

export type SubmissionCategory = 'short-story' | 'poetry' | 'academic-essay' | 'digital-art';

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

export type UserRole = 'librarian' | 'learner';
