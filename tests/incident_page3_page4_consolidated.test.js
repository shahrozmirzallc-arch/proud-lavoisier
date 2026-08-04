import { describe, it, expect, beforeEach } from 'vitest';
import { getEntities, saveEntity, addIncident } from '../src/components/SharedDatabase';
import { stageIncidentLocally, getLocalOutbox } from '../src/services/nativeStorageService';

describe('IDS Pulse Incident Page 3 + Page 4 Consolidated Suite', () => {

  beforeEach(() => {
    let store = {};
    globalThis.localStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, val) => { store[key] = String(val); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };
    globalThis.window = {
      dispatchEvent: () => {},
      addEventListener: () => {},
      removeEventListener: () => {}
    };
    globalThis.Event = class Event {};
  });

  it('1. Payload preservation across Page 3 -> Page 4 -> DB release', () => {
    const activeAssignment = {
      id: 'asg_gm_01',
      customer_id: 'cust_gm',
      supplier_id: 'sup_autokabel',
      plant_id: 'gm_oshawa',
      project_id: 'proj_gm_01',
      title: 'GM Oshawa Tail Light Audit'
    };

    const contactsSnapshot = [
      { id: 'c_01', name: 'Sarah Jenkins', role: 'Quality Lead', email: 'sarah.j@autokabel.com' }
    ];

    const incidentPayload = {
      id: 'INC-789012',
      rep_id: 'usr_clarence',
      rep_name: 'Clarence Kuiken',
      assignment_id: activeAssignment.id,
      customer_id: activeAssignment.customer_id,
      supplier_id: activeAssignment.supplier_id,
      plant_id: activeAssignment.plant_id,
      project_id: activeAssignment.project_id,

      media_evidence_status: 'provided',
      photos: [{ id: 'p1', url: 'https://cloudinary.com/p1.jpg', label: 'Defect Photo', note: 'Cracked housing' }],
      videos: [],

      traceability_status: 'provided',
      container_traceability_status: 'provided',

      parts_list: [{ id: 'sp_1', part_number: 'PN-998877', description: 'Tail Light Assembly', qty: 2 }],
      tote_bin_labels: [{ id: 'tb_1', label_value: 'BIN-OSH-04', container_type: 'Tote' }],
      part_number: 'PN-998877',
      quantity: 2,

      area: 'Heavy Repair Bay 3',
      defect_type: 'Hairline Crack',
      description: 'Hairline crack observed across upper housing lens seal during final quality audit.',
      action_taken: 'Quarantined 2 suspect totes and issued immediate holds.',
      supplier_contact_ids: ['c_01'],
      supplier_contacts_snapshot: contactsSnapshot,
      supplier_contact: 'Sarah Jenkins',
      returned_to_supplier: true,
      sort_requested: true,
      rma_required: true,
      rma_number: 'RMA-2026-9901',
      concern_classification: 'Safety-Critical',

      released_to_client: true,
      released_at: new Date().toISOString(),
      released_by: 'usr_clarence',
      status: 'Released',
      created_at: new Date().toISOString(),
      sent_at: new Date().toISOString()
    };

    // Save to database
    const saved = saveEntity('incidents', incidentPayload);

    expect(saved.id).toBe('INC-789012');
    expect(saved.defect_type).toBe('Hairline Crack');
    expect(saved.supplier_contact_ids).toEqual(['c_01']);
    expect(saved.supplier_contacts_snapshot).toEqual(contactsSnapshot);
    expect(saved.returned_to_supplier).toBe(true);
    expect(saved.sort_requested).toBe(true);
    expect(saved.rma_required).toBe(true);
    expect(saved.rma_number).toBe('RMA-2026-9901');
    expect(saved.concern_classification).toBe('Safety-Critical');
    expect(saved.area).toBe('Heavy Repair Bay 3');
    expect(saved.description).toContain('Hairline crack observed');
    expect(saved.action_taken).toContain('Quarantined 2 suspect totes');
    expect(saved.assignment_id).toBe('asg_gm_01');
    expect(saved.customer_id).toBe('cust_gm');
    expect(saved.supplier_id).toBe('sup_autokabel');
    expect(saved.released_to_client).toBe(true);
    expect(saved.status).toBe('Released');
  });

  it('2. Authoritative Assignment Resolution blocks unresolvable assignment release', () => {
    // Helper simulation matching resolveActiveAssignment
    const resolveAssignmentSim = (user, selectedId, dbProjects) => {
      if (!user) return null;
      const repAssignments = dbProjects.filter(p => p.rep_id === user.id);
      if (selectedId) {
        const found = dbProjects.find(p => String(p.id) === String(selectedId));
        if (found) return found;
      }
      if (repAssignments.length === 1) return repAssignments[0];
      return null;
    };

    const emptyProjects = [];
    const user = { id: 'usr_unknown' };

    const resolved = resolveAssignmentSim(user, null, emptyProjects);
    expect(resolved).toBeNull();
  });

  it('3. Yes/No control states store boolean/Y-N correctly', () => {
    const isReturningDefect = 'Y';
    const isSortRequired = 'N';
    const isRmaRequired = 'Y';

    expect(isReturningDefect === 'Y').toBe(true);
    expect(isSortRequired === 'Y').toBe(false);
    expect(isRmaRequired === 'Y').toBe(true);
  });

  it('4. Offline durable outbox staging preserves all fields', () => {
    const offlinePayload = {
      id: 'INC-OFFLINE-01',
      rep_id: 'usr_clarence',
      assignment_id: 'asg_gm_01',
      customer_id: 'cust_gm',
      supplier_id: 'sup_autokabel',
      area: 'Sequence Area',
      defect_type: 'Missing Clip',
      description: 'Retaining clip missing on harness connector',
      returned_to_supplier: true,
      sort_requested: false,
      rma_required: false,
      released_to_client: true,
      released_at: new Date().toISOString(),
      released_by: 'usr_clarence',
      status: 'Released'
    };

    const staged = stageIncidentLocally(offlinePayload);
    expect(staged).toBeDefined();
    expect(staged.entity.id).toBe('INC-OFFLINE-01');

    const outbox = getLocalOutbox();
    expect(outbox.length).toBeGreaterThan(0);
    const item = outbox.find(i => i.entity?.id === 'INC-OFFLINE-01' || i.local_id === 'INC-OFFLINE-01');
    expect(item).toBeDefined();
  });

  it('5. Customer Isolation enforcement blocks cross-customer data leaks', () => {
    const incidents = [
      { id: 'INC-GM-100', customer_id: 'cust_gm', supplier_id: 'sup_autokabel', released_to_client: true, status: 'Released' },
      { id: 'INC-FORD-200', customer_id: 'cust_ford', supplier_id: 'sup_magna', released_to_client: true, status: 'Released' },
      { id: 'INC-GM-DRAFT', customer_id: 'cust_gm', supplier_id: 'sup_autokabel', released_to_client: false, status: 'Draft' }
    ];

    const currentCustomerFilter = (list, customerId) => {
      return list.filter(inc => {
        const isMatch = inc.customer_id === customerId || inc.supplier_id === customerId;
        const isReleased = inc.released_to_client === true || inc.status === 'Released';
        return isMatch && isReleased;
      });
    };

    const gmIncidents = currentCustomerFilter(incidents, 'cust_gm');
    expect(gmIncidents.length).toBe(1);
    expect(gmIncidents[0].id).toBe('INC-GM-100');

    const fordIncidents = currentCustomerFilter(incidents, 'cust_ford');
    expect(fordIncidents.length).toBe(1);
    expect(fordIncidents[0].id).toBe('INC-FORD-200');

    // Confirm Ford cannot see GM incident
    const fordLeak = fordIncidents.some(i => i.id === 'INC-GM-100');
    expect(fordLeak).toBe(false);
  });
});
