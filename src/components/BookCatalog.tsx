/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
  BookOpen
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
  
  // Initialize search & filter states from URL search params for deep-linking
  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('cat') || 'All';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  
  // Sync state changes back to URL Search Params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm.trim()) params.q = searchTerm.trim();
    if (selectedCategory && selectedCategory !== 'All') params.cat = selectedCategory;
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedCategory, setSearchParams]);

  // Dialog / Form States
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Focus trap for book detail modal
  const modalRef = useFocusTrap(Boolean(selectedBook), () => setSelectedBook(null));
  
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
      triggerNotification('success', res.message);
      // Update the current selected book details overlay if open
      setSelectedBook(prev => prev && prev.id === book.id ? { ...prev, availableCopies: prev.availableCopies - 1, readsCount: prev.readsCount + 1 } : prev);
    } else {
      triggerNotification('error', res.message);
    }
  };

  // Get unique categories for filtering
  const categories = ['All', ...Array.from(new Set(books.map((b) => b.category)))];

  // Filter books list
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm);
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top action row with high-contrast typographic hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            School Library Catalog
          </h1>
          <p className="text-sm text-slate-600 font-medium">Search academic journals, reference textbooks, and literary classics.</p>
        </div>

        {currentRole === 'librarian' && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel Form' : 'Catalog New Book'}
          </button>
        )}
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
            className={`p-4 rounded-2xl shadow-md border text-sm flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                : 'bg-rose-50 border-rose-300 text-rose-950 font-semibold'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
              <p>{notification.message}</p>
            </div>
            <button 
              type="button"
              onClick={() => setNotification(null)} 
              className="text-slate-500 hover:text-slate-900 p-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline book catalog add form (Librarian) */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddBook}
            className="bg-white border border-slate-300 rounded-3xl p-6 sm:p-8 shadow-md space-y-5 overflow-hidden"
          >
            <h2 className="font-display font-black text-lg text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-900" /> Catalog New Physical Inventory
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
                  className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium"
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
                  className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 font-medium"
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
                  className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-slate-900 font-bold"
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
                  className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 font-semibold text-slate-900"
                >
                  <option value="African Literature">African Literature</option>
                  <option value="Classics">Classics</option>
                  <option value="Fantasy">Fantasy</option>
                  <option value="Children's Fiction">Children's Fiction</option>
                  <option value="Humor / Children's">Humor / Children's</option>
                  <option value="Science & Cosmos">Science & Cosmos</option>
                  <option value="Drama / Poetry">Drama / Poetry</option>
                  <option value="History & Politics">History & Politics</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-book-copies" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Total Physical Copies</label>
                <input
                  id="new-book-copies"
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={newCopies}
                  onChange={(e) => setNewCopies(parseInt(e.target.value) || 1)}
                  className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-book-cover" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Book Cover Image URL (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  id="new-book-cover"
                  type="url"
                  value={newCoverImage}
                  onChange={(e) => setNewCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-...?auto=format..."
                  className="flex-1 text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setNewCoverImage('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700')}
                  className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-bold rounded-xl cursor-pointer border border-indigo-200"
                >
                  Preset Art
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="new-book-desc" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Synopsis / Summary Description</label>
              <textarea
                id="new-book-desc"
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Key plot summary, themes, or curriculum recommendations..."
                className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer border border-slate-300"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Register Book
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Catalog Search & Category Filters (URL Synced) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        <div className="sm:col-span-3 flex items-center bg-white p-3.5 rounded-2xl shadow-xs border border-slate-300">
          <Search className="text-slate-500 w-5 h-5 mr-3 flex-shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog by title, author, category or ISBN..."
            aria-label="Search catalog books"
            className="w-full text-sm outline-none bg-transparent font-medium text-slate-950 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button 
              type="button"
              onClick={() => setSearchTerm('')} 
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          <label htmlFor="catalog-category-select" className="sr-only">Filter by Category</label>
          <select
            id="catalog-category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3.5 bg-white rounded-2xl shadow-xs text-xs font-bold border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? '📚 All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books grid display */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
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
          <div className="col-span-full text-center py-16 bg-white border-2 border-dashed border-slate-300 rounded-3xl p-8 space-y-3">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-2" aria-hidden="true" />
            <p className="font-display font-black text-slate-900 text-base">No books found matching criteria</p>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">Try searching for Chinua Achebe, Gatsby, Percy Jackson, or reset your category filter.</p>
          </div>
        )}
      </div>

      {/* Book details dialog overlay with focus trap */}
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-labelledby="book-detail-modal-title"
            >
              <motion.div
                ref={modalRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-widest text-indigo-900 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-md uppercase">
                      {book.category}
                    </span>
                    <h2 id="book-detail-modal-title" className="font-display font-black text-xl sm:text-2xl text-slate-950 mt-1">
                      {book.title}
                    </h2>
                    <p className="text-xs text-slate-600 font-bold flex items-center gap-1.5">
                      <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                      {book.author}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                    aria-label="Close book details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Details Content */}
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ISBN</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{book.isbn}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">DDC Shelf Code</span>
                      <span className="font-mono font-bold text-amber-900 text-xs">
                        {book.deweyCode || book.deweyClass || '800'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Availability</span>
                      <span className={`font-bold text-xs ${isAvailable ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {isAvailable ? `${book.availableCopies} of ${book.totalCopies} Available` : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Reads</span>
                      <span className="font-bold text-slate-900 text-xs">{book.readsCount} reads</span>
                    </div>
                  </div>

                  {/* 24-Hour Hold System Status */}
                  <div className="border border-indigo-100 bg-indigo-50/70 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-indigo-900" />
                        24-Hour Reserve Hold System
                      </h3>
                      {activeHold && (
                        <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
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
                          Currently reserved by <span className="font-bold">{activeHold.userName}</span>.
                        </p>
                        {isHeldByMe && (
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                releaseHold(activeHold.id);
                                triggerNotification('success', 'Hold released successfully. Book is open for public checkout!');
                              }}
                              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 rounded-xl text-xs cursor-pointer"
                            >
                              Cancel Hold Reservation
                            </button>
                          </div>
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
                            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Lock Down & Place 24-Hr Reserve Hold
                          </button>
                        ) : (
                          <div className="p-2.5 bg-rose-100 text-rose-950 text-xs font-semibold rounded-xl text-center border border-rose-200">
                            ⚠️ No copies available to hold right now.
                          </div>
                        )
                      )
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-widest">Book Synopsis</h3>
                    <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      "{book.description}"
                    </p>
                  </div>

                  {/* Star reviews section */}
                  <div className="border-t border-slate-200 pt-5 space-y-4">
                    <h3 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      Reader Peer Reviews ({book.reviews?.length || 0})
                    </h3>

                    {/* Review Form */}
                    <form onSubmit={handleAddReviewSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <label htmlFor="review-comment-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Share Your Rating & Thoughts:
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
                          placeholder="Write a brief peer review or comment about this book..."
                          className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-950 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-indigo-900 cursor-pointer"
                        >
                          Post Review
                        </button>
                      </div>
                    </form>

                    {/* Reviews List */}
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {book.reviews && book.reviews.length > 0 ? (
                        book.reviews.map((rev) => (
                          <div key={rev.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5 shadow-2xs">
                            <div className="flex justify-between items-start flex-wrap gap-1">
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">{rev.reviewerName}</span>
                                <span className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.5 rounded mt-0.5 ${
                                  rev.reviewerRole === 'librarian' ? 'bg-indigo-100 text-indigo-900' : rev.reviewerRole === 'teacher' ? 'bg-emerald-100 text-emerald-900' : 'bg-cyan-100 text-cyan-950'
                                }`}>
                                  {rev.reviewerRole}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star 
                                    key={idx} 
                                    className={`w-3 h-3 ${idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} 
                                  />
                                ))}
                                <span className="text-[10px] text-slate-500 font-mono font-bold ml-1">{rev.createdAt}</span>
                              </div>
                            </div>
                            <p className="text-slate-700 italic leading-snug">"{rev.comment}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-4 italic">
                          No peer reviews posted yet. Be the first to express feedback!
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex gap-3 justify-end border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedBook(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer border border-slate-300"
                  >
                    Close Catalog Details
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
