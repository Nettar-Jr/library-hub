/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CirculationRecord } from '../types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  Calendar, 
  User, 
  Search, 
  BookOpen, 
  UserPlus, 
  ListCollapse, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Check,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  Rows,
  RefreshCw,
  Mail,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerBorrowCelebration } from '../utils/confetti';

const ITEMS_PER_PAGE = 8;

export const CirculationTracker: React.FC = () => {
  const { circulation, books, returnBook, sendOverdueAlert, checkoutBook } = useApp();
  
  // Local States
  const [filter, setFilter] = useState<'all' | 'borrowed' | 'overdue' | 'returned'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'dueDate' | 'learner' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [viewStyle, setViewStyle] = useState<'cards' | 'table'>('cards');
  
  // Checkout Form states
  const [selectedBookId, setSelectedBookId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('Year 9');
  const [loanDuration, setLoanDuration] = useState(14);

  // Status message
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !studentName.trim()) return;

    const fullName = `${studentName.trim()} (${grade})`;
    const res = checkoutBook(selectedBookId, fullName, loanDuration);
    
    if (res.success) {
      triggerBorrowCelebration();
      setMsg({ type: 'success', text: `🎉 ${res.message}` });
      setSelectedBookId('');
      setStudentName('');
      setTimeout(() => setMsg(null), 5000);
      setShowCheckoutForm(false);
    } else {
      setMsg({ type: 'error', text: res.message });
      setTimeout(() => setMsg(null), 5000);
    }
  };

  const handleReturn = (recordId: string, bookId: string) => {
    returnBook(recordId, bookId);
    triggerBorrowCelebration();
    setMsg({ type: 'success', text: 'Book returned and checked back into inventory!' });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleAlert = (recordId: string, learnerName: string) => {
    sendOverdueAlert(recordId);
    setMsg({ type: 'success', text: `Overdue reminder notification dispatched to ${learnerName}!` });
    setTimeout(() => setMsg(null), 4000);
  };

  // Filter & Sort list
  const filteredRecords = useMemo(() => {
    const list = circulation.filter((rec) => {
      const matchesSearch =
        rec.learnerName.toLowerCase().includes(search.toLowerCase()) ||
        rec.bookTitle.toLowerCase().includes(search.toLowerCase()) ||
        rec.id.toLowerCase().includes(search.toLowerCase());
      
      if (filter === 'all') return matchesSearch;
      return rec.status === filter && matchesSearch;
    });

    list.sort((a, b) => {
      if (sortBy === 'learner') {
        return sortOrder === 'asc' 
          ? a.learnerName.localeCompare(b.learnerName) 
          : b.learnerName.localeCompare(a.learnerName);
      }
      if (sortBy === 'title') {
        return sortOrder === 'asc' 
          ? a.bookTitle.localeCompare(b.bookTitle) 
          : b.bookTitle.localeCompare(a.bookTitle);
      }
      // default: dueDate
      return sortOrder === 'asc'
        ? new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        : new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });

    return list;
  }, [circulation, filter, search, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Calculate high-level metrics
  const totalCirculated = circulation.length;
  const totalBorrowed = circulation.filter((r) => r.status === 'borrowed').length;
  const totalOverdue = circulation.filter((r) => r.status === 'overdue').length;
  const totalReturned = circulation.filter((r) => r.status === 'returned').length;

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-teal-100 text-teal-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
              Circulation Desk
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {totalBorrowed} Active Borrowers
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
            Book Loans & Circulation Status
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Visual status cards, 14-day countdown trackers, and instantaneous return check-ins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white p-1 rounded-full border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setViewStyle('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                viewStyle === 'cards' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Status Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                viewStyle === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Rows className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCheckoutForm(!showCheckoutForm)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            {showCheckoutForm ? <ListCollapse className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{showCheckoutForm ? 'Close' : 'Log Loan'}</span>
          </button>
        </div>
      </div>

      {/* Gamified Metric Cards (GetEpic Clean Aesthetic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 block">Total Volume</span>
            <span className="text-2xl sm:text-3xl font-display font-black tracking-tight text-slate-900">{totalCirculated}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-blue-600 block">Active Loans</span>
            <span className="text-2xl sm:text-3xl font-display font-black tracking-tight text-blue-900">{totalBorrowed}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 block">Overdue Loans</span>
            <span className={`text-2xl sm:text-3xl font-display font-black tracking-tight ${totalOverdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {totalOverdue}
            </span>
          </div>
          <div className={`p-3 rounded-2xl ${totalOverdue > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600 block">Returned On Time</span>
            <span className="text-2xl sm:text-3xl font-display font-black tracking-tight text-emerald-900">{totalReturned}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Manual Checkout Form */}
      <AnimatePresence>
        {showCheckoutForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCheckoutSubmit}
            className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-lg space-y-4 overflow-hidden"
          >
            <div className="border-b border-slate-100 pb-3">
              <h2 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" /> Assign a New Physical Book Loan
              </h2>
              <p className="text-xs text-slate-500">Select a catalog title and specify the patron information.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="checkout-book-select" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Catalog Book
                </label>
                <select
                  id="checkout-book-select"
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full text-xs border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
                >
                  <option value="">-- Choose Book --</option>
                  {books.map((b) => (
                    <option key={b.id} value={b.id} disabled={b.availableCopies <= 0}>
                      {b.title} ({b.availableCopies}/{b.totalCopies} left)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="checkout-student-name" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Learner Full Name
                </label>
                <input
                  id="checkout-student-name"
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alabi Mumuni"
                  className="w-full text-xs border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="checkout-grade" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Grade / Year
                  </label>
                  <select
                    id="checkout-grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
                  >
                    <option value="Year 11">Year 11</option>
                    <option value="Year 10">Year 10</option>
                    <option value="Year 9">Year 9</option>
                    <option value="Year 8">Year 8</option>
                    <option value="Primary 5">Primary 5</option>
                    <option value="Primary 4">Primary 4</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="checkout-duration" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <select
                    id="checkout-duration"
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(parseInt(e.target.value))}
                    className="w-full text-xs border border-slate-300 bg-slate-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-800"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCheckoutForm(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-full border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full text-xs cursor-pointer shadow-md shadow-blue-500/20"
              >
                Assign Loan
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Real-time notification banners */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl border text-xs font-bold ${
              msg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search borrowings by student, book title, or loan ID..."
            className="w-full text-xs bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-medium"
            aria-label="Search loan records"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {(['all', 'borrowed', 'overdue', 'returned'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setFilter(opt);
                setCurrentPage(1);
              }}
              className={`text-xs px-3.5 py-1.5 rounded-full font-bold transition capitalize cursor-pointer whitespace-nowrap ${
                filter === opt
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {opt === 'all' ? 'All Loans' : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Status Cards View (The GetEpic Model) */}
      {viewStyle === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedRecords.map((record) => {
            const isOverdue = record.status === 'overdue';
            const isReturned = record.status === 'returned';
            const matchedBook = books.find(b => b.id === record.bookId);

            // Calculate progress of loan (14 day baseline)
            const borrowTime = new Date(record.borrowDate).getTime();
            const dueTime = new Date(record.dueDate).getTime();
            const nowTime = new Date().getTime();
            const totalDuration = Math.max(1, dueTime - borrowTime);
            const elapsed = Math.min(totalDuration, Math.max(0, nowTime - borrowTime));
            const progressPercent = isReturned ? 100 : Math.round((elapsed / totalDuration) * 100);

            return (
              <motion.div
                key={record.id}
                layout
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Book & Patron Info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-14 h-20 rounded-xl overflow-hidden bg-slate-800 shrink-0 shadow-sm border border-slate-100">
                    <img
                      src={matchedBook?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=700'}
                      alt={record.bookTitle}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {record.id}
                      </span>
                      {isReturned ? (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Returned
                        </span>
                      ) : isOverdue ? (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <AlertCircle className="w-3 h-3 text-rose-600" /> Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-600" /> Active Loan
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-extrabold text-sm text-slate-900 truncate" title={record.bookTitle}>
                      {record.bookTitle}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mt-1">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate">{record.learnerName}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Dates */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Borrowed: {record.borrowDate}</span>
                    <span className={isOverdue ? 'text-rose-600 font-black' : 'text-slate-700'}>
                      Due: {record.dueDate}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isReturned
                          ? 'bg-emerald-500'
                          : isOverdue
                          ? 'bg-rose-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {!isReturned ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReturn(record.id, record.bookId)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Check In</span>
                      </button>

                      {isOverdue && (
                        <button
                          type="button"
                          onClick={() => handleAlert(record.id, record.learnerName)}
                          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-full text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Dispatch email overdue reminder"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Alert</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full text-center py-1.5 text-xs text-slate-400 font-bold bg-slate-50 rounded-full">
                      ✓ Completed on {record.returnDate || 'record'}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {paginatedRecords.length === 0 && (
            <div className="col-span-full py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-center space-y-2">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-display font-black text-slate-800">No circulation records found</p>
              <p className="text-xs text-slate-500">
                {circulation.length === 0 
                  ? 'All hardcoded records removed. Loans will appear here when students or staff borrow titles.'
                  : 'Try adjusting your search keywords or filter tab.'}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Classic Table View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200 text-[10px] tracking-wider font-mono">
                <tr>
                  <th scope="col" className="p-4">Student Learner</th>
                  <th scope="col" className="p-4">Assigned Book</th>
                  <th scope="col" className="p-4">Borrow Date</th>
                  <th scope="col" className="p-4">Due Date</th>
                  <th scope="col" className="p-4">Status</th>
                  <th scope="col" className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                      {circulation.length === 0
                        ? 'All hardcoded records removed. Loans will appear here when students or staff borrow titles.'
                        : 'No records matching the selected search and status filters.'}
                    </td>
                  </tr>
                )}
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-900">{record.learnerName}</td>
                    <td className="p-4 text-slate-800">{record.bookTitle}</td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">{record.borrowDate}</td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">{record.dueDate}</td>
                    <td className="p-4">
                      {record.status === 'returned' ? (
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Returned
                        </span>
                      ) : record.status === 'overdue' ? (
                        <span className="text-[10px] font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full">
                          Overdue
                        </span>
                      ) : (
                        <span className="text-[10px] font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {record.status !== 'returned' && (
                        <button
                          type="button"
                          onClick={() => handleReturn(record.id, record.bookId)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500 font-semibold">
          Showing {paginatedRecords.length} of {filteredRecords.length} loans
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </button>
          <span className="text-xs font-mono font-bold px-2 text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

    </div>
  );
};
