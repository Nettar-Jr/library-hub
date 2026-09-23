/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement, LibrarySection } from '../types';
import { 
  Bell, 
  AlertCircle, 
  Calendar, 
  Plus, 
  X, 
  Check, 
  BookOpen, 
  School,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnnouncementBoardProps {
  isHomePreview?: boolean;
}

export const AnnouncementBoard: React.FC<AnnouncementBoardProps> = ({ isHomePreview = false }) => {
  const { announcements, isLibrarianLoggedIn, isAdmin, isStaff, addAnnouncement } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | Announcement['category']>('all');
  const [filterSection, setFilterSection] = useState<'all' | 'college' | 'primary'>('all');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Announcement['category']>('info');
  const [noticeSection, setNoticeSection] = useState<LibrarySection>('all');

  const canManageNotices = isLibrarianLoggedIn || isAdmin || isStaff;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    addAnnouncement(title, content, category, noticeSection);
    setTitle('');
    setContent('');
    setCategory('info');
    setNoticeSection('all');
    setShowForm(false);
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

  const getSectionBadge = (sec?: string) => {
    if (sec === 'primary') {
      return {
        label: 'Primary Library',
        icon: School,
        style: 'bg-teal-50 text-teal-800 border-teal-200',
      };
    }
    if (sec === 'college') {
      return {
        label: 'College / Secondary',
        icon: GraduationCap,
        style: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      };
    }
    return {
      label: 'All Sections',
      icon: Sparkles,
      style: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  };

  // Preview notices on homepage: accommodate exactly 2 from Primary and 2 from Secondary/College
  const previewNotices = React.useMemo(() => {
    const primaryNotices = announcements.filter((a) => a.section === 'primary' || a.section === 'all').slice(0, 2);
    const primaryIds = new Set(primaryNotices.map((n) => n.id));
    const collegeNotices = announcements.filter((a) => ((a.section || 'college') === 'college' || a.section === 'all') && !primaryIds.has(a.id)).slice(0, 2);
    return [...primaryNotices, ...collegeNotices];
  }, [announcements]);

  // Full archive filtering on announcements page
  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesCat = filterCategory === 'all' || ann.category === filterCategory;
    const matchesSec = filterSection === 'all' || ann.section === filterSection || ann.section === 'all';
    return matchesCat && matchesSec;
  });

  const displayList = isHomePreview ? previewNotices : filteredAnnouncements;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              Library Notices
            </h2>
            {isHomePreview && (
              <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
                Primary & College Sections
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isHomePreview 
              ? 'Featured official notices, reading events, and schedule updates from Primary and Secondary libraries.'
              : 'Official dates, schedule adjustments, book return deadlines, and library notices across all branches.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {canManageNotices && (
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
      </div>

      {/* Filter Controls (Only on full view, not preview) */}
      {!isHomePreview && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b border-slate-100 pb-4">
          {/* Section Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setFilterSection('all')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterSection === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Branches
            </button>
            <button
              type="button"
              onClick={() => setFilterSection('primary')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterSection === 'primary'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Primary Library
            </button>
            <button
              type="button"
              onClick={() => setFilterSection('college')}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterSection === 'college'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              College / Secondary
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
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
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap ${
                  filterCategory === item.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New Notice Form (Staff / Librarian) */}
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
              <div className="sm:col-span-1">
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
                <label htmlFor="notice-section" className="block text-xs font-semibold text-slate-700 mb-1">
                  Target School Section
                </label>
                <select
                  id="notice-section"
                  value={noticeSection}
                  onChange={(e) => setNoticeSection(e.target.value as LibrarySection)}
                  className="w-full text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="all">Global (Both Primary & College)</option>
                  <option value="primary">Primary School Library</option>
                  <option value="college">College / Secondary Library</option>
                </select>
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
                  <option value="info">General Notice</option>
                  <option value="alert">Urgent Notice</option>
                  <option value="achievement">Academic Notice</option>
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" 
        aria-live="polite" 
        aria-label="School Announcements Feed"
      >
        {displayList.map((ann, idx) => {
          const badge = getCategoryBadge(ann.category);
          const CategoryIcon = badge.icon;
          const sectionBadge = getSectionBadge(ann.section);
          const SectionIcon = sectionBadge.icon;

          return (
            <motion.article
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="space-y-3">
                {/* Section & Category Badges */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 ${sectionBadge.style}`}>
                    <SectionIcon className="w-3 h-3 shrink-0" />
                    <span>{sectionBadge.label}</span>
                  </span>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.badgeStyle}`}>
                    <CategoryIcon className="w-3 h-3 shrink-0" />
                    <span>{badge.label}</span>
                  </span>
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
            <p className="text-xs text-slate-500 font-medium">No library notices found matching your filter criteria.</p>
          </div>
        )}
      </section>
    </div>
  );
};
