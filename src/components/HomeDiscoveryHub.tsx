/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookCard } from './BookCard';
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
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book } from '../types';

export const HomeDiscoveryHub: React.FC = () => {
  const { books, allBooks, currentUser, isLearner, isStaff, isAdmin, checkoutBook, currentLearnerName, loggedInLearner } = useApp();
  const navigate = useNavigate();

  const [selectedBookModal, setSelectedBookModal] = useState<Book | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [playingAudioBookId, setPlayingAudioBookId] = useState<string | null>(null);
  
  // Epic-inspired state filters
  const [selectedStage, setSelectedStage] = useState<'all' | 'early' | 'upper_primary' | 'secondary'>('all');
  const [thematicShelf, setThematicShelf] = useState<'all' | 'audio' | 'stem' | 'african'>('all');

  const catalogPool = (allBooks && allBooks.length > 0) ? allBooks : books;

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

  // Filter books based on Stage & Thematic shelf
  const filteredCatalog = catalogPool.filter((book) => {
    // 1. Stage filter
    if (selectedStage === 'early') {
      const isPrimary = book.section === 'primary';
      const isEarlyCategory = book.category.toLowerCase().includes('fiction') || 
                              book.category.toLowerCase().includes('folktale') ||
                              book.category.toLowerCase().includes('illustrated') ||
                              book.category.toLowerCase().includes('phonics');
      if (!isPrimary || !isEarlyCategory) return false;
    } else if (selectedStage === 'upper_primary') {
      if (book.section !== 'primary') return false;
    } else if (selectedStage === 'secondary') {
      if ((book.section || 'college') !== 'college') return false;
    }

    // 2. Thematic shelf filter
    if (thematicShelf === 'audio') {
      if (!book.hasAudio && !book.isAudiobook) return false;
    } else if (thematicShelf === 'stem') {
      const isStem = book.category.toLowerCase().includes('stem') || 
                     book.category.toLowerCase().includes('science') || 
                     book.category.toLowerCase().includes('math') ||
                     book.category.toLowerCase().includes('tech');
      if (!isStem) return false;
    } else if (thematicShelf === 'african') {
      const isAfrican = book.category.toLowerCase().includes('african') || 
                        book.category.toLowerCase().includes('history') ||
                        book.title.toLowerCase().includes('anansi') ||
                        book.title.toLowerCase().includes('nigeria') ||
                        book.author.toLowerCase().includes('achebe');
      if (!isAfrican) return false;
    }

    return true;
  });

  // Display a curated 8-book preview grid
  const previewDisplayBooks = filteredCatalog.slice(0, 8);

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
    const el = document.getElementById('catalog-preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
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
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-slate-900 leading-tight">Dual Branch</div>
            <div className="text-[11px] sm:text-xs text-slate-500 font-medium">Primary &amp; College</div>
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
       * 3. EPIC FEATURE B: "READ-TO-ME & AUDIOBOOKS" SPOTLIGHT CAROUSEL SHELF
       * ========================================================================= */}
      <section className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white px-3 sm:px-4 lg:px-5 py-4 sm:py-5 lg:py-6 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Subtle glow accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pb-3 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold mb-2">
                <Headphones className="w-3.5 h-3.5 text-purple-300" />
                <span>Read-To-Me &amp; Audiobooks Spotlight</span>
              </div>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                Listen &amp; Learn With Audio Narration
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                Help young readers build fluency, phonics confidence, and vocabulary with narrated read-aloud editions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedStage('all');
                setThematicShelf('audio');
                scrollToPreview();
              }}
              className="text-xs font-bold text-blue-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>View all audio titles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Spotlight Audio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {spotlightAudioBooks.map((book) => {
              const isPlayingThis = playingAudioBookId === book.id;
              return (
                <div 
                  key={book.id}
                  onClick={() => handleBookClick(book)}
                  className="group bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/30 rounded-2xl p-3.5 transition-all flex flex-col justify-between cursor-pointer backdrop-blur-md"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-22 rounded-lg bg-slate-800 overflow-hidden shadow-sm shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                      <img
                        src={book.coverImage || book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full inline-block mb-1">
                        Audiobook
                      </span>
                      <h3 className="font-bold text-xs text-white group-hover:text-blue-200 line-clamp-2 leading-tight">
                        {book.title}
                      </h3>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">{book.author}</p>
                    </div>
                  </div>

                  {/* Audio Listen Sample Button */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => toggleAudioSample(book, e)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isPlayingThis 
                          ? 'bg-amber-500 text-slate-950 shadow-md animate-pulse'
                          : 'bg-white/20 hover:bg-white/30 text-white'
                      }`}
                    >
                      {isPlayingThis ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      <span>{isPlayingThis ? 'Stop Sample' : 'Listen Sample'}</span>
                    </button>

                    <span className="text-[10px] text-slate-300 font-medium">
                      {book.availableCopies > 0 ? 'In Stock' : 'On Hold'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
       * 4. EPIC FEATURE C: STAGE PICKER & THEMATIC CATALOG PREVIEW
       * ========================================================================= */}
      <section id="catalog-preview" className="space-y-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2 border-b border-slate-200/80">
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Explore Catalog Preview
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Filter by school learning stage or curated thematic shelf to discover reading books.
            </p>
          </div>

          {/* Stage Selector Pills (Epic Model) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedStage('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedStage === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Stages
            </button>
            <button
              type="button"
              onClick={() => setSelectedStage('early')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedStage === 'early'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Early Years (Nursery – Y2)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStage('upper_primary')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedStage === 'upper_primary'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Primary (Years 3 – 6)
            </button>
            <button
              type="button"
              onClick={() => setSelectedStage('secondary')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedStage === 'secondary'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              College (JSS1 – SSS3)
            </button>
          </div>
        </div>

        {/* Thematic Shelf Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setThematicShelf('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              thematicShelf === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Featured &amp; Popular</span>
          </button>

          <button
            type="button"
            onClick={() => setThematicShelf('audio')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              thematicShelf === 'audio'
                ? 'bg-purple-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Headphones className="w-3.5 h-3.5 text-purple-500" />
            <span>Read-To-Me Audio</span>
          </button>

          <button
            type="button"
            onClick={() => setThematicShelf('stem')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              thematicShelf === 'stem'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Atom className="w-3.5 h-3.5 text-emerald-500" />
            <span>STEM &amp; Discovery</span>
          </button>

          <button
            type="button"
            onClick={() => setThematicShelf('african')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              thematicShelf === 'african'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-500" />
            <span>African Literature &amp; Culture</span>
          </button>
        </div>

        {/* 8-Book Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {previewDisplayBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              mode={currentUser ? 'full' : 'public-preview'}
              isBorrowable={isLearner}
              onClick={() => handleBookClick(book)}
              onBorrow={() => handleBorrowAttempt(book)}
            />
          ))}
        </div>

        {previewDisplayBooks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">No books found for this stage and shelf combination.</p>
            <button
              type="button"
              onClick={() => { setSelectedStage('all'); setThematicShelf('all'); }}
              className="mt-3 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Preview Footer Banner CTA */}
        <div className="flex justify-center pt-2 pb-1">
          {!currentUser ? (
            <button
              id="cta-signin-catalog"
              type="button"
              onClick={() => navigate('/login?redirect=/catalog')}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in to access the full 2,400+ catalog</span>
            </button>
          ) : (
            <button
              id="cta-open-catalog"
              type="button"
              onClick={() => navigate('/catalog')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Complete Library Catalog</span>
            </button>
          )}
        </div>
      </section>

      {/* =========================================================================
       * 5. EPIC FEATURE D: DUAL AUDIENCE PORTALS ("FOR STUDENTS" & "FOR EDUCATORS")
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
