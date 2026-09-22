/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload, Clock, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getPendingOfflineMutations, getLastSyncTimestamp, OfflineMutation } from '../services/offlineSync';

interface OfflineSyncIndicatorProps {
  onSyncNow?: () => Promise<void>;
  isSyncing?: boolean;
}

export const OfflineSyncIndicator: React.FC<OfflineSyncIndicatorProps> = ({
  onSyncNow,
  isSyncing = false,
}) => {
  const { isOnline } = useOnlineStatus();
  const [pendingQueue, setPendingQueue] = useState<OfflineMutation[]>(() => getPendingOfflineMutations());
  const [showDetails, setShowDetails] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => getLastSyncTimestamp());

  const refreshQueue = () => {
    setPendingQueue(getPendingOfflineMutations());
    setLastSyncTime(getLastSyncTimestamp());
  };

  useEffect(() => {
    const handleQueueUpdated = () => {
      refreshQueue();
    };

    window.addEventListener('offline-queue-updated', handleQueueUpdated);
    window.addEventListener('focus', refreshQueue);

    return () => {
      window.removeEventListener('offline-queue-updated', handleQueueUpdated);
      window.removeEventListener('focus', refreshQueue);
    };
  }, []);

  // When returning online, trigger sync if there are pending items
  useEffect(() => {
    if (isOnline && pendingQueue.length > 0 && onSyncNow && !isSyncing) {
      onSyncNow().then(() => {
        refreshQueue();
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 4000);
      });
    }
  }, [isOnline]);

  const handleManualSync = async () => {
    if (onSyncNow) {
      await onSyncNow();
      refreshQueue();
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 4000);
    }
  };

  const pendingCount = pendingQueue.length;

  return (
    <div className="relative inline-block">
      {/* Status Bar Badge */}
      <div className="flex items-center gap-1.5">
        {!isOnline ? (
          <button 
            type="button"
            id="offline-status-pill"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold cursor-pointer hover:bg-amber-100 transition shadow-2xs"
            title="Connection offline: Catalog is searchable & changes are queued locally"
            aria-label="Offline Mode Active"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
            </span>
            <WifiOff className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline font-bold">Offline</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 font-bold rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
            {showDetails ? <ChevronUp className="w-3 h-3 text-amber-700 opacity-75" /> : <ChevronDown className="w-3 h-3 text-amber-700 opacity-75" />}
          </button>
        ) : pendingCount > 0 ? (
          <div 
            id="pending-sync-pill"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold shadow-2xs"
          >
            <CloudUpload className={`w-3.5 h-3.5 text-blue-600 ${isSyncing ? 'animate-bounce' : ''}`} />
            <span 
              onClick={() => setShowDetails(!showDetails)}
              className="cursor-pointer hover:underline"
            >
              {isSyncing ? 'Syncing...' : `${pendingCount} Queued`}
            </span>
            <button
              type="button"
              id="quick-sync-btn"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-1 hover:bg-blue-100 rounded-lg text-blue-700 transition cursor-pointer"
              title="Sync now"
              aria-label="Sync pending changes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        ) : justSynced ? (
          <div 
            id="synced-success-pill"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Synced</span>
          </div>
        ) : (
          <div 
            id="online-status-pill"
            className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium"
            title="Connected to Library Portal"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Online</span>
          </div>
        )}
      </div>

      {/* Popover detail modal */}
      {showDetails && (
        <div 
          id="offline-sync-popover"
          className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl bg-white border border-slate-200 p-4 shadow-xl z-50 text-slate-800 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <div className="p-1 rounded-lg bg-amber-100 text-amber-800">
                  <WifiOff className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <Wifi className="w-4 h-4" />
                </div>
              )}
              <span className="font-bold text-xs text-slate-900">
                {!isOnline ? 'Offline Catalog Engine' : 'Sync Engine'}
              </span>
            </div>
            <button 
              type="button"
              id="close-popover-btn"
              onClick={() => setShowDetails(false)}
              className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded-md hover:bg-slate-100 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="py-3 text-xs text-slate-700 space-y-2.5">
            {!isOnline ? (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Offline Persistence Active:</strong> The entire library catalog is cached on your device. You can search, browse categories, and issue desk loans. All changes are stored locally and will auto-sync once connectivity is restored.
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Internet connection is active.
                {lastSyncTime && (
                  <span className="block text-slate-600 mt-1 font-medium">
                    Last synchronized: {new Date(lastSyncTime).toLocaleTimeString()}
                  </span>
                )}
              </p>
            )}

            {/* Pending actions list */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Pending Mutations ({pendingQueue.length})
                </span>
                {isOnline && pendingQueue.length > 0 && (
                  <button
                    type="button"
                    id="sync-now-popover-btn"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                )}
              </div>

              {pendingQueue.length === 0 ? (
                <div className="py-3 text-center text-slate-500 text-[11px] bg-slate-50 rounded-xl border border-slate-100">
                  No pending offline changes. Catalog and circulation are fully synchronized.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {pendingQueue.map((item) => (
                    <div 
                      key={item.id}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2 text-[11px]"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.description}</p>
                        <p className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
