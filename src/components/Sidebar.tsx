/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  BookOpen, 
  LayoutDashboard, 
  Library, 
  ScanLine, 
  ShieldAlert, 
  Users, 
  BarChart3, 
  PenTool, 
  Sparkles, 
  Award, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Building2, 
  Backpack, 
  Layers, 
  GraduationCap,
  X,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  isFolded: boolean;
  setIsFolded: (folded: boolean | ((prev: boolean) => boolean)) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  isFolded,
  setIsFolded,
}) => {
  const { 
    currentUser,
    loggedInLearner,
    isLearner,
    isStaff,
    isAdmin,
    activeSection,
    setActiveSection,
    submissions,
    setIsRosterModalOpen,
    logout
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  // Pending moderation submissions count
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pending').length;

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileOpen(false);
  };

  // Nav Items Definitions based on role
  interface NavItem {
    label: string;
    path?: string;
    action?: () => void;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }

  const learnerNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Book Catalog', path: '/catalog', icon: BookOpen },
    { label: 'Submit Review', path: '/submit', icon: PenTool },
    { label: 'Creative Gallery', path: '/gallery', icon: Sparkles },
  ];

  const staffNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Catalog Holdings', path: '/catalog', icon: BookOpen },
    { 
      label: 'Review Queue', 
      path: '/moderator', 
      icon: ShieldAlert, 
      badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined,
      badgeColor: 'bg-blue-600 text-white'
    },
    { label: 'Library Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Creative Gallery', path: '/gallery', icon: Sparkles },
  ];

  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Catalog Management', path: '/catalog', icon: BookOpen },
    { label: 'Circulation Desk', path: '/circulation', icon: Library },
    { label: 'Desk Utilities', path: '/desk-utilities', icon: ScanLine },
    { 
      label: 'Review Queue', 
      path: '/moderator', 
      icon: ShieldAlert, 
      badge: pendingSubmissionsCount > 0 ? pendingSubmissionsCount : undefined,
      badgeColor: 'bg-blue-600 text-white'
    },
    { 
      label: 'Class Rosters', 
      action: () => {
        setIsRosterModalOpen(true);
        setIsMobileOpen(false);
      }, 
      icon: Users 
    },
    { label: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { label: 'Creative Gallery', path: '/gallery', icon: Award },
  ];

  const navItems = isAdmin 
    ? adminNavItems 
    : isStaff 
    ? staffNavItems 
    : learnerNavItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 select-none">
      
      {/* 1. Header / Brand & Fold Toggle */}
      <div className={`p-4 flex items-center border-b border-slate-800/80 ${isFolded ? 'justify-center' : 'justify-between'}`}>
        {!isFolded && (
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => handleNavClick('/dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer group outline-none min-w-0"
              title="LibraryHub Dashboard"
            >
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFolded(true);
                }}
                title="Collapse Sidebar"
                className="p-2 bg-blue-600 group-hover:bg-blue-500 rounded-xl text-white shadow-xs flex items-center justify-center transition"
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-display font-bold text-base tracking-tight text-white leading-none">
                  Library<span className="text-blue-400">Hub</span>
                </span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5 truncate">
                  Premier Int'l School
                </span>
              </div>
            </button>

            {/* Invisible collapse button - feature remains fully functional */}
            <button
              type="button"
              onClick={() => setIsFolded(true)}
              className="hidden md:flex p-1.5 rounded-lg opacity-0 hover:opacity-100 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Collapse Sidebar"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {isFolded && (
          <button
            type="button"
            onClick={() => setIsFolded(false)}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white shadow-xs flex items-center justify-center transition cursor-pointer"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <BookOpen className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close Mobile Menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Gap between logo and navigation icons preserved after removing profile card */}
      <div className="h-[3.75rem] shrink-0" aria-hidden="true" />

      {/* 3. Section Switcher for Admins & Staff */}
      {(isAdmin || isStaff) && !isFolded && (
        <div className="p-3 border-b border-slate-800/60">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Campus Scope</span>
          </div>
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-950/70 rounded-xl border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setActiveSection('all')}
              className={`py-1 rounded-lg font-bold transition text-center cursor-pointer ${
                activeSection === 'all' 
                  ? 'bg-amber-400 text-slate-950 shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="All Holdings"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('primary')}
              className={`py-1 rounded-lg font-bold transition text-center cursor-pointer ${
                activeSection === 'primary' 
                  ? 'bg-teal-500 text-slate-950 shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Primary Campus"
            >
              Primary
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('college')}
              className={`py-1 rounded-lg font-bold transition text-center cursor-pointer ${
                activeSection === 'college' 
                  ? 'bg-blue-500 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Secondary Campus"
            >
              Secondary
            </button>
          </div>
        </div>
      )}

      {/* 4. Navigation Links */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {!isFolded && (
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
            Menu
          </div>
        )}

        {navItems.map((item) => {
          const isActive = item.path ? location.pathname === item.path : false;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.path) {
                  handleNavClick(item.path);
                }
              }}
              className={`w-full flex items-center rounded-xl font-medium text-xs transition cursor-pointer group ${
                isFolded 
                  ? 'p-2.5 justify-center' 
                  : 'px-3 py-2.5 gap-3 text-left'
              } ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xs font-bold' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
              title={item.label}
            >
              <Icon className={`shrink-0 transition-transform ${isFolded ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
              
              {!isFolded && (
                <span className="flex-1 truncate">
                  {item.label}
                </span>
              )}

              {/* Badge */}
              {item.badge !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-blue-500 text-white'} ${isFolded ? 'absolute top-1 right-1 w-2 h-2 p-0' : ''}`}>
                  {!isFolded && item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 5. Footer / Sign Out */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition cursor-pointer ${
            isFolded ? 'p-2.5 justify-center' : 'px-3 py-2 gap-2.5'
          }`}
          title="Sign Out of LibraryHub"
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {!isFolded && <span>Sign Out</span>}
        </button>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop Sticky Foldable Sidebar */}
      <aside 
        className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 shadow-md h-screen sticky top-0 z-30 overflow-hidden ${
          isFolded ? 'w-[4.5rem]' : 'w-64'
        }`}
        aria-label="Application Main Sidebar"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 240 }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
