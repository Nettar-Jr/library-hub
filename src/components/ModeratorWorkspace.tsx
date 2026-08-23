/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentSubmission } from '../types';
import { 
  Check, 
  X, 
  ShieldAlert, 
  FileText, 
  Calendar, 
  User, 
  Eye, 
  MessageSquare, 
  AlertCircle, 
  Send, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  MessageCircle,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ModeratorWorkspace: React.FC = () => {
  const { submissions, approveSubmission, rejectSubmission } = useApp();
  
  // Selection and Filter states
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'revision' | 'approved' | 'all'>('pending');
  
  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [subForRevision, setSubForRevision] = useState<StudentSubmission | null>(null);
  
  // Notification toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'amber' } | null>(null);

  // Filter queues
  const pendingQueue = submissions.filter((s) => s.status === 'pending');
  const revisionQueue = submissions.filter((s) => s.status === 'rejected');
  const approvedQueue = submissions.filter((s) => s.status === 'approved');

  const displayedList = submissions.filter((s) => {
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'revision') return s.status === 'rejected';
    if (activeTab === 'approved') return s.status === 'approved';
    return true;
  });

  // Quick feedback presets for fast librarian feedback
  const feedbackPresets = [
    { label: 'Grammar & Punctuation', text: 'Great creative start! Please review and correct punctuation and spelling in paragraph 2 before publishing.' },
    { label: 'Expand Narrative Ending', text: 'Wonderful atmosphere and character voice. Consider expanding the conclusion to give the story a stronger resolution.' },
    { label: 'Format Stanzas', text: 'Beautiful poetic rhythm. Please reformat the stanza line breaks to improve readability on digital screens.' },
    { label: 'Add Academic Citations', text: 'Well-researched essay. Please add formal citations or references for the data points cited.' },
    { label: 'School Guidelines Review', text: 'Please adjust certain expressions to align with our school community guidelines and resubmit.' }
  ];

  const handleApprove = (id: string, title: string) => {
    approveSubmission(id);
    setNotification({
      message: `"${title}" has been approved and published to the Student Creative Gallery!`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 5000);
    
    // Update local selected sub status if currently viewed
    if (selectedSub?.id === id) {
      setSelectedSub(prev => prev ? { ...prev, status: 'approved' } : null);
    }
  };

  const openRevisionModal = (sub: StudentSubmission) => {
    setSubForRevision(sub);
    setRevisionFeedback(sub.moderationFeedback || '');
    setIsRevisionModalOpen(true);
  };

  const closeRevisionModal = () => {
    setIsRevisionModalOpen(false);
    setSubForRevision(null);
    setRevisionFeedback('');
  };

  const handleSendRevisionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForRevision || !revisionFeedback.trim()) return;

    rejectSubmission(subForRevision.id, revisionFeedback.trim());
    
    setNotification({
      message: `Revision request with librarian comments sent to ${subForRevision.authorName} for "${subForRevision.title}".`,
      type: 'amber'
    });
    setTimeout(() => setNotification(null), 5000);

    // Update selected sub view if open
    if (selectedSub?.id === subForRevision.id) {
      setSelectedSub(prev => prev ? { ...prev, status: 'rejected', moderationFeedback: revisionFeedback.trim() } : null);
    }

    closeRevisionModal();
  };

  const applyPreset = (presetText: string) => {
    if (!revisionFeedback) {
      setRevisionFeedback(presetText);
    } else {
      setRevisionFeedback(prev => `${prev} ${presetText}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            Librarian Moderation Workspace
          </h2>
          <p className="text-sm text-slate-500">
            Review, provide constructive feedback, and approve original student literature and art.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-amber-50 text-amber-900 border border-amber-200/80 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingQueue.length} Pending Audit</span>
          </div>
          <div className="bg-rose-50 text-rose-800 border border-rose-200/80 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs font-mono flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
            <span>{revisionQueue.length} In Revision</span>
          </div>
        </div>
      </div>

      {/* Notifications Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm border ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <p>{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Submissions Inbox (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80 text-xs font-bold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Pending</span>
              {pendingQueue.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {pendingQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('revision')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'revision'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Revision ({revisionQueue.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`flex-1 py-1.5 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'approved'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Approved ({approvedQueue.length})</span>
            </button>
          </div>

          {/* Submissions List */}
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {displayedList.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'border-indigo-900 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-900'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50/70 shadow-2xs'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                      {sub.category.replace('-', ' ')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {sub.status === 'pending' && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Review
                        </span>
                      )}
                      {sub.status === 'rejected' && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> Revision Needed
                        </span>
                      )}
                      {sub.status === 'approved' && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 line-clamp-1">
                      {sub.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-slate-400" /> By {sub.authorName} • <span className="font-mono">{sub.gradeOrYear}</span>
                    </p>
                  </div>

                  {sub.moderationFeedback && (
                    <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800 font-medium line-clamp-2">
                      <span className="font-bold">Comment: </span>"{sub.moderationFeedback}"
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 text-[10px] text-slate-400 font-mono border-t border-slate-100/80">
                    <span>Submitted {new Date(sub.createdAt).toLocaleDateString()}</span>
                    <span className="text-indigo-900 font-bold flex items-center gap-1">
                      <span>View Piece</span>
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}

            {displayedList.length === 0 && (
              <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-3xl p-6 space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-display font-bold text-slate-700 text-xs">No items in this filter</p>
                <p className="text-[11px] text-slate-400">There are no submissions currently classified under "{activeTab}".</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Submission Detail & Moderation Controls (7 cols) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedSub ? (
              <motion.div
                key={selectedSub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6"
              >
                {/* Header Info */}
                <div className="space-y-3 border-b border-slate-100 pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                      {selectedSub.category.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Received {new Date(selectedSub.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-black text-2xl text-slate-900 leading-tight">
                      {selectedSub.title}
                    </h3>
                    <p className="text-xs text-slate-600">
                      Author: <span className="font-bold text-slate-900">{selectedSub.authorName}</span> (Class: <span className="font-bold text-slate-900">{selectedSub.gradeOrYear}</span>)
                    </p>
                  </div>

                  {/* Status Banner */}
                  <div className="flex items-center gap-2 pt-1">
                    {selectedSub.status === 'pending' && (
                      <span className="bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Pending Administrative Moderation
                      </span>
                    )}
                    {selectedSub.status === 'rejected' && (
                      <span className="bg-rose-100 text-rose-900 font-bold text-xs px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Revision Requested from Student
                      </span>
                    )}
                    {selectedSub.status === 'approved' && (
                      <span className="bg-emerald-100 text-emerald-900 font-bold text-xs px-3 py-1 rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Live in Student Creative Gallery
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderation Actions Bar */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Moderation Actions:
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Librarian Alabi ID: #MOD-01
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* Approve Button */}
                    <button
                      onClick={() => handleApprove(selectedSub.id, selectedSub.title)}
                      disabled={selectedSub.status === 'approved'}
                      className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs ${
                        selectedSub.status === 'approved'
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{selectedSub.status === 'approved' ? 'Already Approved' : 'Approve & Publish'}</span>
                    </button>

                    {/* Revision Required Button (Opens Comment Form) */}
                    <button
                      onClick={() => openRevisionModal(selectedSub)}
                      className="py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-2xs"
                    >
                      <MessageSquare className="w-4 h-4 text-rose-600" />
                      <span>{selectedSub.status === 'rejected' ? 'Edit Revision Feedback' : 'Revision Required (Add Comment)'}</span>
                    </button>
                  </div>
                </div>

                {/* Existing Moderator Feedback Banner if previously rejected */}
                {selectedSub.moderationFeedback && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Active Librarian Comment to Student:</span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed font-medium bg-white/80 p-3 rounded-xl border border-rose-200/60 italic">
                      "{selectedSub.moderationFeedback}"
                    </p>
                  </div>
                )}

                {/* Image Cover Preview if attached */}
                {selectedSub.imageUrl && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Attached Cover / Digital Illustration:
                    </span>
                    <div className="rounded-2xl overflow-hidden h-48 border border-slate-200 shadow-inner">
                      <img src={selectedSub.imageUrl} alt={selectedSub.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Manuscript Draft Text */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-bold text-xs text-slate-500 uppercase tracking-widest">
                      Manuscript Text Content
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {selectedSub.content.split(/\s+/).filter(Boolean).length} Words
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 leading-relaxed bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 font-serif whitespace-pre-wrap">
                    {selectedSub.content}
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 min-h-[45vh] flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="font-display font-bold text-slate-700 text-sm">No Submission Selected</h4>
                  <p className="text-xs text-slate-400">
                    Select a student submission from the queue on the left to read the full draft, approve it, or provide revision comments.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* DEDICATED REVISION FEEDBACK MODAL: Requires comment before revision is sent */}
      <AnimatePresence>
        {isRevisionModalOpen && subForRevision && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative border border-slate-100 space-y-6"
            >
              {/* Close Button */}
              <button
                onClick={closeRevisionModal}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="space-y-2 pr-8">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
                    Moderator Revision Notice
                  </span>
                </div>
                
                <h3 className="font-display font-black text-xl text-slate-900 leading-tight">
                  Provide Revision Feedback for "{subForRevision.title}"
                </h3>
                
                <p className="text-xs text-slate-500">
                  Student: <span className="font-bold text-slate-800">{subForRevision.authorName}</span> ({subForRevision.gradeOrYear})
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSendRevisionRequest} className="space-y-5">
                
                {/* Preset Suggestions */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Quick Feedback Presets (Click to insert):
                  </label>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {feedbackPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyPreset(preset.text)}
                        className="text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 border border-slate-200/80 px-2.5 py-1 rounded-lg transition text-slate-700 cursor-pointer"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment Textarea (Required) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Librarian Feedback & Instructions: <span className="text-rose-600">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">
                      {revisionFeedback.length} characters
                    </span>
                  </div>
                  
                  <textarea
                    required
                    rows={4}
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    placeholder="e.g. Excellent imagery in the second stanza. Please check the spelling of 'savannah' in line 4 and expand the conclusion before we publish this to the school gallery."
                    className="w-full text-xs p-3.5 border border-slate-300 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-rose-500 font-sans leading-relaxed text-slate-800 shadow-inner"
                  />
                  <p className="text-[11px] text-slate-400 leading-snug">
                    This note will be delivered directly to {subForRevision.authorName} so they can refine their work and resubmit.
                  </p>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={closeRevisionModal}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!revisionFeedback.trim()}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow-md cursor-pointer ${
                      revisionFeedback.trim()
                        ? 'bg-rose-600 hover:bg-rose-500 text-white'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Revision Request to Student</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

