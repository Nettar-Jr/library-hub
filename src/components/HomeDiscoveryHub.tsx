/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookCard } from './BookCard';
import { 
  BookOpen, 
  Headphones, 
  BookmarkCheck, 
  ArrowRight, 
  LogIn, 
  ShieldCheck, 
  Clock, 
  X,
  Library,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book } from '../types';

export const HomeDiscoveryHub: React.FC = () => {
  const { books, currentUser, isLearner, checkoutBook, currentLearnerName, loggedInLearner } = useApp();
  const navigate = useNavigate();

  const [selectedBookModal, setSelectedBookModal] = useState<Book | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Limited catalog preview: 8 featured titles across diverse categories
  const featuredPreviewBooks = books.slice(0, 8);

  const handleBookClick = (book: Book) => {
    setSelectedBookModal(book);
  };

  const handleBorrowAttempt = (book: Book) => {
    if (!currentUser) {
      navigate(`/login?redirect=/catalog`);
      return;
    }
    const borrowerName = currentLearnerName || (loggedInLearner ? loggedInLearner.name : currentUser.name);
    const result = checkoutBook(book.id, borrowerName);
    if (result.success) {
      setActionFeedback(`Loan confirmed for "${book.title}". Please pick up your copy at the circulation desk.`);
      setSelectedBookModal(null);
      setTimeout(() => setActionFeedback(null), 5000);
    } else {
      setActionFeedback(result.message);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const scrollToPreview = () => {
    const el = document.getElementById('catalog-preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16">
      
      {/* Action Feedback Banner */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 right-4 sm:right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg border border-slate-700 flex items-center gap-3 max-w-md text-xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
       * 1. CLEAN HERO SECTION
       * ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border border-slate-200/80 p-8 sm:p-12 lg:p-16 text-left">
        {/* Calm geometric subtle background accents */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-50/60 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 border border-blue-200/60 text-blue-900 text-xs font-semibold">
            <Library className="w-3.5 h-3.5 text-blue-700" />
            <span>Premier International School Library</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight leading-[1.15]">
              Discover books for learning, inquiry, and reading.
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              Access physical library collections, read-aloud audiobooks, and curated reference materials. Sign in with your school library account to borrow books and manage active loans.
            </p>
          </div>

          {/* Calm CTA Group */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            {!currentUser ? (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign in to borrow</span>
                </button>

                <button
                  type="button"
                  onClick={scrollToPreview}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>Browse Catalog Preview</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/catalog')}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Catalog</span>
                </button>

                <button
                  type="button"
                  onClick={scrollToPreview}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  <span>Preview Collection</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. LIMITED CATALOG PREVIEW
       * ========================================================================= */}
      <section id="catalog-preview" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
              Curated Selection
            </span>
            <h2 className="font-display font-bold text-2xl text-slate-900">
              Featured Catalog Preview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Browse a sample of available titles spanning African literature, STEM, history, and classics.
            </p>
          </div>

          {!currentUser && (
            <div className="text-xs text-slate-500 font-medium">
              Showing preview mode
            </div>
          )}
        </div>

        {/* 8-Book Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {featuredPreviewBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              mode={currentUser ? 'full' : 'public-preview'}
              isBorrowable={isLearner}
              onClick={() => handleBookClick(book)}
              onBorrow={() => handleBorrowAttempt(book)}
            />
          ))}
        </div>

        {/* Preview Footer Banner CTA */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-3">
          <div className="max-w-xl mx-auto space-y-1.5">
            <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">
              {currentUser ? 'Explore the complete library catalog' : 'Sign in to access the full catalog'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {currentUser 
                ? 'Search by title, Dewey Decimal classification, author, or curriculum topic to reserve books.'
                : 'Enrolled students and faculty can sign in to search the complete collection, check real-time availability, and place 24-hour holds.'}
            </p>
          </div>

          <div className="pt-2">
            {!currentUser ? (
              <button
                type="button"
                onClick={() => navigate('/login?redirect=/catalog')}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in to access the full catalog</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Browse Catalog</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 3. SHORT "WHAT YOU CAN DO" SECTION
       * ========================================================================= */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
            Library Services
          </span>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
            What You Can Do
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Core resources and tools designed to support your academic study and daily reading.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl inline-block">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Borrow & Reserve Books
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Search print titles across curriculum subjects, view real-time shelf availability, and place 24-hour holds for desk pickup.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl inline-block">
              <Headphones className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Audiobooks & Digital Reading
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Access digital read-aloud editions and audio recordings to assist pronunciation, language study, and literature coursework.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl inline-block">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base text-slate-900">
              Curriculum & Faculty Guidance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Discover reading lists curated by classroom teachers, aligned with academic terms and international school standards.
            </p>
          </div>
        </div>
      </section>

      {/* Book Detail Modal (Calm Institutional Preview) */}
      <AnimatePresence>
        {selectedBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto space-y-5 relative text-left"
            >
              <button
                onClick={() => setSelectedBookModal(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                {/* Book Cover */}
                <div className="sm:col-span-5 flex justify-center">
                  <div className="w-36 sm:w-40 aspect-[3/4] rounded-xl overflow-hidden shadow-xs border border-slate-200 relative bg-slate-100">
                    <img
                      src={selectedBookModal.coverImage}
                      alt={selectedBookModal.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="sm:col-span-7 space-y-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                      {selectedBookModal.category}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
                      DDC {selectedBookModal.deweyCode || '800'}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      selectedBookModal.availableCopies > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selectedBookModal.availableCopies > 0 ? `${selectedBookModal.availableCopies} available` : 'On loan'}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                    {selectedBookModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    by {selectedBookModal.author}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
                    {selectedBookModal.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono text-slate-600 border-t border-slate-100 mt-2">
                    <div><span className="text-slate-400">ISBN:</span> {selectedBookModal.isbn}</div>
                    <div><span className="text-slate-400">Pages:</span> {selectedBookModal.pageCount || 240}</div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedBookModal(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>

                {!currentUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookModal(null);
                      navigate('/login?redirect=/catalog');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign in to borrow</span>
                  </button>
                ) : isLearner ? (
                  <button
                    type="button"
                    disabled={selectedBookModal.availableCopies <= 0}
                    onClick={() => handleBorrowAttempt(selectedBookModal)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                      selectedBookModal.availableCopies > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>Borrow This Title</span>
                  </button>
                ) : null}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
