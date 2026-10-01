/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp, getGradeLevelForUser } from '../context/AppContext';
import { HeroSpotlightData, Book } from '../types';
import { initialBooks } from '../data';
import { Bookmark, Edit3, BookOpen, Headphones, X, Check, ArrowRight, Building2, Backpack, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRADIENT_PRESETS = [
  { name: 'Scholastic Royal & Slate', value: 'from-blue-900 via-indigo-950 to-slate-900' },
  { name: 'Oxford Navy & Slate', value: 'from-slate-900 via-slate-800 to-blue-950' },
  { name: 'Primary Emerald & Forest', value: 'from-emerald-950 via-slate-900 to-teal-950' },
  { name: 'Amber Storyteller & Charcoal', value: 'from-amber-950 via-slate-900 to-stone-900' },
  { name: 'Heritage Purple & Midnight', value: 'from-purple-950 via-slate-900 to-indigo-950' },
];

export const HeroSpotlight: React.FC = () => {
  const { 
    spotlightData, 
    collegeSpotlight,
    primarySpotlight,
    updateHeroSpotlight, 
    fetchBookOfWeekForGrade,
    books, 
    allBooks,
    currentUser, 
    loggedInLearner,
    isAdmin, 
    isStaff,
    userRole, 
    setSelectedBook,
    activeSection 
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [modalSection, setModalSection] = useState<'college' | 'primary'>('college');
  const [editForm, setEditForm] = useState<HeroSpotlightData>(spotlightData);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Derive student grade level
  const studentUser = loggedInLearner || currentUser;
  const isStudent = userRole === 'LEARNER' || Boolean(loggedInLearner) || (!isAdmin && !isStaff && Boolean(currentUser));
  const studentGradeLevel = getGradeLevelForUser(studentUser, activeSection);
  const currentEffectiveSection: 'college' | 'primary' = isStudent 
    ? (studentGradeLevel === 'primary' ? 'primary' : 'college')
    : (spotlightData.section || (activeSection === 'primary' ? 'primary' : 'college'));

  // Sync form when spotlightData or activeSection updates
  useEffect(() => {
    const currentSec = (activeSection === 'primary') ? 'primary' : 'college';
    setModalSection(currentSec);
    setEditForm(spotlightData);
  }, [spotlightData, activeSection]);

  // Ensure fresh fetch of Book of the Week document for student on load
  useEffect(() => {
    if (fetchBookOfWeekForGrade) {
      fetchBookOfWeekForGrade(studentGradeLevel);
    }
  }, [studentGradeLevel, loggedInLearner?.id, currentUser?.id]);

  // Handle ESC key for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  const canEdit = isAdmin || userRole === 'ADMIN' || currentUser?.role === 'admin' || currentUser?.role === 'ADMIN';

  // 1. Resolve exact Book instance so preview detail modal NEVER opens a different book
  const booksPool = (allBooks && allBooks.length > 0) ? allBooks : books;
  
  const featuredBook = booksPool.find(b => b.id === spotlightData.featuredBookId)
    || booksPool.find(b => b.title.toLowerCase().trim() === spotlightData.title.toLowerCase().trim())
    || books.find(b => b.id === spotlightData.featuredBookId)
    || books.find(b => b.title.toLowerCase().trim() === spotlightData.title.toLowerCase().trim())
    || initialBooks.find(b => b.id === spotlightData.featuredBookId);

  // Directly display the dynamic chosen title from the database document / spotlightData
  const displayTitle = spotlightData.title || featuredBook?.title || 'Featured Masterpiece';
  const displaySubtitle = spotlightData.subtitle || (featuredBook ? `By ${featuredBook.author} • ${featuredBook.category}` : '');
  const displayDescription = spotlightData.description || featuredBook?.description || featuredBook?.summary || '';
  const displayCover = spotlightData.coverUrl || featuredBook?.coverUrl || featuredBook?.coverImage;

  const resolvedBook: Book = featuredBook ? {
    ...featuredBook,
    title: displayTitle,
    coverImage: displayCover || featuredBook.coverImage,
    coverUrl: displayCover || featuredBook.coverUrl,
    description: displayDescription || featuredBook.description,
  } : {
    id: spotlightData.featuredBookId || `spotlight-${currentEffectiveSection}`,
    title: displayTitle,
    author: displaySubtitle.replace(/^By\s+/i, '').split('•')[0].trim() || 'Featured Author',
    isbn: 'N/A',
    category: displaySubtitle.includes('•') ? displaySubtitle.split('•')[1].trim() : 'Featured Spotlight',
    section: currentEffectiveSection,
    totalCopies: 5,
    availableCopies: 5,
    description: displayDescription,
    summary: displayDescription,
    coverImage: displayCover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
    coverUrl: displayCover || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700',
    readsCount: 85,
    deweyClass: '800',
    deweyCode: '800',
    callNumber: '800 SPOT',
    ageRange: currentEffectiveSection === 'primary' ? 'Ages 6-12' : 'Ages 12-18+',
    readingLevel: 'Standard',
  };

  const activeCover = displayCover || resolvedBook.coverUrl || resolvedBook.coverImage;

  // Filter books in the edit dropdown strictly to the target section being configured
  const sectionCatalogOptions = booksPool.filter(b => {
    if (modalSection === 'primary') {
      return b.section === 'primary';
    }
    return (b.section || 'college') === 'college';
  });

  const handleSectionSwitch = (sec: 'college' | 'primary') => {
    setModalSection(sec);
    const existingSectionData = sec === 'primary' ? primarySpotlight : collegeSpotlight;
    setEditForm({
      ...existingSectionData,
      section: sec,
    });
  };

  const handleBookSelect = (bookId: string) => {
    const selected = booksPool.find(b => b.id === bookId) || initialBooks.find(b => b.id === bookId);
    if (selected) {
      setEditForm(prev => ({
        ...prev,
        featuredBookId: selected.id,
        title: selected.title,
        subtitle: `By ${selected.author} • ${selected.category}`,
        description: selected.description || selected.summary || prev.description,
        coverUrl: selected.coverUrl || selected.coverImage || prev.coverUrl,
        section: selected.section === 'primary' ? 'primary' : 'college',
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroSpotlight(editForm, modalSection);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 600);
  };

  const handleOpenDetail = () => {
    setSelectedBook(resolvedBook);
  };

  return (
    <>
      <section 
        className={`rounded-3xl p-6 sm:p-8 md:p-9 mb-6 text-white relative overflow-hidden shadow-md bg-gradient-to-r ${spotlightData.bgGradient || (currentEffectiveSection === 'primary' ? 'from-emerald-950 via-slate-900 to-teal-950' : 'from-blue-900 via-indigo-950 to-slate-900')} transition-colors duration-500 border border-slate-700/60`}
        aria-label="Featured Book Spotlight"
      >
        {/* Admin Edit Trigger Pill */}
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              const currentSec = (activeSection === 'primary') ? 'primary' : 'college';
              setModalSection(currentSec);
              setEditForm(spotlightData);
              setIsEditing(true);
            }}
            className="absolute top-4 right-4 z-20 px-3.5 py-1.5 bg-black/50 hover:bg-black/75 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            aria-label="Edit book of the week banner"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-300" />
            <span>Edit Book of the Week</span>
          </button>
        )}

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
          {/* Left Content Column */}
          <div className="md:col-span-8 space-y-3.5 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <div className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 rounded-full px-3 py-1 text-xs font-black shadow-xs">
                <Bookmark className="w-3.5 h-3.5 fill-slate-950" />
                <span>{spotlightData.badgeText || '⭐ BOOK OF THE WEEK'}</span>
              </div>

              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-slate-200 tracking-wide uppercase">
                {currentEffectiveSection === 'primary' ? 'Primary Library' : 'Secondary College'}
              </span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl leading-tight text-white tracking-tight">
              {displayTitle}
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm font-semibold max-w-2xl leading-relaxed">
              {displaySubtitle}
            </p>

            <p className="text-slate-300/90 text-xs sm:text-sm line-clamp-3 max-w-2xl leading-relaxed font-normal">
              {displayDescription}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                type="button"
                onClick={handleOpenDetail}
                className="bg-white hover:bg-slate-100 text-slate-900 font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-2 transition duration-150 active:scale-98 cursor-pointer"
                aria-label={`Explore details for ${displayTitle}`}
              >
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>View Book Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {resolvedBook.hasAudio && (
                <button
                  type="button"
                  onClick={handleOpenDetail}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium px-4 py-2.5 rounded-xl text-xs border border-white/20 flex items-center gap-2 transition cursor-pointer"
                  aria-label="Listen to audiobook edition"
                >
                  <Headphones className="w-4 h-4 text-slate-200" />
                  <span>Audio Edition Available</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Visual Column (Cover Presentation) */}
          <div className="md:col-span-4 flex justify-center md:justify-end">
            <div 
              onClick={handleOpenDetail}
              className="group/cover relative cursor-pointer select-none"
              title={`Click to view "${displayTitle}" details`}
            >
              {/* Refined Book Wrapper */}
              <div className="relative aspect-[3/4] h-56 sm:h-64 rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 bg-slate-900 group-hover/cover:scale-[1.02] transition-transform duration-200 ease-out">
                {activeCover ? (
                  <img
                    src={activeCover}
                    alt={`Cover of ${displayTitle}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 p-4 flex flex-col justify-between text-white">
                    <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded">Featured</span>
                    <h3 className="font-display font-bold text-sm">{displayTitle}</h3>
                  </div>
                )}

                {/* Spine Highlight Shadow */}
                <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Spotlight Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-spotlight-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-400 text-slate-950 rounded-xl">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 id="edit-spotlight-modal-title" className="font-display font-bold text-sm sm:text-base">
                      Set Book of the Week
                    </h2>
                    <p className="text-xs text-slate-300">Choose the featured title for Secondary and Primary libraries</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
                {/* 1. Target Library Section Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Library Section
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSectionSwitch('college')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        modalSection === 'college'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Secondary Section</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSectionSwitch('primary')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        modalSection === 'primary'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                      }`}
                    >
                      <Backpack className="w-3.5 h-3.5 text-teal-400" />
                      <span>Primary Section</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Configuring the Book of the Week for {modalSection === 'primary' ? 'Primary Pupils (Years 1–6)' : 'Secondary Students (College Years 7–12)'}.
                  </p>
                </div>

                {/* 2. Visual Book Cards Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Click Any Book To Select as Book of the Week ({sectionCatalogOptions.length} titles in {modalSection === 'primary' ? 'Primary' : 'Secondary'})
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {sectionCatalogOptions.map(b => {
                      const isSelected = editForm.featuredBookId === b.id;
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleBookSelect(b.id)}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition select-none ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                          }`}
                        >
                          <img 
                            src={b.coverUrl || b.coverImage} 
                            alt={b.title} 
                            className="w-10 h-14 object-cover rounded-md shrink-0 shadow-2xs"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700';
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-[11px] text-slate-900 truncate" title={b.title}>
                              {b.title}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {b.author}
                            </div>
                            {isSelected && (
                              <div className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Selected</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Catalog Holdings Quick Dropdown Alternative */}
                <div>
                  <label htmlFor="featured-book-select" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Or Choose From Dropdown
                  </label>
                  <select
                    id="featured-book-select"
                    value={editForm.featuredBookId}
                    onChange={(e) => handleBookSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    <option value="" disabled>-- Choose a book from this section --</option>
                    {sectionCatalogOptions.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} — by {b.author} ({b.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Live Preview Banner inside Modal */}
                <div className="p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                    Live Preview:
                  </div>
                  <div className="flex items-center gap-3">
                    <img 
                      src={editForm.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700'} 
                      alt="Preview cover" 
                      className="w-12 h-16 object-cover rounded-lg border border-white/20 shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-white truncate">{editForm.title || 'Untitled Book'}</div>
                      <div className="text-xs text-slate-300 truncate">{editForm.subtitle || 'By Author'}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{editForm.description}</div>
                    </div>
                  </div>
                </div>

                {/* 5. Badge Text */}
                <div>
                  <label htmlFor="badge-text-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Spotlight Badge Headline
                  </label>
                  <input
                    id="badge-text-input"
                    type="text"
                    required
                    value={editForm.badgeText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, badgeText: val }));
                    }}
                    placeholder="e.g. ⭐ BOOK OF THE WEEK"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* 6. Spotlight Title */}
                <div>
                  <label htmlFor="spotlight-title-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Book Title
                  </label>
                  <input
                    id="spotlight-title-input"
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, title: val }));
                    }}
                    placeholder="Book Title"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* 7. Spotlight Subtitle */}
                <div>
                  <label htmlFor="spotlight-subtitle-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Author &amp; Category Subtitle
                  </label>
                  <input
                    id="spotlight-subtitle-input"
                    type="text"
                    required
                    value={editForm.subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, subtitle: val }));
                    }}
                    placeholder="e.g. By Chinua Achebe • African Literature"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* 8. Synopsis Description */}
                <div>
                  <label htmlFor="spotlight-desc-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Synopsis / Summary
                  </label>
                  <textarea
                    id="spotlight-desc-input"
                    rows={3}
                    required
                    value={editForm.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, description: val }));
                    }}
                    placeholder="Overview of the work..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* 9. Cover Image URL */}
                <div>
                  <label htmlFor="spotlight-cover-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cover Image URL
                  </label>
                  <input
                    id="spotlight-cover-input"
                    type="url"
                    value={editForm.coverUrl || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditForm(prev => ({ ...prev, coverUrl: val }));
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* 10. Atmospheric Tone Palette */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Atmospheric Tone Palette
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => {
                          setEditForm(prev => ({ ...prev, bgGradient: preset.value }));
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold text-white flex items-center justify-between bg-gradient-to-r ${preset.value} border transition cursor-pointer ${
                          editForm.bgGradient === preset.value ? 'border-amber-300 ring-2 ring-slate-400' : 'border-transparent opacity-90 hover:opacity-100'
                        }`}
                      >
                        <span className="truncate">{preset.name}</span>
                        {editForm.bgGradient === preset.value && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs cursor-pointer transition flex items-center gap-1.5"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved for {modalSection === 'primary' ? 'Primary' : 'Secondary'}!</span>
                      </>
                    ) : (
                      <span>Save for {modalSection === 'primary' ? 'Primary' : 'Secondary'}</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
