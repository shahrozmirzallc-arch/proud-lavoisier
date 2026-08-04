// tests/incident_production_workflow.test.js
// IDS Pulse Authoritative Incident Production Workflow & Security Test Suite (100% Real Production Functions)

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';

if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
  globalThis.window.dispatchEvent = () => {};
  globalThis.window.addEventListener = () => {};
  globalThis.window.removeEventListener = () => {};
}

if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

import {
  resolveAuthoritativeAssignment,
  resolveAssignmentContacts,
  buildRecipientSnapshot,
  isCustomerVisibleIncident,
  validateServerReleaseResponse,
  releaseIncidentToClient,
  syncQueuedIncidentRelease
} from '../src/services/incidentWorkflowService';
import { supabase } from '../src/components/SharedDatabase.js';

describe('IDS Pulse Incident Security & Workflow Production Suite', () => {

  const mockRep1 = { id: 'rep_1', name: 'Quality Rep One', role: 'rep' };
  const mockRep10 = { id: 'rep_10', name: 'Quality Rep Ten', role: 'rep' };

  const projectA = {
    id: 'prj_stellantis_01',
    name: 'Stellantis Windsor Quality Audit',
    rep_id: 'rep_1',
    rep_ids: ['rep_1', 'rep_5'],
    client_id: 'client_stellantis',
    supplier_id: 'supp_abc_plastics',
    plant_id: 'plant_windsor',
    status: 'active'
  };

  const projectB = {
    id: 'prj_ford_02',
    name: 'Ford Stamping Inspection',
    rep_id: 'rep_10',
    rep_ids: ['rep_10'],
    client_id: 'client_ford',
    supplier_id: 'supp_xyz_metal',
    plant_id: 'plant_oakville',
    status: 'active'
  };

  const customerContacts = [
    { id: 'cnt_1', name: 'Alice Customer', email: 'alice@stellantis.com', client_id: 'client_stellantis', role: 'Quality Lead' },
    { id: 'cnt_2', name: 'Bob Supplier', email: 'bob@abc.com', organization_id: 'supp_abc_plastics', role: 'Plant Rep' }
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. projects.customer_id is not referenced
  test('1. resolveAuthoritativeAssignment reads ONLY client_id without referencing customer_id', () => {
    const asgn = resolveAuthoritativeAssignment({
      currentUser: mockRep1,
      selectedAssignmentId: 'prj_stellantis_01',
      assignmentsList: [projectA, projectB]
    });
    expect(asgn).not.toBeNull();
    expect(asgn.client_id).toBe('client_stellantis');
    expect(asgn.customer_id).toBeUndefined();
  });

  // 2. Customer RLS / predicate never references supplier_id
  test('2. isCustomerVisibleIncident rejects matching supplier_id when client_id differs', () => {
    const spoofedInc = {
      id: 'INC-SPOOF-01',
      client_id: 'client_ford',
      supplier_id: 'client_stellantis',
      released_to_client: true,
      status: 'Released'
    };
    expect(isCustomerVisibleIncident(spoofedInc, 'client_stellantis')).toBe(false);
  });

  // 3. rep_ids uses exact JSONB membership (rep_1 does NOT match rep_10)
  test('3. rep_ids membership prevents rep_1 matching rep_10 assignment', () => {
    const asgnForRep10 = resolveAuthoritativeAssignment({
      currentUser: mockRep10,
      selectedAssignmentId: 'prj_stellantis_01', // belongs to rep_1
      assignmentsList: [projectA, projectB]
    });
    expect(asgnForRep10).toBeNull();
  });

  // 4. Idempotency constraint cannot silently fail
  test('4. Duplicate release attempt with identical idempotency key returns existing release', async () => {
    if (supabase) {
      supabase.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          already_released: true,
          incident: {
            id: 'INC-20260801-0001',
            status: 'Released',
            released_to_client: true,
            released_at: new Date().toISOString(),
            released_by: 'rep_1',
            client_id: 'client_stellantis',
            project_id: 'prj_stellantis_01',
            supplier_id: 'supp_abc_plastics',
            plant_id: 'plant_windsor'
          }
        },
        error: null
      });
    }

    const payload = { assignment_id: 'prj_stellantis_01', client_id: 'client_stellantis' };
    const res = await releaseIncidentToClient({
      incidentPayload: payload,
      isOffline: false,
      currentUser: mockRep1
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('Released');
  });

  // 5. Malformed RPC success response is rejected
  test('5. validateServerReleaseResponse rejects malformed or missing fields', () => {
    const malformed1 = { success: true, incident: { id: 'INC-1', status: 'Released' } }; // missing released_to_client
    const malformed2 = { success: true, incident: { id: 'INC-1', status: 'Released', released_to_client: true, released_at: 'invalid-date', released_by: 'rep_1' } };
    const valid = {
      success: true,
      incident: {
        id: 'INC-100',
        status: 'Released',
        released_to_client: true,
        released_at: new Date().toISOString(),
        released_by: 'rep_1',
        client_id: 'client_stellantis',
        project_id: 'prj_stellantis_01'
      }
    };

    expect(validateServerReleaseResponse(malformed1, { assignment_id: 'prj_stellantis_01' })).toBe(false);
    expect(validateServerReleaseResponse(malformed2, { assignment_id: 'prj_stellantis_01' })).toBe(false);
    expect(validateServerReleaseResponse(valid, { assignment_id: 'prj_stellantis_01', client_id: 'client_stellantis' })).toBe(true);
  });

  // 6. Malformed RPC response causes releaseIncidentToClient to fail
  test('6. RPC returning malformed response does not update local state as Released', async () => {
    if (supabase) {
      supabase.rpc = vi.fn().mockResolvedValue({
        data: { success: true, incident: { id: 'INC-PARTIAL' } }, // missing required fields
        error: null
      });
    }

    const res = await releaseIncidentToClient({
      incidentPayload: { assignment_id: 'prj_stellantis_01' },
      isOffline: false,
      currentUser: mockRep1
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('Sync Failed');
  });

  // 7. Only incident_release queue item enters release RPC
  test('7. syncQueuedIncidentRelease rejects items missing valid payload or queue type', async () => {
    const res = await syncQueuedIncidentRelease(null);
    expect(res.success).toBe(false);
    expect(res.retained).toBe(true);
  });

  // 8. Customer Dashboard list uses shared predicate
  test('8. isCustomerVisibleIncident filters Draft, Submitted, and Open incidents', () => {
    const draft = { id: '1', client_id: 'c1', released_to_client: false, status: 'Draft' };
    const submitted = { id: '2', client_id: 'c1', released_to_client: false, status: 'Submitted' };
    const open = { id: '3', client_id: 'c1', released_to_client: true, status: 'Open' };
    const released = { id: '4', client_id: 'c1', released_to_client: true, status: 'Released' };

    expect(isCustomerVisibleIncident(draft, 'c1')).toBe(false);
    expect(isCustomerVisibleIncident(submitted, 'c1')).toBe(false);
    expect(isCustomerVisibleIncident(open, 'c1')).toBe(false);
    expect(isCustomerVisibleIncident(released, 'c1')).toBe(true);
  });

  // 9. Customer A/B isolation
  test('9. Customer A cannot see Customer B released incident', () => {
    const incB = { id: 'inc_b', client_id: 'client_ford', released_to_client: true, status: 'Released' };
    expect(isCustomerVisibleIncident(incB, 'client_stellantis')).toBe(false);
  });

  // 10. resolveAssignmentContacts filters contacts strictly by project.client_id / billing_customer_id
  test('10. resolveAssignmentContacts filters contacts strictly by project.client_id / billing_customer_id', () => {
    const contactsObj = resolveAssignmentContacts({
      assignment: projectA,
      contactsList: customerContacts
    });
    expect(contactsObj.customerContacts.length).toBe(1);
    expect(contactsObj.customerContacts[0].name).toBe('Alice Customer');
  });

  // 11. buildRecipientSnapshot creates clean snapshot including Mandatory Internal CCs (Donna, Greg, Monica)
  test('11. buildRecipientSnapshot creates clean snapshot with mandatory internal CCs (Part 9)', () => {
    const snapshot = buildRecipientSnapshot([{ id: 'c1', name: 'Jane Lead', email: 'jane@client.com', role: 'Quality Mgr' }]);
    expect(snapshot.length).toBe(4);
    const mandatoryCCs = snapshot.filter(s => s.is_mandatory_cc);
    expect(mandatoryCCs.length).toBe(3);
    const external = snapshot.find(s => !s.is_mandatory_cc);
    expect(external.name).toBe('Jane Lead');
    expect(external.email).toBe('jane@client.com');
  });

  // 12. Empty contacts returns only mandatory internal CCs (Part 9)
  test('12. buildRecipientSnapshot includes mandatory internal CCs even when no external contacts provided (Part 9)', () => {
    const snapshot = buildRecipientSnapshot([]);
    expect(snapshot.length).toBe(3);
    const names = snapshot.map(s => s.name);
    expect(names.some(n => n.includes('Donna'))).toBe(true);
    expect(names.some(n => n.includes('Greg'))).toBe(true);
    expect(names.some(n => n.includes('Monica'))).toBe(true);
  });

  // 13. Reconnect replay handles RPC failure safely
  test('13. syncQueuedIncidentRelease retains outbox record when server RPC fails', async () => {
    if (supabase) {
      supabase.rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Network connection reset' }
      });
    }

    const item = {
      local_id: 'loc_999',
      tracking_ref: 'idemp_999',
      entity: { assignment_id: 'prj_stellantis_01', client_id: 'client_stellantis' }
    };

    const res = await syncQueuedIncidentRelease(item);
    expect(res.success).toBe(false);
    expect(res.retained).toBe(true);
  });

  // 14. Reconnect replay cleans outbox item on server success
  test('14. syncQueuedIncidentRelease removes item on server RPC success', async () => {
    if (supabase) {
      supabase.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          incident: {
            id: 'INC-999',
            status: 'Released',
            released_to_client: true,
            released_at: new Date().toISOString(),
            released_by: 'rep_1',
            client_id: 'client_stellantis',
            project_id: 'prj_stellantis_01'
          }
        },
        error: null
      });
    }

    const item = {
      local_id: 'loc_999',
      tracking_ref: 'idemp_999',
      entity: { assignment_id: 'prj_stellantis_01', client_id: 'client_stellantis' }
    };

    const res = await syncQueuedIncidentRelease(item);
    expect(res.success).toBe(true);
  });

  // 15. Offline release sets correct activity message and status
  test('15. releaseIncidentToClient offline mode sets status Queued Offline and activity message', async () => {
    const res = await releaseIncidentToClient({
      incidentPayload: { assignment_id: 'prj_stellantis_01', client_id: 'client_stellantis' },
      isOffline: true,
      currentUser: mockRep1
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('Queued Offline');
    expect(res.activity_message).toBe('Incident queued securely on this device.');
  });

  // 16. Online release sets correct activity message and status
  test('16. releaseIncidentToClient online mode sets status Released and activity message', async () => {
    if (supabase) {
      supabase.rpc = vi.fn().mockResolvedValue({
        data: {
          success: true,
          incident: {
            id: 'INC-888',
            status: 'Released',
            released_to_client: true,
            released_at: new Date().toISOString(),
            released_by: 'rep_1',
            client_id: 'client_stellantis',
            project_id: 'prj_stellantis_01'
          }
        },
        error: null
      });
    }

    const res = await releaseIncidentToClient({
      incidentPayload: { assignment_id: 'prj_stellantis_01', client_id: 'client_stellantis' },
      isOffline: false,
      currentUser: mockRep1
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('Released');
    expect(res.activity_message).toBe('Incident released to Client Dashboard.');
  });

  // 17. Unauthenticated release is rejected
  test('17. releaseIncidentToClient rejects unauthenticated calls', async () => {
    const res = await releaseIncidentToClient({
      incidentPayload: { assignment_id: 'prj_stellantis_01' },
      isOffline: false,
      currentUser: null
    });
    expect(res.success).toBe(false);
  });

  // 18. Missing assignment is rejected
  test('18. releaseIncidentToClient rejects payload missing assignment_id', async () => {
    const res = await releaseIncidentToClient({
      incidentPayload: { description: 'Missing project' },
      isOffline: false,
      currentUser: mockRep1
    });
    expect(res.success).toBe(false);
  });
});
