/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Minus, 
  BookOpen, 
  Trophy, 
  Flame, 
  Edit3, 
  Save, 
  RotateCcw,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PersonalReadingGoalsProps {
  compact?: boolean;
}

export const PersonalReadingGoals: React.FC<PersonalReadingGoalsProps> = ({ compact = false }) => {
  const { currentUser, circulation, currentLearnerName, loggedInLearner } = useApp();

  const currentMonthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());
  const monthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  const learnerId = currentUser?.id || loggedInLearner?.id || 'learner-guest';
  const storageKey = `p_reading_goals_${learnerId}_${monthKey}`;

  // State: Target book count (default 4) and manual/offline read bonus books
  const [targetCount, setTargetCount] = useState<number>(4);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);
  const [tempTarget, setTempTarget] = useState<number>(4);

  // Load from localStorage on mount or user change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.target === 'number' && parsed.target > 0) {
          setTargetCount(parsed.target);
          setTempTarget(parsed.target);
        }
        if (typeof parsed.offlineCount === 'number' && parsed.offlineCount >= 0) {
          setOfflineCount(parsed.offlineCount);
        }
      }
    } catch (e) {
      console.warn('Failed to load reading goals from storage:', e);
    }
  }, [storageKey]);

  // Save to localStorage when target or offlineCount changes
  const saveGoalData = (newTarget: number, newOfflineCount: number) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        target: newTarget,
        offlineCount: newOfflineCount,
        updatedAt: new Date().toISOString(),
      }));
    } catch (e) {
      console.warn('Failed to save reading goals to storage:', e);
    }
  };

  // Calculate books read this month from automated circulation loans
  const currentLearnerQuery = (currentUser?.name || currentLearnerName || '').toLowerCase().trim();
  
  const thisMonthLoanCount = circulation.filter((record) => {
    const isLearnerMatch = 
      record.learnerName.toLowerCase().includes(currentLearnerQuery) ||
      currentLearnerQuery.includes(record.learnerName.toLowerCase().split('(')[0].trim());

    if (!isLearnerMatch) return false;

    // Check if borrowed or returned in the current month/year
    const dateToCheck = record.returnDate || record.borrowDate;
    if (!dateToCheck) return false;

    const recordDate = new Date(dateToCheck);
    const now = new Date();
    return (
      recordDate.getFullYear() === now.getFullYear() &&
      recordDate.getMonth() === now.getMonth()
    );
  }).length;

  const totalReadCount = thisMonthLoanCount + offlineCount;
  const progressPercent = Math.min(100, Math.round((totalReadCount / targetCount) * 100));
  const isGoalAchieved = totalReadCount >= targetCount;
  const remaining = Math.max(0, targetCount - totalReadCount);

  const handleSaveTarget = () => {
    const validTarget = Math.max(1, Math.min(50, tempTarget || 1));
    setTargetCount(validTarget);
    saveGoalData(validTarget, offlineCount);
    setIsEditingTarget(false);
  };

  const handleAddOfflineBook = () => {
    const next = offlineCount + 1;
    setOfflineCount(next);
    saveGoalData(targetCount, next);
  };

  const handleSubtractOfflineBook = () => {
    if (offlineCount > 0) {
      const next = offlineCount - 1;
      setOfflineCount(next);
      saveGoalData(targetCount, next);
    }
  };

  const presetTargets = [2, 4, 6, 8, 10, 12];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs transition-all ${compact ? 'p-5' : 'p-6 sm:p-7'}`}>
      {/* Header with Icon, Month & Target Edit Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>Personal Reading Goals</span>
              {isGoalAchieved && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Trophy className="w-3 h-3 text-emerald-600" />
                  Target Met!
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Monthly target for <strong className="text-slate-700">{currentMonthYear}</strong>
            </p>
          </div>
        </div>

        {/* Target Indicator & Edit Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEditingTarget ? (
            <button
              type="button"
              onClick={() => {
                setTempTarget(targetCount);
                setIsEditingTarget(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-xl transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Target: {targetCount} {targetCount === 1 ? 'Book' : 'Books'}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-blue-200">
              <input
                type="number"
                min="1"
                max="50"
                value={tempTarget}
                onChange={(e) => setTempTarget(parseInt(e.target.value, 10) || 1)}
                className="w-14 px-2 py-1 text-xs font-bold text-center bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-slate-900"
              />
              <button
                type="button"
                onClick={handleSaveTarget}
                className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition cursor-pointer shadow-2xs"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Target Quick Presets (when editing) */}
      <AnimatePresence>
        {isEditingTarget && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-3 pb-2 flex flex-wrap items-center gap-1.5 text-xs"
          >
            <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Select:</span>
            {presetTargets.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setTempTarget(num)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  tempTarget === num
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {num} books
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Metric & Bar */}
      <div className="mt-5 space-y-3">
        {/* Count Numbers & Percentage */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
              {totalReadCount}
            </span>
            <span className="text-sm font-bold text-slate-400">
              / {targetCount} {targetCount === 1 ? 'book' : 'books'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-bold">
            <span className={`text-sm font-black ${isGoalAchieved ? 'text-emerald-600' : 'text-blue-600'}`}>
              {progressPercent}%
            </span>
            <span className="text-slate-400 font-normal">completed</span>
          </div>
        </div>

        {/* Progress Bar Track */}
        <div className="relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full transition-all ${
              isGoalAchieved
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs'
                : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 shadow-xs'
            }`}
          />
        </div>

        {/* Status Motivation Note & Remaining Tally */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
          <p className="text-slate-600 font-medium flex items-center gap-1.5">
            {isGoalAchieved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-emerald-800">
                  Incredible job! You've achieved your reading goal for {currentMonthYear}!
                </span>
              </>
            ) : (
              <>
                <Flame className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Only <strong className="text-slate-900 font-bold">{remaining} more {remaining === 1 ? 'book' : 'books'}</strong> to conquer your monthly target!
                </span>
              </>
            )}
          </p>

          {/* Breakdown summary */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Library loans: <strong className="text-slate-800 font-semibold">{thisMonthLoanCount}</strong></span>
            <span>•</span>
            <span>Logged offline: <strong className="text-slate-800 font-semibold">{offlineCount}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Strip: Log Offline Read Book or Adjust */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-[11px] text-slate-500">
          Finished reading a physical or personal book at home?
        </span>

        <div className="flex items-center gap-2">
          {offlineCount > 0 && (
            <button
              type="button"
              onClick={handleSubtractOfflineBook}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              title="Decrement logged book"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleAddOfflineBook}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition cursor-pointer shadow-2xs border border-blue-200/80"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Log Finished Book (+1)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
