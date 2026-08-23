/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import confetti from 'canvas-confetti';

export const triggerBorrowCelebration = () => {
  try {
    // School colors & celebratory gold confetti
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#3B82F6', '#10B981', '#EC4899', '#6366F1']
    });
  } catch {
    // Fallback if in restricted iframe context
  }
};

export const triggerMilestoneCelebration = () => {
  try {
    const end = Date.now() + 1000;
    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#FBBF24', '#F472B6', '#60A5FA', '#34D399', '#A78BFA']
      });
    }, 200);
  } catch {
    // Fallback
  }
};
