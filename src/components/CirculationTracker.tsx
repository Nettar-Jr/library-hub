/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CirculationRecord } from '../types';
import { CheckCircle2, AlertCircle, Clock, Send, Calendar, User, Search, BookOpen, UserPlus, ListCollapse, BarChart3, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CirculationTracker: React.FC = () => {
  const { circulation, books, returnBook, sendOverdueAlert, checkoutBook } = useApp();
  
  // Local States
  const [filter, setFilter] = useState<'all' | 'borrowed' | 'overdue' | 'returned'>('all');
  const [search, setSearch] = useState('');
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
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" /> Returned
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 text-[10px] font-bold px-2 py-1 rounded-md animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" /> Overdue Alert
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" /> Checked-out
          </span>
        );
    }
  };

  // Filter lists
  const filteredRecords = circulation.filter((rec) => {
    const matchesSearch =
      rec.learnerName.toLowerCase().includes(search.toLowerCase()) ||
      rec.bookTitle.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return rec.status === filter && matchesSearch;
  });

  // Calculate high-level metrics
  const totalCirculated = circulation.length;
  const totalBorrowed = circulation.filter((r) => r.status === 'borrowed').length;
  const totalOverdue = circulation.filter((r) => r.status === 'overdue').length;

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-indigo-900/50 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75 block">Total Circulated (Term)</span>
            <span className="text-3xl font-display font-black tracking-tight">{totalCirculated}</span>
          </div>
          <div className="p-3 bg-white/10 rounded-xl text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Active Book Loans</span>
            <span className="text-3xl font-display font-black tracking-tight text-indigo-900">{totalBorrowed}</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-900">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Overdue Warnings</span>
            <span className={`text-3xl font-display font-black tracking-tight ${totalOverdue > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {totalOverdue}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${totalOverdue > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-extrabold text-lg text-slate-900">
            Circulation Tracking Dashboard
          </h3>
          <p className="text-xs text-slate-500">Record check-outs, trigger reminders, and manage outstanding book loans.</p>
        </div>

        <button
          onClick={() => setShowCheckoutForm(!showCheckoutForm)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3.5 rounded-lg text-xs shadow-sm transition-all cursor-pointer"
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
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-md space-y-4 overflow-hidden"
          >
            <h4 className="font-display font-bold text-sm text-slate-800">Assign a New Book Loan</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Catalog Book</label>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Learner Full Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Alabi Mumuni"
                  className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Year 11">Year 11</option>
                    <option value="Year 9">Year 9</option>
                    <option value="Year 8">Year 8</option>
                    <option value="Primary 5">Primary 5</option>
                    <option value="Primary 4">Primary 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</label>
                  <select
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(parseInt(e.target.value))}
                    className="w-full text-xs border border-slate-200 bg-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>7 Days</option>
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCheckoutForm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg text-xs cursor-pointer shadow-xs"
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
            className={`p-3.5 rounded-lg border text-xs font-semibold ${
              msg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
        {/* Loan Search */}
        <div className="w-full sm:max-w-md flex items-center bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
          <Search className="w-4 h-4 text-slate-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search borrowings by student or book title..."
            className="w-full text-xs bg-transparent outline-none p-0.5"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none py-1">
          {(['all', 'borrowed', 'overdue', 'returned'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition capitalize cursor-pointer whitespace-nowrap ${
                filter === opt
                  ? 'bg-indigo-900 text-white shadow-2xs'
                  : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Circulation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-bold uppercase border-b border-slate-200 text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Student Learner</th>
                <th className="p-4">Assigned Book</th>
                <th className="p-4">Borrow Date</th>
                <th className="p-4 font-mono">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">ILAS Core Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition">
                  {/* Learner */}
                  <td className="p-4 font-semibold text-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded-full text-slate-500">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    {record.learnerName}
                  </td>

                  {/* Book */}
                  <td className="p-4 text-slate-700 italic font-semibold">
                    {record.bookTitle}
                  </td>

                  {/* Borrow date */}
                  <td className="p-4 text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {record.borrowDate}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className={`p-4 font-mono font-bold ${
                    record.status === 'overdue' ? 'text-red-500' : 'text-slate-600'
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
                          {record.status === 'overdue' && (
                            <button
                              disabled={record.alertSent}
                              onClick={() => {
                                sendOverdueAlert(record.id);
                                setMsg({
                                  type: 'success',
                                  text: `Overdue Email Reminder queued and transmitted successfully to ${record.learnerName}!`
                                });
                                setTimeout(() => setMsg(null), 5000);
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                                record.alertSent
                                  ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                  : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                              }`}
                              title="Send Overdue Notice"
                            >
                              <Send className="w-3.5 h-3.5" />
                              {record.alertSent ? 'Alert Sent' : 'Send Alert'}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              returnBook(record.id);
                              setMsg({
                                type: 'success',
                                text: `Book "${record.bookTitle}" checked-in successfully. Available copies count incremented.`
                              });
                              setTimeout(() => setMsg(null), 5000);
                            }}
                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Check-in Book"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Return Check-In
                          </button>
                        </>
                      )}

                      {record.status === 'returned' && (
                        <span className="text-[10px] font-mono font-bold text-slate-400 italic">
                          Closed: {record.returnDate}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 bg-slate-50/30">
                    No matching loan records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
