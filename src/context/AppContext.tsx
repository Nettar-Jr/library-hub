/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, CirculationRecord, StudentSubmission, Announcement, UserRole, AppRole, LibraryUser, User, NavView, BookHold, BookReview, HeroSpotlightData, CatalogViewMode } from '../types';
import { initialBooks, initialCirculation, initialSubmissions, initialAnnouncements, initialHeroSpotlight } from '../data';
import { 
  isSupabaseConfigured, 
  fetchBooksFromSupabase, 
  insertBookToSupabase, 
  deleteBookFromSupabase 
} from '../services/supabase';

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
  deleteBook: (bookId: string) => Promise<{ success: boolean; message: string }>;
  clearSampleBooks: () => void;
  addBook: (book: Omit<Book, 'id' | 'readsCount'>) => void;
  checkoutBook: (bookId: string, learnerName: string, days?: number) => { success: boolean; message: string };
  returnBook: (recordId: string) => void;
  sendOverdueAlert: (recordId: string) => void;
  addSubmission: (title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  updateSubmission: (id: string, title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  approveSubmission: (id: string) => void;
  rejectSubmission: (id: string, feedback: string) => void;
  toggleLike: (id: string) => void;
  addComment: (submissionId: string, content: string, authorName?: string, rating?: number) => void;
  addAnnouncement: (title: string, content: string, category: Announcement['category']) => void;
  restockBook: (bookId: string, quantity: number) => void;
}

export const defaultAdminUser: LibraryUser = {
  id: 'user-admin-1',
  name: 'Librarian Abdul Alabi',
  role: 'admin',
  department: 'Library Administration & Curation',
  libraryCardId: 'LIB-ADMIN-0001',
  email: 'abdul.alabi@premier-international.edu',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  createdAt: '2025-09-01',
};

const initialUsers: LibraryUser[] = [
  {
    id: 'user-1',
    name: 'Chidi Okafor',
    role: 'learner',
    gradeOrYear: 'Year 9',
    libraryCardId: 'LIB-STUD-1001',
    email: 'chidi.okafor@school.edu',
    assignedTeacherId: 'user-5',
    assignedTeacherName: 'Mrs. Emily Cole',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-2',
    name: 'Amina Bello',
    role: 'learner',
    gradeOrYear: 'Primary 5',
    libraryCardId: 'LIB-STUD-1002',
    email: 'amina.bello@school.edu',
    assignedTeacherId: 'user-6',
    assignedTeacherName: 'Mr. David Mensah',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-12',
  },
  {
    id: 'user-3',
    name: 'Sarah J.',
    role: 'learner',
    gradeOrYear: 'Primary 4',
    libraryCardId: 'LIB-STUD-1003',
    email: 'sarah.j@school.edu',
    assignedTeacherId: 'user-5',
    assignedTeacherName: 'Mrs. Emily Cole',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-15',
  },
  {
    id: 'user-4',
    name: 'Tunde Williams',
    role: 'learner',
    gradeOrYear: 'Year 11',
    libraryCardId: 'LIB-STUD-1004',
    email: 'tunde.williams@school.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-18',
  },
  {
    id: 'user-7',
    name: 'Kemi Adebayo',
    role: 'learner',
    gradeOrYear: 'Year 8',
    libraryCardId: 'LIB-STUD-1005',
    email: 'kemi.adebayo@school.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-20',
  },
  {
    id: 'user-8',
    name: 'Daniel Okon',
    role: 'learner',
    gradeOrYear: 'Year 10',
    libraryCardId: 'LIB-STUD-1006',
    email: 'daniel.okon@school.edu',
    assignedTeacherId: 'user-6',
    assignedTeacherName: 'Mr. David Mensah',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-22',
  },
  {
    id: 'user-5',
    name: 'Mrs. Emily Cole',
    role: 'staff',
    department: 'English & Literature Department',
    libraryCardId: 'LIB-TEACH-2001',
    email: 'emily.cole@school.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-05',
  },
  {
    id: 'user-6',
    name: 'Mr. David Mensah',
    role: 'staff',
    department: 'Science & STEM Department',
    libraryCardId: 'LIB-TEACH-2002',
    email: 'david.mensah@school.edu',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-08',
  },
  {
    id: 'user-9',
    name: 'Ms. Zainab Farooq',
    role: 'staff',
    department: 'Creative Arts & World Languages',
    libraryCardId: 'LIB-TEACH-2003',
    email: 'zainab.farooq@school.edu',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-14',
  },
  defaultAdminUser,
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
    if (samplesCleared) {
      if (saved) {
        try {
          const parsed: Book[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const sampleIds = new Set(initialBooks.map(ib => ib.id));
            return parsed.filter(b => !sampleIds.has(b.id));
          }
        } catch {
          return [];
        }
      }
      return [];
    }
    if (saved) {
      try {
        const parsed: Book[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return [];
      }
    }
    return initialBooks;
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
    return saved ? JSON.parse(saved) : initialSubmissions;
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

  useEffect(() => {
    if (isSupabaseConfigured) {
      refreshBooks();
    }
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
    } else if (role === 'STAFF') {
      setIsLibrarianLoggedInState(true);
      setCurrentRole('staff');
      const teacher = users.find(u => u.role === 'staff' || u.role === 'teacher') || initialUsers[6];
      setCurrentUserState(teacher);
      setLoggedInLearnerState(teacher);
    } else {
      setIsLibrarianLoggedInState(false);
      setCurrentRole('learner');
      const student = users.find(u => u.role === 'learner' || u.role === 'student') || initialUsers[0];
      setCurrentUserState(student);
      setLoggedInLearnerState(student);
      setCurrentLearnerName(`${student.name} (${student.gradeOrYear || 'Student'})`);
    }
  };

  const setCurrentUser = (user: LibraryUser | null) => {
    setCurrentUserState(user);
    if (user) {
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
      createdAt: user.createdAt || new Date().toISOString().split('T')[0],
    };

    setCurrentUser(fullUser);
    setUserRole(normRole);
    if (normRole === 'ADMIN' || normRole === 'STAFF') {
      setIsLibrarianLoggedInState(true);
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
    const newBook: Book = {
      ...newBookData,
      id: tempId,
      readsCount: 0,
    };
    // Optimistic local state update
    setBooks((prev) => [newBook, ...prev]);

    // Persist to Supabase if connected
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await insertBookToSupabase(newBookData);
        if (data) {
          // Replace temp optimistic book with server-generated ID and record
          setBooks((prev) => prev.map((b) => (b.id === tempId ? data : b)));
          setCloudSyncStatus('synced');
        } else if (error) {
          console.warn('Could not insert to Supabase, retained in local storage:', error);
        }
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
      }
    }
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
    if (isSupabaseConfigured) {
      try {
        await deleteBookFromSupabase(bookId);
      } catch (err) {
        console.warn('Failed to delete from Supabase:', err);
      }
    }
    return { success: true, message: 'Title removed from catalog.' };
  };

  const clearSampleBooks = () => {
    const sampleIds = new Set(initialBooks.map((b) => b.id));
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
    };

    setCirculation((prev) => [newRecord, ...prev]);
    return { success: true, message: `Successfully checked out "${book.title}" to ${learnerName}. Due date: ${formatDate(dueDate)}` };
  };

  const returnBook = (recordId: string) => {
    const record = circulation.find((r) => r.id === recordId);
    if (!record || record.status === 'returned') return;

    // Update circulation record
    const todayStr = new Date().toISOString().split('T')[0];
    setCirculation((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, status: 'returned' as const, returnDate: todayStr }
          : r
      )
    );

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
    const authorName = currentRole === 'learner' ? currentLearnerName.split('(')[0].trim() : 'Guest Learner';
    const gradeOrYear = currentRole === 'learner' ? currentLearnerName.match(/\(([^)]+)\)/)?.[1] || 'Year 9' : 'Primary 6';

    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}`,
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

    setSubmissions((prev) => [newSub, ...prev]);
  };

  const updateSubmission = (
    id: string,
    title: string,
    category: StudentSubmission['category'],
    content: string,
    imageUrl?: string
  ) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              title,
              category,
              content,
              imageUrl,
              status: 'pending' as const, // Resubmitting sets it back to pending for review!
              createdAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const approveSubmission = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'approved' as const } : s))
    );
  };

  const rejectSubmission = (id: string, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: 'rejected' as const, moderationFeedback: feedback } : s
      )
    );
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

  const addAnnouncement = (title: string, content: string, category: Announcement['category']) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      category,
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
    const newUser: LibraryUser = {
      ...userData,
      id: `user-${Date.now()}`,
      libraryCardId: cardId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [newUser, ...prev]);
    return newUser;
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

    setHolds(prev => [newHold, ...prev]);

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

    setHolds(prev => prev.map(h => h.id === holdId ? { ...h, status: 'released' as const } : h));

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

  return (
    <AppContext.Provider
      value={{
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
        books,
        circulation,
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
        users,
        createUser,
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
        deleteBook,
        clearSampleBooks,
        addBook,
        checkoutBook,
        returnBook,
        sendOverdueAlert,
        addSubmission,
        updateSubmission,
        approveSubmission,
        rejectSubmission,
        toggleLike,
        addComment,
        addAnnouncement,
        restockBook,
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
