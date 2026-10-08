/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2,
  UserPlus,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Search,
  ArrowRight,
  X,
  UserCheck,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PRIMARY_ACADEMIC_CLASSES, 
  JUNIOR_SECONDARY_CLASSES, 
  SENIOR_SECONDARY_CLASSES,
  getYearFromGrade 
} from '../utils/academicClasses';
import { LibraryUser } from '../types';
import { queryUserFromSupabase, isSupabaseConfigured } from '../services/supabase';

interface LoginProps {
  targetTab?: string;
  adminMode?: boolean;
}

export const Login: React.FC<LoginProps> = ({ targetTab, adminMode }) => {
  const { 
    setIsLibrarianLoggedIn, 
    setLoggedInLearner, 
    setCurrentUser,
    setActiveSection,
    activeSection,
    users,
    setActiveTab,
    login,
    createUser
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const redirectPath = searchParams.get('redirect');
  const isAdminPath = adminMode || location.pathname === '/admin' || searchParams.get('admin') === 'true';

  // Unified Learner Class Selection State (Year 1 to 12)
  const [selectedClassVal, setSelectedClassVal] = useState<string>('');
  const [primaryNameSearch, setPrimaryNameSearch] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');

  const selectedYear = useMemo(() => {
    if (!selectedClassVal) return null;
    const y = parseInt(selectedClassVal, 10);
    return isNaN(y) ? null : y;
  }, [selectedClassVal]);

  const isPrimary = selectedYear !== null && selectedYear >= 1 && selectedYear <= 6;
  const isSecondary = selectedYear !== null && selectedYear >= 7 && selectedYear <= 12;

  // Staff Login State
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Common UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // "Register New User Account" Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regRole, setRegRole] = useState<'student' | 'staff'>('student');
  const [regName, setRegName] = useState('');
  const [regClass, setRegClass] = useState('1D');
  const [regDepartment, setRegDepartment] = useState('English Department');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('staff123');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessUser, setRegSuccessUser] = useState<LibraryUser | null>(null);

  // Resolve target route after login
  const resolveTargetRoute = (target?: string, _isAdmin?: boolean): string => {
    if (redirectPath) return redirectPath;
    if (target) {
      if (target === 'dashboard') return '/dashboard';
      if (target === 'catalog' || target === 'library') return '/catalog';
      if (target === 'gallery') return '/gallery';
      if (target === 'submit') return '/submit';
      if (target === 'moderator' || target === 'moderation') return '/moderator';
      if (target === 'desk' || target === 'desk-utilities') return '/desk-utilities';
      if (target === 'analytics') return '/analytics';
      if (target === 'circulation') return '/circulation';
      if (target === 'announcements' || target === 'bulletin') return '/dashboard';
    }
    return '/dashboard';
  };

  // Helper function for password matching (case-tolerant and trim-tolerant)
  const verifyPassword = (storedPass?: string, inputPass?: string): boolean => {
    if (!storedPass || !inputPass) return false;
    const s = storedPass.trim();
    const inp = inputPass.trim();
    return s === inp || s.toLowerCase() === inp.toLowerCase();
  };

  // Filter registered primary learners for selected class (Year 1 to 6)
  const registeredPrimaryLearners = useMemo(() => {
    if (!isPrimary || !selectedYear) return [];
    return users.filter((u) => {
      const isLearner = u.role === 'learner' || u.role === 'student';
      if (!isLearner) return false;
      const yr = getYearFromGrade(u.gradeOrYear);
      return yr === selectedYear;
    });
  }, [users, isPrimary, selectedYear]);

  // Filter by primary name search
  const visiblePrimaryLearners = useMemo(() => {
    if (!primaryNameSearch.trim()) return registeredPrimaryLearners;
    const query = primaryNameSearch.trim().toLowerCase();
    return registeredPrimaryLearners.filter((u) => u.name.toLowerCase().includes(query));
  }, [registeredPrimaryLearners, primaryNameSearch]);

  // Primary Student Login (1-click upon clicking their name!)
  const handlePrimaryStudentLogin = (student: LibraryUser) => {
    setError(null);
    setIsLoading(true);
    login(student);
    setLoggedInLearner(student);
    setActiveSection('primary');
    setActiveTab(targetTab || 'dashboard');
    navigate(resolveTargetRoute(targetTab, false));
    setIsLoading(false);
  };

  // Secondary Student Login (Enter email -> logs in if registered)
  const handleSecondaryEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = secondaryEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Please enter your school email address.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Check Supabase if configured
      let cloudUser: LibraryUser | null = null;
      if (isSupabaseConfigured) {
        try {
          const { data, error: sbError } = await queryUserFromSupabase(cleanEmail);
          if (!sbError && data) {
            cloudUser = data;
          }
        } catch (dbErr) {
          console.warn('Supabase query error:', dbErr);
        }
      }

      // 2. Find matching registered secondary learner
      const matchedUser = cloudUser || users.find((u) => {
        const isLearner = u.role === 'learner' || u.role === 'student';
        const uEmail = (u.email || '').trim().toLowerCase();
        return isLearner && (uEmail === cleanEmail || uEmail.startsWith(cleanEmail + '@'));
      }) || users.find((u) => (u.email || '').trim().toLowerCase() === cleanEmail);

      if (matchedUser) {
        login(matchedUser);
        setLoggedInLearner(matchedUser);
        setActiveSection('college');
        setActiveTab(targetTab || 'dashboard');
        navigate(resolveTargetRoute(targetTab, false));
        setIsLoading(false);
        return;
      }

      setError(`No registered secondary learner found with email "${secondaryEmail}". Please check your email or contact the library administrator.`);
      setIsLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  // Staff Login (Email and Password)
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanEmail = staffEmail.trim().toLowerCase();
    const cleanPass = staffPassword.trim();

    if (!cleanEmail || !cleanPass) {
      setError('Please enter both your staff email and password.');
      return;
    }

    setIsLoading(true);

    try {
      let cloudUser: LibraryUser | null = null;
      if (isSupabaseConfigured) {
        try {
          const { data, error: sbError } = await queryUserFromSupabase(cleanEmail);
          if (!sbError && data) {
            cloudUser = data;
          }
        } catch (dbErr) {
          console.warn('Supabase query error:', dbErr);
        }
      }

      const targetUser = cloudUser || users.find((u) => {
        const isStaff = u.role === 'staff' || u.role === 'teacher' || u.role === 'admin' || u.role === 'librarian';
        const uEmail = (u.email || '').toLowerCase();
        const uName = (u.name || '').toLowerCase();
        return isStaff && (uEmail === cleanEmail || uName === cleanEmail || uEmail.split('@')[0] === cleanEmail);
      });

      if (targetUser) {
        if (targetUser.password && !verifyPassword(targetUser.password, cleanPass)) {
          setError('Incorrect password. Please verify your credentials.');
          setIsLoading(false);
          return;
        }

        login(targetUser);
        if (targetUser.role === 'admin' || targetUser.role === 'librarian') {
          setIsLibrarianLoggedIn(true, targetUser);
        }
        setActiveTab(targetTab || 'dashboard');
        navigate(resolveTargetRoute(targetTab, true));
        setIsLoading(false);
        return;
      }

      setError('Invalid educator credentials. Please verify your email and password.');
      setIsLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle "Register New User Account" submission
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim()) {
      setRegError('Full name is required.');
      return;
    }

    if (regRole === 'student') {
      const year = getYearFromGrade(regClass);
      const isPrimary = year === null || year <= 6;
      const isSecondary = year !== null && year >= 7;

      if (isSecondary && (!regEmail.trim() || !regEmail.includes('@'))) {
        setRegError('School email is compulsory for secondary section learners (Years 7–12).');
        return;
      }

      if (regEmail.trim() && !regEmail.includes('@')) {
        setRegError('Please enter a valid school email address.');
        return;
      }

      const effectiveEmail = regEmail.trim() || 
        `${regName.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(100 + Math.random() * 900)}@primary.learner`;

      const newUser = createUser({
        name: regName.trim(),
        role: 'learner',
        gradeOrYear: regClass,
        email: effectiveEmail,
        section: isPrimary ? 'primary' : 'college',
      });

      setRegSuccessUser(newUser);
      if (year) {
        setSelectedClassVal(String(year));
      }
      if (isSecondary) {
        setSecondaryEmail(newUser.email);
      }
    } else {
      // Staff
      if (!regDepartment.trim()) {
        setRegError('Faculty department is required for staff members.');
        return;
      }

      if (!regEmail.trim() || !regEmail.includes('@')) {
        setRegError('School email is required for staff members.');
        return;
      }

      if (!regPassword.trim()) {
        setRegError('Password is required for staff login.');
        return;
      }

      const newUser = createUser({
        name: regName.trim(),
        role: 'teacher',
        department: regDepartment.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        section: 'all',
      });

      setRegSuccessUser(newUser);
      setStaffEmail(newUser.email);
    }
  };

  const selectedRegYear = getYearFromGrade(regClass);
  const isRegPrimaryStudent = regRole === 'student' && (selectedRegYear === null || selectedRegYear <= 6);

  return (
    <div className="min-h-[76vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col gap-5"
      >
        {/* Title */}
        <div className="text-center">
          <h1 className="font-display font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {isAdminPath ? 'Staff & Educator Login' : 'Learner Library Login'}
          </h1>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div 
            role="alert" 
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-start gap-2.5 shadow-2xs"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Global Success Toast */}
        {successToast && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* MODE A: STAFF LOGIN */}
        {isAdminPath ? (
          <form onSubmit={handleStaffLogin} className="flex flex-col gap-4 mt-1">
            <div className="space-y-1">
              <label htmlFor="staff-email" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Staff Email Address
              </label>
              <input
                id="staff-email"
                type="email"
                required
                autoComplete="email"
                placeholder="educator@school.edu"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition shadow-2xs"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="staff-pass" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="staff-pass"
                  type={showStaffPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter staff password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowStaffPassword(!showStaffPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer transition rounded"
                  aria-label={showStaffPassword ? 'Hide password' : 'Show password'}
                >
                  {showStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Log In as Staff</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* MODE B: UNIFIED LEARNER LOGIN (Class Dropdown -> Dynamic Class List or Email) */
          <div className="flex flex-col gap-4">
            {/* Step 1: Dropdown for Class / Year */}
            <div className="space-y-1.5">
              <label 
                htmlFor="learner-class-select" 
                className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between"
              >
                <span>Select Your Class / Year</span>
                {selectedClassVal && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isPrimary 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {isPrimary ? 'Primary Section' : 'Secondary Section'}
                  </span>
                )}
              </label>

              <select
                id="learner-class-select"
                value={selectedClassVal}
                onChange={(e) => {
                  setSelectedClassVal(e.target.value);
                  setError(null);
                  setPrimaryNameSearch('');
                }}
                className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 hover:border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-bold text-slate-900 transition shadow-2xs cursor-pointer"
              >
                <option value="">-- Click to Pick Your Class (Year 1 to 12) --</option>
                <optgroup label="🎒 Primary Section (Year 1 – Year 6)">
                  <option value="1">Year 1 (Primary 1)</option>
                  <option value="2">Year 2 (Primary 2)</option>
                  <option value="3">Year 3 (Primary 3)</option>
                  <option value="4">Year 4 (Primary 4)</option>
                  <option value="5">Year 5 (Primary 5)</option>
                  <option value="6">Year 6 (Primary 6)</option>
                </optgroup>
                <optgroup label="🎓 Secondary Section (Year 7 – Year 12)">
                  <option value="7">Year 7 (JSS 1)</option>
                  <option value="8">Year 8 (JSS 2)</option>
                  <option value="9">Year 9 (JSS 3)</option>
                  <option value="10">Year 10 (SSS 1)</option>
                  <option value="11">Year 11 (SSS 2)</option>
                  <option value="12">Year 12 (SSS 3)</option>
                </optgroup>
              </select>
            </div>

            {/* Step 2: Dynamic flow based on chosen class */}
            <AnimatePresence mode="wait">
              {/* Primary (Year 1 - Year 6): Automatically show the class list of registered names to select from */}
              {isPrimary && (
                <motion.div
                  key={`primary-class-list-${selectedYear}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3 pt-1"
                >
                  {registeredPrimaryLearners.length > 4 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder={`Search name in Year ${selectedYear}...`}
                        value={primaryNameSearch}
                        onChange={(e) => setPrimaryNameSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white text-slate-900"
                      />
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto space-y-2 pr-0.5">
                    {visiblePrimaryLearners.length > 0 ? (
                      visiblePrimaryLearners.map((learner) => (
                        <button
                          key={learner.id}
                          type="button"
                          onClick={() => handlePrimaryStudentLogin(learner)}
                          className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-left transition group shadow-2xs cursor-pointer active:scale-98"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {learner.avatar ? (
                              <img
                                src={learner.avatar}
                                alt={learner.name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                                {learner.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition truncate">
                                {learner.name}
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Year {selectedYear} &bull; {learner.gradeOrYear || 'Primary'}
                              </p>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition shrink-0 pl-2">
                            Log In <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-6 px-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-bold">
                          {selectedYear}
                        </div>
                        <p className="text-xs text-slate-600 font-medium">
                          {primaryNameSearch 
                            ? `No pupil matching "${primaryNameSearch}" in Year ${selectedYear}.`
                            : `No registered learners found in Year ${selectedYear} yet.`}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Secondary (Year 7 - Year 12): Ask for email */}
              {isSecondary && (
                <motion.form
                  key={`secondary-email-form-${selectedYear}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleSecondaryEmailLogin}
                  className="space-y-3.5 pt-1"
                >
                  <div className="space-y-1.5">
                    <label htmlFor="sec-email" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Student School Email
                    </label>
                    <input
                      id="sec-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="e.g. somtoo@premierinternationalschool.org"
                      value={secondaryEmail}
                      onChange={(e) => setSecondaryEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition shadow-2xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        <span>Log In to Library</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Bottom Actions: Staff/Learner Switcher */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <div>
            {isAdminPath ? (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  navigate('/login');
                }}
                className="text-xs text-slate-400 hover:text-blue-600 transition cursor-pointer"
              >
                Learner? <span className="text-blue-600 font-semibold underline">Learner Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  navigate('/admin');
                }}
                className="text-xs text-slate-400 hover:text-blue-600 transition cursor-pointer"
              >
                Staff member? <span className="text-blue-600 font-semibold underline">Staff Login (Email & Password)</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* "REGISTER NEW USER ACCOUNT" MODAL                             */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div 
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-modal-heading"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 my-8"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="register-modal-heading" className="font-display font-black text-lg text-slate-900">
                      Register New User Account
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Create student or educator library profile
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setRegSuccessUser(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success View if just registered */}
              {regSuccessUser ? (
                <div className="space-y-4 py-2 text-center">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">
                      Registration Successful!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Account created for <strong>{regSuccessUser.name}</strong> (
                      {regSuccessUser.role === 'learner' ? `Student &bull; Class ${regSuccessUser.gradeOrYear}` : 'Staff Member'}
                      ).
                    </p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterModalOpen(false);
                        if (regSuccessUser.role === 'learner') {
                          handlePrimaryStudentLogin(regSuccessUser);
                        } else {
                          navigate('/admin');
                        }
                      }}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Log In Now as {regSuccessUser.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterModalOpen(false);
                        setRegSuccessUser(null);
                      }}
                      className="w-full py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Close & Return to Login
                    </button>
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {regError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Account Role Selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Account Role *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole('student')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          regRole === 'student'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Student / Learner</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole('staff')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          regRole === 'staff'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Staff Member</span>
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder={regRole === 'student' ? 'e.g. Samuel Adekunle' : 'e.g. Dr. Ngozi Okonjo'}
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900"
                    />
                  </div>

                  {/* STUDENT SPECIFIC: Class/Year */}
                  {regRole === 'student' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Academic Class / Year *
                      </label>
                      <select 
                        value={regClass}
                        onChange={(e) => setRegClass(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-blue-500 cursor-pointer font-medium text-slate-900"
                      >
                        <optgroup label="Primary Section (Years 1–6: Diamond, Gold, Emerald, Onyx, Ruby)">
                          {PRIMARY_ACADEMIC_CLASSES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} — {c.fullLabel}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Secondary Junior (Years 7–9: Diamond, Gold, Emerald, Onyx, Ruby)">
                          {JUNIOR_SECONDARY_CLASSES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} — {c.fullLabel}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Secondary Senior (Years 10–12: Diamond, Gold, Emerald, Onyx, Ruby)">
                          {SENIOR_SECONDARY_CLASSES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code} — {c.fullLabel}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  )}

                  {/* STAFF SPECIFIC: Department */}
                  {regRole === 'staff' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Faculty Department *
                      </label>
                      <select 
                        value={regDepartment}
                        onChange={(e) => setRegDepartment(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white outline-none focus:border-blue-500 text-slate-900"
                      >
                        <option value="English Department">English Department</option>
                        <option value="Science Department">Science Department</option>
                        <option value="Mathematics Department">Mathematics Department</option>
                        <option value="Arts & Humanities">Arts & Humanities</option>
                        <option value="Physical Education">Physical Education</option>
                        <option value="Library Services">Library Services</option>
                      </select>
                    </div>
                  )}

                  {/* EMAIL FIELD (Optional for Primary, Compulsory for Secondary, Compulsory for Staff) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {regRole === 'student' ? (
                          isRegPrimaryStudent
                            ? 'School Email (Optional for Primary)'
                            : 'School Email * (Compulsory for Secondary)'
                        ) : (
                          'School Email Address *'
                        )}
                      </label>
                      {regRole === 'student' && isRegPrimaryStudent && (
                        <span className="text-[10px] text-blue-600 font-medium">Optional for Primary</span>
                      )}
                    </div>
                    <input 
                      type="email"
                      required={regRole === 'staff' || (!isRegPrimaryStudent)}
                      placeholder={
                        regRole === 'student' && isRegPrimaryStudent
                          ? 'Optional — primary pupils log in by name'
                          : 'learner.name@school.edu'
                      }
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-mono text-slate-900"
                    />
                    <p className="text-[10px] text-slate-400">
                      {regRole === 'student' ? (
                        isRegPrimaryStudent
                          ? 'Primary learners can log in simply by choosing their class and clicking their name.'
                          : 'Secondary learners (Years 7–12) use this email to log in.'
                      ) : (
                        'Staff login requires email and password.'
                      )}
                    </p>
                  </div>

                  {/* STAFF PASSWORD FIELD */}
                  {regRole === 'staff' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Staff Password *
                      </label>
                      <input 
                        type="password" 
                        required
                        placeholder="Set staff password" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-mono text-slate-900"
                      />
                      <p className="text-[10px] text-slate-400">
                        The login process for staff remains email and password.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setIsRegisterModalOpen(false)}
                      className="w-1/2 border border-slate-200 text-slate-600 font-bold p-2.5 rounded-xl text-xs cursor-pointer hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-xs cursor-pointer transition shadow-xs"
                    >
                      Register Account
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

