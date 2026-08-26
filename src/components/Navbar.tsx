/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { NavView } from '../types';
import { 
  BookOpen, 
  Search, 
  X, 
  Headphones, 
  Star, 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  LogOut, 
  Sparkles, 
  ChevronDown, 
  Library, 
  TrendingUp, 
  ScanLine, 
  FilePlus, 
  Compass, 
  Award,
  ShieldAlert,
  LogIn,
  Flame,
  Globe,
  Rocket,
  Menu,
  Bell,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { 
    userRole,
    currentUser,
    isLearner,
    isStaff,
    isAdmin,
    isLoggedIn,
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
  const location = useLocation();

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

  // Nav link style helper
  const getNavPillClasses = (viewName: NavView, routePath: string) => {
    const isCurrent = activeView === viewName || location.pathname === routePath;
    return `px-3.5 py-1.5 rounded-full font-sans text-xs sm:text-sm font-extrabold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${
      isCurrent
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]'
        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
    }`;
  };

  // Quick genre discovery tags for search overlay
  const popularTags = [
    { label: 'Audiobooks', query: 'Audio', icon: Headphones },
    { label: 'African Heritage', query: 'African', icon: Globe },
    { label: 'STEM & Space', query: 'STEM', icon: Rocket },
    { label: 'Fantasy', query: 'Fantasy', icon: Flame },
    { label: 'Comics & Humor', query: 'Comics', icon: Sparkles },
    { label: 'Classics', query: 'Classics', icon: BookOpen },
  ];

  // User display metadata
  const userDisplayName = currentUser?.name || (isAdmin ? 'Librarian Alabi' : isStaff ? 'Faculty Member' : 'Young Scholar');
  const userInitial = userDisplayName.charAt(0).toUpperCase() || 'U';
  const userSubtext = isAdmin 
    ? 'Chief Librarian' 
    : isStaff 
    ? (currentUser?.department || 'Faculty Teacher') 
    : (currentUser?.gradeOrYear ? `Grade ${currentUser.gradeOrYear}` : 'Learner');

  return (
    <header className="sticky top-2 z-40 px-3 sm:px-6 max-w-7xl mx-auto my-2">
      {/* Main Pill Navbar Container (GetEpic Design) */}
      <div className="h-16 rounded-full bg-white border border-slate-200/90 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-all">
        
        {/* =========================================================
         * ZONE A: Brand Logo (Left)
         * ========================================================= */}
        <button
          type="button"
          onClick={() => handleNavClick('EXPLORE', '/')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl shrink-0 text-left outline-none"
          title="LibraryHub - Premier International School"
          aria-label="LibraryHub Home"
        >
          <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-blue-600 to-teal-500 group-hover:scale-105 rounded-2xl text-white shadow-md shadow-blue-500/20 flex items-center justify-center transition-transform">
            <BookOpen className="w-5 h-5 sm:w-5.5 sm:h-5.5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-base sm:text-lg tracking-tight text-slate-900 leading-none">
              Library<span className="text-blue-600">Hub</span>
            </span>
            <span className="font-sans text-[8.5px] sm:text-[9.5px] text-teal-600 font-extrabold tracking-widest uppercase mt-0.5">
              PREMIER INTERNATIONAL
            </span>
          </div>
        </button>

        {/* =========================================================
         * ZONE B: Global Search Pill (Center)
         * ========================================================= */}
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
              placeholder="Search by title, author, STEM, audiobooks..."
              className="w-full pl-9.5 pr-8 py-2 bg-slate-100/90 focus:bg-white border border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
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

          {/* Search Dropdown Overlay with Instant Autocomplete & Pill Tags */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-200 p-3.5 z-50 space-y-3 overflow-hidden text-left"
              >
                {/* Popular Discovery Tags */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider px-1">
                    POPULAR DISCOVERY TAGS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {popularTags.map((tag) => {
                      const TagIcon = tag.icon;
                      return (
                        <button
                          key={tag.label}
                          type="button"
                          onClick={() => handleTagClick(tag.query)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200/80 rounded-full text-[11px] font-bold text-slate-700 transition cursor-pointer"
                        >
                          <TagIcon className="w-3 h-3 text-blue-500" />
                          <span>{tag.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Instant Book Results */}
                {searchQuery.trim().length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
                      <span>MATCHING BOOKS ({matchedBooks.length})</span>
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-blue-600 hover:underline cursor-pointer"
                      >
                        See all results →
                      </button>
                    </div>

                    {matchedBooks.length > 0 ? (
                      <div className="space-y-1">
                        {matchedBooks.map((book) => (
                          <div
                            key={book.id}
                            onClick={() => handleSelectBook(book.title)}
                            className="flex items-center gap-3 p-2 hover:bg-blue-50/70 rounded-2xl cursor-pointer transition group"
                          >
                            <div className="w-10 h-13 rounded-lg bg-slate-100 overflow-hidden shadow-2xs shrink-0 border border-slate-200/60">
                              <img
                                src={book.coverImage}
                                alt={book.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                                {book.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full">
                                  {book.category}
                                </span>
                                {book.hasAudio && (
                                  <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Headphones className="w-2.5 h-2.5" /> Audio
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{book.rating || 4.9}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-500 font-medium">
                        No matches found for "{searchQuery}". Press Enter to search full catalog.
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =========================================================
         * ZONE C: Consolidated Primary Dropdown Navigation Menu
         * Logged Out Mode: Clean single "Log In" button (GetEpic style)
         * Logged In Mode: Role-aware pills + Master User Dropdown
         * ========================================================= */}
        <div className="flex items-center gap-2">
          
          {/* LOGGED OUT: Only a single, clean, prominent GetEpic-style Log In button */}
          {!currentUser ? (
            <button
              type="button"
              onClick={() => handleNavClick('LOGIN', '/login')}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-full shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none select-none"
              aria-label="Sign In to LibraryHub"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </button>
          ) : (
            <>
              {/* Quick-Access Top Pills (Large Screens - Logged In Only) */}
              <div className="hidden xl:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleNavClick('EXPLORE', '/')}
                  className={getNavPillClasses('EXPLORE', '/')}
                >
                  <Compass className="w-4 h-4" />
                  <span>Explore</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('BOOKSHELF', '/catalog')}
                  className={getNavPillClasses('BOOKSHELF', '/catalog')}
                >
                  <Library className="w-4 h-4" />
                  <span>{isLearner ? 'My Bookshelf' : 'Book Catalog'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('COMMUNITY', '/gallery')}
                  className={getNavPillClasses('COMMUNITY', '/gallery')}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Community</span>
                </button>
              </div>

              {/* Quick-Access Action for Logged In Learners */}
              {isLearner && (
                <button
                  type="button"
                  onClick={() => handleNavClick('SUBMIT', '/submit')}
                  className="hidden sm:flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-full px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <FilePlus className="w-3.5 h-3.5 text-amber-600" />
                  <span>Write Story</span>
                </button>
              )}

              {/* =======================================================
               * UNIFIED MASTER DROPDOWN NAVIGATION (Authenticated User)
               * ======================================================= */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="true"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className={`flex items-center gap-2 border rounded-full px-3 py-1.5 transition-all cursor-pointer focus-visible:ring-2 outline-none select-none ${
                    isAdmin 
                      ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900 focus-visible:ring-purple-500' 
                      : isStaff 
                      ? 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-900 focus-visible:ring-teal-500' 
                      : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900 focus-visible:ring-blue-500'
                  }`}
                  aria-label="Toggle Portal Navigation Menu"
                >
                  <div
                    className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0 ${
                      isAdmin 
                        ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                        : isStaff 
                        ? 'bg-gradient-to-tr from-teal-600 to-emerald-600' 
                        : 'bg-gradient-to-tr from-blue-600 to-teal-400'
                    }`}
                  >
                    {userInitial}
                  </div>

                  <div className="flex flex-col text-left pr-0.5">
                    <span className="text-xs font-extrabold text-slate-900 truncate max-w-[120px] sm:max-w-[140px] leading-tight flex items-center gap-1">
                      <span>{userDisplayName}</span>
                      {pendingSubmissionsCount > 0 && (isAdmin || isStaff) && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
                      )}
                    </span>
                    <span
                      className={`text-[8.5px] font-black uppercase tracking-wider ${
                        isAdmin 
                          ? 'text-purple-700' 
                          : isStaff 
                          ? 'text-teal-700' 
                          : 'text-blue-600'
                      }`}
                    >
                      {isAdmin 
                        ? 'Librarian Suite ▾' 
                        : isStaff 
                        ? 'Teacher Hub ▾' 
                        : 'Learner Menu ▾'}
                    </span>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Master Navigation Dropdown Popover */}
                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 space-y-3.5 text-left max-h-[85vh] overflow-y-auto"
                    >
                      {/* User Profile Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div
                          className={`w-11 h-11 rounded-2xl text-white flex items-center justify-center text-sm font-black shadow-md shrink-0 ${
                            isAdmin 
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                              : isStaff 
                              ? 'bg-gradient-to-tr from-teal-600 to-emerald-600' 
                              : 'bg-gradient-to-tr from-blue-600 to-teal-400'
                          }`}
                        >
                          {userInitial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                            {userDisplayName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium truncate">
                            {currentUser?.email || `${userDisplayName.toLowerCase().replace(/\s+/g, '')}@premier-school.edu`}
                          </div>
                          <div className="mt-0.5">
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block ${
                                isAdmin 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : isStaff 
                                  ? 'bg-teal-100 text-teal-800 border border-teal-200' 
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {userSubtext}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Learner Assigned Teacher Info if Available */}
                      {isLearner && currentUser?.assignedTeacherName && (
                        <div className="bg-teal-50 border border-teal-200/80 rounded-2xl p-2.5 text-xs text-teal-950 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-teal-700 shrink-0" />
                          <div>
                            <span className="font-bold text-[10px] uppercase tracking-wider block text-teal-800">
                              Assigned Mentor:
                            </span>
                            <span className="font-extrabold text-xs">{currentUser.assignedTeacherName}</span>
                          </div>
                        </div>
                      )}

                      {/* ===================================================
                       * SECTION 1: PUBLIC & DISCOVERY PAGES
                       * =================================================== */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider px-2">
                          EXPLORE & DISCOVERY
                        </div>

                        <button
                          type="button"
                          onClick={() => handleNavClick('EXPLORE', '/')}
                          className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                            activeView === 'EXPLORE' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-xl group-hover:scale-105 transition-transform">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-extrabold text-slate-900">Discovery Hub</span>
                            <span className="block text-[10px] text-slate-500">Visual carousels, audiobooks & picks</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('BOOKSHELF', '/catalog')}
                          className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                            activeView === 'BOOKSHELF' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="p-1.5 bg-teal-100 text-teal-700 rounded-xl group-hover:scale-105 transition-transform">
                            <Library className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-extrabold text-slate-900">
                              {isLearner ? 'My Bookshelf & Catalog' : 'Book Catalog & Inventory'}
                            </span>
                            <span className="block text-[10px] text-slate-500">Dewey decimal search & loan reservations</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('COMMUNITY', '/gallery')}
                          className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                            activeView === 'COMMUNITY' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="p-1.5 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition-transform">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-extrabold text-slate-900">Student Creative Gallery</span>
                            <span className="block text-[10px] text-slate-500">Published stories, poems & essays</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavClick('BULLETIN', '/announcements')}
                          className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                            activeView === 'BULLETIN' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl group-hover:scale-105 transition-transform">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="block font-extrabold text-slate-900">School Bulletin & Notices</span>
                            <span className="block text-[10px] text-slate-500">Library notices & literacy events</span>
                          </div>
                        </button>
                      </div>

                      {/* ===================================================
                       * SECTION 2: LEARNER SUITE (Learners only)
                       * =================================================== */}
                      {isLearner && (
                        <div className="space-y-1 pt-2 border-t border-slate-100">
                          <div className="text-[10px] font-mono font-black text-blue-600 uppercase tracking-wider px-2">
                            LEARNER SUITE
                          </div>

                          <button
                            type="button"
                            onClick={() => handleNavClick('SUBMIT', '/submit')}
                            className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'SUBMIT' ? 'bg-amber-50 text-amber-900' : 'hover:bg-amber-50/60 text-slate-800'
                            }`}
                          >
                            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-xl group-hover:scale-105 transition-transform">
                              <FilePlus className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-slate-900">Submit Creative Story</span>
                              <span className="block text-[10px] text-slate-500">Send story or poem to your teacher</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNavClick('ANALYTICS', '/analytics')}
                            className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'ANALYTICS' ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-emerald-50/60 text-slate-800'
                            }`}
                          >
                            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition-transform">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-slate-900">My Reading Stats & Badges</span>
                              <span className="block text-[10px] text-slate-500">Reading minutes, streaks & trophies</span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* ===================================================
                       * SECTION 3: TEACHER WORKSPACE (Staff Only)
                       * Strict RBAC: Staff does NOT have access to circulation
                       * desk or utilities, so those are NOT shown here!
                       * =================================================== */}
                      {isStaff && !isAdmin && (
                        <div className="space-y-1 pt-2 border-t border-teal-100">
                          <div className="text-[10px] font-mono font-black text-teal-700 uppercase tracking-wider px-2">
                            TEACHER WORKSPACE
                          </div>

                          <button
                            type="button"
                            onClick={() => handleNavClick('MODERATION', '/moderator')}
                            className={`w-full flex items-center justify-between p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'MODERATION' ? 'bg-teal-50 text-teal-900' : 'hover:bg-teal-50/70 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-teal-100 text-teal-700 rounded-xl group-hover:scale-105 transition-transform">
                                <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block font-extrabold text-slate-900">Story Moderation Queue</span>
                                <span className="block text-[10px] text-slate-500">Review student drafts & feedback</span>
                              </div>
                            </div>
                            {pendingSubmissionsCount > 0 && (
                              <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                {pendingSubmissionsCount} Pending
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNavClick('ANALYTICS', '/analytics')}
                            className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'ANALYTICS' ? 'bg-teal-50 text-teal-900' : 'hover:bg-teal-50/70 text-slate-800'
                            }`}
                          >
                            <div className="p-1.5 bg-teal-100 text-teal-700 rounded-xl group-hover:scale-105 transition-transform">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-slate-900">Classroom Literacy Analytics</span>
                              <span className="block text-[10px] text-slate-500">Class reading velocity & popular genres</span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* ===================================================
                       * SECTION 4: LIBRARIAN OPERATIONS (Admin Only)
                       * Full ILAS Circulation, Desk Utilities, Rosters
                       * =================================================== */}
                      {isAdmin && (
                        <div className="space-y-1 pt-2 border-t border-purple-100">
                          <div className="text-[10px] font-mono font-black text-purple-700 uppercase tracking-wider px-2">
                            LIBRARIAN ADMINISTRATIVE SUITE
                          </div>

                          <button
                            type="button"
                            onClick={() => handleNavClick('CIRCULATION', '/circulation')}
                            className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'CIRCULATION' ? 'bg-purple-50 text-purple-900' : 'hover:bg-purple-50/70 text-slate-800'
                            }`}
                          >
                            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-105 transition-transform">
                              <Library className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-slate-900">Circulation Desk (ILAS)</span>
                              <span className="block text-[10px] text-slate-500">Checkout, returns, renewals & holds</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNavClick('DESK_UTILITIES', '/desk-utilities')}
                            className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'DESK_UTILITIES' ? 'bg-purple-50 text-purple-900' : 'hover:bg-purple-50/70 text-slate-800'
                            }`}
                          >
                            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-105 transition-transform">
                              <ScanLine className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-slate-900">Desk Utilities & Overdue Mailer</span>
                              <span className="block text-[10px] text-slate-500">Barcode printer & overdue notices</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsRosterModalOpen(true);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold hover:bg-purple-50/70 text-slate-800 transition cursor-pointer text-left group"
                          >
                            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-105 transition-transform">
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-slate-900">Assign Students to Teachers</span>
                              <span className="block text-[10px] text-slate-500">Class roster cohort management</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNavClick('MODERATION', '/moderator')}
                            className={`w-full flex items-center justify-between p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'MODERATION' ? 'bg-purple-50 text-purple-900' : 'hover:bg-purple-50/70 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-105 transition-transform">
                                <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block font-extrabold text-slate-900">All-School Moderation</span>
                                <span className="block text-[10px] text-slate-500">Approve or request story revisions</span>
                              </div>
                            </div>
                            {pendingSubmissionsCount > 0 && (
                              <span className="bg-purple-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                {pendingSubmissionsCount}
                              </span>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleNavClick('ANALYTICS', '/analytics')}
                            className={`w-full flex items-center gap-3 p-2 rounded-2xl text-xs font-bold transition cursor-pointer text-left group ${
                              activeView === 'ANALYTICS' ? 'bg-purple-50 text-purple-900' : 'hover:bg-purple-50/70 text-slate-800'
                            }`}
                          >
                            <div className="p-1.5 bg-purple-100 text-purple-700 rounded-xl group-hover:scale-105 transition-transform">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="block font-extrabold text-slate-900">Library System Analytics</span>
                              <span className="block text-[10px] text-slate-500">Circulation reports & borrowing metrics</span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* ===================================================
                       * SECTION 5: ACCOUNT ACTIONS & SESSION (Log Out)
                       * =================================================== */}
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogoutClick}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-2xl text-xs transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Log Out ({userDisplayName})</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

        </div>

      </div>
    </header>
  );
};

