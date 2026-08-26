/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppRole } from '../types';
import { 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  ChevronDown, 
  Sparkles, 
  Check, 
  Settings2, 
  UserCheck,
  BookOpen,
  Eye,
  UserX,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const RoleSwitchBanner: React.FC = () => {
  const { 
    userRole, 
    setUserRole, 
    currentUser, 
    users, 
    switchRolePreset, 
    setIsRosterModalOpen,
    isAdmin,
    isStaff,
    isLearner,
    isLoggedIn
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);

  const learners = users.filter((u) => u.role === 'learner' || u.role === 'student');
  const teachers = users.filter((u) => u.role === 'staff' || u.role === 'teacher');

  const roleConfigs: {
    role: AppRole | 'GUEST';
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeColor: string;
    buttonColor: string;
  }[] = [
    {
      role: 'GUEST',
      title: 'Visitor / Guest (Logged Out)',
      description: 'Open public discovery, book browsing, and zero-friction login gateways',
      icon: UserX,
      accentColor: 'from-slate-600 to-slate-800',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      buttonColor: 'bg-slate-700 hover:bg-slate-600 text-white font-bold',
    },
    {
      role: 'LEARNER',
      title: 'Learner (Child)',
      description: 'Visual GetEpic-style discovery, audiobooks, personal loans, & creative writing publishing',
      icon: BookOpen,
      accentColor: 'from-blue-600 to-teal-500',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      role: 'STAFF',
      title: 'Staff (Teacher)',
      description: 'Classroom roster monitoring, review submissions from your assigned class, and student achievements',
      icon: GraduationCap,
      accentColor: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      role: 'ADMIN',
      title: 'Admin (Librarian)',
      description: 'Circulation desk, overdue notifications, roster assignment tool, catalog restocking & metrics',
      icon: ShieldCheck,
      accentColor: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      buttonColor: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black',
    },
  ];

  const currentConfig = !isLoggedIn 
    ? roleConfigs[0] 
    : roleConfigs.find((r) => r.role === userRole) || roleConfigs[1];

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 text-xs px-3 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5">
        
        {/* Active Role Indicator */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 font-bold flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-amber-400" /> Perspective:
            </span>
            
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-3 py-1 rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                !isLoggedIn 
                  ? 'bg-slate-400' 
                  : userRole === 'ADMIN' 
                  ? 'bg-amber-400 animate-pulse' 
                  : userRole === 'STAFF' 
                  ? 'bg-emerald-400' 
                  : 'bg-blue-400'
              }`} />
              <span className="font-extrabold text-white text-xs">
                {currentConfig.title}
              </span>
              {currentUser && (
                <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">
                  — {currentUser.name} {currentUser.gradeOrYear ? `(${currentUser.gradeOrYear})` : currentUser.department ? `(${currentUser.department})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Quick Roster Modal Launcher for Admin / Staff */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsRosterModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-full font-bold text-[10px] tracking-wide transition cursor-pointer"
            >
              <Users className="w-3 h-3" />
              <span>Manage Class Rosters</span>
            </button>
          )}
        </div>

        {/* Role Quick Switch Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none justify-end">
          <span className="text-[10px] font-mono text-slate-400 uppercase hidden lg:inline mr-1">
            Simulate Role:
          </span>

          {roleConfigs.map((cfg) => {
            const isSelected = cfg.role === 'GUEST' ? !isLoggedIn : isLoggedIn && userRole === cfg.role;
            const CfgIcon = cfg.icon;
            return (
              <button
                key={cfg.role}
                type="button"
                onClick={() => switchRolePreset(cfg.role)}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? `${cfg.buttonColor} shadow-sm ring-2 ring-white/20 font-black`
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <CfgIcon className="w-3.5 h-3.5" />
                <span>
                  {cfg.role === 'GUEST' 
                    ? 'Logged Out' 
                    : cfg.role === 'LEARNER' 
                    ? 'Learners' 
                    : cfg.role === 'STAFF' 
                    ? 'Staff' 
                    : 'Admin'}
                </span>
              </button>
            );
          })}

          {/* Specific Persona Selector Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition cursor-pointer"
              title="Select specific person"
              aria-label="Select specific user profile"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu for Persona Picking */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-[11px] font-black uppercase text-slate-400">
                      Switch Active Persona
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Public Guest / Logged Out Option */}
                  <div
                    onClick={() => {
                      switchRolePreset('GUEST');
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-slate-100 transition ${
                      !isLoggedIn ? 'bg-slate-200 font-bold' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserX className="w-3.5 h-3.5 text-slate-600" />
                      <div>
                        <span className="text-slate-900 font-semibold">Public Guest (Logged Out)</span>
                        <span className="block text-[10px] text-slate-500">Unauthenticated visitor view</span>
                      </div>
                    </div>
                  </div>

                  {/* Learners */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                      Learners (Students)
                    </span>
                    {learners.slice(0, 4).map((learner) => (
                      <div
                        key={learner.id}
                        onClick={() => {
                          switchRolePreset('LEARNER', learner.id);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-blue-50 transition ${
                          currentUser?.id === learner.id ? 'bg-blue-100/70 font-bold' : ''
                        }`}
                      >
                        <div>
                          <span className="text-slate-900 font-semibold">{learner.name}</span>
                          <span className="block text-[10px] text-slate-500">{learner.gradeOrYear || 'Learner'}</span>
                        </div>
                        {learner.assignedTeacherName && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {learner.assignedTeacherName.split(' ')[1] || 'Staff'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Teachers */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                      Staff (Teachers)
                    </span>
                    {teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        onClick={() => {
                          switchRolePreset('STAFF', teacher.id);
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-emerald-50 transition ${
                          currentUser?.id === teacher.id ? 'bg-emerald-100/70 font-bold' : ''
                        }`}
                      >
                        <div>
                          <span className="text-slate-900 font-semibold">{teacher.name}</span>
                          <span className="block text-[10px] text-slate-500">{teacher.department || 'Faculty'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Admin */}
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">
                      Librarian (Admin)
                    </span>
                    <div
                      onClick={() => {
                        switchRolePreset('ADMIN');
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer text-xs hover:bg-amber-50 transition ${
                        isLoggedIn && userRole === 'ADMIN' ? 'bg-amber-100/70 font-bold' : ''
                      }`}
                    >
                      <div>
                        <span className="text-slate-900 font-semibold">Librarian Abdul Alabi</span>
                        <span className="block text-[10px] text-slate-500">Chief Library Administrator</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </div>
  );
};
