/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Book, CirculationRecord, StudentSubmission, Announcement, UserRole, AppRole, LibraryUser, User, NavView, BookHold, BookReview, HeroSpotlightData, CatalogViewMode, LibrarySection, InventoryFilter, InventoryMetrics, ReadingProgressRecord } from '../types';
import { initialBooks, initialCirculation, initialSubmissions, initialAnnouncements, initialHeroSpotlight, initialCollegeSpotlight, initialPrimarySpotlight, DEMO_SAMPLE_IDS } from '../data';
import { 
  isSupabaseConfigured, 
  fetchBooksFromSupabase, 
  insertBookToSupabase, 
  updateBookInSupabase,
  deleteBookFromSupabase,
  deleteCirculationRecordFromSupabase,
  fetchSubmissionsFromSupabase,
  insertSubmissionToSupabase,
  updateSubmissionInSupabase,
  fetchCirculationFromSupabase,
  insertCirculationToSupabase,
  updateCirculationInSupabase,
  fetchHoldsFromSupabase,
  insertHoldToSupabase,
  updateHoldInSupabase,
  fetchUsersFromSupabase,
  insertUserToSupabase,
  updateUserInSupabase,
  deleteUserFromSupabase,
  fetchBookOfWeekFromDatabase,
  saveBookOfWeekToDatabase
} from '../services/supabase';
import {
  getPendingOfflineMutations,
  enqueueOfflineMutation,
  dequeueOfflineMutation,
  setLastSyncTimestamp,
} from '../services/offlineSync';
import { parseAcademicClass } from '../utils/academicClasses';

export interface EmailLog {
  id: string;
  recipient: string;
  recipientEmail: string;
  subject: string;
  body: string;
  date: string;
  type: 'overdue' | 'lost' | 'general';
}

const pathToViewMap: Record<string, NavView> = {
  '/': 'EXPLORE',
  '/home': 'EXPLORE',
  '/catalog': 'BOOKSHELF',
  '/library': 'BOOKSHELF',
  '/gallery': 'COMMUNITY',
  '/moderator': 'MODERATION',
  '/moderation': 'MODERATION',
  '/circulation': 'CIRCULATION',
  '/desk-utilities': 'DESK_UTILITIES',
  '/desk': 'DESK_UTILITIES',
  '/analytics': 'ANALYTICS',
  '/announcements': 'BULLETIN',
  '/bulletin': 'BULLETIN',
  '/submit': 'SUBMIT',
  '/login': 'LOGIN',
  '/admin': 'LOGIN',
};

const viewToPathMap: Record<NavView, string> = {
  EXPLORE: '/',
  BOOKSHELF: '/catalog',
  COMMUNITY: '/gallery',
  BULLETIN: '/announcements',
  SUBMIT: '/submit',
  MODERATION: '/moderator',
  CIRCULATION: '/circulation',
  DESK_UTILITIES: '/desk-utilities',
  ANALYTICS: '/analytics',
  LOGIN: '/login',
};

interface AppContextType {
  // 3-Tier Role Management (Learners, Staff, Admin)
  userRole: AppRole;
  setUserRole: (role: AppRole) => void;
  currentUser: LibraryUser | null;
  setCurrentUser: (user: LibraryUser | User | null) => void;
  isLearner: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  switchRolePreset: (role: AppRole | 'GUEST', specificUserId?: string) => void;

  // View Navigation & Global Search Query
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Hero Spotlight & Catalog Discovery States
  spotlightData: HeroSpotlightData;
  collegeSpotlight: HeroSpotlightData;
  primarySpotlight: HeroSpotlightData;
  updateHeroSpotlight: (newData: HeroSpotlightData, targetSection?: 'college' | 'primary') => void;
  setBookAsSpotlight: (bookId: string, customBadge?: string) => { success: boolean; message: string };
  fetchBookOfWeekForGrade: (targetGrade?: 'primary' | 'secondary') => Promise<HeroSpotlightData | null>;
  catalogViewMode: CatalogViewMode;
  setCatalogViewMode: (mode: CatalogViewMode) => void;
  selectedBook: Book | null;
  setSelectedBook: React.Dispatch<React.SetStateAction<Book | null>>;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Section & Multi-Branch Scoping
  activeSection: LibrarySection;
  setActiveSection: (sec: LibrarySection) => void;
  allBooks: Book[];
  allCirculation: CirculationRecord[];
  allUsers: LibraryUser[];
  books: Book[];
  circulation: CirculationRecord[];
  submissions: StudentSubmission[];
  announcements: Announcement[];
  currentLearnerName: string;
  setCurrentLearnerName: (name: string) => void;
  
  // Login & Session states
  isLibrarianLoggedIn: boolean;
  setIsLibrarianLoggedIn: (val: boolean, overrideUser?: LibraryUser) => void;
  loggedInLearner: LibraryUser | null;
  setLoggedInLearner: (user: LibraryUser | null) => void;
  currentPath: string;
  navigateTo: (path: string) => void;
  login: (user: User | LibraryUser) => void;
  logout: () => void;
  
  // Custom states and actions
  users: LibraryUser[];
  createUser: (userData: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryCardId'>) => LibraryUser;
  addUsersBatch: (
    usersList: Omit<LibraryUser, 'id' | 'createdAt'>[],
    options?: { updateDuplicates?: boolean }
  ) => { addedCount: number; updatedCount: number; skippedCount: number };
  assignLearnerToTeacher: (learnerId: string, teacherId: string | null) => { success: boolean; message: string };
  assignMultipleLearnersToTeacher: (learnerIds: string[], teacherId: string) => { success: boolean; message: string };
  isRosterModalOpen: boolean;
  setIsRosterModalOpen: (val: boolean) => void;
  holds: BookHold[];
  createHold: (bookId: string, userId: string) => { success: boolean; message: string };
  releaseHold: (holdId: string) => void;
  addBookReview: (bookId: string, rating: number, comment: string) => void;
  flagBookAsLostOrMisplaced: (recordId: string, status: 'lost' | 'misplaced') => void;
  markBookAsReplaced: (recordId: string) => void;
  triggerOverdueEmail: (recordId: string) => { success: boolean; message: string };
  sendLostEmail: (recordId: string) => { success: boolean; message: string };
  emailLogs: EmailLog[];
  renewLoan: (recordId: string, days?: number) => { success: boolean; message: string };
  updateBookUsageType: (bookId: string, usageType: 'circulation' | 'reserve') => void;
  
  // Actions & Supabase Cloud Integration
  isCloudConnected: boolean;
  isLoadingCloudBooks: boolean;
  cloudSyncStatus: 'synced' | 'connecting' | 'syncing' | 'local' | 'empty' | 'error';
  refreshBooks: () => Promise<void>;
  refreshUsers: () => Promise<void>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<{ success: boolean; message: string }>;
  deleteBook: (bookId: string) => Promise<{ success: boolean; message: string }>;
  clearSampleBooks: () => void;
  addBook: (book: Omit<Book, 'id' | 'readsCount'>) => void;
  addBooksBatch: (
    booksList: Omit<Book, 'id' | 'readsCount'>[],
    options?: { updateDuplicates?: boolean }
  ) => Promise<{ addedCount: number; updatedCount: number; skippedCount: number }>;
  checkoutBook: (bookId: string, learnerName: string, days?: number) => { success: boolean; message: string };
  returnBook: (recordId: string) => void;
  removeCirculationRecord: (recordId: string) => Promise<{ success: boolean; message: string }>;
  sendOverdueAlert: (recordId: string) => void;
  addSubmission: (title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  updateSubmission: (id: string, title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  approveSubmission: (id: string) => void;
  rejectSubmission: (id: string, feedback: string) => void;
  assignSubmissionTeacher: (submissionId: string, teacherId: string, teacherName: string, teacherDepartment?: string, assignmentNotes?: string) => void;
  toggleLike: (id: string) => void;
  addComment: (submissionId: string, content: string, authorName?: string, rating?: number) => void;
  addAnnouncement: (title: string, content: string, category: Announcement['category'], section?: LibrarySection) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  restockBook: (bookId: string, quantity: number) => void;
  // User Profile Management
  updateUserProfile: (updates: Partial<LibraryUser>) => Promise<{ success: boolean; message: string }>;
  updateLearnerByAdmin: (learnerId: string, updates: Partial<LibraryUser>) => Promise<{ success: boolean; message: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  // Offline & Service Worker Sync
  isOnline: boolean;
  pendingOfflineChangesCount: number;
  isSyncingOfflineChanges: boolean;
  syncPendingOfflineChanges: () => Promise<{ success: boolean; syncedCount: number; errors: string[] }>;

  // Digital Reading Progress & eBook Reader
  readingProgressRecords: ReadingProgressRecord[];
  getReadingProgress: (bookId: string, userId?: string) => ReadingProgressRecord | undefined;
  getUserReadingProgressList: (userId?: string) => ReadingProgressRecord[];
  saveReadingProgress: (record: ReadingProgressRecord) => void;
  toggleBookNotification: (bookId: string, enabled: boolean, userId?: string) => void;
  dismissBookReminder: (bookId: string, userId?: string) => void;
  activeEBookModal: { isOpen: boolean; book: Book | null; initialPage?: number };
  openEBookReader: (book: Book, startPage?: number) => void;
  closeEBookReader: () => void;

  // Separate Physical vs E-Book Inventory
  physicalBooks: Book[];
  ebookBooks: Book[];
  inventoryFilter: InventoryFilter;
  setInventoryFilter: (filter: InventoryFilter) => void;
  inventoryMetrics: InventoryMetrics;
}

export const DEFAULT_ADMIN_FALLBACK_AVATARS: Record<string, string> = {
  'user-admin-1': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'user-admin-2': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  'alabia@premierinternationalschool.org': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  'adelekev@premierinternationalschool.org': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
};

export function isDefaultAvatarUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return Object.values(DEFAULT_ADMIN_FALLBACK_AVATARS).includes(trimmed);
}

// Safe helper to restore custom avatar persisted in database or localStorage for accounts
const getStoredAdminAvatar = (adminId: string, fallback: string): string => {
  try {
    const custom = localStorage.getItem(`p_avatar_${adminId}`) || localStorage.getItem(`p_admin_avatar_${adminId}`);
    if (custom && custom.trim() !== '' && !isDefaultAvatarUrl(custom)) return custom.trim();
    const usersRaw = localStorage.getItem('p_users_v3');
    if (usersRaw) {
      const list = JSON.parse(usersRaw);
      const found = list.find((u: any) => u.id === adminId || u.email?.toLowerCase() === adminId.toLowerCase());
      if (found?.avatar && found.avatar.trim() !== '' && !isDefaultAvatarUrl(found.avatar)) {
        return found.avatar.trim();
      }
    }
  } catch {}
  return fallback;
};

export const defaultAdminUser: LibraryUser = {
  id: 'user-admin-1',
  name: 'Alabi Abdulmumuni',
  role: 'admin',
  department: 'College Library Administration (Librarian / Administrator For College)',
  libraryCardId: 'LIB-ADMIN-0001',
  email: 'alabia@premierinternationalschool.org',
  password: 'Admin321',
  section: 'college',
  avatar: getStoredAdminAvatar('user-admin-1', DEFAULT_ADMIN_FALLBACK_AVATARS['user-admin-1']),
  createdAt: '2025-09-01',
};

export const primaryAdminUser: LibraryUser = {
  id: 'user-admin-2',
  name: 'Adeleke Veronica',
  role: 'admin',
  department: 'Primary Library Administration (Librarian / Administrator For Primary)',
  libraryCardId: 'LIB-ADMIN-0002',
  email: 'adelekev@premierinternationalschool.org',
  password: 'Adelekev',
  section: 'primary',
  avatar: getStoredAdminAvatar('user-admin-2', DEFAULT_ADMIN_FALLBACK_AVATARS['user-admin-2']),
  createdAt: '2025-09-01',
};

const initialUsers: LibraryUser[] = [
  // Primary Enrolled Learners Database (Years 1-6)
  {
    id: 'user-student-2',
    name: 'Zainab Bello',
    role: 'learner',
    gradeOrYear: '5G',
    admissionNumber: 'PIS/PRI/24/1102',
    password: 'PIS/PRI/24/1102',
    libraryCardId: 'LIB-PUPIL-1102',
    email: 'zainabb@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-12',
  },
  {
    id: 'user-pri-1',
    name: 'Emeka Nwosu',
    role: 'learner',
    gradeOrYear: '3D',
    admissionNumber: 'PIS/PRI/25/1210',
    password: 'PIS/PRI/25/1210',
    libraryCardId: 'LIB-PUPIL-1210',
    email: 'emekan@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-15',
  },
  {
    id: 'user-pri-2',
    name: 'Fatima Al-Hassan',
    role: 'learner',
    gradeOrYear: '2E',
    admissionNumber: 'PIS/PRI/25/1344',
    password: 'PIS/PRI/25/1344',
    libraryCardId: 'LIB-PUPIL-1344',
    email: 'fatimah@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-18',
  },
  {
    id: 'user-pri-3',
    name: 'Kenechukwu Eze',
    role: 'learner',
    gradeOrYear: '4O',
    admissionNumber: 'PIS/PRI/24/1190',
    password: 'PIS/PRI/24/1190',
    libraryCardId: 'LIB-PUPIL-1190',
    email: 'keneeze@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-20',
  },
  {
    id: 'user-pri-4',
    name: 'Sarah Johnson',
    role: 'learner',
    gradeOrYear: '1D',
    admissionNumber: 'PIS/PRI/26/1450',
    password: 'PIS/PRI/26/1450',
    libraryCardId: 'LIB-PUPIL-1450',
    email: 'sarahj@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-22',
  },
  {
    id: 'user-pri-5',
    name: 'Tariq Ibrahim',
    role: 'learner',
    gradeOrYear: '5E',
    admissionNumber: 'PIS/PRI/24/1133',
    password: 'PIS/PRI/24/1133',
    libraryCardId: 'LIB-PUPIL-1133',
    email: 'tariqi@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-25',
  },
  {
    id: 'user-pri-6',
    name: 'Michelle Adebayo',
    role: 'learner',
    gradeOrYear: '6R',
    admissionNumber: 'PIS/PRI/23/1025',
    password: 'PIS/PRI/23/1025',
    libraryCardId: 'LIB-PUPIL-1025',
    email: 'michellea@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-28',
  },
  {
    id: 'user-pri-7',
    name: 'Damilola Adeleke',
    role: 'learner',
    gradeOrYear: '3G',
    admissionNumber: 'PIS/PRI/25/1280',
    password: 'PIS/PRI/25/1280',
    libraryCardId: 'LIB-PUPIL-1280',
    email: 'damilolaa@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-02-01',
  },
  {
    id: 'user-pri-8',
    name: 'Chinedu Okeke',
    role: 'learner',
    gradeOrYear: '1G',
    admissionNumber: 'PIS/PRI/26/1458',
    password: 'PIS/PRI/26/1458',
    libraryCardId: 'LIB-PUPIL-1458',
    email: 'chineduo@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-02-03',
  },
  {
    id: 'user-pri-9',
    name: 'Aisha Mohammed',
    role: 'learner',
    gradeOrYear: '2G',
    admissionNumber: 'PIS/PRI/25/1350',
    password: 'PIS/PRI/25/1350',
    libraryCardId: 'LIB-PUPIL-1350',
    email: 'aisham@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-02-04',
  },
  {
    id: 'user-pri-10',
    name: 'Oluwaseun Bakare',
    role: 'learner',
    gradeOrYear: '4D',
    admissionNumber: 'PIS/PRI/24/1195',
    password: 'PIS/PRI/24/1195',
    libraryCardId: 'LIB-PUPIL-1195',
    email: 'oluwaseunb@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-02-05',
  },
  {
    id: 'user-pri-11',
    name: 'David Chukwuma',
    role: 'learner',
    gradeOrYear: '6G',
    admissionNumber: 'PIS/PRI/23/1030',
    password: 'PIS/PRI/23/1030',
    libraryCardId: 'LIB-PUPIL-1030',
    email: 'davidc@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-02-06',
  },

  // Secondary / College Enrolled Learners Database (Years 7-12)
  {
    id: 'user-student-1',
    name: 'Chidi Okafor',
    role: 'learner',
    gradeOrYear: '9E',
    admissionNumber: 'PIS/SS/23/2345',
    password: 'PIS/SS/23/2345',
    libraryCardId: 'LIB-STUD-2345',
    email: 'chidio@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-student-3',
    name: 'Amina Danjuma',
    role: 'learner',
    gradeOrYear: '11D',
    admissionNumber: 'PIS/SS/22/1988',
    password: 'PIS/SS/22/1988',
    libraryCardId: 'LIB-STUD-1988',
    email: 'aminad@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-15',
  },
  {
    id: 'user-sec-1',
    name: 'Tunde Williams',
    role: 'learner',
    gradeOrYear: '10G',
    admissionNumber: 'PIS/SS/23/2104',
    password: 'PIS/SS/23/2104',
    libraryCardId: 'LIB-STUD-2104',
    email: 'tundew@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-16',
  },
  {
    id: 'user-sec-2',
    name: 'Somtochukwu Obi',
    role: 'learner',
    gradeOrYear: '8D',
    admissionNumber: 'PIS/SS/24/2550',
    password: 'PIS/SS/24/2550',
    libraryCardId: 'LIB-STUD-2550',
    email: 'somtoo@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-18',
  },
  {
    id: 'user-sec-3',
    name: 'Halima Mohammed',
    role: 'learner',
    gradeOrYear: '12R',
    admissionNumber: 'PIS/SS/21/1760',
    password: 'PIS/SS/21/1760',
    libraryCardId: 'LIB-STUD-1760',
    email: 'halimam@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-20',
  },
  {
    id: 'user-sec-4',
    name: 'Favour Okon',
    role: 'learner',
    gradeOrYear: '7E',
    admissionNumber: 'PIS/SS/25/2712',
    password: 'PIS/SS/25/2712',
    libraryCardId: 'LIB-STUD-2712',
    email: 'favouro@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-22',
  },
  {
    id: 'user-sec-5',
    name: 'David Adeyemi',
    role: 'learner',
    gradeOrYear: '10O',
    admissionNumber: 'PIS/SS/23/2188',
    password: 'PIS/SS/23/2188',
    libraryCardId: 'LIB-STUD-2188',
    email: 'davida@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-24',
  },
  {
    id: 'user-sec-6',
    name: 'Blessing Bassey',
    role: 'learner',
    gradeOrYear: '9G',
    admissionNumber: 'PIS/SS/23/2390',
    password: 'PIS/SS/23/2390',
    libraryCardId: 'LIB-STUD-2390',
    email: 'blessingb@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-26',
  },
  {
    id: 'user-sec-7',
    name: 'Farouk Abubakar',
    role: 'learner',
    gradeOrYear: '11E',
    admissionNumber: 'PIS/SS/22/2015',
    password: 'PIS/SS/22/2015',
    libraryCardId: 'LIB-STUD-2015',
    email: 'farouka@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-28',
  },
  {
    id: 'user-sec-8',
    name: 'Ifeoma Umeh',
    role: 'learner',
    gradeOrYear: '8O',
    admissionNumber: 'PIS/SS/24/2588',
    password: 'PIS/SS/24/2588',
    libraryCardId: 'LIB-STUD-2588',
    email: 'ifeomau@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-30',
  },
  {
    id: 'user-sec-9',
    name: 'Emmanuel Kalu',
    role: 'learner',
    gradeOrYear: '12D',
    admissionNumber: 'PIS/SS/21/1701',
    password: 'PIS/SS/21/1701',
    libraryCardId: 'LIB-STUD-1701',
    email: 'emmanuelk@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-02-02',
  },
  {
    id: 'user-sec-10',
    name: 'Praise Eze',
    role: 'learner',
    gradeOrYear: '7D',
    admissionNumber: 'PIS/SS/25/2740',
    password: 'PIS/SS/25/2740',
    libraryCardId: 'LIB-STUD-2740',
    email: 'praisee@premierinternationalschool.org',
    assignedTeacherId: 'user-staff-1',
    assignedTeacherName: 'David Mensah',
    section: 'college',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-02-04',
  },

  // Faculty and Librarians
  {
    id: 'user-staff-1',
    name: 'David Mensah',
    role: 'staff',
    department: 'Science & STEM Faculty',
    libraryCardId: 'LIB-TEACH-2001',
    email: 'davidm@premierinternationalschool.org',
    password: 'StaffPass123',
    section: 'all',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-08',
  },
  defaultAdminUser,
  primaryAdminUser,
];

// Clean up any legacy shared localStorage session keys to guarantee tab session isolation
try {
  localStorage.removeItem('p_app_role');
  localStorage.removeItem('p_current_user');
  localStorage.removeItem('p_lib_logged_in');
  localStorage.removeItem('p_learner_logged_in');
  localStorage.removeItem('p_role');
  localStorage.removeItem('p_tab');
} catch {
  // ignore
}

// Safe session storage helpers for tab-isolated authentication and session states
const getSessionItem = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const setSessionItem = (key: string, value: string): void => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

const removeSessionItem = (key: string): void => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
};

/**
 * Accurately derive a student's grade level ('primary' or 'secondary') based on their account profile
 */
export function getGradeLevelForUser(user: LibraryUser | User | null, defaultSection?: LibrarySection): 'primary' | 'secondary' {
  if (user) {
    if (user.section === 'primary') return 'primary';
    if (user.section === 'college' || (user.section as string) === 'secondary') return 'secondary';
    const grade = ((user as LibraryUser).gradeOrYear || (user as any).grade_or_year || '').trim();
    const parsed = parseAcademicClass(grade);
    if (parsed) return parsed.section;

    const g = grade.toLowerCase();
    if (
      g.includes('pri') || 
      g.includes('pupil') || 
      g.includes('nursery') || 
      g.includes('kindergarten') ||
      /^primary/i.test(g) ||
      /^year\s*[1-6]\b/i.test(g) ||
      /^grade\s*[1-6]\b/i.test(g) ||
      /^class\s*[1-6]\b/i.test(g) ||
      /^([1-6])[dgeor]\b/i.test(g)
    ) {
      return 'primary';
    }
    if (
      g.includes('sec') || 
      g.includes('college') ||
      /^year\s*(7|8|9|10|11|12|13)\b/i.test(g) ||
      /^grade\s*(7|8|9|10|11|12)\b/i.test(g) ||
      /^ss\s*[1-3]\b/i.test(g) ||
      /^jss\s*[1-3]\b/i.test(g) ||
      /^([7-9]|1[0-2])[dgeor]\b/i.test(g)
    ) {
      return 'secondary';
    }
    const adm = ((user as LibraryUser).admissionNumber || (user as any).admission_number || '').toUpperCase();
    if (adm.includes('PRI') || adm.includes('PUPIL')) return 'primary';
    if (adm.includes('SS') || adm.includes('COL') || adm.includes('SEC')) return 'secondary';
  }
  return defaultSection === 'primary' ? 'primary' : 'secondary';
}

/**
 * Borrowing Limit Rules:
 * - Secondary Section:
 *   - Year 7 - 9 (Junior Secondary): Max 2 books
 *   - Year 10 - 12 (Senior Secondary): Max 3 books
 * - Primary Section:
 *   - No automated limit (Primary section librarian manages pupil limits manually)
 */
export interface UserBorrowLimitInfo {
  maxAllowed: number | null; // null means no automated limit (primary section or staff)
  isPrimaryManual: boolean;
  section: 'primary' | 'secondary' | 'staff';
  label: string;
  ruleDescription: string;
  gradeCategory: 'junior-secondary' | 'senior-secondary' | 'primary' | 'staff';
}

export function getUserBorrowLimitInfo(
  userOrGrade: LibraryUser | User | string | null,
  activeSection?: LibrarySection
): UserBorrowLimitInfo {
  if (!userOrGrade) {
    return {
      maxAllowed: 2,
      isPrimaryManual: false,
      section: 'secondary',
      label: 'Max 2 books (Year 7–9)',
      ruleDescription: 'Secondary Year 7–9: Maximum 2 books can be borrowed at a time.',
      gradeCategory: 'junior-secondary'
    };
  }

  // Staff, teachers, librarians have no pupil loan caps
  if (typeof userOrGrade === 'object') {
    const role = (userOrGrade as any).role;
    if (role === 'teacher' || role === 'staff' || role === 'librarian' || role === 'admin') {
      return {
        maxAllowed: null,
        isPrimaryManual: false,
        section: 'staff',
        label: 'Staff Member',
        ruleDescription: 'Staff and faculty members have no automated pupil borrowing limits.',
        gradeCategory: 'staff'
      };
    }
  }

  // Derive grade level / section
  const isExplicitPrimary = typeof userOrGrade === 'object'
    ? userOrGrade.section === 'primary' || getGradeLevelForUser(userOrGrade, activeSection) === 'primary'
    : (
        userOrGrade.toLowerCase().includes('primary') || 
        userOrGrade.toLowerCase().includes('pri') || 
        userOrGrade.toLowerCase().includes('pupil') ||
        userOrGrade.toLowerCase().includes('nursery') ||
        userOrGrade.toLowerCase().includes('kindergarten') ||
        /^primary/i.test(userOrGrade) || 
        /^pri\b/i.test(userOrGrade) ||
        /^year\s*[1-6]\b/i.test(userOrGrade) || 
        /^grade\s*[1-6]\b/i.test(userOrGrade) ||
        /^class\s*[1-6]\b/i.test(userOrGrade) ||
        (activeSection === 'primary' && !/(year|grade|class)\s*(7|8|9|10|11|12|13)\b/i.test(userOrGrade))
      );

  // Primary section: NO automated limit (primary librarian manages pupil limits manually)
  if (isExplicitPrimary) {
    return {
      maxAllowed: null,
      isPrimaryManual: true,
      section: 'primary',
      label: 'Primary Section (Manual limit)',
      ruleDescription: 'Primary has no automated limit — the primary section librarian handles her pupils’ limits manually.',
      gradeCategory: 'primary'
    };
  }

  // Secondary section:
  const rawGrade = typeof userOrGrade === 'object'
    ? ((userOrGrade as LibraryUser).gradeOrYear || (userOrGrade as any).grade_or_year || (userOrGrade as any).grade || '')
    : userOrGrade;

  const parsedClass = parseAcademicClass(rawGrade);
  if (parsedClass) {
    if (parsedClass.section === 'primary') {
      return {
        maxAllowed: null,
        isPrimaryManual: true,
        section: 'primary',
        label: `${parsedClass.code} (${parsedClass.fullLabel})`,
        ruleDescription: 'Primary has no automated limit — the primary section librarian handles her pupils’ limits manually.',
        gradeCategory: 'primary'
      };
    }
    if (parsedClass.stage === 'junior-secondary') {
      return {
        maxAllowed: 2,
        isPrimaryManual: false,
        section: 'secondary',
        label: `Max 2 books (${parsedClass.code})`,
        ruleDescription: `Secondary Year ${parsedClass.year} ${parsedClass.streamName} (${parsedClass.code}): Maximum 2 books can be borrowed at a time.`,
        gradeCategory: 'junior-secondary'
      };
    }
    return {
      maxAllowed: 3,
      isPrimaryManual: false,
      section: 'secondary',
      label: `Max 3 books (${parsedClass.code})`,
      ruleDescription: `Secondary Year ${parsedClass.year} ${parsedClass.streamName} (${parsedClass.code}): Maximum 3 books can be borrowed at a time.`,
      gradeCategory: 'senior-secondary'
    };
  }

  const g = rawGrade.toLowerCase().trim();

  // Year 10 - 12 (Senior Secondary): 3 books max
  // Matches: Year 10, Year 11, Year 12, Year 13, Grade 10-12, SS 1-3, SSS 1-3, SS1-3, SSS1-3, Form 4-6, 10A, 11B, 12C
  const isSenior = 
    /(year|grade|class)\s*(10|11|12|13)\b/i.test(g) ||
    /\b(ss|sss)\s*[1-3]\b/i.test(g) ||
    /\b(ss|sss)[1-3]\b/i.test(g) ||
    /\b1[0-3][a-z]?\b/i.test(g) ||
    /\bform\s*[4-6]\b/i.test(g);

  if (isSenior) {
    return {
      maxAllowed: 3,
      isPrimaryManual: false,
      section: 'secondary',
      label: 'Max 3 books (Year 10–12)',
      ruleDescription: 'Secondary Year 10–12: Maximum 3 books can be borrowed at a time.',
      gradeCategory: 'senior-secondary'
    };
  }

  // Year 7 - 9 (Junior Secondary): 2 books max
  // Matches: Year 7, Year 8, Year 9, Grade 7-9, JSS 1-3, JS 1-3, JSS1-3, 7A, 8B, 9E, Form 1-3
  return {
    maxAllowed: 2,
    isPrimaryManual: false,
    section: 'secondary',
    label: 'Max 2 books (Year 7–9)',
    ruleDescription: 'Secondary Year 7–9: Maximum 2 books can be borrowed at a time.',
    gradeCategory: 'junior-secondary'
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Normalized 3-Role State ('LEARNER' | 'STAFF' | 'ADMIN') - Tab Isolated
  const [userRole, setUserRoleState] = useState<AppRole>(() => {
    const saved = getSessionItem('p_app_role');
    if (saved === 'STAFF' || saved === 'ADMIN' || saved === 'LEARNER') return saved;
    return 'LEARNER';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = getSessionItem('p_role');
    return (saved as UserRole) || 'learner';
  });

  const [isLibrarianLoggedIn, setIsLibrarianLoggedInState] = useState<boolean>(() => {
    return getSessionItem('p_lib_logged_in') === 'true';
  });

  const [loggedInLearner, setLoggedInLearnerState] = useState<LibraryUser | null>(() => {
    const saved = getSessionItem('p_learner_logged_in');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentUser, setCurrentUserState] = useState<LibraryUser | null>(() => {
    let resolved: LibraryUser | null = null;
    const saved = getSessionItem('p_current_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        if (u) resolved = u;
      } catch {
        // ignore
      }
    }
    // Also check localStorage fallback for persistent user session
    if (!resolved) {
      try {
        const persistent = localStorage.getItem('p_current_user_v2');
        if (persistent) {
          const u = JSON.parse(persistent);
          if (u) resolved = u;
        }
      } catch {}
    }

    // If admin is active in session/localStorage but resolved was null, recover default admin
    if (!resolved && (getSessionItem('p_lib_logged_in') === 'true' || localStorage.getItem('p_lib_logged_in') === 'true')) {
      resolved = { ...defaultAdminUser };
    }

    if (resolved) {
      const storedAvatar = localStorage.getItem(`p_avatar_${resolved.id}`) || 
                           localStorage.getItem(`p_admin_avatar_${resolved.id}`) ||
                           (resolved.email ? localStorage.getItem(`p_avatar_${resolved.email.toLowerCase()}`) : null);

      if (storedAvatar && storedAvatar.trim() !== '' && !isDefaultAvatarUrl(storedAvatar)) {
        // Use custom uploaded avatar
        resolved.avatar = storedAvatar.trim();
      } else if (resolved.avatar && resolved.avatar.trim() !== '' && !isDefaultAvatarUrl(resolved.avatar)) {
        // Preserved custom avatar on user object
        resolved.avatar = resolved.avatar.trim();
      } else {
        // Only when empty, use default fallback
        resolved.avatar = DEFAULT_ADMIN_FALLBACK_AVATARS[resolved.id] || 
                          (resolved.email ? DEFAULT_ADMIN_FALLBACK_AVATARS[resolved.email.toLowerCase()] : '') || 
                          '';
      }
    }

    return resolved;
  });

  // Modal control for the Librarian Roster Tool
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname;
  });

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const saved = getSessionItem('p_tab');
    return saved || 'home';
  });

  // Active View navigation state (GetEpic Model)
  const [activeView, setActiveViewState] = useState<NavView>(() => {
    const p = window.location.pathname;
    return pathToViewMap[p] || 'EXPLORE';
  });

  // Global Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Catalog View Mode State ('CAROUSEL' | 'GRID')
  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>('CAROUSEL');

  // Selected Category filter ('ALL', 'POPULAR', etc.)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Selected Book for Drawer/Modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

// Safe helpers to track deleted records permanently so they are never resurrected
const getDeletedBookIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('p_deleted_book_ids');
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const getDeletedUserIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem('p_deleted_user_ids');
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

  const [books, setBooks] = useState<Book[]>(() => {
    const samplesCleared = localStorage.getItem('p_samples_cleared') === 'true';
    const deletedBookIds = getDeletedBookIds();
    const saved = localStorage.getItem('p_books_v3');

    if (isSupabaseConfigured) {
      if (saved) {
        try {
          const parsed: Book[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Strip out any hardcoded sample IDs so only database books remain
            return parsed.filter(b => !DEMO_SAMPLE_IDS.has(b.id) && !b.id.startsWith('book-') && !deletedBookIds.has(b.id));
          }
        } catch {
          // ignore
        }
      }
      return [];
    }

    const catalogBase = (samplesCleared ? initialBooks.filter(b => !DEMO_SAMPLE_IDS.has(b.id)) : initialBooks).filter(
      b => !deletedBookIds.has(b.id) && !deletedBookIds.has((b.isbn || '').replace(/[-\s]/g, ''))
    );

    if (saved) {
      try {
        const parsed: Book[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const baseList = (samplesCleared ? parsed.filter(b => !DEMO_SAMPLE_IDS.has(b.id)) : parsed).filter(
            b => !deletedBookIds.has(b.id) && !deletedBookIds.has((b.isbn || '').replace(/[-\s]/g, ''))
          );
          const existingIds = new Set(baseList.map(b => b.id));
          const existingIsbns = new Set(baseList.map(b => (b.isbn || '').replace(/[-\s]/g, '')));
          const missing = catalogBase.filter(ib => {
            const cleanIsbn = (ib.isbn || '').replace(/[-\s]/g, '');
            return !existingIds.has(ib.id) && !existingIsbns.has(cleanIsbn) && !deletedBookIds.has(ib.id) && !deletedBookIds.has(cleanIsbn);
          });
          const merged = missing.length > 0 ? [...missing, ...baseList] : baseList;
          // Synchronize readsCount and availableCopies strictly with circulation records in database
          const circSaved = localStorage.getItem('p_circulation');
          let circList: CirculationRecord[] = [];
          if (circSaved) {
            try { circList = JSON.parse(circSaved); } catch { circList = []; }
          }
          const validCirc = Array.isArray(circList) ? circList : [];
          const sanitized = merged.map(b => {
            const loansForBook = validCirc.filter(c => c.bookId === b.id);
            const activeLoans = loansForBook.filter(c => c.status === 'borrowed').length;
            return {
              ...b,
              readsCount: loansForBook.length,
              availableCopies: Math.max(0, b.totalCopies - activeLoans)
            };
          });
          try {
            localStorage.setItem('p_books_v3', JSON.stringify(sanitized));
          } catch {
            // ignore
          }
          return sanitized;
        }
      } catch {
        return catalogBase;
      }
    }
    return catalogBase;
  });

  const [circulation, setCirculation] = useState<CirculationRecord[]>(() => {
    const saved = localStorage.getItem('p_circulation');
    if (saved) {
      try {
        const parsed: CirculationRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sampleIds = new Set(initialBooks.map(b => b.id));
          // Strip out old mock loans or any loans referencing initial sample books
          return parsed.filter(c => !sampleIds.has(c.bookId) && !c.id.startsWith('loan-'));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    const saved = localStorage.getItem('p_submissions');
    if (saved) {
      try {
        const parsed: StudentSubmission[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Delete any and every legacy hard-coded sample work
          const legacySampleIds = new Set(['sub-1', 'sub-2', 'sub-3', 'sub-4', 'sub-5', 'sub-6']);
          return parsed.filter(s => !legacySampleIds.has(s.id) && !s.id.match(/^sub-[1-6]$/));
        }
      } catch {
        return [];
      }
    }
    return [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('p_announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [users, setUsers] = useState<LibraryUser[]>(() => {
    const deletedUserIds = getDeletedUserIds();
    const cleanInitialUsers = initialUsers.filter(u => !deletedUserIds.has(u.id) && !deletedUserIds.has(u.email.toLowerCase()));
    const saved = localStorage.getItem('p_users_v3') || localStorage.getItem('p_users');
    let loadedUsers: LibraryUser[] = cleanInitialUsers;
    let modified = false;
    if (saved) {
      try {
        const parsed: LibraryUser[] = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          const filteredSaved = parsed.filter(u => !deletedUserIds.has(u.id) && !deletedUserIds.has(u.email.toLowerCase()));
          const existingIds = new Set(filteredSaved.map(u => u.id));
          const missing = cleanInitialUsers.filter(iu => !existingIds.has(iu.id));
          loadedUsers = missing.length > 0 ? [...filteredSaved, ...missing] : filteredSaved;
          if (missing.length > 0 || filteredSaved.length !== parsed.length) {
            modified = true;
          }
        }
      } catch {
        // fallback
      }
    }

    // Ensure the permanent library administrators are present in the list (unless deleted) and reflect custom avatars
    if (!deletedUserIds.has('user-admin-2') && !deletedUserIds.has('adelekev@premierinternationalschool.org')) {
      const hasVeronica = loadedUsers.some(u => 
        u.email.toLowerCase() === 'adelekev@premierinternationalschool.org' || 
        u.id === 'user-admin-2'
      );
      if (!hasVeronica) {
        loadedUsers.push(primaryAdminUser);
        modified = true;
      } else {
        // Sync latest custom avatar if exists
        const storedAvatar = localStorage.getItem('p_avatar_user-admin-2') ||
                             localStorage.getItem('p_admin_avatar_user-admin-2') ||
                             localStorage.getItem('p_avatar_adelekev@premierinternationalschool.org');
        if (storedAvatar && !isDefaultAvatarUrl(storedAvatar)) {
          loadedUsers = loadedUsers.map(u => (u.id === 'user-admin-2' || u.email.toLowerCase() === 'adelekev@premierinternationalschool.org') ? { ...u, avatar: storedAvatar } : u);
        }
      }
    }

    if (!deletedUserIds.has('user-admin-1') && !deletedUserIds.has('alabia@premierinternationalschool.org')) {
      const hasAlabi = loadedUsers.some(u => 
        u.email.toLowerCase() === 'alabia@premierinternationalschool.org' || 
        u.id === 'user-admin-1'
      );
      if (!hasAlabi) {
        loadedUsers.push(defaultAdminUser);
        modified = true;
      } else {
        // Sync latest custom avatar if exists
        const storedAvatar = localStorage.getItem('p_avatar_user-admin-1') ||
                             localStorage.getItem('p_admin_avatar_user-admin-1') ||
                             localStorage.getItem('p_avatar_alabia@premierinternationalschool.org');
        if (storedAvatar && !isDefaultAvatarUrl(storedAvatar)) {
          loadedUsers = loadedUsers.map(u => (u.id === 'user-admin-1' || u.email.toLowerCase() === 'alabia@premierinternationalschool.org') ? { ...u, avatar: storedAvatar } : u);
        }
      }
    }

    if (modified) {
      try {
        localStorage.setItem('p_users_v3', JSON.stringify(loadedUsers));
      } catch {
        // ignore
      }
    }

    return loadedUsers;
  });

  const [holds, setHolds] = useState<BookHold[]>(() => {
    const saved = localStorage.getItem('p_holds');
    return saved ? JSON.parse(saved) : [];
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    const saved = localStorage.getItem('p_emaillogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentLearnerName, setCurrentLearnerName] = useState<string>(() => {
    return getSessionItem('p_learner_name') || 'Chidi Okafor (Year 9)';
  });

  // Active Library Section for multi-branch scoping (college vs primary)
  // Dedicated Campus Section Scoping: Everybody strictly sees ONLY what is theirs.
  // Mrs. Adeleke sees primary only; Mr. Alabi sees secondary/college only; learners see their enrolled campus.
  const boundSection: 'primary' | 'college' = React.useMemo(() => {
    const user = currentUser || loggedInLearner;
    if (!user) return 'college';

    const uEmail = (user.email || '').toLowerCase();
    const uName = (user.name || '').toLowerCase();
    const uDept = (user.department || '').toLowerCase();

    if (
      user.section === 'primary' || 
      uEmail.includes('adeleke') || 
      uName.includes('adeleke') || 
      uDept.includes('primary')
    ) {
      return 'primary';
    }

    if (
      user.section === 'college' || 
      uEmail.includes('alabi') || 
      uName.includes('alabi') || 
      uDept.includes('college') ||
      uDept.includes('secondary')
    ) {
      return 'college';
    }

    if (user.role === 'student' || user.role === 'learner') {
      const derivedGrade = getGradeLevelForUser(user, 'college');
      return derivedGrade === 'primary' ? 'primary' : 'college';
    }

    return 'college';
  }, [currentUser, loggedInLearner]);

  const [activeSection, setActiveSectionState] = useState<LibrarySection>(() => boundSection);

  useEffect(() => {
    setActiveSectionState(boundSection);
    setSessionItem('p_active_section', boundSection);
  }, [boundSection]);

  const setActiveSection = (section: LibrarySection) => {
    // When section changes are requested, lock to user's authorized scope
    const lockedSection = boundSection;
    setActiveSectionState(lockedSection);
    setSessionItem('p_active_section', lockedSection);
  };

  // Hero Spotlight States (Separate for College/Secondary and Primary Sections)
  const [collegeSpotlight, setCollegeSpotlight] = useState<HeroSpotlightData>(() => {
    const saved = localStorage.getItem('p_hero_spotlight_college');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.title) {
          // Auto-heal: if featuredBookId points to a non-book-1 holding and title was left as Things Fall Apart
          if (parsed.featuredBookId && parsed.featuredBookId !== 'book-1' && parsed.title === 'Things Fall Apart') {
            const match = initialBooks.find(b => b.id === parsed.featuredBookId);
            if (match) {
              return {
                ...parsed,
                title: match.title,
                subtitle: `By ${match.author} • ${match.category}`,
                description: match.description || match.summary || parsed.description,
                coverUrl: match.coverUrl || match.coverImage || parsed.coverUrl,
                section: 'college'
              };
            }
          }
          return { ...parsed, section: 'college' };
        }
      } catch {
        // ignore
      }
    }
    // Check legacy key if it wasn't a primary spotlight
    const legacy = localStorage.getItem('p_hero_spotlight');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed && parsed.title && parsed.section !== 'primary') {
          if (parsed.featuredBookId && parsed.featuredBookId !== 'book-1' && parsed.title === 'Things Fall Apart') {
            const match = initialBooks.find(b => b.id === parsed.featuredBookId);
            if (match) {
              return {
                ...parsed,
                title: match.title,
                subtitle: `By ${match.author} • ${match.category}`,
                description: match.description || match.summary || parsed.description,
                coverUrl: match.coverUrl || match.coverImage || parsed.coverUrl,
                section: 'college'
              };
            }
          }
          return { ...parsed, section: 'college' };
        }
      } catch {
        // ignore
      }
    }
    return initialCollegeSpotlight;
  });

  const [primarySpotlight, setPrimarySpotlight] = useState<HeroSpotlightData>(() => {
    const saved = localStorage.getItem('p_hero_spotlight_primary');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.title) {
          if (parsed.featuredBookId && parsed.featuredBookId !== 'book-3' && parsed.title === 'Things Fall Apart') {
            const match = initialBooks.find(b => b.id === parsed.featuredBookId);
            if (match) {
              return {
                ...parsed,
                title: match.title,
                subtitle: `By ${match.author} • ${match.category}`,
                description: match.description || match.summary || parsed.description,
                coverUrl: match.coverUrl || match.coverImage || parsed.coverUrl,
                section: 'primary'
              };
            }
          }
          return { ...parsed, section: 'primary' };
        }
      } catch {
        // ignore
      }
    }
    // Check legacy key if it was marked primary
    const legacy = localStorage.getItem('p_hero_spotlight');
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        if (parsed && parsed.title && parsed.section === 'primary') {
          return { ...parsed, section: 'primary' };
        }
      } catch {
        // ignore
      }
    }
    return initialPrimarySpotlight;
  });

  // Cross-tab real-time sync for Book of the Week updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'p_hero_spotlight_college' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.title) setCollegeSpotlight(parsed);
        } catch {
          // ignore
        }
      }
      if (e.key === 'p_hero_spotlight_primary' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.title) setPrimarySpotlight(parsed);
        } catch {
          // ignore
        }
      }
      if (e.key === 'p_hero_spotlight' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.title) {
            if (parsed.section === 'primary') {
              setPrimarySpotlight(parsed);
            } else {
              setCollegeSpotlight(parsed);
            }
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Dynamically resolve Book of the Week document based on student's grade level or active section
  const currentStudent = loggedInLearner || currentUser;
  const isStudentSession = userRole === 'LEARNER' || currentRole === 'learner' || (Boolean(currentStudent) && currentStudent?.role !== 'admin' && currentStudent?.role !== 'librarian' && currentStudent?.role !== 'staff' && currentStudent?.role !== 'teacher');
  const studentGradeLevel = getGradeLevelForUser(currentStudent, activeSection);
  const effectiveSpotlightSection: 'college' | 'primary' = isStudentSession 
    ? (studentGradeLevel === 'primary' ? 'primary' : 'college')
    : (activeSection === 'primary' ? 'primary' : 'college');

  const spotlightData: HeroSpotlightData = (effectiveSpotlightSection === 'primary') 
    ? primarySpotlight 
    : collegeSpotlight;

  // Fetch Book of the Week document dynamically from Supabase database based on student's grade level
  const fetchBookOfWeekForGrade = useCallback(async (targetGrade?: 'primary' | 'secondary'): Promise<HeroSpotlightData | null> => {
    const studentUser = loggedInLearner || currentUser;
    const gradeLevel = targetGrade || getGradeLevelForUser(studentUser, activeSection);

    try {
      const { data, error } = await fetchBookOfWeekFromDatabase(gradeLevel);
      if (!error && data && data.title) {
        if (gradeLevel === 'primary') {
          setPrimarySpotlight(data);
          try {
            localStorage.setItem('p_hero_spotlight_primary', JSON.stringify(data));
          } catch {}
        } else {
          setCollegeSpotlight(data);
          try {
            localStorage.setItem('p_hero_spotlight_college', JSON.stringify(data));
          } catch {}
        }
        return data;
      }
    } catch (err) {
      console.warn('Error fetching bookOfWeek document:', err);
    }
    return null;
  }, [loggedInLearner, currentUser, activeSection]);

  // Synchronize Book of the Week documents from Supabase on mount and whenever learner or section changes
  useEffect(() => {
    let isMounted = true;
    const loadSpotlightsFromDatabase = async () => {
      const studentUser = loggedInLearner || currentUser;
      const currentGrade = getGradeLevelForUser(studentUser, activeSection);
      
      try {
        const currentRes = await fetchBookOfWeekFromDatabase(currentGrade);
        if (isMounted && currentRes.data && currentRes.data.title) {
          if (currentGrade === 'primary') {
            setPrimarySpotlight(currentRes.data);
            try { localStorage.setItem('p_hero_spotlight_primary', JSON.stringify(currentRes.data)); } catch {}
          } else {
            setCollegeSpotlight(currentRes.data);
            try { localStorage.setItem('p_hero_spotlight_college', JSON.stringify(currentRes.data)); } catch {}
          }
        }

        const otherGrade: 'primary' | 'secondary' = currentGrade === 'primary' ? 'secondary' : 'primary';
        const otherRes = await fetchBookOfWeekFromDatabase(otherGrade);
        if (isMounted && otherRes.data && otherRes.data.title) {
          if (otherGrade === 'primary') {
            setPrimarySpotlight(otherRes.data);
            try { localStorage.setItem('p_hero_spotlight_primary', JSON.stringify(otherRes.data)); } catch {}
          } else {
            setCollegeSpotlight(otherRes.data);
            try { localStorage.setItem('p_hero_spotlight_college', JSON.stringify(otherRes.data)); } catch {}
          }
        }
      } catch (err) {
        console.warn('Failed to load bookOfWeek documents from Supabase:', err);
      }
    };

    loadSpotlightsFromDatabase();
    return () => {
      isMounted = false;
    };
  }, [loggedInLearner?.id, currentUser?.id, activeSection]);

  const updateHeroSpotlight = (newData: HeroSpotlightData, targetSection?: 'college' | 'primary') => {
    const resolvedSection: 'college' | 'primary' = targetSection || newData.section || (activeSection === 'primary' ? 'primary' : 'college');
    const updated: HeroSpotlightData = {
      ...newData,
      section: resolvedSection,
    };

    if (resolvedSection === 'primary') {
      setPrimarySpotlight(updated);
      try {
        localStorage.setItem('p_hero_spotlight_primary', JSON.stringify(updated));
      } catch {}
    } else {
      setCollegeSpotlight(updated);
      try {
        localStorage.setItem('p_hero_spotlight_college', JSON.stringify(updated));
      } catch {}
    }

    try {
      localStorage.setItem('p_hero_spotlight', JSON.stringify(updated));
    } catch {}

    // Persist directly to Supabase cloud database
    const gradeLevel: 'primary' | 'secondary' = resolvedSection === 'primary' ? 'primary' : 'secondary';
    saveBookOfWeekToDatabase(updated, gradeLevel).catch(err => {
      console.warn('Could not save bookOfWeek document to database:', err);
    });
  };

  const setBookAsSpotlight = (bookId: string, customBadge = 'BOOK OF THE WEEK') => {
    const targetBook = books.find(b => b.id === bookId) || initialBooks.find(b => b.id === bookId);
    if (!targetBook) {
      return { success: false, message: 'Book not found in library holdings.' };
    }

    const section: 'college' | 'primary' = targetBook.section === 'primary' 
      ? 'primary' 
      : (targetBook.section === 'college' ? 'college' : (currentUser?.section === 'primary' || activeSection === 'primary' ? 'primary' : 'college'));
    const gradient = section === 'primary' 
      ? 'from-emerald-950 via-slate-900 to-teal-950' 
      : 'from-blue-900 via-indigo-950 to-slate-900';

    const newSpotlight: HeroSpotlightData = {
      id: `spotlight-${section}-${Date.now()}`,
      title: targetBook.title,
      subtitle: `By ${targetBook.author} • ${targetBook.category}`,
      description: targetBook.description || targetBook.summary || `Featured title in the ${section === 'primary' ? 'Primary' : 'College/Secondary'} library.`,
      featuredBookId: targetBook.id,
      badgeText: customBadge,
      bgGradient: gradient,
      coverUrl: targetBook.coverUrl || targetBook.coverImage,
      section,
    };

    updateHeroSpotlight(newSpotlight, section);
    return { 
      success: true, 
      message: `"${targetBook.title}" is now set as the Book of the Week for the ${section === 'primary' ? 'Primary' : 'Secondary'} library.` 
    };
  };

  // Supabase Cloud State
  const [isCloudConnected] = useState<boolean>(isSupabaseConfigured);
  const [isLoadingCloudBooks, setIsLoadingCloudBooks] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'connecting' | 'syncing' | 'local' | 'empty' | 'error'>(
    isSupabaseConfigured ? 'connecting' : 'local'
  );

  const refreshBooks = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingCloudBooks(true);
    setCloudSyncStatus('syncing');
    try {
      const { data, error } = await fetchBooksFromSupabase();
      setIsLoadingCloudBooks(false);
      if (error) {
        console.warn('Could not sync books from Supabase:', error);
        setCloudSyncStatus('error');
      } else if (data && data.length > 0) {
        // Strip out any legacy hardcoded demo sample IDs from state so only database books exist
        const cleanData = data.filter(b => !DEMO_SAMPLE_IDS.has(b.id) && !b.id.startsWith('book-'));
        setBooks(cleanData);
        localStorage.setItem('p_books_v3', JSON.stringify(cleanData));
        setCloudSyncStatus('synced');
      } else if (data && data.length === 0) {
        // Connected to Supabase, but 0 books exist in cloud database yet
        // Clear sample books so catalog reflects the clean database
        setBooks([]);
        localStorage.setItem('p_samples_cleared', 'true');
        localStorage.setItem('p_books_v3', JSON.stringify([]));
        setCloudSyncStatus('empty');
      }
    } catch {
      setIsLoadingCloudBooks(false);
      setCloudSyncStatus('error');
    }
  };

  const refreshSubmissions = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await fetchSubmissionsFromSupabase();
      if (!error && data) {
        setSubmissions(data);
        localStorage.setItem('p_submissions', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not sync submissions from Supabase:', err);
    }
  };

  const refreshCirculation = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await fetchCirculationFromSupabase();
      if (!error && data) {
        setCirculation(data);
        localStorage.setItem('p_circulation', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not sync circulation from Supabase:', err);
    }
  };

  const refreshHolds = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await fetchHoldsFromSupabase();
      if (!error && data) {
        setHolds(data);
        localStorage.setItem('p_holds', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Could not sync holds from Supabase:', err);
    }
  };

  const refreshUsers = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await fetchUsersFromSupabase();
      if (!error && data && data.length > 0) {
        const enrichedUsers = data.map(dbUser => {
          const storedLocal = localStorage.getItem(`p_avatar_${dbUser.id}`) || 
                              localStorage.getItem(`p_admin_avatar_${dbUser.id}`) ||
                              (dbUser.email ? localStorage.getItem(`p_avatar_${dbUser.email.toLowerCase()}`) : null);

          const dbHasCustom = dbUser.avatar && dbUser.avatar.trim() !== '' && !isDefaultAvatarUrl(dbUser.avatar);
          const localHasCustom = storedLocal && storedLocal.trim() !== '' && !isDefaultAvatarUrl(storedLocal);

          let finalAvatar = '';
          if (dbHasCustom) {
            // Profile picture is set in our database! Use it directly
            finalAvatar = dbUser.avatar.trim();
            try {
              localStorage.setItem(`p_avatar_${dbUser.id}`, finalAvatar);
              localStorage.setItem(`p_admin_avatar_${dbUser.id}`, finalAvatar);
              if (dbUser.email) localStorage.setItem(`p_avatar_${dbUser.email.toLowerCase()}`, finalAvatar);
            } catch {}
          } else if (localHasCustom) {
            // Locally uploaded avatar exists, use it and sync to database
            finalAvatar = storedLocal.trim();
            updateUserInSupabase(dbUser.id, { avatar: finalAvatar });
          } else {
            // ONLY when completely empty, use the default avatar
            finalAvatar = DEFAULT_ADMIN_FALLBACK_AVATARS[dbUser.id] || 
                          (dbUser.email ? DEFAULT_ADMIN_FALLBACK_AVATARS[dbUser.email.toLowerCase()] : '') || 
                          '';
          }

          return { ...dbUser, avatar: finalAvatar };
        });

        setUsers(enrichedUsers);
        try {
          localStorage.setItem('p_users_v3', JSON.stringify(enrichedUsers));
        } catch {}

        // Keep active currentUser state in sync with database record
        setCurrentUserState((prev) => {
          if (!prev) return null;
          const match = enrichedUsers.find(u => u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase());
          if (!match) return prev;
          
          let activeAvatar = match.avatar;
          if (isDefaultAvatarUrl(match.avatar) && prev.avatar && !isDefaultAvatarUrl(prev.avatar)) {
            activeAvatar = prev.avatar;
          }
          if (!activeAvatar || activeAvatar.trim() === '') {
            activeAvatar = DEFAULT_ADMIN_FALLBACK_AVATARS[prev.id] || (prev.email ? DEFAULT_ADMIN_FALLBACK_AVATARS[prev.email.toLowerCase()] : '') || '';
          }

          const updated = { ...prev, ...match, avatar: activeAvatar };
          try {
            sessionStorage.setItem('p_current_user', JSON.stringify(updated));
            localStorage.setItem('p_current_user_v2', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.warn('Could not sync users from Supabase:', err);
    }
  };

  // Offline network status and mutation sync state
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingOfflineChangesCount, setPendingOfflineChangesCount] = useState<number>(() => getPendingOfflineMutations().length);
  const [isSyncingOfflineChanges, setIsSyncingOfflineChanges] = useState<boolean>(false);

  const syncPendingOfflineChanges = async (): Promise<{ success: boolean; syncedCount: number; errors: string[] }> => {
    const queue = getPendingOfflineMutations();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    setIsSyncingOfflineChanges(true);
    let synced = 0;
    const errors: string[] = [];

    for (const item of queue) {
      try {
        if (isSupabaseConfigured) {
          switch (item.type) {
            case 'ADD_BOOK': {
              const res = await insertBookToSupabase(item.payload);
              if (res.error) throw new Error(res.error);
              break;
            }
            case 'UPDATE_BOOK': {
              const res = await updateBookInSupabase(item.payload.id, item.payload.updates);
              if (res.error) throw new Error(res.error);
              break;
            }
            case 'DELETE_BOOK': {
              const res = await deleteBookFromSupabase(item.payload.id);
              if (res.error) throw new Error(res.error);
              break;
            }
            case 'CHECKOUT_BOOK': {
              const res = await insertCirculationToSupabase(item.payload);
              if (res.error) throw new Error(res.error);
              break;
            }
            case 'RETURN_BOOK': {
              const res = await updateCirculationInSupabase(item.payload.id, item.payload.updates);
              if (res.error) throw new Error(res.error);
              break;
            }
            case 'RENEW_BOOK':
            case 'FLAG_LOST': {
              const res = await updateCirculationInSupabase(item.payload.id, item.payload.updates);
              if (res.error) throw new Error(res.error);
              break;
            }
            case 'ADD_HOLD': {
              const res = await insertHoldToSupabase(item.payload);
              if (res.error) throw new Error(res.error);
              break;
            }
            case 'ADD_SUBMISSION': {
              const res = await insertSubmissionToSupabase(item.payload);
              if (res.error) throw new Error(res.error);
              break;
            }
          }
        }
        // Dequeue mutation
        dequeueOfflineMutation(item.id);
        synced++;
      } catch (err: any) {
        console.warn(`Failed to sync queued mutation ${item.id}:`, err);
        errors.push(err.message || 'Sync failed');
      }
    }

    setLastSyncTimestamp();
    setIsSyncingOfflineChanges(false);
    setPendingOfflineChangesCount(getPendingOfflineMutations().length);

    if (isSupabaseConfigured && synced > 0) {
      refreshBooks();
      refreshCirculation();
      refreshHolds();
      refreshSubmissions();
    }

    return { success: errors.length === 0, syncedCount: synced, errors };
  };

  // Sync event listeners for reconnection and queue updates
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOfflineChanges();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    const handleQueueUpdated = (e: any) => {
      setPendingOfflineChangesCount(e.detail?.count ?? getPendingOfflineMutations().length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-updated', handleQueueUpdated);

    // Initial check on load
    if (typeof navigator !== 'undefined' && navigator.onLine && getPendingOfflineMutations().length > 0) {
      syncPendingOfflineChanges();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-updated', handleQueueUpdated);
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) {
      refreshBooks();
      refreshSubmissions();
      refreshCirculation();
      refreshHolds();
      refreshUsers();
    }
  }, []);

  // Ensure catalog database books are always synced into state and localStorage
  useEffect(() => {
    if (isSupabaseConfigured) return; // In database mode: do not inject hardcoded mock books
    const samplesCleared = localStorage.getItem('p_samples_cleared') === 'true';
    const deletedBookIds = getDeletedBookIds();
    const catalogBase = (samplesCleared ? initialBooks.filter(b => !DEMO_SAMPLE_IDS.has(b.id)) : initialBooks).filter(
      b => !deletedBookIds.has(b.id) && !deletedBookIds.has((b.isbn || '').replace(/[-\s]/g, ''))
    );
    setBooks((prev) => {
      const existingIds = new Set(prev.map(b => b.id));
      const existingIsbns = new Set(prev.map(b => (b.isbn || '').replace(/[-\s]/g, '')));
      const missing = catalogBase.filter(ib => {
        const cleanIsbn = (ib.isbn || '').replace(/[-\s]/g, '');
        return !existingIds.has(ib.id) && !existingIsbns.has(cleanIsbn) && !deletedBookIds.has(ib.id) && !deletedBookIds.has(cleanIsbn);
      });
      if (missing.length > 0) {
        const updated = [...missing, ...prev];
        try {
          localStorage.setItem('p_books_v3', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      }
      return prev;
    });
  }, []);

  // Derived role flags
  const isLoggedIn = currentUser !== null;
  const isLearner = isLoggedIn ? userRole === 'LEARNER' : false;
  const isStaff = isLoggedIn ? userRole === 'STAFF' : false;
  const isAdmin = isLoggedIn ? userRole === 'ADMIN' : false;

  // Sync tab session state to sessionStorage
  useEffect(() => {
    setSessionItem('p_app_role', userRole);
  }, [userRole]);

  useEffect(() => {
    setSessionItem('p_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    setSessionItem('p_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('p_books', JSON.stringify(books));
    try {
      localStorage.setItem('p_books_v3', JSON.stringify(books));
      // Store physical inventory and ebook inventory in separate spaces in the database/storage
      const physical = books.filter(b => b.inventoryType !== 'ebook');
      const ebooks = books.filter(b => b.inventoryType === 'ebook');
      localStorage.setItem('p_physical_inventory_v1', JSON.stringify(physical));
      localStorage.setItem('p_ebook_inventory_v1', JSON.stringify(ebooks));
    } catch {}
  }, [books]);

  useEffect(() => {
    localStorage.setItem('p_circulation', JSON.stringify(circulation));
  }, [circulation]);

  useEffect(() => {
    localStorage.setItem('p_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('p_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem('p_users_v3', JSON.stringify(users));
    } catch {}
  }, [users]);

  useEffect(() => {
    localStorage.setItem('p_holds', JSON.stringify(holds));
  }, [holds]);

  useEffect(() => {
    localStorage.setItem('p_emaillogs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    setSessionItem('p_learner_name', currentLearnerName);
  }, [currentLearnerName]);

  useEffect(() => {
    if (currentUser) {
      setSessionItem('p_current_user', JSON.stringify(currentUser));
      try {
        localStorage.setItem('p_current_user_v2', JSON.stringify(currentUser));
      } catch {}
    } else {
      removeSessionItem('p_current_user');
      try {
        localStorage.removeItem('p_current_user_v2');
      } catch {}
    }
  }, [currentUser]);

  // Digital Reading Progress Records (stored in separate space 'p_reading_progress_v1')
  const [readingProgressRecords, setReadingProgressRecords] = useState<ReadingProgressRecord[]>(() => {
    const saved = localStorage.getItem('p_reading_progress_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    const initialRecords: ReadingProgressRecord[] = [
      {
        id: 'user-student-1_book-1',
        userId: 'user-student-1',
        learnerName: 'Zainab Ahmed',
        bookId: 'book-1',
        bookTitle: 'Things Fall Apart',
        author: 'Chinua Achebe',
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
        totalPages: 6,
        currentPage: 3,
        highestPageRead: 3,
        pagesFlippedCount: 4,
        totalDurationSeconds: 210,
        pageDwells: [
          { pageNumber: 1, durationSeconds: 65, timestamp: new Date(Date.now() - 3600000).toISOString() },
          { pageNumber: 2, durationSeconds: 75, timestamp: new Date(Date.now() - 2400000).toISOString() },
          { pageNumber: 3, durationSeconds: 70, timestamp: new Date(Date.now() - 1500000).toISOString() },
        ],
        status: 'more-than-half',
        percentCompleted: 50,
        startedAt: new Date(Date.now() - 86400000).toISOString(),
        lastReadAt: new Date(Date.now() - 1500000).toISOString(),
        notificationsEnabled: true
      },
      {
        id: 'user-student-1_book-3',
        userId: 'user-student-1',
        learnerName: 'Zainab Ahmed',
        bookId: 'book-3',
        bookTitle: 'Percy Jackson: The Lightning Thief',
        author: 'Rick Riordan',
        coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=700',
        totalPages: 4,
        currentPage: 4,
        highestPageRead: 4,
        pagesFlippedCount: 5,
        totalDurationSeconds: 380,
        pageDwells: [
          { pageNumber: 1, durationSeconds: 90, timestamp: new Date(Date.now() - 172800000).toISOString() },
          { pageNumber: 2, durationSeconds: 95, timestamp: new Date(Date.now() - 160000000).toISOString() },
          { pageNumber: 3, durationSeconds: 100, timestamp: new Date(Date.now() - 150000000).toISOString() },
          { pageNumber: 4, durationSeconds: 95, timestamp: new Date(Date.now() - 140000000).toISOString() },
        ],
        status: 'completed',
        percentCompleted: 100,
        startedAt: new Date(Date.now() - 172800000).toISOString(),
        lastReadAt: new Date(Date.now() - 140000000).toISOString(),
        completedAt: new Date(Date.now() - 140000000).toISOString(),
        notificationsEnabled: true
      }
    ];
    try {
      localStorage.setItem('p_reading_progress_v1', JSON.stringify(initialRecords));
    } catch {}
    return initialRecords;
  });

  useEffect(() => {
    try {
      localStorage.setItem('p_reading_progress_v1', JSON.stringify(readingProgressRecords));
    } catch {}
  }, [readingProgressRecords]);

  // Reading progress helpers
  const getReadingProgress = useCallback((bookId: string, userId?: string): ReadingProgressRecord | undefined => {
    const targetUserId = userId || currentUser?.id || loggedInLearner?.id || 'guest-reader';
    const targetLearnerName = currentUser?.nickname || currentUser?.name || loggedInLearner?.name || currentLearnerName;
    return readingProgressRecords.find(
      (r) => r.bookId === bookId && (
        r.userId === targetUserId || 
        r.learnerName.toLowerCase() === targetLearnerName.toLowerCase() ||
        (targetUserId !== 'guest-reader' && r.userId === targetUserId)
      )
    );
  }, [readingProgressRecords, currentUser, loggedInLearner, currentLearnerName]);

  const getUserReadingProgressList = useCallback((userId?: string): ReadingProgressRecord[] => {
    const targetUserId = userId || currentUser?.id || loggedInLearner?.id || 'guest-reader';
    const targetLearnerName = currentUser?.nickname || currentUser?.name || loggedInLearner?.name || currentLearnerName;
    return readingProgressRecords.filter(
      (r) => r.userId === targetUserId || r.learnerName.toLowerCase() === targetLearnerName.toLowerCase()
    );
  }, [readingProgressRecords, currentUser, loggedInLearner, currentLearnerName]);

  const saveReadingProgress = useCallback((record: ReadingProgressRecord) => {
    setReadingProgressRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === record.id || (r.bookId === record.bookId && r.userId === record.userId));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...record };
        return next;
      }
      return [record, ...prev];
    });
  }, []);

  const toggleBookNotification = useCallback((bookId: string, enabled: boolean, userId?: string) => {
    const targetUserId = userId || currentUser?.id || loggedInLearner?.id || 'guest-reader';
    const targetLearnerName = currentUser?.nickname || currentUser?.name || loggedInLearner?.name || currentLearnerName;
    setReadingProgressRecords((prev) => {
      return prev.map((r) => {
        if (r.bookId === bookId && (r.userId === targetUserId || r.learnerName.toLowerCase() === targetLearnerName.toLowerCase())) {
          return { ...r, notificationsEnabled: enabled };
        }
        return r;
      });
    });
  }, [currentUser, loggedInLearner, currentLearnerName]);

  const dismissBookReminder = useCallback((bookId: string, userId?: string) => {
    const targetUserId = userId || currentUser?.id || loggedInLearner?.id || 'guest-reader';
    const targetLearnerName = currentUser?.nickname || currentUser?.name || loggedInLearner?.name || currentLearnerName;
    setReadingProgressRecords((prev) => {
      return prev.map((r) => {
        if (r.bookId === bookId && (r.userId === targetUserId || r.learnerName.toLowerCase() === targetLearnerName.toLowerCase())) {
          return { ...r, lastNotifiedAt: new Date().toISOString() };
        }
        return r;
      });
    });
  }, [currentUser, loggedInLearner, currentLearnerName]);

  // Global eBook Reader Modal State
  const [activeEBookModal, setActiveEBookModal] = useState<{
    isOpen: boolean;
    book: Book | null;
    initialPage?: number;
  }>({
    isOpen: false,
    book: null,
    initialPage: 1,
  });

  const openEBookReader = useCallback((book: Book, startPage?: number) => {
    const targetUserId = currentUser?.id || loggedInLearner?.id || 'guest-reader';
    const targetLearnerName = currentUser?.nickname || currentUser?.name || loggedInLearner?.name || currentLearnerName;
    const progress = readingProgressRecords.find(
      (r) => r.bookId === book.id && (r.userId === targetUserId || r.learnerName.toLowerCase() === targetLearnerName.toLowerCase())
    );
    const resumePage = startPage || progress?.currentPage || 1;
    setActiveEBookModal({
      isOpen: true,
      book,
      initialPage: resumePage,
    });
  }, [readingProgressRecords, currentUser, loggedInLearner, currentLearnerName]);

  const closeEBookReader = useCallback(() => {
    setActiveEBookModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Separate Physical vs E-Book Inventory Spaces & Metrics
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');

  const physicalBooks = useMemo(() => {
    return books.filter((b) => b.inventoryType !== 'ebook');
  }, [books]);

  const ebookBooks = useMemo(() => {
    return books.filter((b) => b.inventoryType === 'ebook');
  }, [books]);

  const inventoryMetrics = useMemo((): InventoryMetrics => {
    const totalOverall = books.length;
    const totalPhysical = physicalBooks.length;
    const totalEbook = ebookBooks.length;
    
    let physicalCopiesTotal = 0;
    let physicalCopiesAvailable = 0;
    for (const b of physicalBooks) {
      physicalCopiesTotal += (Number(b.totalCopies) || 0);
      physicalCopiesAvailable += (Number(b.availableCopies) || 0);
    }
    const physicalCopiesOnLoan = Math.max(0, physicalCopiesTotal - physicalCopiesAvailable);

    const activeReadersSet = new Set<string>();
    let ebookCompletedReads = 0;
    let ebookHalfwayReads = 0;

    for (const r of readingProgressRecords) {
      if (r.userId) activeReadersSet.add(r.userId);
      if (r.status === 'completed') ebookCompletedReads++;
      else if (r.status === 'more-than-half') ebookHalfwayReads++;
    }

    return {
      totalOverallCount: totalOverall,
      totalPhysicalCount: totalPhysical,
      totalEbookCount: totalEbook,
      physicalCopiesTotal,
      physicalCopiesAvailable,
      physicalCopiesOnLoan,
      ebookActiveReaders: activeReadersSet.size,
      ebookCompletedReads,
      ebookHalfwayReads,
    };
  }, [books, physicalBooks, ebookBooks, readingProgressRecords]);

  // Set User Role synchronized
  const setUserRole = (role: AppRole) => {
    setUserRoleState(role);
    if (role === 'ADMIN') {
      setIsLibrarianLoggedInState(true);
      setCurrentRole('admin');
      const adminInUsers = users.find(u => u.id === 'user-admin-1' || u.email.toLowerCase() === 'alabia@premierinternationalschool.org' || u.role === 'admin') || defaultAdminUser;
      setCurrentUserState(adminInUsers);
      setActiveSection('all'); // Staff is global: sees both primary and secondary inventory
    } else if (role === 'STAFF') {
      setIsLibrarianLoggedInState(true);
      setCurrentRole('staff');
      const teacher = users.find(u => u.role === 'staff' || u.role === 'teacher') || initialUsers[2];
      setCurrentUserState(teacher);
      setLoggedInLearnerState(teacher);
      setActiveSection('all'); // Staff is global: sees both primary and secondary inventory
    } else {
      setIsLibrarianLoggedInState(false);
      setCurrentRole('learner');
      const student = users.find(u => u.role === 'learner' || u.role === 'student') || initialUsers[0];
      setCurrentUserState(student);
      setLoggedInLearnerState(student);
      setCurrentLearnerName(`${student.name} (${student.gradeOrYear || 'Student'})`);
      const learnerSec = student.section === 'primary' ? 'primary' : 'college';
      setActiveSection(learnerSec);
    }
  };

  const setCurrentUser = (user: LibraryUser | null) => {
    setCurrentUserState(user);
    if (user) {
      const isStaffOrAdmin = user.role === 'admin' || user.role === 'librarian' || user.role === 'staff' || user.role === 'teacher';
      if (isStaffOrAdmin) {
        if (user.section === 'primary') {
          setActiveSection('primary');
        } else if (user.section === 'college') {
          setActiveSection('college');
        } else {
          setActiveSection('all');
        }
      } else {
        // Learner/student: strictly locked to their own school section
        const learnerSec = (user.section === 'primary' || (user.gradeOrYear && user.gradeOrYear.toLowerCase().includes('primary'))) ? 'primary' : 'college';
        setActiveSection(learnerSec);
      }

      if (user.role === 'admin' || user.role === 'librarian') {
        setUserRoleState('ADMIN');
        setIsLibrarianLoggedInState(true);
        setCurrentRole('admin');
      } else if (user.role === 'staff' || user.role === 'teacher') {
        setUserRoleState('STAFF');
        setIsLibrarianLoggedInState(true);
        setCurrentRole('staff');
        setLoggedInLearnerState(user);
      } else {
        setUserRoleState('LEARNER');
        setIsLibrarianLoggedInState(false);
        setCurrentRole('learner');
        setLoggedInLearnerState(user);
        setCurrentLearnerName(`${user.name} (${user.gradeOrYear || 'Student'})`);
        const grade = getGradeLevelForUser(user, activeSection);
        const matchedSection: LibrarySection = grade === 'primary' ? 'primary' : 'college';
        setActiveSectionState(matchedSection);
        setSessionItem('p_active_section', matchedSection);
      }
    }
  };

  const switchRolePreset = (role: AppRole | 'GUEST', specificUserId?: string) => {
    if (role === 'GUEST') {
      logout();
      return;
    }
    if (specificUserId) {
      const found = users.find(u => u.id === specificUserId);
      if (found) {
        setCurrentUser(found);
        return;
      }
    }
    if (role === 'ADMIN') {
      const adminInUsers = users.find(u => u.id === 'user-admin-1' || u.email.toLowerCase() === 'alabia@premierinternationalschool.org' || u.role === 'admin') || defaultAdminUser;
      setCurrentUser(adminInUsers);
      return;
    }
    setUserRole(role);
  };

  const setIsLibrarianLoggedIn = (val: boolean, overrideUser?: LibraryUser) => {
    setIsLibrarianLoggedInState(val);
    setSessionItem('p_lib_logged_in', String(val));
    if (val) {
      setUserRoleState('ADMIN');
      setCurrentRole('admin');
      if (overrideUser) {
        setCurrentUserState(overrideUser);
        if (overrideUser.section === 'primary' || overrideUser.section === 'college') {
          setActiveSection(overrideUser.section);
        }
      } else if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'librarian')) {
        const adminInUsers = users.find(u => u.id === 'user-admin-1' || u.email.toLowerCase() === 'alabia@premierinternationalschool.org' || u.role === 'admin') || defaultAdminUser;
        setCurrentUserState(adminInUsers);
      }
    } else {
      setUserRoleState('LEARNER');
      setCurrentRole('learner');
    }
  };

  const setLoggedInLearner = (user: LibraryUser | null) => {
    setLoggedInLearnerState(user);
    setCurrentUserState(user);
    if (user) {
      setSessionItem('p_learner_logged_in', JSON.stringify(user));
      const grade = getGradeLevelForUser(user, activeSection);
      const matchedSection: LibrarySection = grade === 'primary' ? 'primary' : 'college';
      setActiveSectionState(matchedSection);
      setSessionItem('p_active_section', matchedSection);

      const formattedName = (user.role === 'student' || user.role === 'learner')
        ? `${user.name} (${user.gradeOrYear || 'Scholar'})` 
        : `${user.name} (Teacher)`;
      setCurrentLearnerName(formattedName);
      if (user.role === 'staff' || user.role === 'teacher') {
        setUserRoleState('STAFF');
        setCurrentRole('staff');
        setIsLibrarianLoggedInState(true);
        setSessionItem('p_lib_logged_in', 'true');
      } else if (user.role === 'admin' || user.role === 'librarian') {
        setUserRoleState('ADMIN');
        setCurrentRole('admin');
        setIsLibrarianLoggedInState(true);
        setSessionItem('p_lib_logged_in', 'true');
      } else {
        setUserRoleState('LEARNER');
        setCurrentRole('learner');
        setIsLibrarianLoggedInState(false);
        setSessionItem('p_lib_logged_in', 'false');
      }
    } else {
      removeSessionItem('p_learner_logged_in');
    }
  };

  const setActiveView = (view: NavView) => {
    setActiveViewState(view);
    const targetPath = viewToPathMap[view] || '/';
    setActiveTabState(view.toLowerCase());
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath(targetPath);
    }
  };

  const login = (user: User | LibraryUser) => {
    const roleStr = String(user.role).toUpperCase();
    const normRole: AppRole = (roleStr === 'ADMIN' || roleStr === 'LIBRARIAN')
      ? 'ADMIN'
      : (roleStr === 'STAFF' || roleStr === 'TEACHER')
      ? 'STAFF'
      : 'LEARNER';

    const avatar = ('avatarUrl' in user && user.avatarUrl) ? user.avatarUrl : ('avatar' in user ? user.avatar : undefined);
    const assignedTeacher = ('assignedStaffId' in user && user.assignedStaffId) ? user.assignedStaffId : ('assignedTeacherId' in user ? user.assignedTeacherId : undefined);

    const isUserStaffOrAdmin = normRole === 'ADMIN' || normRole === 'STAFF';

    const fullUser: LibraryUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normRole === 'ADMIN' ? 'admin' : normRole === 'STAFF' ? 'staff' : 'learner',
      gradeOrYear: user.gradeOrYear,
      department: user.department,
      libraryCardId: user.libraryCardId || `LIB-${user.id}`,
      avatar: avatar,
      assignedTeacherId: assignedTeacher,
      assignedTeacherName: user.assignedTeacherName,
      section: ('section' in user && (user.section === 'primary' || user.section === 'college'))
        ? user.section
        : (user.department && user.department.toLowerCase().includes('primary'))
        ? 'primary'
        : (user.department && user.department.toLowerCase().includes('college'))
        ? 'college'
        : isUserStaffOrAdmin 
        ? 'all' 
        : (user.gradeOrYear && (user.gradeOrYear.toLowerCase().includes('primary') || user.gradeOrYear.toLowerCase().includes('nursery')) ? 'primary' : 'college'),
      createdAt: user.createdAt || new Date().toISOString().split('T')[0],
    };

    setCurrentUser(fullUser);
    setUserRoleState(normRole);
    if (isUserStaffOrAdmin) {
      setIsLibrarianLoggedInState(true);
      setSessionItem('p_lib_logged_in', 'true');
      if (fullUser.section === 'primary' || fullUser.section === 'college') {
        setActiveSection(fullUser.section);
      } else {
        setActiveSection('all');
      }
    } else {
      setIsLibrarianLoggedInState(false);
      setSessionItem('p_lib_logged_in', 'false');
      const studentSec = (fullUser.section === 'primary' || (fullUser.gradeOrYear && fullUser.gradeOrYear.toLowerCase().includes('primary'))) ? 'primary' : 'college';
      setActiveSection(studentSec);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setCurrentPath(path);
    if (pathToViewMap[path]) {
      setActiveViewState(pathToViewMap[path]);
    }
  };

  const logout = () => {
    setIsLibrarianLoggedInState(false);
    removeSessionItem('p_lib_logged_in');
    setLoggedInLearnerState(null);
    removeSessionItem('p_learner_logged_in');
    setCurrentUserState(null);
    removeSessionItem('p_current_user');
    setUserRoleState('LEARNER');
    removeSessionItem('p_app_role');
    setCurrentRole('learner');
    removeSessionItem('p_role');
    setActiveTabState('home');
    removeSessionItem('p_tab');
    setActiveViewState('EXPLORE');
    if (window.location.pathname === '/admin' || window.location.pathname === '/login') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath('/');
    }
  };

  // Update Current User Profile (Nickname, Class/Grade, Avatar, Password)
  const updateUserProfile = async (updates: Partial<LibraryUser>): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'No user is currently signed in.' };
    }

    // Students / learners are NOT permitted to change their official enrolled name themselves
    // Only an administrator or librarian can update a student's name
    const sanitizedUpdates = { ...updates };
    if ((currentUser.role === 'learner' || currentUser.role === 'student') && !isAdmin) {
      delete sanitizedUpdates.name;
    }

    const updatedUser: LibraryUser = {
      ...currentUser,
      ...sanitizedUpdates,
    };

    // If grade was updated, derive and update section if needed
    if (sanitizedUpdates.gradeOrYear) {
      const derivedGrade = getGradeLevelForUser(updatedUser, activeSection);
      updatedUser.section = derivedGrade === 'primary' ? 'primary' : 'college';
    }

    // 1. Update state
    setCurrentUserState(updatedUser);
    if (loggedInLearner && loggedInLearner.id === updatedUser.id) {
      setLoggedInLearnerState(updatedUser);
      setSessionItem('p_learner_logged_in', JSON.stringify(updatedUser));
    }
    setSessionItem('p_current_user', JSON.stringify(updatedUser));
    try {
      localStorage.setItem('p_current_user_v2', JSON.stringify(updatedUser));
    } catch {}

    // Persist custom avatar specifically to avoid quota or reset issues
    if (updatedUser.avatar !== undefined) {
      const avatarVal = (updatedUser.avatar || '').trim();
      const isCustom = avatarVal !== '' && !isDefaultAvatarUrl(avatarVal);
      try {
        if (isCustom) {
          localStorage.setItem(`p_avatar_${updatedUser.id}`, avatarVal);
          localStorage.setItem(`p_admin_avatar_${updatedUser.id}`, avatarVal);
          if (updatedUser.email) localStorage.setItem(`p_avatar_${updatedUser.email.toLowerCase()}`, avatarVal);
        } else {
          localStorage.removeItem(`p_avatar_${updatedUser.id}`);
          localStorage.removeItem(`p_admin_avatar_${updatedUser.id}`);
          if (updatedUser.email) localStorage.removeItem(`p_avatar_${updatedUser.email.toLowerCase()}`);
        }
      } catch {}
      if (updatedUser.id === defaultAdminUser.id || updatedUser.email.toLowerCase() === defaultAdminUser.email.toLowerCase()) {
        defaultAdminUser.avatar = isCustom ? avatarVal : DEFAULT_ADMIN_FALLBACK_AVATARS['user-admin-1'];
      }
      if (updatedUser.id === primaryAdminUser.id || updatedUser.email.toLowerCase() === primaryAdminUser.email.toLowerCase()) {
        primaryAdminUser.avatar = isCustom ? avatarVal : DEFAULT_ADMIN_FALLBACK_AVATARS['user-admin-2'];
      }
    }

    // Update formatted learner name if applicable
    if (updatedUser.role === 'learner' || updatedUser.role === 'student') {
      const displayName = updatedUser.nickname || updatedUser.name;
      const formatted = `${displayName} (${updatedUser.gradeOrYear || 'Student'})`;
      setCurrentLearnerName(formatted);
      setSessionItem('p_learner_name', formatted);
    }

    // 2. Update in users array and localStorage
    setUsers(prev => {
      const next = prev.map(u => u.id === updatedUser.id ? updatedUser : u);
      try {
        localStorage.setItem('p_users_v3', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Persist to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        await updateUserInSupabase(updatedUser.id, {
          name: updatedUser.name,
          email: updatedUser.email,
          password: updatedUser.password,
          gradeOrYear: updatedUser.gradeOrYear,
          department: updatedUser.department,
          avatar: updatedUser.avatar,
          section: updatedUser.section,
        });
      } catch (err) {
        console.warn('Could not sync user profile to Supabase:', err);
      }
    }

    return { success: true, message: 'Profile updated successfully!' };
  };

  // Administrator / Librarian explicit update of any learner/user (Name, Class, Admission No, etc.)
  const updateLearnerByAdmin = async (learnerId: string, updates: Partial<LibraryUser>): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin) {
      return { success: false, message: 'Administrative access required to update user records.' };
    }

    const targetUser = users.find(u => u.id === learnerId);
    if (!targetUser) {
      return { success: false, message: 'User record not found.' };
    }

    const updatedUser: LibraryUser = {
      ...targetUser,
      ...updates,
    };

    if (updates.gradeOrYear) {
      const derivedGrade = getGradeLevelForUser(updatedUser, activeSection);
      updatedUser.section = derivedGrade === 'primary' ? 'primary' : 'college';
    }

    setUsers(prev => {
      const next = prev.map(u => u.id === learnerId ? updatedUser : u);
      try {
        localStorage.setItem('p_users_v3', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (currentUser?.id === learnerId) {
      setCurrentUserState(updatedUser);
      setSessionItem('p_current_user', JSON.stringify(updatedUser));
      try {
        localStorage.setItem('p_current_user_v2', JSON.stringify(updatedUser));
      } catch {}
    }
    if (loggedInLearner?.id === learnerId) {
      setLoggedInLearnerState(updatedUser);
      setSessionItem('p_learner_logged_in', JSON.stringify(updatedUser));
    }

    if (updatedUser.avatar !== undefined) {
      const avatarVal = (updatedUser.avatar || '').trim();
      try {
        if (avatarVal) {
          localStorage.setItem(`p_avatar_${learnerId}`, avatarVal);
          localStorage.setItem(`p_admin_avatar_${learnerId}`, avatarVal);
          if (updatedUser.email) localStorage.setItem(`p_avatar_${updatedUser.email.toLowerCase()}`, avatarVal);
        } else {
          localStorage.removeItem(`p_avatar_${learnerId}`);
          localStorage.removeItem(`p_admin_avatar_${learnerId}`);
          if (updatedUser.email) localStorage.removeItem(`p_avatar_${updatedUser.email.toLowerCase()}`);
        }
      } catch {}
      if (learnerId === defaultAdminUser.id) {
        defaultAdminUser.avatar = avatarVal || DEFAULT_ADMIN_FALLBACK_AVATARS['user-admin-1'];
      }
      if (learnerId === primaryAdminUser.id) {
        primaryAdminUser.avatar = avatarVal || DEFAULT_ADMIN_FALLBACK_AVATARS['user-admin-2'];
      }
    }

    if (isSupabaseConfigured) {
      try {
        await updateUserInSupabase(learnerId, {
          name: updatedUser.name,
          email: updatedUser.email,
          password: updatedUser.password,
          gradeOrYear: updatedUser.gradeOrYear,
          admissionNumber: updatedUser.admissionNumber,
          department: updatedUser.department,
          avatar: updatedUser.avatar,
          section: updatedUser.section,
        });
      } catch (err) {
        console.warn('Could not sync user update to Supabase:', err);
      }
    }

    return { success: true, message: `Successfully updated ${updatedUser.name}'s record.` };
  };

  // Administrator delete / remove student or staff account
  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin) {
      return { success: false, message: 'Administrative access required to remove user records.' };
    }

    if (currentUser?.id === userId) {
      return { success: false, message: 'You cannot remove your own active administrator account while signed in.' };
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'User record not found.' };
    }

    const userName = targetUser.name;
    const userRoleLabel = targetUser.role === 'staff' || targetUser.role === 'teacher' ? 'Staff member' : 'Student scholar';

    // Persist deleted user ID and email so it is permanently deleted and never restored
    try {
      const currentDeleted = Array.from(getDeletedUserIds());
      const updatedDeleted = Array.from(new Set([...currentDeleted, userId, targetUser.email.toLowerCase()].filter(Boolean)));
      localStorage.setItem('p_deleted_user_ids', JSON.stringify(updatedDeleted));
    } catch {}

    // 1. Remove from local state and storage
    setUsers(prev => {
      const next = prev.filter(u => u.id !== userId);
      try {
        localStorage.setItem('p_users_v3', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Clean up any stored avatar
    try {
      localStorage.removeItem(`p_admin_avatar_${userId}`);
    } catch {}

    // 3. Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        await deleteUserFromSupabase(userId);
      } catch (err) {
        console.warn('Could not delete user from Supabase:', err);
      }
    }

    return { success: true, message: `Successfully deleted ${userRoleLabel} "${userName}" from the database.` };
  };

  // Assign Learner to Staff / Teacher
  const assignLearnerToTeacher = (learnerId: string, teacherId: string | null) => {
    const learner = users.find(u => u.id === learnerId);
    if (!learner) return { success: false, message: 'Learner record not found.' };

    let teacherName: string | undefined = undefined;
    if (teacherId) {
      const teacher = users.find(u => u.id === teacherId);
      if (!teacher) return { success: false, message: 'Teacher record not found.' };
      teacherName = teacher.name;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === learnerId) {
        return {
          ...u,
          assignedTeacherId: teacherId || undefined,
          assignedTeacherName: teacherName,
        };
      }
      return u;
    }));

    if (currentUser?.id === learnerId) {
      setCurrentUserState(prev => prev ? {
        ...prev,
        assignedTeacherId: teacherId || undefined,
        assignedTeacherName: teacherName,
      } : null);
    }

    if (isSupabaseConfigured) {
      updateUserInSupabase(learnerId, {
        assignedTeacherId: teacherId || undefined,
        assignedTeacherName: teacherName,
      }).catch(err => console.warn('Could not sync teacher assignment to Supabase:', err));
    }

    const msg = teacherName 
      ? `Assigned ${learner.name} to ${teacherName} successfully.`
      : `Removed teacher assignment from ${learner.name}.`;

    return { success: true, message: msg };
  };

  // Batch assign learners to teacher
  const assignMultipleLearnersToTeacher = (learnerIds: string[], teacherId: string) => {
    const teacher = users.find(u => u.id === teacherId);
    if (!teacher) return { success: false, message: 'Staff member not found.' };

    setUsers(prev => prev.map(u => {
      if (learnerIds.includes(u.id)) {
        return {
          ...u,
          assignedTeacherId: teacher.id,
          assignedTeacherName: teacher.name,
        };
      }
      return u;
    }));

    return { 
      success: true, 
      message: `Assigned ${learnerIds.length} learners to ${teacher.name} successfully.` 
    };
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p);
      if (pathToViewMap[p]) {
        setActiveViewState(pathToViewMap[p]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath === '/admin') {
      if (isLibrarianLoggedIn) {
        setCurrentRole('librarian');
      }
    } else {
      if (loggedInLearner) {
        setCurrentRole('learner');
      }
    }
  }, [currentPath, isLibrarianLoggedIn, loggedInLearner]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Actions implementation
  const addBook = async (newBookData: Omit<Book, 'id' | 'readsCount'>) => {
    const tempId = `book-${Date.now()}`;
    const loggedInBranch: 'college' | 'primary' | undefined = 
      currentUser?.section === 'primary' || currentUser?.section === 'college'
        ? currentUser.section
        : (currentUser?.department?.toLowerCase().includes('primary') ? 'primary' :
           currentUser?.department?.toLowerCase().includes('college') ? 'college' : undefined);

    const resolvedSection: 'college' | 'primary' = (newBookData.section === 'primary' || newBookData.section === 'college')
      ? newBookData.section
      : (loggedInBranch || (activeSection === 'primary' ? 'primary' : 'college'));
    const newBook: Book = {
      ...newBookData,
      id: tempId,
      readsCount: 0,
      section: resolvedSection,
      inventoryType: newBookData.inventoryType || 'physical',
      ebookFormat: newBookData.ebookFormat || (newBookData.inventoryType === 'ebook' ? 'pages' : undefined),
      ebookPages: newBookData.ebookPages,
      ebookFileName: newBookData.ebookFileName,
      ebookFileSize: newBookData.ebookFileSize,
      ebookFileUrl: newBookData.ebookFileUrl,
    };
    // Optimistic local state update
    setBooks((prev) => [newBook, ...prev]);

    const bookPayload = {
      ...newBookData,
      section: resolvedSection,
    };

    // Persist to Supabase if connected, or queue for offline sync
    if (!navigator.onLine || !isSupabaseConfigured) {
      enqueueOfflineMutation('ADD_BOOK', bookPayload, `Add "${newBookData.title}"`);
    } else {
      try {
        const { data, error } = await insertBookToSupabase(bookPayload);
        if (data) {
          // Replace temp optimistic book with server-generated ID and record
          setBooks((prev) => prev.map((b) => (b.id === tempId ? data : b)));
          setCloudSyncStatus('synced');
        } else if (error) {
          console.warn('Could not insert to Supabase, queuing for offline sync:', error);
          enqueueOfflineMutation('ADD_BOOK', bookPayload, `Add "${newBookData.title}"`);
        }
      } catch (err) {
        console.error('Failed to save to Supabase, queuing for offline sync:', err);
        enqueueOfflineMutation('ADD_BOOK', bookPayload, `Add "${newBookData.title}"`);
      }
    }
  };

  const addBooksBatch = async (
    booksList: Omit<Book, 'id' | 'readsCount'>[],
    options?: { updateDuplicates?: boolean }
  ): Promise<{ addedCount: number; updatedCount: number; skippedCount: number }> => {
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const shouldUpdate = options?.updateDuplicates ?? true;

    const updatedCatalog: Book[] = [...books];

    for (const item of booksList) {
      const cleanNewISBN = (item.isbn || '').replace(/[^0-9X]/gi, '').toLowerCase();
      const existingIndex = updatedCatalog.findIndex((b) => {
        const cleanExistingISBN = (b.isbn || '').replace(/[^0-9X]/gi, '').toLowerCase();
        return (
          (cleanNewISBN && cleanExistingISBN && cleanNewISBN === cleanExistingISBN) ||
          b.title.trim().toLowerCase() === item.title.trim().toLowerCase()
        );
      });

      if (existingIndex !== -1) {
        if (shouldUpdate) {
          const prevBook = updatedCatalog[existingIndex];
          const newTotal = prevBook.totalCopies + (item.totalCopies || 1);
          const newAvail = prevBook.availableCopies + (item.availableCopies ?? item.totalCopies ?? 1);
          updatedCatalog[existingIndex] = {
            ...prevBook,
            totalCopies: newTotal,
            availableCopies: newAvail,
            category: item.category || prevBook.category,
            deweyCode: item.deweyCode || prevBook.deweyCode,
            deweyClass: item.deweyClass || prevBook.deweyClass,
            description: item.description || prevBook.description,
            readingLevel: item.readingLevel || prevBook.readingLevel,
            ageRange: item.ageRange || prevBook.ageRange,
            hasAudio: item.hasAudio || prevBook.hasAudio,
            usageType: item.usageType || prevBook.usageType,
            coverImage: item.coverImage || prevBook.coverImage,
          };
          updated++;
        } else {
          skipped++;
        }
      } else {
        const loggedInBranch: 'college' | 'primary' | undefined = 
          currentUser?.section === 'primary' || currentUser?.section === 'college'
            ? currentUser.section
            : (currentUser?.department?.toLowerCase().includes('primary') ? 'primary' :
               currentUser?.department?.toLowerCase().includes('college') ? 'college' : undefined);

        const itemSection: 'college' | 'primary' = (item.section === 'primary' || item.section === 'college')
          ? item.section
          : (loggedInBranch || (activeSection === 'primary' ? 'primary' : 'college'));
        const newBook: Book = {
          ...item,
          section: itemSection,
          id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          readsCount: 0,
        };
        updatedCatalog.unshift(newBook);
        added++;
      }
    }

    setBooks(updatedCatalog);
    localStorage.setItem('p_books_v3', JSON.stringify(updatedCatalog));
    localStorage.setItem('p_books', JSON.stringify(updatedCatalog));

    return { addedCount: added, updatedCount: updated, skippedCount: skipped };
  };

  const updateBook = async (bookId: string, updates: Partial<Book>): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin && !isStaff) {
      return { success: false, message: 'Permission denied. Only librarians and staff can edit catalog books.' };
    }

    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === bookId ? { ...b, ...updates } : b));
      localStorage.setItem('p_books_v3', JSON.stringify(updated));
      localStorage.setItem('p_books', JSON.stringify(updated));
      return updated;
    });

    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook((prev) => (prev ? { ...prev, ...updates } : null));
    }

    if (!navigator.onLine || !isSupabaseConfigured) {
      enqueueOfflineMutation('UPDATE_BOOK', { id: bookId, updates }, `Update "${updates.title || bookId}"`);
    } else {
      try {
        const { success, error } = await updateBookInSupabase(bookId, updates);
        if (!success) {
          console.warn('Could not update in Supabase, queuing for offline sync:', error);
          enqueueOfflineMutation('UPDATE_BOOK', { id: bookId, updates }, `Update "${updates.title || bookId}"`);
        }
      } catch (err) {
        console.error('Failed to update in Supabase, queuing for offline sync:', err);
        enqueueOfflineMutation('UPDATE_BOOK', { id: bookId, updates }, `Update "${updates.title || bookId}"`);
      }
    }

    return { success: true, message: 'Book updated successfully in catalogue.' };
  };

  const deleteBook = async (bookId: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin) {
      return { success: false, message: 'Permission denied. Only librarians can delete titles from the catalog.' };
    }

    const targetBook = books.find((b) => b.id === bookId);
    const bookTitle = targetBook?.title || 'Book';
    const cleanIsbn = (targetBook?.isbn || '').replace(/[-\s]/g, '');

    // Persist deleted book ID and ISBN so it is permanently deleted and never restored
    try {
      const currentDeleted = Array.from(getDeletedBookIds());
      const updatedDeleted = Array.from(new Set([...currentDeleted, bookId, cleanIsbn].filter(Boolean)));
      localStorage.setItem('p_deleted_book_ids', JSON.stringify(updatedDeleted));
    } catch {}

    setBooks((prev) => {
      const updated = prev.filter((b) => b.id !== bookId);
      try {
        localStorage.setItem('p_books_v3', JSON.stringify(updated));
        localStorage.setItem('p_books', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setCirculation((prev) => {
      const updatedCirc = prev.filter((c) => c.bookId !== bookId);
      try {
        localStorage.setItem('p_circulation', JSON.stringify(updatedCirc));
      } catch {}
      return updatedCirc;
    });
    setHolds((prev) => {
      const updatedHolds = prev.filter((h) => h.bookId !== bookId);
      try {
        localStorage.setItem('p_holds', JSON.stringify(updatedHolds));
      } catch {}
      return updatedHolds;
    });
    if (selectedBook && selectedBook.id === bookId) {
      setSelectedBook(null);
    }
    if (!navigator.onLine || !isSupabaseConfigured) {
      enqueueOfflineMutation('DELETE_BOOK', { id: bookId }, `Delete Title (${bookId})`);
    } else {
      try {
        await deleteBookFromSupabase(bookId);
      } catch (err) {
        console.warn('Failed to delete from Supabase, queued for offline sync:', err);
        enqueueOfflineMutation('DELETE_BOOK', { id: bookId }, `Delete Title (${bookId})`);
      }
    }
    return { success: true, message: `"${bookTitle}" has been permanently deleted from the database.` };
  };

  const clearSampleBooks = () => {
    const sampleIds = DEMO_SAMPLE_IDS;
    localStorage.setItem('p_samples_cleared', 'true');
    setBooks((prev) => {
      const remaining = prev.filter((b) => !sampleIds.has(b.id));
      localStorage.setItem('p_books_v3', JSON.stringify(remaining));
      return remaining;
    });
    // Remove all hardcoded circulation records from circulation and statics
    setCirculation((prev) => {
      const remainingCirc = prev.filter((c) => !sampleIds.has(c.bookId) && !c.id.startsWith('loan-'));
      localStorage.setItem('p_circulation', JSON.stringify(remainingCirc));
      return remainingCirc;
    });
    localStorage.removeItem('p_books');
  };

  const checkoutBook = (bookId: string, learnerName: string, days = 14) => {
    // Security check: Only librarians and staff can checkout books directly.
    // Learners are prohibited from self-borrowing (must place a 24h reserve hold or checkout at desk).
    if (isLearner && !isAdmin && !isStaff) {
      return { 
        success: false, 
        message: 'Learners cannot self-borrow books. Books must be issued by a librarian at the circulation desk. You can place a 24-hour reserve hold instead.' 
      };
    }

    const bookIndex = books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return { success: false, message: 'Book not found in the catalog.' };
    }

    const book = books[bookIndex];
    if (book.availableCopies <= 0) {
      return { success: false, message: `"${book.title}" is currently fully checked out.` };
    }

    // Resolve borrower info and borrowing limits
    const cleanLearnerName = learnerName.split('(')[0].trim().toLowerCase();
    const matchedUser = users.find(u => 
      u.name.toLowerCase() === cleanLearnerName ||
      u.name.toLowerCase() === learnerName.trim().toLowerCase() ||
      learnerName.toLowerCase().includes(u.name.toLowerCase())
    );

    // Extract grade from parenthetical if user not found directly or to supplement
    const extractedGrade = learnerName.match(/\(([^)]+)\)/)?.[1]?.trim() || '';

    // Combined target to evaluate limit accurately
    const targetBorrower = matchedUser 
      ? { ...matchedUser, gradeOrYear: extractedGrade || matchedUser.gradeOrYear }
      : (extractedGrade || learnerName);

    // Calculate active loans for this borrower (loans that are not returned)
    const currentActiveLoans = circulation.filter(
      (c) => c.status !== 'returned' && (
        c.learnerName.toLowerCase() === learnerName.toLowerCase() ||
        c.learnerName.split('(')[0].trim().toLowerCase() === cleanLearnerName ||
        (matchedUser && c.learnerName.toLowerCase().includes(matchedUser.name.toLowerCase()))
      )
    );

    const limitInfo = getUserBorrowLimitInfo(targetBorrower, activeSection);

    // Enforce borrowing limit for Secondary section (Year 7-9: max 2, Year 10-12: max 3).
    // Primary has no automated limit so the primary librarian handles pupil limits manually.
    if (limitInfo.maxAllowed !== null && currentActiveLoans.length >= limitInfo.maxAllowed) {
      return {
        success: false,
        message: `Borrowing limit reached for ${matchedUser?.name || learnerName.split('(')[0].trim()} (${limitInfo.label}): Secondary students in ${limitInfo.gradeCategory === 'senior-secondary' ? 'Year 10–12' : 'Year 7–9'} can borrow a maximum of ${limitInfo.maxAllowed} books at a time. The student currently has ${currentActiveLoans.length} active borrowed book(s). Please return a book before borrowing another.`
      };
    }

    // Update book available count
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, availableCopies: b.availableCopies - 1, readsCount: b.readsCount + 1 }
          : b
      )
    );

    // Calculate dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + days);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const newRecord: CirculationRecord = {
      id: `loan-${Date.now()}`,
      learnerName,
      bookId,
      bookTitle: book.title,
      borrowDate: formatDate(today),
      dueDate: formatDate(dueDate),
      status: 'borrowed',
      alertSent: false,
      section: book.section || (activeSection === 'primary' ? 'primary' : 'college'),
    };

    setCirculation((prev) => {
      const updated = [newRecord, ...prev];
      localStorage.setItem('p_circulation', JSON.stringify(updated));
      return updated;
    });

    if (!navigator.onLine || !isSupabaseConfigured) {
      enqueueOfflineMutation('CHECKOUT_BOOK', newRecord, `Checkout "${book.title}" to ${learnerName}`);
    } else {
      insertCirculationToSupabase(newRecord).catch((err) => {
        console.warn('Could not insert circulation record to Supabase, queuing for offline sync:', err);
        enqueueOfflineMutation('CHECKOUT_BOOK', newRecord, `Checkout "${book.title}" to ${learnerName}`);
      });
    }

    return { success: true, message: `Successfully checked out "${book.title}" to ${learnerName}. Due date: ${formatDate(dueDate)}` };
  };

  const returnBook = (recordId: string) => {
    const record = circulation.find((r) => r.id === recordId);
    if (!record || record.status === 'returned') return;

    // Update circulation record
    const todayStr = new Date().toISOString().split('T')[0];
    setCirculation((prev) => {
      const updated = prev.map((r) =>
        r.id === recordId
          ? { ...r, status: 'returned' as const, returnDate: todayStr }
          : r
      );
      localStorage.setItem('p_circulation', JSON.stringify(updated));
      return updated;
    });

    const updates = { status: 'returned' as const, returnDate: todayStr };
    if (!navigator.onLine || !isSupabaseConfigured) {
      enqueueOfflineMutation('RETURN_BOOK', { id: recordId, updates }, `Return "${record.bookTitle}"`);
    } else {
      updateCirculationInSupabase(recordId, updates).catch((err) => {
        console.warn('Could not update circulation return in Supabase, queuing for offline sync:', err);
        enqueueOfflineMutation('RETURN_BOOK', { id: recordId, updates }, `Return "${record.bookTitle}"`);
      });
    }

    // Increment available copies back
    setBooks((prev) =>
      prev.map((b) =>
        b.id === record.bookId
          ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) }
          : b
      )
    );
  };

  // Administrator remove a book record from circulation
  const removeCirculationRecord = async (recordId: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin && !isStaff) {
      return { success: false, message: 'Permission denied. Only librarians can remove circulation records.' };
    }

    const record = circulation.find((r) => r.id === recordId);
    if (!record) {
      return { success: false, message: 'Circulation record not found.' };
    }

    // If the book loan was still active or overdue, restore the physical copy to available stock
    if (record.status !== 'returned') {
      setBooks((prev) => {
        const next = prev.map((b) =>
          b.id === record.bookId
            ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) }
            : b
        );
        try {
          localStorage.setItem('p_books_v3', JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    // Remove from circulation state & storage
    setCirculation((prev) => {
      const next = prev.filter((r) => r.id !== recordId);
      try {
        localStorage.setItem('p_circulation', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Sync to Supabase
    if (isSupabaseConfigured) {
      try {
        await deleteCirculationRecordFromSupabase(recordId);
      } catch (err) {
        console.warn('Could not delete circulation record from Supabase:', err);
      }
    }

    return { success: true, message: `Successfully removed circulation record for "${record.bookTitle}".` };
  };

  const sendOverdueAlert = (recordId: string) => {
    setCirculation((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, alertSent: true } : r))
    );
  };

  const addSubmission = (
    title: string,
    category: StudentSubmission['category'],
    content: string,
    imageUrl?: string
  ) => {
    const authorName = currentRole === 'learner' 
      ? (loggedInLearner?.name || currentLearnerName.split('(')[0].trim()) 
      : (currentUser?.name || 'Student Scholar');
    const gradeOrYear = currentRole === 'learner' 
      ? (loggedInLearner?.gradeOrYear || currentLearnerName.match(/\(([^)]+)\)/)?.[1] || 'Year 9') 
      : 'Year 9';

    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      authorName,
      gradeOrYear,
      title,
      category,
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
      status: 'pending', // Submissions always start as pending for review!
      likesCount: 0,
      comments: [],
    };

    setSubmissions((prev) => {
      const updated = [newSub, ...prev];
      localStorage.setItem('p_submissions', JSON.stringify(updated));
      return updated;
    });

    if (!navigator.onLine || !isSupabaseConfigured) {
      enqueueOfflineMutation('ADD_SUBMISSION', newSub, `Submit "${title}" by ${authorName}`);
    } else {
      insertSubmissionToSupabase(newSub).catch((err) => {
        console.warn('Could not insert submission to Supabase cloud table, queuing for offline sync:', err);
        enqueueOfflineMutation('ADD_SUBMISSION', newSub, `Submit "${title}" by ${authorName}`);
      });
    }
  };

  const updateSubmission = (
    id: string,
    title: string,
    category: StudentSubmission['category'],
    content: string,
    imageUrl?: string
  ) => {
    const updates = {
      title,
      category,
      content,
      imageUrl,
      status: 'pending' as const, // Resubmitting sets it back to pending for review!
      createdAt: new Date().toISOString(),
    };

    setSubmissions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      localStorage.setItem('p_submissions', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      updateSubmissionInSupabase(id, updates).catch((err) => {
        console.warn('Could not update submission in Supabase:', err);
      });
    }
  };

  const approveSubmission = (id: string) => {
    setSubmissions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, status: 'approved' as const } : s));
      localStorage.setItem('p_submissions', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      updateSubmissionInSupabase(id, { status: 'approved' }).catch((err) => {
        console.warn('Could not approve submission in Supabase:', err);
      });
    }
  };

  const rejectSubmission = (id: string, feedback: string) => {
    setSubmissions((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, status: 'rejected' as const, moderationFeedback: feedback } : s
      );
      localStorage.setItem('p_submissions', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      updateSubmissionInSupabase(id, { status: 'rejected', moderationFeedback: feedback }).catch((err) => {
        console.warn('Could not reject submission in Supabase:', err);
      });
    }
  };

  const assignSubmissionTeacher = (
    submissionId: string,
    teacherId: string,
    teacherName: string,
    teacherDepartment?: string,
    assignmentNotes?: string
  ) => {
    const assignedBy = currentRole === 'librarian' || isAdmin 
      ? (currentUser?.name || 'Librarian Abdul Alabi') 
      : (currentUser?.name || 'Librarian');
    const assignedAt = new Date().toISOString();

    const updates = {
      assignedTeacherId: teacherId,
      assignedTeacherName: teacherName,
      assignedTeacherDepartment: teacherDepartment,
      assignedBy,
      assignedAt,
      assignmentNotes: assignmentNotes || '',
    };

    setSubmissions((prev) => {
      const updated = prev.map((s) => (s.id === submissionId ? { ...s, ...updates } : s));
      localStorage.setItem('p_submissions', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      updateSubmissionInSupabase(submissionId, updates).catch((err) => {
        console.warn('Could not assign teacher in Supabase:', err);
      });
    }
  };

  const toggleLike = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const liked = !s.likedByCurrentUser;
        return {
          ...s,
          likedByCurrentUser: liked,
          likesCount: liked ? s.likesCount + 1 : Math.max(0, s.likesCount - 1),
        };
      })
    );
  };

  const addComment = (submissionId: string, content: string, authorName?: string, rating?: number) => {
    const commentAuthor = authorName || (currentRole === 'librarian' ? 'Librarian Alabi' : currentLearnerName.split('(')[0].trim());
    const newComment = {
      id: `c-${Date.now()}`,
      authorName: commentAuthor,
      content,
      createdAt: new Date().toISOString(),
      rating,
    };

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;
        return {
          ...s,
          comments: [...s.comments, newComment],
        };
      })
    );
  };

  const addAnnouncement = (title: string, content: string, category: Announcement['category'], section?: LibrarySection) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      category,
      section: section || (activeSection === 'primary' ? 'primary' : activeSection === 'college' ? 'college' : 'all'),
    };
    setAnnouncements((prev) => {
      const updated = [newAnn, ...prev];
      localStorage.setItem('p_announcements', JSON.stringify(updated));
      return updated;
    });
  };

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    setAnnouncements((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      localStorage.setItem('p_announcements', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      localStorage.setItem('p_announcements', JSON.stringify(updated));
      return updated;
    });
  };

  const restockBook = (bookId: string, quantity: number) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, totalCopies: b.totalCopies + quantity, availableCopies: b.availableCopies + quantity }
          : b
      )
    );
  };

  // 1. Create Student or Teacher by Librarian
  const createUser = (userData: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryCardId'>) => {
    const cardId = userData.role === 'student' 
      ? `LIB-STUD-${Math.floor(1000 + Math.random() * 9000)}`
      : `LIB-TEACH-${Math.floor(2000 + Math.random() * 9000)}`;

    const inferredSection: LibrarySection = (userData.role === 'staff' || userData.role === 'teacher' || userData.role === 'admin' || userData.role === 'librarian')
      ? 'all'
      : (userData.section && userData.section !== 'all'
        ? userData.section
        : (userData.gradeOrYear && (userData.gradeOrYear.toLowerCase().includes('primary') || userData.gradeOrYear.toLowerCase().includes('nursery'))
          ? 'primary'
          : (activeSection === 'primary' ? 'primary' : 'college')));
    const newUser: LibraryUser = {
      ...userData,
      section: inferredSection,
      id: `user-${Date.now()}`,
      libraryCardId: cardId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => {
      const updated = [newUser, ...prev];
      localStorage.setItem('p_users_v3', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      insertUserToSupabase(newUser).catch(err => {
        console.warn('Could not insert user to Supabase:', err);
      });
    }

    return newUser;
  };

  const addUsersBatch = (
    usersList: Omit<LibraryUser, 'id' | 'createdAt'>[],
    options?: { updateDuplicates?: boolean }
  ): { addedCount: number; updatedCount: number; skippedCount: number } => {
    let added = 0;
    let updated = 0;
    let skipped = 0;
    const shouldUpdate = options?.updateDuplicates ?? true;

    const updatedUsers = [...users];

    for (const item of usersList) {
      const cleanEmail = (item.email || '').trim().toLowerCase();
      const cleanCard = (item.libraryCardId || '').trim().toLowerCase();

      const existingIndex = updatedUsers.findIndex((u) => {
        const uEmail = (u.email || '').trim().toLowerCase();
        const uCard = (u.libraryCardId || '').trim().toLowerCase();
        return (
          (cleanEmail && uEmail && cleanEmail === uEmail) ||
          (cleanCard && uCard && cleanCard === uCard) ||
          u.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );
      });

      if (existingIndex !== -1) {
        if (shouldUpdate) {
          const prevUser = updatedUsers[existingIndex];
          updatedUsers[existingIndex] = {
            ...prevUser,
            name: item.name || prevUser.name,
            role: item.role || prevUser.role,
            gradeOrYear: item.gradeOrYear !== undefined ? item.gradeOrYear : prevUser.gradeOrYear,
            department: item.department !== undefined ? item.department : prevUser.department,
            libraryCardId: item.libraryCardId || prevUser.libraryCardId,
            assignedTeacherId: item.assignedTeacherId || prevUser.assignedTeacherId,
            assignedTeacherName: item.assignedTeacherName || prevUser.assignedTeacherName,
          };
          updated++;
        } else {
          skipped++;
        }
      } else {
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const cardId = item.libraryCardId || (
          item.role === 'student' ? `LIB-STUD-${randNum}` : `LIB-TEACH-${randNum}`
        );
        const inferredSection: LibrarySection = (item.role === 'staff' || item.role === 'teacher' || item.role === 'admin' || item.role === 'librarian')
          ? 'all'
          : (item.section && item.section !== 'all'
            ? item.section
            : (item.gradeOrYear && (item.gradeOrYear.toLowerCase().includes('primary') || item.gradeOrYear.toLowerCase().includes('nursery'))
              ? 'primary'
              : (activeSection === 'primary' ? 'primary' : 'college')));
        const newUser: LibraryUser = {
          ...item,
          section: inferredSection,
          id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          libraryCardId: cardId,
          createdAt: new Date().toISOString().split('T')[0],
        };
        updatedUsers.unshift(newUser);
        added++;
      }
    }

    setUsers(updatedUsers);
    localStorage.setItem('p_users_v3', JSON.stringify(updatedUsers));

    return { addedCount: added, updatedCount: updated, skippedCount: skipped };
  };

  // 2. Holds: Reserve a book for 24h
  const createHold = (bookId: string, userId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return { success: false, message: 'Book not found.' };
    
    if (book.availableCopies < 1) {
      return { success: false, message: 'Holds can only be placed when at least 1 copy of the book is available.' };
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const alreadyHeldByUser = holds.some(h => h.bookId === bookId && h.userId === userId && h.status === 'active');
    if (alreadyHeldByUser) {
      return { success: false, message: 'You already have an active reserve hold on this book.' };
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setHours(today.getHours() + 24);

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    const newHold: BookHold = {
      id: `hold-${Date.now()}`,
      bookId,
      bookTitle: book.title,
      userId,
      userName: `${user.name} (${user.role === 'student' ? user.gradeOrYear : 'Teacher'})`,
      holdDate: formatDateTime(today),
      expiryDate: formatDateTime(expiry),
      status: 'active'
    };

    setHolds(prev => {
      const updated = [newHold, ...prev];
      localStorage.setItem('p_holds', JSON.stringify(updated));
      return updated;
    });

    if (!navigator.onLine || !isSupabaseConfigured) {
      enqueueOfflineMutation('ADD_HOLD', newHold, `Hold on "${book.title}" for ${user.name}`);
    } else {
      insertHoldToSupabase(newHold).catch((err) => {
        console.warn('Could not sync hold to Supabase, queuing for offline sync:', err);
        enqueueOfflineMutation('ADD_HOLD', newHold, `Hold on "${book.title}" for ${user.name}`);
      });
    }

    // Decrease available copies by 1
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b));

    return { 
      success: true, 
      message: `24-Hour Hold successfully active! "${book.title}" is reserved for ${user.name} until ${formatDateTime(expiry)}.` 
    };
  };

  const releaseHold = (holdId: string) => {
    const hold = holds.find(h => h.id === holdId);
    if (!hold) return;

    setHolds(prev => {
      const updated = prev.map(h => h.id === holdId ? { ...h, status: 'released' as const } : h);
      localStorage.setItem('p_holds', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      updateHoldInSupabase(holdId, 'released').catch((err) => {
        console.warn('Could not update hold in Supabase:', err);
      });
    }

    // Restore copy
    setBooks(prev => prev.map(b => b.id === hold.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b));
  };

  // 3. Ratings and Reviews for books
  const addBookReview = (bookId: string, rating: number, comment: string) => {
    const reviewerName = currentRole === 'librarian' ? 'Librarian Alabi' : currentLearnerName.split('(')[0].trim();
    const matchedUser = users.find(u => currentLearnerName.toLowerCase().includes(u.name.toLowerCase()));
    const reviewerRole = currentRole === 'librarian' ? 'librarian' as const : (matchedUser?.role || 'student');

    const newReview: BookReview = {
      id: `rev-${Date.now()}`,
      reviewerName,
      reviewerRole,
      rating,
      comment,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const reviews = b.reviews ? [...b.reviews, newReview] : [newReview];
      const avgRating = Math.round((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length) * 10) / 10;
      return {
        ...b,
        reviews,
        rating: avgRating
      };
    }));
  };

  // 4. Lost & Misplaced & Replacement
  const flagBookAsLostOrMisplaced = (recordId: string, status: 'lost' | 'misplaced') => {
    setCirculation(prev => prev.map(r => r.id === recordId ? { ...r, status } : r));
  };

  const markBookAsReplaced = (recordId: string) => {
    const record = circulation.find(r => r.id === recordId);
    if (!record) return;

    setCirculation(prev => prev.map(r => r.id === recordId ? { ...r, status: 'returned' as const, isReplaced: true } : r));

    // Increase copies because it was replaced (restoring inventory!)
    setBooks(prev => prev.map(b => b.id === record.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b));
  };

  const renewLoan = (recordId: string, days = 7) => {
    const record = circulation.find((r) => r.id === recordId);
    if (!record) return { success: false, message: 'Circulation record not found.' };

    const today = new Date();
    const newDueDate = new Date();
    newDueDate.setDate(today.getDate() + days);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setCirculation((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, status: 'borrowed' as const, dueDate: formatDate(newDueDate) }
          : r
      )
    );

    return {
      success: true,
      message: `Successfully renewed "${record.bookTitle}" loan. New due date is ${formatDate(newDueDate)}.`
    };
  };

  const updateBookUsageType = (bookId: string, usageType: 'circulation' | 'reserve') => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, usageType } : b))
    );
  };

  // 5. Automated simulated email dispatch
  const triggerOverdueEmail = (recordId: string) => {
    const record = circulation.find(r => r.id === recordId);
    if (!record) return { success: false, message: 'Record not found.' };

    const student = users.find(u => record.learnerName.includes(u.name));
    const studentEmail = student?.email || `${record.learnerName.toLowerCase().replace(/\s+/g, '')}@school.edu`;

    const newEmail: EmailLog = {
      id: `email-${Date.now()}`,
      recipient: record.learnerName,
      recipientEmail: studentEmail,
      subject: `⚠️ OVERDUE LIBRARY NOTICE: "${record.bookTitle}"`,
      body: `Dear ${record.learnerName.split('(')[0].trim()},\n\nOur system indicates that the book "${record.bookTitle}" borrowed on ${record.borrowDate} was due back on ${record.dueDate} and is now OVERDUE.\n\nPlease return it to the school library desk immediately to avoid penalty points.\n\nBest regards,\nPrimary & Secondary Library Administration`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'overdue'
    };

    setEmailLogs(prev => [newEmail, ...prev]);
    setCirculation(prev => prev.map(r => r.id === recordId ? { ...r, alertSent: true } : r));

    return { success: true, message: `Overdue alert notice sent to ${studentEmail} successfully!` };
  };

  const sendLostEmail = (recordId: string) => {
    const record = circulation.find(r => r.id === recordId);
    if (!record) return { success: false, message: 'Record not found.' };

    const student = users.find(u => record.learnerName.includes(u.name));
    const studentEmail = student?.email || `${record.learnerName.toLowerCase().replace(/\s+/g, '')}@school.edu`;

    const newEmail: EmailLog = {
      id: `email-${Date.now()}`,
      recipient: record.learnerName,
      recipientEmail: studentEmail,
      subject: `🚨 REPLACEMENT NOTICE: Lost Book "${record.bookTitle}"`,
      body: `Dear ${record.learnerName.split('(')[0].trim()},\n\nThe school library administration has flagged the book "${record.bookTitle}" borrowed by you as MISSING/LOST.\n\nPlease check your classroom and home. If it cannot be located, a replacement physical copy must be provided to the library desk so that we can mark it as replaced.\n\nWarm regards,\nLibrary Administration`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'lost'
    };

    setEmailLogs(prev => [newEmail, ...prev]);

    return { success: true, message: `Replacement notice email dispatched to ${studentEmail}!` };
  };

  // Multi-Branch Scoped Views: Everybody strictly sees ONLY what is theirs.
  // Mrs. Adeleke sees primary only; Mr. Alabi sees secondary/college only; learners see their enrolled campus.
  const scopedBooks = React.useMemo(() => {
    return books.filter((b) => (b.section || 'college') === boundSection);
  }, [books, boundSection]);

  const scopedCirculation = React.useMemo(() => {
    return circulation.filter((c) => (c.section || 'college') === boundSection);
  }, [circulation, boundSection]);

  const scopedUsers = React.useMemo(() => {
    return users.filter((u) => {
      if (u.id === currentUser?.id) return true;
      const uEmail = (u.email || '').toLowerCase();
      const uName = (u.name || '').toLowerCase();
      const uDept = (u.department || '').toLowerCase();

      // Administrator/librarian branch affinity
      if (uEmail.includes('adeleke') || uName.includes('adeleke') || uDept.includes('primary')) {
        return boundSection === 'primary';
      }
      if (uEmail.includes('alabi') || uName.includes('alabi') || uDept.includes('college') || uDept.includes('secondary')) {
        return boundSection === 'college';
      }

      // Learner and staff section affinity
      const userSec = u.section || (getGradeLevelForUser(u, boundSection) === 'primary' ? 'primary' : 'college');
      return userSec === boundSection;
    });
  }, [users, boundSection, currentUser?.id]);

  return (
    <AppContext.Provider
      value={{
        activeSection: boundSection,
        setActiveSection,
        allBooks: books,
        allCirculation: circulation,
        allUsers: users,
        books: scopedBooks,
        circulation: scopedCirculation,
        users: scopedUsers,
        userRole,
        setUserRole,
        currentUser,
        setCurrentUser,
        isLearner,
        isStaff,
        isAdmin,
        isLoggedIn,
        switchRolePreset,
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        spotlightData,
        collegeSpotlight,
        primarySpotlight,
        updateHeroSpotlight,
        setBookAsSpotlight,
        fetchBookOfWeekForGrade,
        catalogViewMode,
        setCatalogViewMode,
        selectedBook,
        setSelectedBook,
        selectedCategory,
        setSelectedCategory,
        currentRole,
        setCurrentRole,
        activeTab,
        setActiveTab,
        submissions,
        announcements,
        currentLearnerName,
        setCurrentLearnerName,
        isLibrarianLoggedIn,
        setIsLibrarianLoggedIn,
        loggedInLearner,
        setLoggedInLearner,
        currentPath,
        navigateTo,
        login,
        logout,
        createUser,
        addUsersBatch,
        assignLearnerToTeacher,
        assignMultipleLearnersToTeacher,
        isRosterModalOpen,
        setIsRosterModalOpen,
        holds,
        createHold,
        releaseHold,
        addBookReview,
        flagBookAsLostOrMisplaced,
        markBookAsReplaced,
        renewLoan,
        updateBookUsageType,
        triggerOverdueEmail,
        sendLostEmail,
        emailLogs,
        isCloudConnected,
        isLoadingCloudBooks,
        cloudSyncStatus,
        refreshBooks,
        refreshUsers,
        updateBook,
        deleteBook,
        clearSampleBooks,
        addBook,
        addBooksBatch,
        checkoutBook,
        returnBook,
        removeCirculationRecord,
        sendOverdueAlert,
        addSubmission,
        updateSubmission,
        approveSubmission,
        rejectSubmission,
        assignSubmissionTeacher,
        toggleLike,
        addComment,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        restockBook,
        updateUserProfile,
        updateLearnerByAdmin,
        deleteUser,
        isOnline,
        pendingOfflineChangesCount,
        isSyncingOfflineChanges,
        syncPendingOfflineChanges,
        readingProgressRecords,
        getReadingProgress,
        getUserReadingProgressList,
        saveReadingProgress,
        toggleBookNotification,
        dismissBookReminder,
        activeEBookModal,
        openEBookReader,
        closeEBookReader,
        physicalBooks,
        ebookBooks,
        inventoryFilter,
        setInventoryFilter,
        inventoryMetrics,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
