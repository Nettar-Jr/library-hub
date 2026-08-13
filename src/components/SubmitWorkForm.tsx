/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SubmissionCategory } from '../types';
import { FileUp, Image as ImageIcon, Send, Sparkles, CheckCircle, HelpCircle, ArrowRight, BookOpen, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SubmitWorkForm: React.FC = () => {
  const { addSubmission, currentLearnerName, currentRole, setActiveTab } = useApp();
  
  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SubmissionCategory>('short-story');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Drag and drop / file selection mock
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  
  // Success states
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Curated educational Unsplash presets for student cover images/art
  const imagePresets = [
    { name: 'Cosmic Nebula', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400' },
    { name: 'Classical Library', url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=400' },
    { name: 'Creative Abstract', url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400' },
    { name: 'Nature Forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400' },
  ];

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
      const file = e.dataTransfer.files[0];
      const sizeKB = Math.round(file.size / 1024);
      setUploadedFile({
        name: file.name,
        size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeKB = Math.round(file.size / 1024);
      setUploadedFile({
        name: file.name,
        size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addSubmission(title, category, content, imageUrl || undefined);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setTitle('');
    setCategory('short-story');
    setContent('');
    setImageUrl('');
    setUploadedFile(null);
    setIsSubmitted(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.div
            key="submission-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xl space-y-8"
          >
            {/* Header */}
            <div className="space-y-2">
              <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Moderated Student Publishing
              </span>
              <h2 className="font-display font-black text-3xl text-slate-900 tracking-tight">
                Submit Your Creative Work
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Publish short stories, poetry collections, academic reviews, or digital artwork. 
                <span className="font-bold text-slate-800"> Note: All submissions undergo verification by Librarian Alabi before being published.</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              
              {/* Profile Details (Readonly mockup) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Author Identity</span>
                  <span className="font-display font-extrabold text-sm text-slate-800">{currentLearnerName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Moderator Review Queue</span>
                  <span className="font-sans font-bold text-slate-600 flex items-center gap-1">
                    Librarian Alabi (Staff Access Required)
                  </span>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title of Work</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Whispers of the Savannah"
                    className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Genre</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SubmissionCategory)}
                    className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="short-story">Short Story</option>
                    <option value="poetry">Poetry Collection</option>
                    <option value="academic-essay">Academic Essay</option>
                    <option value="digital-art">Digital Artwork</option>
                  </select>
                </div>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Compose Your Masterpiece / Description</label>
                <textarea
                  required
                  rows={8}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type or paste your short story, poem lines, or digital art narrative descriptions here..."
                  className="w-full text-xs p-3.5 border border-slate-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-serif leading-relaxed"
                />
              </div>

              {/* Cover presets or Art image URL selection */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Add Digital Cover Image / Artwork Asset
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Optional</span>
                </div>
                
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste a direct image URL (https://...) or choose a preset below"
                  className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-3 font-mono"
                />

                {/* Preset Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {imagePresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setImageUrl(preset.url)}
                      className={`text-[10px] p-2 border rounded-xl text-center transition flex flex-col items-center gap-1.5 ${
                        imageUrl === preset.url
                          ? 'border-indigo-900 bg-indigo-50/50 text-indigo-900 font-bold'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-10 h-10 rounded-md object-cover shadow-2xs" />
                      <span className="truncate w-full">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive File Drag and Drop */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Simulated File Attachments (PDF / DOCX / JPG)
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
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : 'border-slate-200 hover:bg-slate-50'
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
                    <FileUp className={`w-8 h-8 mx-auto ${uploadedFile ? 'text-emerald-500' : 'text-slate-400'}`} />
                    
                    {uploadedFile ? (
                      <div className="space-y-1">
                        <p className="font-bold text-emerald-800 text-xs">Attached: {uploadedFile.name}</p>
                        <p className="text-[10px] text-slate-400">File size: {uploadedFile.size} • Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-700 text-xs">Drag and drop your document here</p>
                        <p className="text-[10px] text-slate-400">or click to browse local files (max 10MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Actions */}
              <button
                type="submit"
                className="w-full bg-indigo-900 text-white font-sans font-bold py-3 px-6 rounded-xl text-sm hover:bg-indigo-800 transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Submit and File for Moderation
              </button>

            </form>
          </motion.div>
        ) : (
          <motion.div
            key="submission-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl text-center space-y-6"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-display font-black text-2xl text-slate-900">Submission Received!</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your piece <span className="font-bold text-slate-800">"{title}"</span> has been queued for review in the school's Integrated Library Automation System.
              </p>
            </div>

            {/* Presentation instructions for live demo */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left space-y-3 max-w-lg mx-auto">
              <h4 className="font-display font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                Live Demo presentation Instruction:
              </h4>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                To demonstrate the administrative moderation workflow in your presentation, click the 
                <span className="font-bold"> "Switch to Librarian ILAS"</span> button in the top black sandbox bar. 
                You will see your submitted draft instantly populate the moderation queue waiting to be approved!
              </p>
              
              <div className="flex items-center gap-2 text-[10px] text-amber-700 font-bold bg-white/60 p-2.5 rounded-lg">
                <span>Next action:</span>
                <ArrowRight className="w-3.5 h-3.5 animate-bounce-horizontal" />
                <span>Toggle Role to Librarian and check the "Moderation" tab!</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Write Another Piece
              </button>
              
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('gallery');
                }}
                className="px-5 py-2.5 bg-indigo-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-800 cursor-pointer"
              >
                Browse Gallery
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
