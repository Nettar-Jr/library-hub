import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, ShieldAlert, Key, User, ArrowRight, Sparkles, ArrowLeftRight, Home, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  targetTab?: string;
}

export const Login: React.FC<LoginProps> = ({ targetTab }) => {
  const { 
    currentPath, 
    navigateTo, 
    isLibrarianLoggedIn, 
    setIsLibrarianLoggedIn, 
    loggedInLearner, 
    setLoggedInLearner, 
    users,
    setActiveTab
  } = useApp();

  const isAdminPath = currentPath === '/admin';

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-fill Helpers
  const handleAutoFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setError(null);
  };

  const handleAutoFillLearner = (cardId: string) => {
    setUsername(cardId);
    setPassword('password123');
    setError(null);
  };

  // Get readable tab name
  const getTabLabel = (tab?: string) => {
    switch (tab) {
      case 'library':
        return 'Library Hub & Catalog';
      case 'gallery':
        return 'Creative Gallery';
      case 'analytics':
        return 'Library Analytics & Popular Trends';
      case 'submit':
        return 'Creative Submission Form';
      case 'moderation':
        return 'Librarian Moderation Workspace';
      case 'desk':
        return 'Circulation Desk & Utilities';
      default:
        return 'Member Portal';
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setError('Please fill in both fields.');
      return;
    }

    if (isAdminPath) {
      // Admin Login
      if (
        (trimmedUsername.toLowerCase() === 'admin' || trimmedUsername.toLowerCase() === 'librarian') && 
        (trimmedPassword === 'admin123' || trimmedPassword === 'admin')
      ) {
        setIsLibrarianLoggedIn(true);
        if (targetTab && targetTab !== 'home') {
          setActiveTab(targetTab);
        } else {
          setActiveTab('library');
        }
      } else {
        setError('Invalid admin username or password. Check the credentials displayed above.');
      }
    } else {
      // Student/Staff Login
      const matchedUser = users.find(
        (u) => u.libraryCardId.toLowerCase() === trimmedUsername.toLowerCase()
      );

      if (matchedUser) {
        setLoggedInLearner(matchedUser);
        if (targetTab && targetTab !== 'home') {
          setActiveTab(targetTab);
        } else {
          setActiveTab('library');
        }
      } else {
        setError('Invalid Library Card ID. Please use one of the active accounts shown above.');
      }
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center py-6 px-4 sm:px-6">
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Back to Public Home Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              setActiveTab('home');
              if (isAdminPath) {
                navigateTo('/');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-900 transition cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>← Back to Public Homepage</span>
          </button>

          {targetTab && targetTab !== 'home' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3 text-amber-600" />
              Sign in for {getTabLabel(targetTab)}
            </span>
          )}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 bg-gradient-to-tr from-indigo-600 to-indigo-950 text-amber-400 rounded-2xl shadow-lg flex items-center justify-center border border-indigo-500/30">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight text-slate-900 leading-tight">
              PREMIER INTERNATIONAL
            </h2>
            <p className="font-sans text-xs text-indigo-600 font-bold tracking-[0.2em] mt-0.5 uppercase">
              {isAdminPath ? 'Librarian & Admin Console' : 'Student & Staff Library Portal'}
            </p>
          </div>
        </div>

        {/* Informative Restricted Access Banner */}
        {targetTab && targetTab !== 'home' && (
          <div className="bg-indigo-50/80 border border-indigo-200/80 rounded-2xl p-3.5 text-xs text-indigo-900 flex items-start gap-2.5 shadow-2xs">
            <Lock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Access Protected:</span> The <span className="underline font-semibold">{getTabLabel(targetTab)}</span> and school library collections are reserved for enrolled students and authorized faculty.
            </div>
          </div>
        )}

        {/* Credentials Quick Access Helper Panel */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/20 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <h4 className="font-display font-extrabold text-[11px] text-amber-900 uppercase tracking-wider">
              Quick Login & Profile Selection
            </h4>
          </div>

          {isAdminPath ? (
            <div className="space-y-2 text-xs text-amber-800">
              <p className="leading-relaxed text-[11px]">
                Click auto-fill to sign in with administrator credentials:
              </p>
              <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2.5 font-mono text-[11px] flex justify-between items-center">
                <div>
                  <div><span className="font-bold">Username:</span> admin</div>
                  <div><span className="font-bold">Password:</span> admin123</div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillAdmin}
                  className="bg-amber-600 text-white font-sans font-bold text-[10px] px-2.5 py-1.5 rounded-lg hover:bg-amber-500 transition cursor-pointer"
                >
                  Auto-fill Admin
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-amber-800">
              <p className="leading-relaxed text-[11px]">
                Select any registered school profile to sign in:
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2.5 font-mono text-[11px] flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800">Chidi Okafor</span> (Grade 10 Student)
                    <div className="text-[10px] text-slate-500">Card ID: LIB-STUD-1001</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillLearner('LIB-STUD-1001')}
                    className="bg-indigo-600 text-white font-sans font-bold text-[9px] px-2.5 py-1.5 rounded-lg hover:bg-indigo-500 transition cursor-pointer shrink-0"
                  >
                    Use Card
                  </button>
                </div>

                <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2.5 font-mono text-[11px] flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800">Mrs. Emily Cole</span> (Literature Teacher)
                    <div className="text-[10px] text-slate-500">Card ID: LIB-TEACH-2001</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillLearner('LIB-TEACH-2001')}
                    className="bg-emerald-600 text-white font-sans font-bold text-[9px] px-2.5 py-1.5 rounded-lg hover:bg-emerald-500 transition cursor-pointer shrink-0"
                  >
                    Use Card
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-900">
              {isAdminPath ? 'Staff Administration Sign In' : 'Student & Staff Member Sign In'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAdminPath ? 'Enter librarian credentials to access management console.' : 'Enter your school library card ID to unlock the full library.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {isAdminPath ? 'Admin Username' : 'Library Card ID / Username'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={isAdminPath ? "e.g. admin" : "e.g. LIB-STUD-1001"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Password
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">
                {isAdminPath ? 'Default: admin123' : 'Enter your library PIN / password'}
              </p>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md ${
                isAdminPath 
                  ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 hover:from-indigo-800 hover:to-indigo-900' 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700'
              }`}
            >
              <span>{isAdminPath ? 'Authenticate & Enter Console' : 'Sign In & Unlock Library'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Navigation Switch Bridge */}
        <div className="text-center pt-1">
          <button
            onClick={() => navigateTo(isAdminPath ? '/' : '/admin')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer py-1.5 px-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/60 rounded-full"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
            <span>Switch to {isAdminPath ? 'Student / Staff Login' : 'Librarian Admin Login'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
