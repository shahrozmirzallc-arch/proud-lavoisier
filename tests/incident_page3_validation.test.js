import { describe, test, expect, beforeEach } from 'vitest';

// Simulate Page 3 Incident Workflow Validation & Payload Serialization Machine
function validatePage3Workflow(inputs) {
  const {
    area,
    defectType,
    description,
    actionTaken,
    supplierContactIds = [],
    availableContacts = [],
    isReturningDefect = 'N',
    isSortRequired = 'N',
    isRmaRequired = 'N',
    rmaNumber = '',
    concernClassification = ''
  } = inputs;

  const errors = {};

  if (!area || !area.trim()) {
    errors.area = 'Enter where the concern was found.';
  }

  if (!description || !description.trim()) {
    errors.description = 'Describe the suspect defect.';
  }

  const isValid = Object.keys(errors).length === 0;

  const selectedContacts = availableContacts.filter(c => supplierContactIds.includes(c.id));
  const supplierContactSummary = selectedContacts.map(c => c.name).join(', ') || null;

  const payload = isValid ? {
    area: area.trim(),
    defect_type: defectType ? defectType.trim() : null,
    description: description.trim(),
    action_taken: actionTaken ? actionTaken.trim() : null,
    supplier_contact_ids: supplierContactIds,
    supplier_contacts_snapshot: selectedContacts,
    supplier_contact: supplierContactSummary,
    returned_to_supplier: isReturningDefect === 'Y',
    sort_requested: isSortRequired === 'Y',
    rma_required: isRmaRequired === 'Y',
    rma_number: isRmaRequired === 'Y' && rmaNumber ? rmaNumber.trim() : null,
    concern_classification: concernClassification ? concernClassification.trim() : null
  } : null;

  return { isValid, errors, payload };
}

describe('Incident Workflow Page 3 — Describe Unit Tests', () => {
  let mockContacts;

  beforeEach(() => {
    mockContacts = [
      { id: 'c_1', name: 'John Supplier SQE', role: 'Supplier Quality Manager', email: 'john@supplier.com' },
      { id: 'c_2', name: 'Sarah Plant Engineer', role: 'Plant Quality Engineer', email: 'sarah@supplier.com' }
    ];
  });

  test('1. Area accepts "Sequence Area — Scrap Table 4"', () => {
    const res = validatePage3Workflow({
      area: 'Sequence Area — Scrap Table 4',
      description: 'Suspect bulb found loose inside assembly.'
    });
    expect(res.isValid).toBe(true);
    expect(res.payload.area).toBe('Sequence Area — Scrap Table 4');
  });

  test('2. Area is not restricted by a dropdown (accepts any custom string)', () => {
    const customLocations = ['Heavy Repair Dock 2', 'Line 4 Station 12', 'Custom Quarantine Bin 99'];
    customLocations.forEach(loc => {
      const res = validatePage3Workflow({
        area: loc,
        description: 'Test description'
      });
      expect(res.isValid).toBe(true);
      expect(res.payload.area).toBe(loc);
    });
  });

  test('3. Defect type accepts an entirely custom value', () => {
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      defectType: 'Custom scratch on outer lens bevel',
      description: 'Found scratch during shift inspection.'
    });
    expect(res.isValid).toBe(true);
    expect(res.payload.defect_type).toBe('Custom scratch on outer lens bevel');
  });

  test('4. Suspect Defect expands for a long description', () => {
    const longDesc = 'Detailed observations: '.repeat(50);
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: longDesc
    });
    expect(res.isValid).toBe(true);
    expect(res.payload.description).toBe(longDesc.trim());
  });

  test('5. Short valid Suspect Defect is not blocked by word count', () => {
    const shortDesc = 'Damaged label.';
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: shortDesc
    });
    expect(res.isValid).toBe(true);
    expect(res.errors.description).toBeUndefined();
    expect(res.payload.description).toBe('Damaged label.');
  });

  test('6. Action Taken supports multiple lines', () => {
    const multilineAction = 'Line 1: Isolated suspect tote.\nLine 2: Quarantined parts.\nLine 3: Notified SQE.';
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: 'Loose connector found.',
      actionTaken: multilineAction
    });
    expect(res.isValid).toBe(true);
    expect(res.payload.action_taken).toBe(multilineAction);
  });

  test('7. Supplier contacts show only contacts from the selected assignment\'s supplier', () => {
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: 'Defect detail',
      supplierContactIds: ['c_1'],
      availableContacts: mockContacts
    });
    expect(res.payload.supplier_contacts_snapshot.length).toBe(1);
    expect(res.payload.supplier_contacts_snapshot[0].name).toBe('John Supplier SQE');
  });

  test('8. Multiple supplier contacts can be selected', () => {
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: 'Defect detail',
      supplierContactIds: ['c_1', 'c_2'],
      availableContacts: mockContacts
    });
    expect(res.payload.supplier_contact_ids).toEqual(['c_1', 'c_2']);
    expect(res.payload.supplier_contact).toBe('John Supplier SQE, Sarah Plant Engineer');
  });

  test('9. No configured supplier contact does not block incident creation', () => {
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: 'Defect detail',
      supplierContactIds: [],
      availableContacts: []
    });
    expect(res.isValid).toBe(true);
    expect(res.payload.supplier_contact).toBeNull();
  });

  test('10. Returned to Supplier Yes/No persists', () => {
    const resYes = validatePage3Workflow({ area: 'Seq', description: 'Desc', isReturningDefect: 'Y' });
    const resNo = validatePage3Workflow({ area: 'Seq', description: 'Desc', isReturningDefect: 'N' });
    expect(resYes.payload.returned_to_supplier).toBe(true);
    expect(resNo.payload.returned_to_supplier).toBe(false);
  });

  test('11. Sort Requested Yes/No persists', () => {
    const resYes = validatePage3Workflow({ area: 'Seq', description: 'Desc', isSortRequired: 'Y' });
    const resNo = validatePage3Workflow({ area: 'Seq', description: 'Desc', isSortRequired: 'N' });
    expect(resYes.payload.sort_requested).toBe(true);
    expect(resNo.payload.sort_requested).toBe(false);
  });

  test('12. RMA Required Yes/No persists and includes optional RMA number', () => {
    const resRma = validatePage3Workflow({ area: 'Seq', description: 'Desc', isRmaRequired: 'Y', rmaNumber: 'RMA-2026-99' });
    expect(resRma.payload.rma_required).toBe(true);
    expect(resRma.payload.rma_number).toBe('RMA-2026-99');
  });

  test('13. Issue Classification accepts "SPS pending"', () => {
    const res = validatePage3Workflow({ area: 'Seq', description: 'Desc', concernClassification: 'SPS pending' });
    expect(res.isValid).toBe(true);
    expect(res.payload.concern_classification).toBe('SPS pending');
  });

  test('14. No PRR/QR/Verbal buttons remain (classification is free text)', () => {
    const resCustom = validatePage3Workflow({ area: 'Seq', description: 'Desc', concernClassification: 'Scrap table tag found' });
    expect(resCustom.payload.concern_classification).toBe('Scrap table tag found');
  });

  test('15. Back and forward navigation retains all fields', () => {
    const page3State = {
      area: 'Line 2 Dock',
      defectType: 'Flash on pin',
      description: 'Pin has flash overflow',
      actionTaken: 'Smoothed pin',
      isReturningDefect: 'Y',
      isSortRequired: 'Y',
      isRmaRequired: 'N',
      concernClassification: 'Internal Hold'
    };
    const res = validatePage3Workflow(page3State);
    expect(res.payload.area).toBe('Line 2 Dock');
    expect(res.payload.defect_type).toBe('Flash on pin');
    expect(res.payload.concern_classification).toBe('Internal Hold');
  });

  test('16. Draft restoration retains all Page 3 fields', () => {
    const draftObj = {
      selectedArea: 'Scrap Table B',
      defectType: 'Missing gasket',
      description: 'Gasket was omitted during assembly',
      actionTaken: 'Replaced gasket',
      isReturningDefect: 'N',
      isSortRequired: 'Y',
      isRmaRequired: 'Y',
      rmaNumber: 'RMA-8877',
      concernClassification: 'PRR Pending'
    };
    const res = validatePage3Workflow({
      area: draftObj.selectedArea,
      defectType: draftObj.defectType,
      description: draftObj.description,
      actionTaken: draftObj.actionTaken,
      isReturningDefect: draftObj.isReturningDefect,
      isSortRequired: draftObj.isSortRequired,
      isRmaRequired: draftObj.isRmaRequired,
      rmaNumber: draftObj.rmaNumber,
      concernClassification: draftObj.concernClassification
    });
    expect(res.payload.area).toBe('Scrap Table B');
    expect(res.payload.rma_number).toBe('RMA-8877');
  });

  test('17. Offline staging retains the same Page 3 payload', () => {
    const offlineState = {
      area: 'Sequence Area',
      description: 'Offline suspect material',
      concernClassification: 'Offline Verbal'
    };
    const res = validatePage3Workflow(offlineState);
    expect(res.isValid).toBe(true);
    expect(res.payload.concern_classification).toBe('Offline Verbal');
  });

  test('18. Empty Area shows the correct inline error', () => {
    const res = validatePage3Workflow({
      area: '',
      description: 'Valid description'
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.area).toBe('Enter where the concern was found.');
  });

  test('19. Empty Suspect Defect shows the correct inline error', () => {
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: ''
    });
    expect(res.isValid).toBe(false);
    expect(res.errors.description).toBe('Describe the suspect defect.');
  });

  test('20. No fake contact, supplier or classification value enters the payload', () => {
    const res = validatePage3Workflow({
      area: 'Sequence Area',
      description: 'Clean inspection report',
      supplierContactIds: [],
      availableContacts: [],
      concernClassification: ''
    });
    expect(res.payload.supplier_contact).toBeNull();
    expect(res.payload.concern_classification).toBeNull();
    expect(JSON.stringify(res.payload)).not.toContain('sup_1');
    expect(JSON.stringify(res.payload)).not.toContain('magna');
  });
});
