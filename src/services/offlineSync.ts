/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OfflineMutationType = 
  | 'ADD_BOOK'
  | 'UPDATE_BOOK'
  | 'DELETE_BOOK'
  | 'CHECKOUT_BOOK'
  | 'RETURN_BOOK'
  | 'RENEW_BOOK'
  | 'FLAG_LOST'
  | 'REPLACE_BOOK'
  | 'ADD_HOLD'
  | 'ADD_SUBMISSION'
  | 'ADD_USERS_BATCH';

export interface OfflineMutation {
  id: string;
  type: OfflineMutationType;
  payload: any;
  timestamp: number;
  description: string;
  retryCount: number;
}

const STORAGE_QUEUE_KEY = 'pis_offline_mutation_queue_v1';
const STORAGE_LAST_SYNC_KEY = 'pis_offline_last_sync_timestamp';

/**
 * Retrieves the pending offline mutations from persistent storage
 */
export function getPendingOfflineMutations(): OfflineMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read offline mutation queue:', err);
    return [];
  }
}

/**
 * Saves the offline mutation queue to persistent storage
 */
function saveMutationQueue(queue: OfflineMutation[]): void {
  try {
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    // Dispatch custom event so listeners in other components update immediately
    window.dispatchEvent(new CustomEvent('offline-queue-updated', { detail: { count: queue.length } }));
  } catch (err) {
    console.error('Failed to write offline mutation queue:', err);
  }
}

/**
 * Adds a new mutation to the offline queue
 */
export function enqueueOfflineMutation(
  type: OfflineMutationType,
  payload: any,
  description: string
): OfflineMutation {
  const queue = getPendingOfflineMutations();
  const mutation: OfflineMutation = {
    id: `mutation-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    type,
    payload,
    timestamp: Date.now(),
    description,
    retryCount: 0,
  };

  queue.push(mutation);
  saveMutationQueue(queue);
  return mutation;
}

/**
 * Removes a completed mutation from the queue
 */
export function dequeueOfflineMutation(id: string): void {
  const queue = getPendingOfflineMutations();
  const filtered = queue.filter(item => item.id !== id);
  saveMutationQueue(filtered);
}

/**
 * Clears the entire offline queue
 */
export function clearOfflineMutationQueue(): void {
  saveMutationQueue([]);
}

/**
 * Gets the timestamp of the last successful sync
 */
export function getLastSyncTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_LAST_SYNC_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Records a successful sync timestamp
 */
export function setLastSyncTimestamp(time: number = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_LAST_SYNC_KEY, String(time));
  } catch {
    // Ignore
  }
}
