/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { HeroSpotlightData, Book } from '../types';
import { Sparkles, Edit3, BookOpen, Headphones, X, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GRADIENT_PRESETS = [
  { name: 'Royal Indigo & Purple', value: 'from-blue-600 via-indigo-600 to-purple-600' },
  { name: 'Ocean Teal & Emerald', value: 'from-teal-600 via-emerald-600 to-cyan-700' },
  { name: 'Amber Sunset & Rose', value: 'from-amber-500 via-orange-600 to-rose-600' },
  { name: 'Midnight Galaxy', value: 'from-slate-900 via-indigo-950 to-blue-900' },
  { name: 'Vibrant Berry & Violet', value: 'from-fuchsia-600 via-purple-600 to-indigo-700' },
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
        className={`rounded-3xl p-6 sm:p-8 md:p-10 mb-8 text-white relative overflow-hidden shadow-xl bg-gradient-to-r ${spotlightData.bgGradient || 'from-blue-600 via-indigo-600 to-purple-600'} transition-colors duration-500`}
        aria-label="Featured Book Spotlight"
      >
        {/* Ambient Decorative Blurs */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-black/20 rounded-full blur-2xl pointer-events-none" />

        {/* Admin Edit Trigger Pill */}
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 z-20 px-3.5 py-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Edit hero spotlight banner"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-300" />
            <span>Edit Spotlight</span>
          </button>
        )}

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center">
          {/* Left Content Column */}
          <div className="md:col-span-8 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/25 backdrop-blur-md rounded-full px-3.5 py-1 text-xs font-black tracking-wide text-amber-200 border border-white/20 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{spotlightData.badgeText || '⭐ BOOK OF THE WEEK'}</span>
            </div>

            <h1 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight text-white tracking-tight">
              {spotlightData.title}
            </h1>

            <p className="text-blue-100/90 text-sm sm:text-base font-semibold max-w-2xl leading-snug">
              {spotlightData.subtitle}
            </p>

            <p className="text-white/80 text-xs sm:text-sm line-clamp-3 max-w-2xl leading-relaxed font-normal">
              {spotlightData.description}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                type="button"
                onClick={handleOpenDetail}
                className="bg-white hover:bg-blue-50 text-blue-900 font-extrabold px-6 py-3 rounded-full text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                aria-label={`Explore ${spotlightData.title}`}
              >
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Explore & Read Overview</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
              </button>

              {featuredBook?.hasAudio && (
                <button
                  type="button"
                  onClick={handleOpenDetail}
                  className="bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold px-4 py-3 rounded-full text-xs sm:text-sm border border-white/25 flex items-center gap-2 transition-all cursor-pointer"
                  aria-label="Listen to audiobook preview"
                >
                  <Headphones className="w-4 h-4 text-amber-300" />
                  <span>Audio Preview Available</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Visual Column (3D Book Cover Mockup) */}
          <div className="md:col-span-4 flex justify-center md:justify-end">
            <div 
              onClick={handleOpenDetail}
              className="group/cover relative cursor-pointer"
              title={`Click to view ${spotlightData.title}`}
            >
              {/* Outer Glow */}
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-400/30 to-purple-500/30 rounded-3xl blur-xl opacity-75 group-hover/cover:opacity-100 transition-opacity duration-300" />

              {/* 3D Floating Book Wrapper */}
              <div className="relative aspect-[3/4] h-60 sm:h-72 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 transform rotate-2 sm:rotate-3 group-hover/cover:rotate-0 group-hover/cover:scale-105 transition-all duration-300 bg-slate-900">
                {activeCover ? (
                  <img
                    src={activeCover}
                    alt={`Cover of ${spotlightData.title}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-950 p-4 flex flex-col justify-between text-white">
                    <span className="text-[10px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded">Featured</span>
                    <h3 className="font-display font-black text-sm">{spotlightData.title}</h3>
                  </div>
                )}

                {/* Spine Highlight Shadow */}
                <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Spotlight Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-spotlight-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Edit3 className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h2 id="edit-spotlight-modal-title" className="font-display font-black text-base">
                      Edit Hero Spotlight Banner
                    </h2>
                    <p className="text-xs text-slate-300">Customize the top banner shown to all scholars and visitors</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Pick From Existing Library Books */}
                <div>
                  <label htmlFor="featured-book-select" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Auto-Fill From Library Catalog
                  </label>
                  <select
                    id="featured-book-select"
                    value={editForm.featuredBookId}
                    onChange={(e) => handleBookSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {books.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.title} — {b.author} ({b.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badge Text */}
                <div>
                  <label htmlFor="badge-text-input" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Badge Pill Text
                  </label>
                  <input
                    id="badge-text-input"
                    type="text"
                    required
                    value={editForm.badgeText}
                    onChange={(e) => setEditForm({ ...editForm, badgeText: e.target.value })}
                    placeholder="e.g. ⭐ BOOK OF THE WEEK"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Spotlight Title */}
                <div>
                  <label htmlFor="spotlight-title-input" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Hero Headline / Title
                  </label>
                  <input
                    id="spotlight-title-input"
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Book Title or Theme Highlight"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Spotlight Subtitle */}
                <div>
                  <label htmlFor="spotlight-subtitle-input" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Subtitle Hook
                  </label>
                  <input
                    id="spotlight-subtitle-input"
                    type="text"
                    required
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                    placeholder="e.g. Featured Masterpiece & African Literature Spotlight"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Synopsis Description */}
                <div>
                  <label htmlFor="spotlight-desc-input" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Synopsis / Summary Hook
                  </label>
                  <textarea
                    id="spotlight-desc-input"
                    rows={3}
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Compelling synopsis that encourages scholars to dive in..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Cover Image URL */}
                <div>
                  <label htmlFor="spotlight-cover-input" className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                    Cover Image URL
                  </label>
                  <input
                    id="spotlight-cover-input"
                    type="url"
                    value={editForm.coverUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, coverUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Gradient Palette Selection */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                    Background Color Gradient Palette
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        type="button"
                        key={preset.value}
                        onClick={() => setEditForm({ ...editForm, bgGradient: preset.value })}
                        className={`p-2.5 rounded-xl text-left text-xs font-bold text-white flex items-center justify-between bg-gradient-to-r ${preset.value} border-2 transition-all cursor-pointer ${
                          editForm.bgGradient === preset.value ? 'border-amber-300 scale-102 ring-2 ring-blue-500' : 'border-transparent opacity-85 hover:opacity-100'
                        }`}
                      >
                        <span className="truncate">{preset.name}</span>
                        {editForm.bgGradient === preset.value && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-md cursor-pointer transition flex items-center gap-1.5"
                  >
                    {saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Saved Spotlight!</span>
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
