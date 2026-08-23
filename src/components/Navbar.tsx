/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Home, 
  Library, 
  Image, 
  FilePlus, 
  ShieldAlert, 
  TrendingUp, 
  ScanLine, 
  LogOut, 
  LogIn,
  Bell,
  Sparkles,
  Search,
  X,
  Headphones,
  Star,
  User,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { 
    currentRole, 
    isLibrarianLoggedIn, 
    loggedInLearner, 
    logout,
    books 
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = Boolean(isLibrarianLoggedIn || loggedInLearner);

  // Search state & autocomplete dropdown
  const [navSearch, setNavSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter books matching search
  const matchedBooks = navSearch.trim()
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(navSearch.toLowerCase()) ||
          b.author.toLowerCase().includes(navSearch.toLowerCase()) ||
          b.category.toLowerCase().includes(navSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      setIsSearchOpen(false);
      navigate(`/catalog?q=${encodeURIComponent(navSearch.trim())}`);
    }
  };

  const handleSelectBook = (bookId: string) => {
    setIsSearchOpen(false);
    setNavSearch('');
    navigate(`/catalog?q=${encodeURIComponent(books.find(b => b.id === bookId)?.title || '')}`);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-extrabold'
        : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
    }`;

  const staffLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
      isActive
        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
        : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100'
    }`;

  return (
    <header className="sticky top-2 z-40 px-2 sm:px-4 max-w-7xl mx-auto my-1">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-lg border border-slate-200/80 px-4 sm:px-6 py-2.5 transition-all">
        <nav aria-label="Main Navigation" className="flex items-center justify-between gap-3 sm:gap-4">
          
          {/* Brand/Logo - GetEpic Inspired Friendly Look */}
          <NavLink 
            to="/"
            className="flex items-center gap-2.5 cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl shrink-0"
            title="Premier International School - Library Hub Home"
            aria-label="Premier International School Library Home"
          >
            <div className="p-2 sm:p-2.5 bg-gradient-to-tr from-blue-600 to-teal-500 group-hover:scale-105 rounded-2xl text-white shadow-md shadow-blue-500/20 flex items-center justify-center transition-transform">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm sm:text-lg tracking-tight text-slate-900 leading-none">
                LIBRARY<span className="text-blue-600">HUB</span>
              </span>
              <span className="font-sans text-[9px] sm:text-[10px] text-teal-600 font-extrabold tracking-widest uppercase mt-0.5">
                PREMIER INTERNATIONAL
              </span>
            </div>
          </NavLink>

          {/* Centralized Search Bar with Instant Autocomplete (GetEpic Style) */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-md hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={navSearch}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => {
                  setNavSearch(e.target.value);
                  setIsSearchOpen(true);
                }}
                placeholder="Search by title, author, STEM, audiobooks..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100/90 focus:bg-white border border-transparent focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-full text-xs font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition-all"
              />
              {navSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setNavSearch('');
                    setIsSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Autocomplete Overlay Dropdown */}
            <AnimatePresence>
              {isSearchOpen && navSearch.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 z-50 space-y-2 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-2">
                    <span>MATCHING DISCOVERIES ({matchedBooks.length})</span>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      See all results →
                    </button>
                  </div>

                  {matchedBooks.length > 0 ? (
                    <div className="space-y-1.5">
                      {matchedBooks.map((book) => (
                        <div
                          key={book.id}
                          onClick={() => handleSelectBook(book.id)}
                          className="flex items-center gap-3 p-2 hover:bg-blue-50/70 rounded-xl cursor-pointer transition group"
                        >
                          <div className="w-10 h-13 rounded-lg bg-slate-100 overflow-hidden shadow-xs shrink-0">
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
                    <div className="p-4 text-center text-xs text-slate-500 font-medium">
                      No books found matching "{navSearch}". Press Enter to search catalog.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Navigation Links (Pill Style) */}
          <div className="hidden lg:flex items-center gap-1.5">
            <NavLink to="/" end className={navLinkClasses}>
              <Home className="w-4 h-4" />
              <span>Discover</span>
            </NavLink>

            <NavLink to="/catalog" className={navLinkClasses}>
              <Library className="w-4 h-4" />
              <span>Catalog</span>
            </NavLink>

            <NavLink to="/gallery" className={navLinkClasses}>
              <Image className="w-4 h-4" />
              <span>Gallery</span>
            </NavLink>

            <NavLink to="/announcements" className={navLinkClasses}>
              <Bell className="w-4 h-4" />
              <span>Bulletin</span>
            </NavLink>

            <NavLink 
              to="/submit"
              className={({ isActive }) => 
                `flex items-center gap-1 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold tracking-wide transition-all shadow-xs ${
                  isActive 
                    ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 font-black' 
                    : 'bg-amber-300/80 hover:bg-amber-300 text-slate-950'
                }`
              }
            >
              <FilePlus className="w-4 h-4" />
              <span>Submit</span>
            </NavLink>

            {/* Staff Navigation Group */}
            {isLibrarianLoggedIn && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-full ml-1">
                <span className="text-[9px] font-mono font-black text-amber-800 uppercase px-1">
                  Staff:
                </span>
                <NavLink to="/moderator" className={staffLinkClasses}>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Moderate</span>
                </NavLink>
                <NavLink to="/desk-utilities" className={staffLinkClasses}>
                  <ScanLine className="w-3.5 h-3.5" />
                  <span>Desk</span>
                </NavLink>
                <NavLink to="/analytics" className={staffLinkClasses}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Metrics</span>
                </NavLink>
              </div>
            )}

            {!isLibrarianLoggedIn && (
              <NavLink to="/analytics" className={navLinkClasses}>
                <TrendingUp className="w-4 h-4" />
                <span>Stats</span>
              </NavLink>
            )}
          </div>

          {/* User Session / Profile Capsule */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-full pl-2 pr-1.5 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-teal-400 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    {isLibrarianLoggedIn ? 'LA' : loggedInLearner?.name.charAt(0) || 'U'}
                  </div>
                  <div className="hidden xl:flex flex-col text-left pr-1">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">
                      {isLibrarianLoggedIn ? 'Librarian Alabi' : loggedInLearner?.name}
                    </span>
                    <span className="text-[9px] font-bold text-blue-600 uppercase">
                      {isLibrarianLoggedIn ? 'Faculty Staff' : loggedInLearner?.gradeOrYear || 'Scholar'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-full shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </nav>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div 
        role="navigation" 
        aria-label="Mobile Navigation" 
        className="lg:hidden flex justify-around bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200 mt-2 py-2 px-2 text-[10px] font-bold tracking-wider overflow-x-auto scrollbar-none"
      >
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-blue-600 font-black' : 'text-slate-600'}`}
        >
          <Home className="w-4 h-4" />
          <span>DISCOVER</span>
        </NavLink>

        <NavLink 
          to="/catalog" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-blue-600 font-black' : 'text-slate-600'}`}
        >
          <Library className="w-4 h-4" />
          <span>CATALOG</span>
        </NavLink>

        <NavLink 
          to="/gallery" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-blue-600 font-black' : 'text-slate-600'}`}
        >
          <Image className="w-4 h-4" />
          <span>GALLERY</span>
        </NavLink>

        <NavLink 
          to="/submit" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-amber-600 font-black' : 'text-slate-600'}`}
        >
          <FilePlus className="w-4 h-4" />
          <span>SUBMIT</span>
        </NavLink>

        {isLibrarianLoggedIn ? (
          <>
            <NavLink 
              to="/moderator" 
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-blue-600 font-black' : 'text-slate-600'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>MODERATE</span>
            </NavLink>
            <NavLink 
              to="/desk-utilities" 
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-blue-600 font-black' : 'text-slate-600'}`}
            >
              <ScanLine className="w-4 h-4" />
              <span>DESK</span>
            </NavLink>
          </>
        ) : (
          <NavLink 
            to="/analytics" 
            className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition ${isActive ? 'text-blue-600 font-black' : 'text-slate-600'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>STATS</span>
          </NavLink>
        )}
      </div>
    </header>
  );
};

