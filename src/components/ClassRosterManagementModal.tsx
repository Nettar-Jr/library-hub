/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  UserPlus, 
  GraduationCap, 
  CheckCircle2, 
  X, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  Layers, 
  Sparkles,
  ArrowRight,
  Filter,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LibraryUser } from '../types';

export const ClassRosterManagementModal: React.FC = () => {
  const { 
    isRosterModalOpen, 
    setIsRosterModalOpen, 
    users, 
    assignLearnerToTeacher, 
    assignMultipleLearnersToTeacher,
    createUser,
    isAdmin 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);
  const [bulkTeacherId, setBulkTeacherId] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New user mini-form state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'learner' | 'staff'>('learner');
  const [newUserGrade, setNewUserGrade] = useState('Year 8');
  const [newUserDepartment, setNewUserDepartment] = useState('Languages & Humanities');
  const [newUserTeacherId, setNewUserTeacherId] = useState('');

  if (!isRosterModalOpen) return null;

  const learners = users.filter((u) => u.role === 'learner' || u.role === 'student');
  const teachers = users.filter((u) => u.role === 'staff' || u.role === 'teacher');

  const distinctGrades = Array.from(
    new Set(learners.map((l) => l.gradeOrYear || 'Unspecified').filter(Boolean))
  );

  const filteredLearners = learners.filter((l) => {
    const matchesSearch = 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.libraryCardId && l.libraryCardId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGrade = selectedGrade === 'all' || l.gradeOrYear === selectedGrade;

    const matchesTeacher = 
      selectedTeacherFilter === 'all'
        ? true
        : selectedTeacherFilter === 'unassigned'
        ? !l.assignedTeacherId
        : l.assignedTeacherId === selectedTeacherFilter;

    return matchesSearch && matchesGrade && matchesTeacher;
  });

  const handleToggleSelectLearner = (id: string) => {
    setSelectedLearnerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (selectedLearnerIds.length === filteredLearners.length && filteredLearners.length > 0) {
      setSelectedLearnerIds([]);
    } else {
      setSelectedLearnerIds(filteredLearners.map((l) => l.id));
    }
  };

  const handleIndividualAssign = (learnerId: string, teacherId: string) => {
    const res = assignLearnerToTeacher(learnerId, teacherId ? teacherId : null);
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' });
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  const handleBulkAssign = () => {
    if (selectedLearnerIds.length === 0) {
      setFeedbackMessage({ text: 'Please select at least one learner.', type: 'error' });
      return;
    }
    if (!bulkTeacherId) {
      setFeedbackMessage({ text: 'Please choose a staff member to assign to.', type: 'error' });
      return;
    }

    const res = assignMultipleLearnersToTeacher(selectedLearnerIds, bulkTeacherId);
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' });
      setSelectedLearnerIds([]);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  const handleCreateNewUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setFeedbackMessage({ text: 'Name and email are required.', type: 'error' });
      return;
    }

    const teacher = teachers.find((t) => t.id === newUserTeacherId);

    const created = createUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      gradeOrYear: newUserRole === 'learner' ? newUserGrade : undefined,
      department: newUserRole === 'staff' ? newUserDepartment : undefined,
      assignedTeacherId: newUserRole === 'learner' ? newUserTeacherId || undefined : undefined,
      assignedTeacherName: newUserRole === 'learner' ? teacher?.name : undefined,
    });

    setFeedbackMessage({ 
      text: `Created ${created.role === 'staff' ? 'staff member' : 'learner'} "${created.name}" with ID ${created.libraryCardId}!`, 
      type: 'success' 
    });
    setIsAddingUser(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserTeacherId('');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0 border-b border-indigo-800/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg sm:text-xl text-white tracking-tight">
                  Classroom Roster & Staff Assignment Tool
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Assign learners to designated teachers to power customized classroom bookshelves and teacher monitoring feeds.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRosterModalOpen(false)}
            className="p-2 text-indigo-200 hover:text-white hover:bg-white/10 rounded-2xl transition cursor-pointer"
            aria-label="Close roster management modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between ${
                feedbackMessage.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
                  : 'bg-rose-50 text-rose-800 border-b border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedbackMessage.text}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setFeedbackMessage(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Enrolled Learners</span>
              <p className="font-display font-black text-xl text-slate-900 mt-0.5">{learners.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Assigned to Staff</span>
              <p className="font-display font-black text-xl text-emerald-800 mt-0.5">
                {learners.filter((l) => l.assignedTeacherId).length}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Unassigned Learners</span>
              <p className="font-display font-black text-xl text-amber-900 mt-0.5">
                {learners.filter((l) => !l.assignedTeacherId).length}
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-3 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Faculty Staff Roster</span>
              <p className="font-display font-black text-xl text-indigo-900 mt-0.5">{teachers.length}</p>
            </div>
          </div>

          {/* Action Ribbon & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student name, email, or library card ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Grade */}
            <div className="flex items-center gap-2">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Grades/Years</option>
                {distinctGrades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {/* Filter Teacher */}
              <select
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Teachers</option>
                <option value="unassigned">⚠️ Unassigned Only</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="flex items-center gap-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAddingUser ? 'Hide User Form' : 'Register New User'}</span>
              </button>
            </div>
          </div>

          {/* New User Expansion Box */}
          <AnimatePresence>
            {isAddingUser && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreateNewUserSubmit}
                className="bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-800 space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-indigo-800">
                  <h4 className="font-display font-black text-sm text-amber-400 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Add New Learner or Faculty Member
                  </h4>
                  <span className="text-[10px] text-indigo-300">Generates unique barcode card ID automatically</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Fatima Sani"
                      className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                      School Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="fatima.sani@school.edu"
                      className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                      Role Category
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'learner' | 'staff')}
                      className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                    >
                      <option value="learner">Learner (Student)</option>
                      <option value="staff">Staff (Teacher)</option>
                    </select>
                  </div>

                  {newUserRole === 'learner' ? (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                        Grade / Year
                      </label>
                      <select
                        value={newUserGrade}
                        onChange={(e) => setNewUserGrade(e.target.value)}
                        className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                      >
                        <option value="Primary 3">Primary 3</option>
                        <option value="Primary 4">Primary 4</option>
                        <option value="Primary 5">Primary 5</option>
                        <option value="Year 7">Year 7</option>
                        <option value="Year 8">Year 8</option>
                        <option value="Year 9">Year 9</option>
                        <option value="Year 10">Year 10</option>
                        <option value="Year 11">Year 11</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                        Faculty Department
                      </label>
                      <input
                        type="text"
                        value={newUserDepartment}
                        onChange={(e) => setNewUserDepartment(e.target.value)}
                        placeholder="e.g. Science Department"
                        className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                    </div>
                  )}
                </div>

                {newUserRole === 'learner' && (
                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 max-w-xs">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                        Assign Directly To Teacher
                      </label>
                      <select
                        value={newUserTeacherId}
                        onChange={(e) => setNewUserTeacherId(e.target.value)}
                        className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                      >
                        <option value="">-- No Teacher Assignment Yet --</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition cursor-pointer shadow-md"
                      >
                        Save & Enrol Member
                      </button>
                    </div>
                  </div>
                )}

                {newUserRole === 'staff' && (
                  <div className="pt-2 text-right">
                    <button
                      type="submit"
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition cursor-pointer shadow-md"
                    >
                      Save & Enrol Staff Member
                    </button>
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          {/* Bulk Action Bar (Visible when items selected) */}
          {selectedLearnerIds.length > 0 && (
            <div className="bg-amber-500/10 border-2 border-amber-400/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                  {selectedLearnerIds.length}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  Learners selected for batch teacher assignment
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={bulkTeacherId}
                  onChange={(e) => setBulkTeacherId(e.target.value)}
                  className="text-xs font-bold text-slate-900 bg-white border border-amber-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-500 cursor-pointer flex-1 sm:flex-none"
                >
                  <option value="">-- Choose Target Teacher --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.department || 'Staff'})</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleBulkAssign}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Apply Batch
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedLearnerIds([])}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Learners Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedLearnerIds.length === filteredLearners.length && filteredLearners.length > 0}
                        onChange={handleSelectAllFiltered}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Learner / Scholar</th>
                    <th className="py-3 px-4">Grade / Year</th>
                    <th className="py-3 px-4">Library Card ID</th>
                    <th className="py-3 px-4">Assigned Teacher</th>
                    <th className="py-3 px-4 text-right">Quick Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLearners.map((learner) => {
                    const isSelected = selectedLearnerIds.includes(learner.id);
                    return (
                      <tr 
                        key={learner.id}
                        className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-amber-50/60' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectLearner(learner.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {learner.name.charAt(0)}
                            </div>
                            <div>
                              <span>{learner.name}</span>
                              <span className="block text-[10px] font-normal text-slate-400">{learner.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                            {learner.gradeOrYear || 'Unspecified'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {learner.libraryCardId || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          {learner.assignedTeacherName ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-[11px]">
                              <GraduationCap className="w-3 h-3 text-emerald-600" />
                              {learner.assignedTeacherName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-bold text-[10px]">
                              ⚠️ Not Assigned
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={learner.assignedTeacherId || ''}
                            onChange={(e) => handleIndividualAssign(learner.id, e.target.value)}
                            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="">-- No Teacher --</option>
                            {teachers.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLearners.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium italic">
                        No learners found matching the selected filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Assignments instantly persist across browser sessions.</span>
          </div>

          <button
            type="button"
            onClick={() => setIsRosterModalOpen(false)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
          >
            Done & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
