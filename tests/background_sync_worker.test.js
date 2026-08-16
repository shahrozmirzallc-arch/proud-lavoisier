// tests/background_sync_worker.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Browser global polyfills for Node / Vitest
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; }
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { onLine: true };
}

import {
  flushAllOfflineQueues,
  getSyncWorkerStatus
} from '../src/services/backgroundSyncWorker.js';
import { stageIncidentLocally, getLocalOutbox } from '../src/services/nativeStorageService.js';
import { enqueueOfflineSubmission, getOfflineQueue } from '../src/features/hours/OfflineHoursQueue.js';
import { saveEntity, getEntities, supabase } from '../src/components/SharedDatabase.js';

describe('Authoritative Background Auto-Sync Worker Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.navigator.onLine = true;

    // Seed test users & suppliers
    saveEntity('suppliers', {
      id: 'sup_magna',
      name: 'Magna Powertrain International',
      contact_person: 'Robert Sterling',
      email: 'robert@magnapowertrain.com'
    });
    saveEntity('users', {
      id: 'usr_clarence',
      username: 'clarence',
      name: 'Clarence Kuiken',
      role: 'rep',
      password: 'Clarence123$'
    });
  });

  describe('1. Auto-Sync Flush Gate', () => {
    it('flushes offline staged incidents and clears the durable outbox', async () => {
      if (supabase) {
        supabase.rpc = vi.fn().mockResolvedValue({
          data: {
            success: true,
            incident: {
              id: 'INC-AUTO-01',
              status: 'Released',
              released_to_client: true,
              released_at: new Date().toISOString(),
              released_by: 'usr_clarence',
              client_id: 'sup_magna',
              project_id: 'prj_magna_01'
            }
          },
          error: null
        });
      }

      // Stage an incident offline
      const staged = stageIncidentLocally({
        client_id: 'sup_magna',
        plant_id: 'plant_oakville',
        part_number: 'PN-7T4Z-7000-A',
        defect_description: 'Crack in housing',
        level_of_concern: 'Critical',
        reported_by: 'Clarence Kuiken'
      });

      expect(getLocalOutbox().length).toBe(1);

      // Trigger sync flush
      const result = await flushAllOfflineQueues();

      expect(result.syncedIncidents).toBe(1);
      expect(result.failedIncidents).toBe(0);
      expect(getLocalOutbox().length).toBe(0);

      // Verify incident is now committed in authoritative DB
      const dbIncidents = getEntities('incidents') || [];
      const savedInc = dbIncidents.find(i => i.id === 'INC-AUTO-01' || i.part_number === 'PN-7T4Z-7000-A');
      expect(savedInc).toBeDefined();
    });

    it('flushes offline hours submissions into shiftReports DB table', async () => {
      enqueueOfflineSubmission({
        idempotencyKey: 'idemp_test_999',
        entityData: {
          id: 'sr_auto_synced_01',
          rep_id: 'usr_clarence',
          hours_worked: 8.5,
          date: '2026-08-16',
          supplier_id: 'sup_magna'
        }
      });

      expect(getOfflineQueue().length).toBe(1);

      const result = await flushAllOfflineQueues();

      expect(result.syncedHours).toBe(1);
      expect(getOfflineQueue().length).toBe(0);

      const shiftReports = getEntities('shiftReports') || [];
      const savedShift = shiftReports.find(s => s.id === 'sr_auto_synced_01');
      expect(savedShift).toBeDefined();
      expect(savedShift.hours_worked).toBe(8.5);
    });

    it('skips sync execution gracefully when navigator is offline', async () => {
      globalThis.navigator.onLine = false;

      stageIncidentLocally({
        client_id: 'sup_magna',
        part_number: 'PN-OFFLINE-01'
      });

      const result = await flushAllOfflineQueues();
      expect(result.skipped).toBe(true);
      expect(result.reason).toContain('offline');
      expect(getLocalOutbox().length).toBe(1);
    });
  });

  describe('2. Worker Telemetry & Queue Status Gate', () => {
    it('returns exact count of pending items across all outbox queues', () => {
      globalThis.navigator.onLine = true;
      stageIncidentLocally({ client_id: 'sup_magna', part_number: 'PN-1' });
      enqueueOfflineSubmission({ idempotencyKey: 'k1', entityData: { id: 's1' } });

      const status = getSyncWorkerStatus();
      expect(status.isOnline).toBe(true);
      expect(status.pendingIncidentsCount).toBe(1);
      expect(status.pendingHoursCount).toBe(1);
      expect(status.totalPending).toBe(2);
    });
  });
});
