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
  Tablet,
  Library,
  Star,
  Pencil,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, BOOK_CATEGORIES } from '../types';
import { EditBookModal } from './EditBookModal';

export const HomeDiscoveryHub: React.FC = () => {
  const { 
    books, 
    allBooks, 
    currentUser, 
    isLearner, 
    isStaff, 
    isAdmin, 
    createHold, 
    holds,
    currentLearnerName, 
    loggedInLearner 
  } = useApp();
  const navigate = useNavigate();

  const [selectedBookModal, setSelectedBookModal] = useState<Book | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
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

  const handleReserveAttempt = (book: Book) => {
    if (!currentUser) {
      navigate(`/login?redirect=/catalog`);
      return;
    }
    const res = createHold(book.id, currentUser.id);
    if (res.success) {
      setActionFeedback(`Reservation confirmed for "${book.title}". Please collect your copy from the library desk within 24 hours.`);
      setSelectedBookModal(null);
      setTimeout(() => setActionFeedback(null), 5000);
    } else {
      setActionFeedback(res.message);
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
        <div className="relative z-10 w-full max-w-3xl lg:max-w-[830px] mx-auto flex flex-col items-center justify-center py-3 px-2 sm:px-4">
          
          {/* Blue Brush Stroke Image Overlay (image.png) */}
          <div className="absolute inset-0 -m-1 sm:-m-2 md:-m-3 pointer-events-none select-none flex items-center justify-center">
            <img 
              src="/brush.svg" 
              alt="Blue brush banner" 
              className="w-full h-full object-fill drop-shadow-[0_18px_32px_rgba(0,0,0,0.6)] filter"
              aria-hidden="true"
            />
          </div>

          {/* Text and CTAs On Top of the Blue Brush Swatch */}
          <div className="relative z-20 px-6 sm:px-11 md:px-14 py-8 sm:py-10 md:py-12 flex flex-col items-center text-center space-y-3.5 sm:space-y-5 max-w-2xl">
            <div className="space-y-2.5 sm:space-y-3">
              <h1 className="font-display font-black text-xl sm:text-3xl md:text-[2.5rem] text-white tracking-tight leading-[1.15] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                Discover books for learning, track and build reading habits, access varieties of books and much more!
              </h1>
              <p className="text-white text-xs sm:text-base md:text-lg leading-relaxed font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] max-w-xl mx-auto">
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
                    className="bg-white hover:bg-slate-100 active:bg-slate-200 text-blue-700 font-black text-xs sm:text-sm md:text-base px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-xl shadow-black/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    Sign in
                  </button>

                  {/* Preview Catalogue Button */}
                  <button
                    type="button"
                    onClick={scrollToPreview}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-xs sm:text-sm md:text-base px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl border-2 border-white/90 backdrop-blur-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xl shadow-black/20"
                  >
                    Preview Catalogue
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/catalog')}
                    className="bg-white hover:bg-slate-100 active:bg-slate-200 text-blue-700 font-black text-xs sm:text-sm md:text-base px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-xl shadow-black/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    Sign in
                  </button>

                  <button
                    type="button"
                    onClick={scrollToPreview}
                    className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-xs sm:text-sm md:text-base px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl border-2 border-white/90 backdrop-blur-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xl shadow-black/20"
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
       * 4. READING BUBBLES EXPERIENCE SECTION (READ & IMAGINE • EXPLORE & DISCOVER • LISTEN & LEARN)
       * Located immediately after the catalogue preview slideshow.
       * ========================================================================= */}
      <section className="py-8 sm:py-12 px-6 sm:px-12 md:px-20 w-full flex justify-center">
        <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch justify-center">
          
          {/* Bubble 1: READ & IMAGINE */}
          <div className="group bg-transparent rounded-3xl p-4 sm:p-6 flex flex-col justify-start text-center relative transition-all duration-300">
            <div className="space-y-4">
              {/* Image Graphic */}
              <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto relative flex items-center justify-center">
                <picture>
                  <img
                    src="/1.svg"
                    alt="Feel the story come alive"
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>

              {/* Text Details */}
              <div className="space-y-2">
                <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 leading-tight">
                  Feel the story come alive.
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                  Open a book and watch ideas light up. Every page brings a new surprise waiting for you in our library.
                </p>
              </div>
            </div>
          </div>

          {/* Bubble 2: EXPLORE & DISCOVER */}
          <div className="group bg-transparent rounded-3xl p-4 sm:p-6 flex flex-col justify-start text-center relative transition-all duration-300">
            <div className="space-y-4">
              {/* Image Graphic */}
              <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto relative flex items-center justify-center">
                <picture>
                  <img
                    src="/3.svg"
                    alt="Find your next favourite book"
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>

              {/* Text Details */}
              <div className="space-y-2">
                <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 leading-tight">
                  Find your next favourite book.
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                  From storybooks to science, folktales to fairy tales — stacks of adventures are ready on the shelves for you to pick.
                </p>
              </div>
            </div>
          </div>

          {/* Bubble 3: LISTEN & LEARN */}
          <div className="group bg-transparent rounded-3xl p-4 sm:p-6 flex flex-col justify-start text-center relative transition-all duration-300">
            <div className="space-y-4">
              {/* Image Graphic */}
              <div className="w-52 h-52 sm:w-60 sm:h-60 mx-auto relative flex items-center justify-center">
                <picture>
                  <img
                    src="/2.svg"
                    alt="Learn your way, anytime"
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </picture>
              </div>

              {/* Text Details */}
              <div className="space-y-2">
                <h3 className="font-display font-black text-xl sm:text-2xl text-slate-900 leading-tight">
                  Learn your way, anytime.
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
                  Prefer to listen? Put on your headphones and enjoy audiobooks and read-alouds right here in the school library hub.
                </p>
              </div>
            </div>
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

              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100">
                {(isAdmin || isStaff) && (
                  <button
                    type="button"
                    onClick={() => setEditingBook(selectedBookModal)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition cursor-pointer"
                    title="Edit bibliographic details"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    <span>Edit Book</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedBookModal(null)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign in to reserve</span>
                    </button>
                  ) : isLearner ? (
                    <button
                      type="button"
                      disabled={selectedBookModal.availableCopies <= 0}
                      onClick={() => handleReserveAttempt(selectedBookModal)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 ${
                        selectedBookModal.availableCopies > 0
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Reserve for Desk Pickup</span>
                    </button>
                  ) : (isAdmin || isStaff) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookModal(null);
                        navigate('/circulation');
                      }}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Circulation Desk</span>
                    </button>
                  ) : null}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Pre-existing Book Modal */}
      {editingBook && (
        <EditBookModal
          book={editingBook}
          isOpen={!!editingBook}
          onClose={() => setEditingBook(null)}
          onSuccess={(updated) => {
            setSelectedBookModal(updated);
            setActionFeedback(`"${updated.title}" updated successfully!`);
          }}
        />
      )}

    </div>
  );
};
