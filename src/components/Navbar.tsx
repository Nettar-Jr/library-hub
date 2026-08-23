/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  ShieldCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentRole, 
    isLibrarianLoggedIn, 
    loggedInLearner, 
    logout 
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = Boolean(isLibrarianLoggedIn || loggedInLearner);

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
      isActive
        ? 'bg-amber-400 text-indigo-950 shadow-sm font-bold'
        : 'text-slate-200 hover:text-white hover:bg-indigo-900/60'
    }`;

  const staffLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg font-sans text-xs font-bold tracking-wider transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
      isActive
        ? 'bg-amber-400 text-indigo-950 shadow-sm'
        : 'text-amber-300 hover:text-white hover:bg-amber-400/20'
    }`;

  return (
    <header className="bg-indigo-950 text-white sticky top-0 z-40 shadow-lg border-b border-indigo-900/60">
      <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          
          {/* Brand/Logo - Always navigates to Homepage */}
          <NavLink 
            to="/"
            className="flex items-center gap-3 cursor-pointer select-none group focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none rounded-xl p-1"
            title="Premier International School - Library Hub Home"
            aria-label="Premier International School Library Home"
          >
            <div className="p-2 sm:p-2.5 bg-amber-400 group-hover:bg-amber-300 rounded-xl text-indigo-950 shadow-inner flex items-center justify-center transition-colors">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm sm:text-lg tracking-wider leading-none">PREMIER INTERNATIONAL</span>
              <span className="font-sans text-[10px] sm:text-xs text-amber-400 font-bold tracking-[0.25em]">INK & IMAGINATION</span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            
            {/* Primary Patron Pathways Group */}
            <div role="group" aria-label="Patron Navigation Pathways" className="flex items-center gap-1.5 pr-3 border-r border-indigo-900/80">
              <NavLink to="/" end className={navLinkClasses}>
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>Home</span>
              </NavLink>

              <NavLink to="/catalog" className={navLinkClasses}>
                <Library className="w-4 h-4" aria-hidden="true" />
                <span>Book Catalog</span>
              </NavLink>

              <NavLink to="/gallery" className={navLinkClasses}>
                <Image className="w-4 h-4" aria-hidden="true" />
                <span>Creative Gallery</span>
              </NavLink>

              <NavLink to="/announcements" className={navLinkClasses}>
                <Bell className="w-4 h-4" aria-hidden="true" />
                <span>Bulletin</span>
              </NavLink>

              {/* Submit Work Button for Learners */}
              <NavLink 
                to="/submit"
                className={({ isActive }) => 
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all shadow-xs ${
                    isActive 
                      ? 'bg-amber-400 text-indigo-950 ring-2 ring-amber-300' 
                      : 'bg-amber-400/90 hover:bg-amber-300 text-indigo-950'
                  }`
                }
              >
                <FilePlus className="w-4 h-4" aria-hidden="true" />
                <span>Submit Work</span>
              </NavLink>
            </div>

            {/* Staff / Administrative Pathways - Visually Distinct Separation */}
            {isLibrarianLoggedIn ? (
              <div 
                role="group" 
                aria-label="Staff Administration Tools" 
                className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-900/70 border border-amber-400/40 rounded-xl"
              >
                <span className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest px-1">
                  Staff:
                </span>
                
                <NavLink to="/moderator" className={staffLinkClasses}>
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Moderation</span>
                </NavLink>

                <NavLink to="/desk-utilities" className={staffLinkClasses}>
                  <ScanLine className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Desk Desk</span>
                </NavLink>

                <NavLink to="/analytics" className={staffLinkClasses}>
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Analytics</span>
                </NavLink>
              </div>
            ) : (
              <NavLink 
                to="/analytics" 
                className={navLinkClasses}
                title="View Library Reading Metrics"
              >
                <TrendingUp className="w-4 h-4" aria-hidden="true" />
                <span>Analytics</span>
              </NavLink>
            )}

            {/* User Session & Auth Action */}
            <div className="flex items-center gap-2 pl-2">
              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-right">
                    <span 
                      className="text-xs font-bold text-amber-400 truncate max-w-[130px]" 
                      title={isLibrarianLoggedIn ? 'Admin Alabi' : loggedInLearner?.name}
                    >
                      {isLibrarianLoggedIn ? 'Librarian Alabi' : loggedInLearner?.name}
                    </span>
                    <span className="text-[9px] font-mono text-indigo-300 uppercase tracking-wider">
                      {isLibrarianLoggedIn ? 'Staff Admin' : loggedInLearner?.role === 'student' ? `${loggedInLearner.gradeOrYear}` : 'Teacher'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogoutClick}
                    className="flex items-center gap-1.5 bg-indigo-900/80 hover:bg-rose-900/60 hover:text-rose-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer text-slate-300 border border-indigo-800/60 hover:border-rose-700/60 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-rose-400"
                    aria-label="Sign out of your session"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-indigo-950 font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer border border-amber-300/80 focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <LogIn className="w-4 h-4 text-indigo-950" aria-hidden="true" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

          </div>

          {/* Medium and Mobile header controls */}
          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 truncate max-w-[110px]">
                  {isLibrarianLoggedIn ? 'Staff Alabi' : loggedInLearner?.name.split(' ')[0]}
                </span>
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="p-2 bg-indigo-900/80 text-slate-300 hover:text-rose-300 rounded-xl"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 bg-amber-400 text-indigo-950 font-bold text-xs px-3.5 py-1.5 rounded-xl"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Mobile Sub-Navigation Bar */}
      <div 
        role="navigation" 
        aria-label="Mobile Navigation" 
        className="lg:hidden flex justify-around bg-indigo-900 border-t border-indigo-800/80 py-2.5 px-2 text-[10px] font-bold tracking-wider overflow-x-auto scrollbar-none"
      >
        <NavLink 
          to="/" 
          end
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${isActive ? 'text-amber-400' : 'text-slate-300'}`}
        >
          <Home className="w-4 h-4" />
          <span>HOME</span>
        </NavLink>

        <NavLink 
          to="/catalog" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${isActive ? 'text-amber-400' : 'text-slate-300'}`}
        >
          <Library className="w-4 h-4" />
          <span>CATALOG</span>
        </NavLink>

        <NavLink 
          to="/gallery" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${isActive ? 'text-amber-400' : 'text-slate-300'}`}
        >
          <Image className="w-4 h-4" />
          <span>GALLERY</span>
        </NavLink>

        <NavLink 
          to="/submit" 
          className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${isActive ? 'text-amber-400' : 'text-slate-300'}`}
        >
          <FilePlus className="w-4 h-4" />
          <span>SUBMIT</span>
        </NavLink>

        {isLibrarianLoggedIn ? (
          <>
            <NavLink 
              to="/moderator" 
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${isActive ? 'text-amber-400' : 'text-slate-300'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>MODERATE</span>
            </NavLink>
            <NavLink 
              to="/desk-utilities" 
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${isActive ? 'text-amber-400' : 'text-slate-300'}`}
            >
              <ScanLine className="w-4 h-4" />
              <span>DESK</span>
            </NavLink>
          </>
        ) : (
          <NavLink 
            to="/analytics" 
            className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1 rounded-md ${isActive ? 'text-amber-400' : 'text-slate-300'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>METRICS</span>
          </NavLink>
        )}
      </div>
    </header>
  );
};
