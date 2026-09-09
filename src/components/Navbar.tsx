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
  GraduationCap, 
  Users, 
  LogOut, 
  ChevronDown, 
  Library, 
  ScanLine, 
  ShieldAlert,
  LogIn,
  Bell,
  Home,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { 
    currentUser,
    isLearner,
    isStaff,
    isAdmin,
    activeView,
    setActiveView,
    searchQuery,
    setSearchQuery,
    setIsRosterModalOpen,
    submissions,
    books,
    logout 
  } = useApp();

  const navigate = useNavigate();

  // Dropdown / Popover states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Pending moderation submissions count
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pending').length;

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
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
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

  // User display metadata
  const userDisplayName = currentUser?.name || (isAdmin ? 'Chief Librarian' : isStaff ? 'Faculty Member' : 'Student Member');
  const userInitial = userDisplayName.charAt(0).toUpperCase() || 'U';
  const userSubtext = isAdmin 
    ? 'Chief Librarian' 
    : isStaff 
    ? (currentUser?.department || 'Faculty') 
    : (currentUser?.gradeOrYear ? `Grade ${currentUser.gradeOrYear}` : 'Student');

  return (
    <header className="sticky top-3 z-40 px-3 sm:px-6 w-full max-w-7xl mx-auto mb-6">
      {/* Main Clean Navbar Pill */}
      <div className="w-full h-16 rounded-2xl bg-white border border-slate-200 shadow-xs px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-6 transition-all">
        
        {/* ZONE A: Brand Logo (Left) */}
        <button
          type="button"
          onClick={() => handleNavClick('EXPLORE', '/')}
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
            /* LOGGED IN: Profile Menu Dropdown */
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-expanded={isMenuOpen}
                aria-haspopup="true"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer outline-none select-none"
                aria-label="Toggle Portal Navigation Menu"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                  {userInitial}
                </div>

                <div className="flex flex-col text-left pr-0.5">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[140px] leading-tight flex items-center gap-1">
                    <span>{userDisplayName}</span>
                    {pendingSubmissionsCount > 0 && (isAdmin || isStaff) && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                    )}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                    {userSubtext}
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Master Navigation Dropdown Popover */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 space-y-3 text-left max-h-[85vh] overflow-y-auto"
                  >
                    {/* User Profile Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                        {userInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {userDisplayName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium truncate">
                          {currentUser?.email || `${userDisplayName.toLowerCase().replace(/\s+/g, '')}@premier-school.edu`}
                        </div>
                        <div className="mt-0.5">
                          <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 inline-block">
                            {userSubtext}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Learner Assigned Teacher Info */}
                    {isLearner && currentUser?.assignedTeacherName && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider block">
                            Faculty Advisor:
                          </span>
                          <span className="font-bold text-xs text-slate-900">{currentUser.assignedTeacherName}</span>
                        </div>
                      </div>
                    )}

                    {/* SECTION 1: Core Navigation */}
                    <div className="space-y-1">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                        Library Navigation
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNavClick('EXPLORE', '/')}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                          activeView === 'EXPLORE' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Home className="w-4 h-4 text-slate-500" />
                        <span>Library Home</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavClick('BOOKSHELF', '/catalog')}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                          activeView === 'BOOKSHELF' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Library className="w-4 h-4 text-slate-500" />
                        <span>Catalog</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavClick('BULLETIN', '/announcements')}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                          activeView === 'BULLETIN' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Bell className="w-4 h-4 text-slate-500" />
                        <span>Library Notices</span>
                      </button>
                    </div>

                    {/* Optional Learner Reading Activities (Behind login only) */}
                    {isLearner && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                          Student Reading
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavClick('COMMUNITY', '/gallery')}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                            activeView === 'COMMUNITY' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 text-slate-500" />
                          <span>Student Work & Reviews</span>
                        </button>
                      </div>
                    )}

                    {/* SECTION 2: Staff / Teacher Workspace */}
                    {isStaff && !isAdmin && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                          Faculty Workspace
                        </div>

                        <button
                          type="button"
                          onClick={() => handleNavClick('MODERATION', '/moderator')}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                            activeView === 'MODERATION' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldAlert className="w-4 h-4 text-slate-500" />
                            <span>Review Queue</span>
                          </div>
                          {pendingSubmissionsCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {pendingSubmissionsCount}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* SECTION 3: Librarian Operations */}
                    {isAdmin && (
                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
                          Circulation Management
                        </div>

                        <button
                          type="button"
                          onClick={() => handleNavClick('CIRCULATION', '/circulation')}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                            activeView === 'CIRCULATION' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <Library className="w-4 h-4 text-slate-500" />
                          <span>Circulation Desk</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('DESK_UTILITIES', '/desk-utilities')}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                            activeView === 'DESK_UTILITIES' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <ScanLine className="w-4 h-4 text-slate-500" />
                          <span>Circulation Tools</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsRosterModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 transition cursor-pointer text-left"
                        >
                          <Users className="w-4 h-4 text-slate-500" />
                          <span>Class Rosters & Cohorts</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('MODERATION', '/moderator')}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                            activeView === 'MODERATION' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ShieldAlert className="w-4 h-4 text-slate-500" />
                            <span>Review Queue</span>
                          </div>
                          {pendingSubmissionsCount > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                              {pendingSubmissionsCount}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {/* SECTION 4: Log Out */}
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 hover:bg-rose-50 text-rose-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
