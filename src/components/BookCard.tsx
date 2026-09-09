/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Book } from '../types';
import { Headphones, BookOpen, BookmarkCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  onBorrow?: () => void;
  isBorrowable?: boolean;
  mode?: 'public-preview' | 'full';
  userStatus?: {
    isBorrowed?: boolean;
    dueDate?: string;
    isHeld?: boolean;
  };
}

export const BookCard: React.FC<BookCardProps> = ({ 
  book, 
  onClick, 
  onBorrow, 
  isBorrowable,
  mode = 'full',
  userStatus
}) => {
  const [imageError, setImageError] = useState(false);
  const isAvailable = book.availableCopies > 0;
  const isPreview = mode === 'public-preview';
  const coverSrc = book.coverUrl || book.coverImage;
  const isBorrowedByMe = !!userStatus?.isBorrowed;
  const isHeldByMe = !!userStatus?.isHeld;

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={onClick}
      className={`group relative bg-white rounded-2xl border p-3 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer select-none ${
        isBorrowedByMe
          ? 'border-indigo-300 ring-1 ring-indigo-200'
          : isHeldByMe
          ? 'border-amber-300 ring-1 ring-amber-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* 1. Cover Image (Standard 3:4 Book Ratio) */}
      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
        {coverSrc && !imageError ? (
          <img
            src={coverSrc}
            alt={`Cover of ${book.title}`}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          /* High-legibility typographic fallback */
          <div className="w-full h-full bg-slate-800 p-4 flex flex-col justify-between text-white">
            <span className="inline-block text-[10px] font-mono text-slate-300 font-medium uppercase tracking-wider">
              {book.deweyCode ? `DDC ${book.deweyCode}` : book.category}
            </span>
            <div className="space-y-1">
              <h4 className="font-display font-bold text-xs leading-snug line-clamp-3 text-white">
                {book.title}
              </h4>
              <p className="text-[11px] text-slate-300 italic line-clamp-1">
                {book.author}
              </p>
            </div>
          </div>
        )}

        {/* Subtle Spine Light Accent */}
        <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/20 via-white/10 to-transparent pointer-events-none" />

        {/* Top Badges (Format & Stock / User Status Indicator) */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {book.hasAudio ? (
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
              <Headphones className="w-2.5 h-2.5" />
              <span>Audio</span>
            </span>
          ) : (
            <span className="bg-white/90 backdrop-blur-xs text-slate-700 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded shadow-xs">
              {book.deweyCode ? `DDC ${book.deweyCode}` : 'Book'}
            </span>
          )}

          {isBorrowedByMe ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-900 text-white shadow-xs">
              Borrowed
            </span>
          ) : isHeldByMe ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-xs">
              On Hold
            </span>
          ) : (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-xs shadow-xs ${
              isAvailable 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {isAvailable ? `${book.availableCopies} available` : 'On loan'}
            </span>
          )}
        </div>
      </div>

      {/* 2. Card Content (Category, Title, Author, User Status Banner) */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
              {book.category.split('/')[0]}
            </span>
            {book.deweyCode && (
              <span className="text-[10px] font-mono text-slate-400 font-medium">
                {book.deweyCode}
              </span>
            )}
          </div>

          <h3 
            className="font-display font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug" 
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1">
            {book.author}
          </p>

          {/* User Active Status Badge if relevant */}
          {isBorrowedByMe && userStatus?.dueDate && (
            <div className="mt-1 text-[10px] font-medium text-indigo-800 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center justify-between">
              <span>Due {userStatus.dueDate}</span>
              <span className="font-semibold">Active Loan</span>
            </div>
          )}

          {isHeldByMe && (
            <div className="mt-1 text-[10px] font-medium text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200 flex items-center justify-between">
              <span>Hold Reserved</span>
              <span className="font-semibold">Ready for Pickup</span>
            </div>
          )}
        </div>

        {/* 3. Footer Action */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600 transition-colors flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
            <span>Details</span>
          </span>

          {!isPreview && isBorrowable && onBorrow && isAvailable && !isBorrowedByMe ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBorrow();
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white cursor-pointer active:scale-95 transition flex items-center gap-1"
            >
              <BookmarkCheck className="w-3 h-3" />
              <span>Borrow</span>
            </button>
          ) : (
            <span className="text-xs text-blue-600 font-medium group-hover:underline">
              {isPreview ? 'View details →' : 'Explore →'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
