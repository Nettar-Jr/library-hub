/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  User, 
  Shield 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentRole, 
    activeTab, 
    setActiveTab, 
    isLibrarianLoggedIn, 
    loggedInLearner, 
    logout, 
    currentPath, 
    navigateTo 
  } = useApp();

  const isAdminPath = currentPath === '/admin';
  const isLoggedIn = isAdminPath ? isLibrarianLoggedIn : !!loggedInLearner;

  const handleLogoutClick = () => {
    logout();
    setActiveTab('home');
    navigateTo(isAdminPath ? '/admin' : '/');
  };

  return (
    <nav className="bg-indigo-950 text-white sticky top-0 z-40 shadow-lg border-b border-indigo-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          
          {/* Brand/Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => {
              if (isLoggedIn) {
                setActiveTab('home');
                navigateTo(isAdminPath ? '/admin' : '/');
              }
            }}
          >
            <div className="p-2 sm:p-2.5 bg-amber-400 rounded-lg text-indigo-950 shadow-inner flex items-center justify-center">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-sm sm:text-lg tracking-wider leading-none">PREMIER INTERNATIONAL</span>
              <span className="font-sans text-[10px] sm:text-xs text-amber-400 font-semibold tracking-[0.25em]">INK & IMAGINATION</span>
            </div>
          </div>

          {/* Navigation Links / Auth Status */}
          <div className="hidden md:flex items-center gap-1 sm:gap-2">
            {!isLoggedIn ? (
              <div className="flex items-center gap-2">
                {isAdminPath ? (
                  <span className="text-[10px] bg-amber-400/15 text-amber-400 border border-amber-400/30 px-3.5 py-1.5 rounded-full font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Librarian Admin Console
                  </span>
                ) : (
                  <span className="text-[10px] bg-white/10 text-indigo-200 border border-white/10 px-3.5 py-1.5 rounded-full font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    Student & Staff Portal
                  </span>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'home'
                      ? 'bg-indigo-900/60 text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-indigo-900/30'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  HOME
                </button>

                <button
                  onClick={() => setActiveTab('library')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'library'
                      ? 'bg-indigo-900/60 text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-indigo-900/30'
                  }`}
                >
                  <Library className="w-4 h-4" />
                  LIBRARY HUB (ILAS)
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'analytics'
                      ? 'bg-indigo-900/60 text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-indigo-900/30'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  {currentRole === 'librarian' ? 'REPORTS & ANALYTICS' : 'POPULAR TRENDS'}
                </button>

                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'gallery'
                      ? 'bg-indigo-900/60 text-amber-400 border-b-2 border-amber-400'
                      : 'text-slate-300 hover:text-white hover:bg-indigo-900/30'
                  }`}
                >
                  <Image className="w-4 h-4" />
                  CREATIVE GALLERY
                </button>

                {currentRole === 'learner' && (
                  <button
                    onClick={() => setActiveTab('submit')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg font-sans text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer bg-amber-400 text-indigo-950 hover:bg-amber-300 shadow-md`}
                  >
                    <FilePlus className="w-4 h-4" />
                    SUBMIT WORK
                  </button>
                )}

                {currentRole === 'librarian' && (
                  <>
                    <button
                      onClick={() => setActiveTab('moderation')}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer border border-amber-400/30 ${
                        activeTab === 'moderation'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      MODERATION
                    </button>
                    <button
                      onClick={() => setActiveTab('desk')}
                      className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-sans text-xs sm:text-sm font-bold tracking-wide transition-all cursor-pointer border border-cyan-400/30 ${
                        activeTab === 'desk'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20'
                      }`}
                    >
                      <ScanLine className="w-4 h-4" />
                      DESK UTILITIES
                    </button>
                  </>
                )}

                {/* Session Details & Logout Button */}
                <div className="flex items-center gap-3 pl-4 border-l border-indigo-900">
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-amber-400 truncate max-w-[120px]" title={isAdminPath ? 'Librarian Alabi' : loggedInLearner?.name}>
                      {isAdminPath ? 'Admin Alabi' : loggedInLearner?.name}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">
                      {isAdminPath ? 'Staff' : loggedInLearner?.role}
                    </span>
                  </div>

                  <button
                    onClick={handleLogoutClick}
                    className="p-2 bg-indigo-900/40 hover:bg-rose-900/30 hover:text-rose-400 rounded-lg transition-all cursor-pointer text-slate-300 border border-indigo-800/40 hover:border-rose-900/30"
                    title="Log Out of Session"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Mobile Indicator / Tab Switches */}
          <div className="flex md:hidden items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-indigo-900/50 border border-indigo-800/40 px-2.5 py-1.5 rounded-xl">
                <span className="text-[10px] font-bold text-amber-400 truncate max-w-[90px]">
                  {isAdminPath ? 'Admin' : loggedInLearner?.name.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogoutClick}
                  className="p-1 hover:text-rose-400 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="bg-indigo-900/40 px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                {isAdminPath ? 'Admin Portal' : 'Student Portal'}
              </div>
            )}
          </div>

        </div>
      </div>
      
      {/* Mobile Sub-Navigation Row for ease of use on small preview screens - ONLY visible when logged in */}
      {isLoggedIn && (
        <div className="md:hidden flex justify-around bg-indigo-900 border-t border-indigo-800/60 py-2.5 px-2 text-[10px] font-bold tracking-wider">
          <button 
            onClick={() => setActiveTab('home')} 
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'home' ? 'text-amber-400' : 'text-slate-300'}`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>HOME</span>
          </button>
          <button 
            onClick={() => setActiveTab('library')} 
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'library' ? 'text-amber-400' : 'text-slate-300'}`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>LIBRARY</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'analytics' ? 'text-amber-400' : 'text-slate-300'}`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{currentRole === 'librarian' ? 'REPORTS' : 'TRENDS'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('gallery')} 
            className={`flex flex-col items-center gap-0.5 ${activeTab === 'gallery' ? 'text-amber-400' : 'text-slate-300'}`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>GALLERY</span>
          </button>
          {currentRole === 'learner' ? (
            <button 
              onClick={() => setActiveTab('submit')} 
              className={`flex flex-col items-center gap-0.5 ${activeTab === 'submit' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
            >
              <FilePlus className="w-3.5 h-3.5 text-amber-500" />
              <span>SUBMIT</span>
            </button>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('moderation')} 
                className={`flex flex-col items-center gap-0.5 ${activeTab === 'moderation' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>MODERATE</span>
              </button>
              <button 
                onClick={() => setActiveTab('desk')} 
                className={`flex flex-col items-center gap-0.5 ${activeTab === 'desk' ? 'text-amber-400 font-black' : 'text-slate-300'}`}
              >
                <ScanLine className="w-3.5 h-3.5 text-amber-400" />
                <span>DESK</span>
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
