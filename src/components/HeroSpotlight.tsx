/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HeroSpotlightData, Book } from '../types';
import { Bookmark, Edit3, BookOpen, Headphones, X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRADIENT_PRESETS = [
  { name: 'Oxford Navy & Slate', value: 'from-slate-900 via-slate-800 to-blue-950' },
  { name: 'Scholastic Deep Blue', value: 'from-blue-950 via-slate-900 to-indigo-950' },
  { name: 'Curriculum Pine & Slate', value: 'from-emerald-950 via-slate-900 to-slate-900' },
  { name: 'Heritage Charcoal & Stone', value: 'from-stone-900 via-slate-900 to-slate-950' },
  { name: 'Academic Midnight', value: 'from-slate-950 via-slate-900 to-slate-800' },
];

export const HeroSpotlight: React.FC = () => {
  const { spotlightData, updateHeroSpotlight, books, currentUser, isAdmin, userRole, setSelectedBook } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<HeroSpotlightData>(spotlightData);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync form when spotlightData updates
  useEffect(() => {
    setEditForm(spotlightData);
  }, [spotlightData]);

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

  // Find featured book from collection
  const featuredBook = books.find(b => b.id === spotlightData.featuredBookId) || books[0];
  const activeCover = spotlightData.coverUrl || featuredBook?.coverUrl || featuredBook?.coverImage;

  const handleBookSelect = (bookId: string) => {
    const selected = books.find(b => b.id === bookId);
    if (selected) {
      setEditForm(prev => ({
        ...prev,
        featuredBookId: selected.id,
        title: selected.title,
        subtitle: `By ${selected.author} • ${selected.category}`,
        description: selected.description || selected.summary || prev.description,
        coverUrl: selected.coverUrl || selected.coverImage || prev.coverUrl,
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroSpotlight(editForm);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsEditing(false);
    }, 600);
  };

  const handleOpenDetail = () => {
    if (featuredBook) {
      setSelectedBook(featuredBook);
    }
  };

  return (
    <>
      <section 
        className={`rounded-3xl p-6 sm:p-8 md:p-9 mb-6 text-white relative overflow-hidden shadow-md bg-gradient-to-r ${spotlightData.bgGradient || 'from-slate-900 via-slate-800 to-blue-950'} transition-colors duration-500 border border-slate-700/60`}
        aria-label="Featured Book Spotlight"
      >
        {/* Admin Edit Trigger Pill */}
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            aria-label="Edit hero spotlight banner"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-300" />
            <span>Edit Spotlight</span>
          </button>
        )}

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
          {/* Left Content Column */}
          <div className="md:col-span-8 space-y-3.5 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-3 py-1 text-xs font-medium text-slate-200 border border-white/15 shadow-2xs">
              <Bookmark className="w-3.5 h-3.5 text-blue-300" />
              <span>{spotlightData.badgeText || 'Curriculum Spotlight'}</span>
            </div>

            <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl leading-tight text-white tracking-tight">
              {spotlightData.title}
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm font-medium max-w-2xl leading-relaxed">
              {spotlightData.subtitle}
            </p>

            <p className="text-slate-300/90 text-xs sm:text-sm line-clamp-3 max-w-2xl leading-relaxed font-normal">
              {spotlightData.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                type="button"
                onClick={handleOpenDetail}
                className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-5 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-2 transition duration-150 active:scale-98 cursor-pointer"
                aria-label={`Explore ${spotlightData.title}`}
              >
                <BookOpen className="w-4 h-4 text-blue-700" />
                <span>View Book Details</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {featuredBook?.hasAudio && (
                <button
                  type="button"
                  onClick={handleOpenDetail}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-medium px-4 py-2.5 rounded-xl text-xs border border-white/20 flex items-center gap-2 transition cursor-pointer"
                  aria-label="Listen to audiobook preview"
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
              title={`Click to view ${spotlightData.title}`}
            >
              {/* Refined Book Wrapper without excessive tilt */}
              <div className="relative aspect-[3/4] h-56 sm:h-64 rounded-xl overflow-hidden shadow-xl border border-white/20 bg-slate-900 group-hover/cover:scale-[1.02] transition-transform duration-200 ease-out">
                {activeCover ? (
                  <img
                    src={activeCover}
                    alt={`Cover of ${spotlightData.title}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 p-4 flex flex-col justify-between text-white">
                    <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded">Featured</span>
                    <h3 className="font-display font-bold text-sm">{spotlightData.title}</h3>
                  </div>
                )}

                {/* Subtle Spine Highlight Shadow */}
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
              className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Edit3 className="w-4 h-4 text-slate-200" />
                  </div>
                  <div>
                    <h2 id="edit-spotlight-modal-title" className="font-display font-bold text-sm sm:text-base">
                      Edit Featured Spotlight
                    </h2>
                    <p className="text-xs text-slate-300">Select the curriculum title featured on the catalog portal</p>
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

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto text-xs">
                {/* Pick From Existing Library Books */}
                <div>
                  <label htmlFor="featured-book-select" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Auto-Fill From Catalog Holdings
                  </label>
                  <select
                    id="featured-book-select"
                    value={editForm.featuredBookId}
                    onChange={(e) => handleBookSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} ({b.author}, {b.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badge Text */}
                <div>
                  <label htmlFor="badge-text-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Spotlight Badge
                  </label>
                  <input
                    id="badge-text-input"
                    type="text"
                    required
                    value={editForm.badgeText}
                    onChange={(e) => setEditForm({ ...editForm, badgeText: e.target.value })}
                    placeholder="e.g. FEATURED CURRICULUM TITLE"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* Spotlight Title */}
                <div>
                  <label htmlFor="spotlight-title-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Title Headline
                  </label>
                  <input
                    id="spotlight-title-input"
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Book Title"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* Spotlight Subtitle */}
                <div>
                  <label htmlFor="spotlight-subtitle-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subtitle / Attribution
                  </label>
                  <input
                    id="spotlight-subtitle-input"
                    type="text"
                    required
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    placeholder="e.g. By Chinua Achebe • African Literature"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* Synopsis Description */}
                <div>
                  <label htmlFor="spotlight-desc-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Synopsis / Summary
                  </label>
                  <textarea
                    id="spotlight-desc-input"
                    rows={3}
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Overview of the work..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* Cover Image URL */}
                <div>
                  <label htmlFor="spotlight-cover-input" className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Cover Image URL
                  </label>
                  <input
                    id="spotlight-cover-input"
                    type="url"
                    value={editForm.coverUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, coverUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500"
                  />
                </div>

                {/* Palette Selection */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Atmospheric Tone Palette
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => setEditForm({ ...editForm, bgGradient: preset.value })}
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
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save Spotlight</span>
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
