/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, CirculationRecord, StudentSubmission, Announcement, UserRole, AppRole, LibraryUser, User, NavView, BookHold, BookReview, HeroSpotlightData, CatalogViewMode, LibrarySection } from '../types';
import { initialBooks, initialCirculation, initialSubmissions, initialAnnouncements, initialHeroSpotlight, DEMO_SAMPLE_IDS } from '../data';
import { 
  isSupabaseConfigured, 
  fetchBooksFromSupabase, 
  insertBookToSupabase, 
  updateBookInSupabase,
  deleteBookFromSupabase,
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
  updateUserInSupabase
} from '../services/supabase';
import {
  getPendingOfflineMutations,
  enqueueOfflineMutation,
  dequeueOfflineMutation,
  setLastSyncTimestamp,
} from '../services/offlineSync';

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
  updateHeroSpotlight: (newData: HeroSpotlightData) => void;
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
  setIsLibrarianLoggedIn: (val: boolean) => void;
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
  deleteBook: (bookId: string) => Promise<{ success: boolean; message: string }>;
  clearSampleBooks: () => void;
  addBook: (book: Omit<Book, 'id' | 'readsCount'>) => void;
  addBooksBatch: (
    booksList: Omit<Book, 'id' | 'readsCount'>[],
    options?: { updateDuplicates?: boolean }
  ) => Promise<{ addedCount: number; updatedCount: number; skippedCount: number }>;
  checkoutBook: (bookId: string, learnerName: string, days?: number) => { success: boolean; message: string };
  returnBook: (recordId: string) => void;
  sendOverdueAlert: (recordId: string) => void;
  addSubmission: (title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  updateSubmission: (id: string, title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  approveSubmission: (id: string) => void;
  rejectSubmission: (id: string, feedback: string) => void;
  assignSubmissionTeacher: (submissionId: string, teacherId: string, teacherName: string, teacherDepartment?: string, assignmentNotes?: string) => void;
  toggleLike: (id: string) => void;
  addComment: (submissionId: string, content: string, authorName?: string, rating?: number) => void;
  addAnnouncement: (title: string, content: string, category: Announcement['category'], section?: LibrarySection) => void;
  restockBook: (bookId: string, quantity: number) => void;
  // Offline & Service Worker Sync
  isOnline: boolean;
  pendingOfflineChangesCount: number;
  isSyncingOfflineChanges: boolean;
  syncPendingOfflineChanges: () => Promise<{ success: boolean; syncedCount: number; errors: string[] }>;
}

export const defaultAdminUser: LibraryUser = {
  id: 'user-admin-1',
  name: 'Alabi Abdulmumuni',
  role: 'admin',
  department: 'School Library Administration',
  libraryCardId: 'LIB-ADMIN-0001',
  email: 'alabia@premierinternationalschool.org',
  password: 'Admin321',
  section: 'all',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  createdAt: '2025-09-01',
};

export const primaryAdminUser: LibraryUser = {
  id: 'user-admin-2',
  name: 'Adeleke Veronica',
  role: 'admin',
  department: 'School Library Administration',
  libraryCardId: 'LIB-ADMIN-0002',
  email: 'adelekev@premierinternationslschool.org',
  password: 'Adelekev',
  section: 'all',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
  createdAt: '2025-09-01',
};

const initialUsers: LibraryUser[] = [
  {
    id: 'user-student-1',
    name: 'Chidi Okafor',
    role: 'learner',
    gradeOrYear: 'Year 9E',
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
    id: 'user-student-2',
    name: 'Zainab Bello',
    role: 'learner',
    gradeOrYear: 'Primary 5B',
    admissionNumber: 'PIS/PRI/24/1102',
    password: 'PIS/PRI/24/1102',
    libraryCardId: 'LIB-PUPIL-1102',
    email: 'zainabb@premierinternationalschool.org',
    section: 'primary',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-12',
  },
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Normalized 3-Role State ('LEARNER' | 'STAFF' | 'ADMIN')
  const [userRole, setUserRoleState] = useState<AppRole>(() => {
    const saved = localStorage.getItem('p_app_role');
    if (saved === 'STAFF' || saved === 'ADMIN' || saved === 'LEARNER') return saved;
    const legacyRole = localStorage.getItem('p_role');
    const legacyLib = localStorage.getItem('p_lib_logged_in') === 'true';
    if (legacyLib || legacyRole === 'librarian' || legacyRole === 'admin') return 'ADMIN';
    return 'LEARNER';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('p_role');
    return (saved as UserRole) || 'learner';
  });

  const [isLibrarianLoggedIn, setIsLibrarianLoggedInState] = useState<boolean>(() => {
    return localStorage.getItem('p_lib_logged_in') === 'true';
  });

  const [loggedInLearner, setLoggedInLearnerState] = useState<LibraryUser | null>(() => {
    const saved = localStorage.getItem('p_learner_logged_in');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentUser, setCurrentUserState] = useState<LibraryUser | null>(() => {
    const saved = localStorage.getItem('p_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Modal control for the Librarian Roster Tool
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname;
  });

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const saved = localStorage.getItem('p_tab');
    return saved || 'home';
  });

  // Active View navigation state (GetEpic Model)
  const [activeView, setActiveViewState] = useState<NavView>(() => {
    const p = window.location.pathname;
    return pathToViewMap[p] || 'EXPLORE';
  });

  // Global Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hero Spotlight State
  const [spotlightData, setSpotlightData] = useState<HeroSpotlightData>(() => {
    const saved = localStorage.getItem('p_hero_spotlight');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialHeroSpotlight;
  });

  const updateHeroSpotlight = (newData: HeroSpotlightData) => {
    setSpotlightData(newData);
    localStorage.setItem('p_hero_spotlight', JSON.stringify(newData));
  };

  // Catalog View Mode State ('CAROUSEL' | 'GRID')
  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>('CAROUSEL');

  // Selected Category filter ('ALL', 'POPULAR', etc.)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Selected Book for Drawer/Modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [books, setBooks] = useState<Book[]>(() => {
    const samplesCleared = localStorage.getItem('p_samples_cleared') === 'true';
    const saved = localStorage.getItem('p_books_v3');
    const catalogBase = samplesCleared ? initialBooks.filter(b => !DEMO_SAMPLE_IDS.has(b.id)) : initialBooks;

    if (saved) {
      try {
        const parsed: Book[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const baseList = samplesCleared ? parsed.filter(b => !DEMO_SAMPLE_IDS.has(b.id)) : parsed;
          const existingIds = new Set(baseList.map(b => b.id));
          const existingIsbns = new Set(baseList.map(b => (b.isbn || '').replace(/[-\s]/g, '')));
          const missing = catalogBase.filter(ib => {
            const cleanIsbn = (ib.isbn || '').replace(/[-\s]/g, '');
            return !existingIds.has(ib.id) && !existingIsbns.has(cleanIsbn);
          });
          const merged = missing.length > 0 ? [...missing, ...baseList] : baseList;
          try {
            localStorage.setItem('p_books_v3', JSON.stringify(merged));
          } catch {
            // ignore
          }
          return merged;
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
    const saved = localStorage.getItem('p_users_v3') || localStorage.getItem('p_users');
    if (saved) {
      try {
        const parsed: LibraryUser[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return initialUsers;
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
    return localStorage.getItem('p_learner_name') || 'Chidi Okafor (Year 9)';
  });

  // Active Library Section for multi-branch scoping (college vs primary)
  const [activeSection, setActiveSectionState] = useState<LibrarySection>(() => {
    const saved = localStorage.getItem('p_active_section');
    if (saved === 'college' || saved === 'primary' || saved === 'all') return saved;
    const userStr = localStorage.getItem('p_current_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.section === 'primary' || u.section === 'college') return u.section;
      } catch {
        // ignore
      }
    }
    return 'college';
  });

  const setActiveSection = (section: LibrarySection) => {
    setActiveSectionState(section);
    localStorage.setItem('p_active_section', section);
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
        setBooks(data);
        localStorage.setItem('p_books_v3', JSON.stringify(data));
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
        setUsers(data);
        localStorage.setItem('p_users_v3', JSON.stringify(data));
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
    const samplesCleared = localStorage.getItem('p_samples_cleared') === 'true';
    const catalogBase = samplesCleared ? initialBooks.filter(b => !DEMO_SAMPLE_IDS.has(b.id)) : initialBooks;
    setBooks((prev) => {
      const existingIds = new Set(prev.map(b => b.id));
      const existingIsbns = new Set(prev.map(b => (b.isbn || '').replace(/[-\s]/g, '')));
      const missing = catalogBase.filter(ib => {
        const cleanIsbn = (ib.isbn || '').replace(/[-\s]/g, '');
        return !existingIds.has(ib.id) && !existingIsbns.has(cleanIsbn);
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

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('p_app_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('p_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('p_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('p_books', JSON.stringify(books));
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
    localStorage.setItem('p_users_v3', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('p_holds', JSON.stringify(holds));
  }, [holds]);

  useEffect(() => {
    localStorage.setItem('p_emaillogs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem('p_learner_name', currentLearnerName);
  }, [currentLearnerName]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('p_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('p_current_user');
    }
  }, [currentUser]);

  // Set User Role synchronized
  const setUserRole = (role: AppRole) => {
    setUserRoleState(role);
    if (role === 'ADMIN') {
      setIsLibrarianLoggedInState(true);
      setCurrentRole('admin');
      setCurrentUserState(defaultAdminUser);
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
        // Staff is global: only staff can see primary and secondary inventory
        setActiveSection('all');
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
    setUserRole(role);
  };

  const setIsLibrarianLoggedIn = (val: boolean) => {
    setIsLibrarianLoggedInState(val);
    localStorage.setItem('p_lib_logged_in', String(val));
    if (val) {
      setUserRoleState('ADMIN');
      setCurrentRole('admin');
      setCurrentUserState(defaultAdminUser);
    } else {
      setUserRoleState('LEARNER');
      setCurrentRole('learner');
    }
  };

  const setLoggedInLearner = (user: LibraryUser | null) => {
    setLoggedInLearnerState(user);
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('p_learner_logged_in', JSON.stringify(user));
      const formattedName = (user.role === 'student' || user.role === 'learner')
        ? `${user.name} (${user.gradeOrYear || 'Scholar'})` 
        : `${user.name} (Teacher)`;
      setCurrentLearnerName(formattedName);
      if (user.role === 'staff' || user.role === 'teacher') {
        setUserRoleState('STAFF');
        setCurrentRole('staff');
        setIsLibrarianLoggedInState(true);
      } else if (user.role === 'admin' || user.role === 'librarian') {
        setUserRoleState('ADMIN');
        setCurrentRole('admin');
        setIsLibrarianLoggedInState(true);
      } else {
        setUserRoleState('LEARNER');
        setCurrentRole('learner');
        setIsLibrarianLoggedInState(false);
      }
    } else {
      localStorage.removeItem('p_learner_logged_in');
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
      section: isUserStaffOrAdmin 
        ? 'all' 
        : (('section' in user && user.section) ? user.section : (user.gradeOrYear && (user.gradeOrYear.toLowerCase().includes('primary') || user.gradeOrYear.toLowerCase().includes('nursery')) ? 'primary' : 'college')),
      createdAt: user.createdAt || new Date().toISOString().split('T')[0],
    };

    setCurrentUser(fullUser);
    setUserRole(normRole);
    if (isUserStaffOrAdmin) {
      setIsLibrarianLoggedInState(true);
      setActiveSection('all');
    } else {
      setIsLibrarianLoggedInState(false);
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
    localStorage.removeItem('p_lib_logged_in');
    setLoggedInLearnerState(null);
    localStorage.removeItem('p_learner_logged_in');
    setCurrentUserState(null);
    setUserRoleState('LEARNER');
    setCurrentRole('learner');
    setActiveTabState('home');
    setActiveViewState('EXPLORE');
    if (window.location.pathname === '/admin' || window.location.pathname === '/login') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath('/');
    }
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
        : (currentUser?.email === 'adelekev@premierinternationslschool.org' ? 'primary' :
           currentUser?.email === 'alabia@premierinternationalschool.org' ? 'college' : undefined);

    const resolvedSection: 'college' | 'primary' = (newBookData.section === 'primary' || newBookData.section === 'college')
      ? newBookData.section
      : (loggedInBranch || (activeSection === 'primary' ? 'primary' : 'college'));
    const newBook: Book = {
      ...newBookData,
      id: tempId,
      readsCount: 0,
      section: resolvedSection,
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
            : (currentUser?.email === 'adelekev@premierinternationslschool.org' ? 'primary' :
               currentUser?.email === 'alabia@premierinternationalschool.org' ? 'college' : undefined);

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

  const deleteBook = async (bookId: string): Promise<{ success: boolean; message: string }> => {
    setBooks((prev) => {
      const updated = prev.filter((b) => b.id !== bookId);
      localStorage.setItem('p_books_v3', JSON.stringify(updated));
      return updated;
    });
    setCirculation((prev) => {
      const updatedCirc = prev.filter((c) => c.bookId !== bookId);
      localStorage.setItem('p_circulation', JSON.stringify(updatedCirc));
      return updatedCirc;
    });
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
    return { success: true, message: 'Title removed from catalog.' };
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
    const bookIndex = books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return { success: false, message: 'Book not found in the catalog.' };
    }

    const book = books[bookIndex];
    if (book.availableCopies <= 0) {
      return { success: false, message: `"${book.title}" is currently fully checked out.` };
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
    setAnnouncements((prev) => [newAnn, ...prev]);
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

  // Multi-Branch Scoped Views
  // 1. Staff is global. Only staff should be able to see primary and secondary inventory.
  // 2. Learners/students only see their assigned school section (Primary or College).
  const scopedBooks = React.useMemo(() => {
    // If student/learner is logged in: STRICTLY lock to their own section, never both
    if (isLearner && (currentUser || loggedInLearner)) {
      const learnerSec = (currentUser?.section || loggedInLearner?.section || 'college') === 'primary' ? 'primary' : 'college';
      return books.filter((b) => (b.section || 'college') === learnerSec);
    }

    // If guest (not logged in as staff):
    // Guests cannot see full multi-branch inventory; default to college section
    if (!isAdmin && !isStaff) {
      if (activeSection === 'all') {
        return books.filter((b) => (b.section || 'college') === 'college');
      }
      return books.filter((b) => (b.section || 'college') === activeSection);
    }

    // Only staff can see primary and secondary inventory!
    // When activeSection is 'all', staff sees both primary and secondary inventory.
    if (activeSection === 'all') return books;
    return books.filter((b) => (b.section || 'college') === activeSection);
  }, [books, activeSection, isLearner, currentUser, loggedInLearner, isAdmin, isStaff]);

  const scopedCirculation = React.useMemo(() => {
    if (isLearner && (currentUser || loggedInLearner)) {
      const learnerSec = (currentUser?.section || loggedInLearner?.section || 'college') === 'primary' ? 'primary' : 'college';
      return circulation.filter((c) => (c.section || 'college') === learnerSec);
    }
    if (activeSection === 'all') return circulation;
    return circulation.filter((c) => (c.section || 'college') === activeSection);
  }, [circulation, activeSection, isLearner, currentUser, loggedInLearner]);

  const scopedUsers = React.useMemo(() => {
    // Staff are global: always included in user directory
    if (activeSection === 'all') return users;
    return users.filter((u) => {
      // Staff have global cross-sectional access
      if (u.role === 'staff' || u.role === 'teacher' || u.role === 'admin' || u.role === 'librarian' || u.section === 'all') return true;
      return (u.section || 'college') === activeSection;
    });
  }, [users, activeSection]);

  return (
    <AppContext.Provider
      value={{
        activeSection,
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
        updateHeroSpotlight,
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
        deleteBook,
        clearSampleBooks,
        addBook,
        addBooksBatch,
        checkoutBook,
        returnBook,
        sendOverdueAlert,
        addSubmission,
        updateSubmission,
        approveSubmission,
        rejectSubmission,
        assignSubmissionTeacher,
        toggleLike,
        addComment,
        addAnnouncement,
        restockBook,
        isOnline,
        pendingOfflineChangesCount,
        isSyncingOfflineChanges,
        syncPendingOfflineChanges,
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
