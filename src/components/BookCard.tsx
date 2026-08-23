/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Book } from '../types';
import { Star, Headphones, BookmarkCheck, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onBorrow?: () => void;
  isBorrowable?: boolean;
}

// Color theme mapper for genre cards (GetEpic inspired friendly palettes)
const GENRE_COLORS: Record<string, { badge: string; border: string; glow: string; headerBg: string }> = {
  'African Literature': {
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    border: 'hover:border-amber-400',
    glow: 'group-hover:shadow-amber-500/20',
    headerBg: 'from-amber-600 to-yellow-700'
  },
  'Classics': {
    badge: 'bg-indigo-100 text-indigo-950 border-indigo-300',
    border: 'hover:border-indigo-400',
    glow: 'group-hover:shadow-indigo-500/20',
    headerBg: 'from-indigo-700 to-slate-900'
  },
  'Fantasy & Adventure': {
    badge: 'bg-teal-100 text-teal-950 border-teal-300',
    border: 'hover:border-teal-400',
    glow: 'group-hover:shadow-teal-500/20',
    headerBg: 'from-teal-600 to-emerald-800'
  },
  'Fantasy': {
    badge: 'bg-teal-100 text-teal-950 border-teal-300',
    border: 'hover:border-teal-400',
    glow: 'group-hover:shadow-teal-500/20',
    headerBg: 'from-teal-600 to-emerald-800'
  },
  'Children\'s Fiction': {
    badge: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    border: 'hover:border-emerald-400',
    glow: 'group-hover:shadow-emerald-500/20',
    headerBg: 'from-emerald-600 to-green-700'
  },
  'Comics & Humor': {
    badge: 'bg-orange-100 text-orange-950 border-orange-300',
    border: 'hover:border-orange-400',
    glow: 'group-hover:shadow-orange-500/20',
    headerBg: 'from-orange-500 to-amber-600'
  },
  'Humor / Children\'s': {
    badge: 'bg-orange-100 text-orange-950 border-orange-300',
    border: 'hover:border-orange-400',
    glow: 'group-hover:shadow-orange-500/20',
    headerBg: 'from-orange-500 to-amber-600'
  },
  'STEM & Space': {
    badge: 'bg-purple-100 text-purple-950 border-purple-300',
    border: 'hover:border-purple-400',
    glow: 'group-hover:shadow-purple-500/20',
    headerBg: 'from-purple-700 to-indigo-900'
  },
  'Science & Cosmos': {
    badge: 'bg-purple-100 text-purple-950 border-purple-300',
    border: 'hover:border-purple-400',
    glow: 'group-hover:shadow-purple-500/20',
    headerBg: 'from-purple-700 to-indigo-900'
  },
  'Coding & Tech': {
    badge: 'bg-cyan-100 text-cyan-950 border-cyan-300',
    border: 'hover:border-cyan-400',
    glow: 'group-hover:shadow-cyan-500/20',
    headerBg: 'from-cyan-700 to-blue-900'
  },
  'Philosophy & Ethics': {
    badge: 'bg-slate-100 text-slate-900 border-slate-300',
    border: 'hover:border-slate-400',
    glow: 'group-hover:shadow-slate-500/20',
    headerBg: 'from-slate-700 to-slate-900'
  },
};

export const BookCard: React.FC<BookCardProps> = ({ book, onClick, onBorrow, isBorrowable }) => {
  const [imageError, setImageError] = useState(false);
  const theme = GENRE_COLORS[book.category] || {
    badge: 'bg-slate-100 text-slate-900 border-slate-300',
    border: 'hover:border-blue-400',
    glow: 'group-hover:shadow-blue-500/20',
    headerBg: 'from-blue-600 to-slate-800'
  };

  const isAvailable = book.availableCopies > 0;

  return (
    <motion.div
      layout
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className={`group relative bg-white rounded-3xl border border-slate-200/80 p-3 sm:p-3.5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer ${theme.border} ${theme.glow}`}
      onClick={onClick}
    >
      {/* Cover Dominant Media Container (GetEpic Style) */}
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shadow-md mb-2.5">
        {book.coverImage && !imageError ? (
          <img
            src={book.coverImage}
            alt={book.title}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          /* High quality illustrated typographic cover fallback */
          <div className={`w-full h-full bg-gradient-to-br ${theme.headerBg} p-3.5 flex flex-col justify-between text-white relative`}>
            <div className="space-y-1">
              <span className="inline-block bg-black/30 backdrop-blur-xs text-[9px] font-mono px-1.5 py-0.5 rounded text-amber-200">
                {book.deweyCode ? `DDC ${book.deweyCode}` : book.category}
              </span>
              <h4 className="font-display font-extrabold text-xs leading-snug line-clamp-3 text-white">
                {book.title}
              </h4>
            </div>
            <div>
              <p className="text-[10px] text-white/80 italic font-serif line-clamp-1">
                by {book.author}
              </p>
            </div>
          </div>
        )}

        {/* 3D Spine Lighting Overlay */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 pointer-events-none"></div>

        {/* Audio / Read-To-Me Badge (GetEpic model) */}
        {book.hasAudio && (
          <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow-md">
            <Headphones className="w-2.5 h-2.5" />
            <span>Audio</span>
          </div>
        )}

        {/* Dewey / Age Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-white/20">
            {book.ageRange || `DDC ${book.deweyCode || '800'}`}
          </span>
        </div>

        {/* Bottom overlay inside cover: Rating & Reads Count */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[10px] font-bold">
          <div className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{book.rating || 4.9}</span>
          </div>
          <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] text-amber-200">
            {book.readsCount} reads
          </span>
        </div>
      </div>

      {/* Book Metadata */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Genre & Availability Badges */}
          <div className="flex items-center justify-between gap-1 flex-wrap mb-1">
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${theme.badge}`}>
              {book.category.split('/')[0]}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
              isAvailable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {isAvailable ? `${book.availableCopies} left` : 'Loaned'}
            </span>
          </div>

          <h3 className="font-display font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 leading-snug">
            {book.title}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
            {book.author}
          </p>

          {book.readingLevel && (
            <p className="text-[9px] font-mono text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded-full mt-1 font-bold">
              {book.readingLevel}
            </p>
          )}
        </div>

        {/* Action Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[9px] text-slate-400 font-mono">
            ISBN {book.isbn.slice(-5)}
          </div>

          <div className="flex items-center gap-1">
            {isBorrowable && onBorrow ? (
              <button
                type="button"
                disabled={!isAvailable}
                onClick={(e) => {
                  e.stopPropagation();
                  onBorrow();
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-black transition flex items-center gap-1 shadow-2xs ${
                  isAvailable 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <BookmarkCheck className="w-3 h-3" />
                <span>Borrow</span>
              </button>
            ) : (
              <div className="p-1 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
