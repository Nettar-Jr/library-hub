/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BookCard } from './BookCard';
import { BookDetailModal } from './BookDetailModal';
import { Book, BOOK_CATEGORIES } from '../types';
import { 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Layers, 
  LayoutGrid,
  Plus, 
  Check, 
  BookOpen,
  Headphones,
  SlidersHorizontal,
  BookmarkCheck,
  Lock,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Trash2,
  Camera,
  Sparkles,
  Barcode,
  FileSpreadsheet,
  WifiOff,
  Building2,
  ScanLine,
  Zap,
  Radio,
  UploadCloud,
  FileText,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CameraBarcodeScanner } from './CameraBarcodeScanner';
import { lookupBookByISBN, playScannerBeep } from '../utils/isbnLookup';
import { parseRawTextToPages } from '../utils/ebookUtils';
import { CsvBatchImport } from './CsvBatchImport';
import { EditBookModal } from './EditBookModal';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Resources' },
  { id: 'POPULAR', label: 'High Circulation' },
  { id: 'CLASSICS', label: 'Curriculum Classics' },
  { id: 'AFRICAN', label: 'African Literature & Heritage' },
  { id: 'STEM', label: 'Science & Mathematics' },
  { id: 'CODING', label: 'Computer Science' },
  { id: 'COMICS', label: 'Graphic Novels & Fiction' },
  { id: 'AUDIOBOOKS', label: 'Audiobooks & Media' },
];

export const BookCatalog: React.FC = () => {
  const { 
    books, 
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory, 
    selectedBook, 
    setSelectedBook,
    catalogViewMode,
    setCatalogViewMode,
    currentRole,
    isAdmin,
    addBook,
    deleteBook,
    clearSampleBooks,
    isCloudConnected,
    isLoadingCloudBooks,
    cloudSyncStatus,
    refreshBooks,
    currentUser,
    loggedInLearner,
    circulation,
    holds,
    currentLearnerName,
    checkoutBook,
    isOnline,
    pendingOfflineChangesCount,
    activeSection,
    setActiveSection,
    allBooks,
    isStaff,
    isLearner,
    inventoryFilter,
    setInventoryFilter,
    inventoryMetrics,
    openEBookReader
  } = useApp();

  const canEdit = !isLearner && (isAdmin || isStaff);

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Local filter controls
  const [activeSort, setActiveSort] = useState<'reads' | 'title' | 'rating' | 'newest' | 'callNumber'>('reads');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'LOANED'>('ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'PRINT' | 'AUDIO'>('ALL');
  const [myActivityFilter, setMyActivityFilter] = useState<'ALL' | 'LOANS' | 'HOLDS'>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isDeletingBook, setIsDeletingBook] = useState(false);
  const [showCatalogCameraScanner, setShowCatalogCameraScanner] = useState(false);
  const [scannerType, setScannerType] = useState<'laser' | 'camera'>('laser');
  const [laserScanInput, setLaserScanInput] = useState<string>('');
  const [lastFetchedBook, setLastFetchedBook] = useState<{
    title: string;
    author: string;
    source: string;
    coverUrl?: string;
    deweyCode?: string;
    category?: string;
  } | null>(null);

  const laserInputRef = useRef<HTMLInputElement>(null);
  const scannerBufferRef = useRef<{ buffer: string; lastTime: number }>({ buffer: '', lastTime: 0 });

  const [isLookingUpISBN, setIsLookingUpISBN] = useState(false);
  const [newBookForm, setNewBookForm] = useState<Partial<Book>>({
    title: '',
    author: '',
    isbn: '',
    category: 'African Literature',
    section: activeSection === 'primary' ? 'primary' : 'college',
    totalCopies: 5,
    availableCopies: 5,
    description: '',
    coverImage: '',
    deweyClass: '800',
    deweyCode: '896.3',
    ageRange: 'Ages 10-18',
    readingLevel: 'Lexile 800L',
    hasAudio: false,
    isPopular: false,
    isNew: true,
    inventoryType: 'physical',
    ebookFormat: 'pages',
    ebookPages: undefined,
    ebookFileName: undefined,
    ebookFileSize: undefined,
  });

  // E-Book Manuscript Upload & Text Paste state for new book accession
  const [manuscriptPasteText, setManuscriptPasteText] = useState('');
  const [showManuscriptPaste, setShowManuscriptPaste] = useState(false);
  const [ebookUploadStatus, setEbookUploadStatus] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setActionToast({ type, message });
    setTimeout(() => setActionToast(null), 3500);
  };

  // Perform OPAC Bibliographic Lookup by ISBN
  const handleExecuteIsbnLookup = async (scannedRaw: string) => {
    const clean = scannedRaw.replace(/[^0-9X]/gi, '').trim();
    if (clean.length !== 10 && clean.length !== 13) {
      playScannerBeep('warning');
      showToast('error', `Code "${scannedRaw}" is not a recognized 10 or 13-digit ISBN barcode.`);
      return;
    }

    setIsLookingUpISBN(true);
    showToast('success', `Scanned ISBN ${clean}. Querying Open Library & Google Books OPAC...`);

    try {
      const res = await lookupBookByISBN(clean);
      if (res.success && res.book) {
        playScannerBeep('success');
        setNewBookForm((prev) => ({
          ...prev,
          isbn: clean,
          title: res.book!.title || prev.title,
          author: res.book!.authors.join(', ') || prev.author,
          description: res.book!.description || prev.description,
          coverImage: res.book!.coverUrl || prev.coverImage,
          deweyCode: res.book!.deweyCode || prev.deweyCode,
          deweyClass: res.book!.deweyClass || prev.deweyClass,
          category: res.book!.suggestedCategory || prev.category,
          ageRange: res.book!.suggestedAgeRange || prev.ageRange,
          readingLevel: res.book!.suggestedReadingLevel || prev.readingLevel,
        }));
        setLastFetchedBook({
          title: res.book.title,
          author: res.book.authors.join(', '),
          source: res.book.opacSource || 'Global OPAC',
          coverUrl: res.book.coverUrl,
          deweyCode: res.book.deweyCode,
          category: res.book.suggestedCategory,
        });
        showToast('success', `Auto-populated "${res.book.title}" via ${res.book.opacSource || 'OPAC'}!`);
      } else {
        playScannerBeep('warning');
        setNewBookForm((prev) => ({ ...prev, isbn: clean }));
        showToast('error', res.error || 'ISBN scanned! No public OPAC record found. You can enter details manually.');
      }
    } catch (err: any) {
      playScannerBeep('warning');
      showToast('error', `OPAC query failed: ${err.message}`);
    } finally {
      setIsLookingUpISBN(false);
      setLaserScanInput('');
    }
  };

  // Hardware 1D Laser Barcode Scanner Global Keystroke Interceptor
  useEffect(() => {
    if (!isAddBookModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - scannerBufferRef.current.lastTime;
      scannerBufferRef.current.lastTime = now;

      // Handle Enter key from POS scanner
      if (e.key === 'Enter') {
        const buffered = scannerBufferRef.current.buffer.trim();
        const clean = buffered.replace(/[^0-9X]/gi, '');
        if (clean.length === 10 || clean.length === 13) {
          e.preventDefault();
          e.stopPropagation();
          setLaserScanInput(clean);
          handleExecuteIsbnLookup(clean);
          scannerBufferRef.current.buffer = '';
          return;
        }
        scannerBufferRef.current.buffer = '';
        return;
      }

      // If key is a printable single character
      if (e.key && e.key.length === 1) {
        // POS barcode readers type at high speed (<60ms per keystroke).
        // If human is typing slowly (>200ms), reset buffer.
        if (timeDiff > 250) {
          scannerBufferRef.current.buffer = e.key;
        } else {
          scannerBufferRef.current.buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isAddBookModalOpen]);

  // Auto-focus laser scanner input when accession modal opens
  useEffect(() => {
    if (isAddBookModalOpen && scannerType === 'laser') {
      const timer = setTimeout(() => {
        laserInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isAddBookModalOpen, scannerType]);

  // Map of active loans for the current student
  const userLoanMap = useMemo(() => {
    const map = new Map<string, { isBorrowed: boolean; dueDate: string }>();
    if (!currentLearnerName) return map;
    circulation
      .filter((r) => r.learnerName === currentLearnerName && r.status !== 'returned')
      .forEach((r) => {
        map.set(r.bookId, { isBorrowed: true, dueDate: r.dueDate });
      });
    return map;
  }, [circulation, currentLearnerName]);

  // Map of active holds for the current student
  const userHoldMap = useMemo(() => {
    const map = new Map<string, boolean>();
    const uid = currentUser?.id || loggedInLearner?.id;
    if (!uid) return map;
    holds
      .filter((h) => h.userId === uid && h.status === 'active')
      .forEach((h) => {
        map.set(h.bookId, true);
      });
    return map;
  }, [holds, currentUser, loggedInLearner]);

  // Filter books based on query, category, availability, format, and personal activity
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.deweyCode && b.deweyCode.includes(q)) ||
        (b.callNumber && b.callNumber.toLowerCase().includes(q))
      );

      let matchesCategory = true;
      if (selectedCategory === 'POPULAR') {
        matchesCategory = !!b.isPopular || b.readsCount > 80;
      } else if (selectedCategory === 'AUDIOBOOKS') {
        matchesCategory = !!b.isAudiobook || !!b.hasAudio;
      } else if (selectedCategory === 'COMICS') {
        matchesCategory = b.category.toLowerCase().includes('comic') || b.category.toLowerCase().includes('fiction') || b.category.toLowerCase().includes('graphic');
      } else if (selectedCategory === 'STEM') {
        matchesCategory = b.category.toLowerCase().includes('stem') || b.category.toLowerCase().includes('space') || b.category.toLowerCase().includes('tech') || b.category.toLowerCase().includes('science');
      } else if (selectedCategory === 'AFRICAN') {
        matchesCategory = b.category.toLowerCase().includes('african') || b.category.toLowerCase().includes('history') || b.category.toLowerCase().includes('heritage');
      } else if (selectedCategory === 'CLASSICS') {
        matchesCategory = b.category.toLowerCase().includes('classic') || b.category.toLowerCase().includes('philosophy');
      } else if (selectedCategory === 'CODING') {
        matchesCategory = b.category.toLowerCase().includes('coding') || b.category.toLowerCase().includes('tech') || b.category.toLowerCase().includes('computer');
      } else if (selectedCategory !== 'ALL') {
        matchesCategory = b.category.toLowerCase().includes(selectedCategory.toLowerCase());
      }

      // Separate physical vs ebook inventory filter
      if (inventoryFilter === 'physical' && b.inventoryType === 'ebook') return false;
      if (inventoryFilter === 'ebook' && b.inventoryType !== 'ebook') return false;

      // Availability filter
      let matchesAvailability = true;
      if (availabilityFilter === 'AVAILABLE') {
        matchesAvailability = b.availableCopies > 0;
      } else if (availabilityFilter === 'LOANED') {
        matchesAvailability = b.availableCopies === 0;
      }

      // Format filter
      let matchesFormat = true;
      if (formatFilter === 'AUDIO') {
        matchesFormat = !!b.hasAudio || !!b.isAudiobook;
      } else if (formatFilter === 'PRINT') {
        matchesFormat = b.inventoryType !== 'ebook' && !b.isAudiobook;
      }

      // Personal activity filter (Learner loans/holds)
      let matchesMyActivity = true;
      if (myActivityFilter === 'LOANS') {
        matchesMyActivity = userLoanMap.has(b.id);
      } else if (myActivityFilter === 'HOLDS') {
        matchesMyActivity = userHoldMap.has(b.id);
      }

      return matchesSearch && matchesCategory && matchesAvailability && matchesFormat && matchesMyActivity;
    }).sort((a, b) => {
      if (activeSort === 'reads') return b.readsCount - a.readsCount;
      if (activeSort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (activeSort === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      if (activeSort === 'callNumber') return (a.deweyCode || '').localeCompare(b.deweyCode || '');
      return a.title.localeCompare(b.title);
    });
  }, [books, searchQuery, selectedCategory, availabilityFilter, formatFilter, myActivityFilter, activeSort, userLoanMap, userHoldMap, inventoryFilter]);

  // Curated collections for Collections view
  const curatedCollections = useMemo(() => {
    return [
      {
        id: 'popular',
        title: 'High-Circulation Titles',
        subtitle: 'Most frequently checked out and reviewed across all grade levels',
        categoryTag: 'POPULAR',
        books: books.filter(b => b.isPopular || b.readsCount > 80),
      },
      {
        id: 'new',
        title: 'Recent Library Accessions',
        subtitle: 'Newly processed volumes and curriculum additions cataloged this term',
        categoryTag: 'ALL',
        books: books.filter(b => b.isNew || ['book-3', 'book-5', 'book-10', 'book-12'].includes(b.id)),
      },
      {
        id: 'teacher',
        title: 'Curriculum & Faculty Recommendations',
        subtitle: 'Prescribed syllabus masterworks and academic faculty reading lists',
        categoryTag: 'CLASSICS',
        books: books.filter(b => b.isTeacherPick || (b.rating || 0) >= 4.8),
      },
      {
        id: 'african',
        title: 'African Literature & Heritage',
        subtitle: 'Foundational African masterworks, post-colonial history, and contemporary voices',
        categoryTag: 'AFRICAN',
        books: books.filter(b => b.category.includes('African') || b.category.includes('History')),
      },
      {
        id: 'stem',
        title: 'Science, Mathematics & Technology',
        subtitle: 'Physical sciences, planetary astronomy, computing concepts, and algorithms',
        categoryTag: 'STEM',
        books: books.filter(b => b.category.includes('STEM') || b.category.includes('Coding') || b.category.includes('Tech')),
      },
      {
        id: 'audio',
        title: 'Audiobooks & Media',
        subtitle: 'Narrated editions and accessible audio accompaniments for active readers',
        categoryTag: 'AUDIOBOOKS',
        books: books.filter(b => b.isAudiobook || b.hasAudio),
      },
      {
        id: 'comics',
        title: 'Graphic Novels & Illustrated Works',
        subtitle: 'Illustrated narrative non-fiction, visual literature, and historical epics',
        categoryTag: 'COMICS',
        books: books.filter(b => b.category.includes('Comics') || b.category.includes('Fiction') || b.category.includes('Adventure')),
      },
    ];
  }, [books]);

  // Force GRID mode if user has typed a search query or set specific secondary filters
  const hasSecondaryFilters = availabilityFilter !== 'ALL' || formatFilter !== 'ALL' || myActivityFilter !== 'ALL';
  const activeMode = (searchQuery.trim().length > 0 || hasSecondaryFilters) ? 'GRID' : catalogViewMode;

  const handleSelectViewAll = (categoryTag: string) => {
    setSelectedCategory(categoryTag);
    setCatalogViewMode('GRID');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setAvailabilityFilter('ALL');
    setFormatFilter('ALL');
    setMyActivityFilter('ALL');
    setActiveSort('reads');
  };

  const handleQuickBorrow = (book: Book) => {
    if (isLearner) {
      showToast('error', 'Learners cannot self-borrow books. Books must be issued by a librarian at the circulation desk. Please place a 24-hour reserve hold instead.');
      return;
    }
    if (book.availableCopies <= 0) {
      showToast('error', 'All physical and digital copies of this title are currently on loan.');
      return;
    }
    const res = checkoutBook(book.id, currentLearnerName, 14);
    if (res.success) {
      showToast('success', `"${book.title}" borrowed successfully. Due in 14 days.`);
    } else {
      showToast('error', res.message);
    }
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookForm.title || !newBookForm.author) return;

    const isEbook = newBookForm.inventoryType === 'ebook';
    const computedPageCount = isEbook && newBookForm.ebookPages?.length ? newBookForm.ebookPages.length : 250;

    addBook({
      title: newBookForm.title,
      author: newBookForm.author,
      isbn: newBookForm.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: newBookForm.category || 'African Literature',
      section: (newBookForm.section as any) || (activeSection === 'primary' ? 'primary' : 'college'),
      totalCopies: isEbook ? 999 : (Number(newBookForm.totalCopies) || 5),
      availableCopies: isEbook ? 999 : (Number(newBookForm.availableCopies) || 5),
      description: newBookForm.description || '',
      summary: newBookForm.description || '',
      coverImage: newBookForm.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
      coverUrl: newBookForm.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
      deweyClass: newBookForm.deweyClass || '800',
      deweyCode: newBookForm.deweyCode || '896.3',
      callNumber: `${newBookForm.deweyCode || '896.3'} ${newBookForm.author.substring(0, 3).toUpperCase()}`,
      ageRange: newBookForm.ageRange || 'Ages 10-18',
      readingLevel: newBookForm.readingLevel || 'Lexile 850L',
      pageCount: computedPageCount,
      hasAudio: !!newBookForm.hasAudio,
      isAudiobook: !!newBookForm.hasAudio,
      isPopular: !!newBookForm.isPopular,
      isNew: true,
      rating: 5.0,
      inventoryType: isEbook ? 'ebook' : 'physical',
      ebookFormat: isEbook ? 'pages' : undefined,
      ebookPages: isEbook ? newBookForm.ebookPages : undefined,
      ebookFileName: isEbook ? newBookForm.ebookFileName : undefined,
      ebookFileSize: isEbook ? newBookForm.ebookFileSize : undefined,
    });

    setIsAddBookModalOpen(false);
    showToast('success', `"${newBookForm.title}" accessioned to ${isEbook ? 'eBook Digital Inventory Space' : 'Physical Library Holdings'}.`);
    setNewBookForm({
      title: '',
      author: '',
      isbn: '',
      category: 'African Literature',
      totalCopies: 5,
      availableCopies: 5,
      description: '',
      coverImage: '',
      deweyClass: '800',
      deweyCode: '896.3',
      inventoryType: 'physical',
      ebookFormat: 'pages',
      ebookPages: undefined,
      ebookFileName: undefined,
      ebookFileSize: undefined,
    });
    setManuscriptPasteText('');
    setShowManuscriptPaste(false);
    setEbookUploadStatus(null);
  };

  const isFilterActive = searchQuery || selectedCategory !== 'ALL' || availabilityFilter !== 'ALL' || formatFilter !== 'ALL' || myActivityFilter !== 'ALL' || inventoryFilter !== 'all';

  const primaryBooksCount = useMemo(() => (allBooks || []).filter(b => b.section === 'primary').length, [allBooks]);
  const collegeBooksCount = useMemo(() => (allBooks || []).filter(b => (b.section || 'college') === 'college').length, [allBooks]);
  const totalBooksCount = (allBooks || []).length;

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6">
      {/* Student / Learner Scoped Collection Banner (Learners can ONLY see their assigned school inventory) */}
      {!isAdmin && !isStaff && isLearner && (currentUser || loggedInLearner) && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50/80 border border-blue-200/70 rounded-2xl text-xs text-blue-950">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="font-bold">
              School Library Catalog
            </span>
            <span className="text-blue-400 hidden sm:inline">•</span>
            <span className="text-blue-700 hidden sm:inline">
              Curated reading resources for {loggedInLearner?.gradeOrYear || currentUser?.gradeOrYear || 'Learner'}
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-blue-800 bg-white px-2 py-0.5 rounded-md border border-blue-200">
            {filteredBooks.length} titles
          </span>
        </div>
      )}

      {/* Guest notice */}
      {!isAdmin && !isStaff && !isLearner && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="font-semibold">Premier International School Catalog Discovery</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Staff sign-in required for combined cross-sectional inventory
          </span>
        </div>
      )}

      {/* Separate Physical & E-Book Inventory Space Spaces Bar */}
      <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setInventoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              inventoryFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overall Catalog ({inventoryMetrics.totalOverallCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryFilter('physical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              inventoryFilter === 'physical'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hard Copies ({inventoryMetrics.totalPhysicalCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setInventoryFilter('ebook')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              inventoryFilter === 'ebook'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Digital eBooks ({inventoryMetrics.totalEbookCount})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2">
          {inventoryFilter === 'all' ? (
            <span>Consolidated Space: <strong>{inventoryMetrics.physicalCopiesTotal}</strong> physical copies + <strong>{inventoryMetrics.totalEbookCount}</strong> eBooks</span>
          ) : inventoryFilter === 'physical' ? (
            <span>Physical Space: <strong>{inventoryMetrics.physicalCopiesAvailable}</strong> available on shelf, <strong>{inventoryMetrics.physicalCopiesOnLoan}</strong> loaned</span>
          ) : (
            <span>eBook Space: <strong>{inventoryMetrics.ebookActiveReaders}</strong> readers • <strong>{inventoryMetrics.ebookCompletedReads}</strong> finished • <strong>{inventoryMetrics.ebookHalfwayReads}</strong> read &gt; 50%</span>
          )}
        </div>
      </div>

      {/* Action Toast */}
      {actionToast && (
        <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm border transition-all ${
          actionToast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionToast.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionToast(null)}
            className="p-1 hover:bg-black/5 rounded-md cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Structured Filter & Control Bar */}
      <section 
        className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs sticky top-20 z-20 space-y-3"
        aria-label="Catalog Filters and Controls"
      >
        {/* Top Control Bar: Category Tabs & View Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Horizontally Scrollable Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none py-0.5" role="tablist" aria-label="Book Categories">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (activeMode === 'CAROUSEL' && cat.id !== 'ALL') {
                    setCatalogViewMode('GRID');
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer select-none ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right Action Controls: View Switcher, Filter Toggle, Admin Add */}
          <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0">
            {/* Filter Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                showAdvancedFilters || hasSecondaryFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              aria-label="Toggle advanced filters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasSecondaryFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setCatalogViewMode('CAROUSEL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'CAROUSEL' 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Curated Collections View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collections</span>
              </button>
              <button
                type="button"
                onClick={() => setCatalogViewMode('GRID')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'GRID' 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Complete Catalog Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Catalog Grid</span>
              </button>
            </div>

            {/* Admin Controls & Supabase Cloud Status */}
            {isAdmin && (
              <div className="flex items-center gap-1.5">
                {isCloudConnected ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await refreshBooks();
                      showToast('success', 'Catalog synced with Supabase database.');
                    }}
                    disabled={isLoadingCloudBooks}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                    title="Sync with Supabase PostgreSQL Database"
                  >
                    <RefreshCw className={`w-3 h-3 text-emerald-600 ${isLoadingCloudBooks ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {cloudSyncStatus === 'synced' ? 'Supabase Synced' : cloudSyncStatus === 'empty' ? 'Supabase (0 Books)' : 'Sync Cloud'}
                    </span>
                  </button>
                ) : (
                  <div 
                    className="px-2.5 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5"
                    title="Local storage mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY on Netlify or .env to enable cloud database."
                  >
                    <Database className="w-3 h-3 text-slate-500" />
                    <span className="hidden sm:inline">Local Mode</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(true)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition"
                  title="Remove default demonstration sample books"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span className="hidden md:inline">Clear Sample Books</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                  title="Batch import catalog books from CSV or spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Import CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Accession Title</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Filter Drawer */}
        {(showAdvancedFilters || hasSecondaryFilters) && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Availability Filter */}
            <div>
              <label htmlFor="filter-availability" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Availability
              </label>
              <select
                id="filter-availability"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="ALL">All Copies</option>
                <option value="AVAILABLE">Available Now</option>
                <option value="LOANED">Currently on Loan</option>
              </select>
            </div>

            {/* Format Filter */}
            <div>
              <label htmlFor="filter-format" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Resource Format
              </label>
              <select
                id="filter-format"
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="ALL">All Formats</option>
                <option value="PRINT">Print Volume</option>
                <option value="AUDIO">Audiobook Narration</option>
              </select>
            </div>

            {/* My Account Filter (if logged in learner) */}
            <div>
              <label htmlFor="filter-activity" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                My Holdings
              </label>
              <select
                id="filter-activity"
                value={myActivityFilter}
                onChange={(e) => setMyActivityFilter(e.target.value as any)}
                disabled={!isLearner}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ALL">All Catalog Holdings</option>
                <option value="LOANS">My Active Loans ({userLoanMap.size})</option>
                <option value="HOLDS">My Active Holds ({userHoldMap.size})</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <label htmlFor="filter-sort" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Sort Order
              </label>
              <select
                id="filter-sort"
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="reads">Most Borrowed</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Accessions</option>
                <option value="title">Title (A–Z)</option>
                <option value="callNumber">Dewey Decimal Code</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Summary Bar */}
        {isFilterActive && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-slate-800">
                Found {filteredBooks.length} record{filteredBooks.length === 1 ? '' : 's'}
              </span>

              {searchQuery && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <span>Keyword: "{searchQuery}"</span>
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== 'ALL' && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <span>Category: {CATEGORY_TABS.find(c => c.id === selectedCategory)?.label || selectedCategory}</span>
                  <button type="button" onClick={() => setSelectedCategory('ALL')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {availabilityFilter !== 'ALL' && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <span>Status: {availabilityFilter === 'AVAILABLE' ? 'Available' : 'On Loan'}</span>
                  <button type="button" onClick={() => setAvailabilityFilter('ALL')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {formatFilter !== 'ALL' && (
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <span>Format: {formatFilter === 'AUDIO' ? 'Audiobook' : 'Print'}</span>
                  <button type="button" onClick={() => setFormatFilter('ALL')} className="hover:text-slate-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {myActivityFilter !== 'ALL' && (
                <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <span>{myActivityFilter === 'LOANS' ? 'My Loans' : 'My Holds'}</span>
                  <button type="button" onClick={() => setMyActivityFilter('ALL')} className="hover:text-indigo-950 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>
          </div>
        )}
      </section>

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div 
          id="catalog-offline-banner" 
          className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 shadow-2xs animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Offline Catalog Active:</strong> Instant search, Dewey Decimal categories, and circulation operate seamlessly from your device's offline cache. Changes are preserved and will automatically sync upon reconnection.
            </span>
          </div>
          {pendingOfflineChangesCount > 0 && (
            <span className="font-bold text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-xl shrink-0 text-[11px]">
              {pendingOfflineChangesCount} pending {pendingOfflineChangesCount === 1 ? 'change' : 'changes'}
            </span>
          )}
        </div>
      )}

      {/* 3A. Collections / Carousel View */}
      {activeMode === 'CAROUSEL' ? (
        books.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-4 my-6">
            <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-slate-200">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                Library Catalog is Ready
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Demonstration sample titles have been cleared. Accession your school library's physical titles or sync from Supabase to populate your collection.
              </p>
            </div>
            {isAdmin && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Accession First Title</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10 py-2">
            {curatedCollections.map((collection) => {
              if (collection.books.length === 0) return null;
              return (
                <SwimlaneRow
                  key={collection.id}
                  title={collection.title}
                  subtitle={collection.subtitle}
                  books={collection.books}
                  userLoanMap={userLoanMap}
                  userHoldMap={userHoldMap}
                  onViewAll={() => handleSelectViewAll(collection.categoryTag)}
                  onBookClick={(book) => setSelectedBook(book)}
                  onBorrow={undefined}
                  onEdit={canEdit ? (book) => setEditingBook(book) : undefined}
                  onDelete={isAdmin ? (book) => setBookToDelete(book) : undefined}
                  isLearner={isLearner}
                />
              );
            })}
          </div>
        )
      ) : (
        /* 3B. Complete Catalog Grid View */
        <section className="space-y-4" aria-label="Catalog Results Grid">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                Catalog Titles
              </h2>
              <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                {filteredBooks.length}
              </span>
            </div>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="quick-sort-select" className="text-xs font-medium text-slate-500 hidden sm:inline">
                Sort by:
              </label>
              <select
                id="quick-sort-select"
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as any)}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="reads">Most Borrowed</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Additions</option>
                <option value="title">Title (A–Z)</option>
                <option value="callNumber">Dewey Decimal Code</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {filteredBooks.map((book) => {
              const loanInfo = userLoanMap.get(book.id);
              const isHeld = userHoldMap.get(book.id);
              return (
                <BookCard
                  key={book.id}
                  book={book}
                  onClick={() => setSelectedBook(book)}
                  onBorrow={undefined}
                  onEdit={canEdit ? (book) => setEditingBook(book) : undefined}
                  onDelete={isAdmin ? (book) => setBookToDelete(book) : undefined}
                  isBorrowable={false}
                  userStatus={{
                    isBorrowed: !!loanInfo?.isBorrowed,
                    dueDate: loanInfo?.dueDate,
                    isHeld: !!isHeld
                  }}
                />
              );
            })}

            {/* Authenticated Empty State */}
            {filteredBooks.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-4">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center border border-slate-200">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                    {books.length === 0 ? 'Library Catalog is Ready' : 'No catalog records found'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {books.length === 0
                      ? "Demonstration sample titles have been cleared. Accession your school library's physical titles or sync from Supabase to populate your collection."
                      : myActivityFilter !== 'ALL'
                        ? myActivityFilter === 'LOANS'
                          ? "You have no active loans matching this search. Browse the catalog to borrow or reserve available titles."
                          : "You have no active holds matching this search. You can place 24-hour holds on available physical copies."
                        : "We couldn't find any resources matching your search criteria or filters. Check your spelling or reset filters to browse the complete collection."}
                  </p>
                </div>
                {books.length === 0 && isAdmin ? (
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsAddBookModalOpen(true)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Accession First Title</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
                    >
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. Book Detail Modal */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailModal 
            book={selectedBook} 
            onClose={() => setSelectedBook(null)} 
          />
        )}
      </AnimatePresence>

      {/* 4B. Edit Pre-existing Book Modal */}
      <AnimatePresence>
        {editingBook && (
          <EditBookModal
            book={editingBook}
            isOpen={!!editingBook}
            onClose={() => setEditingBook(null)}
            onSuccess={(updated) => {
              showToast('success', `"${updated.title}" updated successfully in catalogue.`);
              if (selectedBook && selectedBook.id === updated.id) {
                setSelectedBook(updated);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* 4C. Delete Book from Database Confirmation Modal */}
      <AnimatePresence>
        {bookToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">
                  Delete Book from Database Completely
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-800">"{bookToDelete.title}"</strong> by {bookToDelete.author} from the database? This title will be completely removed from the library catalog, inventory, and database. This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeletingBook}
                  onClick={() => setBookToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingBook}
                  onClick={async () => {
                    setIsDeletingBook(true);
                    const res = await deleteBook(bookToDelete.id);
                    setIsDeletingBook(false);
                    if (res.success) {
                      showToast('success', res.message);
                    } else {
                      showToast('error', res.message);
                    }
                    setBookToDelete(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingBook ? 'Deleting from Database...' : 'Yes, Delete from Database'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Admin Accession New Book Modal */}
      <AnimatePresence>
        {isAddBookModalOpen && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center min-h-screen"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accession-book-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 my-auto max-h-[90vh] flex flex-col"
            >
              {/* Modal Header (Pinned at Top) */}
              <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <BookOpen className="w-4 h-4 text-slate-200" />
                  </div>
                  <div>
                    <h2 id="accession-book-modal-title" className="font-display font-bold text-sm sm:text-base">
                      Accession New Title to Library
                    </h2>
                    <p className="text-[11px] text-slate-300">Catalog new physical or digital materials</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddBookModalOpen(false);
                    setShowCatalogCameraScanner(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Minimalist Barcode & Camera Scanner Bar */}
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 shrink-0">
                <div className="flex items-center gap-2">
                  {/* Mode Icon Toggles: Barcode (Laser POS) & Camera */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                    <button
                      type="button"
                      title="1D Laser Barcode Scanner (POS reader or keyboard input)"
                      onClick={() => {
                        setScannerType('laser');
                        setShowCatalogCameraScanner(false);
                        setTimeout(() => laserInputRef.current?.focus(), 100);
                      }}
                      className={`p-2 rounded-lg transition cursor-pointer ${
                        scannerType === 'laser' && !showCatalogCameraScanner
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Barcode className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      title="Optical Camera Barcode Scanner"
                      onClick={() => {
                        const next = !showCatalogCameraScanner;
                        setShowCatalogCameraScanner(next);
                        if (next) setScannerType('camera');
                        else setScannerType('laser');
                      }}
                      className={`p-2 rounded-lg transition cursor-pointer ${
                        scannerType === 'camera' && showCatalogCameraScanner
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Compact Barcode / ISBN Scan Input */}
                  <div className="relative flex-1">
                    <input
                      ref={laserInputRef}
                      type="text"
                      value={laserScanInput}
                      onChange={(e) => setLaserScanInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (laserScanInput.trim()) {
                            handleExecuteIsbnLookup(laserScanInput);
                          }
                        }
                      }}
                      placeholder="Scan barcode with laser or enter ISBN..."
                      className="w-full pl-8 pr-7 py-2 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs font-mono placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                    />
                    <ScanLine className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {laserScanInput && (
                      <button
                        type="button"
                        onClick={() => setLaserScanInput('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Quick Fetch Button */}
                  <button
                    type="button"
                    disabled={isLookingUpISBN || !laserScanInput.trim()}
                    onClick={() => handleExecuteIsbnLookup(laserScanInput)}
                    title="Pull details from OPAC"
                    className="p-2 sm:px-3 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition shadow-2xs shrink-0"
                  >
                    {isLookingUpISBN ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">Fetch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Camera Scanner when active */}
                <AnimatePresence>
                  {scannerType === 'camera' && showCatalogCameraScanner && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-slate-200"
                    >
                      <CameraBarcodeScanner
                        onScan={async (decoded) => {
                          const clean = decoded.replace(/[^0-9X]/gi, '');
                          if (clean.length === 10 || clean.length === 13) {
                            setShowCatalogCameraScanner(false);
                            setScannerType('laser');
                            handleExecuteIsbnLookup(clean);
                          } else {
                            setNewBookForm(prev => ({ ...prev, isbn: decoded }));
                            showToast('success', `Scanned Barcode: ${decoded}`);
                            setShowCatalogCameraScanner(false);
                            setScannerType('laser');
                          }
                        }}
                        onClose={() => {
                          setShowCatalogCameraScanner(false);
                          setScannerType('laser');
                        }}
                        title="Camera Scanner"
                        subtitle="Point camera at barcode on book"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Minimalist OPAC Record Loaded Notification */}
                {lastFetchedBook && (
                  <div className="mt-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Auto-filled <strong>"{lastFetchedBook.title}"</strong> via {lastFetchedBook.source}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLastFetchedBook(null)}
                      className="text-emerald-600 hover:text-emerald-900 shrink-0 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Form Content (Scrollable) */}
              <form onSubmit={handleCreateBook} className="flex-1 overflow-y-auto flex flex-col">
                <div className="p-5 space-y-3.5 flex-1">
                  <div>
                    <label htmlFor="new-book-title" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Book Title *
                    </label>
                    <input
                      id="new-book-title"
                      type="text"
                      required
                      value={newBookForm.title}
                      onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                      placeholder="e.g. Arrow of God"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-book-author" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Author *
                    </label>
                    <input
                      id="new-book-author"
                      type="text"
                      required
                      value={newBookForm.author}
                      onChange={(e) => setNewBookForm({ ...newBookForm, author: e.target.value })}
                      placeholder="e.g. Chinua Achebe"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                    />
                  </div>

                  {/* Book Inventory Format: Hard Copy (Physical) vs eBook (Digital) */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      Book Format & Inventory Space *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewBookForm(prev => ({ ...prev, inventoryType: 'physical' }))}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          newBookForm.inventoryType !== 'ebook'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Hard Copy (Physical)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewBookForm(prev => ({ ...prev, inventoryType: 'ebook', ebookFormat: 'pages' }))}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                          newBookForm.inventoryType === 'ebook'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Digital eBook</span>
                      </button>
                    </div>

                    {newBookForm.inventoryType === 'ebook' && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
                            <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                            <span>Upload eBook Manuscript</span>
                          </span>
                          {newBookForm.ebookPages?.length ? (
                            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                              {newBookForm.ebookPages.length} Pages Parsed
                            </span>
                          ) : null}
                        </div>

                        {/* File upload input */}
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer">
                            <div className="border border-dashed border-purple-300 bg-purple-50/50 hover:bg-purple-100/60 rounded-xl p-3 text-center transition flex flex-col items-center justify-center gap-1">
                              <UploadCloud className="w-5 h-5 text-purple-600" />
                              <span className="text-xs font-bold text-purple-900">
                                {newBookForm.ebookFileName ? `File: ${newBookForm.ebookFileName}` : 'Click to Upload Manuscript (.txt, .json, .md)'}
                              </span>
                              <span className="text-[10px] text-purple-700">
                                {newBookForm.ebookFileSize ? `Size: ${newBookForm.ebookFileSize}` : 'Will be paginated for page-by-page digital student reading'}
                              </span>
                            </div>
                            <input
                              type="file"
                              accept=".txt,.json,.md"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const fileName = file.name;
                                const fileSize = `${Math.round(file.size / 1024) || 1} KB`;
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const text = event.target?.result as string;
                                  if (file.name.endsWith('.json')) {
                                    try {
                                      const parsed = JSON.parse(text);
                                      const list = Array.isArray(parsed) ? parsed : (parsed.pages || []);
                                      if (list.length > 0) {
                                        setNewBookForm(prev => ({
                                          ...prev,
                                          inventoryType: 'ebook',
                                          ebookPages: list,
                                          ebookFileName: fileName,
                                          ebookFileSize: fileSize,
                                          pageCount: list.length,
                                        }));
                                        setEbookUploadStatus(`Successfully parsed ${list.length} pages from ${fileName}`);
                                        return;
                                      }
                                    } catch {}
                                  }
                                  const pages = parseRawTextToPages(text, newBookForm.title);
                                  setNewBookForm(prev => ({
                                    ...prev,
                                    inventoryType: 'ebook',
                                    ebookPages: pages,
                                    ebookFileName: fileName,
                                    ebookFileSize: fileSize,
                                    pageCount: pages.length,
                                  }));
                                  setEbookUploadStatus(`Converted "${fileName}" into ${pages.length} readable pages`);
                                };
                                reader.readAsText(file);
                              }}
                            />
                          </label>
                        </div>

                        {/* Or Paste text button */}
                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => setShowManuscriptPaste(!showManuscriptPaste)}
                            className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{showManuscriptPaste ? 'Hide Text Paste' : 'Or Paste Book Text Directly'}</span>
                          </button>

                          {newBookForm.ebookPages?.length ? (
                            <button
                              type="button"
                              onClick={() => {
                                setNewBookForm(prev => ({
                                  ...prev,
                                  ebookPages: undefined,
                                  ebookFileName: undefined,
                                  ebookFileSize: undefined
                                }));
                                setEbookUploadStatus(null);
                              }}
                              className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                            >
                              Clear Pages
                            </button>
                          ) : null}
                        </div>

                        {showManuscriptPaste && (
                          <div className="space-y-2 pt-1">
                            <textarea
                              rows={4}
                              value={manuscriptPasteText}
                              onChange={(e) => setManuscriptPasteText(e.target.value)}
                              placeholder="Paste book chapters or complete text here..."
                              className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!manuscriptPasteText.trim()) return;
                                const pages = parseRawTextToPages(manuscriptPasteText, newBookForm.title);
                                setNewBookForm(prev => ({
                                  ...prev,
                                  inventoryType: 'ebook',
                                  ebookPages: pages,
                                  ebookFileName: 'pasted-manuscript.txt',
                                  ebookFileSize: `${Math.round(manuscriptPasteText.length / 1024) || 1} KB`,
                                  pageCount: pages.length,
                                }));
                                setEbookUploadStatus(`Converted into ${pages.length} readable pages!`);
                              }}
                              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Convert to Pages ({parseRawTextToPages(manuscriptPasteText, newBookForm.title).length} pages)
                            </button>
                          </div>
                        )}

                        {ebookUploadStatus && (
                          <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{ebookUploadStatus}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-book-category" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Subject Category
                      </label>
                      <select
                        id="new-book-category"
                        value={newBookForm.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewBookForm({ 
                            ...newBookForm, 
                            category: val,
                            isPopular: val === 'Popular' ? true : newBookForm.isPopular,
                            hasAudio: val === 'Audiobooks & Read-Aloud' ? true : newBookForm.hasAudio
                          });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                      >
                        {BOOK_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="new-book-copies" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Total Copies
                      </label>
                      <input
                        id="new-book-copies"
                        type="number"
                        min="1"
                        value={newBookForm.totalCopies}
                        onChange={(e) => setNewBookForm({ 
                          ...newBookForm, 
                          totalCopies: Number(e.target.value),
                          availableCopies: Number(e.target.value)
                        })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-book-dewey" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Dewey Decimal Code
                      </label>
                      <input
                        id="new-book-dewey"
                        type="text"
                        value={newBookForm.deweyCode}
                        onChange={(e) => setNewBookForm({ ...newBookForm, deweyCode: e.target.value })}
                        placeholder="e.g. 896.3"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label htmlFor="new-book-isbn" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                          ISBN
                        </label>
                        {newBookForm.isbn && (
                          <button
                            type="button"
                            disabled={isLookingUpISBN}
                            onClick={() => {
                              if (newBookForm.isbn) {
                                handleExecuteIsbnLookup(newBookForm.isbn);
                              }
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition"
                            title="Auto-fill from OPAC"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{isLookingUpISBN ? 'Fetching...' : 'Lookup OPAC'}</span>
                          </button>
                        )}
                      </div>
                      <input
                        id="new-book-isbn"
                        type="text"
                        value={newBookForm.isbn}
                        onChange={(e) => setNewBookForm({ ...newBookForm, isbn: e.target.value })}
                        placeholder="e.g. 978-0385474542"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new-book-desc" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Synopsis / Summary
                    </label>
                    <textarea
                      id="new-book-desc"
                      rows={2}
                      value={newBookForm.description}
                      onChange={(e) => setNewBookForm({ ...newBookForm, description: e.target.value })}
                      placeholder="Short summary of the book content..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-book-cover" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Cover Image URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="new-book-cover"
                        type="url"
                        value={newBookForm.coverImage}
                        onChange={(e) => setNewBookForm({ ...newBookForm, coverImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition shadow-2xs"
                      />
                      {newBookForm.coverImage && (
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-2xs">
                          <img 
                            src={newBookForm.coverImage} 
                            alt="Cover preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 text-xs font-medium select-none">
                      <input
                        type="checkbox"
                        checked={newBookForm.hasAudio}
                        onChange={(e) => setNewBookForm({ ...newBookForm, hasAudio: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Audiobook Available</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 text-xs font-medium select-none">
                      <input
                        type="checkbox"
                        checked={newBookForm.isPopular}
                        onChange={(e) => setNewBookForm({ ...newBookForm, isPopular: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Curriculum Essential</span>
                    </label>
                  </div>
                </div>

                {/* Pinned Modal Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddBookModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl cursor-pointer transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs cursor-pointer transition text-xs flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Title to Catalog</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Clearing Sample Books */}
      <AnimatePresence>
        {isClearConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Clear Generic Sample Titles?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    This removes the default demonstration books from your catalog view. Any books you add or sync from your Supabase PostgreSQL database will remain active.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearSampleBooks();
                    setIsClearConfirmOpen(false);
                    showToast('success', 'Default sample books cleared.');
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition"
                >
                  Yes, Clear Sample Books
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Batch Import Modal for Books */}
      {isImportModalOpen && (
        <CsvBatchImport
          isModal={true}
          initialTab="catalog"
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={() => {
            showToast('success', 'Catalog batch import completed successfully!');
          }}
        />
      )}
    </main>
  );
};

/* --------------------------------------------------------------------------
 * Sub-Component: Horizontal Curated Collection Swimlane
 * -------------------------------------------------------------------------- */
interface SwimlaneRowProps {
  title: string;
  subtitle?: string;
  books: Book[];
  userLoanMap: Map<string, { isBorrowed: boolean; dueDate: string }>;
  userHoldMap: Map<string, boolean>;
  onViewAll: () => void;
  onBookClick: (book: Book) => void;
  onBorrow?: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
  isLearner?: boolean;
}

const SwimlaneRow: React.FC<SwimlaneRowProps> = ({
  title,
  subtitle,
  books,
  userLoanMap,
  userHoldMap,
  onViewAll,
  onBookClick,
  onBorrow,
  onEdit,
  onDelete,
  isLearner,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="space-y-3" aria-label={title}>
      {/* Swimlane Header */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-display">
              {title}
            </h2>
            <span className="text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {books.length}
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Navigation Arrows */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap"
          >
            View in Grid →
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Lane */}
      <div 
        ref={scrollRef}
        tabIndex={0}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-2xl"
        role="region"
        aria-label={`${title} collection carousel`}
      >
        {books.map((book) => {
          const loanInfo = userLoanMap.get(book.id);
          const isHeld = userHoldMap.get(book.id);
          return (
            <div 
              key={book.id} 
              className="w-40 sm:w-48 flex-shrink-0 snap-start"
            >
              <BookCard 
                book={book} 
                onClick={() => onBookClick(book)}
                onBorrow={undefined}
                onEdit={onEdit}
                onDelete={onDelete}
                isBorrowable={false}
                userStatus={{
                  isBorrowed: !!loanInfo?.isBorrowed,
                  dueDate: loanInfo?.dueDate,
                  isHeld: !!isHeld
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
