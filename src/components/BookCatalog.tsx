/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { Search, Info, Check, X, Bookmark, Plus, Layers, User as UserIcon, QrCode, BookmarkCheck, TrendingUp, Star, Lock, Clock, ShieldAlert } from 'lucide-react';
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
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Dialog / Form States
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Book Form States
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newCategory, setNewCategory] = useState('African Literature');
  const [newCopies, setNewCopies] = useState(5);
  const [newDesc, setNewDesc] = useState('');
  const [newDeweyClass, setNewDeweyClass] = useState('800');
  const [newDeweyCode, setNewDeweyCode] = useState('813');

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
      title: newTitle,
      author: newAuthor,
      isbn: newIsbn,
      category: newCategory,
      totalCopies: newCopies,
      availableCopies: newCopies,
      description: newDesc || 'No description available.',
      deweyClass: newDeweyClass,
      deweyCode: newDeweyCode.trim() || newDeweyClass,
    });

    triggerNotification('success', `"${newTitle}" successfully cataloged into inventory!`);
    
    // Reset
    setNewTitle('');
    setNewAuthor('');
    setNewIsbn('');
    setNewDesc('');
    setNewCopies(5);
    setNewDeweyClass('800');
    setNewDeweyCode('813');
    setShowAddForm(false);
  };

  const handleSelfBorrow = (book: Book) => {
    const res = checkoutBook(book.id, currentLearnerName);
    if (res.success) {
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
      
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            School Library Catalog
          </h2>
          <p className="text-sm text-slate-500">Search academic journals, reference textbooks, and literary classics.</p>
        </div>

        {currentRole === 'librarian' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel Catalog' : 'Catalog New Book'}
          </button>
        )}
      </div>

      {/* Real-time Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-xl shadow-lg border text-sm flex items-center justify-between ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <p className="font-semibold">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
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
            className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-inner space-y-4 overflow-hidden"
          >
            <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-900" /> Catalog New Physical Inventory
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Book Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Half of a Yellow Sun"
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Author Name</label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="e.g. Chimamanda Ngozi Adichie"
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">ISBN Identifier</label>
                <input
                  type="text"
                  required
                  value={newIsbn}
                  onChange={(e) => setNewIsbn(e.target.value)}
                  placeholder="e.g. 978-0007200283"
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Genre/Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Checked copies</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={newCopies}
                  onChange={(e) => setNewCopies(parseInt(e.target.value) || 1)}
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">Dewey Subject Class (000-900)</label>
                <select
                  value={newDeweyClass}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewDeweyClass(val);
                    const defaults: Record<string, string> = {
                      '000': '005.1', '100': '180', '200': '291', '300': '320', '400': '420',
                      '500': '523', '600': '608', '700': '709', '800': '813', '900': '960'
                    };
                    setNewDeweyCode(defaults[val] || val);
                  }}
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="000">000 - Computer Science, Info & General</option>
                  <option value="100">100 - Philosophy & Psychology</option>
                  <option value="200">200 - Religion & Mythology</option>
                  <option value="300">300 - Social Sciences & Government</option>
                  <option value="400">400 - Language & Grammar</option>
                  <option value="500">500 - Pure Science & Mathematics</option>
                  <option value="600">600 - Technology & Applied Science</option>
                  <option value="700">700 - Arts, Recreation & Sports</option>
                  <option value="800">800 - Literature, Fiction & Poetry</option>
                  <option value="900">900 - History, Geography & Biography</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">Precision Dewey Code</label>
                <input
                  type="text"
                  required
                  value={newDeweyCode}
                  onChange={(e) => setNewDeweyCode(e.target.value)}
                  placeholder="e.g. 813.5 or 523.1"
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Synopsis / Summary Description</label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Give a brief description for students browsing..."
                className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer shadow-xs"
              >
                Register Book
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Catalog Search, Filter Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        <div className="sm:col-span-3 flex items-center glass p-3.5 rounded-xl shadow-sm">
          <Search className="text-slate-400 w-5 h-5 mr-3 flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search catalog by title, author, category or ISBN..."
            className="w-full text-sm outline-none bg-transparent"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-slate-300 hover:text-slate-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3.5 glass rounded-xl shadow-xs text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books grid display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBooks.map((book) => {
          const isAvailable = book.availableCopies > 0;
          return (
            <motion.div
              layout
              key={book.id}
              className="glass rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Book Header */}
                <div className="flex justify-between items-start gap-2 flex-wrap">
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <span className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                      {book.category}
                    </span>
                    {book.deweyCode && (
                      <span className="bg-amber-50 text-amber-900 border border-amber-200/50 text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-md" title={`DDC Class: ${book.deweyClass}`}>
                        DDC {book.deweyCode}
                      </span>
                    )}
                  </div>
                  
                  <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md ${
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-rose-50 text-rose-800'
                  }`}>
                    {isAvailable ? `${book.availableCopies} available` : 'Out of Stock'}
                  </span>
                </div>

                {/* Title & Author */}
                <div>
                  <h3 className="font-display font-extrabold text-base text-slate-800 leading-snug line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                    <UserIcon className="w-3 h-3 text-slate-400" />
                    {book.author}
                  </p>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 italic">
                  "{book.description}"
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  <span>{book.readsCount} reads</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedBook(book)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center transition cursor-pointer"
                    title="View details"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  
                  {currentRole === 'learner' ? (
                    <button
                      disabled={!isAvailable}
                      onClick={() => handleSelfBorrow(book)}
                      className={`flex items-center gap-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                        isAvailable
                          ? 'bg-indigo-900 text-white hover:bg-indigo-800'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      Self-Borrow
                    </button>
                  ) : (
                    <div className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 p-2 rounded-lg flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> {book.isbn.substring(0, 10)}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredBooks.length === 0 && (
          <div className="sm:col-span-3 text-center py-12 bg-slate-50 border border-dashed rounded-2xl p-6">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-display font-bold text-slate-600 text-sm">No books found matching criteria</p>
            <p className="text-xs text-slate-400">Try modifying search tags or check under different genres.</p>
          </div>
        )}
      </div>

      {/* Detail Book Modal */}
      <AnimatePresence>
        {selectedBook && (() => {
          // Resolve current state of book from books array to get real-time holds, reviews and copies updates!
          const book = books.find(b => b.id === selectedBook.id) || selectedBook;
          
          // Find matched user
          const matchedUser = users.find((u) => {
            const formatted = u.role === 'student' ? `${u.name} (${u.gradeOrYear})` : `${u.name} (Teacher)`;
            return formatted === currentLearnerName;
          });

          // Check active holds
          const activeHold = holds.find(h => h.bookId === book.id && h.status === 'active');
          const isHeldByMe = activeHold && matchedUser && activeHold.userId === matchedUser.id;

          const handleAddReviewSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            if (!reviewComment.trim()) return;
            addBookReview(book.id, reviewRating, reviewComment);
            setReviewComment('');
            triggerNotification('success', 'Your book review and star rating has been posted to this catalog!');
          };

          return (
            <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-100 space-y-6"
              >
                <button
                  onClick={() => setSelectedBook(null)}
                  className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-4">
                  <div className="flex gap-2 items-center">
                    <span className="bg-indigo-100 text-indigo-900 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider inline-block">
                      {book.category}
                    </span>
                    {book.rating && book.rating > 0 && (
                      <span className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold px-2.5 py-1.5 rounded-full flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {book.rating} Avg Rating
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-display font-black text-2xl text-slate-900 leading-tight">
                      {book.title}
                    </h3>
                    <p className="text-sm font-semibold text-slate-600 mt-1 flex items-center gap-1">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Written by <span className="text-slate-900">{book.author}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">ISBN Number</span>
                      <span className="text-slate-800 font-bold">{book.isbn}</span>
                    </div>
                    {book.deweyCode && (
                      <div>
                        <span className="text-indigo-900/60 block uppercase font-bold text-[9px] tracking-wider">Dewey Decimal Code</span>
                        <span className="text-indigo-900 font-black">Class {book.deweyClass} / {book.deweyCode}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Historical Popularity</span>
                      <span className="text-slate-800 font-bold">{book.readsCount} total checkouts</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider">Availability</span>
                      <span className={`font-bold ${book.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {book.availableCopies} / {book.totalCopies} available copies
                      </span>
                    </div>
                  </div>

                  {/* 24-Hour Reserve Hold Module */}
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs space-y-1">
                        <h4 className="font-bold text-amber-900">24-Hour Shelf Reserve Hold System</h4>
                        <p className="text-amber-800 leading-relaxed">
                          Secure a copy of this book for 24 hours. The copy will be locked down so that nobody else can claim it before you come in-person to the school library desk to complete the borrow process.
                        </p>
                      </div>
                    </div>

                    {activeHold ? (
                      <div className="bg-white border border-amber-200/60 p-3 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                          <span className="text-amber-700 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-amber-600" /> Reserved / Locked
                          </span>
                          <span className="text-slate-500">Expires: {activeHold.expiryDate}</span>
                        </div>
                        <p className="text-slate-700">
                          Currently reserved by <span className="font-bold">{activeHold.userName}</span>.
                        </p>
                        {isHeldByMe && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                releaseHold(activeHold.id);
                                triggerNotification('success', 'Hold released successfully. Book is open for public checkout!');
                              }}
                              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-1.5 rounded-lg text-[10px] cursor-pointer"
                            >
                              Cancel Hold Reservation
                            </button>
                          </div>
                        )}
                        <p className="text-[10px] text-indigo-900/80 mt-1 italic font-medium">
                          Please present your Library Card to the Admin at the library desk to finalize this loan.
                        </p>
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
                            className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-sans font-bold py-2 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Lock Down & Place 24-Hr Reserve Hold
                          </button>
                        ) : (
                          <div className="p-2.5 bg-rose-50 text-rose-800 text-xs font-semibold rounded-xl text-center border border-rose-200">
                            ⚠️ No copies available to hold right now.
                          </div>
                        )
                      )
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-display font-extrabold text-xs text-slate-700 uppercase tracking-widest">Book Synopsis</h4>
                    <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-dashed">
                      "{book.description}"
                    </p>
                  </div>

                  {/* Star reviews section */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-display font-extrabold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        Reader Peer Reviews ({book.reviews?.length || 0})
                      </h4>
                    </div>

                    {/* Review Form */}
                    <form onSubmit={handleAddReviewSubmit} className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Share Your Rating & Thoughts:
                      </span>

                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="focus:outline-none cursor-pointer"
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
                        <span className="text-[10px] font-bold text-slate-400 font-mono ml-1">
                          {reviewRating} Star{reviewRating > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Write a brief peer review or comment about this book..."
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
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
                          <div key={rev.id} className="p-3 bg-white border border-slate-100 rounded-xl text-xs space-y-2 shadow-3xs">
                            <div className="flex justify-between items-start flex-wrap gap-1">
                              <div>
                                <span className="font-extrabold text-slate-800 block leading-tight">{rev.reviewerName}</span>
                                <span className={`inline-block text-[8px] font-black uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                                  rev.reviewerRole === 'librarian' ? 'bg-indigo-100 text-indigo-800' : rev.reviewerRole === 'teacher' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                                }`}>
                                  {rev.reviewerRole}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star 
                                    key={idx} 
                                    className={`w-3 h-3 ${idx < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                  />
                                ))}
                                <span className="text-[9px] text-slate-400 font-mono font-bold ml-1">{rev.createdAt}</span>
                              </div>
                            </div>
                            <p className="text-slate-600 italic leading-snug">"{rev.comment}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4 italic">
                          No peer reviews posted yet. Be the first to express feedback!
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex gap-3 justify-end border-t border-slate-100 pt-4">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Close Catalog Details
                  </button>
                  {currentRole === 'learner' && (
                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-[11px] text-indigo-900 font-medium">
                      ℹ️ Self-borrowing is disabled. Please request the library admin to check out this book for you.
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
