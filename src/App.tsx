/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
import { BookOpen, Award, FileSpreadsheet, Feather, Library, CheckSquare, Compass, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';

function AppContent() {
  const { 
    activeTab, 
    currentRole, 
    setActiveTab, 
    currentLearnerName, 
    circulation,
    isLibrarianLoggedIn,
    loggedInLearner,
    currentPath
  } = useApp();

  const isAdminPath = currentPath === '/admin';
  const isLoggedIn = isAdminPath ? isLibrarianLoggedIn : !!loggedInLearner;

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
        {!isLoggedIn ? (
          <Login />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
            {/* HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-12">
                
                {/* School Hero Banner */}
                <header className="relative bg-indigo-900 text-white rounded-3xl p-8 sm:p-14 overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400 rounded-full mix-blend-overlay opacity-20 -mr-20 -mt-20"></div>
                  <div className="absolute top-10 left-10 w-24 h-24 border border-white/10 rounded-full"></div>
                  
                  <div className="relative max-w-3xl space-y-6 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full font-mono">
                      <Star className="w-3 h-3 fill-amber-400" /> Celebrating 25 Years of Excellence
                    </span>
                    
                    <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-none text-white">
                      Where Learning <br />
                      <span className="text-amber-400">Meets Imagination.</span>
                    </h1>
                    
                    <p className="text-sm sm:text-base text-indigo-200 leading-relaxed max-w-2xl font-normal">
                      Welcome to Premier International School's unified digital repository. Discover peer-authored short stories, poetry collections, academic essays, and administer library loan tracking in one complete, modern hub.
                    </p>

                    <div className="pt-4 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setActiveTab('gallery')}
                        className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold py-3 px-6 rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
                      >
                        <Compass className="w-4 h-4" />
                        Explore Creative Gallery
                      </button>
                      <button
                        onClick={() => setActiveTab('library')}
                        className="flex items-center gap-1.5 border border-white/10 hover:bg-white/5 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 transition cursor-pointer"
                      >
                        <Library className="w-4 h-4 text-amber-400" />
                        Search Catalog & borrowings
                      </button>
                    </div>
                  </div>
                </header>

                {/* Grid features based on school proposal */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass p-6 sm:p-8 rounded-2xl shadow-sm space-y-3">
                    <div className="p-3 bg-indigo-50 text-indigo-900 rounded-xl inline-block">
                      <Feather className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-extrabold text-base text-slate-900">Publish Your Voice</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Librarian-moderated spaces allow students to write and publish original short stories, essays, and poetry to the community gallery.
                    </p>
                  </div>

                  <div className="glass p-6 sm:p-8 rounded-2xl shadow-sm space-y-3">
                    <div className="p-3 bg-amber-50 text-amber-900 rounded-xl inline-block">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-extrabold text-base text-slate-900">Digital Automation (ILAS)</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Track book loans, view due dates, restock inventories, and trigger automated reminders with our advanced library system.
                    </p>
                  </div>

                  <div className="glass p-6 sm:p-8 rounded-2xl shadow-sm space-y-3">
                    <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl inline-block">
                      <Award className="w-5 h-5" />
                    </div>
                    <h3 className="font-display font-extrabold text-base text-slate-900">Peer Recognition</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Express peer appreciation, upvote outstanding student works, and write encouraging feedback directly onto student submissions.
                    </p>
                  </div>
                </section>

                {/* Bulletin Updates Section */}
                <section className="glass rounded-3xl p-6 sm:p-8 shadow-sm">
                  <AnnouncementBoard />
                </section>

              </div>
            )}

            {/* LIBRARY TAB */}
            {activeTab === 'library' && (
              <div className="space-y-8">
                {currentRole === 'learner' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Primary Catalog */}
                    <div className="lg:col-span-3">
                      <BookCatalog />
                    </div>

                    {/* Learner Personal Loans Tray (Left column) */}
                    <div className="lg:col-span-1 space-y-6">
                      <div className="glass p-5 rounded-3xl shadow-sm space-y-4">
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
                              You have no outstanding book loans. Contact the librarian or place a 24-Hour Hold to secure a book.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-200/50 p-5 rounded-3xl space-y-3">
                        <h4 className="font-display font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Presentation Pro-Tip:
                        </h4>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          To demonstrate checking-in or returning a book, or triggering warnings, simply click 
                          <span className="font-bold"> "Switch to Librarian ILAS"</span> in the black sandbox bar above to see the full dashboard!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Librarian Full View - Unified Dashboard */}
                    <section className="glass rounded-3xl p-6 sm:p-8 shadow-sm">
                      <CirculationTracker />
                    </section>
                    <section className="glass rounded-3xl p-6 sm:p-8 shadow-sm">
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

            {/* SUBMIT TAB (Learners only) */}
            {activeTab === 'submit' && (
              <div className="space-y-6">
                <SubmitWorkForm />
              </div>
            )}

            {/* MODERATION TAB (Librarians only) */}
            {activeTab === 'moderation' && (
              <div className="space-y-6">
                <ModeratorWorkspace />
              </div>
            )}

            {/* DESK UTILITIES TAB (Librarians only) */}
            {activeTab === 'desk' && (
              <div className="space-y-6">
                <DeskUtilities />
              </div>
            )}

          </motion.div>
        </AnimatePresence>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-10 border-t border-slate-900/60 mt-16 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-semibold text-slate-400 uppercase tracking-widest text-[10px]">PREMIER INTERNATIONAL SCHOOL DIGITAL LIBRARY PORTAL</p>
          <p className="text-slate-600 leading-relaxed max-w-md mx-auto">
            A comprehensive presentation prototype built to demonstrate high-efficiency Integrated Library Automation Systems (ILAS) and student creative publishing spaces.
          </p>
          <div className="pt-2 text-[10px] text-slate-700 font-mono">
            &copy; 2026 Premier International School. Sandbox active • Local Persistence.
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

