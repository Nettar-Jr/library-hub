/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';
import { Bell, Trophy, AlertTriangle, Calendar, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AnnouncementBoard: React.FC = () => {
  const { announcements, isLibrarianLoggedIn, addAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
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
        return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getStyles = (cat: Announcement['category']) => {
    switch (cat) {
      case 'achievement':
        return 'bg-amber-50 border-amber-200 text-amber-900';
      case 'alert':
        return 'bg-rose-50 border-rose-200 text-rose-900';
      default:
        return 'bg-indigo-50/70 border-indigo-100 text-indigo-950';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            School Bulletin Board
          </h2>
          <p className="text-sm text-slate-500">Official updates, guidelines, and celebrate student successes.</p>
        </div>
        
        {/* Post announcement button is strictly available only to authenticated librarians/admins */}
        {isLibrarianLoggedIn && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold py-2 px-3.5 rounded-lg text-xs shadow-sm transition-all cursor-pointer"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel Notice' : 'Post Announcement'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-md space-y-4 overflow-hidden"
          >
            <h3 className="font-display font-bold text-sm text-slate-800">Publish a New School Notice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Book Fair Schedule"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Alert Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="info">📢 Standard Update</option>
                  <option value="alert">⚠️ Warning / Deadline</option>
                  <option value="achievement">🏆 Student Achievement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Message Content</label>
              <textarea
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the details of the announcement here..."
                className="w-full text-sm border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                Publish Now
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {announcements.map((ann, idx) => (
          <motion.div
            key={ann.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`border rounded-xl p-5 shadow-xs flex flex-col justify-between ${getStyles(ann.category)}`}
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div className="p-2 bg-white rounded-lg shadow-xs flex items-center justify-center border border-slate-100">
                  {getIcon(ann.category)}
                </div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {ann.date}
                </span>
              </div>
              <div>
                <h3 className="font-display font-extrabold text-base leading-snug">{ann.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed opacity-90">{ann.content}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
