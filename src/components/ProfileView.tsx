/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { compressAvatarFile } from '../utils/imageCompressor';
import { 
  PRIMARY_ACADEMIC_CLASSES, 
  JUNIOR_SECONDARY_CLASSES, 
  SENIOR_SECONDARY_CLASSES, 
  ALL_ACADEMIC_CLASSES 
} from '../utils/academicClasses';
import { 
  User, 
  Camera, 
  Trash2, 
  KeyRound, 
  Eye, 
  EyeOff, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  BadgeCheck,
  CreditCard,
  Mail,
  ShieldCheck,
  Sparkles,
  Lock,
  Link as LinkIcon,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PersonalReadingGoals } from './PersonalReadingGoals';

export const ProfileView: React.FC = () => {
  const { currentUser, updateUserProfile, isLearner, isStaff, isAdmin } = useApp();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [gradeOrYear, setGradeOrYear] = useState(currentUser?.gradeOrYear || '');
  const [department, setDepartment] = useState(currentUser?.department || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar || '');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // Sync state when currentUser updates
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name || '');
      setNickname(currentUser.nickname || '');
      setUsername(currentUser.username || '');
      setGradeOrYear(currentUser.gradeOrYear || '');
      setDepartment(currentUser.department || '');
      setAvatarUrl(currentUser.avatar || '');
    }
  }, [currentUser]);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Status & Notifications
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!currentUser) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="font-display font-extrabold text-lg text-slate-900">Sign-In Required</h2>
        <p className="text-xs text-slate-500">Please sign in to view and customize your library profile and credentials.</p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const userInitial = (nickname || fullName || currentUser.name || 'U').charAt(0).toUpperCase();

  // Curated profile presets for quick customization
  const educatorPresets = [
    { label: 'Alabi (Librarian)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=280' },
    { label: 'Veronica (Primary)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=280' },
    { label: 'Academic Lead', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=280' },
    { label: 'Faculty Advisor', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=280' },
    { label: 'Scholar Specialist', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=280' },
  ];

  // Handle Photo Upload with automatic compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveStatus({ type: 'error', message: 'Please select a valid image file (PNG, JPG, WebP).' });
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus({ type: 'success', message: 'Optimizing and applying picture...' });
      
      // Compress to 280x280 square avatar (~15KB - 25KB) so it saves seamlessly in storage
      const compressedDataUrl = await compressAvatarFile(file, 280, 0.86);
      setAvatarUrl(compressedDataUrl);

      // Immediately synchronize profile picture with context, database, header, and dashboard
      const res = await updateUserProfile({ avatar: compressedDataUrl });
      if (res.success) {
        setSaveStatus({ type: 'success', message: 'Profile picture updated! It is now active across your header, dashboard, and account.' });
      } else {
        setSaveStatus({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err?.message || 'Failed to process selected picture.' });
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    try {
      setIsSaving(true);
      const res = await updateUserProfile({ avatar: '' });
      if (res.success) {
        setSaveStatus({ type: 'success', message: 'Profile picture removed. Default avatar is now active across header and dashboard.' });
      }
    } catch {
      setSaveStatus({ type: 'error', message: 'Could not remove avatar.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPreset = async (presetUrl: string) => {
    setAvatarUrl(presetUrl);
    try {
      setIsSaving(true);
      const res = await updateUserProfile({ avatar: presetUrl });
      if (res.success) {
        setSaveStatus({ type: 'success', message: 'Profile picture preset applied to header and dashboard!' });
      }
    } catch {
      setSaveStatus({ type: 'error', message: 'Could not apply avatar preset.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyCustomUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    const url = customAvatarUrl.trim();
    setAvatarUrl(url);
    try {
      setIsSaving(true);
      const res = await updateUserProfile({ avatar: url });
      if (res.success) {
        setSaveStatus({ type: 'success', message: 'Custom image URL applied to header and dashboard!' });
        setCustomAvatarUrl('');
        setIsAddingUrl(false);
      }
    } catch {
      setSaveStatus({ type: 'error', message: 'Could not apply custom URL.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Official name is locked for students/learners; only administrators or librarians can update it
  const isNameLocked = isLearner && !isAdmin;

  // Handle Form Submit
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);

    const updates: Partial<typeof currentUser> = {
      name: isNameLocked ? currentUser.name : (fullName.trim() || currentUser.name),
      nickname: nickname.trim(),
      username: username.trim(),
      avatar: avatarUrl,
    };

    if (isLearner) {
      updates.gradeOrYear = gradeOrYear.trim();
    } else {
      updates.department = department.trim();
    }

    // Handle Password change if requested
    if (isChangingPassword) {
      if (!currentPassword) {
        setSaveStatus({ type: 'error', message: 'Please enter your current password to confirm the change.' });
        setIsSaving(false);
        return;
      }

      // Check current password
      const storedPass = (currentUser.password || currentUser.admissionNumber || '').trim();
      if (storedPass && storedPass.toLowerCase() !== currentPassword.trim().toLowerCase()) {
        setSaveStatus({ type: 'error', message: 'Current password does not match our records.' });
        setIsSaving(false);
        return;
      }

      if (newPassword.length < 5) {
        setSaveStatus({ type: 'error', message: 'New password must be at least 5 characters long.' });
        setIsSaving(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setSaveStatus({ type: 'error', message: 'New passwords do not match. Please verify.' });
        setIsSaving(false);
        return;
      }

      updates.password = newPassword.trim();
    }

    try {
      const res = await updateUserProfile(updates);
      if (res.success) {
        setSaveStatus({ type: 'success', message: 'Profile updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
      } else {
        setSaveStatus({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err?.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 sm:px-4 py-4">
      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        
        {/* Cover / Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 flex items-center justify-between relative">
          <div className="text-white relative z-10">
            <h1 className="font-display font-black text-xl sm:text-2xl tracking-tight">
              My Profile & Account Settings
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Personalize your name, picture, academic class, and security credentials.
            </p>
          </div>
        </div>

        {/* Personal Reading Goals (For learners) */}
        {isLearner && (
          <div className="p-6 sm:p-8 pb-0">
            <PersonalReadingGoals />
          </div>
        )}

        {/* Profile Content Body */}
        <form onSubmit={handleSaveChanges} className="p-6 sm:p-8 space-y-8">
          
          {/* Status Message */}
          <AnimatePresence>
            {saveStatus && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 font-medium ${
                  saveStatus.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {saveStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{saveStatus.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 1. Avatar Upload Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 pb-8 relative z-10">
            {/* Avatar Preview */}
            <div className="relative group/avatar shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl font-black shadow-lg overflow-hidden border-4 border-white">
                {avatarUrl ? (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>

              {/* Camera Icon Overlay Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-slate-900/85 hover:bg-slate-900 text-white rounded-xl shadow-md border border-white/20 transition cursor-pointer"
                title="Upload Profile Picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>

            {/* Avatar Controls & Info */}
            <div className="space-y-3 text-center sm:text-left flex-1">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                  <span>Profile Picture</span>
                  {isAdmin && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                      Chief Librarian Avatar
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload a photo or choose a preset. Automatically optimized and synced in real-time across your dashboard welcome banner, header, and system records.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAddingUrl(!isAddingUrl)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Image URL</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-medium border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset Default</span>
                  </button>
                )}
              </div>

              {/* Direct URL Input Tray */}
              {isAddingUrl && (
                <div className="pt-1">
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Preset Avatars */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Or select a verified educator avatar:
                </span>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {educatorPresets.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`relative w-8 h-8 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        avatarUrl === preset.url 
                          ? 'border-blue-600 ring-2 ring-blue-500/30' 
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                      title={preset.label}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      {avatarUrl === preset.url && (
                        <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Basic Information (Full Name, Nickname, Username) */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="font-display font-bold text-sm text-slate-900">
                Personal & Display Identity
              </h2>
              <p className="text-xs text-slate-500">Manage how your name and handle appear on your reading dashboard and reviews.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>Full Name</span>
                    {isNameLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Official School Name (Locked)
                      </span>
                    )}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isNameLocked}
                    readOnly={isNameLocked}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium outline-none transition ${
                      isNameLocked
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : 'bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-slate-900'
                    }`}
                    placeholder="Your full legal name"
                  />
                  {isNameLocked && (
                    <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Students cannot change their official enrolled name. Only an administrator or librarian can update it.</span>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nickname / Preferred Name
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition"
                  placeholder="e.g. Chidi, Zee, Veronica"
                />
                <p className="text-[10px] text-slate-400 mt-1">If provided, this preferred name will be shown on your greeting and avatar.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username / Handle
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    value={username.replace(/^@/, '')}
                    onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                    className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition font-mono"
                    placeholder="username"
                  />
                </div>
              </div>

              {/* Class / Grade for Learners */}
              {isLearner ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Academic Class / Year</span>
                    <span className="text-[10px] text-blue-600 font-normal">Promotion feature (Years 1–12: D, G, E, O, R)</span>
                  </label>
                  <select
                    value={gradeOrYear}
                    onChange={(e) => setGradeOrYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="" disabled>-- Select Your Class / Grade --</option>

                    {/* If current value is legacy, preserve it */}
                    {gradeOrYear && !ALL_ACADEMIC_CLASSES.some(c => c.code === gradeOrYear) && (
                      <option value={gradeOrYear}>Current: {gradeOrYear}</option>
                    )}

                    <optgroup label="Secondary Senior (Years 10–12: Diamond, Gold, Emerald, Onyx, Ruby • Max 3 Books)">
                      {SENIOR_SECONDARY_CLASSES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.fullLabel}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Secondary Junior (Years 7–9: Diamond, Gold, Emerald, Onyx, Ruby • Max 2 Books)">
                      {JUNIOR_SECONDARY_CLASSES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.fullLabel}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="Primary Section (Years 1–6: Diamond, Gold, Emerald, Onyx, Ruby • Manual Limit)">
                      {PRIMARY_ACADEMIC_CLASSES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.fullLabel}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Streams: D (Diamond), G (Gold), E (Emerald), O (Onyx), R (Ruby) across Years 1 to 12.
                  </p>
                </div>
              ) : (
                /* Department for Staff / Librarians */
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Faculty Department / Unit
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs font-medium text-slate-900 outline-none transition"
                    placeholder="e.g. Science Faculty, Administration"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Account Records & Institutional Credentials (Read Only) */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="font-display font-bold text-sm text-slate-900">
                Institutional Record
              </h2>
              <p className="text-xs text-slate-500">Fixed institutional identifiers managed by the school administration.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Library Card ID</span>
                </div>
                <div className="font-mono font-bold text-xs text-slate-900">
                  {currentUser.libraryCardId || 'N/A'}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <Mail className="w-3.5 h-3.5" />
                  <span>School Email</span>
                </div>
                <div className="font-bold text-xs text-slate-900 truncate" title={currentUser.email}>
                  {currentUser.email}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Account Type</span>
                </div>
                <div className="font-bold text-xs text-slate-900 capitalize">
                  {currentUser.role}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Security & Password Change */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-slate-600" />
                  <span>Password & Authentication</span>
                </h2>
                <p className="text-xs text-slate-500">Update the password used to sign in to your library account.</p>
              </div>

              {!isChangingPassword ? (
                <button
                  type="button"
                  onClick={() => setIsChangingPassword(true)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition cursor-pointer border border-slate-200"
                >
                  Change Password
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>

            {isChangingPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium text-slate-900 outline-none"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium text-slate-900 outline-none"
                        placeholder="At least 5 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs font-medium text-slate-900 outline-none"
                      placeholder="Re-type new password"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* 5. Save Button Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
