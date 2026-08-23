/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AnnouncementBoard } from './components/AnnouncementBoard';
import { BookCatalog } from './components/BookCatalog';
import { CirculationTracker } from './components/CirculationTracker';
import { SubmitWorkForm } from './components/SubmitWorkForm';
import { CreativeGallery } from './components/CreativeGallery';
import { ModeratorWorkspace } from './components/ModeratorWorkspace';
import { LibraryAnalytics } from './components/LibraryAnalytics';
import { DeskUtilities } from './components/DeskUtilities';
import { 
  BookOpen, 
  Award, 
  FileSpreadsheet, 
  Feather, 
  Library, 
  CheckSquare, 
  Compass, 
  ArrowRight, 
  Star, 
  Lock, 
  UserCheck, 
  ShieldCheck, 
  LogIn,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';
import { HomeDiscoveryHub } from './components/HomeDiscoveryHub';

function AppContent() {
  const { 
    activeTab, 
    currentRole, 
    setActiveTab, 
    currentLearnerName, 
    circulation,
    isLibrarianLoggedIn,
    loggedInLearner,
    currentPath,
    navigateTo
  } = useApp();

  const isAdminPath = currentPath === '/admin';
  const isLoggedIn = isLibrarianLoggedIn || !!loggedInLearner;

  // Find loans belonging to currently logged in learner
  const myLearnerLoans = circulation.filter(
    (r) => r.learnerName === currentLearnerName && r.status !== 'returned'
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-yellow-500 selection:text-slate-950">
      
      {/* Main navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HOMEPAGE - Accessible to everyone as the public landing page */}
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-12"
          >
            {/* School Hero Banner */}
            <header className="relative bg-indigo-950 text-white rounded-3xl p-8 sm:p-14 overflow-hidden shadow-xl border border-indigo-900/60">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="relative max-w-3xl space-y-6 z-10">
                {isLoggedIn && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] sm:text-xs font-mono font-semibold px-2.5 py-1 rounded-full">
                      <UserCheck className="w-3 h-3" />
                      Signed in as {isLibrarianLoggedIn ? 'Librarian Alabi' : loggedInLearner?.name}
                    </span>
                  </div>
                )}
                
                <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-tight text-white">
                  Where Learning <br />
                  <span className="text-amber-400">Meets Imagination.</span>
                </h1>
                
                <p className="text-sm sm:text-base text-indigo-200 leading-relaxed max-w-2xl font-normal">
                  Welcome to Premier International School's unified digital repository. Discover peer-authored short stories, poetry collections, academic essays, and administer library loan tracking in one complete, modern hub.
                </p>

                {/* Interactive Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-indigo-950" />
                    <span>Explore Creative Gallery</span>
                    {!isLoggedIn && <Lock className="w-3.5 h-3.5 text-indigo-950/70" />}
                  </button>

                  <button
                    onClick={() => setActiveTab('library')}
                    className="flex items-center gap-2 bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-700/60 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white transition cursor-pointer shadow-sm"
                  >
                    <Library className="w-4 h-4 text-amber-400" />
                    <span>Search Catalog & Borrowings</span>
                    {!isLoggedIn && <Lock className="w-3.5 h-3.5 text-indigo-300" />}
                  </button>

                  {!isLoggedIn && (
                    <button
                      onClick={() => {
                        navigateTo('/admin');
                        setActiveTab('moderation');
                      }}
                      className="flex items-center gap-1.5 border border-white/15 hover:bg-white/10 px-4 py-3 rounded-xl text-xs sm:text-sm font-mono text-indigo-200 transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Staff / Librarian Portal</span>
                    </button>
                  )}
                </div>
              </div>
            </header>

            {/* If user is logged in, show active user quick launch ribbon */}
            {isLoggedIn && (
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 border border-indigo-800/80 rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="font-display font-extrabold text-sm sm:text-base text-amber-400">
                      Welcome back, {isLibrarianLoggedIn ? 'Librarian Alabi' : loggedInLearner?.name}!
                    </h3>
                  </div>
                  <p className="text-xs text-indigo-200">
                    Your authenticated session is active. You have full access to all protected library modules.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('library')}
                    className="bg-white text-indigo-950 font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-400 transition cursor-pointer shadow-xs"
                  >
                    Open Library Hub
                  </button>
                  {isLibrarianLoggedIn ? (
                    <button
                      onClick={() => setActiveTab('moderation')}
                      className="bg-amber-400 text-indigo-950 font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-300 transition cursor-pointer shadow-xs"
                    >
                      Moderation Desk
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('submit')}
                      className="bg-amber-400 text-indigo-950 font-bold text-xs px-4 py-2 rounded-xl hover:bg-amber-300 transition cursor-pointer shadow-xs"
                    >
                      Submit Work
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Epic-inspired Discovery & Reading Hub */}
            <HomeDiscoveryHub />

            {/* Core Pillars */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 sm:p-8 rounded-3xl shadow-sm space-y-3 border border-slate-200/80">
                <div className="p-3 bg-indigo-50 text-indigo-900 rounded-2xl inline-block shadow-2xs">
                  <Feather className="w-6 h-6" />
                </div>
                <h3 className="font-display font-extrabold text-base text-slate-900">Publish Your Voice</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Librarian-moderated spaces allow students to write and publish original short stories, essays, and poetry to the community gallery.
                </p>
              </div>

              <div className="glass p-6 sm:p-8 rounded-3xl shadow-sm space-y-3 border border-slate-200/80">
                <div className="p-3 bg-amber-50 text-amber-900 rounded-2xl inline-block shadow-2xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="font-display font-extrabold text-base text-slate-900">Digital Automation (ILAS)</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Track book loans, view due dates, restock inventories, and trigger automated reminders with our advanced library system.
                </p>
              </div>

              <div className="glass p-6 sm:p-8 rounded-3xl shadow-sm space-y-3 border border-slate-200/80">
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl inline-block shadow-2xs">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-display font-extrabold text-base text-slate-900">Peer Recognition</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Express peer appreciation, upvote outstanding student works, and write encouraging feedback directly onto student submissions.
                </p>
              </div>
            </section>

            {/* Public Bulletin Updates Section */}
            <section className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
              <AnnouncementBoard />
            </section>

          </motion.div>
        )}

        {/* PROTECTED PAGES - If not authenticated, displays Login screen with targetTab guidance */}
        {activeTab !== 'home' && (
          <>
            {!isLoggedIn ? (
              <Login targetTab={activeTab} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {/* LIBRARY TAB */}
                  {activeTab === 'library' && (
                    <div className="space-y-8">
                      {!isLibrarianLoggedIn ? (
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                          {/* Primary Catalog */}
                          <div className="lg:col-span-3">
                            <BookCatalog />
                          </div>

                          {/* Learner Personal Loans Tray (Left column) */}
                          <div className="lg:col-span-1 space-y-6">
                            <div className="glass p-5 rounded-3xl shadow-sm space-y-4 border border-slate-200/80">
                              <div className="flex items-center gap-1.5 text-indigo-900">
                                <CheckSquare className="w-5 h-5" />
                                <h3 className="font-display font-extrabold text-xs uppercase tracking-wider">
                                  My Active Book Loans
                                </h3>
                              </div>

                              <div className="space-y-3">
                                {myLearnerLoans.map((loan) => (
                                  <div key={loan.id} className="p-3.5 bg-white rounded-xl border border-slate-100 text-xs space-y-2 shadow-2xs">
                                    <div>
                                      <h4 className="font-bold text-slate-800 italic line-clamp-1">{loan.bookTitle}</h4>
                                      <span className="text-[10px] text-slate-400 font-mono">Loan ID: {loan.id.split('-')[1]}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                                      <span>Due: {loan.dueDate}</span>
                                      {loan.status === 'overdue' ? (
                                        <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold animate-pulse">Overdue</span>
                                      ) : (
                                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Borrowed</span>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {myLearnerLoans.length === 0 && (
                                  <p className="text-xs text-slate-400 text-center py-6 italic leading-snug">
                                    You have no outstanding book loans. Place a 24-Hour Hold on any available book to reserve it!
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-200/50 p-5 rounded-3xl space-y-3">
                              <h4 className="font-display font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Active Student Account
                              </h4>
                              <p className="text-[11px] text-amber-800 leading-relaxed">
                                You are signed in as <span className="font-bold">{loggedInLearner?.name}</span>. You can reserve books, review loans, and submit creative writings.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-10">
                          {/* Librarian Full View - Unified Dashboard */}
                          <section className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                            <CirculationTracker />
                          </section>
                          <section className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
                            <BookCatalog />
                          </section>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ANALYTICS & DEWEY STOCK TRACKER TAB */}
                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      <LibraryAnalytics />
                    </div>
                  )}

                  {/* CREATIVE GALLERY TAB */}
                  {activeTab === 'gallery' && (
                    <div className="space-y-6">
                      <CreativeGallery />
                    </div>
                  )}

                  {/* SUBMIT TAB (Learners or Staff) */}
                  {activeTab === 'submit' && (
                    <div className="space-y-6">
                      <SubmitWorkForm />
                    </div>
                  )}

                  {/* MODERATION TAB (Librarians only) */}
                  {activeTab === 'moderation' && (
                    <div className="space-y-6">
                      {isLibrarianLoggedIn ? (
                        <ModeratorWorkspace />
                      ) : (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
                          <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                          <h3 className="font-display font-extrabold text-lg text-slate-900">Librarian Access Required</h3>
                          <p className="text-xs text-slate-500">The Moderation Workspace is restricted to library administrative staff.</p>
                          <button
                            onClick={() => {
                              navigateTo('/admin');
                              setActiveTab('moderation');
                            }}
                            className="bg-indigo-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-800 transition cursor-pointer"
                          >
                            Switch to Librarian Sign In
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DESK UTILITIES TAB (Librarians only) */}
                  {activeTab === 'desk' && (
                    <div className="space-y-6">
                      {isLibrarianLoggedIn ? (
                        <DeskUtilities />
                      ) : (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
                          <Lock className="w-10 h-10 text-amber-500 mx-auto" />
                          <h3 className="font-display font-extrabold text-lg text-slate-900">Librarian Access Required</h3>
                          <p className="text-xs text-slate-500">The Circulation Desk & Utilities console is restricted to library staff.</p>
                          <button
                            onClick={() => {
                              navigateTo('/admin');
                              setActiveTab('desk');
                            }}
                            className="bg-indigo-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-indigo-800 transition cursor-pointer"
                          >
                            Switch to Librarian Sign In
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-10 border-t border-slate-900/60 mt-16 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">PREMIER INTERNATIONAL SCHOOL DIGITAL LIBRARY PORTAL</p>
          <p className="text-slate-600 leading-relaxed max-w-md mx-auto">
            Empowering students, educators, and staff with high-efficiency library management, catalog discovery, and creative student publishing.
          </p>
          <div className="pt-2 text-[10px] text-slate-700 font-mono flex flex-wrap justify-center items-center gap-4">
            <span>&copy; 2026 Premier International School.</span>
            <span>•</span>
            <button 
              onClick={() => {
                setActiveTab('home');
                if (isAdminPath) navigateTo('/');
              }}
              className="hover:text-amber-400 underline cursor-pointer"
            >
              Public Landing Page
            </button>
            <span>•</span>
            <button 
              onClick={() => {
                if (isLoggedIn) {
                  setActiveTab('library');
                } else {
                  navigateTo('/');
                  setActiveTab('library');
                }
              }}
              className="hover:text-amber-400 underline cursor-pointer"
            >
              Student Portal
            </button>
            <span>•</span>
            <button 
              onClick={() => {
                navigateTo('/admin');
                setActiveTab('moderation');
              }}
              className="hover:text-amber-400 underline cursor-pointer"
            >
              Staff & Admin Login
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
