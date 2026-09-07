/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { ClassRosterManagementModal } from './components/ClassRosterManagementModal';
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
  Library, 
  CheckSquare, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  LogIn,
  Star,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Login } from './components/Login';
import { HomeDiscoveryHub } from './components/HomeDiscoveryHub';

/* -------------------------------------------------------------
 * 1. Home View Component
 * ------------------------------------------------------------- */
function HomeView() {
  return (
    <div className="space-y-16">
      {/* 1. Hero, 2. Limited Catalog Preview, 3. What You Can Do */}
      <HomeDiscoveryHub />

      {/* 4. Bulletin & Notices Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200">
        <AnnouncementBoard />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------
 * 2. Catalog View Component
 * ------------------------------------------------------------- */
function CatalogView() {
  const { 
    isLibrarianLoggedIn, 
    loggedInLearner, 
    circulation, 
    currentLearnerName,
    isAdmin
  } = useApp();

  const myLearnerLoans = circulation.filter(
    (r) => r.learnerName === currentLearnerName && r.status !== 'returned'
  );

  return (
    <div className="space-y-8">
      {!isAdmin ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Primary Catalog */}
          <div className={loggedInLearner ? "lg:col-span-3" : "lg:col-span-4"}>
            <BookCatalog />
          </div>

          {/* Learner Personal Loans Tray (Left/Side column if logged in) */}
          {loggedInLearner && (
            <div className="lg:col-span-1 space-y-6">
              <div className="glass p-5 rounded-3xl shadow-sm space-y-4 border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-blue-900">
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
                          <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">Borrowed</span>
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

              <div className="bg-blue-50/70 border border-blue-200/60 p-5 rounded-3xl space-y-3">
                <h4 className="font-display font-extrabold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1">
                  <CheckSquare className="w-4 h-4 text-blue-600" /> Active Student Account
                </h4>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  You are signed in as <span className="font-bold">{loggedInLearner.name}</span>. You can search the catalog, place holds on books, and manage your active loans.
                </p>
              </div>
            </div>
          )}
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
  );
}

/* -------------------------------------------------------------
 * 3. Submit View Component (Guarded)
 * ------------------------------------------------------------- */
function SubmitView() {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-display font-extrabold text-lg text-slate-900">Student Sign-In Required</h3>
        <p className="text-xs text-slate-500">You must be signed in with your Student account to submit a book recommendation or reading response.</p>
        <button
          type="button"
          onClick={() => navigate('/login?redirect=/submit')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
        >
          Sign In to Submit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SubmitWorkForm />
    </div>
  );
}

/* -------------------------------------------------------------
 * 4. Analytics View Component (Staff & Librarian)
 * ------------------------------------------------------------- */
function AnalyticsView() {
  const { isStaff, isAdmin } = useApp();
  const navigate = useNavigate();

  if (!isStaff && !isAdmin) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-display font-extrabold text-lg text-slate-900">Staff Access Required</h3>
        <p className="text-xs text-slate-500">Collection Analytics and DDC Classification Reports are restricted to teachers and library staff.</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          Sign In as Staff or Librarian
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LibraryAnalytics />
    </div>
  );
}

/* -------------------------------------------------------------
 * 5. Circulation View Component (Librarian Only)
 * ------------------------------------------------------------- */
function CirculationView() {
  const { isAdmin } = useApp();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-display font-extrabold text-lg text-slate-900">Librarian Access Required</h3>
        <p className="text-xs text-slate-500">The Circulation Desk is restricted to library administrative staff.</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          Switch to Librarian Role
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CirculationTracker />
    </div>
  );
}

/* -------------------------------------------------------------
 * 6. Moderator View Component (Staff & Librarian)
 * ------------------------------------------------------------- */
function ModeratorView() {
  const { isStaff, isAdmin } = useApp();
  const navigate = useNavigate();

  if (!isStaff && !isAdmin) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-display font-extrabold text-lg text-slate-900">Staff Access Required</h3>
        <p className="text-xs text-slate-500">The Review Queue is restricted to faculty and library staff.</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          Switch to Staff or Librarian Role
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModeratorWorkspace />
    </div>
  );
}

/* -------------------------------------------------------------
 * 7. Desk Utilities View Component (Librarian Only)
 * ------------------------------------------------------------- */
function DeskView() {
  const { isAdmin } = useApp();
  const navigate = useNavigate();

  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
        <Lock className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-display font-extrabold text-lg text-slate-900">Librarian Access Required</h3>
        <p className="text-xs text-slate-500">The Circulation Desk is restricted to library administrative staff.</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
        >
          Switch to Librarian Role
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DeskUtilities />
    </div>
  );
}

/* -------------------------------------------------------------
 * 8. Bulletin View Component
 * ------------------------------------------------------------- */
function BulletinView() {
  return (
    <div className="glass rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h2 className="font-display font-extrabold text-xl sm:text-2xl text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-amber-500" />
          Library Notices
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Official announcements, schedule updates, book return deadlines, and library notices.
        </p>
      </div>
      <AnnouncementBoard />
    </div>
  );
}

/* -------------------------------------------------------------
 * Main Application Layout & Router
 * ------------------------------------------------------------- */
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLibrarianLoggedIn, loggedInLearner, userRole } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      
      {/* Main navigation */}
      <Navbar />

      {/* Class Roster Management Modal (Global Admin Trigger) */}
      <ClassRosterManagementModal />

      {/* Main Content Area with Route Transitions */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Routes location={location}>
              <Route path="/" element={<HomeView />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/catalog" element={<CatalogView />} />
              <Route path="/library" element={<Navigate to="/catalog" replace />} />
              <Route path="/gallery" element={<CreativeGallery />} />
              <Route path="/announcements" element={<BulletinView />} />
              <Route path="/bulletin" element={<Navigate to="/announcements" replace />} />
              <Route path="/submit" element={<SubmitView />} />
              <Route path="/analytics" element={<AnalyticsView />} />
              <Route path="/circulation" element={<CirculationView />} />
              <Route path="/moderator" element={<ModeratorView />} />
              <Route path="/moderation" element={<Navigate to="/moderator" replace />} />
              <Route path="/desk-utilities" element={<DeskView />} />
              <Route path="/desk" element={<Navigate to="/desk-utilities" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Login adminMode />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-500 py-10 border-t border-slate-200 mt-16 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="font-semibold text-slate-700 uppercase tracking-widest text-[11px]">
            Premier International School Digital Library Portal
          </p>
          <p className="text-slate-500 leading-relaxed max-w-md mx-auto text-xs">
            Providing students, educators, and staff with catalog discovery, library circulation, and academic reading resources.
          </p>
          <div className="pt-2 text-[11px] text-slate-500 font-medium flex flex-wrap justify-center items-center gap-4">
            <span>&copy; 2026 Premier International School.</span>
            <span>•</span>
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="hover:text-blue-600 underline cursor-pointer"
            >
              Library Home
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => navigate('/catalog')}
              className="hover:text-blue-600 underline cursor-pointer"
            >
              Catalog
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => navigate('/announcements')}
              className="hover:text-blue-600 underline cursor-pointer"
            >
              Library Notices
            </button>
            <span>•</span>
            <button 
              type="button"
              onClick={() => navigate('/admin')}
              className="hover:text-blue-600 underline cursor-pointer"
            >
              Staff & Admin Portal
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
