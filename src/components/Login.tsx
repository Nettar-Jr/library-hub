/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  User, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  targetTab?: string;
  adminMode?: boolean;
}

export const Login: React.FC<LoginProps> = ({ targetTab, adminMode }) => {
  const { 
    setIsLibrarianLoggedIn, 
    setLoggedInLearner, 
    setCurrentUser,
    users,
    setActiveTab
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const redirectPath = searchParams.get('redirect');
  const isAdminPath = adminMode || location.pathname === '/admin' || searchParams.get('admin') === 'true';

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get readable tab name
  const getTabLabel = (tab?: string) => {
    switch (tab) {
      case 'catalog':
      case 'library':
        return 'School Library Catalog';
      case 'gallery':
        return 'Student Work Archive';
      case 'analytics':
        return 'Collection Reports & Analytics';
      case 'submit':
        return 'Book Recommendation Form';
      case 'moderator':
      case 'moderation':
        return 'Content Review Queue';
      case 'desk':
      case 'desk-utilities':
        return 'Circulation Desk';
      default:
        return 'School Library Portal';
    }
  };

  // Resolve target route after login
  const resolveTargetRoute = (target?: string, isAdmin?: boolean): string => {
    if (redirectPath) return redirectPath;
    if (target) {
      if (target === 'catalog' || target === 'library') return '/catalog';
      if (target === 'gallery') return '/gallery';
      if (target === 'submit') return '/submit';
      if (target === 'moderator' || target === 'moderation') return '/moderator';
      if (target === 'desk' || target === 'desk-utilities') return '/desk-utilities';
      if (target === 'analytics') return '/analytics';
      if (target === 'announcements' || target === 'bulletin') return '/announcements';
    }
    return isAdmin ? '/circulation' : '/catalog';
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Please enter both your account identifier and password.');
      return;
    }

    setIsLoading(true);

    // Brief simulation for realistic authentication feedback
    setTimeout(() => {
      if (isAdminPath) {
        // Administrative Sign-In Verification
        const isStandardAdmin = 
          (trimmedUsername.toLowerCase() === 'admin' || trimmedUsername.toLowerCase() === 'librarian') && 
          (trimmedPassword === 'admin123' || trimmedPassword === 'admin');

        if (isStandardAdmin) {
          setIsLibrarianLoggedIn(true);
          setActiveTab(targetTab || 'circulation');
          navigate(resolveTargetRoute(targetTab, true));
          setIsLoading(false);
          return;
        }

        // Check if matching staff user in school roster
        const matchedStaff = users.find(
          (u) => 
            (u.email.toLowerCase() === trimmedUsername.toLowerCase() ||
             u.libraryCardId.toLowerCase() === trimmedUsername.toLowerCase() ||
             u.name.toLowerCase() === trimmedUsername.toLowerCase())
        );

        if (matchedStaff) {
          if (matchedStaff.role === 'admin') {
            setIsLibrarianLoggedIn(true);
            setActiveTab(targetTab || 'circulation');
            navigate(resolveTargetRoute(targetTab, true));
            setIsLoading(false);
            return;
          } else if (matchedStaff.role === 'staff') {
            setCurrentUser(matchedStaff);
            setActiveTab(targetTab || 'circulation');
            navigate(resolveTargetRoute(targetTab, true));
            setIsLoading(false);
            return;
          } else {
            setError('This student account does not have administrative privileges. Please use the Library Member Sign In.');
            setIsLoading(false);
            return;
          }
        }

        setError('Invalid administrative credentials. Please verify your username and password, or contact the school administrator.');
        setIsLoading(false);
      } else {
        // Student & Faculty Member Sign-In Verification
        const matchedUser = users.find(
          (u) => 
            u.libraryCardId.toLowerCase() === trimmedUsername.toLowerCase() ||
            u.email.toLowerCase() === trimmedUsername.toLowerCase()
        );

        if (matchedUser) {
          setCurrentUser(matchedUser);
          setLoggedInLearner(matchedUser);
          setActiveTab(targetTab || 'library');
          navigate(resolveTargetRoute(targetTab, false));
          setIsLoading(false);
          return;
        }

        // Also allow admin credentials on regular login for convenience
        if (
          (trimmedUsername.toLowerCase() === 'admin' || trimmedUsername.toLowerCase() === 'librarian') &&
          (trimmedPassword === 'admin123' || trimmedPassword === 'admin')
        ) {
          setIsLibrarianLoggedIn(true);
          setActiveTab(targetTab || 'catalog');
          navigate(resolveTargetRoute(targetTab, true));
          setIsLoading(false);
          return;
        }

        setError('Library card ID or school email not found. Please check your credentials or contact the library desk.');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-[72vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md space-y-5"
      >
        {/* 1. Back to Library Home Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Back to Library Home</span>
          </button>

          {targetTab && targetTab !== 'home' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-slate-400" />
              {getTabLabel(targetTab)}
            </span>
          )}
        </div>

        {/* 2. Brand Header */}
        <div className="text-center space-y-2">
          <div className={`mx-auto h-12 w-12 rounded-2xl shadow-xs flex items-center justify-center transition-colors ${
            isAdminPath 
              ? 'bg-slate-900 text-white ring-2 ring-slate-800' 
              : 'bg-blue-600 text-white'
          }`}>
            {isAdminPath ? (
              <ShieldCheck className="w-6 h-6 text-slate-200" />
            ) : (
              <BookOpen className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="font-display font-bold text-xl sm:text-2xl tracking-tight text-slate-900">
              Premier International School
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-wider mt-0.5 uppercase">
              {isAdminPath ? 'Staff & Administration Console' : 'Digital Library System'}
            </p>
          </div>
        </div>

        {/* 3. Short Contextual Notice */}
        {isAdminPath ? (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-amber-950 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-semibold text-amber-900">Restricted Staff Console</p>
              <p className="text-amber-800/90 text-[11px]">
                Authorized faculty, librarians, and administrative staff only. All circulation and catalog management actions are audited.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <p className="font-semibold text-blue-950">Library Member Access</p>
              <p className="text-blue-800/90 text-[11px]">
                Sign in with your student or faculty library card ID to browse the complete catalog, borrow resources, and place 24-hour reserve holds.
              </p>
            </div>
          </div>
        )}

        {/* 4. Login Form Card */}
        <div className={`bg-white rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 border ${
          isAdminPath 
            ? 'border-slate-300 ring-1 ring-slate-200/60' 
            : 'border-slate-200/90'
        }`}>
          {/* Card Title & Subtitle */}
          <div className="space-y-1">
            <h2 className="font-display font-bold text-base text-slate-900">
              {isAdminPath ? 'Staff & Librarian Sign In' : 'Library Member Sign In'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {isAdminPath 
                ? 'Access circulation, notices, review queue, and administrative tools.' 
                : 'Sign in to access the full catalog, holds, and active loans.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message Box */}
            {error && (
              <div 
                role="alert" 
                className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* Username / Identifier Input */}
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700">
                {isAdminPath ? 'Staff Username or School Email' : 'School Email or Library Card ID'}
              </label>
              <div className="relative">
                {isAdminPath ? (
                  <ShieldCheck className="absolute left-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
                ) : (
                  <User className="absolute left-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
                )}
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder={isAdminPath ? "e.g. librarian or staff@premier-international.edu" : "e.g. LIB-STUD-1001 or student@school.edu"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 text-slate-400 w-4 h-4 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer transition rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button with Loading State */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs mt-3 ${
                isLoading 
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : isAdminPath
                  ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isAdminPath ? 'Authenticating Console...' : 'Signing In to Library...'}</span>
                </>
              ) : (
                <span>{isAdminPath ? 'Sign In to Console' : 'Sign In to Library'}</span>
              )}
            </button>
          </form>

          {/* 5. Support / Trust Messaging */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              If you do not have access or forgot your credentials, contact the library desk or school administrator.
            </p>
          </div>
        </div>

        {/* 6. Secondary Route-Switch Link */}
        <div className="text-center pt-1">
          {isAdminPath ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                navigate('/login');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 font-medium inline-flex items-center gap-1.5"
            >
              <span>Student or General Member?</span>
              <span className="text-blue-700 font-semibold hover:underline">Library Member Sign In →</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError(null);
                navigate('/admin');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 font-medium inline-flex items-center gap-1.5"
            >
              <span>Faculty or Library Staff?</span>
              <span className="text-slate-900 font-semibold hover:underline">Staff & Librarian Sign In →</span>
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
};
