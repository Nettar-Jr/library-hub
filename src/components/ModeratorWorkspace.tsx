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
  BookOpen,
  CheckSquare,
  Square,
  GraduationCap,
  Users,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ModeratorWorkspace: React.FC = () => {
  const { 
    submissions, 
    approveSubmission, 
    rejectSubmission, 
    users, 
    currentUser, 
    isStaff, 
    isAdmin, 
    setIsRosterModalOpen 
  } = useApp();
  
  // Selection and Filter states
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'revision' | 'approved' | 'all'>('pending');
  const [classFilterOnly, setClassFilterOnly] = useState(isStaff && !isAdmin);
  
  // Batch multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Revision Modal State
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [subForRevision, setSubForRevision] = useState<StudentSubmission | null>(null);
  const [isBatchRevision, setIsBatchRevision] = useState(false);
  
  // Notification toast
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'amber' } | null>(null);

  // Helper to check if submission author belongs to logged-in teacher
  const isAuthorInMyClass = (authorName: string) => {
    if (!currentUser) return false;
    const authorUser = users.find(u => u.name.toLowerCase().includes(authorName.toLowerCase()) || authorName.toLowerCase().includes(u.name.toLowerCase()));
    return authorUser?.assignedTeacherId === currentUser.id;
  };

  // Filter queues
  const filteredSubmissions = submissions.filter((s) => {
    if (classFilterOnly && isStaff && !isAdmin && currentUser) {
      return isAuthorInMyClass(s.authorName);
    }
    return true;
  });

  const pendingQueue = filteredSubmissions.filter((s) => s.status === 'pending');
  const revisionQueue = filteredSubmissions.filter((s) => s.status === 'rejected');
  const approvedQueue = filteredSubmissions.filter((s) => s.status === 'approved');

  const displayedList = filteredSubmissions.filter((s) => {
    if (activeTab === 'pending') return s.status === 'pending';
    if (activeTab === 'revision') return s.status === 'rejected';
    if (activeTab === 'approved') return s.status === 'approved';
    return true;
  });

  // Quick feedback presets for fast feedback
  const feedbackPresets = [
    { label: 'Grammar & Punctuation', text: 'Great creative start! Please review and correct punctuation and spelling in paragraph 2 before publishing.' },
    { label: 'Teacher Endorsement 🌟', text: 'Outstanding creative piece from our class! Excellent voice and imaginative execution. Approved with high praise.' },
    { label: 'Expand Narrative Ending', text: 'Wonderful atmosphere and character voice. Consider expanding the conclusion to give the piece a stronger resolution.' },
    { label: 'Audio / Video Clarity', text: 'Creative audio/video concept! Please ensure speech is clearly audible and video titles are formatted cleanly.' },
    { label: 'Visual Art Resolution', text: 'Vibrant artwork! Please review the uploaded image crop and resolution to ensure optimal display in the gallery.' },
    { label: 'Format Stanzas & Lines', text: 'Beautiful rhythm. Please reformat stanza line breaks to improve readability on digital screens.' },
    { label: 'Add Citations / Credits', text: 'Well-crafted project. Please add citations or credits for any sample media or cited research points.' },
    { label: 'School Guidelines Review', text: 'Please adjust certain expressions to align with our school community guidelines and resubmit.' }
  ];

  const handleApprove = (id: string, title: string) => {
    approveSubmission(id);
    setNotification({
      message: `"${title}" has been approved and published to the Student Creative Gallery!`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 5000);
    
    if (selectedSub?.id === id) {
      setSelectedSub(prev => prev ? { ...prev, status: 'approved' } : null);
    }
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => approveSubmission(id));
    setNotification({
      message: `Batch Approved: ${selectedIds.length} pieces published to the Creative Gallery!`,
      type: 'success'
    });
    setSelectedIds([]);
    setTimeout(() => setNotification(null), 5000);
  };

  const openRevisionModal = (sub: StudentSubmission) => {
    setIsBatchRevision(false);
    setSubForRevision(sub);
    setRevisionFeedback(sub.moderationFeedback || '');
    setIsRevisionModalOpen(true);
  };

  const openBatchRevisionModal = () => {
    if (selectedIds.length === 0) return;
    setIsBatchRevision(true);
    setSubForRevision(null);
    setRevisionFeedback('');
    setIsRevisionModalOpen(true);
  };

  const closeRevisionModal = () => {
    setIsRevisionModalOpen(false);
    setSubForRevision(null);
    setRevisionFeedback('');
    setIsBatchRevision(false);
  };

  const handleSendRevisionRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) return;

    if (isBatchRevision) {
      selectedIds.forEach((id) => rejectSubmission(id, revisionFeedback.trim()));
      setNotification({
        message: `Batch Revision Request sent to ${selectedIds.length} authors.`,
        type: 'amber'
      });
      setSelectedIds([]);
    } else if (subForRevision) {
      rejectSubmission(subForRevision.id, revisionFeedback.trim());
      setNotification({
        message: `Revision request with moderation feedback sent to ${subForRevision.authorName} for "${subForRevision.title}".`,
        type: 'amber'
      });
      if (selectedSub?.id === subForRevision.id) {
        setSelectedSub(prev => prev ? { ...prev, status: 'rejected', moderationFeedback: revisionFeedback.trim() } : null);
      }
    }

    setTimeout(() => setNotification(null), 5000);
    closeRevisionModal();
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === displayedList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedList.map(item => item.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-500" />
              {isAdmin ? 'Librarian Institutional Moderation' : 'Teacher Classroom Moderation'}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {isAdmin ? 'Admin View' : 'Teacher View'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isAdmin 
              ? 'Review, provide constructive feedback, and approve original student literature and art school-wide.'
              : `Review submissions from your assigned class scholars, provide encouraging feedback, and publish them.`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsRosterModalOpen(true)}
              className="bg-indigo-900 hover:bg-indigo-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Manage Class Rosters</span>
            </button>
          )}

          {isStaff && !isAdmin && (
            <button
              type="button"
              onClick={() => setClassFilterOnly(!classFilterOnly)}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition border ${
                classFilterOnly 
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{classFilterOnly ? 'Showing My Class Only' : 'Showing All School Works'}</span>
            </button>
          )}

          <div className="bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl font-mono flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>{pendingQueue.length} Pending</span>
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
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm border ${
              notification.type === 'success'
                ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                : 'bg-amber-100 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
              <p>{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Batch Multi-Select Action Bar */}
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="sticky top-20 z-30 bg-indigo-950 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 border border-indigo-800"
        >
          <div className="flex items-center gap-3">
            <span className="bg-amber-400 text-indigo-950 text-xs font-black px-2.5 py-1 rounded-full">
              {selectedIds.length} Selected
            </span>
            <span className="text-xs text-indigo-200 font-medium">
              Perform batch moderation on selected submissions:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBatchApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Approve & Publish ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={openBatchRevisionModal}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>Request Revision ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-indigo-300 hover:text-white px-2 py-1 cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Submissions Inbox (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Status Filter Tabs & Select All Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex-1 py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                type="button"
                onClick={() => setActiveTab('revision')}
                className={`flex-1 py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'revision'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Revision ({revisionQueue.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('approved')}
                className={`flex-1 py-2 px-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'approved'
                    ? 'bg-white text-indigo-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Approved ({approvedQueue.length})</span>
              </button>
            </div>

            {displayedList.length > 0 && (
              <div className="flex justify-between items-center px-1 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 font-bold text-indigo-950 hover:underline cursor-pointer"
                >
                  {selectedIds.length === displayedList.length ? (
                    <CheckSquare className="w-4 h-4 text-indigo-900" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>Select All Filtered ({displayedList.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Submissions List */}
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {displayedList.map((sub) => {
              const isSelected = selectedSub?.id === sub.id;
              const isChecked = selectedIds.includes(sub.id);
              const authorObj = users.find(u => u.name.toLowerCase().includes(sub.authorName.toLowerCase()));

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'border-indigo-900 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-900'
                      : 'border-slate-200 bg-white hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => toggleSelect(sub.id, e)}
                        className="p-1 text-indigo-950 cursor-pointer"
                        aria-label={`Select ${sub.title}`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-900" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className="bg-slate-100 text-slate-800 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">
                        {sub.category.replace('-', ' ')}
                      </span>
                      {authorObj?.assignedTeacherName && (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <GraduationCap className="w-2.5 h-2.5" /> {authorObj.assignedTeacherName.split(' ')[1] || 'Class'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sub.status === 'pending' && (
                        <span className="bg-amber-100 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-700" /> Awaiting Review
                        </span>
                      )}
                      {sub.status === 'rejected' && (
                        <span className="bg-rose-100 text-rose-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-rose-700" /> Revision Needed
                        </span>
                      )}
                      {sub.status === 'approved' && (
                        <span className="bg-emerald-100 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Published
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 line-clamp-1">
                      {sub.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3 text-slate-500" /> By {sub.authorName} • <span className="font-mono">{sub.gradeOrYear}</span>
                    </p>
                  </div>

                  {sub.moderationFeedback && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-950 font-medium line-clamp-2">
                      <span className="font-bold">Feedback: </span>"{sub.moderationFeedback}"
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1 text-[10px] text-slate-500 font-mono border-t border-slate-100">
                    <span>Submitted {new Date(sub.createdAt).toLocaleDateString()}</span>
                    <span className="text-indigo-950 font-bold flex items-center gap-1">
                      <span>Inspect Piece</span>
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}

            {displayedList.length === 0 && (
              <div className="text-center py-12 bg-white border border-dashed border-slate-300 rounded-3xl p-6 space-y-2">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="font-display font-bold text-slate-800 text-xs">No items in this queue</p>
                <p className="text-[11px] text-slate-500">There are no submissions currently under "{activeTab}".</p>
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
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6"
              >
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="bg-indigo-100 text-indigo-950 font-mono font-bold text-[10px] px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {selectedSub.category}
                    </span>
                    <h3 className="font-display font-black text-xl text-slate-900 mt-1.5 leading-snug">
                      {selectedSub.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Authored by <strong className="text-slate-900">{selectedSub.authorName}</strong> ({selectedSub.gradeOrYear})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openRevisionModal(selectedSub)}
                      className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Request Revision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(selectedSub.id, selectedSub.title)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Publish</span>
                    </button>
                  </div>
                </div>

                {/* Cover Image if available */}
                {selectedSub.imageUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-64 bg-slate-900 border border-slate-200">
                    <img 
                      src={selectedSub.imageUrl} 
                      alt={selectedSub.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Sub Body Content */}
                <div className="space-y-2">
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-500">
                    Submission Content & Statement
                  </h4>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-serif whitespace-pre-line max-h-72 overflow-y-auto">
                    {selectedSub.content}
                  </div>
                </div>

                {/* Moderation Audit Trail if feedback exists */}
                {selectedSub.moderationFeedback && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950">
                      <AlertCircle className="w-4 h-4 text-rose-700" />
                      <span>Active Feedback Note Sent to Student:</span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed italic">
                      "{selectedSub.moderationFeedback}"
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-12 border border-dashed border-slate-300 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-display font-bold text-slate-800 text-base">Select a Submission to Review</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click on any piece in the queue on the left to read its full draft, review artwork, and send constructive feedback or approvals.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Revision Feedback Modal Overlay */}
      <AnimatePresence>
        {isRevisionModalOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="revision-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <h3 id="revision-modal-title" className="font-display font-black text-lg text-slate-900">
                    {isBatchRevision 
                      ? `Send Revision Feedback to ${selectedIds.length} Selected Authors`
                      : `Request Revision: "${subForRevision?.title}"`
                    }
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide encouraging guidance so the learner knows how to refine their work.
                  </p>
                </div>
                <button 
                  onClick={closeRevisionModal}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
                  aria-label="Close revision modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                  Quick Feedback Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {feedbackPresets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRevisionFeedback(p.text)}
                      className="text-[11px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-950 font-medium px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback text area */}
              <form onSubmit={handleSendRevisionRequest} className="space-y-4">
                <div>
                  <label htmlFor="revision-textarea" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Feedback Notes for Scholar
                  </label>
                  <textarea
                    id="revision-textarea"
                    required
                    rows={4}
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    placeholder="Write detailed recommendations for the student..."
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-2xl p-3.5 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeRevisionModal}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Revision Request</span>
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
