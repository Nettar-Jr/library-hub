/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';
import { Bell, AlertCircle, Calendar, Plus, X, Check, BookOpen } from 'lucide-react';
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

  const getBadge = (cat: Announcement['category']) => {
    switch (cat) {
      case 'achievement':
        return {
          label: 'Academic Notice',
          icon: BookOpen,
          badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          cardStyle: 'bg-white border-slate-200'
        };
      case 'alert':
        return {
          label: 'Urgent Notice',
          icon: AlertCircle,
          badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
          cardStyle: 'bg-white border-slate-200'
        };
      default:
        return {
          label: 'General Notice',
          icon: Bell,
          badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
          cardStyle: 'bg-white border-slate-200'
        };
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
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Library Notices
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Official dates, schedule adjustments, book return deadlines, and library notices.
          </p>
        </div>
        
        {isLibrarianLoggedIn && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showForm ? 'Cancel Notice' : 'Post Notice'}</span>
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
        {[
          { key: 'all', label: 'All Notices' },
          { key: 'alert', label: 'Urgent Notices' },
          { key: 'achievement', label: 'Academic Notices' },
          { key: 'info', label: 'General Notices' }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilterCategory(item.key as any)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
              filterCategory === item.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* New Notice Form (Librarian Only) */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 overflow-hidden"
          >
            <h3 className="font-display font-bold text-sm text-slate-900">Post New Official Notice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="notice-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Title
                </label>
                <input
                  id="notice-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. End of Term Book Returns"
                  className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              <div>
                <label htmlFor="notice-category" className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="notice-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                  className="w-full text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="info">General Update</option>
                  <option value="alert">Urgent / Deadline</option>
                  <option value="achievement">Academic Program</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="notice-content" className="block text-xs font-semibold text-slate-700 mb-1">
                Notice Message
              </label>
              <textarea
                id="notice-content"
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full notice text and relevant instructions for students and staff..."
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Post Notice</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Announcements */}
      <section 
        className="grid grid-cols-1 md:grid-cols-3 gap-4" 
        aria-live="polite" 
        aria-label="School Announcements Feed"
      >
        {filteredAnnouncements.map((ann, idx) => {
          const badge = getBadge(ann.category);
          const Icon = badge.icon;
          return (
            <motion.article
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.badgeStyle}`}>
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {ann.date}
                  </span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-slate-900 leading-snug">
                    {ann.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {ann.content}
                  </p>
                </div>
              </div>

              {ann.category === 'alert' && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-amber-800">
                  <span>Action Required</span>
                  <span className="text-[10px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Notice</span>
                </div>
              )}
            </motion.article>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="md:col-span-3 text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
            <p className="text-xs text-slate-500 font-medium">No announcements in this category.</p>
          </div>
        )}
      </section>
    </div>
  );
};
