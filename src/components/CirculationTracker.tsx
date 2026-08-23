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
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ITEMS_PER_PAGE = 7;

export const CirculationTracker: React.FC = () => {
  const { circulation, books, returnBook, sendOverdueAlert, checkoutBook } = useApp();
  
  // Local States
  const [filter, setFilter] = useState<'all' | 'borrowed' | 'overdue' | 'returned'>('all');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'dueDate' | 'learner' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  
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
      setMsg({ type: 'success', text: res.message });
      setSelectedBookId('');
      setStudentName('');
      setTimeout(() => setMsg(null), 5000);
      setShowCheckoutForm(false);
    } else {
      setMsg({ type: 'error', text: res.message });
      setTimeout(() => setMsg(null), 5000);
    }
  };

  const getStatusBadge = (status: CirculationRecord['status']) => {
    switch (status) {
      case 'returned':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Returned
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-950 border border-rose-300 text-[10px] font-black px-2.5 py-1 rounded-md animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700" /> Overdue Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-950 border border-indigo-300 text-[10px] font-black px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-indigo-700" /> Active Loan
          </span>
        );
    }
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
    <div className="space-y-6">
      
      {/* Metrics Row with Enhanced Visual Weight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-indigo-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-300 block">Total Volume Circulated</span>
            <span className="text-3xl font-display font-black tracking-tight text-white">{totalCirculated}</span>
          </div>
          <div className="p-3 bg-indigo-800/60 rounded-xl text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-700 block">Active Book Loans</span>
            <span className="text-3xl font-display font-black tracking-tight text-indigo-950">{totalBorrowed}</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-900">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-700 block">Overdue Warnings</span>
            <span className={`text-3xl font-display font-black tracking-tight ${totalOverdue > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              {totalOverdue}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${totalOverdue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-700 block">Completed Returns</span>
            <span className="text-3xl font-display font-black tracking-tight text-emerald-800">{totalReturned}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-extrabold text-lg sm:text-xl text-slate-900">
            Circulation Tracking Dashboard
          </h3>
          <p className="text-xs text-slate-600">
            Record loan check-outs, view return due dates, and trigger automated reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCheckoutForm(!showCheckoutForm)}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
        >
          {showCheckoutForm ? <ListCollapse className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showCheckoutForm ? 'Collapse Form' : 'Manual Book Checkout'}
        </button>
      </div>

      {/* Manual Checkout Form */}
      <AnimatePresence>
        {showCheckoutForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCheckoutSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-4 overflow-hidden"
          >
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-display font-black text-sm text-slate-900">Assign a New Book Loan</h4>
              <p className="text-xs text-slate-500">Select a catalog title and specify the patron information.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="checkout-book-select" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Catalog Book
                </label>
                <select
                  id="checkout-book-select"
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
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
                <label htmlFor="checkout-student-name" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Learner Full Name
                </label>
                <input
                  id="checkout-student-name"
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alabi Mumuni"
                  className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="checkout-grade" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Grade / Year
                  </label>
                  <select
                    id="checkout-grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
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
                  <label htmlFor="checkout-duration" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <select
                    id="checkout-duration"
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(parseInt(e.target.value))}
                    className="w-full text-xs border border-slate-300 bg-white rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
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
                className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Log Loan Checkout
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Messages */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl border text-xs font-bold ${
              msg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search, Filter, and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Search */}
        <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search borrowings by student, book title, or loan ID..."
            className="w-full text-xs bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
            aria-label="Search loan records"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {(['all', 'borrowed', 'overdue', 'returned'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setFilter(opt);
                setCurrentPage(1);
              }}
              className={`text-xs px-3.5 py-2 rounded-xl font-bold transition capitalize cursor-pointer whitespace-nowrap ${
                filter === opt
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              {opt === 'all' ? 'All Loans' : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Circulation Table with High Contrast Visual Rows */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs" aria-label="Circulation and Book Loan Status Table">
            <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase border-b border-slate-200 text-[10px] tracking-wider font-mono">
              <tr>
                <th scope="col" className="p-4">Student Learner</th>
                <th scope="col" className="p-4">Assigned Book</th>
                <th scope="col" className="p-4">Borrow Date</th>
                <th scope="col" className="p-4 font-mono">Due Date</th>
                <th scope="col" className="p-4">Status</th>
                <th scope="col" className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedRecords.map((record) => {
                const isOverdue = record.status === 'overdue';
                const isReturned = record.status === 'returned';
                
                return (
                  <tr 
                    key={record.id} 
                    className={`transition ${
                      isOverdue 
                        ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500' 
                        : isReturned 
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-l-4 border-l-emerald-500' 
                          : 'hover:bg-slate-50/80 border-l-4 border-l-indigo-600'
                    }`}
                  >
                    {/* Learner */}
                    <td className="p-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-full ${isOverdue ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block">{record.learnerName}</span>
                          <span className="text-[10px] font-mono text-slate-500">ID: {record.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Book */}
                    <td className="p-4 text-slate-900 font-semibold italic">
                      {record.bookTitle}
                    </td>

                    {/* Borrow date */}
                    <td className="p-4 text-slate-600 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {record.borrowDate}
                      </span>
                    </td>

                    {/* Due Date */}
                    <td className={`p-4 font-mono font-bold ${
                      isOverdue ? 'text-rose-700' : 'text-slate-700'
                    }`}>
                      {record.dueDate}
                    </td>

                    {/* Status badge */}
                    <td className="p-4">
                      {getStatusBadge(record.status)}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {record.status !== 'returned' && (
                          <>
                            {isOverdue && (
                              <button
                                type="button"
                                disabled={record.alertSent}
                                onClick={() => {
                                  sendOverdueAlert(record.id);
                                  setMsg({
                                    type: 'success',
                                    text: `Overdue Email Notice transmitted to ${record.learnerName}!`
                                  });
                                  setTimeout(() => setMsg(null), 5000);
                                }}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                  record.alertSent
                                    ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                                    : 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                                }`}
                                title="Send Overdue Reminder Notice"
                              >
                                <Send className="w-3.5 h-3.5" />
                                {record.alertSent ? 'Alert Sent' : 'Send Alert'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                returnBook(record.id);
                                setMsg({
                                  type: 'success',
                                  text: `Book "${record.bookTitle}" checked-in successfully. Available stock incremented.`
                                });
                                setTimeout(() => setMsg(null), 5000);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-100 text-emerald-950 hover:bg-emerald-200 border border-emerald-300 rounded-lg text-xs font-black flex items-center gap-1 transition cursor-pointer"
                              title="Check-in Book"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Return Check-In
                            </button>
                          </>
                        )}

                        {record.status === 'returned' && (
                          <span className="text-[10px] font-mono font-bold text-slate-500 italic">
                            Closed: {record.returnDate}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500 bg-slate-50/50">
                    No matching loan records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredRecords.length > 0 && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredRecords.length)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{filteredRecords.length}</span> loan records
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                  currentPage === 1
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 cursor-pointer'
                }`}
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-indigo-950 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                  aria-label={`Page ${pageNum}`}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className={`p-2 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                  currentPage === totalPages
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 cursor-pointer'
                }`}
                aria-label="Next Page"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
