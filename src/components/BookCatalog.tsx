/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { BookCard } from './BookCard';
import { triggerBorrowCelebration } from '../utils/confetti';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { 
  Search, 
  Info, 
  Check, 
  X, 
  Bookmark, 
  Plus, 
  Layers, 
  User as UserIcon, 
  QrCode, 
  BookmarkCheck, 
  TrendingUp, 
  Star, 
  Lock, 
  Clock, 
  ShieldAlert, 
  Image as ImageIcon, 
  Sparkles,
  BookOpen,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Flame,
  Rocket,
  Globe,
  Smile,
  LayoutGrid,
  Rows,
  Volume2,
  Play,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const BookCatalog: React.FC = () => {
  const { 
    books, 
    addBook, 
    currentRole, 
    currentLearnerName, 
    checkoutBook,
    users,
    holds,
    createHold,
    releaseHold,
    addBookReview
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL synced search & filter states
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('cat') || 'All';
  const viewModeParam = searchParams.get('view') || 'rows'; // 'rows' or 'grid'

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [viewMode, setViewMode] = useState<'rows' | 'grid'>(viewModeParam === 'grid' ? 'grid' : 'rows');
  
  // Sync state changes back to URL Search Params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm.trim()) params.q = searchTerm.trim();
    if (selectedCategory && selectedCategory !== 'All') params.cat = selectedCategory;
    if (viewMode === 'grid') params.view = 'grid';
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, viewMode, setSearchParams]);

  // Dialog / Form States
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);

  // Focus trap for book detail modal
  const modalRef = useFocusTrap(Boolean(selectedBook), () => {
    setSelectedBook(null);
    setIsPlayingAudioPreview(false);
  });
  
  // New Book Form States
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCategory, setNewCategory] = useState('African Literature');
  const [newCopies, setNewCopies] = useState(5);
  const [newDesc, setNewDesc] = useState('');
  const [newDeweyClass, setNewDeweyClass] = useState('800');
  const [newDeweyCode, setNewDeweyCode] = useState('813');
  const [newCoverImage, setNewCoverImage] = useState('');

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Star review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAuthor.trim() || !newIsbn.trim()) return;
    
    addBook({
      title: newTitle.trim(),
      author: newAuthor.trim(),
      isbn: newIsbn.trim(),
      category: newCategory,
      totalCopies: newCopies,
      availableCopies: newCopies,
      description: newDesc || 'No description available.',
      coverImage: newCoverImage.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
      deweyClass: newDeweyClass,
      deweyCode: newDeweyCode.trim() || newDeweyClass,
      hasAudio: true,
      rating: 5.0,
      readsCount: 0
    });

    triggerNotification('success', `"${newTitle}" successfully cataloged into inventory!`);
    
    // Reset
    setNewTitle('');
    setNewAuthor('');
    setNewIsbn('');
    setNewDesc('');
    setNewCoverImage('');
    setNewCopies(5);
    setNewDeweyClass('800');
    setNewDeweyCode('813');
    setShowAddForm(false);
  };

  const handleSelfBorrow = (book: Book) => {
    const res = checkoutBook(book.id, currentLearnerName);
    if (res.success) {
      triggerBorrowCelebration();
      triggerNotification('success', `🎉 Borrowed "${book.title}"! Due in 14 days.`);
      // Update the current selected book details overlay if open
      setSelectedBook(prev => prev && prev.id === book.id ? { ...prev, availableCopies: prev.availableCopies - 1, readsCount: prev.readsCount + 1 } : prev);
    } else {
      triggerNotification('error', res.message);
    }
  };

  // Category Pills definition (GetEpic Model)
  const categoryPills = [
    { id: 'All', label: 'All Books', icon: Sparkles },
    { id: 'African Literature', label: 'African Heritage', icon: Globe },
    { id: 'STEM & Space', label: 'STEM & Science', icon: Rocket },
    { id: 'Fantasy & Adventure', label: 'Fantasy & Magic', icon: Flame },
    { id: 'Comics & Humor', label: 'Comics & Humor', icon: Smile },
    { id: 'Classics', label: 'Classics', icon: BookOpen },
    { id: 'Coding & Tech', label: 'Coding & Tech', icon: Sparkles },
    { id: 'Read-To-Me', label: 'Audio & Read-Aloud', icon: Headphones },
  ];

  // Filtered books for single category or search
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm) ||
      book.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Read-To-Me') {
        matchesCategory = Boolean(book.hasAudio || book.readsCount > 80);
      } else {
        matchesCategory = book.category.toLowerCase().includes(selectedCategory.toLowerCase().split(' ')[0]);
      }
    }

    return matchesSearch && matchesCategory;
  });

  // Discovery Row Helper Groups
  const popularBooks = [...books].sort((a, b) => (b.readsCount || 0) - (a.readsCount || 0));
  const audioBooks = books.filter(b => b.hasAudio || b.readsCount > 70);
  const stemBooks = books.filter(b => b.category.includes('STEM') || b.category.includes('Science') || b.category.includes('Coding'));
  const africanBooks = books.filter(b => b.category.includes('African') || b.category.includes('History'));
  const comicsBooks = books.filter(b => b.category.includes('Comics') || b.category.includes('Humor') || b.category.includes('Children'));
  const classicsBooks = books.filter(b => b.category.includes('Classics') || b.category.includes('Philosophy') || b.category.includes('Literature'));

  // Horizontal Carousel Component
  const DiscoveryRow = ({ 
    title, 
    subtitle, 
    icon: Icon, 
    items, 
    accentColor = 'text-blue-600',
    bgColor = 'from-blue-500 to-indigo-600'
  }: { 
    title: string; 
    subtitle?: string; 
    icon: any; 
    items: Book[]; 
    accentColor?: string;
    bgColor?: string;
  }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
      if (rowRef.current) {
        const scrollAmount = direction === 'left' ? -380 : 380;
        rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    if (items.length === 0) return null;

    return (
      <section className="space-y-3 relative group/row">
        {/* Row Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-gradient-to-tr ${bgColor} text-white shadow-sm shadow-blue-500/20`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg sm:text-xl text-slate-900 flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                  {items.length}
                </span>
              </h2>
              {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="p-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200 shadow-xs text-slate-700 hover:text-slate-900 cursor-pointer transition active:scale-95"
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="p-2 rounded-full bg-white hover:bg-slate-100 border border-slate-200 shadow-xs text-slate-700 hover:text-slate-900 cursor-pointer transition active:scale-95"
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div 
          ref={rowRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth py-2 px-1 scrollbar-none snap-x"
        >
          {items.map((book) => (
            <div key={book.id} className="w-44 sm:w-52 shrink-0 snap-start">
              <BookCard
                book={book}
                onClick={() => setSelectedBook(book)}
                onBorrow={() => handleSelfBorrow(book)}
                isBorrowable={currentRole === 'learner'}
              />
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      
      {/* Top Header & Search Bar (GetEpic Canvas) */}
      <div className="space-y-4">
        
        {/* Title and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Interactive Catalog
              </span>
              <span className="text-xs text-slate-500 font-bold">
                {books.length} Available Titles
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
              Explore & Discover Books
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('rows')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  viewMode === 'rows' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Discovery Rows (GetEpic View)"
              >
                <Rows className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discovery Rows</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All Grid</span>
              </button>
            </div>

            {currentRole === 'librarian' && (
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-full text-xs shadow-md transition-all cursor-pointer"
              >
                {showAddForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{showAddForm ? 'Close' : 'Add Book'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Pill Category Filter Carousel (GetEpic Model) */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {categoryPills.map((pill) => {
            const Icon = pill.icon;
            const isSelected = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(pill.id);
                  if (pill.id !== 'All' && viewMode === 'rows') {
                    // Switch to grid when specific category clicked if search isn't blank
                  }
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & In-Page Filter Bar */}
        <div className="relative bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/80 shadow-xs flex items-center gap-2">
          <Search className="text-slate-400 w-4 h-4 ml-2.5 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, author name, ISBN, or topic keywords..."
            className="w-full text-xs sm:text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

      {/* Real-time Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            role="status"
            aria-live="polite"
            className={`p-4 rounded-2xl shadow-md border text-xs sm:text-sm flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                : 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
              <p>{notification.message}</p>
            </div>
            <button 
              type="button"
              onClick={() => setNotification(null)} 
              className="text-slate-500 hover:text-slate-900 p-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Book Catalog Add Form (Librarian) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddBook}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg space-y-5 overflow-hidden"
          >
            <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Catalog New Physical Inventory
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="new-book-title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Book Title *
                </label>
                <input
                  id="new-book-title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Half of a Yellow Sun"
                  className="w-full text-xs border border-slate-300 bg-slate-50 focus:bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label htmlFor="new-book-author" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Author Name *
                </label>
                <input
                  id="new-book-author"
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. Chimamanda Ngozi Adichie"
                  className="w-full text-xs border border-slate-300 bg-slate-50 focus:bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label htmlFor="new-book-isbn" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ISBN Identifier *
                </label>
                <input
                  id="new-book-isbn"
                  type="text"
                  required
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  placeholder="e.g. 978-0007200283"
                  className="w-full text-xs border border-slate-300 bg-slate-50 focus:bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-900 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-book-category" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Genre / Category</label>
                <select
                  id="new-book-category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs border border-slate-300 bg-slate-50 focus:bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                >
                  <option value="African Literature">African Literature</option>
                  <option value="Classics">Classics</option>
                  <option value="Fantasy & Adventure">Fantasy & Adventure</option>
                  <option value="Children's Fiction">Children's Fiction</option>
                  <option value="Comics & Humor">Comics & Humor</option>
                  <option value="STEM & Space">STEM & Space</option>
                  <option value="Coding & Tech">Coding & Tech</option>
                  <option value="Philosophy & Ethics">Philosophy & Ethics</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-book-copies" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total Copies</label>
                <input
                  id="new-book-copies"
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={newCopies}
                  onChange={(e) => setNewCopies(parseInt(e.target.value) || 1)}
                  className="w-full text-xs border border-slate-300 bg-slate-50 focus:bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-book-desc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Synopsis / Plot Summary</label>
              <textarea
                id="new-book-desc"
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Key plot summary, themes, or curriculum recommendations..."
                className="w-full text-xs border border-slate-300 bg-slate-50 focus:bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer border border-slate-200"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full text-xs cursor-pointer shadow-md shadow-blue-500/20"
              >
                Catalog Book
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Main Content Area: Horizontal Discovery Rows vs Filtered Grid */}
      {viewMode === 'rows' && !searchTerm.trim() && selectedCategory === 'All' ? (
        <div className="space-y-10">
          
          {/* Row 1: Popular This Week */}
          <DiscoveryRow
            title="Popular This Week"
            subtitle="Top-rated books read most by scholars this term"
            icon={Flame}
            items={popularBooks}
            accentColor="text-amber-600"
            bgColor="from-amber-500 to-orange-600"
          />

          {/* Row 2: Trending Audiobooks & Read-To-Me */}
          <DiscoveryRow
            title="Read-To-Me & Audiobooks"
            subtitle="Immersive narrations with real-time word highlighting"
            icon={Headphones}
            items={audioBooks}
            accentColor="text-pink-600"
            bgColor="from-pink-500 to-rose-600"
          />

          {/* Row 3: STEM & Science Adventures */}
          <DiscoveryRow
            title="STEM & Space Adventures"
            subtitle="Cosmology, algorithms, physics, and future tech"
            icon={Rocket}
            items={stemBooks}
            accentColor="text-purple-600"
            bgColor="from-purple-600 to-indigo-700"
          />

          {/* Row 4: African Heritage & World Literature */}
          <DiscoveryRow
            title="African Heritage & Classics"
            subtitle="Masterpieces by Chinua Achebe and celebrated storytellers"
            icon={Globe}
            items={africanBooks}
            accentColor="text-emerald-600"
            bgColor="from-emerald-600 to-teal-700"
          />

          {/* Row 5: Comics, Graphic Novels & Humor */}
          <DiscoveryRow
            title="Comics & Graphic Novels"
            subtitle="Laugh-out-loud illustrated tales & middle-school adventures"
            icon={Smile}
            items={comicsBooks}
            accentColor="text-orange-600"
            bgColor="from-orange-500 to-amber-600"
          />

          {/* Row 6: Classic Treasures */}
          <DiscoveryRow
            title="Staff Picks & Timeless Classics"
            subtitle="Curated by the Premier International English Faculty"
            icon={Award}
            items={classicsBooks}
            accentColor="text-blue-600"
            bgColor="from-blue-600 to-slate-900"
          />

        </div>
      ) : (
        /* Filtered Grid Display */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span>
              Showing {filteredBooks.length} result{filteredBooks.length !== 1 ? 's' : ''}
              {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
              {searchTerm.trim() ? ` for "${searchTerm}"` : ''}
            </span>
            {(selectedCategory !== 'All' || searchTerm.trim()) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Reset all filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={() => setSelectedBook(book)}
                onBorrow={() => handleSelfBorrow(book)}
                isBorrowable={currentRole === 'learner'}
              />
            ))}

            {filteredBooks.length === 0 && (
              <div className="col-span-full text-center py-16 bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 space-y-3">
                <Layers className="w-12 h-12 text-slate-400 mx-auto mb-2" aria-hidden="true" />
                <p className="font-display font-black text-slate-900 text-base">No books found matching criteria</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try searching for Chinua Achebe, Gatsby, Percy Jackson, or reset your category filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold cursor-pointer"
                >
                  Show All Books
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book Details Slide-Up Modal (GetEpic Experience) */}
      <AnimatePresence>
        {selectedBook && (() => {
          const book = selectedBook;
          const isAvailable = book.availableCopies > 0;
          const activeHold = holds.find((h) => h.bookId === book.id && h.status === 'active');
          const matchedUser = users.find((u) => u.name === currentLearnerName);
          const isHeldByMe = activeHold && matchedUser && activeHold.userId === matchedUser.id;

          const handleAddReviewSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!reviewComment.trim()) return;
            addBookReview(book.id, reviewRating, reviewComment.trim());
            triggerNotification('success', 'Thank you! Your peer review has been posted.');
            setReviewComment('');
            setReviewRating(5);
            setSelectedBook((prev) => {
              if (!prev) return null;
              const newReview = {
                id: `rev-${Date.now()}`,
                bookId: book.id,
                reviewerName: currentLearnerName,
                reviewerRole: currentRole,
                rating: reviewRating,
                comment: reviewComment.trim(),
                createdAt: 'Today',
              };
              return { ...prev, reviews: [newReview, ...(prev.reviews || [])] };
            });
          };

          return (
            <div 
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="book-detail-modal-title"
            >
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto border border-slate-200/90"
              >
                {/* Modal Header Cover Hero */}
                <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white overflow-hidden rounded-t-3xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer backdrop-blur-xs z-10"
                    aria-label="Close book details"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start relative z-10">
                    {/* Large Cover Card */}
                    <div className="w-32 sm:w-40 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shrink-0 bg-slate-800 border-2 border-white/20 relative">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {book.hasAudio && (
                        <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md">
                          <Headphones className="w-3 h-3" /> Audio
                        </div>
                      )}
                    </div>

                    {/* Book Metadata */}
                    <div className="space-y-2 flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                        <span className="text-[10px] font-black tracking-widest text-amber-300 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full uppercase">
                          {book.category}
                        </span>
                        {book.ageRange && (
                          <span className="text-[10px] font-bold text-teal-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                            {book.ageRange}
                          </span>
                        )}
                        {book.readingLevel && (
                          <span className="text-[10px] font-mono text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded-full">
                            {book.readingLevel}
                          </span>
                        )}
                      </div>

                      <h2 id="book-detail-modal-title" className="font-display font-black text-xl sm:text-2xl leading-tight text-white">
                        {book.title}
                      </h2>
                      <p className="text-sm text-slate-300 font-semibold">
                        by {book.author}
                      </p>

                      <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs">
                        <div className="flex items-center gap-1 text-amber-400 font-black">
                          <Star className="w-4 h-4 fill-amber-400" />
                          <span>{book.rating || 4.9}</span>
                        </div>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-300 font-bold">{book.readsCount} readers</span>
                        <span className="text-slate-400">|</span>
                        <span className={`font-bold ${isAvailable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isAvailable ? `${book.availableCopies} available` : 'On Loan'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 text-xs text-slate-800">
                  
                  {/* Action Row: Read-To-Me Audio Simulation & Quick Borrow Button */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {currentRole === 'learner' && (
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleSelfBorrow(book)}
                        className={`flex-1 py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                          isAvailable 
                            ? 'bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-blue-500/20 active:scale-98' 
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <BookmarkCheck className="w-4 h-4" />
                        <span>{isAvailable ? 'Borrow Book (14-Day Loan)' : 'All Copies Checked Out'}</span>
                      </button>
                    )}

                    {book.hasAudio && (
                      <button
                        type="button"
                        onClick={() => setIsPlayingAudioPreview(!isPlayingAudioPreview)}
                        className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                          isPlayingAudioPreview 
                            ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md animate-pulse' 
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>{isPlayingAudioPreview ? 'Playing Preview...' : 'Audio Narration'}</span>
                      </button>
                    )}
                  </div>

                  {/* Audio Player Visualizer Bar if Active */}
                  {isPlayingAudioPreview && (
                    <div className="bg-amber-50 border border-amber-300 p-3 rounded-2xl flex items-center justify-between text-amber-950 font-bold">
                      <div className="flex items-center gap-2">
                        <Play className="w-4 h-4 text-amber-700 animate-spin" />
                        <span>Narrator Audio Sample (Chapter 1 Preview - 1:45 mins)</span>
                      </div>
                      <div className="flex gap-1 items-end h-4">
                        <span className="w-1 bg-amber-600 h-2 animate-bounce"></span>
                        <span className="w-1 bg-amber-600 h-4 animate-bounce delay-75"></span>
                        <span className="w-1 bg-amber-600 h-3 animate-bounce delay-150"></span>
                        <span className="w-1 bg-amber-600 h-4 animate-bounce delay-100"></span>
                      </div>
                    </div>
                  )}

                  {/* Synopsis */}
                  <div className="space-y-1.5">
                    <h3 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-widest">
                      Synopsis & Story Overview
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      "{book.description}"
                    </p>
                  </div>

                  {/* Shelf & Dewey Spec Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ISBN</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{book.isbn}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dewey Class</span>
                      <span className="font-mono font-bold text-blue-700 text-xs">
                        {book.deweyCode ? `DDC ${book.deweyCode}` : '800 Literature'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pages</span>
                      <span className="font-bold text-slate-900 text-xs">{book.pageCount || 240} pages</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Inventory</span>
                      <span className="font-bold text-slate-900 text-xs">{book.availableCopies} of {book.totalCopies}</span>
                    </div>
                  </div>

                  {/* 24-Hour Hold System Status */}
                  <div className="border border-blue-100 bg-blue-50/70 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-blue-700" />
                        24-Hour Reserve Hold System
                      </h3>
                      {activeHold && (
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                          HELD
                        </span>
                      )}
                    </div>

                    {activeHold ? (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Reserved until: <strong>{activeHold.expiresAt}</strong></span>
                        </div>
                        <p className="text-slate-800">
                          Currently held by <span className="font-bold">{activeHold.userName}</span>.
                        </p>
                        {isHeldByMe && (
                          <button
                            type="button"
                            onClick={() => {
                              releaseHold(activeHold.id);
                              triggerNotification('success', 'Hold released successfully.');
                            }}
                            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 rounded-xl text-xs cursor-pointer"
                          >
                            Cancel My Reservation
                          </button>
                        )}
                      </div>
                    ) : (
                      currentRole === 'learner' && matchedUser && (
                        book.availableCopies > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              const res = createHold(book.id, matchedUser.id);
                              if (res.success) {
                                triggerNotification('success', res.message);
                              } else {
                                triggerNotification('error', res.message);
                              }
                            }}
                            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Lock Down 24-Hr Reserve Hold
                          </button>
                        ) : (
                          <div className="p-2 bg-rose-100 text-rose-950 text-xs font-semibold rounded-xl text-center">
                            No copies available for hold right now.
                          </div>
                        )
                      )
                    )}
                  </div>

                  {/* Reader Reviews */}
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <h3 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      Scholar Reviews ({book.reviews?.length || 0})
                    </h3>

                    {/* Review Form */}
                    <form onSubmit={handleAddReviewSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <label htmlFor="review-comment-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Rate & Review this Book:
                      </label>

                      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating out of 5 stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            className="focus:outline-none cursor-pointer p-0.5"
                          >
                            <Star 
                              className={`w-5 h-5 transition-colors ${
                                star <= (hoverRating ?? reviewRating) 
                                  ? 'fill-amber-400 text-amber-400' 
                                  : 'text-slate-300'
                              }`} 
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-slate-600 font-mono ml-1">
                          {reviewRating} Star{reviewRating > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          id="review-comment-input"
                          type="text"
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Share your thoughts with classmates..."
                          className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                        />
                        <button
                          type="submit"
                          className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 cursor-pointer"
                        >
                          Post
                        </button>
                      </div>
                    </form>

                    {/* Review Cards */}
                    <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                      {book.reviews && book.reviews.length > 0 ? (
                        book.reviews.map((rev) => (
                          <div key={rev.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-900">{rev.reviewerName}</span>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star 
                                    key={idx} 
                                    className={`w-3 h-3 ${idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-slate-700 italic">"{rev.comment}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-2 italic">
                          No reviews yet. Be the first to share your opinion!
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-full cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
