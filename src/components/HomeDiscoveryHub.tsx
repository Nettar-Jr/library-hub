/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  Headphones, 
  BookmarkCheck, 
  ArrowRight, 
  LogIn, 
  ShieldCheck, 
  X,
  GraduationCap,
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  Atom,
  Award,
  Users,
  CheckCircle2,
  Tablet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, BOOK_CATEGORIES } from '../types';

export const HomeDiscoveryHub: React.FC = () => {
  const { books, allBooks, currentUser, isLearner, isStaff, isAdmin, checkoutBook, currentLearnerName, loggedInLearner } = useApp();
  const navigate = useNavigate();

  const [selectedBookModal, setSelectedBookModal] = useState<Book | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [playingAudioBookId, setPlayingAudioBookId] = useState<string | null>(null);
  
  // Endless loop slideshow filter state - defaults to 'All Books' so the full catalog database is displayed
  const [slideshowCategory, setSlideshowCategory] = useState<string>('All Books');

  const catalogPool = (allBooks && allBooks.length > 0) ? allBooks : books;

  // Dynamic filter categories derived directly from current catalog database
  const slideshowCategories = React.useMemo(() => {
    const dbCategories = Array.from(
      new Set(catalogPool.map((b) => b.category).filter(Boolean))
    );
    const standard = ['All Books', 'Popular'];
    const rest = dbCategories.filter((c) => c !== 'Popular' && c !== 'All Books');
    return [...standard, ...rest];
  }, [catalogPool]);

  // Priority ordering: latest accessioned catalog titles lead first, then other volumes
  const orderedCatalog = React.useMemo(() => {
    const accessioned = catalogPool.filter(b => !b.id.match(/^book-([1-9]|10)$/));
    const samples = catalogPool.filter(b => b.id.match(/^book-([1-9]|10)$/));
    return [...accessioned, ...samples];
  }, [catalogPool]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleAudioSample = (book: Book, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (playingAudioBookId === book.id) {
      window.speechSynthesis.cancel();
      setPlayingAudioBookId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const textToRead = `Now reading an audio sample from "${book.title}", by ${book.author}. ${book.description || book.summary || 'Welcome to this story in the Premier International School Library.'}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.onend = () => setPlayingAudioBookId(null);
    utterance.onerror = () => setPlayingAudioBookId(null);
    window.speechSynthesis.speak(utterance);
    setPlayingAudioBookId(book.id);
  };

  // Dedicated Read-To-Me Audiobooks for the spotlight shelf
  const audioBooks = catalogPool.filter((b) => b.hasAudio || b.isAudiobook);
  const spotlightAudioBooks = audioBooks.length > 0 ? audioBooks.slice(0, 4) : catalogPool.slice(0, 4);

  // Filtered books for the infinite left-scrolling slideshow from catalog database
  const slideshowBooks = React.useMemo(() => {
    let list: Book[] = [];
    if (slideshowCategory === 'All Books') {
      list = [...orderedCatalog];
    } else if (slideshowCategory === 'Popular') {
      list = orderedCatalog.filter(
        (b) => b.isPopular || (b.rating && b.rating >= 4.8) || b.readsCount > 30 || b.category.toLowerCase().includes('popular')
      );
      if (list.length === 0) list = orderedCatalog.slice(0, 10);
    } else if (slideshowCategory === 'Audiobooks & Read-Aloud') {
      list = orderedCatalog.filter((b) => b.hasAudio || b.isAudiobook);
      if (list.length === 0) list = orderedCatalog.slice(0, 10);
    } else {
      list = orderedCatalog.filter((b) => b.category.toLowerCase().includes(slideshowCategory.toLowerCase()));
      if (list.length === 0) {
        const firstWord = slideshowCategory.split(' ')[0].toLowerCase();
        list = orderedCatalog.filter((b) => b.category.toLowerCase().includes(firstWord));
      }
      if (list.length === 0) list = orderedCatalog;
    }

    if (list.length === 0) {
      list = [...catalogPool];
    }

    // Ensure we have a generous set of covers so the endless marquee loops smoothly
    let expanded = [...list];
    while (expanded.length < 12 && list.length > 0) {
      expanded = [...expanded, ...list];
    }
    return expanded;
  }, [orderedCatalog, catalogPool, slideshowCategory]);

  const handleBookClick = (book: Book) => {
    setSelectedBookModal(book);
  };

  const handleBorrowAttempt = (book: Book) => {
    if (!currentUser) {
      navigate(`/login?redirect=/catalog`);
      return;
    }
    const borrowerName = currentLearnerName || (loggedInLearner ? loggedInLearner.name : currentUser.name);
    const result = checkoutBook(book.id, borrowerName);
    if (result.success) {
      setActionFeedback(`Loan confirmed for "${book.title}". Please pick up your copy at the library desk.`);
      setSelectedBookModal(null);
      setTimeout(() => setActionFeedback(null), 5000);
    } else {
      setActionFeedback(result.message);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const scrollToPreview = () => {
    navigate('/catalog');
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      
      {/* Action Feedback Banner */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-24 right-4 sm:right-8 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg border border-slate-700 flex items-center gap-3 max-w-md text-xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="flex-1">{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
       * 1. HERO SECTION: GETEPIC STYLE WITH BOOK GRID & BLUE BRUSH SWATCH OVERLAY
       * ========================================================================= */}
      <section className="relative min-h-[520px] sm:min-h-[600px] lg:min-h-[660px] flex items-center justify-center overflow-hidden rounded-3xl border border-slate-800/30 text-center shadow-2xl px-3 sm:px-6 py-10 sm:py-14 lg:py-16">
        {/* 1. Background Image Mosaic from hero.png */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-[1.02] hover:scale-105"
          style={{ backgroundImage: `url('/bg-hero.svg')` }}
          aria-hidden="true"
        />

        {/* 2. Center Brush Swatch Overlay & Content Container */}
        <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-4">
          
          {/* Blue Brush Stroke Image Overlay (image.png) */}
          <div className="absolute inset-0 -m-3 sm:-m-6 md:-m-10 pointer-events-none select-none flex items-center justify-center">
            <img 
              src="/brush.svg" 
              alt="Blue brush banner" 
              className="w-full h-full object-fill drop-shadow-[0_20px_35px_rgba(0,0,0,0.65)] filter"
              aria-hidden="true"
            />
          </div>

          {/* Text and CTAs On Top of the Blue Brush Swatch */}
          <div className="relative z-20 px-6 sm:px-12 md:px-16 py-8 sm:py-12 md:py-14 flex flex-col items-center text-center space-y-4 sm:space-y-6 max-w-3xl">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-display font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-[1.14] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                Discover books for learning, track and build reading habits, access varieties of books and much more!
              </h1>
              <p className="text-white text-sm sm:text-lg md:text-xl leading-relaxed font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] max-w-xl mx-auto">
                Log in and enter a world of endless possibilities.
              </p>
            </div>

            {/* Call to Actions */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {!currentUser ? (
                <>
                  {/* Sign In Button with Background Color White */}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="bg-white hover:bg-slate-100 active:bg-slate-200 text-blue-700 font-black text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl shadow-xl shadow-black/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    Sign in
                  </button>

                  {/* Preview Catalogue Button */}
                  <button
                    type="button"
                    onClick={scrollToPreview}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl border-2 border-white/90 backdrop-blur-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xl shadow-black/20"
                  >
                    Preview Catalogue
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/catalog')}
                    className="bg-white hover:bg-slate-100 active:bg-slate-200 text-blue-700 font-black text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl shadow-xl shadow-black/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    onClick={scrollToPreview}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-sm sm:text-base px-8 py-3.5 sm:py-4 rounded-xl border-2 border-white/90 backdrop-blur-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xl shadow-black/20"
                  >
                    Preview Catalogue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 2. EPIC FEATURE A: SCHOOL READING IMPACT & MILESTONES STRIP
       * ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">2,400+</div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Books &amp; Resources</div>
          </div>
        </div>

        <div className="bg-white px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">Read-To-Me</div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Narrated Audiobooks</div>
          </div>
        </div>

        <div className="bg-white px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Tablet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">E-Books</div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Digital Editions</div>
          </div>
        </div>

        <div className="bg-white px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">100% Aligned</div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Cambridge &amp; National</div>
          </div>
        </div>
      </div>

      {/* =========================================================================
       * 3. EPIC FEATURE B: ENDLESS LOOP LEFT SLIDESHOW (BOOK COVERS ONLY)
       * Note: background color removed, title/description removed, cards are book covers only,
       * endless loop left slideshow, category filter words above.
       * ========================================================================= */}
      <section className="relative w-full space-y-4 py-2">
        {/* Category & Collection Filter Words Above Book Cards */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
          {slideshowCategories.map((cat) => {
            const isActive = slideshowCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSlideshowCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm font-bold'
                    : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Endless Loop Left Slideshow (Book Covers Only) */}
        <div className="relative w-full overflow-hidden py-2">
          {/* Subtle edge fade gradient mask */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-slate-50 to-transparent z-10" />

          <div className="animate-infinite-scroll flex gap-4 sm:gap-6 items-center">
            {/* Set 1 of Book Covers */}
            {slideshowBooks.map((book, idx) => (
              <div
                key={`slide-1-${book.id}-${idx}`}
                onClick={() => handleBookClick(book)}
                className="w-32 sm:w-40 md:w-44 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer bg-slate-200 border border-slate-200/60 relative group"
                title={`${book.title} by ${book.author}`}
              >
                <img
                  src={book.coverImage || book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700';
                  }}
                />
              </div>
            ))}

            {/* Set 2 of Book Covers (Endless Loop Duplicate) */}
            {slideshowBooks.map((book, idx) => (
              <div
                key={`slide-2-${book.id}-${idx}`}
                onClick={() => handleBookClick(book)}
                className="w-32 sm:w-40 md:w-44 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer bg-slate-200 border border-slate-200/60 relative group"
                title={`${book.title} by ${book.author}`}
              >
                <img
                  src={book.coverImage || book.coverUrl}
                  alt={book.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 4. EPIC FEATURE D: DUAL AUDIENCE PORTALS ("FOR STUDENTS" & "FOR EDUCATORS")
       * ========================================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
        {/* Portal 1: For Students / Learners */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl px-4 sm:px-5 py-5 sm:py-6 border border-blue-100 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              For Students &amp; Young Readers
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Find your next favorite story, listen to read-aloud audiobooks, borrow print copies using your student library card, and build daily reading habits.
            </p>
            <ul className="space-y-1.5 pt-1 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Borrow up to 2 books simultaneously</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Unlimited audio narration and read-aloud playback</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Browse titles tailored to Primary and Secondary branches</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => navigate(currentUser ? '/catalog' : '/login?redirect=/catalog')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
            >
              <span>{currentUser ? 'Explore Student Bookshelf' : 'Student Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Portal 2: For Teachers & Faculty */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-3xl px-4 sm:px-5 py-5 sm:py-6 border border-slate-200 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-display font-extrabold text-xl text-slate-900">
              For Educators &amp; Library Staff
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Manage class borrowing rosters, reserve curriculum sets for term instruction, view student borrowing records, and review book holds across both school branches.
            </p>
            <ul className="space-y-1.5 pt-1 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Universal access to Primary and College catalog inventories</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Classroom roster management &amp; loan tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                <span>Post official notices and book return deadlines</span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <button
              type="button"
              onClick={() => navigate(currentUser && (isStaff || isAdmin) ? '/circulation' : '/login?target=circulation')}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
            >
              <span>{currentUser && (isStaff || isAdmin) ? 'Staff Circulation Desk' : 'Faculty Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Book Detail Modal (Calm Institutional Preview) */}
      <AnimatePresence>
        {selectedBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-5 text-left"
            >
              <button
                type="button"
                onClick={() => setSelectedBookModal(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-4">
                <div className="w-24 h-36 rounded-xl bg-slate-100 overflow-hidden shadow-sm shrink-0 border border-slate-200">
                  <img
                    src={selectedBookModal.coverImage || selectedBookModal.coverUrl}
                    alt={selectedBookModal.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 min-w-0 pr-6 space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                    {selectedBookModal.section === 'primary' ? 'Primary Library' : 'College Library'}
                  </span>
                  <h3 className="font-display font-bold text-base sm:text-lg text-slate-900 leading-snug">
                    {selectedBookModal.title}
                  </h3>
                  <p className="text-xs text-slate-600">{selectedBookModal.author}</p>
                  
                  <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                      Class {selectedBookModal.deweyClass}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      selectedBookModal.availableCopies > 0 
                        ? 'bg-emerald-50 text-emerald-800' 
                        : 'bg-rose-50 text-rose-800'
                    }`}>
                      {selectedBookModal.availableCopies > 0 
                        ? `${selectedBookModal.availableCopies} available` 
                        : 'Currently loaned'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
                {selectedBookModal.description || selectedBookModal.summary || 'Official academic holding in the school collection.'}
              </div>

              {/* Read Aloud Audio Sample Player if available */}
              {(selectedBookModal.hasAudio || selectedBookModal.isAudiobook) && (
                <div className="bg-purple-50/70 border border-purple-200/70 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-purple-900">Audio Narration Available</div>
                      <div className="text-[10px] text-purple-700">Listen to a read-aloud sample</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => toggleAudioSample(selectedBookModal, e)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    {playingAudioBookId === selectedBookModal.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{playingAudioBookId === selectedBookModal.id ? 'Stop' : 'Listen Sample'}</span>
                  </button>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBookModal(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>

                {!currentUser ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookModal(null);
                      navigate('/login?redirect=/catalog');
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign in to borrow</span>
                  </button>
                ) : isLearner ? (
                  <button
                    type="button"
                    disabled={selectedBookModal.availableCopies <= 0}
                    onClick={() => handleBorrowAttempt(selectedBookModal)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                      selectedBookModal.availableCopies > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>Borrow Book</span>
                  </button>
                ) : null}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
