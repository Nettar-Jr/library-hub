/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Book, EBookPage, PageDwellRecord, ReadingMilestone } from '../types';
import { 
  getOrGenerateEBookPages, 
  calculateReadingMilestone, 
  formatReadingDuration 
} from '../utils/ebookUtils';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookmarkCheck, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Maximize2, 
  Minimize2, 
  Bell, 
  BellOff, 
  RotateCcw,
  Sun,
  Moon,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EBookReaderModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  initialPage?: number;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';
type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';

export const EBookReaderModal: React.FC<EBookReaderModalProps> = ({
  book,
  isOpen,
  onClose,
  initialPage
}) => {
  const { 
    currentUser, 
    loggedInLearner, 
    currentLearnerName, 
    getReadingProgress, 
    saveReadingProgress,
    toggleBookNotification
  } = useApp();

  const learnerId = currentUser?.id || loggedInLearner?.id || 'guest-reader';
  const learnerName = currentUser?.nickname || currentUser?.name || loggedInLearner?.name || currentLearnerName || 'Reader';

  // Retrieve saved progress if exists
  const existingProgress = getReadingProgress(book.id, learnerId);

  // Pages derived from book.ebookPages or curated fallback
  const pages: EBookPage[] = React.useMemo(() => {
    if (book.ebookPages && book.ebookPages.length > 0) {
      return book.ebookPages;
    }
    return getOrGenerateEBookPages(book);
  }, [book]);

  const totalPages = pages.length;

  // Starting page: priority to initialPage prop, then saved progress, then page 1
  const startingPage = Math.max(
    1, 
    Math.min(
      totalPages, 
      initialPage || existingProgress?.currentPage || 1
    )
  );

  const [currentPage, setCurrentPage] = useState<number>(startingPage);
  const [highestPage, setHighestPage] = useState<number>(existingProgress?.highestPageRead || startingPage);
  const [pagesFlipped, setPagesFlipped] = useState<number>(existingProgress?.pagesFlippedCount || 0);
  const [totalSeconds, setTotalSeconds] = useState<number>(existingProgress?.totalDurationSeconds || 0);
  const [pageDwells, setPageDwells] = useState<PageDwellRecord[]>(existingProgress?.pageDwells || []);
  const [notificationsOn, setNotificationsOn] = useState<boolean>(existingProgress?.notificationsEnabled !== false);

  // Per-page dwell time tracker
  const [currentPageSeconds, setCurrentPageSeconds] = useState<number>(0);
  const currentPageStartRef = useRef<number>(Date.now());

  // Reading interface appearance states
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [fontSize, setFontSize] = useState<ReaderFontSize>('base');
  const [isControlsVisible, setIsControlsVisible] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const contentContainerRef = useRef<HTMLDivElement>(null);

  // When initialPage or book changes, reset to proper starting position
  useEffect(() => {
    if (isOpen) {
      const p = Math.max(1, Math.min(totalPages, initialPage || existingProgress?.currentPage || 1));
      setCurrentPage(p);
      setHighestPage(prev => Math.max(prev, p, existingProgress?.highestPageRead || 1));
      setNotificationsOn(existingProgress?.notificationsEnabled !== false);
      setCurrentPageSeconds(0);
      currentPageStartRef.current = Date.now();
    }
  }, [isOpen, book.id, initialPage]);

  // Dwell timer effect: ticks every second while active
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Only increment if document is active / visible
      if (typeof document !== 'undefined' && !document.hidden) {
        setCurrentPageSeconds(prev => prev + 1);
        setTotalSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Record dwell time when flipping pages or closing
  const recordCurrentPageDwell = (pageLeaving: number) => {
    const dwell = currentPageSeconds;
    if (dwell > 0) {
      setPageDwells(prev => {
        const next = [...prev];
        const existingIdx = next.findIndex(d => d.pageNumber === pageLeaving);
        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            durationSeconds: next[existingIdx].durationSeconds + dwell,
            timestamp: new Date().toISOString()
          };
        } else {
          next.push({
            pageNumber: pageLeaving,
            durationSeconds: dwell,
            timestamp: new Date().toISOString()
          });
        }
        return next;
      });
    }
    setCurrentPageSeconds(0);
    currentPageStartRef.current = Date.now();
  };

  // Synchronize state back into progress store
  const persistProgress = (
    targetPage: number, 
    dwellAcc: PageDwellRecord[] = pageDwells,
    totalSecs: number = totalSeconds,
    notif: boolean = notificationsOn
  ) => {
    const newHighest = Math.max(highestPage, targetPage);
    const milestone: ReadingMilestone = calculateReadingMilestone(targetPage, totalPages, totalSecs, pagesFlipped, dwellAcc);
    const pct = Math.min(100, Math.round((targetPage / totalPages) * 100));

    saveReadingProgress({
      id: `${learnerId}_${book.id}`,
      userId: learnerId,
      learnerName: learnerName,
      bookId: book.id,
      bookTitle: book.title,
      author: book.author,
      coverUrl: book.coverUrl || book.coverImage,
      totalPages: totalPages,
      currentPage: targetPage,
      highestPageRead: newHighest,
      pagesFlippedCount: pagesFlipped,
      totalDurationSeconds: totalSecs,
      pageDwells: dwellAcc,
      status: milestone,
      percentCompleted: pct,
      startedAt: existingProgress?.startedAt || new Date().toISOString(),
      lastReadAt: new Date().toISOString(),
      completedAt: milestone === 'completed' ? (existingProgress?.completedAt || new Date().toISOString()) : undefined,
      notificationsEnabled: notif
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    
    // Save dwell on page leaving
    recordCurrentPageDwell(currentPage);
    
    setCurrentPage(newPage);
    setHighestPage(prev => Math.max(prev, newPage));
    setPagesFlipped(prev => prev + 1);

    // Scroll reader content to top smoothly
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0;
    }

    persistProgress(newPage);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  // Keyboard navigation (Left/Right arrows, Esc to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === 'Escape') {
        handleCloseAndBookmark();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentPage, totalPages]);

  const handleCloseAndBookmark = () => {
    recordCurrentPageDwell(currentPage);
    persistProgress(currentPage);
    onClose();
  };

  const handleToggleNotifications = () => {
    const nextVal = !notificationsOn;
    setNotificationsOn(nextVal);
    toggleBookNotification(book.id, nextVal);
    persistProgress(currentPage, pageDwells, totalSeconds, nextVal);
    setToastMessage(nextVal ? 'Reading reminders enabled for this title.' : 'Reminders muted for this title.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentMilestone = calculateReadingMilestone(currentPage, totalPages, totalSeconds, pagesFlipped, pageDwells);
  const percentCompleted = Math.min(100, Math.round((currentPage / totalPages) * 100));

  const activePageData = pages[currentPage - 1] || {
    pageNumber: currentPage,
    chapterTitle: `Page ${currentPage}`,
    content: 'Content loading...'
  };

  // Theme-specific styles
  const themeStyles = {
    light: {
      bg: 'bg-white',
      text: 'text-slate-900',
      prose: 'text-slate-800',
      headerBg: 'bg-white/95 border-slate-200/90 text-slate-800',
      footerBg: 'bg-white/95 border-slate-200/90 text-slate-800',
      bookCard: 'bg-white border-slate-200/80 shadow-md',
      pageSubtle: 'text-slate-400',
      highlight: 'bg-blue-50 text-blue-900 border-blue-200'
    },
    sepia: {
      bg: 'bg-[#fbf0d9]',
      text: 'text-[#433422]',
      prose: 'text-[#433422]',
      headerBg: 'bg-[#f4e4c1]/95 border-[#e4ce9e] text-[#433422]',
      footerBg: 'bg-[#f4e4c1]/95 border-[#e4ce9e] text-[#433422]',
      bookCard: 'bg-[#fbf0d9] border-[#e4ce9e] shadow-md',
      pageSubtle: 'text-[#8b7355]',
      highlight: 'bg-[#e9d6b2] text-[#433422] border-[#d8be92]'
    },
    dark: {
      bg: 'bg-slate-950',
      text: 'text-slate-100',
      prose: 'text-slate-200',
      headerBg: 'bg-slate-900/95 border-slate-800 text-slate-100',
      footerBg: 'bg-slate-900/95 border-slate-800 text-slate-100',
      bookCard: 'bg-slate-900 border-slate-800 shadow-2xl',
      pageSubtle: 'text-slate-500',
      highlight: 'bg-slate-800 text-blue-300 border-slate-700'
    }
  }[theme];

  const fontSizeClasses = {
    sm: 'text-xs sm:text-sm leading-relaxed sm:leading-loose',
    base: 'text-sm sm:text-base leading-relaxed sm:leading-loose',
    lg: 'text-base sm:text-lg leading-relaxed sm:leading-loose',
    xl: 'text-lg sm:text-xl leading-relaxed sm:leading-loose'
  }[fontSize];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm select-none"
        aria-modal="true"
        role="dialog"
        aria-label={`Reading ${book.title}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 12 }}
          transition={{ duration: 0.2 }}
          className={`w-full ${isFullscreen ? 'h-full max-h-screen rounded-none' : 'max-w-4xl h-full sm:h-[92vh] sm:rounded-3xl'} flex flex-col overflow-hidden shadow-2xl border transition-colors ${themeStyles.bg} ${themeStyles.headerBg.split(' ')[1]}`}
        >
          {/* Top Bar Navigation & Tracking Controls */}
          <header className={`px-4 sm:px-6 py-3 border-b backdrop-blur-md flex items-center justify-between gap-3 shrink-0 z-20 ${themeStyles.headerBg}`}>
            {/* Left: Book Meta & Cover */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-11 rounded-md overflow-hidden bg-slate-200 shrink-0 border border-slate-300/60 shadow-2xs">
                <img 
                  src={book.coverUrl || book.coverImage} 
                  alt={book.title} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-xs sm:text-sm truncate">
                  {book.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] opacity-75">
                  <span className="truncate">{book.author}</span>
                  <span>•</span>
                  <span className="font-mono font-medium">Page {currentPage} of {totalPages}</span>
                </div>
              </div>
            </div>

            {/* Middle: Live Stats & Milestones */}
            <div className="hidden md:flex items-center gap-3 text-xs">
              {/* Dwell timer */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-black/5 dark:bg-white/5" title="Time spent reading on this page">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                <span className="font-mono text-[11px] font-semibold">{currentPageSeconds}s</span>
                <span className="text-[10px] opacity-60">page</span>
              </div>

              {/* Total Duration */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-black/5 dark:bg-white/5" title="Accumulated reading time">
                <span className="text-[10px] opacity-60">Total:</span>
                <span className="font-mono text-[11px] font-bold">{formatReadingDuration(totalSeconds)}</span>
              </div>

              {/* Completion Milestone Pill */}
              <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                currentMilestone === 'completed' 
                  ? 'bg-emerald-500 text-white border-emerald-600'
                  : currentMilestone === 'more-than-half'
                  ? 'bg-blue-600 text-white border-blue-700'
                  : currentMilestone === 'just-started'
                  ? 'bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-300'
                  : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                {currentMilestone === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Finished (100%)</span>
                  </>
                ) : currentMilestone === 'more-than-half' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Read &gt; 50% ({percentCompleted}%)</span>
                  </>
                ) : (
                  <span>{percentCompleted}% Read</span>
                )}
              </div>
            </div>

            {/* Right: Customization & Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Reminder toggle */}
              <button
                type="button"
                onClick={handleToggleNotifications}
                title={notificationsOn ? "Automated dashboard reminders are ON for this title. Click to mute." : "Reminders are muted for this title. Click to re-enable."}
                className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                  notificationsOn 
                    ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40' 
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {notificationsOn ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                <span className="hidden xl:inline text-[11px]">{notificationsOn ? 'Remind' : 'Muted'}</span>
              </button>

              {/* Theme Toggle (Light / Sepia / Dark) */}
              <div className="flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-lg transition ${theme === 'light' ? 'bg-white text-slate-900 shadow-2xs' : 'opacity-60 hover:opacity-100'}`}
                  title="Day Theme"
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('sepia')}
                  className={`p-1.5 rounded-lg transition font-bold text-xs ${theme === 'sepia' ? 'bg-[#fbf0d9] text-[#433422] shadow-2xs' : 'opacity-60 hover:opacity-100'}`}
                  title="Warm Sepia Theme"
                >
                  <span className="w-3.5 h-3.5 block text-center leading-none">📖</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'bg-slate-800 text-white shadow-2xs' : 'opacity-60 hover:opacity-100'}`}
                  title="Night Theme"
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Font Size Adjuster */}
              <div className="hidden sm:flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-xl border border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    const sizes: ReaderFontSize[] = ['sm', 'base', 'lg', 'xl'];
                    const idx = sizes.indexOf(fontSize);
                    if (idx > 0) setFontSize(sizes[idx - 1]);
                  }}
                  disabled={fontSize === 'sm'}
                  className="px-2 py-1 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  title="Smaller Font"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sizes: ReaderFontSize[] = ['sm', 'base', 'lg', 'xl'];
                    const idx = sizes.indexOf(fontSize);
                    if (idx < sizes.length - 1) setFontSize(sizes[idx + 1]);
                  }}
                  disabled={fontSize === 'xl'}
                  className="px-2 py-1 text-xs font-bold disabled:opacity-30 cursor-pointer"
                  title="Larger Font"
                >
                  A+
                </button>
              </div>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hidden sm:flex p-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Reader"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close & Bookmark Save */}
              <button
                type="button"
                onClick={handleCloseAndBookmark}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ml-1"
                title="Bookmark current page and return to catalog"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Bookmark &amp; Close</span>
              </button>
            </div>
          </header>

          {/* Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto mt-2 z-30 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-full shadow-lg border border-slate-700 flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reader Body / Book Page Content Area */}
          <div 
            ref={contentContainerRef}
            className={`flex-1 overflow-y-auto px-4 sm:px-12 md:px-20 py-8 sm:py-12 flex flex-col justify-between items-center transition-colors relative ${themeStyles.bg}`}
          >
            {/* Book Paper Sheet Container */}
            <article className={`w-full max-w-2xl min-h-[460px] p-6 sm:p-12 rounded-3xl transition-all border ${themeStyles.bookCard} flex flex-col justify-between relative`}>
              
              {/* Running Chapter Header */}
              <div className="flex items-center justify-between border-b pb-3 mb-6 border-black/10 dark:border-white/10 text-xs uppercase tracking-wider font-semibold opacity-60">
                <span className="truncate">{activePageData.chapterTitle || `Chapter ${Math.ceil(currentPage / 3)}`}</span>
                <span className="font-mono text-[11px] shrink-0">Page {currentPage}</span>
              </div>

              {/* Primary Manuscript Text */}
              <div className={`flex-1 font-serif select-text whitespace-pre-line leading-relaxed ${fontSizeClasses} ${themeStyles.prose}`}>
                {activePageData.content}
              </div>

              {/* Running Footer Bookmark Status */}
              <div className="mt-8 pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-xs opacity-60">
                <div className="flex items-center gap-1.5 font-sans text-[11px]">
                  <BookMarked className="w-3.5 h-3.5 text-blue-500" />
                  <span>Auto-saved to your personal reading record</span>
                </div>
                <div className="font-mono text-[11px]">
                  {percentCompleted}% Completed
                </div>
              </div>
            </article>
          </div>

          {/* Bottom Navigation & Page Scrubber Bar */}
          <footer className={`px-4 sm:px-8 py-3 border-t backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20 ${themeStyles.footerBg}`}>
            {/* Previous Page Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={handlePrevPage}
                className="px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Page</span>
              </button>

              <span className="sm:hidden text-xs font-mono font-bold">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={handleNextPage}
                className="sm:hidden px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Slider Scrubber */}
            <div className="flex-1 max-w-md w-full flex items-center gap-3">
              <input 
                type="range"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="hidden sm:inline font-mono text-xs font-bold shrink-0 min-w-16 text-right">
                {currentPage} of {totalPages}
              </span>
            </div>

            {/* Next Page Desktop Button */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={handleNextPage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <span>Next Page</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
