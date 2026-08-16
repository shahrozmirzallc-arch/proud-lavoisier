// src/services/backgroundSyncWorker.js
// Authoritative Background Bi-Directional Auto-Sync Worker for IDS Pulse
// Listens for network reconnects and auto-flushes offline incident & shift queues

import { getLocalOutbox, removeOutboxItem } from './nativeStorageService';
import { syncQueuedIncidentRelease } from './incidentWorkflowService';
import { getOfflineQueue, removeOfflineSubmission } from '../features/hours/OfflineHoursQueue';
import { saveEntity, logSystemEvent } from '../components/SharedDatabase';

let isSyncing = false;
let syncIntervalId = null;
let lastSyncTimestamp = null;

/**
 * Executes a full synchronization flush across all durable offline outboxes.
 * Synchronizes queued emergency incidents, shift reports, and hours entries.
 *
 * @returns {Promise<Object>} Results of the sync cycle
 */
export async function flushAllOfflineQueues() {
  if (isSyncing) {
    return { skipped: true, reason: 'Sync already in progress' };
  }

  // Check browser online status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { skipped: true, reason: 'Device is currently offline' };
  }

  isSyncing = true;
  const results = {
    syncedIncidents: 0,
    failedIncidents: 0,
    syncedHours: 0,
    failedHours: 0,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. Flush Incident Outbox
    const incidentOutbox = getLocalOutbox() || [];
    for (const stagedItem of incidentOutbox) {
      try {
        const syncResult = await syncQueuedIncidentRelease(stagedItem);
        if (syncResult && syncResult.success) {
          removeOutboxItem(stagedItem.local_id);
          results.syncedIncidents += 1;
        } else {
          results.failedIncidents += 1;
        }
      } catch (incErr) {
        console.error('[BackgroundSync] Incident flush error:', incErr);
        results.failedIncidents += 1;
      }
    }

    // 2. Flush Offline Hours & Shift Submissions
    const hoursQueue = getOfflineQueue() || [];
    for (const item of hoursQueue) {
      try {
        if (item.entityData) {
          saveEntity('shiftReports', item.entityData);
        }
        removeOfflineSubmission(item.idempotencyKey);
        results.syncedHours += 1;
      } catch (hoursErr) {
        console.error('[BackgroundSync] Hours flush error:', hoursErr);
        results.failedHours += 1;
      }
    }

    lastSyncTimestamp = new Date().toISOString();

    if (results.syncedIncidents > 0 || results.syncedHours > 0) {
      logSystemEvent('sync', 'auto_flush', `Auto-synced ${results.syncedIncidents} incidents and ${results.syncedHours} hours entries.`);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ids_pulse_sync_complete', { detail: results }));
        window.dispatchEvent(new Event('ids_pulse_db_update'));
      }
    }
  } catch (err) {
    console.error('[BackgroundSync] Unexpected error during sync cycle:', err);
  } finally {
    isSyncing = false;
  }

  return results;
}

/**
 * Initializes the background synchronization daemon.
 * Binds to browser online events and visibility change.
 *
 * @param {number} [intervalMs=30000] - Periodic polling interval in milliseconds
 */
export function initBackgroundSyncWorker(intervalMs = 30000) {
  if (typeof window === 'undefined') return;

  // Immediate flush on network reconnection
  window.addEventListener('online', () => {
    console.log('[BackgroundSync] Network connection restored. Initiating auto-flush...');
    flushAllOfflineQueues();
  });

  // Flush when app comes back to foreground
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      flushAllOfflineQueues();
    }
  });

  // Recurring background interval
  if (!syncIntervalId) {
    syncIntervalId = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        flushAllOfflineQueues();
      }
    }, intervalMs);
  }
}

/**
 * Stops the background sync timer.
 */
export function stopBackgroundSyncWorker() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

/**
 * Retrieves current status of the background sync worker.
 *
 * @returns {Object}
 */
export function getSyncWorkerStatus() {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const incidentOutbox = getLocalOutbox() || [];
  const hoursQueue = getOfflineQueue() || [];

  return {
    isOnline,
    isSyncing,
    lastSyncTimestamp,
    pendingIncidentsCount: incidentOutbox.length,
    pendingHoursCount: hoursQueue.length,
    totalPending: incidentOutbox.length + hoursQueue.length
  };
}
