/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp, getUserBorrowLimitInfo } from '../context/AppContext';
import { 
  ALL_ACADEMIC_CLASSES, 
  PRIMARY_ACADEMIC_CLASSES, 
  JUNIOR_SECONDARY_CLASSES, 
  SENIOR_SECONDARY_CLASSES,
  ALL_YEARS,
  parseAcademicClass,
  getYearFromGrade
} from '../utils/academicClasses';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  X, 
  Search, 
  UserCheck, 
  ShieldAlert, 
  Layers, 
  ArrowRight,
  Filter,
  Trash2,
  Pencil,
  Lock,
  Save
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
    updateLearnerByAdmin,
    deleteUser,
    isAdmin,
    activeSection,
    currentUser
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [selectedLearnerIds, setSelectedLearnerIds] = useState<string[]>([]);
  const [bulkTeacherId, setBulkTeacherId] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Edit student modal state (admin/librarian only)
  const [editingLearner, setEditingLearner] = useState<LibraryUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editAdmissionNumber, setEditAdmissionNumber] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [learnerToDelete, setLearnerToDelete] = useState<LibraryUser | null>(null);
  const [isDeletingLearner, setIsDeletingLearner] = useState(false);

  const startEditLearner = (learner: LibraryUser) => {
    setEditingLearner(learner);
    setEditName(learner.name);
    setEditEmail(learner.email);
    setEditGrade(learner.gradeOrYear || '9E');
    setEditAdmissionNumber(learner.admissionNumber || '');
  };

  const handleSaveLearnerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLearner) return;
    if (!editName.trim()) {
      setFeedbackMessage({ text: 'Student name cannot be blank.', type: 'error' });
      return;
    }
    setIsSavingEdit(true);
    const res = await updateLearnerByAdmin(editingLearner.id, {
      name: editName.trim(),
      email: editEmail.trim(),
      gradeOrYear: editGrade.trim(),
      admissionNumber: editAdmissionNumber.trim() || undefined,
    });
    setIsSavingEdit(false);
    if (res.success) {
      setFeedbackMessage({ text: res.message, type: 'success' });
      setEditingLearner(null);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      setFeedbackMessage({ text: res.message, type: 'error' });
    }
  };

  // Auto-derived section based on logged in librarian
  const autoSection: 'college' | 'primary' = 
    currentUser?.section === 'primary' || currentUser?.department?.toLowerCase().includes('primary') ? 'primary' :
    currentUser?.section === 'college' || currentUser?.department?.toLowerCase().includes('college') ? 'college' :
    (activeSection === 'primary' ? 'primary' : 'college');

  // New user mini-form state
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'learner' | 'staff'>('learner');
  const [newUserSection, setNewUserSection] = useState<'college' | 'primary'>(autoSection);
  const [newUserGrade, setNewUserGrade] = useState('9E');
  const [newUserAdmissionNumber, setNewUserAdmissionNumber] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDepartment, setNewUserDepartment] = useState('English & Literature Department');
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

    const matchesGrade = selectedGrade === 'all'
      ? true
      : selectedGrade.startsWith('year-')
      ? (() => {
          const yearNum = parseInt(selectedGrade.replace('year-', ''), 10);
          const parsed = parseAcademicClass(l.gradeOrYear);
          return parsed ? parsed.year === yearNum : false;
        })()
      : (l.gradeOrYear === selectedGrade || parseAcademicClass(l.gradeOrYear)?.code === selectedGrade);

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
    if (!newUserName.trim()) {
      setFeedbackMessage({ text: 'Full name is required.', type: 'error' });
      return;
    }

    const isLearner = newUserRole === 'learner';
    const year = getYearFromGrade(newUserGrade);
    const isPrimary = isLearner && (year === null || year <= 6);
    const isSecondary = isLearner && year !== null && year >= 7;

    if (isSecondary && (!newUserEmail.trim() || !newUserEmail.includes('@'))) {
      setFeedbackMessage({ text: 'School email is compulsory for secondary section learners (Years 7–12).', type: 'error' });
      return;
    }

    if (!isLearner && (!newUserEmail.trim() || !newUserEmail.includes('@'))) {
      setFeedbackMessage({ text: 'School email is required for staff members.', type: 'error' });
      return;
    }

    if (!isLearner && !newUserDepartment.trim()) {
      setFeedbackMessage({ text: 'Faculty department is required for staff members.', type: 'error' });
      return;
    }

    if (!isLearner && !newUserPassword.trim()) {
      setFeedbackMessage({ text: 'Password is required for staff login.', type: 'error' });
      return;
    }

    const teacher = teachers.find((t) => t.id === newUserTeacherId);
    const effectiveEmail = newUserEmail.trim() || 
      `${newUserName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(100 + Math.random() * 900)}@primary.learner`;

    const created = createUser({
      name: newUserName.trim(),
      email: effectiveEmail,
      role: newUserRole,
      section: isLearner ? (isPrimary ? 'primary' : 'college') : 'all',
      gradeOrYear: isLearner ? newUserGrade : undefined,
      department: !isLearner ? newUserDepartment.trim() : undefined,
      admissionNumber: isLearner ? newUserAdmissionNumber.trim() || undefined : undefined,
      password: !isLearner 
        ? (newUserPassword.trim() || 'staff123')
        : (newUserAdmissionNumber.trim() || undefined),
      assignedTeacherId: isLearner ? newUserTeacherId || undefined : undefined,
      assignedTeacherName: isLearner ? teacher?.name : undefined,
    });

    setFeedbackMessage({ 
      text: `Created ${created.role === 'staff' ? 'staff member' : 'learner'} "${created.name}" with ID ${created.libraryCardId}!`, 
      type: 'success' 
    });
    setIsAddingUser(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserAdmissionNumber('');
    setNewUserPassword('');
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
                className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[180px] sm:max-w-[220px]"
              >
                <option value="all">
                  {autoSection === 'primary' ? 'All Primary Classes (Years 1–6)' : 'All Secondary Classes (Years 7–12)'}
                </option>
                <optgroup label="Filter by Academic Year (All Streams)">
                  {(autoSection === 'primary' ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12]).map((y) => (
                    <option key={`year-${y}`} value={`year-${y}`}>
                      Year {y} (D, G, E, O, R)
                    </option>
                  ))}
                </optgroup>
                {autoSection === 'primary' ? (
                  <optgroup label="Primary Section (Years 1–6: D, G, E, O, R)">
                    {PRIMARY_ACADEMIC_CLASSES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.fullLabel}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <>
                    <optgroup label="Secondary Senior (Years 10–12: D, G, E, O, R)">
                      {SENIOR_SECONDARY_CLASSES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.fullLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Secondary Junior (Years 7–9: D, G, E, O, R)">
                      {JUNIOR_SECONDARY_CLASSES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.fullLabel}
                        </option>
                      ))}
                    </optgroup>
                  </>
                )}
                {distinctGrades.some(g => !ALL_ACADEMIC_CLASSES.some(c => c.code === g)) && (
                  <optgroup label="Other Enrolled Labels">
                    {distinctGrades.filter(g => !ALL_ACADEMIC_CLASSES.some(c => c.code === g)).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </optgroup>
                )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
                      Role Category
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as 'learner' | 'staff')}
                      className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                    >
                      <option value="learner">Learner (Student / Pupil)</option>
                      <option value="staff">Staff (Teacher / Faculty)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                      {newUserRole === 'learner' 
                        ? ((getYearFromGrade(newUserGrade) ?? 1) <= 6 ? 'Email (Optional for Primary)' : 'Email * (Compulsory for Sec)')
                        : 'Staff Email *'}
                    </label>
                    <input
                      type="email"
                      required={newUserRole === 'staff' || ((getYearFromGrade(newUserGrade) ?? 1) >= 7)}
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder={
                        newUserRole === 'learner' && (getYearFromGrade(newUserGrade) ?? 1) <= 6
                          ? 'Optional for primary'
                          : 'fatima.sani@school.edu'
                      }
                      className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>

                  {newUserRole === 'learner' ? (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                          Class / Year (Years 1–12: D, G, E, O, R)
                        </label>
                        <select
                          value={newUserGrade}
                          onChange={(e) => setNewUserGrade(e.target.value)}
                          className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none cursor-pointer"
                        >
                          <optgroup label="Secondary Senior (Years 10–12 • Max 3 Books)">
                            {SENIOR_SECONDARY_CLASSES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} — {c.fullLabel}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Secondary Junior (Years 7–9 • Max 2 Books)">
                            {JUNIOR_SECONDARY_CLASSES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} — {c.fullLabel}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Primary Section (Years 1–6 • Manual Limit)">
                            {PRIMARY_ACADEMIC_CLASSES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} — {c.fullLabel}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                          Admission Number (Password)
                        </label>
                        <input
                          type="text"
                          value={newUserAdmissionNumber}
                          onChange={(e) => setNewUserAdmissionNumber(e.target.value)}
                          placeholder="e.g. PIS/SS/23/2345"
                          className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
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

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Staff password"
                          className="w-full text-xs font-semibold bg-indigo-900 border border-indigo-700 text-white rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
                        />
                      </div>
                    </>
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
                    <th className="py-3 px-4">Grade / Class</th>
                    <th className="py-3 px-4">Admission No.</th>
                    <th className="py-3 px-4">Library Card ID</th>
                    <th className="py-3 px-4">Assign Staff</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                          {(() => {
                            const borrowLimit = getUserBorrowLimitInfo(learner, activeSection);
                            return (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                                  {learner.gradeOrYear || 'Unspecified'}
                                </span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                                  borrowLimit.gradeCategory === 'senior-secondary'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : borrowLimit.gradeCategory === 'junior-secondary'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {borrowLimit.maxAllowed !== null ? `${borrowLimit.maxAllowed} books max` : 'Manual limit'}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-semibold text-slate-700">
                          {learner.admissionNumber || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {learner.libraryCardId || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEditLearner(learner)}
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer border border-slate-200 shadow-2xs"
                              title="Edit Student Information (Name, Class, Admission No.)"
                            >
                              <Pencil className="w-3 h-3 text-blue-600" />
                              
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => setLearnerToDelete(learner)}
                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer border border-slate-200 shadow-2xs"
                                title="Remove Student Record"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLearners.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium italic">
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

        {/* Edit Student Record Modal (Librarian/Admin only) */}
        <AnimatePresence>
          {editingLearner && (
            <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-display font-black text-base text-slate-900 flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-blue-600" />
                      Edit Student Record
                    </h3>
                    <p className="text-xs text-slate-500">
                      Administrative record update for {editingLearner.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingLearner(null)}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveLearnerEdit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student Official Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl font-semibold outline-none transition text-slate-900"
                      placeholder="Student full legal name"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Only administrators and librarians can modify student names. Students cannot change their own name.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Academic Class / Year
                      </label>
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl font-semibold outline-none transition text-slate-900 cursor-pointer"
                      >
                        {autoSection === 'primary' ? (
                          <optgroup label="Primary Section (Years 1–6 • Manual Limit)">
                            {PRIMARY_ACADEMIC_CLASSES.map((c) => (
                              <option key={c.code} value={c.code}>{c.code} — {c.fullLabel}</option>
                            ))}
                          </optgroup>
                        ) : (
                          <>
                            <optgroup label="Secondary Senior (Years 10–12 • Max 3 Books)">
                              {SENIOR_SECONDARY_CLASSES.map((c) => (
                                <option key={c.code} value={c.code}>{c.code} — {c.fullLabel}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Secondary Junior (Years 7–9 • Max 2 Books)">
                              {JUNIOR_SECONDARY_CLASSES.map((c) => (
                                <option key={c.code} value={c.code}>{c.code} — {c.fullLabel}</option>
                              ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Admission Number
                      </label>
                      <input
                        type="text"
                        value={editAdmissionNumber}
                        onChange={(e) => setEditAdmissionNumber(e.target.value)}
                        placeholder="e.g. PIS/SS/23/2345"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl font-medium outline-none transition text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl font-medium outline-none transition text-slate-900 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingLearner(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingEdit}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingEdit ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Learner Confirmation Modal */}
        <AnimatePresence>
          {learnerToDelete && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg text-slate-900">
                    Remove Learner from Roster
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Are you sure you want to permanently remove <strong className="text-slate-800">{learnerToDelete.name}</strong> ({learnerToDelete.gradeOrYear || 'Learner'})? Their library card <span className="font-mono font-bold text-slate-700">{learnerToDelete.libraryCardId}</span> and student records will be removed.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isDeletingLearner}
                    onClick={() => setLearnerToDelete(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingLearner}
                    onClick={async () => {
                      setIsDeletingLearner(true);
                      const res = await deleteUser(learnerToDelete.id);
                      setIsDeletingLearner(false);
                      if (res.success) {
                        setFeedbackMessage({ text: res.message, type: 'success' });
                        setTimeout(() => setFeedbackMessage(null), 3500);
                      }
                      setLearnerToDelete(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeletingLearner ? 'Removing...' : 'Yes, Remove Learner'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
