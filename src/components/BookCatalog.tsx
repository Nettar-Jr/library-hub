/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { BookCard } from './BookCard';
import { HeroSpotlight } from './HeroSpotlight';
import { BookDetailModal } from './BookDetailModal';
import { Book } from '../types';
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
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    currentUser,
    loggedInLearner,
    circulation,
    holds,
    currentLearnerName,
    checkoutBook
  } = useApp();

  // Local filter controls
  const [activeSort, setActiveSort] = useState<'reads' | 'title' | 'rating' | 'newest' | 'callNumber'>('reads');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'LOANED'>('ALL');
  const [formatFilter, setFormatFilter] = useState<'ALL' | 'PRINT' | 'AUDIO'>('ALL');
  const [myActivityFilter, setMyActivityFilter] = useState<'ALL' | 'LOANS' | 'HOLDS'>('ALL');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [actionToast, setActionToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookForm, setNewBookForm] = useState<Partial<Book>>({
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
    ageRange: 'Ages 10-18',
    readingLevel: 'Lexile 800L',
    hasAudio: false,
    isPopular: false,
    isNew: true,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setActionToast({ type, message });
    setTimeout(() => setActionToast(null), 3500);
  };

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
        matchesFormat = !b.isAudiobook;
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
  }, [books, searchQuery, selectedCategory, availabilityFilter, formatFilter, myActivityFilter, activeSort, userLoanMap, userHoldMap]);

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

    addBook({
      title: newBookForm.title,
      author: newBookForm.author,
      isbn: newBookForm.isbn || `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      category: newBookForm.category || 'African Literature',
      totalCopies: Number(newBookForm.totalCopies) || 5,
      availableCopies: Number(newBookForm.availableCopies) || 5,
      description: newBookForm.description || '',
      summary: newBookForm.description || '',
      coverImage: newBookForm.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
      coverUrl: newBookForm.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
      deweyClass: newBookForm.deweyClass || '800',
      deweyCode: newBookForm.deweyCode || '896.3',
      callNumber: `${newBookForm.deweyCode || '896.3'} ${newBookForm.author.substring(0, 3).toUpperCase()}`,
      ageRange: newBookForm.ageRange || 'Ages 10-18',
      readingLevel: newBookForm.readingLevel || 'Lexile 850L',
      pageCount: 250,
      hasAudio: !!newBookForm.hasAudio,
      isAudiobook: !!newBookForm.hasAudio,
      isPopular: !!newBookForm.isPopular,
      isNew: true,
      rating: 5.0,
    });

    setIsAddBookModalOpen(false);
    showToast('success', `"${newBookForm.title}" accessioned to catalog.`);
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
    });
  };

  const isLearner = currentRole === 'LEARNER' || currentRole === 'learner' || currentRole === 'student' || !!loggedInLearner;
  const isFilterActive = searchQuery || selectedCategory !== 'ALL' || availabilityFilter !== 'ALL' || formatFilter !== 'ALL' || myActivityFilter !== 'ALL';

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6">
      
      {/* 1. Curated Hero Spotlight (shown in default collection view when no active search) */}
      {!searchQuery && !hasSecondaryFilters && <HeroSpotlight />}

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

            {/* Admin Add Title Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Accession Title</span>
              </button>
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

      {/* 3A. Collections / Carousel View */}
      {activeMode === 'CAROUSEL' ? (
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
                onBorrow={isLearner ? handleQuickBorrow : undefined}
                isLearner={isLearner}
              />
            );
          })}
        </div>
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
                  onBorrow={isLearner ? () => handleQuickBorrow(book) : undefined}
                  isBorrowable={isLearner}
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
                    No catalog records found
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {myActivityFilter !== 'ALL'
                      ? myActivityFilter === 'LOANS'
                        ? "You have no active loans matching this search. Browse the catalog to borrow or reserve available titles."
                        : "You have no active holds matching this search. You can place 24-hour holds on available physical copies."
                      : "We couldn't find any resources matching your search criteria or filters. Check your spelling or reset filters to browse the complete collection."}
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
                  >
                    Reset All Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetFilters();
                      setCatalogViewMode('CAROUSEL');
                    }}
                    className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition"
                  >
                    View Curated Collections
                  </button>
                </div>
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

      {/* 5. Admin Accession New Book Modal */}
      <AnimatePresence>
        {isAddBookModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accession-book-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <BookOpen className="w-4 h-4 text-slate-200" />
                  </div>
                  <div>
                    <h2 id="accession-book-modal-title" className="font-display font-bold text-sm sm:text-base">
                      Accession New Title to Library
                    </h2>
                    <p className="text-xs text-slate-300">Record new physical or digital materials in the school catalog</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleCreateBook} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="new-book-category" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Subject Category
                    </label>
                    <select
                      id="new-book-category"
                      value={newBookForm.category}
                      onChange={(e) => setNewBookForm({ ...newBookForm, category: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="African Literature">African Literature</option>
                      <option value="Classics">Classics</option>
                      <option value="Fantasy & Adventure">Fantasy & Adventure</option>
                      <option value="Children's Fiction">Children's Fiction</option>
                      <option value="Comics & Graphic Novels">Comics & Graphic Novels</option>
                      <option value="STEM & Space">STEM & Space</option>
                      <option value="Coding & Tech">Coding & Tech</option>
                      <option value="Philosophy & Ethics">Philosophy & Ethics</option>
                      <option value="History & Culture">History & Culture</option>
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
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="new-book-isbn" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      ISBN
                    </label>
                    <input
                      id="new-book-isbn"
                      type="text"
                      value={newBookForm.isbn}
                      onChange={(e) => setNewBookForm({ ...newBookForm, isbn: e.target.value })}
                      placeholder="e.g. 978-0385474542"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new-book-desc" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Synopsis / Summary
                  </label>
                  <textarea
                    id="new-book-desc"
                    rows={3}
                    value={newBookForm.description}
                    onChange={(e) => setNewBookForm({ ...newBookForm, description: e.target.value })}
                    placeholder="Short summary of the book content..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                <div>
                  <label htmlFor="new-book-cover" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cover Image URL
                  </label>
                  <input
                    id="new-book-cover"
                    type="url"
                    value={newBookForm.coverImage}
                    onChange={(e) => setNewBookForm({ ...newBookForm, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={newBookForm.hasAudio}
                      onChange={(e) => setNewBookForm({ ...newBookForm, hasAudio: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500"
                    />
                    <span>Audiobook Format Available</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={newBookForm.isPopular}
                      onChange={(e) => setNewBookForm({ ...newBookForm, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500"
                    />
                    <span>Curriculum Essential</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBookModalOpen(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-xs cursor-pointer transition"
                  >
                    Save Title to Catalog
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                onBorrow={isLearner && onBorrow ? () => onBorrow(book) : undefined}
                isBorrowable={isLearner}
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
