/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookOpen, ShieldAlert, Key, User, ArrowRight, ArrowLeftRight, Home, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  targetTab?: string;
  adminMode?: boolean;
}

export const Login: React.FC<LoginProps> = ({ targetTab, adminMode }) => {
  const { 
    setIsLibrarianLoggedIn, 
    setLoggedInLearner, 
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
        return 'Book Recommendation';
      case 'moderator':
      case 'moderation':
        return 'Review Queue';
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
      setError('Please provide both your account ID and password.');
      return;
    }

    if (isAdminPath) {
      // Admin Login
      if (
        (trimmedUsername.toLowerCase() === 'admin' || trimmedUsername.toLowerCase() === 'librarian') && 
        (trimmedPassword === 'admin123' || trimmedPassword === 'admin')
      ) {
        setIsLibrarianLoggedIn(true);
        setActiveTab(targetTab || 'circulation');
        navigate(resolveTargetRoute(targetTab, true));
      } else {
        setError('Invalid administrative credentials. Please verify your username and password.');
      }
    } else {
      // Student/Staff Login
      const matchedUser = users.find(
        (u) => 
          u.libraryCardId.toLowerCase() === trimmedUsername.toLowerCase() ||
          u.email.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (matchedUser) {
        setLoggedInLearner(matchedUser);
        setActiveTab(targetTab || 'library');
        navigate(resolveTargetRoute(targetTab, false));
      } else {
        setError('Library card ID or email not found. Please check your credentials or contact the library desk.');
      }
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Back to Public Home Button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>Back to Library Home</span>
          </button>

          {targetTab && targetTab !== 'home' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3 text-slate-500" />
              Sign in for {getTabLabel(targetTab)}
            </span>
          )}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 bg-blue-600 text-white rounded-2xl shadow-sm flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900">
              Premier International School
            </h2>
            <p className="text-xs text-slate-500 font-semibold tracking-wider mt-0.5 uppercase">
              {isAdminPath ? 'Staff & Administrator Sign In' : 'Learner & Faculty Library Sign In'}
            </p>
          </div>
        </div>

        {/* Protected Notice */}
        {targetTab && targetTab !== 'home' && (
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold">Library Member Access:</span> Please sign in to access <span className="font-semibold">{getTabLabel(targetTab)}</span> and manage your loans.
            </div>
          </div>
        )}

        {/* Main Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-slate-900">
              {isAdminPath ? 'Administrator Sign In' : 'Library Member Sign In'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAdminPath 
                ? 'Enter administrative credentials to access the library management console.' 
                : 'Enter your school library card ID to access the complete catalog and your loans.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-xs font-semibold text-slate-700">
                {isAdminPath ? 'Administrator Username' : 'Library Card ID / Member ID'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  id="login-username"
                  type="text"
                  placeholder={isAdminPath ? "e.g. admin" : "e.g. LIB-STUD-1001"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 placeholder:text-slate-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password / Security PIN
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-900 placeholder:text-slate-400 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-center cursor-pointer text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs mt-2"
            >
              <span>{isAdminPath ? 'Sign In to Console' : 'Sign In to Library'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Need assistance? Visit the circulation desk or speak with the school librarian.
            </p>
          </div>
        </div>

        {/* Switch Between Student and Admin */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setError(null);
              navigate(isAdminPath ? '/login' : '/admin');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch to {isAdminPath ? 'Student / Faculty Sign In' : 'Librarian Sign In'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
