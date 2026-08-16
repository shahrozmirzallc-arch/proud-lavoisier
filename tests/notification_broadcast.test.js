// tests/notification_broadcast.test.js
import { describe, it, expect, beforeEach } from 'vitest';

// Node/Vitest mock polyfill for browser globals
if (typeof globalThis.localStorage === 'undefined') {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
    get length() { return storage.size; }
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}
if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type, eventInitDict) {
      this.type = type;
      this.detail = eventInitDict?.detail;
    }
  };
}

import {
  isUrgentBroadcastIncident,
  composeBrandedIncidentEmailHTML,
  composeIncidentSMS,
  sendCriticalIncidentBroadcast,
  getBroadcastHistory,
  retryBroadcastNotification
} from '../src/services/notificationBroadcastService.js';
import { saveEntity } from '../src/components/SharedDatabase.js';
import { LOGO_BASE64 } from '../src/components/LogoBase64.js';

describe('Critical Incident Notification Broadcast Engine Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    // Seed system users directory for mandatory internal CC lookup
    saveEntity('users', {
      id: 'usr_donna',
      username: 'donna',
      name: 'Donna Cabral',
      email: 'donna@integritydrivensolutions.com',
      password: 'DonnaPassword2026!',
      role: 'owner'
    });
    saveEntity('users', {
      id: 'usr_diana',
      username: 'diana',
      name: 'Diana Prince',
      email: 'diana@integritydrivensolutions.com',
      password: 'DianaPassword2026!',
      role: 'admin'
    });
    saveEntity('users', {
      id: 'usr_greg',
      username: 'greg',
      name: 'Greg Phillippe',
      email: 'greg@integritydrivensolutions.com',
      password: 'GregPassword2026!',
      role: 'admin'
    });
    saveEntity('users', {
      id: 'usr_clarence',
      username: 'clarence',
      name: 'Clarence Kuiken',
      email: 'clarence@integritydrivensolutions.com',
      password: 'ClarencePass2026!',
      role: 'rep'
    });

    // Seed supplier contact
    saveEntity('supplier_contacts', {
      id: 'sc_robert',
      client_id: 'magna',
      name: 'Robert Sterling',
      email: 'robert.sterling@magnapowertrain.com',
      phone: '+1-519-555-0199',
      role: 'Client Quality Director'
    });
  });

  describe('1. Urgency & Severity Predicates', () => {
    it('correctly identifies Critical level of concern', () => {
      expect(isUrgentBroadcastIncident({ level_of_concern: 'Critical' })).toBe(true);
      expect(isUrgentBroadcastIncident({ concern_classification: 'Critical' })).toBe(true);
      expect(isUrgentBroadcastIncident({ level_of_concern: 'critical' })).toBe(true);
    });

    it('correctly identifies Spill defect type', () => {
      expect(isUrgentBroadcastIncident({ defect_type: 'Fluid Spill on Assembly Line' })).toBe(true);
      expect(isUrgentBroadcastIncident({ defect_type: 'spill' })).toBe(true);
    });

    it('skips non-urgent / minor / routine incidents', () => {
      expect(isUrgentBroadcastIncident({ level_of_concern: 'Minor', defect_type: 'Scuff' })).toBe(false);
      expect(isUrgentBroadcastIncident({ level_of_concern: 'Standard', defect_type: 'Label Mismatch' })).toBe(false);
      expect(isUrgentBroadcastIncident(null)).toBe(false);
    });
  });

  describe('2. Branded HTML Email Composition', () => {
    it('generates email containing canonical IDS Pulse logo and required sections', () => {
      const mockInc = {
        id: 'INC-2026-TEST-01',
        plant_name: 'Oakville Assembly Plant',
        client_name: 'Magna Powertrain International',
        part_number: 'PN-7T4Z-7000-A',
        defect_type: 'Fractured Bracket',
        pieces_defective: 14,
        area: 'Chassis Line 2',
        rep_name: 'Clarence Kuiken',
        description: 'Severe structural fracture detected on 14 units during receiving sort.',
        action_taken: 'All suspect pallets quarantined immediately and tagged red.'
      };

      const html = composeBrandedIncidentEmailHTML(mockInc);
      expect(html).toContain('INC-2026-TEST-01');
      expect(html).toContain('Oakville Assembly Plant');
      expect(html).toContain('Magna Powertrain International');
      expect(html).toContain('PN-7T4Z-7000-A');
      expect(html).toContain('Fractured Bracket (14 pcs affected)');
      expect(html).toContain('All suspect pallets quarantined');
      expect(html).toContain('https://proud-lavoisier.vercel.app/');
      expect(html).toContain(LOGO_BASE64);
      expect(html).toContain('Integrity Driven Solutions Inc. (IDS)');
    });
  });

  describe('3. SMS Text Payload Composition', () => {
    it('generates concise automotive SMS alert string with plant, part, and count', () => {
      const mockInc = {
        id: 'INC-9901',
        plant_name: 'CAMI Assembly',
        part_number: 'PN-84920194',
        defect_type: 'Sensor Pin Bent',
        pieces_defective: 8
      };

      const sms = composeIncidentSMS(mockInc);
      expect(sms).toContain('IDS PULSE ALERT [CRITICAL]: INC-9901 at CAMI Assembly');
      expect(sms).toContain('8 pcs affected');
      expect(sms).toContain('PN-84920194 - Sensor Pin Bent');
      expect(sms).toContain('https://proud-lavoisier.vercel.app/');
    });
  });

  describe('4. Broadcast Dispatcher & Persistent Audit Logging', () => {
    it('dispatches multi-channel broadcast, snapshots recipients, and stores in notifications_log', async () => {
      const mockInc = {
        id: 'INC-CRIT-9922',
        client_id: 'magna',
        supplier_id: 'magna',
        plant_name: 'Oakville Assembly Plant',
        part_number: 'PN-7T4Z-7000-A',
        defect_type: 'Spill & Porosity',
        level_of_concern: 'Critical',
        pieces_defective: 5,
        recipient_snapshot: [
          { name: 'Robert Sterling', email: 'robert@magna.com', phone: '+15195550199', role: 'Quality Lead' },
          { name: 'Donna Cabral', email: 'donna@integritydrivensolutions.com', role: 'Owner', is_mandatory_cc: true }
        ]
      };

      const result = await sendCriticalIncidentBroadcast({
        incident: mockInc,
        triggerSource: 'automatic_release',
        currentUser: { id: 'usr_clarence', name: 'Clarence Kuiken' }
      });

      expect(result.success).toBe(true);
      expect(result.emailCount).toBe(2);
      expect(result.smsCount).toBe(1);

      // Verify stored in DB
      const logs = getBroadcastHistory({ incidentId: 'INC-CRIT-9922' });
      expect(logs.length).toBe(1);
      expect(logs[0].incident_id).toBe('INC-CRIT-9922');
      expect(logs[0].status).toBe('Sent');
      expect(logs[0].channels).toContain('Email');
      expect(logs[0].channels).toContain('SMS');
      expect(logs[0].sms_message).toContain('INC-CRIT-9922');
    });

    it('allows retrying a broadcast from audit history', async () => {
      const logEntry = {
        id: 'BRD-RETRY-TEST',
        incident_id: 'INC-551',
        incident_ref: 'INC-551',
        status: 'Queued Offline',
        created_at: new Date().toISOString(),
        delivery_details: {}
      };
      saveEntity('notifications_log', logEntry);

      const retryRes = await retryBroadcastNotification('BRD-RETRY-TEST');
      expect(retryRes.success).toBe(true);
      expect(retryRes.log.status).toBe('Sent');

      const updated = getBroadcastHistory({ incidentId: 'INC-551' });
      expect(updated[0].status).toBe('Sent');
    });
  });
});
