/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useApp, getGradeLevelForUser } from '../context/AppContext';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Please enter both your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. First attempt to authenticate against Supabase database if configured
      let cloudUser = null;
      if (isSupabaseConfigured) {
        try {
          const { data, error: sbError } = await queryUserFromSupabase(trimmedUsername);
          if (!sbError && data) {
            cloudUser = data;
          }
        } catch (dbErr) {
          console.warn('Supabase query error during login:', dbErr);
        }
      }

      const normalizedInput = trimmedUsername.toLowerCase();
      // Look up target user from Supabase or context by email, username prefix, library card, admission number, or name
      const targetUser = cloudUser || users.find(
        (u) => {
          const uEmail = (u.email || '').toLowerCase();
          const uCard = (u.libraryCardId || '').toLowerCase();
          const uAdm = (u.admissionNumber || '').toLowerCase();
          const uName = (u.name || '').toLowerCase();
          const uPrefix = uEmail.split('@')[0];

          return (
            uEmail === normalizedInput ||
            uCard === normalizedInput ||
            uAdm === normalizedInput ||
            uName === normalizedInput ||
            uPrefix === normalizedInput
          );
        }
      );

      // Helper function for password matching (case-tolerant and trim-tolerant)
      const verifyPassword = (storedPass?: string, inputPass?: string): boolean => {
        if (!storedPass || !inputPass) return false;
        const s = storedPass.trim();
        const inp = inputPass.trim();
        return s === inp || s.toLowerCase() === inp.toLowerCase();
      };

      if (isAdminPath) {
        if (targetUser) {
          // If password is set on the account, verify it matches
          if (targetUser.password && !verifyPassword(targetUser.password, trimmedPassword)) {
            setError('Incorrect password. Please verify your credentials.');
            setIsLoading(false);
            return;
          }

          if (targetUser.role === 'admin' || targetUser.role === 'librarian') {
            setCurrentUser(targetUser);
            setIsLibrarianLoggedIn(true, targetUser);
            if (targetUser.section === 'primary') {
              setActiveSection('primary');
            } else if (targetUser.section === 'college') {
              setActiveSection('college');
            }
            setActiveTab(targetTab || 'dashboard');
            navigate(resolveTargetRoute(targetTab, true));
            setIsLoading(false);
            return;
          } else if (targetUser.role === 'staff' || targetUser.role === 'teacher') {
            setCurrentUser(targetUser);
            setActiveTab(targetTab || 'dashboard');
            navigate(resolveTargetRoute(targetTab, true));
            setIsLoading(false);
            return;
          } else {
            setError('This account does not have staff privileges. Please use Learner Login.');
            setIsLoading(false);
            return;
          }
        }

        setError('Invalid educator credentials. Please verify your email and password.');
        setIsLoading(false);
      } else {
        if (targetUser) {
          // Verify password or admission number
          const expectedPassword = targetUser.password || targetUser.admissionNumber;
          if (expectedPassword && !verifyPassword(expectedPassword, trimmedPassword)) {
            setError('Incorrect password. Please verify your credentials.');
            setIsLoading(false);
            return;
          }

          if (targetUser.role === 'admin' || targetUser.role === 'librarian') {
            setCurrentUser(targetUser);
            setIsLibrarianLoggedIn(true, targetUser);
            if (targetUser.section === 'primary') {
              setActiveSection('primary');
            } else if (targetUser.section === 'college') {
              setActiveSection('college');
            }
            setActiveTab(targetTab || 'dashboard');
            navigate(resolveTargetRoute(targetTab, true));
          } else if (targetUser.role === 'staff' || targetUser.role === 'teacher') {
            setCurrentUser(targetUser);
            setActiveTab(targetTab || 'dashboard');
            navigate(resolveTargetRoute(targetTab, true));
          } else {
            setCurrentUser(targetUser);
            setLoggedInLearner(targetUser);
            const studentGrade = getGradeLevelForUser(targetUser, 'college');
            setActiveSection(studentGrade === 'primary' ? 'primary' : 'college');
            setActiveTab(targetTab || 'dashboard');
            navigate(resolveTargetRoute(targetTab, false));
          }
          setIsLoading(false);
          return;
        }

        setError('Learner email or card ID not found. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[72vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl p-7 sm:p-9 border border-slate-200/90 shadow-xs flex flex-col gap-6"
      >
        {/* Title in brand color */}
        <h1 className="font-display font-black text-2xl sm:text-3xl text-center text-blue-600 tracking-tight">
          {isAdminPath ? 'Staff Login' : 'Learner Login'}
        </h1>

        {/* Faint grey text with hr lines extending to the full width of the input fields */}
        <div className="flex items-center justify-center w-full my-2 py-1 relative">
          <div className="flex-grow h-px bg-slate-200" aria-hidden="true" />
          <span className="px-3.5 text-slate-400 text-xs sm:text-sm font-normal whitespace-nowrap select-none bg-white">
            {isAdminPath ? 'log in with educator email' : 'log in with learner email'}
          </span>
          <div className="flex-grow h-px bg-slate-200" aria-hidden="true" />
        </div>

        {/* Error Alert if any */}
        {error && (
          <div 
            role="alert" 
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-1">
          {/* Input field 1: Username / Email without icons */}
          <div className="w-full relative">
            <input
              id="login-username"
              type="text"
              required
              autoComplete="username"
              placeholder={isAdminPath ? "Educator email or username" : "Learner email or card ID"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition shadow-2xs"
            />
          </div>

          {/* Input field 2: Password with ONLY the eye icon to show/hide */}
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 font-medium transition shadow-2xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition rounded"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Login button: same width as input fields, brand color background */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl text-sm sm:text-base font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-2 shadow-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        {/* Minimalist switcher between Learner and Staff */}
        <div className="text-center pt-1">
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
              Staff member? <span className="text-blue-600 font-semibold underline">Staff Login</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
