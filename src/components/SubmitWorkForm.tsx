/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SubmissionCategory, StudentSubmission } from '../types';
import { 
  FileUp, 
  Image as ImageIcon, 
  Send, 
  Sparkles, 
  CheckCircle, 
  BookOpen, 
  PenTool, 
  Clock, 
  AlertCircle, 
  Edit3, 
  CheckCircle2, 
  RefreshCw, 
  MessageSquare, 
  Eye, 
  X,
  ListFilter,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  UploadCloud,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SubmitWorkForm: React.FC = () => {
  const { 
    addSubmission, 
    updateSubmission, 
    submissions, 
    currentLearnerName, 
    loggedInLearner, 
    currentRole 
  } = useApp();
  
  // Navigation within Submit Work
  const [activeSubTab, setActiveSubTab] = useState<'compose' | 'my-portfolio'>('compose');

  // Step state for multi-step progress bar (Step 1: Details & Genre -> Step 2: Content -> Step 3: Cover & Submit)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Editing state (if editing an existing submission)
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubFeedback, setEditingSubFeedback] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SubmissionCategory>('short-story');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Real-time touched & validation states
  const [touched, setTouched] = useState<{ title?: boolean; content?: boolean }>({});
  
  // Drag and drop & upload progress simulation
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // Success states
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [wasResubmission, setWasResubmission] = useState(false);

  // Curated educational Unsplash presets for student cover images/art
  const imagePresets = [
    { name: 'Cosmic Nebula', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400' },
    { name: 'Classical Library', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=400' },
    { name: 'Creative Abstract', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400' },
    { name: 'Nature Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400' },
  ];

  // Resolve current active student author identity
  const currentAuthorName = loggedInLearner?.name || currentLearnerName.split('(')[0].trim() || 'Learner';

  // Filter student's submissions
  const mySubmissions = submissions.filter((s) => {
    const author = s.authorName.toLowerCase();
    const query = currentAuthorName.toLowerCase();
    return author.includes(query) || query.includes(author);
  });

  const displaySubmissions = mySubmissions.length > 0 ? mySubmissions : submissions;
  const revisionCount = displaySubmissions.filter(s => s.status === 'rejected').length;

  // Real-time validation checks
  const isTitleValid = title.trim().length >= 3;
  const isContentValid = content.trim().length >= 20;

  const simulateUpload = (file: File) => {
    const sizeKB = Math.round(file.size / 1024);
    setUploadedFile({
      name: file.name,
      size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
    });
    setUploadProgress(10);
    
    // Progress increment animation
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 30;
      });
    }, 120);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0]);
    }
  };

  const handleStartEdit = (sub: StudentSubmission) => {
    setEditingSubId(sub.id);
    setEditingSubFeedback(sub.moderationFeedback || null);
    setTitle(sub.title);
    setCategory(sub.category);
    setContent(sub.content);
    setImageUrl(sub.imageUrl || '');
    setUploadedFile(null);
    setUploadProgress(null);
    setActiveSubTab('compose');
    setCurrentStep(1);
    setIsSubmitted(false);
  };

  const handleCancelEdit = () => {
    setEditingSubId(null);
    setEditingSubFeedback(null);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ title: true, content: true });
    if (!isTitleValid || !isContentValid) return;

    if (editingSubId) {
      updateSubmission(editingSubId, title.trim(), category, content.trim(), imageUrl || undefined);
      setSubmittedTitle(title.trim());
      setWasResubmission(true);
      setIsSubmitted(true);
      setEditingSubId(null);
      setEditingSubFeedback(null);
    } else {
      addSubmission(title.trim(), category, content.trim(), imageUrl || undefined);
      setSubmittedTitle(title.trim());
      setWasResubmission(false);
      setIsSubmitted(true);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('short-story');
    setContent('');
    setImageUrl('');
    setUploadedFile(null);
    setUploadProgress(null);
    setTouched({});
    setCurrentStep(1);
    setIsSubmitted(false);
    setEditingSubId(null);
    setEditingSubFeedback(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-100 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 font-mono border border-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Student Authors Hub
            </span>
            {revisionCount > 0 && (
              <span className="bg-rose-100 text-rose-950 text-xs font-bold px-3 py-1 rounded-full font-mono flex items-center gap-1 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> {revisionCount} Revision Requested
              </span>
            )}
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-950 tracking-tight mt-1.5">
            Submit & Track Creative Works
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Create original literature or art, monitor administrative moderation, and edit reviewed drafts.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div role="tablist" aria-label="Creative Submission Views" className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-300 text-xs font-bold w-full sm:w-auto">
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'compose'}
            onClick={() => {
              setActiveSubTab('compose');
              setIsSubmitted(false);
            }}
            className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'compose'
                ? 'bg-white text-indigo-950 shadow-sm border border-slate-300 font-black'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>{editingSubId ? 'Editing Draft' : 'Compose New'}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'my-portfolio'}
            onClick={() => {
              setActiveSubTab('my-portfolio');
              setIsSubmitted(false);
            }}
            className={`flex-1 sm:flex-none py-2.5 px-4 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
              activeSubTab === 'my-portfolio'
                ? 'bg-white text-indigo-950 shadow-sm border border-slate-300 font-black'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>My Submissions ({displaySubmissions.length})</span>
            {revisionCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: COMPOSE / EDIT FORM */}
        {activeSubTab === 'compose' && (
          <motion.div
            key="compose-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!isSubmitted ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-300 shadow-md space-y-8">
                
                {/* Editing Banner with Admin Feedback if editing a rejected/revision item */}
                {editingSubId && (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-950 font-bold text-xs sm:text-sm">
                        <Edit3 className="w-4 h-4 text-amber-700" />
                        <span>Editing Manuscript for Resubmission</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-300"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel Edit
                      </button>
                    </div>

                    {editingSubFeedback && (
                      <div className="space-y-1 bg-white p-4 rounded-xl border border-amber-200">
                        <span className="text-[11px] font-mono font-bold uppercase text-amber-950 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-rose-600" /> Librarian Alabi's Feedback & Revision Comment:
                        </span>
                        <p className="text-xs text-rose-950 font-medium italic leading-relaxed">
                          "{editingSubFeedback}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Progress Stepper (Phase 3 Ergonomics) */}
                <div aria-label="Submission Progress" className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className={`flex items-center gap-2 text-xs font-bold ${
                        currentStep === 1 ? 'text-indigo-950 font-black' : isTitleValid ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                        currentStep === 1 ? 'bg-indigo-950 text-white' : isTitleValid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isTitleValid && currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                      </span>
                      <span className="hidden sm:inline">1. Title & Genre</span>
                    </button>

                    <div className="h-0.5 flex-1 mx-3 bg-slate-200">
                      <div className={`h-full bg-indigo-950 transition-all ${currentStep >= 2 ? 'w-full' : 'w-0'}`} />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTouched(prev => ({ ...prev, title: true }));
                        if (isTitleValid) setCurrentStep(2);
                      }}
                      className={`flex items-center gap-2 text-xs font-bold ${
                        currentStep === 2 ? 'text-indigo-950 font-black' : isContentValid ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                        currentStep === 2 ? 'bg-indigo-950 text-white' : isContentValid && currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isContentValid && currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                      </span>
                      <span className="hidden sm:inline">2. Content & Manuscript</span>
                    </button>

                    <div className="h-0.5 flex-1 mx-3 bg-slate-200">
                      <div className={`h-full bg-indigo-950 transition-all ${currentStep >= 3 ? 'w-full' : 'w-0'}`} />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTouched({ title: true, content: true });
                        if (isTitleValid && isContentValid) setCurrentStep(3);
                      }}
                      className={`flex items-center gap-2 text-xs font-bold ${
                        currentStep === 3 ? 'text-indigo-950 font-black' : 'text-slate-500'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                        currentStep === 3 ? 'bg-indigo-950 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        3
                      </span>
                      <span className="hidden sm:inline">3. Media & Review</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 text-xs">
                  
                  {/* STEP 1: Title & Genre */}
                  {currentStep === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div>
                          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Author Identity</span>
                          <span className="font-display font-black text-sm text-slate-900">{currentLearnerName}</span>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Moderation Staff</span>
                          <span className="font-sans font-bold text-slate-700">Librarian Alabi (Integrated ILAS)</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label htmlFor="submit-title-input" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Title of Work *
                            </label>
                            {touched.title && (
                              <span className={`text-[11px] font-bold ${isTitleValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {isTitleValid ? '✓ Valid Title' : 'Title must be at least 3 characters'}
                              </span>
                            )}
                          </div>
                          <input
                            id="submit-title-input"
                            type="text"
                            required
                            value={title}
                            onChange={(e) => {
                              setTitle(e.target.value);
                              setTouched(prev => ({ ...prev, title: true }));
                            }}
                            onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
                            placeholder="e.g. Whispers of the Savannah"
                            aria-invalid={touched.title && !isTitleValid}
                            aria-describedby="title-error"
                            className={`w-full text-xs sm:text-sm p-3.5 border rounded-xl outline-none transition font-semibold text-slate-900 ${
                              touched.title && !isTitleValid 
                                ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500' 
                                : 'border-slate-300 bg-white focus:ring-2 focus:ring-indigo-600'
                            }`}
                          />
                        </div>

                        <div>
                          <label htmlFor="submit-category-select" className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                            Select Creative Category *
                          </label>
                          <select
                            id="submit-category-select"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as SubmissionCategory)}
                            className="w-full text-xs sm:text-sm p-3.5 border border-slate-300 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-slate-900"
                          >
                            <option value="short-story">📖 Short Story</option>
                            <option value="poetry">✍️ Poetry & Verse</option>
                            <option value="academic-essay">🎓 Academic Essay</option>
                            <option value="digital-art">🎨 Visual Art & Illustration</option>
                            <option value="audio-podcast">🎙️ Audio & Podcast</option>
                            <option value="video-multimedia">🎬 Video & Multimedia</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTouched(prev => ({ ...prev, title: true }));
                            if (isTitleValid) setCurrentStep(2);
                          }}
                          className="bg-indigo-950 hover:bg-indigo-900 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <span>Proceed to Content</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Manuscript & Media Text */}
                  {currentStep === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-5"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label htmlFor="submit-content-textarea" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Manuscript, Lyrics, Script or Project Statement *
                          </label>
                          <div className="text-[11px] font-mono">
                            <span className={isContentValid ? 'text-emerald-700 font-bold' : 'text-slate-500 font-medium'}>
                              {content.trim().split(/\s+/).filter(Boolean).length} words • {content.length} chars
                            </span>
                          </div>
                        </div>

                        <textarea
                          id="submit-content-textarea"
                          required
                          rows={10}
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value);
                            setTouched(prev => ({ ...prev, content: true }));
                          }}
                          onBlur={() => setTouched(prev => ({ ...prev, content: true }))}
                          placeholder="Type or paste your short story, poetry stanzas, essay text, artist statement, podcast audio transcript, or video description here..."
                          aria-invalid={touched.content && !isContentValid}
                          aria-describedby="content-error"
                          className={`w-full text-xs sm:text-sm p-4 border rounded-2xl outline-none font-serif leading-relaxed text-slate-900 ${
                            touched.content && !isContentValid
                              ? 'border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-500'
                              : 'border-slate-300 bg-white focus:ring-2 focus:ring-indigo-600'
                          }`}
                        />
                        {touched.content && !isContentValid && (
                          <p id="content-error" className="text-[11px] font-bold text-rose-700 mt-1">
                            Submission content should contain at least 20 characters of written prose, verse, or project explanation.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="px-5 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setTouched(prev => ({ ...prev, content: true }));
                            if (isContentValid) setCurrentStep(3);
                          }}
                          className="bg-indigo-950 hover:bg-indigo-900 text-white font-bold py-3 px-6 rounded-xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-amber-400"
                        >
                          <span>Proceed to Cover & Review</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: Cover Image, Upload & Submission */}
                  {currentStep === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      {/* Cover presets or Art image URL selection */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label htmlFor="submit-cover-url" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Cover Artwork / Illustration (Optional)
                          </label>
                          <span className="text-[11px] text-slate-500 font-mono">Curated Presets or Custom URL</span>
                        </div>
                        
                        <input
                          id="submit-cover-url"
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="Paste a direct image URL (https://...) or choose a preset below"
                          className="w-full text-xs p-3.5 border border-slate-300 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 font-mono text-slate-900"
                        />

                        {/* Preset Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {imagePresets.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setImageUrl(preset.url)}
                              className={`text-xs p-2.5 border rounded-2xl text-center transition flex flex-col items-center gap-2 cursor-pointer ${
                                imageUrl === preset.url
                                  ? 'border-indigo-900 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-900'
                                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <img src={preset.url} alt={preset.name} className="w-14 h-14 rounded-lg object-cover shadow-xs" />
                              <span className="truncate w-full font-semibold">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* File Upload Drop-Zone with Real-time Progress Bar */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Optional Document Attachment (PDF / DOCX / JPG)
                        </label>
                        
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                            dragActive
                              ? 'border-indigo-900 bg-indigo-50'
                              : uploadedFile
                              ? 'border-emerald-400 bg-emerald-50/30'
                              : 'border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="file"
                            id="file-upload-input"
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                          
                          <label htmlFor="file-upload-input" className="cursor-pointer space-y-2 block">
                            <UploadCloud className={`w-8 h-8 mx-auto ${uploadedFile ? 'text-emerald-700' : 'text-slate-500'}`} />
                            
                            {uploadedFile ? (
                              <div className="space-y-2">
                                <p className="font-bold text-emerald-950 text-xs">Attached: {uploadedFile.name}</p>
                                <p className="text-[11px] text-slate-500">File size: {uploadedFile.size} • Click to change</p>
                                {uploadProgress !== null && (
                                  <div className="max-w-xs mx-auto space-y-1">
                                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="bg-emerald-600 h-full transition-all duration-300" 
                                        style={{ width: `${uploadProgress}%` }} 
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-emerald-800">
                                      {uploadProgress === 100 ? '✓ Upload Complete' : `Uploading ${uploadProgress}%`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="font-bold text-slate-800 text-xs">Drag and drop your document here</p>
                                <p className="text-[11px] text-slate-500">or click to browse local files (max 10MB)</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Manuscript Preview Summary */}
                      <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-2">
                        <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider">
                          Ready for Submission:
                        </h3>
                        <p className="text-xs text-slate-700">
                          <strong>"{title}"</strong> ({category}) • {content.trim().split(/\s+/).filter(Boolean).length} words
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="px-5 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-slate-100 cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Manuscript</span>
                        </button>

                        <button
                          type="submit"
                          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3.5 px-8 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500"
                        >
                          {editingSubId ? (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>Save & Resubmit to Queue</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Work for Moderation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}

                </form>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-300 shadow-xl text-center space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700 border border-emerald-300">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="text-[11px] font-mono font-bold uppercase text-emerald-800 tracking-wider">
                    {wasResubmission ? 'Resubmission Verified' : 'Submission Enqueued'}
                  </span>
                  <h2 className="font-display font-black text-2xl text-slate-950">
                    "{submittedTitle}" Received!
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Your manuscript has been logged into the teacher & librarian moderation queue. You will receive real-time review feedback in the <span className="font-bold">My Submissions</span> portfolio tab.
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-xs py-3 px-6 rounded-xl cursor-pointer"
                  >
                    Submit Another Piece
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setActiveSubTab('my-portfolio');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 px-6 rounded-xl border border-slate-300 cursor-pointer"
                  >
                    View in My Submissions
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* TAB 2: MY SUBMISSIONS PORTFOLIO */}
        {activeSubTab === 'my-portfolio' && (
          <motion.div
            key="portfolio-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displaySubmissions.map((sub) => (
                <div 
                  key={sub.id} 
                  className="bg-white border border-slate-300 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                        {sub.category}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                        sub.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                          : sub.status === 'rejected'
                          ? 'bg-rose-50 text-rose-950 border border-rose-300 animate-pulse'
                          : 'bg-amber-50 text-amber-950 border border-amber-300'
                      }`}>
                        {sub.status === 'approved' ? '✓ Published' : sub.status === 'rejected' ? '⚠️ Revision Required' : '⏳ In Review'}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-lg text-slate-950 line-clamp-1">{sub.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-3 font-serif leading-relaxed italic">
                      "{sub.content}"
                    </p>

                    {sub.moderationFeedback && (
                      <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-950 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <MessageSquare className="w-3 h-3 text-rose-700" /> Moderator Note:
                        </span>
                        <p className="italic">"{sub.moderationFeedback}"</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-mono">{sub.createdAt}</span>
                    {sub.status === 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sub)}
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Draft
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {displaySubmissions.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8 space-y-3">
                  <PenTool className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="font-display font-black text-slate-900 text-base">No submissions found</p>
                  <p className="text-xs text-slate-500">Switch to the "Compose New" tab to submit your first creative work!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
