/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Book } from '../types';
import { 
  BookOpen, 
  TrendingUp, 
  Layers, 
  AlertCircle, 
  Plus, 
  Info, 
  Star, 
  Library, 
  Clock, 
  Check,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Printer,
  Send,
  FileText,
  User,
  Search,
  CheckCircle,
  Bookmark,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DDCClassInfo {
  id: string; // '000', '100', etc.
  name: string;
  range: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const DDC_CLASSES: DDCClassInfo[] = [
  { id: '000', name: 'Computer Science & General Information', range: '000 - 099', description: 'Systems, algorithms, data structures, and computer architectures.', color: 'text-sky-600', bgColor: 'bg-sky-50', borderColor: 'border-sky-100' },
  { id: '100', name: 'Philosophy & Psychology', range: '100 - 199', description: 'Metaphysics, classical philosophy, Socratic ethics, and human psychology.', color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-100' },
  { id: '200', name: 'Religion & Mythology', range: '200 - 299', description: 'Comparative religions, ancient mythologies, and spiritual histories.', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-100' },
  { id: '300', name: 'Social Sciences & Government', range: '300 - 399', description: 'Sociology, economics, political systems, government policy, and anthropology.', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-100' },
  { id: '400', name: 'Language & Linguistics', range: '400 - 499', description: 'English grammar rules, linguistics research, and foreign languages.', color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-100' },
  { id: '500', name: 'Pure Science & Mathematics', range: '500 - 599', description: 'Astrophysics, advanced mathematics, physics formulas, chemistry, and biology.', color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100' },
  { id: '600', name: 'Technology & Applied Science', range: '600 - 699', description: 'Applied engineering, computer networks, architecture, and tech innovations.', color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-100' },
  { id: '700', name: 'Arts, Recreation & Sports', range: '700 - 799', description: 'Art history, painting guides, architectural aesthetics, and sports history.', color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-100' },
  { id: '800', name: 'Literature, Fiction & Poetry', range: '800 - 899', description: 'Original stories, African poetry, literary classics, and modern novels.', color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-100' },
  { id: '900', name: 'History, Geography & Biography', range: '900 - 999', description: 'World history, West African empires, geography maps, and explorer biographies.', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100' }
];

export const LibraryAnalytics: React.FC = () => {
  const { books, circulation, currentRole, restockBook, currentLearnerName, checkoutBook } = useApp();
  
  // Administrative selection state
  // 'all' = Consolidated View, 'primary' = Primary School Librarian desk, 'secondary' = Secondary School Librarian desk
  const [adminSection, setAdminSection] = useState<'all' | 'primary' | 'secondary'>('all');
  
  const [selectedDdc, setSelectedDdc] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedLearnerBook, setSelectedLearnerBook] = useState<Book | null>(null);
  const [learnerSearchQuery, setLearnerSearchQuery] = useState('');
  
  // School Management Report Generator states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportLog, setReportLog] = useState<string | null>(null);

  // Filter books based on active Section (for Admins)
  const getFilteredBooksForAdmin = () => {
    if (adminSection === 'all') return books;
    if (adminSection === 'primary') {
      // Primary Section books are child-friendly categories
      return books.filter(b => 
        ['Children\'s Fiction', 'Humor / Children\'s', 'Fantasy', 'Science & Cosmos'].includes(b.category) ||
        b.deweyClass === '200' || b.deweyClass === '400'
      );
    }
    if (adminSection === 'secondary') {
      // Secondary Section books are academic/advanced categories
      return books.filter(b => 
        ['African Literature', 'Classics', 'Computer Science', 'Philosophy', 'Social Sciences', 'Technology', 'History'].includes(b.category)
      );
    }
    return books;
  };

  const adminBooks = getFilteredBooksForAdmin();

  // 1. Calculate stock indicators based on filtered books
  const totalTitles = adminBooks.length;
  const totalHoldings = adminBooks.reduce((acc, curr) => acc + curr.totalCopies, 0);
  const totalAvailable = adminBooks.reduce((acc, curr) => acc + curr.availableCopies, 0);
  const totalBorrowed = totalHoldings - totalAvailable;
  
  const totalBorrowingsAcrossHistory = adminBooks.reduce((acc, curr) => acc + curr.readsCount, 0);
  const averageReadsRate = totalTitles > 0 ? (totalBorrowingsAcrossHistory / totalTitles).toFixed(1) : '0.0';
  const stockUtilizationRate = totalHoldings > 0 ? Math.round((totalBorrowed / totalHoldings) * 100) : 0;

  // 2. Classifications groupings based on filtered books
  const ddcStats = DDC_CLASSES.map((ddc) => {
    const classBooks = adminBooks.filter((b) => b.deweyClass === ddc.id);
    const uniqueTitles = classBooks.length;
    const totalStock = classBooks.reduce((acc, curr) => acc + curr.totalCopies, 0);
    const availStock = classBooks.reduce((acc, curr) => acc + curr.availableCopies, 0);
    const borrowedStock = totalStock - availStock;
    const totalReads = classBooks.reduce((acc, curr) => acc + curr.readsCount, 0);

    return {
      ...ddc,
      uniqueTitles,
      totalStock,
      availStock,
      borrowedStock,
      totalReads
    };
  });

  // Most popular category (the class with the highest total reads)
  const sortedByPopularity = [...ddcStats].sort((a, b) => b.totalReads - a.totalReads);
  const mostPopularClass = sortedByPopularity[0]?.totalReads > 0 ? sortedByPopularity[0] : null;

  // Neglected categories for management report (readsCount under average and has books)
  const neglectedClasses = ddcStats
    .filter(c => c.uniqueTitles > 0 && c.totalReads < (totalBorrowingsAcrossHistory / 10))
    .sort((a, b) => a.totalReads - b.totalReads);

  // 3. Most borrowed books list (Top 5 with at least 1 read)
  const topBorrowedBooks = [...books]
    .filter(b => b.readsCount > 0)
    .sort((a, b) => b.readsCount - a.readsCount)
    .slice(0, 5);

  // 4. Low stock/alert books for selected section
  const lowStockBooks = adminBooks.filter((b) => b.availableCopies <= 1);

  const handleRestock = (id: string, title: string) => {
    restockBook(id, 5);
    triggerNotification('success', `Successfully replenished +5 physical copies for "${title}"!`);
  };

  const handleBorrowFromAnalytics = (book: Book) => {
    const res = checkoutBook(book.id, currentLearnerName);
    if (res.success) {
      triggerNotification('success', res.message);
      setSelectedLearnerBook(null);
    } else {
      triggerNotification('error', res.message);
    }
  };

  const triggerNotification = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const dispatchReport = (destination: 'Teachers' | 'Management') => {
    setReportLog(`Compiling and dispatching Library Utilization Report to ${destination} Room...`);
    setTimeout(() => {
      setReportLog(null);
      triggerNotification('success', `Official DDC report successfully emailed and synced to the ${destination} dashboard!`);
    }, 2000);
  };

  // Filter learner picks
  const filteredLearnerBooks = books.filter(b => 
    b.title.toLowerCase().includes(learnerSearchQuery.toLowerCase()) ||
    b.author.toLowerCase().includes(learnerSearchQuery.toLowerCase()) ||
    b.category.toLowerCase().includes(learnerSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* 1. LIBRARIAN / ADMIN MODE */}
      {/* ========================================================================= */}
      {currentRole === 'librarian' && (
        <div className="space-y-8">
          
          {/* Header Banner for Librarians */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white border border-indigo-800/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                  <ShieldAlert className="w-3.5 h-3.5 fill-indigo-400/20 text-indigo-400" /> Administrative Authority Portal
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Librarian Intel & School Management Reports
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  Analyze library usage metrics by academic departments, locate neglected subjects, generate reports for class teachers, and replenish critical book stock.
                </p>
              </div>

              {/* Librarian Section Desks Switcher */}
              <div className="bg-slate-850/90 p-1 rounded-xl border border-slate-700/60 flex flex-wrap gap-1">
                <button
                  onClick={() => setAdminSection('all')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                    adminSection === 'all' 
                      ? 'bg-amber-400 text-slate-950 shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  All Sections (Combined)
                </button>
                <button
                  onClick={() => setAdminSection('primary')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                    adminSection === 'primary' 
                      ? 'bg-amber-400 text-slate-950 shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Primary Librarian Desk
                </button>
                <button
                  onClick={() => setAdminSection('secondary')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold font-sans transition-all cursor-pointer ${
                    adminSection === 'secondary' 
                      ? 'bg-amber-400 text-slate-950 shadow-sm' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  Secondary Librarian Desk
                </button>
              </div>
            </div>
          </div>

          {/* Toast notifications */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <p>{successMsg}</p>
              </motion.div>
            )}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <p>{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key Stock Performance Indicators Row */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Catalogs Active</span>
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-slate-900">{totalTitles}</p>
              </div>
              <span className="text-[10px] text-slate-400 pt-2 block border-t border-slate-50 uppercase font-bold font-mono">
                {adminSection === 'all' ? 'Combined holdings' : `${adminSection} Section`}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Lent vs Total Volumes</span>
                  <Layers className="w-4 h-4 text-violet-600" />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-slate-900">{totalHoldings}</p>
              </div>
              <span className="text-[10px] text-slate-400 pt-2 block border-t border-slate-50 font-mono">
                {totalAvailable} available • {totalBorrowed} lent
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Active Utilization</span>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-display font-black text-slate-900">{stockUtilizationRate}%</p>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Optimal</span>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 pt-2 block border-t border-slate-50 font-mono">
                Lending rate relative to catalog capacity
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-sans">Avg Reads Frequency</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-100" />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-black text-slate-900">{averageReadsRate}</p>
              </div>
              <span className="text-[10px] text-slate-400 pt-2 block border-t border-slate-50 font-mono">
                Total borrowings / total catalog count
              </span>
            </div>
          </section>

          {/* Interactive School Management & Teachers Report Generator Card */}
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-3xl p-6 space-y-6 shadow-3xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-amber-950 font-sans text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    School Management Module
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-500">• Section Intelligence</span>
                </div>
                <h3 className="text-lg font-display font-bold text-slate-900">
                  Curriculum Alignment & Neglected Asset Report
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  Librarians can export specialized reports identifying library disciplines with critically low student engagement. 
                  Provide teachers with customized, category-specific assignments to revive student research and drive active book usage!
                </p>
              </div>

              <button
                onClick={() => setIsReportOpen(!isReportOpen)}
                className="px-5 py-2.5 bg-indigo-950 text-white hover:bg-indigo-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shrink-0"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                {isReportOpen ? 'Collapse Report Module' : 'Generate Administrative Report'}
              </button>
            </div>

            {/* Expandable detailed report panel */}
            <AnimatePresence>
              {isReportOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-6">
                    
                    {/* Report Meta Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h4 className="font-display font-black text-sm uppercase text-indigo-950">
                          Official Library Utilization Report: {adminSection === 'all' ? 'Consolidated School' : `${adminSection.toUpperCase()} Section`}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono">Compiled on: 2026-07-02 • Ready for Management Review</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Live Data Compiled
                        </span>
                      </div>
                    </div>

                    {/* Report Sections Block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left Block: Critical Neglected Areas Analysis */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-extrabold uppercase text-rose-600 tracking-wider flex items-center gap-1.5 font-mono">
                          <AlertCircle className="w-4 h-4" /> 1. Neglected Subject Categories
                        </span>
                        
                        <p className="text-xs text-slate-500">
                          The following Dewey Decimal categories represent under-utilized resources in the current school term:
                        </p>

                        <div className="space-y-3.5">
                          {neglectedClasses.length === 0 ? (
                            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                              No underutilized categories detected. All library assets are evenly circulated!
                            </div>
                          ) : (
                            neglectedClasses.map((item) => (
                              <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${item.bgColor} ${item.color}`}>
                                      DDC {item.range}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 italic">{item.name}</span>
                                  </div>
                                  <span className="block text-[10px] text-slate-400">
                                    Active books: {item.uniqueTitles} titles • Copies in house: {item.totalStock} copies
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span className="text-xs font-black text-rose-600 font-mono block">{item.totalReads} reads</span>
                                  <span className="text-[8px] uppercase font-bold text-slate-400 font-sans">Critically Low</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right Block: Suggested Teacher Assignments */}
                      <div className="space-y-4">
                        <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 font-mono">
                          <GraduationCap className="w-4 h-4" /> 2. Actionable Classroom Assignments
                        </span>
                        
                        <p className="text-xs text-slate-500">
                          Teachers can issue these specific, catalog-backed study assignments to boost student inquiry in neglected sections:
                        </p>

                        <div className="space-y-3">
                          {neglectedClasses.length === 0 ? (
                            <p className="text-xs text-slate-400 italic">No curriculum interventions needed presently.</p>
                          ) : (
                            neglectedClasses.map((item) => {
                              let assignmentText = "";
                              if (item.id === '000') {
                                assignmentText = "Have students check out introductory algorithm manuals (e.g., 'Introduction to Algorithms') and sketch a step-by-step logic flowchart for a morning routine.";
                              } else if (item.id === '100') {
                                assignmentText = "Assign senior students to borrow classical dialogues (Plato's 'The Republic') and summarize the 'Allegory of the Cave' in relation to modern media biases.";
                              } else if (item.id === '300') {
                                assignmentText = "Issue a micro-economics project requiring students to use classical economics treaties to analyze supply-demand changes in their school store.";
                              } else if (item.id === '600') {
                                assignmentText = "Have junior science students research an applied engineering prototype using tech books and build a cardboard physical model.";
                              } else if (item.id === '900') {
                                assignmentText = "Instruct students to write an historical profile of a pre-colonial African kingdom (e.g. Songhai or Benin Empire) using regional history texts.";
                              } else {
                                assignmentText = `Incorporate library texts from Class ${item.range} in a weekly reading journal review with mandatory catalog citations.`;
                              }

                              return (
                                <div key={item.id} className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-xl space-y-1.5 text-xs">
                                  <span className="font-bold text-indigo-950 font-sans block">For {item.name}:</span>
                                  <p className="text-slate-600 italic leading-relaxed text-[11px]">
                                    "{assignmentText}"
                                  </p>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Report logs */}
                    {reportLog && (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-2 font-mono">
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>{reportLog}</span>
                      </div>
                    )}

                    {/* Report Footer Dispatch Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => window.print()}
                        className="w-full sm:w-auto px-4 py-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <Printer className="w-4 h-4" />
                        Print Hard Copy
                      </button>

                      <button
                        onClick={() => dispatchReport('Teachers')}
                        className="w-full sm:w-auto px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <Send className="w-4 h-4" />
                        Send Report to Teachers Lounge
                      </button>

                      <button
                        onClick={() => dispatchReport('Management')}
                        className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition"
                      >
                        <Send className="w-4 h-4 text-amber-400" />
                        Dispatch to School Management Board
                      </button>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Grid: Left Column (DDC Classification Explorer) • Right Column (Most Popular & Stock Alerts) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Dewey Decimal Classification Explorer */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <Library className="w-5 h-5 text-indigo-900" />
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      DDC 000 - 900 Subjects Classification Explorer
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                    Holdings Auditor
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  These classifications represent how your school's books are physically and systematically arranged. 
                  <span className="font-bold text-slate-700"> Click on any classification range</span> to expand and view the physical volumes, specific codes, circulation status, and restocking controls.
                </p>

                {/* DDC list */}
                <div className="space-y-3 pt-2">
                  {ddcStats.map((ddc) => {
                    const isExpanded = selectedDdc === ddc.id;
                    const percentHolding = totalHoldings > 0 ? Math.round((ddc.totalStock / totalHoldings) * 100) : 0;
                    const classBooks = adminBooks.filter((b) => b.deweyClass === ddc.id);

                    return (
                      <div 
                        key={ddc.id}
                        className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                          isExpanded 
                            ? 'border-indigo-200 bg-slate-50/40 shadow-xs' 
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/20'
                        }`}
                      >
                        {/* Header bar of DDC Class */}
                        <button
                          onClick={() => setSelectedDdc(isExpanded ? null : ddc.id)}
                          className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between text-left gap-3 cursor-pointer"
                        >
                          <div className="flex items-start gap-3.5">
                            <span className={`px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-extrabold ${ddc.bgColor} ${ddc.color} border ${ddc.borderColor} shrink-0`}>
                              Class {ddc.range}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 font-display line-clamp-1">{ddc.name}</h4>
                              <span className="text-[10px] text-slate-400 line-clamp-1">{ddc.description}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                            {/* Short Stats */}
                            <div className="grid grid-cols-3 gap-4 text-center sm:text-right font-mono">
                              <div>
                                <span className="block text-[8px] text-slate-400 uppercase font-sans font-bold">Titles</span>
                                <span className="text-xs font-bold text-slate-700">{ddc.uniqueTitles}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-slate-400 uppercase font-sans font-bold">Stock</span>
                                <span className="text-xs font-bold text-slate-700">{ddc.totalStock}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] text-slate-400 uppercase font-sans font-bold">Reads</span>
                                <span className="text-xs font-bold text-indigo-900">{ddc.totalReads}</span>
                              </div>
                            </div>

                            {/* Chevron Icon */}
                            <div className="text-slate-400 bg-slate-100/50 p-1.5 rounded-lg">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </button>

                        {/* Expandable book shelf panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-slate-100 bg-white"
                            >
                              <div className="p-4 space-y-4">
                                
                                {/* Distribution indicator inside the drawer */}
                                <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 text-[10px] flex flex-col sm:flex-row items-center justify-between gap-3">
                                  <span className="text-slate-500 text-center sm:text-left">
                                    This subject represents <strong className="text-slate-700">{percentHolding}%</strong> of currently filtered school library physical copies.
                                  </span>
                                  
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase font-sans">Stock utilization</span>
                                    <span className="font-mono font-bold text-slate-700">
                                      {ddc.totalStock - ddc.availStock} / {ddc.totalStock} borrowed
                                    </span>
                                  </div>
                                </div>

                                {/* Books table */}
                                {classBooks.length === 0 ? (
                                  <div className="py-6 text-center text-slate-400 space-y-2">
                                    <Info className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
                                    <p className="text-xs">No books are cataloged under this Dewey range yet in this school section.</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-slate-50/70 border-b border-slate-100 text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                                        <tr>
                                          <th className="py-2 px-3">DDC Code</th>
                                          <th className="py-2 px-3">Book Title / Author</th>
                                          <th className="py-2 px-3">ISBN</th>
                                          <th className="py-2 px-3 text-center">Circulation Reads</th>
                                          <th className="py-2 px-3 text-right">Available / Total Copies</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {classBooks.map((book) => {
                                          const isLow = book.availableCopies <= 1;
                                          return (
                                            <tr key={book.id} className="hover:bg-slate-50/40">
                                              <td className="py-3 px-3 font-mono font-bold text-slate-500">
                                                {book.deweyCode}
                                              </td>
                                              <td className="py-3 px-3">
                                                <div>
                                                  <p className="font-bold text-slate-800 italic">{book.title}</p>
                                                  <p className="text-[10px] text-slate-400 font-medium">by {book.author}</p>
                                                </div>
                                              </td>
                                              <td className="py-3 px-3 font-mono text-[10px] text-slate-400">
                                                {book.isbn}
                                              </td>
                                              <td className="py-3 px-3 text-center font-bold text-indigo-950 font-mono">
                                                {book.readsCount}
                                              </td>
                                              <td className="py-3 px-3 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                  <span className={`font-mono font-extrabold text-[11px] ${isLow ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {book.availableCopies} <span className="text-slate-300">/</span> {book.totalCopies}
                                                  </span>
                                                  
                                                  {/* Tiny Progress bar */}
                                                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                      className={`h-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                                      style={{ width: `${(book.availableCopies / book.totalCopies) * 100}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

            {/* Right Column: Most Popular & Alerts */}
            <div className="space-y-6">
              
              {/* Highlight Card */}
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/20 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full font-mono">
                  <Star className="w-3 h-3 fill-amber-300" /> HOT SUBJECT AREA
                </span>
                
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200 block">Peak Borrowing Category</span>
                  <h4 className="text-lg font-display font-black leading-tight text-white">
                    {mostPopularClass ? mostPopularClass.name : 'Awaiting Lending Activity'}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs font-mono">
                  <div>
                    <span className="block text-[9px] text-indigo-300 uppercase font-sans font-bold">Total Reads</span>
                    <span className="text-base font-black text-amber-300">{mostPopularClass ? `${mostPopularClass.totalReads} lendings` : '0 lendings'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-indigo-300 uppercase font-sans font-bold">DDC Code Range</span>
                    <span className="text-base font-black text-white">{mostPopularClass ? mostPopularClass.range : '—'}</span>
                  </div>
                </div>
                
                <p className="text-[11px] text-indigo-200 leading-relaxed italic">
                  {mostPopularClass 
                    ? 'Engagement is peak in this area. Encourage classroom teachers to reward diverse subject readings!'
                    : 'Class-level borrowing trends will appear here as books are issued to learners.'}
                </p>
              </div>

              {/* Top 5 books list (Visible to admins too for parity) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                      Top 5 Most Borrowed Books
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {topBorrowedBooks.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No borrowings recorded yet. Statistics update live as books are checked out.
                    </div>
                  ) : (
                    topBorrowedBooks.map((book, idx) => {
                      const colorMap = [
                        'bg-amber-400 text-amber-950 border-amber-500', 
                        'bg-slate-300 text-slate-800 border-slate-400',  
                        'bg-amber-700 text-white border-amber-800',      
                        'bg-slate-100 text-slate-600 border-slate-200',  
                        'bg-slate-100 text-slate-600 border-slate-200',  
                      ];

                      return (
                        <div key={book.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/50 border border-slate-50 transition-all text-xs">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border font-mono shrink-0 ${colorMap[idx]}`}>
                              #{idx + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-800 line-clamp-1 italic">{book.title}</h4>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                                <span>DDC: {book.deweyCode}</span>
                                <span>•</span>
                                <span>{book.author}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-extrabold text-indigo-950 block">{book.readsCount} reads</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Replenishment Alert Panel */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                      Replenishment Alerts ({lowStockBooks.length})
                    </h3>
                  </div>
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded uppercase font-mono animate-pulse">
                    Urgent
                  </span>
                </div>

                {lowStockBooks.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    All books in this school section are fully in-stock with sufficient copies!
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-64 overflow-y-auto scrollbar-none">
                    {lowStockBooks.map((book) => {
                      return (
                        <div key={book.id} className="p-3 bg-rose-50/30 hover:bg-rose-50/60 rounded-xl border border-rose-100/50 flex flex-col justify-between gap-3 text-xs transition">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-bold text-slate-800 italic leading-tight line-clamp-1">{book.title}</h4>
                              <span className="text-[10px] text-slate-400 font-mono">
                                DDC Code: {book.deweyCode} • Copies Left: <strong className="text-rose-600">{book.availableCopies}</strong>
                              </span>
                            </div>
                            <span className="text-[9px] uppercase font-bold text-rose-500 shrink-0">
                              {book.availableCopies === 0 ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          </div>

                          <button
                            onClick={() => handleRestock(book.id, book.title)}
                            className="w-full py-1.5 px-3 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Replenish Stock (+5 Copies)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LEARNER / STUDENT / CHILD MODE */}
      {/* ========================================================================= */}
      {currentRole === 'learner' && (
        <div className="space-y-8">
          
          {/* Learner Recommendations Header */}
          <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-blue-300 border border-white/10 px-3 py-1 rounded-full text-xs font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Student Reading Activity
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Reading Trends and Recommended Books
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed font-normal">
                Discover popular titles borrowed across school classrooms and explore available reading materials.
              </p>
            </div>
          </div>

          {/* Toast Notification for Borrowing action */}
          <AnimatePresence>
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
              >
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <p>{successMsg}</p>
              </motion.div>
            )}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-xs"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <p>{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section 1: The Top 5 Most Borrowed Books Podium / List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="font-display font-black text-sm uppercase text-slate-800 tracking-tight">
                  The Top 5 Library Favorites (Loved by Peers!)
                </h3>
              </div>
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                Student Choice Awards
              </span>
            </div>

            {/* Layout Grid: Podium-style presentation */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {topBorrowedBooks.map((book, idx) => {
                const isGold = idx === 0;
                const isSilver = idx === 1;
                const isBronze = idx === 2;
                
                const medalBg = isGold 
                  ? 'bg-amber-400 text-amber-950 border-amber-300' 
                  : isSilver 
                    ? 'bg-slate-200 text-slate-800 border-slate-100' 
                    : isBronze 
                      ? 'bg-amber-700 text-amber-50 border-amber-600' 
                      : 'bg-indigo-50 text-indigo-800 border-indigo-100';

                return (
                  <motion.div 
                    key={book.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    onClick={() => setSelectedLearnerBook(book)}
                    className={`p-5 rounded-2xl border flex flex-col justify-between text-center cursor-pointer transition-all ${
                      isGold 
                        ? 'border-amber-200 bg-amber-50/20 ring-4 ring-amber-400/10' 
                        : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Badge and ranking */}
                      <div className="mx-auto flex items-center justify-center">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase font-mono border ${medalBg}`}>
                          Rank #{idx + 1}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-display font-bold text-xs text-slate-800 italic leading-tight line-clamp-2">
                          {book.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium">by {book.author}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100/60 mt-4 space-y-2">
                      <span className="text-[10px] font-mono font-extrabold text-indigo-950 block">
                        Borrowed {book.readsCount} times!
                      </span>

                      <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {book.category}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Explore Live Library Book Stocks & Pick Choice */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Library className="w-5 h-5 text-indigo-950" />
                  <h3 className="font-display font-black text-sm uppercase text-slate-800 tracking-tight">
                    Pick a Book & Make Your Choice Presently
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Search through all active books currently cataloged in the library, see their exact physical copies count, and select to read immediately.
                </p>
              </div>

              {/* Real-time Filter Search box */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, author or category..."
                  value={learnerSearchQuery}
                  onChange={(e) => setLearnerSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            {/* List and Grid Choice Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLearnerBooks.length === 0 ? (
                <div className="sm:col-span-3 py-12 text-center text-slate-400 space-y-2">
                  <Info className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs">No books match your search query. Try another keyword!</p>
                </div>
              ) : (
                filteredLearnerBooks.map((book) => {
                  const isAvailable = book.availableCopies > 0;
                  return (
                    <div 
                      key={book.id} 
                      className={`p-4 border rounded-2xl flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-2xs ${
                        isAvailable 
                          ? 'border-slate-100 bg-white hover:border-indigo-100' 
                          : 'border-slate-100 bg-slate-50/50 opacity-80'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="bg-indigo-50 text-indigo-800 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">
                            {book.category}
                          </span>
                          
                          <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                            isAvailable 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {isAvailable ? `${book.availableCopies} Copies Available` : 'All Out'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-display font-bold text-xs text-slate-800 italic line-clamp-1">{book.title}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">by {book.author}</p>
                        </div>

                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                          {book.description}
                        </p>
                      </div>

                      {/* Pick Choice Button */}
                      <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                        <span className="text-[9px] text-slate-400 font-mono">DDC Code: {book.deweyCode}</span>
                        
                        <button
                          onClick={() => {
                            if (isAvailable) {
                              handleBorrowFromAnalytics(book);
                            } else {
                              triggerNotification('error', `"${book.title}" is currently unavailable. Librarians are notified!`);
                            }
                          }}
                          disabled={!isAvailable}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            isAvailable 
                              ? 'bg-indigo-900 hover:bg-indigo-800 text-white shadow-3xs' 
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Bookmark className="w-3 h-3 fill-current" />
                          {isAvailable ? 'Pick Book' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive Pop-Up Modal for Detail Choice */}
          <AnimatePresence>
            {selectedLearnerBook && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-xl space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <span className="bg-indigo-50 text-indigo-800 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase">
                      {selectedLearnerBook.category}
                    </span>
                    <button 
                      onClick={() => setSelectedLearnerBook(null)}
                      className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"
                    >
                      <ChevronDown className="w-4 h-4 rotate-90" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-black text-base text-slate-900 italic">
                      {selectedLearnerBook.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold">Written by {selectedLearnerBook.author}</p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3.5 rounded-xl border border-slate-100/60">
                    "{selectedLearnerBook.description}"
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider font-sans">Dewey Classification</span>
                      <span className="text-slate-800 font-bold">Class {selectedLearnerBook.deweyClass} / {selectedLearnerBook.deweyCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px] tracking-wider font-sans">Availability Status</span>
                      <span className={`font-bold ${selectedLearnerBook.availableCopies > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedLearnerBook.availableCopies} / {selectedLearnerBook.totalCopies} copies in house
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedLearnerBook(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Close Synopsis
                    </button>
                    <button
                      onClick={() => handleBorrowFromAnalytics(selectedLearnerBook)}
                      disabled={selectedLearnerBook.availableCopies <= 0}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedLearnerBook.availableCopies > 0
                          ? 'bg-indigo-900 hover:bg-indigo-800 text-white shadow-md'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                      Make Choice
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

    </div>
  );
};
