/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { NavView } from '../types';
import { 
  BookOpen, 
  Search, 
  X, 
  Headphones, 
  LogIn,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onToggleSidebarMobile?: () => void;
  onToggleSidebarFold?: () => void;
  isFolded?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebarMobile,
  onToggleSidebarFold,
  isFolded,
}) => {
  const { 
    currentUser,
    setActiveView,
    searchQuery,
    setSearchQuery,
    books,
    syncPendingOfflineChanges,
    isSyncingOfflineChanges
  } = useApp();

  const navigate = useNavigate();

  // Search Popover state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Search filter matches
  const matchedBooks = searchQuery.trim()
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    setActiveView('BOOKSHELF');
    navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setIsSearchOpen(false);
    setActiveView('BOOKSHELF');
    navigate(`/catalog?q=${encodeURIComponent(tag)}`);
  };

  const handleSelectBook = (bookTitle: string) => {
    setSearchQuery(bookTitle);
    setIsSearchOpen(false);
    setActiveView('BOOKSHELF');
    navigate(`/catalog?q=${encodeURIComponent(bookTitle)}`);
  };

  const handleNavClick = (view: NavView, path: string) => {
    setActiveView(view);
    navigate(path);
    setIsSearchOpen(false);
  };

  // Quick subject tags for search overlay (academic & institutional)
  const popularTags = [
    { label: 'African Literature', query: 'African' },
    { label: 'STEM & Space', query: 'STEM' },
    { label: 'Classics', query: 'Classics' },
    { label: 'Audiobooks', query: 'Audio' },
    { label: 'Children\'s Fiction', query: 'Children' },
    { label: 'Coding & Tech', query: 'Coding' },
  ];

  return (
    <header className="sticky top-2 z-40 px-1.5 sm:px-3 w-full max-w-[90rem] mx-auto mb-4">
      {/* Main Clean Navbar Pill */}
      <div className="w-full h-16 rounded-2xl bg-white border border-slate-200 shadow-xs px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 transition-all">
        
        {/* ZONE A: Brand Logo + Sidebar Toggle (Left) */}
        <div className="flex items-center gap-2">
          {currentUser && (
            /* Mobile hamburger menu toggle */
            <button
              type="button"
              onClick={onToggleSidebarMobile}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Open Sidebar Navigation Menu"
              aria-label="Open Sidebar Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => handleNavClick('EXPLORE', currentUser ? '/dashboard' : '/')}
            className="flex items-center gap-2.5 cursor-pointer select-none group rounded-xl shrink-0 text-left outline-none"
            title="LibraryHub · Premier International School"
            aria-label="LibraryHub Home"
          >
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs flex items-center justify-center">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                Library<span className="text-blue-600">Hub</span>
              </span>
              <span className="font-sans text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                PREMIER INTERNATIONAL SCHOOL
              </span>
            </div>
          </button>
        </div>

        {/* ZONE B: Search Bar (ONLY VISIBLE WHEN LOGGED IN) */}
        {currentUser && (
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-3.5 text-slate-400 w-4 h-4 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                aria-label="Search Library Catalog"
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search catalog by title, author, subject, or DDC..."
                className="w-full pl-9.5 pr-8 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer rounded-full hover:bg-slate-200 transition"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Search Dropdown Overlay */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 space-y-3 overflow-hidden text-left"
                >
                  {/* Subject Tags */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-slate-700 px-1">
                      Explore Subjects
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {popularTags.map((tag) => (
                        <button
                          key={tag.label}
                          type="button"
                          onClick={() => handleTagClick(tag.query)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/80 rounded-lg text-[11px] font-medium text-slate-700 transition cursor-pointer"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Instant Book Results */}
                  {searchQuery.trim().length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
                        <span>Matching Titles ({matchedBooks.length})</span>
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          View all results →
                        </button>
                      </div>

                      {matchedBooks.length > 0 ? (
                        <div className="space-y-1">
                          {matchedBooks.map((book) => (
                            <div
                              key={book.id}
                              onClick={() => handleSelectBook(book.title)}
                              className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition group"
                            >
                              <div className="w-9 h-12 rounded bg-slate-100 overflow-hidden shadow-2xs shrink-0 border border-slate-200">
                                <img
                                  src={book.coverImage}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                                  {book.title}
                                </h4>
                                <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                    {book.category}
                                  </span>
                                  {book.hasAudio && (
                                    <span className="text-[9px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                      <Headphones className="w-2.5 h-2.5" /> Audio
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                book.availableCopies > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {book.availableCopies > 0 ? 'In Stock' : 'Loaned'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-500">
                          No titles found for "{searchQuery}". Press Enter to browse the full catalog.
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ZONE C: Action & User Profile Zone */}
        <div className="flex items-center gap-2">
          {/* Quick Member / Admin Access */}

          {/* PWA Install Button */}
          <PWAInstallButton variant="compact" />

          {/* Offline Sync Status & Manual Trigger */}
          <OfflineSyncIndicator onSyncNow={syncPendingOfflineChanges} isSyncing={isSyncingOfflineChanges} />
          
          {/* LOGGED OUT: Only a clean, prominent Sign In button */}
          {!currentUser ? (
            <button
              type="button"
              onClick={() => handleNavClick('LOGIN', '/login')}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
              aria-label="Sign In to School Library"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          ) : (
            /* LOGGED IN: Avatar button directly leading to /profile */
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="p-1 rounded-2xl hover:bg-slate-100 transition cursor-pointer select-none outline-none group flex items-center gap-2"
              title={`${currentUser.nickname || currentUser.name} · View & Edit Profile`}
              aria-label="View & Edit Profile"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs overflow-hidden border border-slate-200 group-hover:ring-2 group-hover:ring-blue-500/40 transition">
                {currentUser.avatar ? (
                  <img
                    key={currentUser.avatar}
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{(currentUser.nickname || currentUser.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
