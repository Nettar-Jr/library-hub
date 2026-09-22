/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'nav' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'nav'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    await install();
    setIsInstalling(false);
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          type="button"
          id="pwa-install-compact-btn"
          onClick={handleInstallClick}
          disabled={isInstalling}
          title="Install Library App on this device"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        id="pwa-install-header-btn"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white shadow-2xs hover:bg-slate-800 transition cursor-pointer ${className}`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>{isInstalling ? 'Adding...' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition cursor-pointer ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-blue-600" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-800 relative">
              <button
                type="button"
                id="close-ios-guide-btn"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">Install on iPhone / iPad</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Add Premier International School Library to your home screen for instantaneous access and offline catalog searching:
              </p>

              <div className="space-y-3 bg-slate-50 rounded-xl p-3.5 text-xs text-slate-700 border border-slate-200 mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Tap the <strong className="text-slate-900 inline-flex items-center gap-1"><Share className="w-3 h-3 inline text-blue-600" /> Share</strong> button in Safari's bottom toolbar.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">3</span>
                  <span>Tap <strong className="text-slate-900">Add</strong> in the top right corner.</span>
                </div>
              </div>

              <button
                type="button"
                id="dismiss-ios-guide-btn"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
