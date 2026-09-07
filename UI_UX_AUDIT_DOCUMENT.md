# Senior UI/UX Audit & Source Code Export

## `src/components/BookCard.tsx`

```tsx
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

```

---

## `src/components/AnnouncementBoard.tsx`

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';
import { Bell, Trophy, AlertTriangle, Calendar, Plus, X, Check, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AnnouncementBoard: React.FC = () => {
  const { announcements, isLibrarianLoggedIn, addAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | Announcement['category']>('all');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('info');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addAnnouncement(title, content, category);
    setTitle('');
    setContent('');
    setCategory('info');
    setShowForm(false);
  };

  const getIcon = (cat: Announcement['category']) => {
    switch (cat) {
      case 'achievement':
        return <Trophy className="w-5 h-5 text-amber-700" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-rose-700 animate-pulse" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-800" />;
    }
  };

  const getStyles = (cat: Announcement['category']) => {
    switch (cat) {
      case 'achievement':
        return 'bg-amber-50/80 border-2 border-amber-300 text-amber-950 shadow-xs';
      case 'alert':
        return 'bg-rose-50/80 border-2 border-rose-400 text-rose-950 shadow-xs ring-1 ring-rose-200';
      default:
        return 'bg-indigo-50/60 border-2 border-indigo-200 text-indigo-950 shadow-xs';
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    if (filterCategory === 'all') return true;
    return ann.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            School Bulletin & Notices
          </h2>
          <p className="text-sm text-slate-600">
            Official academic library bulletins, reading challenges, and student achievements.
          </p>
        </div>
        
        {isLibrarianLoggedIn && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel Notice' : 'Post New Notice'}
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {(['all', 'alert', 'achievement', 'info'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
              filterCategory === cat
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat === 'all' && '📢 All Notices'}
            {cat === 'alert' && '⚠️ Urgent Alerts'}
            {cat === 'achievement' && '🏆 Student Achievements'}
            {cat === 'info' && 'ℹ️ General Updates'}
          </button>
        ))}
      </div>

      {/* New Notice Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4 overflow-hidden"
          >
            <h3 className="font-display font-black text-sm text-slate-900">Publish a New School Notice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="notice-title" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Notice Title
                </label>
                <input
                  id="notice-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Book Fair Schedule"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="notice-category" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Notice Category
                </label>
                <select
                  id="notice-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                  className="w-full text-xs sm:text-sm font-bold border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-800"
                >
                  <option value="info">📢 Standard Update</option>
                  <option value="alert">⚠️ Urgent Warning / Deadline</option>
                  <option value="achievement">🏆 Student Achievement</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notice-content" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Notice Message
              </label>
              <textarea
                id="notice-content"
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the full details of the notice here..."
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                Publish Notice
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Announcements with ARIA live region */}
      <section 
        className="grid grid-cols-1 md:grid-cols-3 gap-5" 
        aria-live="polite" 
        aria-label="School Announcements Feed"
      >
        {filteredAnnouncements.map((ann, idx) => (
          <motion.article
            key={ann.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-3xl p-6 flex flex-col justify-between ${getStyles(ann.category)}`}
          >
            <div className="space-y-3.5">
              <div className="flex justify-between items-start gap-2">
                <div className="p-2.5 bg-white rounded-xl shadow-xs flex items-center justify-center border border-slate-200">
                  {getIcon(ann.category)}
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-600 uppercase flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-md border border-slate-200">
                  <Calendar className="w-3 h-3" />
                  {ann.date}
                </span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg leading-snug text-slate-950">{ann.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-800 font-medium">{ann.content}</p>
              </div>
            </div>

            {ann.category === 'alert' && (
              <div className="mt-4 pt-3 border-t border-rose-200/80 flex items-center justify-between text-[11px] font-bold text-rose-900">
                <span>Priority Notice</span>
                <span className="font-mono text-[10px] uppercase bg-rose-200/80 px-2 py-0.5 rounded">Action Required</span>
              </div>
            )}
          </motion.article>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="md:col-span-3 text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl p-6">
            <p className="font-display font-bold text-slate-700 text-sm">No announcements in this category</p>
          </div>
        )}
      </section>
    </div>
  );
};

```

---

## `src/components/Login.tsx`

```tsx
import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookOpen, ShieldAlert, Key, User, ArrowRight, Sparkles, ArrowLeftRight, Home, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  targetTab?: string;
  adminMode?: boolean;
}

export const Login: React.FC<LoginProps> = ({ targetTab, adminMode }) => {
  const { 
    setIsLibrarianLoggedIn, 
    setLoggedInLearner, 
    users,
    setActiveTab
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const redirectPath = searchParams.get('redirect');
  const isAdminPath = adminMode || location.pathname === '/admin' || searchParams.get('admin') === 'true';

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-fill Helpers
  const handleAutoFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  const handleAutoFillLearner = (cardId: string) => {
    setUsername(cardId);
    setPassword('password123');
    setError(null);
  };

  // Get readable tab name
  const getTabLabel = (tab?: string) => {
    switch (tab) {
      case 'catalog':
      case 'library':
        return 'Library Hub & Catalog';
      case 'gallery':
        return 'Creative Gallery';
      case 'analytics':
        return 'Library Analytics & Popular Trends';
      case 'submit':
        return 'Creative Submission Form';
      case 'moderator':
      case 'moderation':
        return 'Librarian Moderation Workspace';
      case 'desk':
      case 'desk-utilities':
        return 'Circulation Desk & Utilities';
      default:
        return 'Member Portal';
    }
  };

  // Resolve target route after login
  const resolveTargetRoute = (target?: string, isAdmin?: boolean): string => {
    if (redirectPath) return redirectPath;
    if (target) {
      if (target === 'catalog' || target === 'library') return '/catalog';
      if (target === 'gallery') return '/gallery';
      if (target === 'submit') return '/submit';
      if (target === 'moderator' || target === 'moderation') return '/moderator';
      if (target === 'desk' || target === 'desk-utilities') return '/desk-utilities';
      if (target === 'analytics') return '/analytics';
      if (target === 'announcements' || target === 'bulletin') return '/announcements';
    }
    return isAdmin ? '/moderator' : '/catalog';
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Please fill in both fields.');
      return;
    }

    if (isAdminPath) {
      // Admin Login
      if (
        (trimmedUsername.toLowerCase() === 'admin' || trimmedUsername.toLowerCase() === 'librarian') && 
        (trimmedPassword === 'admin123' || trimmedPassword === 'admin')
      ) {
        setIsLibrarianLoggedIn(true);
        setActiveTab(targetTab || 'moderation');
        navigate(resolveTargetRoute(targetTab, true));
      } else {
        setError('Invalid admin username or password. Check the credentials displayed above.');
      }
    } else {
      // Student/Staff Login
      const matchedUser = users.find(
        (u) => u.libraryCardId.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (matchedUser) {
        setLoggedInLearner(matchedUser);
        setActiveTab(targetTab || 'library');
        navigate(resolveTargetRoute(targetTab, false));
      } else {
        setError('Invalid Library Card ID. Please use one of the active accounts shown above.');
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 px-4 sm:px-6">
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Back to Public Home Button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-950 transition cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>← Back to Public Homepage</span>
          </button>

          {targetTab && targetTab !== 'home' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3 text-amber-700" />
              Sign in for {getTabLabel(targetTab)}
            </span>
          )}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 bg-gradient-to-tr from-indigo-900 to-slate-950 text-amber-400 rounded-2xl shadow-lg flex items-center justify-center border border-indigo-700/40">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight text-slate-900 leading-tight">
              PREMIER INTERNATIONAL
            </h2>
            <p className="font-sans text-xs text-indigo-900 font-black tracking-[0.2em] mt-0.5 uppercase">
              {isAdminPath ? 'Librarian & Admin Console' : 'Student & Staff Library Portal'}
            </p>
          </div>
        </div>

        {/* Informative Restricted Access Banner */}
        {targetTab && targetTab !== 'home' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 text-xs text-indigo-950 flex items-start gap-2.5 shadow-2xs">
            <Lock className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Access Protected:</span> The <span className="underline font-semibold">{getTabLabel(targetTab)}</span> and school library collections are reserved for enrolled students and authorized faculty.
            </div>
          </div>
        )}

        {/* Credentials Quick Access Helper Panel */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
            <h4 className="font-display font-black text-xs text-amber-950 uppercase tracking-wider">
              Quick Login & Profile Selection
            </h4>
          </div>

          {isAdminPath ? (
            <div className="space-y-2 text-xs text-amber-950">
              <p className="leading-relaxed text-xs">
                Click auto-fill to sign in with administrator credentials:
              </p>
              <div className="bg-white border border-amber-300 rounded-xl p-3 font-mono text-xs flex justify-between items-center">
                <div>
                  <div><span className="font-bold">Username:</span> admin</div>
                  <div><span className="font-bold">Password:</span> admin123</div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillAdmin}
                  className="bg-amber-700 text-white font-sans font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-amber-600 transition cursor-pointer"
                >
                  Auto-fill Admin
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-amber-950">
              <p className="leading-relaxed text-xs">
                Select any registered school profile to sign in:
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-white border border-amber-300 rounded-xl p-2.5 font-mono text-xs flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900">Chidi Okafor</span> (Grade 10 Student)
                    <div className="text-[10px] text-slate-600">Card ID: LIB-STUD-1001</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillLearner('LIB-STUD-1001')}
                    className="bg-indigo-950 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-indigo-900 transition cursor-pointer shrink-0"
                  >
                    Use Card
                  </button>
                </div>

                <div className="bg-white border border-amber-300 rounded-xl p-2.5 font-mono text-xs flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900">Mrs. Emily Cole</span> (Literature Teacher)
                    <div className="text-[10px] text-slate-600">Card ID: LIB-TEACH-2001</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillLearner('LIB-TEACH-2001')}
                    className="bg-emerald-800 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer shrink-0"
                  >
                    Use Card
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
          <div className="space-y-1">
            <h3 className="font-display font-black text-base sm:text-lg text-slate-900">
              {isAdminPath ? 'Staff Administration Sign In' : 'Student & Staff Member Sign In'}
            </h3>
            <p className="text-xs text-slate-600">
              {isAdminPath ? 'Enter librarian credentials to access management console.' : 'Enter your school library card ID to unlock the full library.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-950 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="login-username" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono">
                {isAdminPath ? 'Admin Username' : 'Library Card ID / Username'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  id="login-username"
                  type="text"
                  placeholder={isAdminPath ? "e.g. admin" : "e.g. LIB-STUD-1001"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 transition-all font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono">
                Password / Security PIN
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 transition-all font-mono text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-500 italic">
                {isAdminPath ? 'Default: admin123' : 'Default password: password123'}
              </p>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md ${
                isAdminPath 
                  ? 'bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-indigo-950' 
                  : 'bg-gradient-to-r from-indigo-900 to-indigo-950 hover:from-indigo-800 hover:to-indigo-900'
              }`}
            >
              <span>{isAdminPath ? 'Authenticate & Enter Console' : 'Sign In & Unlock Library'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Navigation Switch Bridge */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => navigate(isAdminPath ? '/login' : '/admin')}
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-900 hover:text-indigo-950 transition cursor-pointer py-2 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-700" />
            <span>Switch to {isAdminPath ? 'Student / Staff Login' : 'Librarian Admin Login'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};

```

---

## `src/components/RoleSwitchBanner.tsx`

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppRole } from '../types';
import { 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  Check, 
  Settings2, 
  UserCheck,
  BookOpen,
  Eye,
  UserX,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RoleSwitchBanner: React.FC = () => {
  const { 
    userRole, 
    setUserRole, 
    currentUser, 
    users, 
    switchRolePreset, 
    setIsRosterModalOpen,
    isAdmin,
    isStaff,
    isLearner,
    isLoggedIn
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);

  const learners = users.filter((u) => u.role === 'learner' || u.role === 'student');
  const teachers = users.filter((u) => u.role === 'staff' || u.role === 'teacher');

  const roleConfigs: {
    role: AppRole | 'GUEST';
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeColor: string;
    buttonColor: string;
  }[] = [
    {
      role: 'GUEST',
      title: 'Visitor / Guest (Logged Out)',
      description: 'Open public discovery, book browsing, and zero-friction login gateways',
      icon: UserX,
      accentColor: 'from-slate-600 to-slate-800',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      buttonColor: 'bg-slate-700 hover:bg-slate-600 text-white font-bold',
    },
    {
      role: 'LEARNER',
      title: 'Learner (Child)',
      description: 'Visual GetEpic-style discovery, audiobooks, personal loans, & creative writing publishing',
      icon: BookOpen,
      accentColor: 'from-blue-600 to-teal-500',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      role: 'STAFF',
      title: 'Staff (Teacher)',
      description: 'Classroom roster monitoring, review submissions from your assigned class, and student achievements',
      icon: GraduationCap,
      accentColor: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      role: 'ADMIN',
      title: 'Admin (Librarian)',
      description: 'Circulation desk, overdue notifications, roster assignment tool, catalog restocking & metrics',
      icon: ShieldCheck,
      accentColor: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      buttonColor: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black',
    },
  ];

  const currentConfig = !isLoggedIn 
    ? roleConfigs[0] 
    : roleConfigs.find((r) => r.role === userRole) || roleConfigs[1];

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Active Role Indicator */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-amber-400" /> Perspective:
            </span>
            
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                !isLoggedIn 
                  ? 'bg-slate-400' 
                  : userRole === 'ADMIN' 
                  ? 'bg-amber-400 animate-pulse' 
                  : userRole === 'STAFF' 
                  ? 'bg-emerald-400' 
                  : 'bg-blue-400'
              }`} />
              <span className="font-extrabold text-white text-xs">
                {currentConfig.title}
              </span>
              {currentUser && (
                <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">
                  — {currentUser.name} {currentUser.gradeOrYear ? `(${currentUser.gradeOrYear})` : currentUser.department ? `(${currentUser.department})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Quick Roster Modal Launcher for Admin / Staff */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsRosterModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-full font-bold text-[10px] tracking-wide transition cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Manage Class Rosters</span>
            </button>
          )}
        </div>

        {/* Role Quick Switch Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none justify-end">
          <span className="text-[10px] font-mono text-slate-400 uppercase hidden lg:inline mr-1">
            Simulate Role:
          </span>

          {roleConfigs.map((cfg) => {
            const isSelected = cfg.role === 'GUEST' ? !isLoggedIn : isLoggedIn && userRole === cfg.role;
            const CfgIcon = cfg.icon;
            return (
              <button
                key={cfg.role}
                type="button"
                onClick={() => switchRolePreset(cfg.role)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? `${cfg.buttonColor} shadow-sm ring-2 ring-white/20 font-black`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <CfgIcon className="w-3.5 h-3.5" />
                <span>
                  {cfg.role === 'GUEST' 
                    ? 'Logged Out' 
                    : cfg.role === 'LEARNER' 
                    ? 'Learners' 
                    : cfg.role === 'STAFF' 
                    ? 'Staff' 
                    : 'Admin'}
                </span>
              </button>
            );
          })}

          {/* Specific Persona Selector Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition cursor-pointer"
              title="Select specific person"
              aria-label="Select specific user profile"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu for Persona Picking */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-black uppercase text-slate-400">
                      Switch Active Persona
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Public Guest / Logged Out Option */}
                  <div
                    onClick={() => {
                      switchRolePreset('GUEST');
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-slate-100 transition ${
                      !isLoggedIn ? 'bg-slate-200 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserX className="w-3.5 h-3.5 text-slate-600" />
                      <div>
                        <span className="text-slate-900 font-semibold">Public Guest (Logged Out)</span>
                        <span className="block text-[10px] text-slate-500">Unauthenticated visitor view</span>
                      </div>
                    </div>
                  </div>

                  {/* Learners */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                      Learners (Students)
                    </span>
                    {learners.slice(0, 4).map((learner) => (
                      <div
                        key={learner.id}
                        onClick={() => {
                          switchRolePreset('LEARNER', learner.id);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-blue-50 transition ${
                          currentUser?.id === learner.id ? 'bg-blue-100/70 font-bold' : ''
                        }`}
                      >
                        <div>
                          <span className="text-slate-900 font-semibold">{learner.name}</span>
                          <span className="block text-[10px] text-slate-500">{learner.gradeOrYear || 'Learner'}</span>
                        </div>
                        {learner.assignedTeacherName && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {learner.assignedTeacherName.split(' ')[1] || 'Staff'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Teachers */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                      Staff (Teachers)
                    </span>
                    {teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        onClick={() => {
                          switchRolePreset('STAFF', teacher.id);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-emerald-50 transition ${
                          currentUser?.id === teacher.id ? 'bg-emerald-100/70 font-bold' : ''
                        }`}
                      >
                        <div>
                          <span className="text-slate-900 font-semibold">{teacher.name}</span>
                          <span className="block text-[10px] text-slate-500">{teacher.department || 'Faculty'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Admin */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
                      Librarian (Admin)
                    </span>
                    <div
                      onClick={() => {
                        switchRolePreset('ADMIN');
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-amber-50 transition ${
                        isLoggedIn && userRole === 'ADMIN' ? 'bg-amber-100/70 font-bold' : ''
                      }`}
                    >
                      <div>
                        <span className="text-slate-900 font-semibold">Librarian Abdul Alabi</span>
                        <span className="block text-[10px] text-slate-500">Chief Library Administrator</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
};

```

---

## `src/context/AppContext.tsx`

```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Book, CirculationRecord, StudentSubmission, Announcement, UserRole, AppRole, LibraryUser, User, NavView, BookHold, BookReview, HeroSpotlightData, CatalogViewMode } from '../types';
import { initialBooks, initialCirculation, initialSubmissions, initialAnnouncements, initialHeroSpotlight } from '../data';

export interface EmailLog {
  id: string;
  recipient: string;
  recipientEmail: string;
  subject: string;
  body: string;
  date: string;
  type: 'overdue' | 'lost' | 'general';
}

const pathToViewMap: Record<string, NavView> = {
  '/': 'EXPLORE',
  '/home': 'EXPLORE',
  '/catalog': 'BOOKSHELF',
  '/library': 'BOOKSHELF',
  '/gallery': 'COMMUNITY',
  '/moderator': 'MODERATION',
  '/moderation': 'MODERATION',
  '/circulation': 'CIRCULATION',
  '/desk-utilities': 'DESK_UTILITIES',
  '/desk': 'DESK_UTILITIES',
  '/analytics': 'ANALYTICS',
  '/announcements': 'BULLETIN',
  '/bulletin': 'BULLETIN',
  '/submit': 'SUBMIT',
  '/login': 'LOGIN',
  '/admin': 'LOGIN',
};

const viewToPathMap: Record<NavView, string> = {
  EXPLORE: '/',
  BOOKSHELF: '/catalog',
  COMMUNITY: '/gallery',
  BULLETIN: '/announcements',
  SUBMIT: '/submit',
  MODERATION: '/moderator',
  CIRCULATION: '/circulation',
  DESK_UTILITIES: '/desk-utilities',
  ANALYTICS: '/analytics',
  LOGIN: '/login',
};

interface AppContextType {
  // 3-Tier Role Management (Learners, Staff, Admin)
  userRole: AppRole;
  setUserRole: (role: AppRole) => void;
  currentUser: LibraryUser | null;
  setCurrentUser: (user: LibraryUser | User | null) => void;
  isLearner: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  switchRolePreset: (role: AppRole | 'GUEST', specificUserId?: string) => void;

  // View Navigation & Global Search Query
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Hero Spotlight & Catalog Discovery States
  spotlightData: HeroSpotlightData;
  updateHeroSpotlight: (newData: HeroSpotlightData) => void;
  catalogViewMode: CatalogViewMode;
  setCatalogViewMode: (mode: CatalogViewMode) => void;
  selectedBook: Book | null;
  setSelectedBook: React.Dispatch<React.SetStateAction<Book | null>>;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;

  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  books: Book[];
  circulation: CirculationRecord[];
  submissions: StudentSubmission[];
  announcements: Announcement[];
  currentLearnerName: string;
  setCurrentLearnerName: (name: string) => void;
  
  // Login & Session states
  isLibrarianLoggedIn: boolean;
  setIsLibrarianLoggedIn: (val: boolean) => void;
  loggedInLearner: LibraryUser | null;
  setLoggedInLearner: (user: LibraryUser | null) => void;
  currentPath: string;
  navigateTo: (path: string) => void;
  login: (user: User | LibraryUser) => void;
  logout: () => void;
  
  // Custom states and actions
  users: LibraryUser[];
  createUser: (userData: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryCardId'>) => LibraryUser;
  assignLearnerToTeacher: (learnerId: string, teacherId: string | null) => { success: boolean; message: string };
  assignMultipleLearnersToTeacher: (learnerIds: string[], teacherId: string) => { success: boolean; message: string };
  isRosterModalOpen: boolean;
  setIsRosterModalOpen: (val: boolean) => void;
  holds: BookHold[];
  createHold: (bookId: string, userId: string) => { success: boolean; message: string };
  releaseHold: (holdId: string) => void;
  addBookReview: (bookId: string, rating: number, comment: string) => void;
  flagBookAsLostOrMisplaced: (recordId: string, status: 'lost' | 'misplaced') => void;
  markBookAsReplaced: (recordId: string) => void;
  triggerOverdueEmail: (recordId: string) => { success: boolean; message: string };
  sendLostEmail: (recordId: string) => { success: boolean; message: string };
  emailLogs: EmailLog[];
  renewLoan: (recordId: string, days?: number) => { success: boolean; message: string };
  updateBookUsageType: (bookId: string, usageType: 'circulation' | 'reserve') => void;
  
  // Actions
  addBook: (book: Omit<Book, 'id' | 'readsCount'>) => void;
  checkoutBook: (bookId: string, learnerName: string, days?: number) => { success: boolean; message: string };
  returnBook: (recordId: string) => void;
  sendOverdueAlert: (recordId: string) => void;
  addSubmission: (title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  updateSubmission: (id: string, title: string, category: StudentSubmission['category'], content: string, imageUrl?: string) => void;
  approveSubmission: (id: string) => void;
  rejectSubmission: (id: string, feedback: string) => void;
  toggleLike: (id: string) => void;
  addComment: (submissionId: string, content: string, authorName?: string, rating?: number) => void;
  addAnnouncement: (title: string, content: string, category: Announcement['category']) => void;
  restockBook: (bookId: string, quantity: number) => void;
}

export const defaultAdminUser: LibraryUser = {
  id: 'user-admin-1',
  name: 'Librarian Abdul Alabi',
  role: 'admin',
  department: 'Library Administration & Curation',
  libraryCardId: 'LIB-ADMIN-0001',
  email: 'abdul.alabi@premier-international.edu',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  createdAt: '2025-09-01',
};

const initialUsers: LibraryUser[] = [
  {
    id: 'user-1',
    name: 'Chidi Okafor',
    role: 'learner',
    gradeOrYear: 'Year 9',
    libraryCardId: 'LIB-STUD-1001',
    email: 'chidi.okafor@school.edu',
    assignedTeacherId: 'user-5',
    assignedTeacherName: 'Mrs. Emily Cole',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-10',
  },
  {
    id: 'user-2',
    name: 'Amina Bello',
    role: 'learner',
    gradeOrYear: 'Primary 5',
    libraryCardId: 'LIB-STUD-1002',
    email: 'amina.bello@school.edu',
    assignedTeacherId: 'user-6',
    assignedTeacherName: 'Mr. David Mensah',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-12',
  },
  {
    id: 'user-3',
    name: 'Sarah J.',
    role: 'learner',
    gradeOrYear: 'Primary 4',
    libraryCardId: 'LIB-STUD-1003',
    email: 'sarah.j@school.edu',
    assignedTeacherId: 'user-5',
    assignedTeacherName: 'Mrs. Emily Cole',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-15',
  },
  {
    id: 'user-4',
    name: 'Tunde Williams',
    role: 'learner',
    gradeOrYear: 'Year 11',
    libraryCardId: 'LIB-STUD-1004',
    email: 'tunde.williams@school.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-18',
  },
  {
    id: 'user-7',
    name: 'Kemi Adebayo',
    role: 'learner',
    gradeOrYear: 'Year 8',
    libraryCardId: 'LIB-STUD-1005',
    email: 'kemi.adebayo@school.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-20',
  },
  {
    id: 'user-8',
    name: 'Daniel Okon',
    role: 'learner',
    gradeOrYear: 'Year 10',
    libraryCardId: 'LIB-STUD-1006',
    email: 'daniel.okon@school.edu',
    assignedTeacherId: 'user-6',
    assignedTeacherName: 'Mr. David Mensah',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-22',
  },
  {
    id: 'user-5',
    name: 'Mrs. Emily Cole',
    role: 'staff',
    department: 'English & Literature Department',
    libraryCardId: 'LIB-TEACH-2001',
    email: 'emily.cole@school.edu',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-05',
  },
  {
    id: 'user-6',
    name: 'Mr. David Mensah',
    role: 'staff',
    department: 'Science & STEM Department',
    libraryCardId: 'LIB-TEACH-2002',
    email: 'david.mensah@school.edu',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-08',
  },
  {
    id: 'user-9',
    name: 'Ms. Zainab Farooq',
    role: 'staff',
    department: 'Creative Arts & World Languages',
    libraryCardId: 'LIB-TEACH-2003',
    email: 'zainab.farooq@school.edu',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    createdAt: '2026-01-14',
  },
  defaultAdminUser,
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Normalized 3-Role State ('LEARNER' | 'STAFF' | 'ADMIN')
  const [userRole, setUserRoleState] = useState<AppRole>(() => {
    const saved = localStorage.getItem('p_app_role');
    if (saved === 'STAFF' || saved === 'ADMIN' || saved === 'LEARNER') return saved;
    const legacyRole = localStorage.getItem('p_role');
    const legacyLib = localStorage.getItem('p_lib_logged_in') === 'true';
    if (legacyLib || legacyRole === 'librarian' || legacyRole === 'admin') return 'ADMIN';
    return 'LEARNER';
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('p_role');
    return (saved as UserRole) || 'learner';
  });

  const [isLibrarianLoggedIn, setIsLibrarianLoggedInState] = useState<boolean>(() => {
    return localStorage.getItem('p_lib_logged_in') === 'true';
  });

  const [loggedInLearner, setLoggedInLearnerState] = useState<LibraryUser | null>(() => {
    const saved = localStorage.getItem('p_learner_logged_in');
    return saved ? JSON.parse(saved) : null;
  });

  const [currentUser, setCurrentUserState] = useState<LibraryUser | null>(() => {
    const saved = localStorage.getItem('p_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return null;
  });

  // Modal control for the Librarian Roster Tool
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname;
  });

  const [activeTab, setActiveTabState] = useState<string>(() => {
    const saved = localStorage.getItem('p_tab');
    return saved || 'home';
  });

  // Active View navigation state (GetEpic Model)
  const [activeView, setActiveViewState] = useState<NavView>(() => {
    const p = window.location.pathname;
    return pathToViewMap[p] || 'EXPLORE';
  });

  // Global Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Hero Spotlight State
  const [spotlightData, setSpotlightData] = useState<HeroSpotlightData>(() => {
    const saved = localStorage.getItem('p_hero_spotlight');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return initialHeroSpotlight;
  });

  const updateHeroSpotlight = (newData: HeroSpotlightData) => {
    setSpotlightData(newData);
    localStorage.setItem('p_hero_spotlight', JSON.stringify(newData));
  };

  // Catalog View Mode State ('CAROUSEL' | 'GRID')
  const [catalogViewMode, setCatalogViewMode] = useState<CatalogViewMode>('CAROUSEL');

  // Selected Category filter ('ALL', 'POPULAR', etc.)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Selected Book for Drawer/Modal
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('p_books_v3') || localStorage.getItem('p_books');
    if (saved) {
      try {
        const parsed: Book[] = JSON.parse(saved);
        // Merge with initialBooks so missing coverImages and new fields are populated
        return initialBooks.map(ib => {
          const matched = parsed.find(p => p.id === ib.id);
          return matched ? { ...ib, ...matched, coverImage: matched.coverImage || ib.coverImage } : ib;
        }).concat(parsed.filter(p => !initialBooks.some(ib => ib.id === p.id)));
      } catch {
        return initialBooks;
      }
    }
    return initialBooks;
  });

  const [circulation, setCirculation] = useState<CirculationRecord[]>(() => {
    const saved = localStorage.getItem('p_circulation');
    return saved ? JSON.parse(saved) : initialCirculation;
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    const saved = localStorage.getItem('p_submissions');
    return saved ? JSON.parse(saved) : initialSubmissions;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('p_announcements');
    return saved ? JSON.parse(saved) : initialAnnouncements;
  });

  const [users, setUsers] = useState<LibraryUser[]>(() => {
    const saved = localStorage.getItem('p_users_v3') || localStorage.getItem('p_users');
    if (saved) {
      try {
        const parsed: LibraryUser[] = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch {
        // fallback
      }
    }
    return initialUsers;
  });

  const [holds, setHolds] = useState<BookHold[]>(() => {
    const saved = localStorage.getItem('p_holds');
    return saved ? JSON.parse(saved) : [];
  });

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>(() => {
    const saved = localStorage.getItem('p_emaillogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentLearnerName, setCurrentLearnerName] = useState<string>(() => {
    return localStorage.getItem('p_learner_name') || 'Chidi Okafor (Year 9)';
  });

  // Derived role flags
  const isLoggedIn = currentUser !== null;
  const isLearner = isLoggedIn ? userRole === 'LEARNER' : false;
  const isStaff = isLoggedIn ? userRole === 'STAFF' : false;
  const isAdmin = isLoggedIn ? userRole === 'ADMIN' : false;

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('p_app_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('p_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('p_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('p_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    localStorage.setItem('p_circulation', JSON.stringify(circulation));
  }, [circulation]);

  useEffect(() => {
    localStorage.setItem('p_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('p_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem('p_users_v3', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('p_holds', JSON.stringify(holds));
  }, [holds]);

  useEffect(() => {
    localStorage.setItem('p_emaillogs', JSON.stringify(emailLogs));
  }, [emailLogs]);

  useEffect(() => {
    localStorage.setItem('p_learner_name', currentLearnerName);
  }, [currentLearnerName]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('p_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('p_current_user');
    }
  }, [currentUser]);

  // Set User Role synchronized
  const setUserRole = (role: AppRole) => {
    setUserRoleState(role);
    if (role === 'ADMIN') {
      setIsLibrarianLoggedInState(true);
      setCurrentRole('admin');
      setCurrentUserState(defaultAdminUser);
    } else if (role === 'STAFF') {
      setIsLibrarianLoggedInState(true);
      setCurrentRole('staff');
      const teacher = users.find(u => u.role === 'staff' || u.role === 'teacher') || initialUsers[6];
      setCurrentUserState(teacher);
      setLoggedInLearnerState(teacher);
    } else {
      setIsLibrarianLoggedInState(false);
      setCurrentRole('learner');
      const student = users.find(u => u.role === 'learner' || u.role === 'student') || initialUsers[0];
      setCurrentUserState(student);
      setLoggedInLearnerState(student);
      setCurrentLearnerName(`${student.name} (${student.gradeOrYear || 'Student'})`);
    }
  };

  const setCurrentUser = (user: LibraryUser | null) => {
    setCurrentUserState(user);
    if (user) {
      if (user.role === 'admin' || user.role === 'librarian') {
        setUserRoleState('ADMIN');
        setIsLibrarianLoggedInState(true);
        setCurrentRole('admin');
      } else if (user.role === 'staff' || user.role === 'teacher') {
        setUserRoleState('STAFF');
        setIsLibrarianLoggedInState(true);
        setCurrentRole('staff');
        setLoggedInLearnerState(user);
      } else {
        setUserRoleState('LEARNER');
        setIsLibrarianLoggedInState(false);
        setCurrentRole('learner');
        setLoggedInLearnerState(user);
        setCurrentLearnerName(`${user.name} (${user.gradeOrYear || 'Student'})`);
      }
    }
  };

  const switchRolePreset = (role: AppRole | 'GUEST', specificUserId?: string) => {
    if (role === 'GUEST') {
      logout();
      return;
    }
    if (specificUserId) {
      const found = users.find(u => u.id === specificUserId);
      if (found) {
        setCurrentUser(found);
        return;
      }
    }
    setUserRole(role);
  };

  const setIsLibrarianLoggedIn = (val: boolean) => {
    setIsLibrarianLoggedInState(val);
    localStorage.setItem('p_lib_logged_in', String(val));
    if (val) {
      setUserRoleState('ADMIN');
      setCurrentRole('admin');
      setCurrentUserState(defaultAdminUser);
    } else {
      setUserRoleState('LEARNER');
      setCurrentRole('learner');
    }
  };

  const setLoggedInLearner = (user: LibraryUser | null) => {
    setLoggedInLearnerState(user);
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem('p_learner_logged_in', JSON.stringify(user));
      const formattedName = (user.role === 'student' || user.role === 'learner')
        ? `${user.name} (${user.gradeOrYear || 'Scholar'})` 
        : `${user.name} (Teacher)`;
      setCurrentLearnerName(formattedName);
      if (user.role === 'staff' || user.role === 'teacher') {
        setUserRoleState('STAFF');
        setCurrentRole('staff');
        setIsLibrarianLoggedInState(true);
      } else if (user.role === 'admin' || user.role === 'librarian') {
        setUserRoleState('ADMIN');
        setCurrentRole('admin');
        setIsLibrarianLoggedInState(true);
      } else {
        setUserRoleState('LEARNER');
        setCurrentRole('learner');
        setIsLibrarianLoggedInState(false);
      }
    } else {
      localStorage.removeItem('p_learner_logged_in');
    }
  };

  const setActiveView = (view: NavView) => {
    setActiveViewState(view);
    const targetPath = viewToPathMap[view] || '/';
    setActiveTabState(view.toLowerCase());
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath(targetPath);
    }
  };

  const login = (user: User | LibraryUser) => {
    const roleStr = String(user.role).toUpperCase();
    const normRole: AppRole = (roleStr === 'ADMIN' || roleStr === 'LIBRARIAN')
      ? 'ADMIN'
      : (roleStr === 'STAFF' || roleStr === 'TEACHER')
      ? 'STAFF'
      : 'LEARNER';

    const avatar = ('avatarUrl' in user && user.avatarUrl) ? user.avatarUrl : ('avatar' in user ? user.avatar : undefined);
    const assignedTeacher = ('assignedStaffId' in user && user.assignedStaffId) ? user.assignedStaffId : ('assignedTeacherId' in user ? user.assignedTeacherId : undefined);

    const fullUser: LibraryUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normRole === 'ADMIN' ? 'admin' : normRole === 'STAFF' ? 'staff' : 'learner',
      gradeOrYear: user.gradeOrYear,
      department: user.department,
      libraryCardId: user.libraryCardId || `LIB-${user.id}`,
      avatar: avatar,
      assignedTeacherId: assignedTeacher,
      assignedTeacherName: user.assignedTeacherName,
      createdAt: user.createdAt || new Date().toISOString().split('T')[0],
    };

    setCurrentUser(fullUser);
    setUserRole(normRole);
    if (normRole === 'ADMIN' || normRole === 'STAFF') {
      setIsLibrarianLoggedInState(true);
    } else {
      setIsLibrarianLoggedInState(false);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setCurrentPath(path);
    if (pathToViewMap[path]) {
      setActiveViewState(pathToViewMap[path]);
    }
  };

  const logout = () => {
    setIsLibrarianLoggedInState(false);
    localStorage.removeItem('p_lib_logged_in');
    setLoggedInLearnerState(null);
    localStorage.removeItem('p_learner_logged_in');
    setCurrentUserState(null);
    setUserRoleState('LEARNER');
    setCurrentRole('learner');
    setActiveTabState('home');
    setActiveViewState('EXPLORE');
    if (window.location.pathname === '/admin' || window.location.pathname === '/login') {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath('/');
    }
  };

  // Assign Learner to Staff / Teacher
  const assignLearnerToTeacher = (learnerId: string, teacherId: string | null) => {
    const learner = users.find(u => u.id === learnerId);
    if (!learner) return { success: false, message: 'Learner record not found.' };

    let teacherName: string | undefined = undefined;
    if (teacherId) {
      const teacher = users.find(u => u.id === teacherId);
      if (!teacher) return { success: false, message: 'Teacher record not found.' };
      teacherName = teacher.name;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === learnerId) {
        return {
          ...u,
          assignedTeacherId: teacherId || undefined,
          assignedTeacherName: teacherName,
        };
      }
      return u;
    }));

    if (currentUser?.id === learnerId) {
      setCurrentUserState(prev => prev ? {
        ...prev,
        assignedTeacherId: teacherId || undefined,
        assignedTeacherName: teacherName,
      } : null);
    }

    const msg = teacherName 
      ? `Assigned ${learner.name} to ${teacherName} successfully.`
      : `Removed teacher assignment from ${learner.name}.`;

    return { success: true, message: msg };
  };

  // Batch assign learners to teacher
  const assignMultipleLearnersToTeacher = (learnerIds: string[], teacherId: string) => {
    const teacher = users.find(u => u.id === teacherId);
    if (!teacher) return { success: false, message: 'Staff member not found.' };

    setUsers(prev => prev.map(u => {
      if (learnerIds.includes(u.id)) {
        return {
          ...u,
          assignedTeacherId: teacher.id,
          assignedTeacherName: teacher.name,
        };
      }
      return u;
    }));

    return { 
      success: true, 
      message: `Assigned ${learnerIds.length} learners to ${teacher.name} successfully.` 
    };
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setCurrentPath(p);
      if (pathToViewMap[p]) {
        setActiveViewState(pathToViewMap[p]);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath === '/admin') {
      if (isLibrarianLoggedIn) {
        setCurrentRole('librarian');
      }
    } else {
      if (loggedInLearner) {
        setCurrentRole('learner');
      }
    }
  }, [currentPath, isLibrarianLoggedIn, loggedInLearner]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Actions implementation
  const addBook = (newBookData: Omit<Book, 'id' | 'readsCount'>) => {
    const newBook: Book = {
      ...newBookData,
      id: `book-${Date.now()}`,
      readsCount: 0,
    };
    setBooks((prev) => [newBook, ...prev]);
  };

  const checkoutBook = (bookId: string, learnerName: string, days = 14) => {
    const bookIndex = books.findIndex((b) => b.id === bookId);
    if (bookIndex === -1) {
      return { success: false, message: 'Book not found in the catalog.' };
    }

    const book = books[bookIndex];
    if (book.availableCopies <= 0) {
      return { success: false, message: `"${book.title}" is currently fully checked out.` };
    }

    // Update book available count
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, availableCopies: b.availableCopies - 1, readsCount: b.readsCount + 1 }
          : b
      )
    );

    // Calculate dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + days);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const newRecord: CirculationRecord = {
      id: `loan-${Date.now()}`,
      learnerName,
      bookId,
      bookTitle: book.title,
      borrowDate: formatDate(today),
      dueDate: formatDate(dueDate),
      status: 'borrowed',
      alertSent: false,
    };

    setCirculation((prev) => [newRecord, ...prev]);
    return { success: true, message: `Successfully checked out "${book.title}" to ${learnerName}. Due date: ${formatDate(dueDate)}` };
  };

  const returnBook = (recordId: string) => {
    const record = circulation.find((r) => r.id === recordId);
    if (!record || record.status === 'returned') return;

    // Update circulation record
    const todayStr = new Date().toISOString().split('T')[0];
    setCirculation((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, status: 'returned' as const, returnDate: todayStr }
          : r
      )
    );

    // Increment available copies back
    setBooks((prev) =>
      prev.map((b) =>
        b.id === record.bookId
          ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) }
          : b
      )
    );
  };

  const sendOverdueAlert = (recordId: string) => {
    setCirculation((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, alertSent: true } : r))
    );
  };

  const addSubmission = (
    title: string,
    category: StudentSubmission['category'],
    content: string,
    imageUrl?: string
  ) => {
    const authorName = currentRole === 'learner' ? currentLearnerName.split('(')[0].trim() : 'Guest Learner';
    const gradeOrYear = currentRole === 'learner' ? currentLearnerName.match(/\(([^)]+)\)/)?.[1] || 'Year 9' : 'Primary 6';

    const newSub: StudentSubmission = {
      id: `sub-${Date.now()}`,
      authorName,
      gradeOrYear,
      title,
      category,
      content,
      imageUrl,
      createdAt: new Date().toISOString(),
      status: 'pending', // Submissions always start as pending for review!
      likesCount: 0,
      comments: [],
    };

    setSubmissions((prev) => [newSub, ...prev]);
  };

  const updateSubmission = (
    id: string,
    title: string,
    category: StudentSubmission['category'],
    content: string,
    imageUrl?: string
  ) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              title,
              category,
              content,
              imageUrl,
              status: 'pending' as const, // Resubmitting sets it back to pending for review!
              createdAt: new Date().toISOString(),
            }
          : s
      )
    );
  };

  const approveSubmission = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'approved' as const } : s))
    );
  };

  const rejectSubmission = (id: string, feedback: string) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: 'rejected' as const, moderationFeedback: feedback } : s
      )
    );
  };

  const toggleLike = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const liked = !s.likedByCurrentUser;
        return {
          ...s,
          likedByCurrentUser: liked,
          likesCount: liked ? s.likesCount + 1 : Math.max(0, s.likesCount - 1),
        };
      })
    );
  };

  const addComment = (submissionId: string, content: string, authorName?: string, rating?: number) => {
    const commentAuthor = authorName || (currentRole === 'librarian' ? 'Librarian Alabi' : currentLearnerName.split('(')[0].trim());
    const newComment = {
      id: `c-${Date.now()}`,
      authorName: commentAuthor,
      content,
      createdAt: new Date().toISOString(),
      rating,
    };

    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;
        return {
          ...s,
          comments: [...s.comments, newComment],
        };
      })
    );
  };

  const addAnnouncement = (title: string, content: string, category: Announcement['category']) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      category,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);
  };

  const restockBook = (bookId: string, quantity: number) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? { ...b, totalCopies: b.totalCopies + quantity, availableCopies: b.availableCopies + quantity }
          : b
      )
    );
  };

  // 1. Create Student or Teacher by Librarian
  const createUser = (userData: Omit<LibraryUser, 'id' | 'createdAt' | 'libraryCardId'>) => {
    const cardId = userData.role === 'student' 
      ? `LIB-STUD-${Math.floor(1000 + Math.random() * 9000)}`
      : `LIB-TEACH-${Math.floor(2000 + Math.random() * 9000)}`;
    const newUser: LibraryUser = {
      ...userData,
      id: `user-${Date.now()}`,
      libraryCardId: cardId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setUsers(prev => [newUser, ...prev]);
    return newUser;
  };

  // 2. Holds: Reserve a book for 24h
  const createHold = (bookId: string, userId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return { success: false, message: 'Book not found.' };
    
    if (book.availableCopies < 1) {
      return { success: false, message: 'Holds can only be placed when at least 1 copy of the book is available.' };
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found.' };

    const alreadyHeldByUser = holds.some(h => h.bookId === bookId && h.userId === userId && h.status === 'active');
    if (alreadyHeldByUser) {
      return { success: false, message: 'You already have an active reserve hold on this book.' };
    }

    const today = new Date();
    const expiry = new Date();
    expiry.setHours(today.getHours() + 24);

    const formatDateTime = (date: Date) => {
      return date.toISOString().replace('T', ' ').substring(0, 19);
    };

    const newHold: BookHold = {
      id: `hold-${Date.now()}`,
      bookId,
      bookTitle: book.title,
      userId,
      userName: `${user.name} (${user.role === 'student' ? user.gradeOrYear : 'Teacher'})`,
      holdDate: formatDateTime(today),
      expiryDate: formatDateTime(expiry),
      status: 'active'
    };

    setHolds(prev => [newHold, ...prev]);

    // Decrease available copies by 1
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b));

    return { 
      success: true, 
      message: `24-Hour Hold successfully active! "${book.title}" is reserved for ${user.name} until ${formatDateTime(expiry)}.` 
    };
  };

  const releaseHold = (holdId: string) => {
    const hold = holds.find(h => h.id === holdId);
    if (!hold) return;

    setHolds(prev => prev.map(h => h.id === holdId ? { ...h, status: 'released' as const } : h));

    // Restore copy
    setBooks(prev => prev.map(b => b.id === hold.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b));
  };

  // 3. Ratings and Reviews for books
  const addBookReview = (bookId: string, rating: number, comment: string) => {
    const reviewerName = currentRole === 'librarian' ? 'Librarian Alabi' : currentLearnerName.split('(')[0].trim();
    const matchedUser = users.find(u => currentLearnerName.toLowerCase().includes(u.name.toLowerCase()));
    const reviewerRole = currentRole === 'librarian' ? 'librarian' as const : (matchedUser?.role || 'student');

    const newReview: BookReview = {
      id: `rev-${Date.now()}`,
      reviewerName,
      reviewerRole,
      rating,
      comment,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setBooks(prev => prev.map(b => {
      if (b.id !== bookId) return b;
      const reviews = b.reviews ? [...b.reviews, newReview] : [newReview];
      const avgRating = Math.round((reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length) * 10) / 10;
      return {
        ...b,
        reviews,
        rating: avgRating
      };
    }));
  };

  // 4. Lost & Misplaced & Replacement
  const flagBookAsLostOrMisplaced = (recordId: string, status: 'lost' | 'misplaced') => {
    setCirculation(prev => prev.map(r => r.id === recordId ? { ...r, status } : r));
  };

  const markBookAsReplaced = (recordId: string) => {
    const record = circulation.find(r => r.id === recordId);
    if (!record) return;

    setCirculation(prev => prev.map(r => r.id === recordId ? { ...r, status: 'returned' as const, isReplaced: true } : r));

    // Increase copies because it was replaced (restoring inventory!)
    setBooks(prev => prev.map(b => b.id === record.bookId ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) } : b));
  };

  const renewLoan = (recordId: string, days = 7) => {
    const record = circulation.find((r) => r.id === recordId);
    if (!record) return { success: false, message: 'Circulation record not found.' };

    const today = new Date();
    const newDueDate = new Date();
    newDueDate.setDate(today.getDate() + days);

    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setCirculation((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, status: 'borrowed' as const, dueDate: formatDate(newDueDate) }
          : r
      )
    );

    return {
      success: true,
      message: `Successfully renewed "${record.bookTitle}" loan. New due date is ${formatDate(newDueDate)}.`
    };
  };

  const updateBookUsageType = (bookId: string, usageType: 'circulation' | 'reserve') => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, usageType } : b))
    );
  };

  // 5. Automated simulated email dispatch
  const triggerOverdueEmail = (recordId: string) => {
    const record = circulation.find(r => r.id === recordId);
    if (!record) return { success: false, message: 'Record not found.' };

    const student = users.find(u => record.learnerName.includes(u.name));
    const studentEmail = student?.email || `${record.learnerName.toLowerCase().replace(/\s+/g, '')}@school.edu`;

    const newEmail: EmailLog = {
      id: `email-${Date.now()}`,
      recipient: record.learnerName,
      recipientEmail: studentEmail,
      subject: `⚠️ OVERDUE LIBRARY NOTICE: "${record.bookTitle}"`,
      body: `Dear ${record.learnerName.split('(')[0].trim()},\n\nOur system indicates that the book "${record.bookTitle}" borrowed on ${record.borrowDate} was due back on ${record.dueDate} and is now OVERDUE.\n\nPlease return it to the school library desk immediately to avoid penalty points.\n\nBest regards,\nPrimary & Secondary Library Administration`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'overdue'
    };

    setEmailLogs(prev => [newEmail, ...prev]);
    setCirculation(prev => prev.map(r => r.id === recordId ? { ...r, alertSent: true } : r));

    return { success: true, message: `Overdue alert notice sent to ${studentEmail} successfully!` };
  };

  const sendLostEmail = (recordId: string) => {
    const record = circulation.find(r => r.id === recordId);
    if (!record) return { success: false, message: 'Record not found.' };

    const student = users.find(u => record.learnerName.includes(u.name));
    const studentEmail = student?.email || `${record.learnerName.toLowerCase().replace(/\s+/g, '')}@school.edu`;

    const newEmail: EmailLog = {
      id: `email-${Date.now()}`,
      recipient: record.learnerName,
      recipientEmail: studentEmail,
      subject: `🚨 REPLACEMENT NOTICE: Lost Book "${record.bookTitle}"`,
      body: `Dear ${record.learnerName.split('(')[0].trim()},\n\nThe school library administration has flagged the book "${record.bookTitle}" borrowed by you as MISSING/LOST.\n\nPlease check your classroom and home. If it cannot be located, a replacement physical copy must be provided to the library desk so that we can mark it as replaced.\n\nWarm regards,\nLibrary Administration`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      type: 'lost'
    };

    setEmailLogs(prev => [newEmail, ...prev]);

    return { success: true, message: `Replacement notice email dispatched to ${studentEmail}!` };
  };

  return (
    <AppContext.Provider
      value={{
        userRole,
        setUserRole,
        currentUser,
        setCurrentUser,
        isLearner,
        isStaff,
        isAdmin,
        isLoggedIn,
        switchRolePreset,
        activeView,
        setActiveView,
        searchQuery,
        setSearchQuery,
        spotlightData,
        updateHeroSpotlight,
        catalogViewMode,
        setCatalogViewMode,
        selectedBook,
        setSelectedBook,
        selectedCategory,
        setSelectedCategory,
        currentRole,
        setCurrentRole,
        activeTab,
        setActiveTab,
        books,
        circulation,
        submissions,
        announcements,
        currentLearnerName,
        setCurrentLearnerName,
        isLibrarianLoggedIn,
        setIsLibrarianLoggedIn,
        loggedInLearner,
        setLoggedInLearner,
        currentPath,
        navigateTo,
        login,
        logout,
        users,
        createUser,
        assignLearnerToTeacher,
        assignMultipleLearnersToTeacher,
        isRosterModalOpen,
        setIsRosterModalOpen,
        holds,
        createHold,
        releaseHold,
        addBookReview,
        flagBookAsLostOrMisplaced,
        markBookAsReplaced,
        renewLoan,
        updateBookUsageType,
        triggerOverdueEmail,
        sendLostEmail,
        emailLogs,
        addBook,
        checkoutBook,
        returnBook,
        sendOverdueAlert,
        addSubmission,
        updateSubmission,
        approveSubmission,
        rejectSubmission,
        toggleLike,
        addComment,
        addAnnouncement,
        restockBook,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

```

---

## `src/types.ts`

```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'LEARNER' | 'STAFF' | 'ADMIN' | 'learner' | 'staff' | 'admin' | 'librarian' | 'student' | 'teacher';
export type AppRole = 'LEARNER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  avatar?: string;
  assignedStaffId?: string; // For Learners linked to a Teacher
  assignedTeacherId?: string;
  assignedTeacherName?: string;
  gradeOrYear?: string;
  department?: string;
  libraryCardId?: string;
  createdAt?: string;
}

export type NavView = 
  | 'EXPLORE' 
  | 'BOOKSHELF' 
  | 'COMMUNITY' 
  | 'BULLETIN'
  | 'SUBMIT'
  | 'MODERATION' 
  | 'CIRCULATION' 
  | 'DESK_UTILITIES' 
  | 'ANALYTICS' 
  | 'LOGIN';

export interface HeroSpotlightData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  featuredBookId: string;
  badgeText: string;
  bgGradient: string; // e.g., "from-blue-600 via-indigo-600 to-purple-600"
  coverUrl?: string;
}

export type CatalogViewMode = 'CAROUSEL' | 'GRID';

export interface BookReview {
  id: string;
  reviewerName: string;
  reviewerRole: 'student' | 'teacher' | 'librarian' | 'learner' | 'staff' | 'admin';
  rating: number; // 1-5 stars
  comment: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  description: string;
  summary?: string;
  coverImage?: string;
  coverUrl?: string;
  readsCount: number;
  deweyClass: string; // e.g. "000", "500", "800"
  deweyCode: string;  // e.g. "005.1", "523.1", "813"
  callNumber?: string;
  reviews?: BookReview[];
  rating?: number; // Average star rating
  usageType?: 'circulation' | 'reserve'; // 'circulation' = can be borrowed, 'reserve' = library use only
  ageRange?: string; // e.g. "Ages 8-12", "All Ages", "Young Adult"
  readingLevel?: string; // e.g. "Lexile 740L", "AR 4.8"
  pageCount?: number;
  themeColor?: string; // Accent styling for card
  hasAudio?: boolean;
  isAudiobook?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isTeacherPick?: boolean;
}

export interface ReaderAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number; // 0 - 100
  target: number;
  current: number;
  category: 'books' | 'streak' | 'creative' | 'genres';
}

export type CirculationStatus = 'borrowed' | 'returned' | 'overdue' | 'lost' | 'misplaced';

export interface CirculationRecord {
  id: string;
  learnerName: string;
  bookId: string;
  bookTitle: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: CirculationStatus;
  alertSent: boolean;
  isReplaced?: boolean;
}

export interface LibraryUser {
  id: string;
  name: string;
  role: 'learner' | 'staff' | 'admin' | 'student' | 'teacher' | 'librarian';
  gradeOrYear?: string; // e.g., 'Year 9', 'Primary 5'
  department?: string;  // e.g., 'English Department', 'Science Department'
  libraryCardId: string; // e.g. 'LIB-STUD-1001'
  email: string;
  avatar?: string;
  assignedTeacherId?: string; // ID of assigned teacher/advisor
  assignedTeacherName?: string; // Name of assigned teacher/advisor
  createdAt: string;
}

export interface BookHold {
  id: string;
  bookId: string;
  bookTitle: string;
  userId: string;
  userName: string;
  holdDate: string;
  expiryDate: string; // 24 hours later
  status: 'active' | 'claimed' | 'released';
}

export type SubmissionCategory = 
  | 'short-story' 
  | 'poetry' 
  | 'academic-essay' 
  | 'digital-art' 
  | 'audio-podcast' 
  | 'video-multimedia';

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  rating?: number; // Peer rating out of 5 stars
}

export interface StudentSubmission {
  id: string;
  authorName: string;
  gradeOrYear: string;
  title: string;
  category: SubmissionCategory;
  content: string; // Text content or description
  imageUrl?: string; // Optional image URL for digital art or cover
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  moderationFeedback?: string;
  likesCount: number;
  likedByCurrentUser?: boolean;
  comments: Comment[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'info' | 'alert' | 'achievement';
}

```

---

# UI pain points from current implementation

### 1. Hardcoded texts that frame this as a creative publishing platform instead of a focused school library
- **"creative writing publishing"** (`src/components/RoleSwitchBanner.tsx` line 65) — Describes the student role in terms of digital publishing and content distribution rather than academic library resource access and circulation.
- **"Creative Gallery" / "Student Creative Gallery"** (`src/components/Login.tsx` line 52, `src/components/Navbar.tsx`, `src/components/HomeDiscoveryHub.tsx`) — Mischaracterizes a school library index as an open art/media hosting platform.
- **"Creative Submission Form" / "Publish Creative Work"** (`src/components/Login.tsx` line 56, `src/components/HomeDiscoveryHub.tsx`) — Uses publishing terminology ("Publish Creative Work", "Submission Form") instead of school library functions like "Book Recommendations", "Reading Log", or "Acquisition Requests".
- **"Audio Podcasts, Digital Art, Stories & Essays"** (`src/components/HomeDiscoveryHub.tsx`) — Subtitle framing the gallery around multimedia creation rather than library literature and academic study materials.
- **"likesCount", "likedByCurrentUser", "comments with peer rating"** (`src/types.ts` lines 149–171) — Social media and blogging architecture embedded into student models instead of academic library records.
- **"Librarian Moderation Workspace"** (`src/components/Login.tsx` line 59, `src/components/Navbar.tsx`) — Terms the librarian's role as a content moderator for user posts rather than a curator of school collection circulation and inventory.

### 2. Homepage gamification elements, fake metrics, XP, streaks, trophy language, and anything that could reduce trust
- **Synthetic Read Counts on Cards** (`src/components/BookCard.tsx` line 174: `{book.readsCount} reads`) — Displays hardcoded numbers (e.g., "142 reads", "89 reads") with no connection to real circulation loans, immediately undermining institutional credibility for school administrators.
- **Default 4.9 Star Ratings** (`src/components/BookCard.tsx` line 171: `{book.rating || 4.9}`) — Hardcodes a default 4.9 star rating with a glowing gold star across every book card before any real reviews are submitted.
- **Arbitrary "Top Pick" Sparkle Badges** (`src/components/BookCard.tsx` lines 130–135) — Displays an automated promotional "Top Pick" badge based on arbitrary readsCount thresholds (>100) or hardcoded rating scores (>=4.8).
- **Trophy & Achievement Filters** (`src/components/AnnouncementBoard.tsx` lines 9, 34, 45, 97: `Trophy`, `🏆 Student Achievements`) — Frames school library bulletins around awards and competitions rather than operational notices, reading schedules, and facility hours.
- **"ReaderAchievement" Schema** (`src/types.ts` lines 89–99: `category: 'books' | 'streak' | 'creative' | 'genres'`) — Legacy gamification schema remnants featuring daily streaks and XP metrics.
- **"Penalty Points" Language** (`src/context/AppContext.tsx` line 1082) — Generates threatening notification copy: *"Please return it to the school library desk immediately to avoid penalty points."*

### 3. Landing-page elements visible before login that compete with the primary goal of getting learners/staff signed in quickly
- **Full Interactive Catalog & Audio Carousels** (`src/components/HomeDiscoveryHub.tsx`) — The public unauthenticated homepage presents complete visual carousels, book quick-views, search bars, and audio player badges that invite unfocused browsing while blocking actual borrowing until a student signs in.
- **Multi-media Student Creative Feed** (`src/components/HomeDiscoveryHub.tsx`) — Displays student submissions, likes, and creative pieces directly on the public index, which competes with school identity verification and student data privacy.
- **Promotional Hero Carousel with Multiple Competing CTAs** (`src/components/HomeDiscoveryHub.tsx`) — Hero banner spotlight features large action buttons ("Start Reading", "Explore Audiobooks", "Borrow") that redirect to login modals upon click instead of providing a direct, friction-free login gateway upfront.
- **Multi-Level Bulletin Board** (`src/components/AnnouncementBoard.tsx`) — Category filtering (Urgent Alerts, Achievements, General Updates) embedded on the homepage before user authentication, diverting attention from sign-in.

### 4. Role-switching or demo/testing UI that should not be in production
- **Global `RoleSwitchBanner` Component** (`src/components/RoleSwitchBanner.tsx`) — Renders a prominent persistent dark banner across the top of every screen on the site.
- **Instant Role Simulation Buttons** (`src/components/RoleSwitchBanner.tsx` lines 140–173) — Buttons (`Logged Out`, `Learners`, `Staff`, `Admin`) allowing anyone visiting the web application to switch authorization roles with a single click.
- **Unrestricted Persona Impersonation Dropdown** (`src/components/RoleSwitchBanner.tsx` lines 175–304) — Lets any user immediately assume the identity of named students (e.g., Chidi Okafor, Amina Bello) or faculty members without entering credentials.
- **"Quick Login & Profile Selection" Helper Card** (`src/components/Login.tsx` lines 180–245) — Exposes explicit production login credentials directly on the login form:
  - *"Username: admin | Password: admin123"* with a 1-click "Auto-fill Admin" button.
  - One-click "Use Card" buttons for student Chidi Okafor (`LIB-STUD-1001`) and literature teacher Mrs. Emily Cole (`LIB-TEACH-2001`).
  - Cleartext hints displaying *"Default: admin123"* and *"Default password: password123"*.
- **Admin Modal Shortcuts in Navbar** (`src/components/Navbar.tsx`, `src/components/RoleSwitchBanner.tsx`) — Roster manager and quick circulation buttons surfaced unconditionally.

### 5. Route labels/navigation items that should be renamed for a school library context
- **`/gallery` (`COMMUNITY`)** — Currently labeled *"Creative Gallery"* or *"Community"*. Should be renamed to **"Recommended Reading"**, **"Curated Lists"**, or **"Student Book Reviews"**.
- **`/submit` (`SUBMIT`)** — Currently labeled *"Submit Creative Piece"* or *"Creative Submission Form"*. Should be renamed to **"Suggest a Purchase"**, **"Submit Book Review"**, or **"Reading Log Entry"**.
- **`/moderator` (`MODERATION`)** — Currently labeled *"Librarian Moderation Workspace"*. Should be renamed to **"Librarian Desk"**, **"Catalog Management"**, or **"Acquisitions & Review"**.
- **`/desk-utilities` (`DESK_UTILITIES`)** — Currently labeled *"Circulation Desk & Utilities"*. Should be streamlined to **"Circulation Desk"** or **"Holds & Circulation"**.
- **`EXPLORE` (`/`) vs `BOOKSHELF` (`/catalog`)** — Currently separates the homepage into "Explore" and the library into "Library Hub & Catalog". Should be standardized to **"Library Home"** and **"Catalog Search"**.

