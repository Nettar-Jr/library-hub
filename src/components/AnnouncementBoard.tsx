/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';
import { 
  Bell, 
  AlertCircle, 
  Calendar, 
  Plus, 
  X, 
  Check, 
  BookOpen, 
  Pencil,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnnouncementBoardProps {
  isHomePreview?: boolean;
}

export const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({ isHomePreview = false }) => {
  const { 
    announcements, 
    isLibrarianLoggedIn, 
    isAdmin, 
    isStaff, 
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | Announcement['category']>('all');
  
  // New Notice state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('info');

  // Edit Notice state
  const [editingNotice, setEditingNotice] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<Announcement['category']>('info');

  // Delete Notice state
  const [deletingNotice, setDeletingNotice] = useState<Announcement | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canManageNotices = isLibrarianLoggedIn || isAdmin || isStaff;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addAnnouncement(title.trim(), content.trim(), category, 'all');
    setTitle('');
    setContent('');
    setCategory('info');
    setShowForm(false);
    showToast('Notice posted to Notice Board successfully.');
  };

  const handleStartEdit = (ann: Announcement) => {
    setEditingNotice(ann);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditCategory(ann.category);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !editTitle.trim() || !editContent.trim()) return;
    updateAnnouncement(editingNotice.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      category: editCategory,
    });
    setEditingNotice(null);
    showToast('Notice updated successfully.');
  };

  const handleConfirmDelete = () => {
    if (!deletingNotice) return;
    deleteAnnouncement(deletingNotice.id);
    setDeletingNotice(null);
    showToast('Notice deleted successfully.');
  };

  const getCategoryBadge = (cat: Announcement['category']) => {
    switch (cat) {
      case 'achievement':
        return {
          label: 'Academic Notice',
          icon: BookOpen,
          badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'alert':
        return {
          label: 'Urgent Notice',
          icon: AlertCircle,
          badgeStyle: 'bg-amber-50 text-amber-900 border-amber-200',
        };
      default:
        return {
          label: 'General Notice',
          icon: Bell,
          badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200',
        };
    }
  };

  // Preview notices on homepage: latest 4 notices without section filtering
  const previewNotices = React.useMemo(() => {
    return announcements.slice(0, 4);
  }, [announcements]);

  // Full archive filtering on announcements page (category only)
  const filteredAnnouncements = announcements.filter((ann) => {
    return filterCategory === 'all' || ann.category === filterCategory;
  });

  const displayList = isHomePreview ? previewNotices : filteredAnnouncements;

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Notice Board
          </h2>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {canManageNotices && (
            <button
              type="button"
              onClick={() => {
                setShowForm(!showForm);
                setEditingNotice(null);
              }}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-3.5 rounded-xl text-xs transition cursor-pointer shadow-xs active:scale-95"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showForm ? 'Cancel' : 'Post Notice'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls (Only on full view, not preview) */}
      {!isHomePreview && (
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 border-b border-slate-100 pb-3">
          {[
            { key: 'all', label: 'All Categories' },
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
                  ? 'bg-slate-900 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* New Notice Form (Staff / Librarian / Admin) */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateSubmit}
            className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 overflow-hidden"
          >
            <h3 className="font-display font-bold text-sm text-slate-900">Post New Notice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-notice-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Title *
                </label>
                <input
                  id="new-notice-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Library Schedule Update"
                  className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label htmlFor="new-notice-category" className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  id="new-notice-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Announcement['category'])}
                  className="w-full text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="info">General Notice</option>
                  <option value="alert">Urgent Notice</option>
                  <option value="achievement">Academic Notice</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="new-notice-content" className="block text-xs font-semibold text-slate-700 mb-1">
                Notice Message *
              </label>
              <textarea
                id="new-notice-content"
                required
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Full notice message and instructions for students and staff..."
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs cursor-pointer shadow-xs active:scale-95 transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Post Notice</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Grid of Notices */}
      <section 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" 
        aria-live="polite" 
        aria-label="Notice Board Feed"
      >
        {displayList.map((ann, idx) => {
          const badge = getCategoryBadge(ann.category);
          const CategoryIcon = badge.icon;

          return (
            <motion.article
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative group"
            >
              <div className="space-y-3">
                {/* Category Badge & Librarian/Admin Action Buttons (No section labels) */}
                <div className="flex items-center justify-between gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.badgeStyle}`}>
                    <CategoryIcon className="w-3 h-3 shrink-0" />
                    <span>{badge.label}</span>
                  </span>

                  {canManageNotices && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(ann)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title="Edit Notice"
                        aria-label={`Edit notice: ${ann.title}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingNotice(ann)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Notice"
                        aria-label={`Delete notice: ${ann.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                    {ann.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-4">
                    {ann.content}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {ann.date}
                </span>

                {ann.category === 'alert' && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Important
                  </span>
                )}
              </div>
            </motion.article>
          );
        })}

        {displayList.length === 0 && (
          <div className="col-span-full text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
            <p className="text-xs text-slate-500 font-medium">No notices found on the Notice Board.</p>
          </div>
        )}
      </section>

      {/* Edit Notice Modal */}
      <AnimatePresence>
        {editingNotice && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-notice-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <h3 id="edit-notice-modal-title" className="font-display font-bold text-base text-slate-900">
                    Edit Notice
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingNotice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Close edit dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label htmlFor="edit-notice-title" className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Title *
                  </label>
                  <input
                    id="edit-notice-title"
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="edit-notice-category" className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    id="edit-notice-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Announcement['category'])}
                    className="w-full text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="info">General Notice</option>
                    <option value="alert">Urgent Notice</option>
                    <option value="achievement">Academic Notice</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-notice-content" className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Message *
                  </label>
                  <textarea
                    id="edit-notice-content"
                    required
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingNotice(null)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl cursor-pointer shadow-xs transition active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Notice Confirmation Modal */}
      <AnimatePresence>
        {deletingNotice && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Delete Notice?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Are you sure you want to delete <strong>"{deletingNotice.title}"</strong>? This will permanently remove it from the Notice Board.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingNotice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer shadow-xs transition"
                >
                  Yes, Delete Notice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
