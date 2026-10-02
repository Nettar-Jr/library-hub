/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sparkles, 
  ExternalLink, 
  Star, 
  Rocket, 
  Headphones, 
  Award, 
  Compass,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

export const EpicClassroomBanner: React.FC = () => {
  const epicLink = "https://www.getepic.com/app/profile-select";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-50 via-indigo-50/50 to-blue-100/60 p-6 sm:p-8 lg:p-10 shadow-sm transition-all hover:shadow-md">
      {/* Playful Background Floating Accents */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-indigo-400/15 blur-2xl" />
      
      {/* Decorative whimsical icons floating in the background */}
      <motion.div 
        animate={{ y: [0, -6, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute right-8 top-6 hidden text-cyan-500/25 lg:block"
      >
        <Star className="h-10 w-10 fill-cyan-400" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 8, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute bottom-6 right-36 hidden text-indigo-400/20 md:block"
      >
        <Rocket className="h-8 w-8 fill-indigo-300" />
      </motion.div>
      <motion.div 
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="pointer-events-none absolute left-1/3 top-3 hidden text-amber-400/30 sm:block"
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
        {/* Left Column: Headline & Simplified Description */}
        <div className="space-y-3 max-w-2xl">
          {/* Punchy Title */}
          <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight leading-tight">
            Join Your Librarian’s Class on{' '}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
              Epic!
            </span>
          </h2>

          {/* Simple Description */}
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            We’ve created a class on Epic where your librarians assign books for you to read.
          </p>

          {/* Fun 3-Point Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Assigned by Librarians</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
              <Headphones className="h-4 w-4 text-cyan-600 shrink-0" />
              <span>Audiobooks & Read-To-Me</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xs px-3 py-2 rounded-xl border border-slate-200/60 shadow-2xs">
              <Award className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Reading Badges & Streaks</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Action Launch Card */}
        <div className="shrink-0 flex flex-col items-stretch sm:items-center lg:items-end gap-3">
          <motion.a
            href={epicLink}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/35 cursor-pointer text-center"
          >
            {/* Pulsing glow ring on hover */}
            <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-400 opacity-0 blur-xs transition group-hover:opacity-40" />

            <span className="relative flex items-center gap-2">
              <span>Enter Librarian's Epic Class</span>
              <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </motion.a>

          {/* Subtle Direct URL & instructions */}
          <div className="flex flex-col sm:flex-row items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Compass className="h-3 w-3 text-blue-600" />
              <span>Direct Link:</span>
            </span>
            <a 
              href={epicLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline underline-offset-2 font-mono text-[10px]"
            >
              getepic.com/app/profile-select
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
