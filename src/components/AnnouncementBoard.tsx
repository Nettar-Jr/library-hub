/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';
import { Bell, Trophy, AlertTriangle, Calendar, Plus, X, Check, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AnnouncementBoard: React.FC = () => {
  const { announcements, isLibrarianLoggedIn, addAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | Announcement['category']>('all');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('info');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addAnnouncement(title, content, category);
    setTitle('');
    setContent('');
    setCategory('info');
    setShowForm(false);
  };

  const getIcon = (cat: Announcement['category']) => {
    switch (cat) {
      case 'achievement':
        return <Trophy className="w-5 h-5 text-amber-700" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-rose-700 animate-pulse" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-800" />;
    }
  };

  const getStyles = (cat: Announcement['category']) => {
    switch (cat) {
      case 'achievement':
        return 'bg-amber-50/80 border-2 border-amber-300 text-amber-950 shadow-xs';
      case 'alert':
        return 'bg-rose-50/80 border-2 border-rose-400 text-rose-950 shadow-xs ring-1 ring-rose-200';
      default:
        return 'bg-indigo-50/60 border-2 border-indigo-200 text-indigo-950 shadow-xs';
    }
  };

  const filteredAnnouncements = announcements.filter((ann) => {
    if (filterCategory === 'all') return true;
    return ann.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            School Bulletin & Notices
          </h2>
          <p className="text-sm text-slate-600">
            Official academic library bulletins, reading challenges, and student achievements.
          </p>
        </div>
        
        {isLibrarianLoggedIn && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-indigo-950 hover:bg-indigo-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel Notice' : 'Post New Notice'}
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {(['all', 'alert', 'achievement', 'info'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
              filterCategory === cat
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat === 'all' && '📢 All Notices'}
            {cat === 'alert' && '⚠️ Urgent Alerts'}
            {cat === 'achievement' && '🏆 Student Achievements'}
            {cat === 'info' && 'ℹ️ General Updates'}
          </button>
        ))}
      </div>

      {/* New Notice Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4 overflow-hidden"
          >
            <h3 className="font-display font-black text-sm text-slate-900">Publish a New School Notice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="notice-title" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Notice Title
                </label>
                <input
                  id="notice-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Book Fair Schedule"
                  className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="notice-category" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Notice Category
                </label>
                <select
                  id="notice-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                  className="w-full text-xs sm:text-sm font-bold border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 bg-white text-slate-800"
                >
                  <option value="info">📢 Standard Update</option>
                  <option value="alert">⚠️ Urgent Warning / Deadline</option>
                  <option value="achievement">🏆 Student Achievement</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notice-content" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                Notice Message
              </label>
              <textarea
                id="notice-content"
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the full details of the notice here..."
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                Publish Notice
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Announcements with ARIA live region */}
      <section 
        className="grid grid-cols-1 md:grid-cols-3 gap-5" 
        aria-live="polite" 
        aria-label="School Announcements Feed"
      >
        {filteredAnnouncements.map((ann, idx) => (
          <motion.article
            key={ann.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`rounded-3xl p-6 flex flex-col justify-between ${getStyles(ann.category)}`}
          >
            <div className="space-y-3.5">
              <div className="flex justify-between items-start gap-2">
                <div className="p-2.5 bg-white rounded-xl shadow-xs flex items-center justify-center border border-slate-200">
                  {getIcon(ann.category)}
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-600 uppercase flex items-center gap-1 bg-white/60 px-2 py-0.5 rounded-md border border-slate-200">
                  <Calendar className="w-3 h-3" />
                  {ann.date}
                </span>
              </div>
              <div>
                <h3 className="font-display font-black text-lg leading-snug text-slate-950">{ann.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-800 font-medium">{ann.content}</p>
              </div>
            </div>

            {ann.category === 'alert' && (
              <div className="mt-4 pt-3 border-t border-rose-200/80 flex items-center justify-between text-[11px] font-bold text-rose-900">
                <span>Priority Notice</span>
                <span className="font-mono text-[10px] uppercase bg-rose-200/80 px-2 py-0.5 rounded">Action Required</span>
              </div>
            )}
          </motion.article>
        ))}

        {filteredAnnouncements.length === 0 && (
          <div className="md:col-span-3 text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl p-6">
            <p className="font-display font-bold text-slate-700 text-sm">No announcements in this category</p>
          </div>
        )}
      </section>
    </div>
  );
};
