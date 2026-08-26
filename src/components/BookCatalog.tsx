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
  Sparkles, 
  Plus, 
  Check, 
  SlidersHorizontal,
  Flame,
  Headphones,
  GraduationCap,
  Rocket,
  Globe,
  Smile,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CATEGORY_PILLS = [
  { id: 'ALL', label: 'All Books' },
  { id: 'POPULAR', label: '⭐ Popular' },
  { id: 'AUDIOBOOKS', label: '🎧 Audiobooks' },
  { id: 'COMICS', label: '🎨 Comics & Humor' },
  { id: 'STEM', label: '🔬 STEM & Space' },
  { id: 'AFRICAN', label: '🌍 African Heritage' },
  { id: 'CLASSICS', label: '📚 Classics' },
  { id: 'CODING', label: '💻 Coding & Tech' },
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
    addBook
  } = useApp();

  // Local filter controls
  const [activeSort, setActiveSort] = useState<'reads' | 'title' | 'rating' | 'newest'>('reads');
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

  // Filter books based on search query and category
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.deweyCode && b.deweyCode.includes(q))
      );

      let matchesCategory = true;
      if (selectedCategory === 'POPULAR') {
        matchesCategory = !!b.isPopular || b.readsCount > 80;
      } else if (selectedCategory === 'AUDIOBOOKS') {
        matchesCategory = !!b.isAudiobook || !!b.hasAudio;
      } else if (selectedCategory === 'COMICS') {
        matchesCategory = b.category.toLowerCase().includes('comic') || b.category.toLowerCase().includes('fiction');
      } else if (selectedCategory === 'STEM') {
        matchesCategory = b.category.toLowerCase().includes('stem') || b.category.toLowerCase().includes('space') || b.category.toLowerCase().includes('tech') || b.category.toLowerCase().includes('coding');
      } else if (selectedCategory === 'AFRICAN') {
        matchesCategory = b.category.toLowerCase().includes('african') || b.category.toLowerCase().includes('history');
      } else if (selectedCategory === 'CLASSICS') {
        matchesCategory = b.category.toLowerCase().includes('classic') || b.category.toLowerCase().includes('philosophy');
      } else if (selectedCategory === 'CODING') {
        matchesCategory = b.category.toLowerCase().includes('coding') || b.category.toLowerCase().includes('tech');
      } else if (selectedCategory !== 'ALL') {
        matchesCategory = b.category.toLowerCase().includes(selectedCategory.toLowerCase());
      }

      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      if (activeSort === 'reads') return b.readsCount - a.readsCount;
      if (activeSort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (activeSort === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      return a.title.localeCompare(b.title);
    });
  }, [books, searchQuery, selectedCategory, activeSort]);

  // Swimlane datasets for Netflix-style discovery rows
  const swimlanes = useMemo(() => {
    return [
      {
        id: 'popular',
        title: '🔥 Popular Right Now',
        subtitle: 'Most checked-out and highest-rated by scholars this month',
        categoryTag: 'POPULAR',
        books: books.filter(b => b.isPopular || b.readsCount > 80),
      },
      {
        id: 'new',
        title: '✨ New Arrivals & Fresh Additions',
        subtitle: 'Recently accessioned physical and digital volumes',
        categoryTag: 'ALL',
        books: books.filter(b => b.isNew || ['book-3', 'book-5', 'book-10', 'book-12'].includes(b.id)),
      },
      {
        id: 'audio',
        title: '🎧 Audiobooks & Read-To-Me',
        subtitle: 'Narrated editions with immersive voice track previews',
        categoryTag: 'AUDIOBOOKS',
        books: books.filter(b => b.isAudiobook || b.hasAudio),
      },
      {
        id: 'teacher',
        title: '🏫 Teacher Recommendations',
        subtitle: 'Handpicked syllabus classics and faculty favorites',
        categoryTag: 'CLASSICS',
        books: books.filter(b => b.isTeacherPick || (b.rating || 0) >= 4.8),
      },
      {
        id: 'stem',
        title: '🔬 Science, STEM & Cosmos',
        subtitle: 'Physics, astronomy, robotics and modern algorithm engineering',
        categoryTag: 'STEM',
        books: books.filter(b => b.category.includes('STEM') || b.category.includes('Coding') || b.category.includes('Tech')),
      },
      {
        id: 'african',
        title: '🌍 African Voices & Heritage',
        subtitle: 'Pivotal African literature, history, and cultural masterworks',
        categoryTag: 'AFRICAN',
        books: books.filter(b => b.category.includes('African') || b.category.includes('History')),
      },
      {
        id: 'comics',
        title: '🎨 Comics, Graphic Novels & Humor',
        subtitle: 'Illustrated graphic novels, lighthearted humor and epic quests',
        categoryTag: 'COMICS',
        books: books.filter(b => b.category.includes('Comics') || b.category.includes('Fiction') || b.category.includes('Adventure')),
      },
    ];
  }, [books]);

  // Force GRID mode if user has typed a search query
  const activeMode = searchQuery.trim().length > 0 ? 'GRID' : catalogViewMode;

  const handleSelectViewAll = (categoryTag: string) => {
    setSelectedCategory(categoryTag);
    setCatalogViewMode('GRID');
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

  return (
    <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6">
      
      {/* Layer 1: Admin Editable Hero Spotlight Banner */}
      {!searchQuery && <HeroSpotlight />}

      {/* Layer 2: Sticky Filter Bar & View Switcher Toggle */}
      <section className="bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-3xl border border-slate-200/90 shadow-sm sticky top-20 z-30 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left Side: Horizontally Scrollable Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none py-0.5">
            {CATEGORY_PILLS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (activeMode === 'CAROUSEL' && cat.id !== 'ALL') {
                    setCatalogViewMode('GRID');
                  }
                }}
                className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer select-none flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-102'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Right Side: View Mode Switcher + Add Book if Admin */}
          <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
            {/* View Switcher Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80">
              <button
                type="button"
                onClick={() => setCatalogViewMode('CAROUSEL')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'CAROUSEL' 
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to horizontal discovery swimlanes"
              >
                <span>🎡 Carousels</span>
              </button>
              <button
                type="button"
                onClick={() => setCatalogViewMode('GRID')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  activeMode === 'GRID' 
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-black/5' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to full responsive catalog grid"
              >
                <span>🔲 Full Grid</span>
              </button>
            </div>

            {/* Admin Add New Book Button */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAddBookModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Book</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Search & Filter Metadata Indicator */}
        {(searchQuery || selectedCategory !== 'ALL') && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                Found {filteredBooks.length} book{filteredBooks.length === 1 ? '' : 's'}
              </span>
              {searchQuery && (
                <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                  Keyword: "{searchQuery}"
                </span>
              )}
              {selectedCategory !== 'ALL' && (
                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                  Category: {selectedCategory}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </section>

      {/* Layer 3A: Carousel Mode ("Netflix for Digital Books") */}
      {activeMode === 'CAROUSEL' ? (
        <div className="space-y-10 py-2">
          {swimlanes.map((lane) => {
            if (lane.books.length === 0) return null;
            return (
              <SwimlaneRow
                key={lane.id}
                title={lane.title}
                subtitle={lane.subtitle}
                books={lane.books}
                onViewAll={() => handleSelectViewAll(lane.categoryTag)}
                onBookClick={(book) => setSelectedBook(book)}
              />
            );
          })}
        </div>
      ) : (
        /* Layer 3B: Full Grid Search Mode */
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Catalog Catalog Grid</span>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                {filteredBooks.length} Titles
              </span>
            </h2>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="catalog-sort" className="text-xs font-bold text-slate-500 hidden sm:inline">
                Sort by:
              </label>
              <select
                id="catalog-sort"
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as any)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="reads">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Additions</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => setSelectedBook(book)}
              />
            ))}

            {/* Empty State */}
            {filteredBooks.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 space-y-4">
                <div className="p-4 bg-slate-100 text-slate-400 rounded-full w-14 h-14 mx-auto flex items-center justify-center">
                  <Layers className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-slate-900 text-base">
                    No books matched your criteria
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try checking for spelling, exploring our curated carousels, or resetting your filter selections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold cursor-pointer transition shadow-md"
                >
                  Show All Books
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Layer 4: Global Book Detail Drawer / Modal */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailModal 
            book={selectedBook} 
            onClose={() => setSelectedBook(null)} 
          />
        )}
      </AnimatePresence>

      {/* Admin Add New Book Modal */}
      <AnimatePresence>
        {isAddBookModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-book-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Plus className="w-4 h-4 text-blue-300" />
                  </div>
                  <div>
                    <h2 id="add-book-modal-title" className="font-display font-black text-base">
                      Accession New Book to Library
                    </h2>
                    <p className="text-xs text-slate-300">Add physical & digital resources to the school catalog</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close add book modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateBook} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label htmlFor="new-book-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Book Title *
                  </label>
                  <input
                    id="new-book-title"
                    type="text"
                    required
                    value={newBookForm.title}
                    onChange={(e) => setNewBookForm({ ...newBookForm, title: e.target.value })}
                    placeholder="e.g. Arrow of God"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="new-book-author" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Author *
                  </label>
                  <input
                    id="new-book-author"
                    type="text"
                    required
                    value={newBookForm.author}
                    onChange={(e) => setNewBookForm({ ...newBookForm, author: e.target.value })}
                    placeholder="e.g. Chinua Achebe"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="new-book-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      id="new-book-category"
                      value={newBookForm.category}
                      onChange={(e) => setNewBookForm({ ...newBookForm, category: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="African Literature">African Literature</option>
                      <option value="Classics">Classics</option>
                      <option value="Fantasy & Adventure">Fantasy & Adventure</option>
                      <option value="Children's Fiction">Children's Fiction</option>
                      <option value="Comics & Humor">Comics & Humor</option>
                      <option value="STEM & Space">STEM & Space</option>
                      <option value="Coding & Tech">Coding & Tech</option>
                      <option value="Philosophy & Ethics">Philosophy & Ethics</option>
                      <option value="History & Culture">History & Culture</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="new-book-copies" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new-book-desc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Synopsis / Summary
                  </label>
                  <textarea
                    id="new-book-desc"
                    rows={3}
                    value={newBookForm.description}
                    onChange={(e) => setNewBookForm({ ...newBookForm, description: e.target.value })}
                    placeholder="Short description of the book..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="new-book-cover" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cover Image URL
                  </label>
                  <input
                    id="new-book-cover"
                    type="url"
                    value={newBookForm.coverImage}
                    onChange={(e) => setNewBookForm({ ...newBookForm, coverImage: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newBookForm.hasAudio}
                      onChange={(e) => setNewBookForm({ ...newBookForm, hasAudio: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Has Audiobook Narration</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newBookForm.isPopular}
                      onChange={(e) => setNewBookForm({ ...newBookForm, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Mark as Top Pick</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBookModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-md cursor-pointer transition"
                  >
                    Accession Book
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
 * Sub-Component: Horizontal Discovery Swimlane ("Netflix for Digital Books")
 * -------------------------------------------------------------------------- */
interface SwimlaneRowProps {
  title: string;
  subtitle?: string;
  books: Book[];
  onViewAll: () => void;
  onBookClick: (book: Book) => void;
}

const SwimlaneRow: React.FC<SwimlaneRowProps> = ({
  title,
  subtitle,
  books,
  onViewAll,
  onBookClick,
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
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-display">
              {title}
            </h2>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
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
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer active:scale-95"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1 rounded-md transition cursor-pointer whitespace-nowrap"
          >
            View All →
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Lane */}
      <div 
        ref={scrollRef}
        tabIndex={0}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory focus:outline-none focus:ring-1 focus:ring-blue-400 rounded-2xl"
        role="region"
        aria-label={`${title} book carousel`}
      >
        {books.map((book) => (
          <div 
            key={book.id} 
            className="w-40 sm:w-48 flex-shrink-0 snap-start"
          >
            <BookCard 
              book={book} 
              onClick={() => onBookClick(book)} 
            />
          </div>
        ))}
      </div>
    </section>
  );
};
