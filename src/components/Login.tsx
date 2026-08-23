import React, { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { BookOpen, ShieldAlert, Key, User, ArrowRight, Sparkles, ArrowLeftRight, Home, Lock } from 'lucide-react';
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
      case 'catalog':
      case 'library':
        return 'Library Hub & Catalog';
      case 'gallery':
        return 'Creative Gallery';
      case 'analytics':
        return 'Library Analytics & Popular Trends';
      case 'submit':
        return 'Creative Submission Form';
      case 'moderator':
      case 'moderation':
        return 'Librarian Moderation Workspace';
      case 'desk':
      case 'desk-utilities':
        return 'Circulation Desk & Utilities';
      default:
        return 'Member Portal';
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
    return isAdmin ? '/moderator' : '/catalog';
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
        setActiveTab(targetTab || 'moderation');
        navigate(resolveTargetRoute(targetTab, true));
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
        setActiveTab(targetTab || 'library');
        navigate(resolveTargetRoute(targetTab, false));
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
            type="button"
            onClick={() => {
              setActiveTab('home');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-950 transition cursor-pointer px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <Home className="w-4 h-4 text-slate-500" />
            <span>← Back to Public Homepage</span>
          </button>

          {targetTab && targetTab !== 'home' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
              <Lock className="w-3 h-3 text-amber-700" />
              Sign in for {getTabLabel(targetTab)}
            </span>
          )}
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 bg-gradient-to-tr from-indigo-900 to-slate-950 text-amber-400 rounded-2xl shadow-lg flex items-center justify-center border border-indigo-700/40">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl tracking-tight text-slate-900 leading-tight">
              PREMIER INTERNATIONAL
            </h2>
            <p className="font-sans text-xs text-indigo-900 font-black tracking-[0.2em] mt-0.5 uppercase">
              {isAdminPath ? 'Librarian & Admin Console' : 'Student & Staff Library Portal'}
            </p>
          </div>
        </div>

        {/* Informative Restricted Access Banner */}
        {targetTab && targetTab !== 'home' && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 text-xs text-indigo-950 flex items-start gap-2.5 shadow-2xs">
            <Lock className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold">Access Protected:</span> The <span className="underline font-semibold">{getTabLabel(targetTab)}</span> and school library collections are reserved for enrolled students and authorized faculty.
            </div>
          </div>
        )}

        {/* Credentials Quick Access Helper Panel */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
            <h4 className="font-display font-black text-xs text-amber-950 uppercase tracking-wider">
              Quick Login & Profile Selection
            </h4>
          </div>

          {isAdminPath ? (
            <div className="space-y-2 text-xs text-amber-950">
              <p className="leading-relaxed text-xs">
                Click auto-fill to sign in with administrator credentials:
              </p>
              <div className="bg-white border border-amber-300 rounded-xl p-3 font-mono text-xs flex justify-between items-center">
                <div>
                  <div><span className="font-bold">Username:</span> admin</div>
                  <div><span className="font-bold">Password:</span> admin123</div>
                </div>
                <button
                  type="button"
                  onClick={handleAutoFillAdmin}
                  className="bg-amber-700 text-white font-sans font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-amber-600 transition cursor-pointer"
                >
                  Auto-fill Admin
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-amber-950">
              <p className="leading-relaxed text-xs">
                Select any registered school profile to sign in:
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-white border border-amber-300 rounded-xl p-2.5 font-mono text-xs flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900">Chidi Okafor</span> (Grade 10 Student)
                    <div className="text-[10px] text-slate-600">Card ID: LIB-STUD-1001</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillLearner('LIB-STUD-1001')}
                    className="bg-indigo-950 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-indigo-900 transition cursor-pointer shrink-0"
                  >
                    Use Card
                  </button>
                </div>

                <div className="bg-white border border-amber-300 rounded-xl p-2.5 font-mono text-xs flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-900">Mrs. Emily Cole</span> (Literature Teacher)
                    <div className="text-[10px] text-slate-600">Card ID: LIB-TEACH-2001</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutoFillLearner('LIB-TEACH-2001')}
                    className="bg-emerald-800 text-white font-sans font-bold text-[10px] px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer shrink-0"
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
            <h3 className="font-display font-black text-base sm:text-lg text-slate-900">
              {isAdminPath ? 'Staff Administration Sign In' : 'Student & Staff Member Sign In'}
            </h3>
            <p className="text-xs text-slate-600">
              {isAdminPath ? 'Enter librarian credentials to access management console.' : 'Enter your school library card ID to unlock the full library.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-950 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="login-username" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono">
                {isAdminPath ? 'Admin Username' : 'Library Card ID / Username'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                <input
                  id="login-username"
                  type="text"
                  placeholder={isAdminPath ? "e.g. admin" : "e.g. LIB-STUD-1001"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 transition-all font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="login-password" className="block text-[11px] font-black text-slate-700 uppercase tracking-wider font-mono">
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
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-600 transition-all font-mono text-slate-900"
                />
              </div>
              <p className="text-[10px] text-slate-500 italic">
                {isAdminPath ? 'Default: admin123' : 'Default password: password123'}
              </p>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md ${
                isAdminPath 
                  ? 'bg-gradient-to-r from-indigo-950 to-slate-900 hover:from-indigo-900 hover:to-indigo-950' 
                  : 'bg-gradient-to-r from-indigo-900 to-indigo-950 hover:from-indigo-800 hover:to-indigo-900'
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
            type="button"
            onClick={() => navigate(isAdminPath ? '/login' : '/admin')}
            className="inline-flex items-center gap-2 text-xs font-bold text-indigo-900 hover:text-indigo-950 transition cursor-pointer py-2 px-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-700" />
            <span>Switch to {isAdminPath ? 'Student / Staff Login' : 'Librarian Admin Login'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
