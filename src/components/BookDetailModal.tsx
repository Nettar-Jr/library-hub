/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { 
  X, 
  Star, 
  Headphones, 
  BookmarkCheck, 
  Volume2, 
  Play, 
  Lock, 
  Clock, 
  BookMarked,
  Layers,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({ book, onClose }) => {
  const { 
    currentUser, 
    currentRole, 
    currentLearnerName, 
    users, 
    holds, 
    createHold, 
    releaseHold, 
    addBookReview, 
    checkoutBook,
    setSelectedBook
  } = useApp();

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSavedToShelf, setIsSavedToShelf] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Close on ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Trap focus inside modal
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const isAvailable = book.availableCopies > 0;
  const activeHold = holds.find((h) => h.bookId === book.id && h.status === 'active');
  const matchedUser = users.find((u) => u.name === currentLearnerName);
  const isHeldByMe = activeHold && matchedUser && activeHold.userId === matchedUser.id;
  const coverSrc = book.coverUrl || book.coverImage;

  const handleBorrow = () => {
    if (!isAvailable) {
      triggerNotification('error', 'All copies of this title are currently checked out.');
      return;
    }
    const res = checkoutBook(book.id, currentLearnerName, 14);
    if (res.success) {
      triggerNotification('success', `"${book.title}" borrowed successfully! Return due in 14 days.`);
    } else {
      triggerNotification('error', res.message);
    }
  };

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    addBookReview(book.id, reviewRating, reviewComment.trim());
    triggerNotification('success', 'Thank you! Your peer review has been posted.');
    setReviewComment('');
    setReviewRating(5);
    
    // Update local modal view state
    setSelectedBook((prev) => {
      if (!prev) return null;
      const newReview = {
        id: `rev-${Date.now()}`,
        reviewerName: currentLearnerName,
        reviewerRole: currentRole as any,
        rating: reviewRating,
        comment: reviewComment.trim(),
        createdAt: 'Today',
      };
      return { ...prev, reviews: [newReview, ...(prev.reviews || [])] };
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-modal-title"
    >
      <motion.div
        ref={modalRef}
        tabIndex={-1}
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-2xl w-full shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto border border-slate-200/90 focus:outline-none"
      >
        {/* Modal Header Cover Hero Banner */}
        <div className="relative bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white overflow-hidden rounded-t-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer backdrop-blur-xs z-10"
            aria-label="Close book details"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start relative z-10">
            {/* Large Cover Card */}
            <div className="w-32 sm:w-40 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl shrink-0 bg-slate-800 border-2 border-white/20 relative group">
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-indigo-900 p-3 flex flex-col justify-between text-white">
                  <span className="text-[9px] font-mono">{book.deweyCode || '800'}</span>
                  <h4 className="font-display font-black text-xs">{book.title}</h4>
                </div>
              )}

              {book.hasAudio && (
                <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-md border border-purple-400">
                  <Headphones className="w-3 h-3" /> Audio
                </div>
              )}
            </div>

            {/* Book Metadata Header */}
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
                  {isAvailable ? `${book.availableCopies} of ${book.totalCopies} copies available` : 'All copies loaned'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications Toast */}
        {notification && (
          <div className="px-6">
            <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}>
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 pt-0 space-y-6 text-xs text-slate-800">
          
          {/* Action Row: Borrow, Audio Narration & Save to Bookshelf */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!isAvailable}
              onClick={handleBorrow}
              className={`flex-1 py-3 px-5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                isAvailable 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 active:scale-98' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isAvailable ? 'Borrow Book (14 Days)' : 'Currently Unavailable'}</span>
            </button>

            {book.hasAudio && (
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  isPlayingAudio 
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md' 
                    : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isPlayingAudio ? 'Pause Narration' : 'Play Audio'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsSavedToShelf(!isSavedToShelf);
                triggerNotification('success', isSavedToShelf ? 'Removed from your Bookshelf.' : 'Saved to your Bookshelf!');
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                isSavedToShelf 
                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {isSavedToShelf ? <Check className="w-4 h-4 text-amber-600" /> : <BookMarked className="w-4 h-4 text-slate-500" />}
              <span>{isSavedToShelf ? 'Saved' : 'Save to Bookshelf'}</span>
            </button>
          </div>

          {/* Audio Visualizer if Active */}
          {isPlayingAudio && (
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl flex items-center justify-between text-purple-950 font-bold">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-700 animate-pulse" />
                <span>Narrator Audio Sample (Chapter 1 Preview - 1:45 mins)</span>
              </div>
              <div className="flex gap-1 items-end h-4">
                <span className="w-1 bg-purple-600 h-2 animate-bounce"></span>
                <span className="w-1 bg-purple-600 h-4 animate-bounce delay-75"></span>
                <span className="w-1 bg-purple-600 h-3 animate-bounce delay-150"></span>
                <span className="w-1 bg-purple-600 h-4 animate-bounce delay-100"></span>
              </div>
            </div>
          )}

          {/* Synopsis */}
          <div className="space-y-1.5">
            <h3 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-widest">
              Synopsis & Story Overview
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              "{book.summary || book.description}"
            </p>
          </div>

          {/* Shelf & Dewey Classification Spec Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ISBN</span>
              <span className="font-mono font-bold text-slate-900 text-xs">{book.isbn}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Call Number</span>
              <span className="font-mono font-bold text-blue-700 text-xs">
                {book.callNumber || (book.deweyCode ? `DDC ${book.deweyCode}` : '800 Literature')}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pages</span>
              <span className="font-bold text-slate-900 text-xs">{book.pageCount || 240} pages</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Inventory</span>
              <span className="font-bold text-slate-900 text-xs">{book.availableCopies} of {book.totalCopies}</span>
            </div>
          </div>

          {/* 24-Hour Reserve Hold Status */}
          <div className="border border-blue-100 bg-blue-50/70 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-extrabold text-xs text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-blue-700" />
                24-Hour Reserve Hold System
              </h3>
              {activeHold && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                  ACTIVE HOLD
                </span>
              )}
            </div>

            {activeHold ? (
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reserved until: <strong>{activeHold.expiryDate}</strong></span>
                </div>
                <p className="text-slate-800">
                  Currently reserved by <span className="font-bold">{activeHold.userName}</span>.
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
              matchedUser && (
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
                    Place 24-Hour Reserve Hold
                  </button>
                ) : (
                  <div className="p-2 bg-rose-100 text-rose-950 text-xs font-semibold rounded-xl text-center">
                    No physical copies available to reserve right now.
                  </div>
                )
              )
            )}
          </div>

          {/* Reader Reviews & Ratings */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <h3 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              Scholar Reviews & Ratings ({book.reviews?.length || 0})
            </h3>

            {/* Review Form */}
            <form onSubmit={handleAddReviewSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <label htmlFor="review-comment-input" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Share your rating and thoughts:
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
                  placeholder="Share a short review with fellow scholars..."
                  className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition"
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
                  No scholar reviews posted yet. Be the first to share your opinion!
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex justify-between items-center">
          <span className="text-[11px] text-slate-500 font-medium">
            Premier International Digital Library • Discovery Hub
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-full cursor-pointer transition"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
