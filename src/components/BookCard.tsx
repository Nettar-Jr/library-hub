/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Book } from '../types';
import { Star, Headphones, Eye, BookmarkCheck, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  onBorrow?: () => void;
  isBorrowable?: boolean;
}

// Color theme mapper for genre cards (GetEpic inspired friendly palettes)
const GENRE_COLORS: Record<string, { badge: string; border: string; headerBg: string }> = {
  'African Literature': {
    badge: 'bg-amber-100/90 text-amber-900 border-amber-200',
    border: 'hover:border-amber-400',
    headerBg: 'from-amber-600 to-yellow-700'
  },
  'Classics': {
    badge: 'bg-indigo-100/90 text-indigo-950 border-indigo-200',
    border: 'hover:border-indigo-400',
    headerBg: 'from-indigo-700 to-slate-900'
  },
  'Fantasy & Adventure': {
    badge: 'bg-teal-100/90 text-teal-950 border-teal-200',
    border: 'hover:border-teal-400',
    headerBg: 'from-teal-600 to-emerald-800'
  },
  'Fantasy': {
    badge: 'bg-teal-100/90 text-teal-950 border-teal-200',
    border: 'hover:border-teal-400',
    headerBg: 'from-teal-600 to-emerald-800'
  },
  'Children\'s Fiction': {
    badge: 'bg-emerald-100/90 text-emerald-950 border-emerald-200',
    border: 'hover:border-emerald-400',
    headerBg: 'from-emerald-600 to-green-700'
  },
  'Comics & Humor': {
    badge: 'bg-orange-100/90 text-orange-950 border-orange-200',
    border: 'hover:border-orange-400',
    headerBg: 'from-orange-500 to-amber-600'
  },
  'STEM & Space': {
    badge: 'bg-purple-100/90 text-purple-950 border-purple-200',
    border: 'hover:border-purple-400',
    headerBg: 'from-purple-700 to-indigo-900'
  },
  'Coding & Tech': {
    badge: 'bg-cyan-100/90 text-cyan-950 border-cyan-200',
    border: 'hover:border-cyan-400',
    headerBg: 'from-cyan-700 to-blue-900'
  },
  'Philosophy & Ethics': {
    badge: 'bg-slate-100/90 text-slate-900 border-slate-200',
    border: 'hover:border-slate-400',
    headerBg: 'from-slate-700 to-slate-900'
  },
};

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, onBorrow, isBorrowable }) => {
  const [imageError, setImageError] = useState(false);
  const theme = GENRE_COLORS[book.category] || {
    badge: 'bg-slate-100/90 text-slate-900 border-slate-200',
    border: 'hover:border-blue-400',
    headerBg: 'from-blue-600 to-slate-800'
  };

  const isAvailable = book.availableCopies > 0;
  const isTopRated = (book.rating || 0) >= 4.8 || (book.readsCount || 0) > 100;

  const coverSrc = book.coverUrl || book.coverImage;

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      onClick={onClick}
      className={`group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-2.5 sm:p-3 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer ${theme.border} select-none`}
    >
      {/* Layer 4: Cover Image Wrapper (Standard 3:4 Proportions) */}
      <div className="relative w-full aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 shadow-sm mb-2.5">
        {coverSrc && !imageError ? (
          <img
            src={coverSrc}
            alt={`Cover of ${book.title}`}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          /* High-quality illustrated typographic fallback */
          <div className={`w-full h-full bg-gradient-to-br ${theme.headerBg} p-3 flex flex-col justify-between text-white relative`}>
            <div className="space-y-1">
              <span className="inline-block bg-black/35 backdrop-blur-xs text-[9px] font-mono px-1.5 py-0.5 rounded text-amber-200 font-bold">
                {book.deweyCode ? `DDC ${book.deweyCode}` : book.category}
              </span>
              <h4 className="font-display font-black text-xs leading-snug line-clamp-3 text-white">
                {book.title}
              </h4>
            </div>
            <div>
              <p className="text-[10px] text-white/85 italic font-serif line-clamp-1">
                by {book.author}
              </p>
            </div>
          </div>
        )}

        {/* 3D Book Spine Ambient Lighting */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-70 group-hover:opacity-85 transition-opacity pointer-events-none" />

        {/* Top Badges (Format & Distinction) */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {/* Format / Pill Badge */}
          {book.hasAudio ? (
            <span className="bg-purple-600/90 backdrop-blur-xs text-white text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-purple-400/40">
              <Headphones className="w-2.5 h-2.5" />
              <span>Audio</span>
            </span>
          ) : isTopRated ? (
            <span className="bg-amber-400/95 backdrop-blur-xs text-slate-950 text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-amber-300">
              <Sparkles className="w-2.5 h-2.5 text-slate-950" />
              <span>Top Pick</span>
            </span>
          ) : (
            <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-white/20">
              {book.ageRange || `DDC ${book.deweyCode || '800'}`}
            </span>
          )}

          {/* Availability Dot Indicator */}
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full backdrop-blur-xs shadow-xs ${
            isAvailable 
              ? 'bg-emerald-500/90 text-white border border-emerald-300/60' 
              : 'bg-rose-500/90 text-white border border-rose-300/60'
          }`}>
            {isAvailable ? `${book.availableCopies} Left` : 'Loaned'}
          </span>
        </div>

        {/* Quick View Hover Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-950/40 backdrop-blur-[2px] p-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="bg-white/95 hover:bg-white text-slate-900 font-extrabold text-[11px] px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            aria-label={`Quick view ${book.title}`}
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Quick View</span>
          </button>
        </div>

        {/* Bottom stats inside cover */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-bold pointer-events-none">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{book.rating || 4.9}</span>
          </div>
          <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] text-amber-200">
            {book.readsCount} reads
          </span>
        </div>
      </div>

      {/* Layer 4: Minimalist Card Typography (Clean Title & Author) */}
      <div className="space-y-1.5 flex-1 flex flex-col justify-between pt-0.5">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border truncate max-w-[120px] ${theme.badge}`}>
              {book.category.split('/')[0]}
            </span>
          </div>

          <h3 className="font-display font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug" title={book.title}>
            {book.title}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
            {book.author}
          </p>
        </div>

        {/* Progressive Disclosure Action Link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[9.5px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
            <span>Details</span>
          </span>

          {isBorrowable && onBorrow ? (
            <button
              type="button"
              disabled={!isAvailable}
              onClick={(e) => {
                e.stopPropagation();
                onBorrow();
              }}
              className={`px-2.5 py-1 rounded-full text-[10.5px] font-black transition flex items-center gap-1 shadow-2xs ${
                isAvailable 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <BookmarkCheck className="w-3 h-3" />
              <span>Borrow</span>
            </button>
          ) : (
            <span className="text-[10px] text-blue-600 font-bold group-hover:underline">
              Explore →
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
