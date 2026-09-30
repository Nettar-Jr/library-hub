/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Book, BOOK_CATEGORIES } from '../types';
import { lookupBookByISBN } from '../utils/isbnLookup';
import { 
  X, 
  Check, 
  Sparkles, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Image as ImageIcon,
  Headphones,
  Award,
  Layers,
  Lock,
  BookmarkCheck,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditBookModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedBook: Book) => void;
}

export const EditBookModal: React.FC<EditBookModalProps> = ({
  book,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updateBook } = useApp();

  const [formData, setFormData] = useState<Partial<Book>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpISBN, setIsLookingUpISBN] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Sync state whenever the book changes or modal opens
  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        category: book.category || 'African Literature',
        section: book.section || 'primary',
        totalCopies: book.totalCopies ?? 5,
        availableCopies: book.availableCopies ?? 5,
        description: book.description || book.summary || '',
        summary: book.summary || book.description || '',
        coverImage: book.coverImage || book.coverUrl || '',
        deweyClass: book.deweyClass || '800',
        deweyCode: book.deweyCode || '896.3',
        callNumber: book.callNumber || (book.deweyCode ? `DDC ${book.deweyCode}` : ''),
        ageRange: book.ageRange || 'Ages 8-16',
        readingLevel: book.readingLevel || 'Lexile 740L',
        pageCount: book.pageCount || 240,
        usageType: book.usageType || 'circulation',
        hasAudio: !!book.hasAudio || !!book.isAudiobook,
        isPopular: !!book.isPopular,
        isNew: !!book.isNew,
        isTeacherPick: !!book.isTeacherPick,
      });
      setFormError(null);
      setFormSuccess(null);
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const handleISBNLookup = async () => {
    const rawIsbn = (formData.isbn || '').replace(/[^0-9X]/gi, '');
    if (rawIsbn.length !== 10 && rawIsbn.length !== 13) {
      setFormError('Please enter a valid 10 or 13-digit ISBN to look up metadata.');
      return;
    }

    setIsLookingUpISBN(true);
    setFormError(null);

    try {
      const res = await lookupBookByISBN(rawIsbn);
      if (res.success && res.book) {
        setFormData((prev) => ({
          ...prev,
          title: res.book!.title || prev.title,
          author: res.book!.authors.join(', ') || prev.author,
          description: res.book!.description || prev.description,
          summary: res.book!.description || prev.summary,
          coverImage: res.book!.coverUrl || prev.coverImage,
          deweyCode: res.book!.deweyCode || prev.deweyCode,
          callNumber: res.book!.deweyCode ? `DDC ${res.book!.deweyCode}` : prev.callNumber,
        }));
        setFormSuccess(`Auto-populated details from Open Library for "${res.book.title}"!`);
        setTimeout(() => setFormSuccess(null), 4000);
      } else {
        setFormError(res.error || 'No bibliographic data found for this ISBN in Open Library.');
      }
    } catch (err: any) {
      setFormError(`ISBN Lookup failed: ${err.message || 'Network error'}`);
    } finally {
      setIsLookingUpISBN(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      setFormError('Book title is required.');
      return;
    }
    if (!formData.author?.trim()) {
      setFormError('Author name is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const total = Number(formData.totalCopies) || 1;
      let avail = Number(formData.availableCopies);
      if (isNaN(avail) || avail > total) {
        avail = total;
      }
      if (avail < 0) avail = 0;

      const updates: Partial<Book> = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn?.trim() || book.isbn,
        category: formData.category || book.category,
        section: formData.section as 'primary' | 'college',
        totalCopies: total,
        availableCopies: avail,
        description: formData.description?.trim() || '',
        summary: formData.description?.trim() || '',
        coverImage: formData.coverImage?.trim() || book.coverImage,
        coverUrl: formData.coverImage?.trim() || book.coverUrl,
        deweyClass: formData.deweyClass?.trim() || book.deweyClass,
        deweyCode: formData.deweyCode?.trim() || book.deweyCode,
        callNumber: formData.callNumber?.trim() || (formData.deweyCode ? `DDC ${formData.deweyCode}` : book.callNumber),
        ageRange: formData.ageRange?.trim() || book.ageRange,
        readingLevel: formData.readingLevel?.trim() || book.readingLevel,
        pageCount: Number(formData.pageCount) || book.pageCount || 200,
        usageType: formData.usageType || book.usageType || 'circulation',
        hasAudio: !!formData.hasAudio,
        isAudiobook: !!formData.hasAudio,
        isPopular: !!formData.isPopular,
        isNew: !!formData.isNew,
        isTeacherPick: !!formData.isTeacherPick,
      };

      const result = await updateBook(book.id, updates);
      if (result.success) {
        setFormSuccess('Book updated successfully in catalogue!');
        if (onSuccess) {
          onSuccess({ ...book, ...updates });
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFormError(result.message || 'Failed to update book.');
      }
    } catch (err: any) {
      setFormError(`Error saving changes: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-book-modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200/90 flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-book-modal-title" className="font-display font-bold text-base text-white">
                Edit Book in Catalogue
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">
                Update bibliographic metadata, copies, shelf classification, and cover details
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close edit book dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alerts */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
          
          {/* Top Row: Cover Preview & Essential Details */}
          <div className="flex flex-col sm:flex-row gap-4 items-start pb-2 border-b border-slate-100">
            {/* Live Cover Preview */}
            <div className="w-24 sm:w-28 aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-sm relative group">
              {formData.coverImage ? (
                <img
                  src={formData.coverImage}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 bg-slate-50">
                  <ImageIcon className="w-6 h-6 mb-1 text-slate-300" />
                  <span className="text-[10px]">No Cover</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Arrow of God"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Chinua Achebe"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Category & Campus Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Subject Category
              </label>
              <select
                value={formData.category || 'African Literature'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              >
                {BOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Branch / Section
              </label>
              <select
                value={formData.section || 'primary'}
                onChange={(e) => setFormData({ ...formData, section: e.target.value as 'primary' | 'college' })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              >
                <option value="primary">Primary School Library</option>
                <option value="college">College / Secondary Library</option>
              </select>
            </div>
          </div>

          {/* Dewey Classification & ISBN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Dewey Decimal Code
              </label>
              <input
                type="text"
                value={formData.deweyCode || ''}
                onChange={(e) => setFormData({ ...formData, deweyCode: e.target.value })}
                placeholder="e.g. 896.3"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Call Number
              </label>
              <input
                type="text"
                value={formData.callNumber || ''}
                onChange={(e) => setFormData({ ...formData, callNumber: e.target.value })}
                placeholder="e.g. DDC 896.3 ACH"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  ISBN
                </label>
                {formData.isbn && (
                  <button
                    type="button"
                    disabled={isLookingUpISBN}
                    onClick={handleISBNLookup}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isLookingUpISBN ? 'Looking up...' : 'Auto-Fill'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.isbn || ''}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                placeholder="e.g. 978-0385474542"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Copies & Usage Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Copies
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalCopies ?? 1}
                onChange={(e) => setFormData({ ...formData, totalCopies: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Available Copies
              </label>
              <input
                type="number"
                min="0"
                max={formData.totalCopies ?? 1}
                value={formData.availableCopies ?? 0}
                onChange={(e) => setFormData({ ...formData, availableCopies: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lending Usage Policy
              </label>
              <select
                value={formData.usageType || 'circulation'}
                onChange={(e) => setFormData({ ...formData, usageType: e.target.value as 'circulation' | 'reserve' })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              >
                <option value="circulation">Circulation (14-Day Lending)</option>
                <option value="reserve">Reserve (Reference Desk Only)</option>
              </select>
            </div>
          </div>

          {/* Age Range, Reading Level, Pages */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Age Range
              </label>
              <input
                type="text"
                value={formData.ageRange || ''}
                onChange={(e) => setFormData({ ...formData, ageRange: e.target.value })}
                placeholder="e.g. Ages 10-18"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reading Level / Lexile
              </label>
              <input
                type="text"
                value={formData.readingLevel || ''}
                onChange={(e) => setFormData({ ...formData, readingLevel: e.target.value })}
                placeholder="e.g. Lexile 800L"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Page Count
              </label>
              <input
                type="number"
                min="1"
                value={formData.pageCount || 200}
                onChange={(e) => setFormData({ ...formData, pageCount: Number(e.target.value) })}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs"
              />
            </div>
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Cover Image URL
            </label>
            <input
              type="url"
              value={formData.coverImage || ''}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs font-mono"
            />
          </div>

          {/* Synopsis / Summary */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Synopsis & Description
            </label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Write or edit the synopsis of this book..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-none focus:ring-1 focus:ring-slate-500 text-xs leading-relaxed"
            />
          </div>

          {/* Badges / Options */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={!!formData.hasAudio}
                onChange={(e) => setFormData({ ...formData, hasAudio: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5 text-purple-600" />
                <span>Audio Narration Available</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={!!formData.isPopular}
                onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Curriculum Essential / High Circulation</span>
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={!!formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500 cursor-pointer"
              />
              <span>New Accession</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={!!formData.isTeacherPick}
                onChange={(e) => setFormData({ ...formData, isTeacherPick: e.target.checked })}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500 cursor-pointer"
              />
              <span>Faculty / Teacher Recommendation</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
