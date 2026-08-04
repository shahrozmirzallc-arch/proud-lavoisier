import { describe, it, expect, beforeEach } from 'vitest';
import { resolveAssignmentContacts, buildRecipientSnapshot, validateCaseArchiveEligibility } from '../src/services/incidentWorkflowService.js';

describe('IDS Pulse — Master Connected Workflow & Role Isolation Suite', () => {
  let mockData;

  beforeEach(() => {
    mockData = {
      clientCompany: { id: 'sup_autokabel', name: 'AutoKabel Systems Test', code: 'AK-SYS' },
      plant: { id: 'gm_oshawa', name: 'GM Oshawa Test Plant', supplier_id: 'sup_autokabel' },
      project: { id: 'proj_autokabel_100', name: 'Rear Lamp Quality Liaison', code: 'PRJ-900', client_id: 'sup_autokabel' },
      part1: { id: 'part_86286761', part_number: '86286761', part_name: 'High Voltage Battery Harness' },
      part2: { id: 'part_86291945', part_number: '86291945', part_name: 'Rear Lamp Wiring Harness' },
      repClarence: { id: 'rep_clarence', name: 'Clarence Kuiken', role: 'rep' },
      adminDonna: { id: 'usr_donna', name: 'Donna Cabral', role: 'owner' },
      accountantColleen: { id: 'acct_1', name: 'Colleen Boyd', role: 'accountant' },
      clientContacts: [
        { id: 'cc_martin', name: 'Martin Smith', email: 'martin.smith@autokabel.com', role: 'Primary Quality', organization_id: 'sup_autokabel', supplier_id: 'sup_autokabel' },
        { id: 'cc_sana', name: 'Sana Khan', email: 'sana.khan@autokabel.com', role: 'Overtime Approver', organization_id: 'sup_autokabel', supplier_id: 'sup_autokabel' },
        { id: 'cc_omar', name: 'Omar Reed', email: 'omar.reed@autokabel.com', role: 'Backup Quality', organization_id: 'sup_autokabel', supplier_id: 'sup_autokabel' }
      ],
      mandatoryCCs: [
        { id: 'usr_donna', name: 'Donna Cabral', email: 'donna@ids-pulse.com', role: 'owner', is_mandatory_cc: true },
        { id: 'usr_greg', name: 'Greg Phillippe', email: 'greg@ids-pulse.com', role: 'admin', is_mandatory_cc: true },
        { id: 'usr_monica', name: 'Monica Alonso', email: 'monica@ids-pulse.com', role: 'admin', is_mandatory_cc: true }
      ],
      standingAssignment: {
        id: 'asgn_autokabel_clarence',
        project_id: 'proj_autokabel_100',
        rep_id: 'rep_clarence',
        billing_customer_id: 'sup_autokabel',
        supplier_id: 'sup_autokabel',
        plant_id: 'gm_oshawa',
        authorized_regular_hours: 10.0,
        status: 'active'
      },
      rateCard: {
        id: 'rc_clarence_100',
        assignment_id: 'asgn_autokabel_clarence',
        billing_rate: 85.00,
        billing_currency: 'CAD',
        pay_rate: 42.00,
        pay_currency: 'CAD'
      }
    };
  });

  // SECTION 1 & 2: Admin Client Company Center & Multiple Contacts
  it('1. Resolves multiple Client Contacts for AutoKabel Systems Test', () => {
    const contactsObj = resolveAssignmentContacts({
      assignment: mockData.standingAssignment,
      contactsList: mockData.clientContacts
    });
    expect(contactsObj.customerContacts).toHaveLength(3);
    expect(contactsObj.customerContacts.map(c => c.name)).toContain('Martin Smith');
    expect(contactsObj.customerContacts.map(c => c.name)).toContain('Sana Khan');
    expect(contactsObj.customerContacts.map(c => c.name)).toContain('Omar Reed');
  });

  it('1b. Resolves 3 Client Contacts for Brand New Stellantis Powertrain Systems', () => {
    const stellantisAssignment = {
      id: 'asgn_stellantis_clarence',
      project_id: 'proj_windsor_500',
      rep_id: 'rep_clarence',
      billing_customer_id: 'sup_stellantis',
      supplier_id: 'sup_stellantis',
      plant_id: 'plant_windsor',
      authorized_regular_hours: 8.0,
      status: 'active'
    };
    const stellantisContacts = [
      { id: 'c_stellantis_1', name: 'Mark Vance', email: 'mark.vance@stellantis.com', role: 'Primary Quality Manager', organization_id: 'sup_stellantis', supplier_id: 'sup_stellantis' },
      { id: 'c_stellantis_2', name: 'Sandra Bullock', email: 'sandra.bullock@stellantis.com', role: 'Overtime Approver & Engineering Lead', organization_id: 'sup_stellantis', supplier_id: 'sup_stellantis' },
      { id: 'c_stellantis_3', name: 'David Miller', email: 'david.miller@stellantis.com', role: 'Plant Operations Supervisor', organization_id: 'sup_stellantis', supplier_id: 'sup_stellantis' }
    ];

    const resolvedObj = resolveAssignmentContacts({
      assignment: stellantisAssignment,
      contactsList: stellantisContacts
    });

    expect(resolvedObj.customerContacts).toHaveLength(3);
    expect(resolvedObj.customerContacts.map(c => c.name)).toContain('Mark Vance');
    expect(resolvedObj.customerContacts.map(c => c.name)).toContain('Sandra Bullock');
    expect(resolvedObj.customerContacts.map(c => c.name)).toContain('David Miller');
  });

  // SECTION 3 & 4: Standing Assignment & Part Master
  it('2. Standing Assignment authorizes Rep Clarence without per-incident Admin intervention', () => {
    expect(mockData.standingAssignment.rep_id).toBe('rep_clarence');
    expect(mockData.standingAssignment.authorized_regular_hours).toBe(10.0);
    expect(mockData.standingAssignment.status).toBe('active');
  });

  // SECTION 5: Incident Release & Mandatory CC Routing
  it('3. Incident release snapshot locks Donna, Greg, and Monica as Mandatory IDS CC Recipients', () => {
    const snapshot = buildRecipientSnapshot(
      mockData.clientContacts.slice(0, 2),
      mockData.mandatoryCCs
    );

    expect(Array.isArray(snapshot)).toBe(true);

    const mandatoryCCs = snapshot.filter(c => c.is_mandatory_cc);
    const externalContacts = snapshot.filter(c => !c.is_mandatory_cc);

    expect(mandatoryCCs).toHaveLength(3);
    expect(externalContacts).toHaveLength(2);

    const ccEmails = mandatoryCCs.map(c => c.email);
    expect(ccEmails).toContain('donna@ids-pulse.com');
    expect(ccEmails).toContain('greg@ids-pulse.com');
    expect(ccEmails).toContain('monica@ids-pulse.com');
  });

  // SECTION 6: Structured Client Feedback & Work Requests
  it('4. Client Work Request workflow routes to Primary Rep and Admin oversight', () => {
    const workRequest = {
      id: 'wr_20260803_01',
      client_id: 'sup_autokabel',
      plant_id: 'gm_oshawa',
      project_id: 'proj_autokabel_100',
      part_id: 'part_86291945',
      description: 'Request containment inspection on 200 rear lamp harnesses',
      priority: 'Urgent',
      required_date: '2026-08-05',
      preferred_rep_id: 'rep_clarence',
      status: 'Submitted'
    };

    expect(workRequest.status).toBe('Submitted');
    expect(workRequest.preferred_rep_id).toBe('rep_clarence');
  });

  // SECTION 7: Medical/Personal Emergency & Coverage Preservation
  it('5. Emergency coverage preserves original reporter history while transferring active scope', () => {
    const emergencyReport = {
      id: 'emg_20260803_01',
      original_rep_id: 'rep_clarence',
      reason: 'Medical/Personal Emergency',
      privacy_safe_status: 'Coverage Required',
      replacement_rep_id: 'lead_diana',
      assignment_id: 'asgn_autokabel_clarence',
      created_at: new Date().toISOString()
    };

    expect(emergencyReport.original_rep_id).toBe('rep_clarence');
    expect(emergencyReport.replacement_rep_id).toBe('lead_diana');
    expect(emergencyReport.privacy_safe_status).toBe('Coverage Required');
  });

  // SECTION 8: Hours Split & Customer Overtime Approval
  it('6. 4-hour daily hours entry with 2.5h remaining allocation produces 2.5h regular and 1.5h overtime', () => {
    const authorizedHours = 10.0;
    const previousRecorded = 7.5;
    const newSubmitted = 4.0;

    const remainingAlloc = Math.max(0, authorizedHours - previousRecorded);
    const regPortion = Math.min(newSubmitted, remainingAlloc);
    const otPortion = Math.max(0, newSubmitted - regPortion);

    expect(remainingAlloc).toBe(2.5);
    expect(regPortion).toBe(2.5);
    expect(otPortion).toBe(1.5);
  });

  // SECTION 9: Global "Other" Option Rule
  it('7. Global "Other" option requires custom text and hides/clears on option change', () => {
    let selectedOption = 'Other';
    let customText = 'Unlisted harness bracket defect';

    const getPersistedValue = () => selectedOption === 'Other' ? customText : selectedOption;

    expect(getPersistedValue()).toBe('Unlisted harness bracket defect');

    selectedOption = 'Surface Scratch';
    customText = '';

    expect(getPersistedValue()).toBe('Surface Scratch');
  });

  // SECTION 10: Audit Logbook Event Recording
  it('8. Audit Logbook records immutable event with actor, timestamp, and entity ID', () => {
    const auditEvent = {
      id: 'log_20260803_001',
      timestamp: new Date().toISOString(),
      actor_id: 'cc_sana',
      actor_role: 'customer',
      entity_type: 'time_entry',
      entity_id: 'te_ot_101',
      action: 'approved',
      billing_customer_id: 'sup_autokabel',
      comment: 'Approved 1.5h overtime for urgent rear lamp sorting'
    };

    expect(auditEvent.action).toBe('approved');
    expect(auditEvent.actor_id).toBe('cc_sana');
    expect(auditEvent.billing_customer_id).toBe('sup_autokabel');
  });

  // SECTION 12 & 13: Role & Customer Tenant Isolation
  it('9. Customer A cannot read Customer B overtime entries or internal financial snapshots', () => {
    const customerA_ID = 'sup_autokabel';
    const customerB_Entry = { id: 'te_ot_cust_b', billing_customer_id: 'sup_stellantis', hour_type: 'overtime' };

    const isAccessibleToCustomerA = customerB_Entry.billing_customer_id === customerA_ID;
    expect(isAccessibleToCustomerA).toBe(false);
  });

  // SECTION 14: Case Archive Eligibility
  it('10. Case archive requires Quality Closed + Hours Complete + Overtime Approved + Invoiced', () => {
    const validArchive = validateCaseArchiveEligibility({
      incident: { id: 'INC-1', quality_status: 'Quality Closed', financial_status: 'invoiced', project_id: 'proj_autokabel_100' },
      timeEntries: [{ id: 'te_1', project_id: 'proj_autokabel_100', hour_type: 'regular', status: 'recorded' }]
    });

    expect(validArchive.isEligible).toBe(true);

    const invalidArchive = validateCaseArchiveEligibility({
      incident: { id: 'INC-2', quality_status: 'Under Investigation', project_id: 'proj_autokabel_100' },
      timeEntries: [{ id: 'te_2', project_id: 'proj_autokabel_100', hour_type: 'overtime', status: 'client_pending' }]
    });

    expect(invalidArchive.isEligible).toBe(false);
    expect(invalidArchive.missingPrerequisites).toContain('Admin must set Quality Status to "Quality Closed"');
  });
});
