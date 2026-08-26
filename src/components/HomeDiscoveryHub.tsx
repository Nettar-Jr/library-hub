/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookCard } from './BookCard';
import { triggerBorrowCelebration, triggerMilestoneCelebration } from '../utils/confetti';
import { 
  Sparkles, 
  Flame, 
  Target, 
  Compass, 
  Award, 
  Star, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  Feather, 
  Heart, 
  MessageSquare, 
  Headphones, 
  Rocket, 
  Globe, 
  Smile, 
  Palette, 
  CheckCircle2,
  Zap,
  BookMarked,
  Trophy,
  BookmarkCheck,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Book } from '../types';

export const HomeDiscoveryHub: React.FC = () => {
  const { books, submissions, setActiveTab, isLibrarianLoggedIn, loggedInLearner, currentUser, checkoutBook, currentLearnerName, currentRole } = useApp();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBookModal, setSelectedBookModal] = useState<Book | null>(null);
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);

  // Epic-styled Category Buttons
  const categories = [
    { id: 'all', label: 'All Picks', icon: Sparkles, color: 'from-amber-400 to-orange-500 text-white' },
    { id: 'african', label: 'African Heritage', icon: Globe, color: 'from-amber-500 to-yellow-600 text-white' },
    { id: 'stem', label: 'STEM & Space', icon: Rocket, color: 'from-purple-500 to-indigo-600 text-white' },
    { id: 'fantasy', label: 'Fantasy & Adventure', icon: Flame, color: 'from-teal-500 to-emerald-600 text-white' },
    { id: 'humor', label: 'Comics & Humor', icon: Smile, color: 'from-orange-400 to-amber-500 text-white' },
    { id: 'classics', label: 'Classics', icon: BookOpen, color: 'from-indigo-600 to-blue-700 text-white' },
    { id: 'audio', label: 'Read-Aloud & Audio', icon: Headphones, color: 'from-pink-500 to-rose-600 text-white' },
  ];

  // Filter books based on selected category
  const filteredBooks = books.filter((book) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'african') return book.category.toLowerCase().includes('african');
    if (selectedCategory === 'stem') return book.category.toLowerCase().includes('science') || book.category.toLowerCase().includes('coding') || book.category.toLowerCase().includes('tech') || book.category.toLowerCase().includes('space');
    if (selectedCategory === 'fantasy') return book.category.toLowerCase().includes('fantasy') || book.category.toLowerCase().includes('adventure');
    if (selectedCategory === 'humor') return book.category.toLowerCase().includes('humor') || book.category.toLowerCase().includes('comics') || book.category.toLowerCase().includes('children');
    if (selectedCategory === 'classics') return book.category.toLowerCase().includes('classic') || book.category.toLowerCase().includes('literature') || book.category.toLowerCase().includes('philosophy');
    if (selectedCategory === 'audio') return book.hasAudio || book.readsCount > 80;
    return true;
  });

  // Spotlight Book (Hero Feature)
  const spotlightBook = books.find(b => b.id === 'book-1') || books[0];

  // Top Student Submissions
  const topSubmissions = submissions.filter(s => s.status === 'approved').slice(0, 3);

  const handleBorrow = (book: Book) => {
    if (!currentUser) {
      setCelebrationToast(`🔐 Sign in with your Student Card or Staff login to borrow "${book.title}"!`);
      setTimeout(() => setCelebrationToast(null), 5000);
      navigate('/login?redirect=/');
      return;
    }
    const res = checkoutBook(book.id, currentLearnerName || (loggedInLearner ? loggedInLearner.name : currentUser.name));
    if (res.success) {
      triggerBorrowCelebration();
      setCelebrationToast(`🎉 Awesome! "${book.title}" added to your backpack! Return by due date.`);
      setTimeout(() => setCelebrationToast(null), 6000);
      if (selectedBookModal) {
        setSelectedBookModal(null);
      }
    } else {
      setCelebrationToast(`⚠️ ${res.message}`);
      setTimeout(() => setCelebrationToast(null), 5000);
    }
  };

  const handleClaimMilestone = () => {
    if (!currentUser) {
      setCelebrationToast('🔐 Sign in to track your reading streaks and earn trophy badges!');
      setTimeout(() => setCelebrationToast(null), 5000);
      navigate('/login');
      return;
    }
    triggerMilestoneCelebration();
    setCelebrationToast('🏆 Milestone Achieved! +150 Reader XP added to your profile!');
    setTimeout(() => setCelebrationToast(null), 6000);
  };

  return (
    <div className="space-y-12">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {celebrationToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 right-4 sm:right-8 z-50 bg-gradient-to-r from-indigo-950 to-slate-900 text-white border-2 border-amber-400 p-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-md"
          >
            <Sparkles className="w-6 h-6 text-amber-400 animate-spin shrink-0" />
            <p className="text-xs sm:text-sm font-bold text-amber-100">{celebrationToast}</p>
            <button onClick={() => setCelebrationToast(null)} className="ml-auto text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Epic! Gamified Reader Rewards & Reading Quest Banner */}
      <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-6 sm:p-8 shadow-xl text-indigo-950 relative overflow-hidden">
        {/* Playful background decorative bubbles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-amber-300/30 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div className="space-y-3 max-w-2xl text-white">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-950 text-amber-300 text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Reader's Quest: Term 2
              </span>
              <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                Level 4 Scholar
              </span>
            </div>
            
            <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-white drop-shadow-sm leading-tight">
              2,840 of 3,500 Books Read!
            </h2>
            
            <p className="text-xs sm:text-sm text-amber-50 leading-relaxed max-w-xl">
              Premier International learners are <span className="font-extrabold text-white underline decoration-indigo-950">81% toward our term trophy</span>! Borrow books, share book reviews, and keep your reading streak alive.
            </p>

            {/* Reading Goal Progress Bar */}
            <div className="pt-1 space-y-1.5 max-w-md">
              <div className="w-full bg-indigo-950/40 h-4 rounded-full overflow-hidden p-0.5 border border-white/40 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '81%' }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-amber-200 via-white to-amber-300 h-full rounded-full shadow-md"
                ></motion.div>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-white font-bold">
                <span>0 Books</span>
                <span className="text-white bg-indigo-950/60 px-2 py-0.5 rounded-md">81% Completed (660 to Gold Trophy)</span>
                <span>3,500 Target</span>
              </div>
            </div>
          </div>

          {/* Gamified Reward Badges (Interactive celebration on click!) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
            <button 
              onClick={handleClaimMilestone}
              className="bg-white/95 hover:bg-white text-indigo-950 rounded-2xl p-3.5 text-center shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-white/80 flex flex-col items-center justify-center space-y-1 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-400 to-amber-400 text-white flex items-center justify-center font-bold shadow-md group-hover:rotate-12 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900">18-Day Streak</span>
              <span className="text-[10px] text-orange-600 font-extrabold uppercase font-mono">School Record</span>
            </button>

            <button 
              onClick={handleClaimMilestone}
              className="bg-white/95 hover:bg-white text-indigo-950 rounded-2xl p-3.5 text-center shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-white/80 flex flex-col items-center justify-center space-y-1 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold shadow-md group-hover:rotate-12 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900">Book Pioneer</span>
              <span className="text-[10px] text-emerald-700 font-extrabold uppercase font-mono">Tap for XP</span>
            </button>

            <button 
              onClick={handleClaimMilestone}
              className="bg-white/95 hover:bg-white text-indigo-950 rounded-2xl p-3.5 text-center shadow-lg hover:scale-105 transition-all cursor-pointer border-2 border-white/80 flex flex-col items-center justify-center space-y-1 col-span-2 sm:col-span-1 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md group-hover:rotate-12 transition-transform">
                <Star className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-900">Master Reader</span>
              <span className="text-[10px] text-purple-700 font-extrabold uppercase font-mono">920 / 1000 XP</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. Spotlight: Book of the Week (Hero Feature with Real Cover Art) */}
      {spotlightBook && (
        <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-indigo-800/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: 3D Book Cover Presentation */}
            <div className="lg:col-span-4 flex justify-center">
              <div 
                className="relative group cursor-pointer" 
                onClick={() => setSelectedBookModal(spotlightBook)}
              >
                <div className="w-48 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-400/40 transform group-hover:scale-105 transition-all duration-300 relative bg-slate-800">
                  <img
                    src={spotlightBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'}
                    alt={spotlightBook.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {/* Spine effect */}
                  <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/50 via-white/20 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="bg-amber-400 text-indigo-950 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded">
                      Featured Pick
                    </span>
                  </div>
                </div>

                <div className="absolute -top-3 -right-3 bg-amber-400 text-indigo-950 text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider font-mono flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-indigo-950" /> Spotlight Choice
                </div>
              </div>
            </div>

            {/* Right: Book Details & Quick Action */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-400 text-indigo-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono shadow-xs">
                  ★ Editor's Recommendation
                </span>
                <span className="bg-indigo-800/80 text-indigo-200 text-[10px] font-mono px-3 py-1 rounded-full border border-indigo-700">
                  {spotlightBook.ageRange || 'Recommended for All Grades'}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {spotlightBook.availableCopies} Copies Available
                </span>
              </div>

              <h2 className="font-display font-black text-2xl sm:text-4xl text-white leading-tight">
                {spotlightBook.title}
              </h2>
              <p className="text-amber-300 font-serif italic text-sm sm:text-base">
                by {spotlightBook.author}
              </p>
              
              <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed font-normal max-w-2xl">
                {spotlightBook.description}
              </p>

              {/* Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-indigo-300 font-mono">Reading Level</div>
                  <div className="font-black text-white flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> {spotlightBook.readingLevel || 'Lexile 890L'}
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-indigo-300 font-mono">Reader Rating</div>
                  <div className="font-black text-white flex items-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {spotlightBook.rating || 4.9} / 5.0
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-indigo-300 font-mono">Popularity</div>
                  <div className="font-black text-white flex items-center gap-1 mt-0.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" /> {spotlightBook.readsCount} Borrows
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-3 border border-white/10 backdrop-blur-xs">
                  <div className="text-[10px] text-indigo-300 font-mono">Classification</div>
                  <div className="font-black text-amber-300 flex items-center gap-1 mt-0.5 truncate">
                    {spotlightBook.category}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleBorrow(spotlightBook)}
                  className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-xl transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <BookmarkCheck className="w-4 h-4 text-indigo-950" />
                  <span>Borrow Now (Add to Backpack)</span>
                </button>

                <button
                  onClick={() => setSelectedBookModal(spotlightBook)}
                  className="bg-white/15 hover:bg-white/25 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 border border-white/20"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Read Synopsis & Reviews</span>
                </button>
              </div>

            </div>

          </div>
        </section>
      )}

      {/* 3. Browse By Interest & Genre Hub (Epic-Inspired Color-Coded Chips) */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="font-display font-black text-2xl text-slate-900 flex items-center gap-2.5">
              <Compass className="w-7 h-7 text-indigo-600" />
              Explore Reading Collections
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Color-coded collections spanning African heritage, STEM & space, graphic novels, classics, and read-aloud audiobooks.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                navigate('/login?redirect=/catalog');
              } else {
                setActiveTab('library');
                navigate('/catalog');
              }
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer bg-indigo-50 px-3.5 py-2 rounded-xl"
          >
            <span>Browse Full Catalog</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-xs ${
                  isSelected
                    ? 'bg-gradient-to-r ' + cat.color + ' shadow-md scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Book Cards Grid with 3D Covers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => setSelectedBookModal(book)}
              onBorrow={() => handleBorrow(book)}
              isBorrowable={currentRole === 'learner'}
            />
          ))}
        </div>

      </section>

      {/* 4. Ink & Imagination: Student Creative Showcase with Artwork */}
      <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-400 text-indigo-950 rounded-xl shadow-md">
                <Feather className="w-5 h-5" />
              </span>
              <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                Ink & Imagination: Student Authors & Artists
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200">
              Outstanding peer-authored poems, narratives, and digital artworks created by Premier learners.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!currentUser) {
                navigate('/login?redirect=/gallery');
              } else {
                setActiveTab('gallery');
                navigate('/gallery');
              }
            }}
            className="bg-amber-400 hover:bg-amber-300 text-indigo-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Explore Creative Gallery</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {topSubmissions.map((submission) => (
            <div
              key={submission.id}
              onClick={() => {
                if (!currentUser) {
                  navigate('/login?redirect=/gallery');
                } else {
                  setActiveTab('gallery');
                  navigate('/gallery');
                }
              }}
              className="group bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-3xl p-4.5 space-y-3 transition-all duration-300 cursor-pointer flex flex-col justify-between hover:scale-[1.02] hover:border-amber-400/50 shadow-lg"
            >
              <div className="space-y-3">
                {/* Artwork Thumbnail preview if available */}
                {submission.imageUrl && (
                  <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-900 relative">
                    <img 
                      src={submission.imageUrl} 
                      alt={submission.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                      Original Art
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px]">
                  <span className="bg-indigo-500/20 text-amber-300 font-mono font-black uppercase px-2.5 py-1 rounded-lg border border-indigo-500/30">
                    {submission.category.replace('-', ' ')}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {submission.gradeOrYear}
                  </span>
                </div>

                <div>
                  <h4 className="font-display font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                    {submission.title}
                  </h4>
                  <p className="text-xs text-amber-100/80 font-serif italic mt-0.5">
                    by {submission.authorName}
                  </p>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans">
                  {submission.content}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <Heart className="w-3.5 h-3.5 fill-rose-400" /> {submission.likesCount} appreciations
                </span>
                <span className="text-amber-300 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Read Full Work <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Book Detail / Preview Modal */}
      <AnimatePresence>
        {selectedBookModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6 relative"
            >
              <button
                onClick={() => setSelectedBookModal(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
                {/* Book Cover */}
                <div className="sm:col-span-5 flex justify-center">
                  <div className="w-44 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border-2 border-slate-200 relative bg-slate-900">
                    <img
                      src={selectedBookModal.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=500'}
                      alt={selectedBookModal.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent"></div>
                  </div>
                </div>

                {/* Details */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="bg-indigo-100 text-indigo-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {selectedBookModal.category}
                    </span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                      DDC {selectedBookModal.deweyCode || '800'}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedBookModal.availableCopies > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {selectedBookModal.availableCopies > 0 ? `${selectedBookModal.availableCopies} In Stock` : 'Currently On Loan'}
                    </span>
                  </div>

                  <h3 className="font-display font-black text-xl text-slate-900 leading-tight">
                    {selectedBookModal.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-serif italic">
                    by {selectedBookModal.author}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedBookModal.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div><span className="text-slate-400">ISBN:</span> {selectedBookModal.isbn}</div>
                    <div><span className="text-slate-400">Total Reads:</span> {selectedBookModal.readsCount}</div>
                    <div><span className="text-slate-400">Pages:</span> {selectedBookModal.pageCount || 240}</div>
                    <div><span className="text-slate-400">Level:</span> {selectedBookModal.readingLevel || 'Standard'}</div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedBookModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  disabled={selectedBookModal.availableCopies <= 0}
                  onClick={() => handleBorrow(selectedBookModal)}
                  className={`px-6 py-2.5 text-xs font-black rounded-xl shadow-md transition flex items-center gap-2 ${
                    selectedBookModal.availableCopies > 0
                      ? 'bg-amber-400 hover:bg-amber-300 text-indigo-950 cursor-pointer active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Borrow Book</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
