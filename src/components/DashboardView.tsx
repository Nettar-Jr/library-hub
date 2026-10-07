/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { useApp, getGradeLevelForUser, getUserBorrowLimitInfo } from '../context/AppContext';
import { HeroSpotlight } from './HeroSpotlight';
import { AnnouncementBoard } from './AnnouncementBoard';
import { PersonalReadingGoals } from './PersonalReadingGoals';
import { 
  BookOpen, 
  Library, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  ScanLine, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles, 
  PenTool, 
  GraduationCap, 
  Building2, 
  Backpack, 
  Calendar, 
  Star,
  RefreshCw,
  Search,
  Check,
  Award,
  Bell,
  BellOff,
  X,
  Smartphone,
  Layers,
  BookMarked,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';
import { formatReadingDuration, formatRelativeTime } from '../utils/ebookUtils';

export const DashboardView: React.FC = () => {
  const { 
    currentUser, 
    loggedInLearner,
    currentLearnerName,
    isLearner, 
    isStaff, 
    isAdmin, 
    circulation, 
    holds, 
    books, 
    allBooks,
    submissions, 
    activeSection,
    setActiveSection,
    renewLoan, 
    releaseHold,
    returnBook,
    sendOverdueAlert,
    approveSubmission,
    rejectSubmission,
    setIsRosterModalOpen,
    setSelectedBook,
    readingProgressRecords,
    getUserReadingProgressList,
    toggleBookNotification,
    dismissBookReminder,
    openEBookReader,
    physicalBooks,
    ebookBooks,
    inventoryFilter,
    setInventoryFilter,
    inventoryMetrics
  } = useApp();

  const navigate = useNavigate();

  const [dismissedReminders, setDismissedReminders] = React.useState<Set<string>>(new Set());

  // User's eBook reading progress records
  const userReadingProgress = getUserReadingProgressList();

  // Active automated reminder for unfinished book:
  const unfinishedReminderRecord = React.useMemo(() => {
    return userReadingProgress.find(
      (r) => r.status !== 'completed' && r.currentPage > 0 && r.notificationsEnabled !== false
    );
  }, [userReadingProgress]);

  // Find book corresponding to reminder
  const reminderBook = React.useMemo(() => {
    if (!unfinishedReminderRecord) return null;
    return (allBooks || books).find(b => b.id === unfinishedReminderRecord.bookId) || {
      id: unfinishedReminderRecord.bookId,
      title: unfinishedReminderRecord.bookTitle,
      author: unfinishedReminderRecord.author,
      coverUrl: unfinishedReminderRecord.coverUrl,
      inventoryType: 'ebook',
    } as Book;
  }, [unfinishedReminderRecord, allBooks, books]);

  // Admin active inventory view tab: 'all' | 'physical' | 'ebook'
  const [adminInventoryTab, setAdminInventoryTab] = React.useState<'all' | 'physical' | 'ebook'>('all');

  const studentUser = loggedInLearner || currentUser;
  const gradeLevel = getGradeLevelForUser(studentUser, activeSection);
  const studentSection = gradeLevel === 'primary' ? 'primary' : 'college';
  const borrowLimitInfo = getUserBorrowLimitInfo(studentUser, activeSection);

  const userDisplayName = currentUser?.name || (isAdmin ? 'Chief Librarian' : isStaff ? 'Faculty Member' : 'Student Scholar');
  const userInitial = userDisplayName.charAt(0).toUpperCase() || 'U';

  // Circulation calculations
  const myLearnerLoans = circulation.filter(
    (r) => r.learnerName === currentLearnerName && r.status !== 'returned'
  );

  const learnerId = currentUser?.id || loggedInLearner?.id;
  const myLearnerHolds = holds.filter(
    (h) => h.userId === learnerId && h.status === 'active'
  );

  const mySubmissions = submissions.filter(
    (s) => s.authorId === learnerId || s.authorName === userDisplayName
  );

  // Admin / Staff calculations
  const pendingSubmissions = submissions.filter((s) => s.status === 'pending');
  const activeLoans = circulation.filter((r) => r.status !== 'returned');
  const overdueLoans = circulation.filter((r) => r.status === 'overdue');

  const primaryBooksCount = (allBooks || books).filter(b => b.section === 'primary').length;
  const collegeBooksCount = (allBooks || books).filter(b => (b.section || 'college') === 'college').length;
  const totalBooksCount = (allBooks || books).length;

  // Recommended books for learner's grade
  const recommendedBooks = (allBooks || books)
    .filter(b => b.section === studentSection && b.availableCopies > 0)
    .slice(0, 4);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
      
      {/* -------------------------------------------------------------------------
       * 1. PERSONALIZED WELCOME BANNER
       * ------------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-md shrink-0 overflow-hidden border border-slate-200">
            {currentUser?.avatar ? (
              <img
                key={currentUser.avatar}
                src={currentUser.avatar}
                alt={userDisplayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Welcome back, {currentUser?.nickname || userDisplayName}!
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isAdmin 
                ? 'Manage library circulation desk, catalog holdings, and member borrow requests.' 
                : isStaff 
                ? `Faculty Advisor for ${currentUser?.department || 'Curriculum Faculty'}. Review reading submissions and analytics.` 
                : `${currentUser?.gradeOrYear ? `Class ${currentUser.gradeOrYear} • ` : ''}Library Card: ${currentUser?.libraryCardId || 'LIB-ACTIVE'}`}
            </p>
          </div>
        </div>

        {/* Quick action button on right */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative z-10 w-full md:w-auto">
          <button
            type="button"
            onClick={() => navigate('/catalog')}
            className="flex-1 md:flex-initial bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Catalog</span>
          </button>

          {isLearner && (
            <button
              type="button"
              onClick={() => navigate('/submit')}
              className="flex-1 md:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <PenTool className="w-4 h-4 text-slate-600" />
              <span>Submit Review</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/circulation')}
              className="flex-1 md:flex-initial bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Library className="w-4 h-4 text-amber-400" />
              <span>Circulation Desk</span>
            </button>
          )}

          {isStaff && !isAdmin && (
            <button
              type="button"
              onClick={() => navigate('/moderator')}
              className="flex-1 md:flex-initial bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>Review Queue ({pendingSubmissions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------------
       * 2. ROLE-SPECIFIC DASHBOARD SECTIONS
       * ------------------------------------------------------------------------- */}

      {/* ======================= A. LEARNER / STUDENT DASHBOARD ======================= */}
      {isLearner && (
        <div className="space-y-8">

          {/* Automated Notification Reminder for Unfinished Book (Configurable per-book toggle) */}
          {unfinishedReminderRecord && !dismissedReminders.has(unfinishedReminderRecord.bookId) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-purple-500/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-800 shadow-md shrink-0 border border-white/20">
                    <img
                      src={unfinishedReminderRecord.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700'}
                      alt={unfinishedReminderRecord.bookTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <Bell className="w-2.5 h-2.5" />
                        <span>Automated Reading Reminder</span>
                      </span>
                      <span className="text-[11px] text-purple-200">
                        Left {formatRelativeTime(unfinishedReminderRecord.lastReadAt)}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-white">
                      Resume "{unfinishedReminderRecord.bookTitle}"
                    </h3>
                    <p className="text-xs text-purple-200 leading-relaxed">
                      You stopped on <strong>Page {unfinishedReminderRecord.currentPage} of {unfinishedReminderRecord.totalPages}</strong> ({unfinishedReminderRecord.percentCompleted}% read • {formatReadingDuration(unfinishedReminderRecord.totalDurationSeconds)} reading duration). Jump back in to continue where you left off!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 pt-2 md:pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (reminderBook) {
                        openEBookReader(reminderBook, unfinishedReminderRecord.currentPage);
                      }
                    }}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <BookOpen className="w-4 h-4 text-purple-700" />
                    <span>Continue from Page {unfinishedReminderRecord.currentPage}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleBookNotification(unfinishedReminderRecord.bookId, false);
                      setDismissedReminders(prev => new Set(prev).add(unfinishedReminderRecord.bookId));
                    }}
                    className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white font-medium text-xs rounded-xl border border-white/15 transition flex items-center gap-1.5 cursor-pointer"
                    title="Turn off automated notifications for this title if you are no longer interested"
                  >
                    <BellOff className="w-3.5 h-3.5 text-purple-300" />
                    <span>Turn Off Reminders</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      dismissBookReminder(unfinishedReminderRecord.bookId);
                      setDismissedReminders(prev => new Set(prev).add(unfinishedReminderRecord.bookId));
                    }}
                    className="p-2.5 text-white/70 hover:text-white transition cursor-pointer"
                    title="Dismiss reminder for now"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Section Book of the Week Spotlight (Only visible in Learner's Dashboard) */}
          <section aria-label="Book of the Week Feature">
            <HeroSpotlight />
          </section>

          {/* Key Student Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Loans</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-display font-black text-2xl text-slate-900">
                {myLearnerLoans.length}
                {borrowLimitInfo.maxAllowed !== null ? (
                  <span className="text-xs text-slate-400 font-normal"> / {borrowLimitInfo.maxAllowed} max</span>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium"> (Manual limit)</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {borrowLimitInfo.maxAllowed !== null
                  ? (myLearnerLoans.length >= borrowLimitInfo.maxAllowed
                      ? `Borrow limit reached (${borrowLimitInfo.maxAllowed} books max)`
                      : `${borrowLimitInfo.maxAllowed - myLearnerLoans.length} book slot(s) remaining (${borrowLimitInfo.label})`)
                  : 'Primary pupil limits are handled manually by the primary librarian'}
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Holds</span>
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="font-display font-black text-2xl text-slate-900">
                {myLearnerHolds.length}
              </div>
              <p className="text-[11px] text-slate-500">24h reservation hold status</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">My Reviews</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-display font-black text-2xl text-slate-900">
                {mySubmissions.length}
              </div>
              <p className="text-[11px] text-slate-500">Contributions to school gallery</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Class / Grade</span>
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-display font-black text-xl text-slate-900 truncate">
                {currentUser?.gradeOrYear || 'Active Student'}
              </div>
              <p className="text-[11px] text-slate-500 truncate font-mono">
                {currentUser?.libraryCardId || 'CARD-ACTIVE'}
              </p>
            </div>
          </div>

          {/* Personal Reading Goals Feature */}
          <PersonalReadingGoals />

          {/* Student Active Loans & Holds Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Active Loans Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">My Active Loans</h3>
                    <p className="text-[11px] text-slate-500">
                      {borrowLimitInfo.maxAllowed !== null
                        ? `Borrow up to ${borrowLimitInfo.maxAllowed} titles (${borrowLimitInfo.label}) for 14 academic days`
                        : 'Loan limits managed manually by the primary section librarian'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {myLearnerLoans.length} {borrowLimitInfo.maxAllowed !== null ? `/ ${borrowLimitInfo.maxAllowed}` : 'active'}
                </span>
              </div>

              <div className="space-y-3">
                {myLearnerLoans.map((loan) => (
                  <div key={loan.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{loan.bookTitle}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Borrowed on {loan.checkoutDate}</p>
                      </div>
                      {loan.status === 'overdue' ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0">
                          Overdue
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0">
                          On Loan
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>Due date: <strong className="text-slate-700">{loan.dueDate}</strong></span>
                      <button
                        type="button"
                        onClick={() => renewLoan(loan.id)}
                        className="text-blue-700 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Renew (+14d)</span>
                      </button>
                    </div>
                  </div>
                ))}

                {myLearnerLoans.length === 0 && (
                  <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">No active book loans</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Explore the library catalog to borrow physical books or listen to digital audiobooks.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/catalog')}
                      className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                    >
                      Browse Available Books →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Active Holds Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-900">Active Holds & Reservations</h3>
                    <p className="text-[11px] text-slate-500">Reserved titles held at desk for 24 hours</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {myLearnerHolds.length}
                </span>
              </div>

              <div className="space-y-3">
                {myLearnerHolds.map((hold) => (
                  <div key={hold.id} className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-amber-950 text-sm leading-snug">{hold.bookTitle}</h4>
                        <p className="text-[11px] text-amber-800/80 mt-0.5">Reserved on {hold.holdDate}</p>
                      </div>
                      <span className="bg-amber-200 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0">
                        Reserved
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-900 pt-2 border-t border-amber-200/60">
                      <span>Collect before: <strong>{hold.expiryDate}</strong></span>
                      <button
                        type="button"
                        onClick={() => releaseHold(hold.id)}
                        className="text-rose-700 hover:text-rose-800 font-bold hover:underline cursor-pointer"
                      >
                        Cancel Hold
                      </button>
                    </div>
                  </div>
                ))}

                {myLearnerHolds.length === 0 && (
                  <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                    <Lock className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">No active holds</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Place a hold on any catalog title to ensure it is reserved at the desk for you.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* My Digital eBooks & Reading Tracking (Page-by-page progress & notification controls) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    My Digital eBooks &amp; Reading Progress
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Page-by-page reader progress, tracked pages flipped, duration per page, and reminder settings
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setInventoryFilter('ebook');
                  navigate('/catalog');
                }}
                className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Browse Digital Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {userReadingProgress.map((record) => {
                const bookObj = (allBooks || books).find(b => b.id === record.bookId) || {
                  id: record.bookId,
                  title: record.bookTitle,
                  author: record.author,
                  coverUrl: record.coverUrl,
                  inventoryType: 'ebook',
                } as any;

                const avgSecondsPerPage = Math.round(
                  record.totalDurationSeconds / Math.max(1, record.pagesFlippedCount || 1)
                );

                return (
                  <div 
                    key={record.id || record.bookId}
                    className="p-4 bg-slate-50 hover:bg-purple-50/30 rounded-2xl border border-slate-200/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-12 h-16 rounded-xl overflow-hidden bg-slate-200 shadow-xs shrink-0 border border-slate-200">
                        <img
                          src={record.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700'}
                          alt={record.bookTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {record.bookTitle}
                          </h4>
                          {record.status === 'completed' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Finished (100%)</span>
                            </span>
                          ) : record.status === 'more-than-half' ? (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <BookOpen className="w-2.5 h-2.5" />
                              <span>More Than Half Read (&gt;50%)</span>
                            </span>
                          ) : record.status === 'just-started' ? (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Just Started
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">By {record.author}</p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1">
                          <span>Stopped on <strong>Page {record.currentPage} of {record.totalPages}</strong> ({record.percentCompleted}%)</span>
                          <span>•</span>
                          <span><strong>{record.pagesFlippedCount || 0}</strong> pages flipped</span>
                          <span>•</span>
                          <span>Avg <strong>{avgSecondsPerPage}s</strong> / page</span>
                          <span>•</span>
                          <span>{formatReadingDuration(record.totalDurationSeconds)} reading time</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-md h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              record.status === 'completed' ? 'bg-emerald-600' : 'bg-purple-600'
                            }`}
                            style={{ width: `${Math.min(100, record.percentCompleted)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0">
                      {/* Notification Bell Toggle Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = record.notificationsEnabled === false;
                          toggleBookNotification(record.bookId, next);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                          record.notificationsEnabled !== false
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={record.notificationsEnabled !== false ? 'Notifications enabled. Click to mute reminders for this book.' : 'Notifications muted. Click to turn on reminders for this book.'}
                      >
                        {record.notificationsEnabled !== false ? (
                          <>
                            <Bell className="w-3.5 h-3.5 text-purple-600" />
                            <span>Reminders On</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>Reminders Muted</span>
                          </>
                        )}
                      </button>

                      {/* Resume / Continue Reading Button */}
                      <button
                        type="button"
                        onClick={() => openEBookReader(bookObj, record.currentPage)}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Continue from Page {record.currentPage}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {userReadingProgress.length === 0 && (
                <div className="text-center py-8 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">No active eBook sessions</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Open any digital eBook in the library to start reading page-by-page. Your progress, pages flipped, and reading duration will be automatically saved.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setInventoryFilter('ebook');
                      navigate('/catalog');
                    }}
                    className="mt-2 text-xs font-bold text-purple-700 hover:text-purple-800 underline cursor-pointer"
                  >
                    Explore Digital eBooks →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recommended for Your Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">
                  Recommended Books
                </h3>
                <p className="text-xs text-slate-500">Popular and curated titles available for immediate checkout</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/catalog')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recommendedBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                >
                  <div className="aspect-3/4 rounded-xl overflow-hidden bg-slate-200 shadow-2xs">
                    <img 
                      src={book.coverUrl || book.coverImage} 
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-600">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px]">
                      <span className="font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate">
                        {book.category}
                      </span>
                      <span className="font-bold text-emerald-700">Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= B. STAFF / TEACHER DASHBOARD ======================= */}
      {isStaff && !isAdmin && (
        <div className="space-y-8">
          {/* Key Staff Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Reviews</span>
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <div className="font-display font-black text-3xl text-slate-900">
                {pendingSubmissions.length}
              </div>
              <p className="text-xs text-slate-500">Submissions waiting for review</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Collection</span>
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="font-display font-black text-3xl text-slate-900">
                {totalBooksCount}
              </div>
              <p className="text-xs text-slate-500">Titles in school library holdings</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Student Loans</span>
                <Library className="w-5 h-5 text-purple-600" />
              </div>
              <div className="font-display font-black text-3xl text-slate-900">
                {activeLoans.length}
              </div>
              <p className="text-xs text-slate-500">Current circulation across all grades</p>
            </div>
          </div>

          {/* Pending Reviews Queue Preview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">Student Review Queue</h3>
                <p className="text-xs text-slate-500">Approve or reject student reading responses and book creative works</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/moderator')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {pendingSubmissions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{sub.title}</span>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {sub.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">By <strong>{sub.authorName}</strong> • {sub.createdAt}</p>
                    <p className="text-xs text-slate-600 line-clamp-1 italic">"{sub.content}"</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => approveSubmission(sub.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectSubmission(sub.id, 'Needs more detail')}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}

              {pendingSubmissions.length === 0 && (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">Review queue is all clear!</p>
                  <p className="text-[11px] text-slate-400">No submissions currently pending moderation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= C. ADMIN / LIBRARIAN DASHBOARD ======================= */}
      {isAdmin && (
        <div className="space-y-8">
          {/* Key Operational Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Holdings</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="font-display font-black text-2xl sm:text-3xl text-slate-900">
                {totalBooksCount}
              </div>
              <p className="text-[11px] text-slate-500">{totalBooksCount} active library titles</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Loans</span>
                <Library className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="font-display font-black text-2xl sm:text-3xl text-slate-900">
                {activeLoans.length}
              </div>
              <p className="text-[11px] text-slate-500">Checked out to learners</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Overdue Items</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="font-display font-black text-2xl sm:text-3xl text-rose-600">
                {overdueLoans.length}
              </div>
              <p className="text-[11px] text-slate-500">Requires return notice</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Holds</span>
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="font-display font-black text-2xl sm:text-3xl text-slate-900">
                {holds.filter(h => h.status === 'active').length}
              </div>
              <p className="text-[11px] text-slate-500">Awaiting desk collection</p>
            </div>
          </div>

          {/* 1. SEPARATE INVENTORY SPACES BREAKDOWN (Physical vs eBook Data) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Library Inventory Spaces Breakdown
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Physical inventory and digital eBook holdings stored in distinct database partitions with unified management
                </p>
              </div>

              {/* Space View Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setInventoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    inventoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Consolidated ({inventoryMetrics.totalOverallCount})
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryFilter('physical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    inventoryFilter === 'physical'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Physical Space ({inventoryMetrics.totalPhysicalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryFilter('ebook')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    inventoryFilter === 'ebook'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  eBook Space ({inventoryMetrics.totalEbookCount})
                </button>
              </div>
            </div>

            {/* 3 Telemetry Cards for the Partitioned Inventory Spaces */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Partition 1: Overall Consolidated Catalog */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-700" />
                    <span>Overall Holdings Space</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    p_books_v3
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="font-display font-black text-2xl text-slate-900">
                    {inventoryMetrics.totalOverallCount} <span className="text-xs font-medium text-slate-500">Titles Cataloged</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {inventoryMetrics.physicalCopiesTotal} physical hard copies + {inventoryMetrics.totalEbookCount} digital eBook editions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInventoryFilter('all');
                    navigate('/catalog');
                  }}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Inspect Overall Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Partition 2: Physical Inventory Space */}
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                    <span>Physical Hard Copy Space</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-blue-900 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                    p_physical_inv
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="font-display font-black text-2xl text-blue-950">
                    {inventoryMetrics.totalPhysicalCount} <span className="text-xs font-medium text-blue-700">Hard Copy Titles</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-blue-900 font-medium">
                    <span><strong>{inventoryMetrics.physicalCopiesAvailable}</strong> On Shelves</span>
                    <span>•</span>
                    <span><strong>{inventoryMetrics.physicalCopiesOnLoan}</strong> On Loan</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInventoryFilter('physical');
                    navigate('/catalog');
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Filter Physical Holdings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Partition 3: Digital eBook Space */}
              <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-purple-700" />
                    <span>Digital eBook Space</span>
                  </span>
                  <span className="text-xs font-bold font-mono text-purple-900 bg-white px-2 py-0.5 rounded-md border border-purple-200">
                    p_ebook_inv
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="font-display font-black text-2xl text-purple-950">
                    {inventoryMetrics.totalEbookCount} <span className="text-xs font-medium text-purple-700">eBook Titles</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-purple-900 font-medium">
                    <span><strong>{inventoryMetrics.ebookActiveReaders}</strong> Active Readers</span>
                    <span>•</span>
                    <span><strong>{inventoryMetrics.ebookCompletedReads}</strong> Completed</span>
                    <span>•</span>
                    <span><strong>{inventoryMetrics.ebookHalfwayReads}</strong> &gt;50%</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInventoryFilter('ebook');
                    navigate('/catalog');
                  }}
                  className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <span>Filter eBook Space</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. DIGITAL READING & BOOK COMPLETION TRACKER (Track pages flipped & duration per page) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    eBook Reading &amp; Completion Tracker
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Verifies if readers finished or read more than half using tracked pages flipped and duration per page
                </p>
              </div>

              {/* Status breakdown pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {readingProgressRecords.filter(r => r.status === 'completed').length} Finished Reads
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {readingProgressRecords.filter(r => r.status === 'more-than-half').length} Read &gt; 50%
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {readingProgressRecords.filter(r => r.status !== 'completed' && r.status !== 'more-than-half').length} In Progress
                </span>
              </div>
            </div>

            {/* Reading Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Student / Reader</th>
                    <th className="py-2.5 px-3">Book Title</th>
                    <th className="py-2.5 px-3">Pages Progress</th>
                    <th className="py-2.5 px-3">Pages Flipped</th>
                    <th className="py-2.5 px-3">Duration / Page</th>
                    <th className="py-2.5 px-3">Total Time</th>
                    <th className="py-2.5 px-3">Status Milestone</th>
                    <th className="py-2.5 px-3 text-right">Pace Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {readingProgressRecords.map((rec) => {
                    const avgSec = Math.round(rec.totalDurationSeconds / Math.max(1, rec.pagesFlippedCount || 1));
                    const isGenuinePace = avgSec >= 15;

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {rec.learnerName}
                        </td>
                        <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate">
                          {rec.bookTitle}
                        </td>
                        <td className="py-3 px-3">
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-800">
                              Page {rec.currentPage} of {rec.totalPages} ({rec.percentCompleted}%)
                            </span>
                            <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  rec.status === 'completed' ? 'bg-emerald-600' : 'bg-blue-600'
                                }`}
                                style={{ width: `${rec.percentCompleted}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {rec.pagesFlippedCount || 0} flips
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700">
                          {avgSec}s / page
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {formatReadingDuration(rec.totalDurationSeconds)}
                        </td>
                        <td className="py-3 px-3">
                          {rec.status === 'completed' ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Finished (100%)</span>
                            </span>
                          ) : rec.status === 'more-than-half' ? (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                              <BookOpen className="w-2.5 h-2.5" />
                              <span>Read &gt; 50%</span>
                            </span>
                          ) : rec.status === 'just-started' ? (
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full w-max">
                              Just Started
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-max">
                              In Progress
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isGenuinePace ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Genuine Pace
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              Fast Skim
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {readingProgressRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-xs text-slate-400">
                        No student reading sessions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Librarian Quick Operational Desk Shortcuts */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <h3 className="font-display font-black text-lg text-slate-900">
              Circulation Desk & Administrative Utilities
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => navigate('/circulation')}
                className="p-4 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 rounded-2xl text-left transition group cursor-pointer space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
                  <Library className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">Circulation Desk</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Check-out, returns & overdue log</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/desk-utilities')}
                className="p-4 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 rounded-2xl text-left transition group cursor-pointer space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">Desk Utilities</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Barcode scanner & user accounts</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsRosterModalOpen(true)}
                className="p-4 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 rounded-2xl text-left transition group cursor-pointer space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">Class Rosters</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Manage learner cohorts & cards</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate('/analytics')}
                className="p-4 bg-slate-50 hover:bg-purple-50/70 border border-slate-200/80 hover:border-purple-300 rounded-2xl text-left transition group cursor-pointer space-y-2"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-purple-700">Library Analytics</div>
                  <p className="text-[11px] text-slate-500 mt-0.5">DDC reports & circulation trends</p>
                </div>
              </button>
            </div>
          </div>

          {/* Active Loans & Overdue Monitoring Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-slate-900">Current Circulation Roster</h3>
                <p className="text-xs text-slate-500">Live tracker of checked-out books across campuses</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/circulation')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Full Circulation Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Borrower</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeLoans.slice(0, 5).map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 font-bold text-slate-900 max-w-[200px] truncate">
                        {loan.bookTitle}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{loan.learnerName}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{loan.dueDate}</td>
                      <td className="py-3 px-3">
                        {loan.status === 'overdue' ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Overdue
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => returnBook(loan.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        >
                          Return
                        </button>
                        {loan.status === 'overdue' && (
                          <button
                            type="button"
                            onClick={() => sendOverdueAlert(loan.id)}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                          >
                            Remind
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {activeLoans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                        No active loans currently checked out.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------------
       * 4. NOTICES & BULLETIN (ACCOMMODATING BOTH CAMPUSES)
       * ------------------------------------------------------------------------- */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
        <AnnouncementBoard isHomePreview={false} />
      </section>

    </div>
  );
};
