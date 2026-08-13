/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StudentSubmission, SubmissionCategory } from '../types';
import { Heart, MessageSquare, Search, BookOpen, Layers, X, Send, Calendar, User, UserCheck, Sparkles, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CreativeGallery: React.FC = () => {
  const { submissions, toggleLike, addComment, currentRole, currentLearnerName } = useApp();
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SubmissionCategory>('all');
  
  // Selected Reader Overlay
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  
  // Comment Form State
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Only show APPROVED submissions in the public gallery
  // In learner view, we can also show a small "My Submissions" tray which includes pending/rejected items! This is an exceptional touch.
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');

  const filteredSubmissions = approvedSubmissions.filter((sub) => {
    const matchesSearch =
      sub.title.toLowerCase().includes(search.toLowerCase()) ||
      sub.authorName.toLowerCase().includes(search.toLowerCase()) ||
      sub.content.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || sub.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Learner's private submission list
  const studentAuthor = currentLearnerName.split('(')[0].trim();
  const myPrivateSubmissions = submissions.filter(
    (s) => s.authorName.toLowerCase() === studentAuthor.toLowerCase()
  );

  const handleSendComment = (e: React.FormEvent, subId: string) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    addComment(subId, newComment.trim(), undefined, commentRating);
    setNewComment('');

    // Update active popup details so the user sees comment appear
    setSelectedSub((prev) => {
      if (!prev || prev.id !== subId) return prev;
      const commentAuthor = currentRole === 'librarian' ? 'Librarian Alabi' : currentLearnerName.split('(')[0].trim();
      return {
        ...prev,
        comments: [
          ...prev.comments,
          {
            id: `temp-${Date.now()}`,
            authorName: commentAuthor,
            content: newComment.trim(),
            createdAt: new Date().toISOString(),
            rating: commentRating
          }
        ]
      };
    });
    setCommentRating(5);
  };

  const getCategoryLabel = (cat: SubmissionCategory) => {
    switch (cat) {
      case 'short-story': return 'Short Story';
      case 'poetry': return 'Poem';
      case 'academic-essay': return 'Academic Essay';
      case 'digital-art': return 'Digital Art';
    }
  };

  const getCategoryStyles = (cat: SubmissionCategory) => {
    switch (cat) {
      case 'short-story': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'poetry': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'academic-essay': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'digital-art': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    }
  };

  const getCoverPlaceholder = (cat: SubmissionCategory) => {
    switch (cat) {
      case 'short-story': return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'poetry': return 'bg-gradient-to-r from-amber-400 to-orange-500';
      case 'academic-essay': return 'bg-gradient-to-r from-blue-500 to-sky-600';
      case 'digital-art': return 'bg-gradient-to-r from-emerald-400 to-teal-500';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Search and Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900">
            Student Creative Gallery
          </h2>
          <p className="text-sm text-slate-500">Original works, literature, and digital masterpieces authored by Premier learners.</p>
        </div>

        {/* Search Input */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="sm:col-span-3 flex items-center glass p-3.5 rounded-xl shadow-sm">
            <Search className="text-slate-400 w-5 h-5 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search published submissions by title, author, or content keyword..."
              className="w-full text-sm outline-none bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-500">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full p-3.5 glass rounded-xl shadow-xs text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Disciplines</option>
              <option value="short-story">Short Story</option>
              <option value="poetry">Poetry</option>
              <option value="academic-essay">Academic Essay</option>
              <option value="digital-art">Digital Artwork</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid of Approved Works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredSubmissions.map((sub) => {
          return (
            <motion.div
              layout
              key={sub.id}
              className="glass rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Visual Cover Header */}
                {sub.imageUrl ? (
                  <div className="h-40 relative overflow-hidden">
                    <img src={sub.imageUrl} alt={sub.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-wide uppercase shadow-2xs">
                      {getCategoryLabel(sub.category)}
                    </div>
                  </div>
                ) : (
                  <div className={`h-40 p-5 text-white flex flex-col justify-between ${getCoverPlaceholder(sub.category)}`}>
                    <span className="bg-white/20 backdrop-blur-xs self-start text-[10px] px-2.5 py-1 rounded-lg uppercase font-bold tracking-wider">
                      {getCategoryLabel(sub.category)}
                    </span>
                    <h3 className="font-display font-black text-lg leading-tight line-clamp-2">
                      {sub.title}
                    </h3>
                  </div>
                )}

                {/* Sub Body excerpt */}
                <div className="p-5 space-y-3">
                  {sub.imageUrl && (
                    <h3 className="font-display font-bold text-base text-slate-800 leading-tight line-clamp-1">
                      {sub.title}
                    </h3>
                  )}
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 italic">
                    "{sub.content}"
                  </p>
                </div>
              </div>

              {/* Engagement Tray */}
              <div className="p-5 border-t border-slate-100 flex items-center justify-between text-slate-400">
                <div className="space-y-0.5">
                  <span className="block text-[9px] uppercase font-bold text-slate-400">Author</span>
                  <span className="text-xs font-bold text-slate-600 block truncate max-w-[150px]">
                    {sub.authorName} ({sub.gradeOrYear})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleLike(sub.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition ${
                      sub.likedByCurrentUser ? 'text-rose-500' : 'hover:text-rose-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${sub.likedByCurrentUser ? 'fill-rose-500' : ''}`} />
                    <span>{sub.likesCount}</span>
                  </button>

                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-500 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{sub.comments.length}</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedSub(sub)}
                    className="bg-indigo-50 text-indigo-900 font-bold px-3 py-1.5 rounded-lg text-[10px] hover:bg-indigo-100 transition cursor-pointer"
                  >
                    Read
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredSubmissions.length === 0 && (
          <div className="md:col-span-3 text-center py-16 bg-slate-50 border border-dashed rounded-3xl p-6">
            <Layers className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-display font-bold text-slate-600">No creative pieces found</p>
            <p className="text-xs text-slate-400 mt-1">Check back later or submit your own work using the submit tab.</p>
          </div>
        )}
      </div>

      {/* Optional: Student's Personal Submissions Tracking dashboard (Only for Learners) */}
      {currentRole === 'learner' && myPrivateSubmissions.length > 0 && (
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 mt-12 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-900" />
            <h3 className="font-display font-extrabold text-sm text-slate-800 uppercase tracking-wider">
              My Submissions & Moderation History
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myPrivateSubmissions.map((mySub) => (
              <div key={mySub.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-3xs flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-xs text-slate-800 line-clamp-1">{mySub.title}</h4>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Submitted {new Date(mySub.createdAt).toLocaleDateString()}
                  </p>
                  {mySub.status === 'rejected' && mySub.moderationFeedback && (
                    <p className="text-[10px] text-rose-600 leading-tight italic bg-rose-50 p-2 rounded border border-rose-100">
                      Feedback: {mySub.moderationFeedback}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {mySub.status === 'pending' && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-md">
                      Pending Moderation
                    </span>
                  )}
                  {mySub.status === 'approved' && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-md">
                      Published
                    </span>
                  )}
                  {mySub.status === 'rejected' && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-md">
                      Revision Requested
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reader Overlay Detail view with Comments */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative border border-slate-100 space-y-6 my-8 max-h-[90vh] flex flex-col justify-between"
            >
              {/* Absolute Close */}
              <button
                onClick={() => setSelectedSub(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-6 overflow-y-auto pr-1 flex-1">
                
                {/* Meta details */}
                <div className="space-y-2">
                  <span className={`border px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block ${getCategoryStyles(selectedSub.category)}`}>
                    {getCategoryLabel(selectedSub.category)}
                  </span>
                  <h3 className="font-display font-black text-2xl text-slate-950 leading-tight">
                    {selectedSub.title}
                  </h3>
                  
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Authored by {selectedSub.authorName} ({selectedSub.gradeOrYear})</span>
                    <span className="text-slate-300">•</span>
                    <span>{new Date(selectedSub.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Cover Asset if available */}
                {selectedSub.imageUrl && (
                  <img src={selectedSub.imageUrl} alt={selectedSub.title} className="w-full h-48 sm:h-64 object-cover rounded-2xl" />
                )}

                {/* Content Reader Pane */}
                <div className="space-y-4">
                  <h4 className="font-display font-extrabold text-[10px] text-slate-400 uppercase tracking-widest border-b pb-1">Literary Content</h4>
                  <p className="text-sm text-slate-800 leading-relaxed font-serif whitespace-pre-wrap italic bg-slate-50/50 p-5 rounded-2xl border leading-relaxed">
                    {selectedSub.content}
                  </p>
                </div>

                {/* Interaction & Likes feedback */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                  <button
                    onClick={() => {
                      toggleLike(selectedSub.id);
                      setSelectedSub((prev) => {
                        if (!prev) return null;
                        const liked = !prev.likedByCurrentUser;
                        return {
                          ...prev,
                          likedByCurrentUser: liked,
                          likesCount: liked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1)
                        };
                      });
                    }}
                    className={`flex items-center gap-1.5 font-bold cursor-pointer transition ${
                      selectedSub.likedByCurrentUser ? 'text-rose-600' : 'text-slate-500 hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${selectedSub.likedByCurrentUser ? 'fill-rose-500' : ''}`} />
                    <span>{selectedSub.likesCount} Learners liked this work</span>
                  </button>
                </div>

                {/* Real-time Comments Board */}
                <div className="space-y-4 pt-2">
                  <h4 className="font-display font-extrabold text-[10px] text-slate-400 uppercase tracking-widest border-b pb-1">Comments Feed ({selectedSub.comments.length})</h4>
                  
                  {/* Comment list */}
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {selectedSub.comments.map((comm) => (
                      <div key={comm.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-800 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {comm.authorName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {comm.rating && comm.rating > 0 && (
                              <div className="flex gap-0.5 mr-1">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <Star 
                                    key={idx} 
                                    className={`w-3 h-3 ${idx < (comm.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                                  />
                                ))}
                              </div>
                            )}
                            <span className="text-slate-400">{new Date(comm.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{comm.content}</p>
                      </div>
                    ))}

                    {selectedSub.comments.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4 italic">No reviews or feedback posted yet. Be the first to share your thoughts!</p>
                    )}
                  </div>

                  {/* Comment Post Form */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Add Your Rating & Encouraging Feedback:
                    </span>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setCommentRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="focus:outline-none cursor-pointer"
                        >
                          <Star 
                            className={`w-4 h-4 transition-colors ${
                              star <= (hoverRating ?? commentRating) 
                                ? 'fill-amber-400 text-amber-400' 
                                : 'text-slate-300'
                            }`} 
                          />
                        </button>
                      ))}
                      <span className="text-[9px] font-bold text-slate-400 font-mono ml-1.5">
                        {commentRating} Stars
                      </span>
                    </div>

                    <form onSubmit={(e) => handleSendComment(e, selectedSub.id)} className="flex gap-2 items-center">
                      <input
                        type="text"
                        required
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Type your review comments and encouraging feedback..."
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="p-3 bg-indigo-900 text-white rounded-xl hover:bg-indigo-800 transition shadow-xs cursor-pointer flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>

              </div>

              <div className="border-t border-slate-100 pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedSub(null)}
                  className="px-5 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-800 cursor-pointer"
                >
                  Finished Reading
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
