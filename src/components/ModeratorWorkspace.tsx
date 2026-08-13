/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentSubmission } from '../types';
import { Check, X, ShieldAlert, FileText, Calendar, User, Eye, ArrowRight, MessageSquare, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ModeratorWorkspace: React.FC = () => {
  const { submissions, approveSubmission, rejectSubmission } = useApp();
  
  // Selection and Feedback states
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Filter only pending submissions
  const pendingQueue = submissions.filter((s) => s.status === 'pending');

  const handleApprove = (id: string, title: string) => {
    approveSubmission(id);
    setNotification(`"${title}" successfully approved and published to the Student Creative Gallery!`);
    setTimeout(() => setNotification(null), 5000);
    setSelectedSub(null);
  };

  const handleRejectSubmit = (e: React.FormEvent, id: string, title: string) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    rejectSubmission(id, feedback.trim());
    setNotification(`Revision request filed for "${title}" with moderator notes.`);
    setTimeout(() => setNotification(null), 5000);
    
    // Reset
    setFeedback('');
    setShowRejectForm(false);
    setSelectedSub(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            Librarian Moderation Workspace
          </h2>
          <p className="text-sm text-slate-500">Review, approve, and give feedback on original student submissions before they go public.</p>
        </div>

        <div className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm font-mono">
          Pending Queue: {pendingQueue.length} Pieces
        </div>
      </div>

      {/* Real-time Inline Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <p>{notification}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Pending Queue */}
        <div className="md:col-span-1 space-y-4">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400">Moderator Inbox</h3>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {pendingQueue.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSub(sub);
                  setShowRejectForm(false);
                  setFeedback('');
                }}
                className={`w-full text-left p-4 rounded-2xl border transition flex flex-col justify-between items-start cursor-pointer ${
                  selectedSub?.id === sub.id
                    ? 'border-indigo-900 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-100 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className="space-y-2 w-full">
                  <div className="flex justify-between items-start gap-2">
                    <span className="bg-slate-100 text-slate-700 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                      {sub.category.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-sans font-extrabold text-sm text-slate-800 line-clamp-1">
                    {sub.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> By {sub.authorName} ({sub.gradeOrYear})
                  </p>
                </div>
                
                <div className="w-full flex justify-end pt-3 text-[10px] text-indigo-900 font-bold items-center gap-1">
                  <span>Audit Draft</span>
                  <Eye className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}

            {pendingQueue.length === 0 && (
              <div className="text-center py-12 bg-slate-50 border border-dashed rounded-2xl p-4">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-sans font-bold text-slate-500 text-xs">All caught up!</p>
                <p className="text-[10px] text-slate-400 mt-0.5">There are no pending student drafts currently awaiting approval.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Draft Reader & Actions */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {selectedSub ? (
              <motion.div
                key={selectedSub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold uppercase text-slate-400">{selectedSub.category.replace('-', ' ')} Review</span>
                    <h3 className="font-display font-black text-xl text-slate-900 leading-tight">
                      {selectedSub.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Authored by <span className="text-slate-800 font-semibold">{selectedSub.authorName}</span> from <span className="text-slate-800 font-semibold">{selectedSub.gradeOrYear}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(selectedSub.id, selectedSub.title)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Approve & Publish
                    </button>

                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1 border border-rose-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      Revision Required
                    </button>
                  </div>
                </div>

                {/* Cover Asset if available */}
                {selectedSub.imageUrl && (
                  <div className="rounded-2xl overflow-hidden h-44 border border-slate-100">
                    <img src={selectedSub.imageUrl} alt={selectedSub.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Draft Content */}
                <div className="space-y-2">
                  <h4 className="font-display font-bold text-[10px] text-slate-400 uppercase tracking-widest">Draft Text</h4>
                  <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-5 rounded-2xl border font-serif whitespace-pre-wrap italic">
                    "{selectedSub.content}"
                  </p>
                </div>

                {/* Action forms for Revision requested */}
                <AnimatePresence>
                  {showRejectForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={(e) => handleRejectSubmit(e, selectedSub.id, selectedSub.title)}
                      className="bg-rose-50/50 border border-rose-200 p-4 rounded-2xl space-y-3 overflow-hidden"
                    >
                      <h5 className="font-display font-bold text-xs text-rose-800 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> Add Moderation & Revision Feedback
                      </h5>
                      <textarea
                        required
                        rows={2}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="e.g. Beautiful poem, Amina. Please correct the punctuation in stanza 2 before publishing."
                        className="w-full text-xs p-2.5 border border-rose-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowRejectForm(false)}
                          className="px-3.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 px-3.5 rounded-lg text-xs shadow-xs"
                        >
                          Send Revision Request
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

              </motion.div>
            ) : (
              <div className="bg-slate-50 border border-dashed rounded-3xl p-12 text-center text-slate-400 min-h-[40vh] flex flex-col items-center justify-center space-y-3">
                <FileText className="w-14 h-14 text-slate-300" />
                <div className="space-y-1">
                  <h4 className="font-display font-bold text-slate-600 text-sm">No Draft Selected</h4>
                  <p className="text-xs text-slate-400">Click on any pending item on the left panel to begin your administrative audit.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};
