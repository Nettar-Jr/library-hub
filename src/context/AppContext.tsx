/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, CirculationRecord, StudentSubmission, Announcement, UserRole, LibraryUser, BookHold, BookReview } from '../types';
import { initialBooks, initialCirculation, initialSubmissions, initialAnnouncements } from '../data';

export interface EmailLog {
  id: string;
  recipient: string;
  recipientEmail: string;
  subject: string;
  body: string;
  date: string;
  type: 'overdue' | 'lost' | 'general';
}

interface AppContextType {
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
  logout: () => void;
  
  // Custom states and actions
  users: LibraryUser[];
  createUser: (userData: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryCardId'>) => LibraryUser;
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
  
  // Actions
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

const initialUsers: LibraryUser[] = [
  {
    id: 'user-1',
    name: 'Chidi Okafor',
    role: 'student',
    gradeOrYear: 'Year 9',
    libraryCardId: 'LIB-STUD-1001',
    email: 'chidi.okafor@school.edu',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-2',
    name: 'Amina Bello',
    role: 'student',
    gradeOrYear: 'Primary 5',
    libraryCardId: 'LIB-STUD-1002',
    email: 'amina.bello@school.edu',
    createdAt: '2026-01-12',
  },
  {
    id: 'user-3',
    name: 'Sarah J.',
    role: 'student',
    gradeOrYear: 'Primary 4',
    libraryCardId: 'LIB-STUD-1003',
    email: 'sarah.j@school.edu',
    createdAt: '2026-01-15',
  },
  {
    id: 'user-4',
    name: 'Tunde Williams',
    role: 'student',
    gradeOrYear: 'Year 11',
    libraryCardId: 'LIB-STUD-1004',
    email: 'tunde.williams@school.edu',
    createdAt: '2026-01-18',
  },
  {
    id: 'user-5',
    name: 'Mrs. Emily Cole',
    role: 'teacher',
    department: 'English Department',
    libraryCardId: 'LIB-TEACH-2001',
    email: 'emily.cole@school.edu',
    createdAt: '2026-01-05',
  },
  {
    id: 'user-6',
    name: 'Mr. David Mensah',
    role: 'teacher',
    department: 'Science Department',
    libraryCardId: 'LIB-TEACH-2002',
    email: 'david.mensah@school.edu',
    createdAt: '2026-01-08',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from localStorage or default static data
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

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname;
  });

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const saved = localStorage.getItem('p_tab');
    return saved || 'home';
  });

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('p_books_v3') || localStorage.getItem('p_books');
    if (saved) {
      try {
        const parsed: Book[] = JSON.parse(saved);
        // Merge with initialBooks so missing coverImages and new fields are populated
        return initialBooks.map(ib => {
          const matched = parsed.find(p => p.id === ib.id);
          return matched ? { ...ib, ...matched, coverImage: matched.coverImage || ib.coverImage } : ib;
        }).concat(parsed.filter(p => !initialBooks.some(ib => ib.id === p.id)));
      } catch {
        return initialBooks;
      }
    }
    return initialBooks;
  });

  const [circulation, setCirculation] = useState<CirculationRecord[]>(() => {
    const saved = localStorage.getItem('p_circulation');
    return saved ? JSON.parse(saved) : initialCirculation;
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
    const saved = localStorage.getItem('p_users');
    return saved ? JSON.parse(saved) : initialUsers;
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

  // Sync state to localStorage
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
    localStorage.setItem('p_users', JSON.stringify(users));
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

  const setIsLibrarianLoggedIn = (val: boolean) => {
    setIsLibrarianLoggedInState(val);
    localStorage.setItem('p_lib_logged_in', String(val));
    if (val) {
      setCurrentRole('librarian');
    }
  };

  const setLoggedInLearner = (user: LibraryUser | null) => {
    setLoggedInLearnerState(user);
    if (user) {
      localStorage.setItem('p_learner_logged_in', JSON.stringify(user));
      const formattedName = user.role === 'student' ? `${user.name} (${user.gradeOrYear})` : `${user.name} (Teacher)`;
      setCurrentLearnerName(formattedName);
      setCurrentRole('learner');
    } else {
      localStorage.removeItem('p_learner_logged_in');
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const logout = () => {
    setIsLibrarianLoggedInState(false);
    localStorage.removeItem('p_lib_logged_in');
    setLoggedInLearnerState(null);
    localStorage.removeItem('p_learner_logged_in');
    setActiveTabState('home');
    if (window.location.pathname === '/admin') {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
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
  const addBook = (newBookData: Omit<Book, 'id' | 'readsCount'>) => {
    const newBook: Book = {
      ...newBookData,
      id: `book-${Date.now()}`,
      readsCount: 0,
    };
    setBooks((prev) => [newBook, ...prev]);
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
        logout,
        users,
        createUser,
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
