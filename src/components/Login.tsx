import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, ShieldAlert, Key, User, ArrowRight, Sparkles, GraduationCap, ArrowLeftRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Login: React.FC = () => {
  const { 
    currentPath, 
    navigateTo, 
    isLibrarianLoggedIn, 
    setIsLibrarianLoggedIn, 
    loggedInLearner, 
    setLoggedInLearner, 
    users 
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
      } else {
        setError('Invalid Library Card ID. Please use one of the active accounts shown above.');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-indigo-600 to-indigo-900 text-amber-400 rounded-2xl shadow-xl flex items-center justify-center border border-indigo-500/30">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-slate-900 leading-none">
              PREMIER INTERNATIONAL
            </h2>
            <p className="font-sans text-xs text-indigo-600 font-bold tracking-[0.2em] mt-1 uppercase">
              {isAdminPath ? 'Librarian Admin Console' : 'Student & Staff Library Hub'}
            </p>
          </div>
        </div>

        {/* Credentials Sandbox Helper Panel */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/20 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            <h4 className="font-display font-extrabold text-[11px] text-amber-900 uppercase tracking-wider">
              Sandbox Test Credentials (Active)
            </h4>
          </div>

          {isAdminPath ? (
            <div className="space-y-2 text-xs text-amber-800">
              <p className="leading-relaxed text-[11px]">
                Enter the administrator credentials below or click auto-fill:
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
                Select any registered school profile to simulate instant student or teacher login:
              </p>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-white/80 border border-amber-200/60 rounded-xl p-2.5 font-mono text-[11px] flex justify-between items-center">
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800">Chidi Okafor</span> (Student)
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
                    <span className="font-bold text-slate-800">Mrs. Emily Cole</span> (Teacher)
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
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-lg text-slate-900">
              {isAdminPath ? 'Staff Sign In' : 'Sign In to Portal'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAdminPath ? 'Enter librarian database credentials to proceed.' : 'Use your library card barcode ID to log in.'}
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
                {isAdminPath ? 'Username' : 'Library Card ID / Username'}
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
                {isAdminPath ? 'Password is: admin123' : 'Any password accepted during testing'}
              </p>
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center cursor-pointer text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md ${
                isAdminPath 
                  ? 'bg-gradient-to-r from-indigo-900 to-indigo-950 hover:from-indigo-850 hover:to-indigo-900' 
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700'
              }`}
            >
              <span>{isAdminPath ? 'Log In to Console' : 'Sign In to Library Hub'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Navigation Switch Bridge */}
        <div className="text-center pt-2">
          <button
            onClick={() => navigateTo(isAdminPath ? '/' : '/admin')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer py-1 px-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/60 rounded-full"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
            <span>Switch to {isAdminPath ? 'Student / Staff Login' : 'Librarian Admin Login'}</span>
          </button>
        </div>

      </motion.div>
    </div>
  );
};
