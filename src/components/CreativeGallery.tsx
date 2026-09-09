/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { StudentSubmission, SubmissionCategory } from '../types';
import { 
  Heart, 
  MessageSquare, 
  Search, 
  BookOpen, 
  Layers, 
  X, 
  Send, 
  Calendar, 
  User, 
  UserCheck, 
  Star,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CreativeGallery: React.FC = () => {
  const { submissions, toggleLike, addComment, currentRole, currentLearnerName } = useApp();
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SubmissionCategory>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Selected Reader Overlay
  const [selectedSub, setSelectedSub] = useState<StudentSubmission | null>(null);
  
  // Comment Form State
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Simulate initial media skeletal loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Only show APPROVED submissions in the public gallery
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
      case 'poetry': return 'Poetry & Verse';
      case 'academic-essay': return 'Academic Essay';
      case 'digital-art': return 'Digital Art & Illustration';
      case 'audio-podcast': return 'Audio & Podcast';
      case 'video-multimedia': return 'Video & Media';
      default: return 'Creative Work';
    }
  };

  const getCategoryStyles = (cat: SubmissionCategory) => {
    switch (cat) {
      case 'short-story': return 'bg-purple-100 text-purple-950 border-purple-300';
      case 'poetry': return 'bg-amber-100 text-amber-950 border-amber-300';
      case 'academic-essay': return 'bg-sky-100 text-sky-950 border-sky-300';
      case 'digital-art': return 'bg-emerald-100 text-emerald-950 border-emerald-300';
      case 'audio-podcast': return 'bg-pink-100 text-pink-950 border-pink-300';
      case 'video-multimedia': return 'bg-indigo-100 text-indigo-950 border-indigo-300';
      default: return 'bg-slate-100 text-slate-950 border-slate-300';
    }
  };

  const getCoverPlaceholder = (cat: SubmissionCategory) => {
    switch (cat) {
      case 'short-story': return 'bg-gradient-to-r from-purple-700 to-indigo-900';
      case 'poetry': return 'bg-gradient-to-r from-amber-600 to-orange-700';
      case 'academic-essay': return 'bg-gradient-to-r from-blue-700 to-sky-900';
      case 'digital-art': return 'bg-gradient-to-r from-emerald-600 to-teal-800';
      case 'audio-podcast': return 'bg-gradient-to-r from-pink-600 to-rose-800';
      case 'video-multimedia': return 'bg-gradient-to-r from-indigo-700 to-violet-900';
      default: return 'bg-gradient-to-r from-slate-700 to-slate-900';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header, Search & Filters */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Student Creative Gallery
          </h2>
          <p className="text-sm text-slate-600">
            Original art, illustrations, audio recordings, video projects, stories, poems, and academic essays authored by Premier learners.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="sm:col-span-3 flex items-center bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
            <Search className="text-slate-500 w-5 h-5 mr-3 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search published pieces by student author, title, or keywords..."
              className="w-full text-xs sm:text-sm bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              aria-label="Search student creative submissions"
            />
          </div>

          <div className="sm:col-span-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-200 p-3 rounded-2xl shadow-xs outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
              aria-label="Filter submissions by category"
            >
              <option value="all">All Creative Media</option>
              <option value="short-story">Short Stories</option>
              <option value="poetry">Poetry & Verse</option>
              <option value="academic-essay">Academic Essays</option>
              <option value="digital-art">Digital Art & Illustration</option>
              <option value="audio-podcast">Audio & Podcasts</option>
              <option value="video-multimedia">Video & Multimedia</option>
            </select>
          </div>
        </div>

        {/* Fast Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {(['all', 'short-story', 'poetry', 'academic-essay', 'digital-art', 'audio-podcast', 'video-multimedia'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'all' ? '✨ All Works' : getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Grid with Skeleton Loading States */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((sk) => (
            <div key={sk} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs animate-pulse">
              <div className="h-44 bg-slate-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded-md w-full"></div>
                <div className="h-3 bg-slate-200 rounded-md w-5/6"></div>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded-lg w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((sub) => (
            <motion.article
              layout
              key={sub.id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Visual Cover Header */}
                {sub.imageUrl ? (
                  <div className="h-44 relative overflow-hidden bg-slate-900">
                    <img 
                      src={sub.imageUrl} 
                      alt={sub.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-black tracking-wide uppercase text-slate-900 shadow-2xs">
                      {getCategoryLabel(sub.category)}
                    </div>
                  </div>
                ) : (
                  <div className={`h-44 p-5 text-white flex flex-col justify-between ${getCoverPlaceholder(sub.category)}`}>
                    <span className="bg-white/20 backdrop-blur-xs self-start text-[10px] px-2.5 py-1 rounded-lg uppercase font-black tracking-wider border border-white/20">
                      {getCategoryLabel(sub.category)}
                    </span>
                    <h3 className="font-display font-black text-lg leading-tight line-clamp-2 text-white">
                      {sub.title}
                    </h3>
                  </div>
                )}

                {/* Sub Body excerpt */}
                <div className="p-5 space-y-2.5">
                  {sub.imageUrl && (
                    <h3 className="font-display font-black text-base text-slate-900 leading-tight line-clamp-1">
                      {sub.title}
                    </h3>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 italic">
                    "{sub.content}"
                  </p>
                </div>
              </div>

              {/* Engagement Tray */}
              <div className="p-5 border-t border-slate-100 flex items-center justify-between text-slate-500 bg-slate-50/40">
                <div className="space-y-0.5">
                  <span className="block text-[9px] uppercase font-black text-slate-600">Author</span>
                  <span className="text-xs font-bold text-slate-900 block truncate max-w-[140px]">
                    {sub.authorName} ({sub.gradeOrYear})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLike(sub.id)}
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition cursor-pointer ${
                      sub.likedByCurrentUser ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                    }`}
                    aria-label={`Like submission, currently ${sub.likesCount} likes`}
                  >
                    <Heart className={`w-4 h-4 ${sub.likedByCurrentUser ? 'fill-rose-600' : ''}`} />
                    <span>{sub.likesCount}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSub(sub)}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-900 px-2 py-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    aria-label={`View comments, currently ${sub.comments.length} comments`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{sub.comments.length}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedSub(sub)}
                    className="bg-indigo-950 hover:bg-indigo-900 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-2xs"
                  >
                    Read
                  </button>
                </div>
              </div>
            </motion.article>
          ))}

          {filteredSubmissions.length === 0 && (
            <div className="md:col-span-3 text-center py-16 bg-white border border-dashed border-slate-300 rounded-3xl p-8 space-y-2">
              <Layers className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="font-display font-bold text-slate-800 text-base">No creative pieces found</p>
              <p className="text-xs text-slate-500">Check back later or submit your own work through the Submit Work form.</p>
            </div>
          )}
        </div>
      )}

      {/* Reader Modal Overlay with Accessible Focus Control */}
      <AnimatePresence>
        {selectedSub && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200"
            >
              {/* Top Modal Header */}
              <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${getCategoryStyles(selectedSub.category)}`}>
                    {getCategoryLabel(selectedSub.category)}
                  </span>
                  <h3 id="reader-modal-title" className="font-display font-black text-xl sm:text-2xl text-slate-900 pt-1">
                    {selectedSub.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    By <span className="font-bold text-slate-800">{selectedSub.authorName}</span> ({selectedSub.gradeOrYear}) • Published on {new Date(selectedSub.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
                  aria-label="Close reader modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover Image if present */}
              {selectedSub.imageUrl && (
                <div className="rounded-2xl overflow-hidden max-h-72 bg-slate-900">
                  <img 
                    src={selectedSub.imageUrl} 
                    alt={selectedSub.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Full Content */}
              <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed whitespace-pre-line font-serif bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                {selectedSub.content}
              </div>

              {/* Peer Feedback and Discussion Section */}
              <div className="space-y-4 border-t border-slate-100 pt-4">
                <h4 className="font-display font-black text-sm text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-900" />
                  Peer Discussion & Appreciations ({selectedSub.comments.length})
                </h4>

                {/* Comment Input */}
                <form onSubmit={(e) => handleSendComment(e, selectedSub.id)} className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-bold">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setCommentRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-0.5 text-amber-400 cursor-pointer"
                          aria-label={`Rate ${star} star`}
                        >
                          <Star className={`w-4 h-4 ${(hoverRating !== null ? hoverRating >= star : commentRating >= star) ? 'fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write encouraging feedback or a peer compliment..."
                      className="flex-1 text-xs border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600"
                      aria-label="Add peer comment"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-950 hover:bg-indigo-900 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>

                {/* Comment list */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {selectedSub.comments.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span className="font-bold text-slate-800">{c.authorName}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{c.rating || 5}/5</span>
                        </div>
                      </div>
                      <p className="text-slate-700">{c.content}</p>
                    </div>
                  ))}

                  {selectedSub.comments.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-3 italic">
                      Be the first student to leave an encouraging remark on this piece!
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
