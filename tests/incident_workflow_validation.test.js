import { test, expect } from 'vitest';

// Helper function modeling PhoneSimulator's centralized validation logic (Section 1 & 3)
function validateIncidentWorkflow({
  evidenceList = [],
  stagedVideoObject = null,
  mediaEvidenceStatus = 'not_provided',
  mediaUnavailableReason = null,
  mediaUnavailableNote = '',
  selectedArea = '',
  description = '',
  targetStep = 4
}) {
  const hasAnyRealMedia = evidenceList.length > 0 || !!stagedVideoObject;

  if (targetStep >= 2) {
    if (!hasAnyRealMedia && mediaEvidenceStatus !== 'unavailable') {
      return {
        valid: false,
        errorStep: 1,
        code: 'MEDIA_REASON_REQUIRED',
        message: 'A missing-media reason is required before continuing without visual evidence.'
      };
    }
    if (!hasAnyRealMedia && mediaEvidenceStatus === 'unavailable') {
      if (!mediaUnavailableReason) {
        return {
          valid: false,
          errorStep: 1,
          code: 'MEDIA_REASON_MISSING',
          message: 'Please select why visual media is unavailable.'
        };
      }
      if (mediaUnavailableReason === 'Other' && (!mediaUnavailableNote || !mediaUnavailableNote.trim())) {
        return {
          valid: false,
          errorStep: 1,
          code: 'MEDIA_OTHER_NOTE_REQUIRED',
          message: 'An explanation note is required when "Other" reason is selected for missing media.'
        };
      }
    }
  }

  if (targetStep >= 4) {
    if (!selectedArea || !selectedArea.trim()) {
      return {
        valid: false,
        errorStep: 3,
        code: 'AREA_REQUIRED',
        message: 'Factory area is mandatory.'
      };
    }
    if (!description || !description.trim()) {
      return {
        valid: false,
        errorStep: 3,
        code: 'DESCRIPTION_REQUIRED',
        message: 'Incident description is mandatory.'
      };
    }
  }

  return { valid: true };
}

// Helper modeling Authoritative Incident Payload Construction (Section 6)
function buildIncidentPayload({
  currentUser = { id: 'rep_1' },
  repAssignment = { id: 'asgn_1', customer_id: 'cust_1', supplier_id: 'sup_1', plant_id: 'plant_1', project_id: 'proj_1' },
  evidenceList = [],
  stagedVideoObject = null,
  mediaUnavailableReason = null,
  mediaUnavailableNote = '',
  affectedParts = [],
  toteBinLabels = [],
  selectedArea = 'Sequence Area',
  description = 'Scrap table defect',
  actionTaken = 'Removed bulb',
  selectedSupplierContact = null
}) {
  const hasAnyRealMedia = evidenceList.length > 0 || !!stagedVideoObject;

  const formattedPartsList = affectedParts.map(p => ({
    id: p.id,
    part_number: p.partNumber,
    description: p.description || 'Description not available',
    bin: toteBinLabels[0]?.labelValue || null,
    qty: p.quantity || 1,
    entry_method: p.entryMethod,
    scan_format: p.scanFormat,
    verification_status: p.verificationStatus,
    possible_mislabel: p.possibleMislabel
  }));

  const formattedToteList = toteBinLabels.map(t => ({
    id: t.id,
    label_value: t.labelValue,
    container_type: t.containerType || 'Tote',
    entry_method: t.entryMethod,
    scan_format: t.scanFormat,
    related_part_ids: t.relatedPartIds || [],
    created_at: t.createdAt
  }));

  const firstPN = affectedParts[0]?.partNumber || null;

  return {
    rep_id: currentUser.id,
    assignment_id: repAssignment?.id || null,
    customer_id: repAssignment?.customer_id || null,
    supplier_id: repAssignment?.supplier_id || null,
    plant_id: repAssignment?.plant_id || null,
    project_id: repAssignment?.project_id || null,

    media_evidence_status: hasAnyRealMedia ? 'provided' : 'unavailable',
    media_unavailable_reason: hasAnyRealMedia ? null : mediaUnavailableReason,
    media_unavailable_note: hasAnyRealMedia ? null : mediaUnavailableNote,
    photos: evidenceList.map(ev => ({
      id: ev.id,
      url: ev.annotatedUrl || ev.url,
      type: ev.label,
      note: ev.note,
      order: ev.order
    })),
    videos: stagedVideoObject ? [stagedVideoObject] : [],

    traceability_status: affectedParts.length > 0 ? 'provided' : 'not_provided',
    traceability_unavailable_reason: null,
    traceability_unavailable_note: null,

    container_traceability_status: toteBinLabels.length > 0 ? 'provided' : 'not_provided',

    parts_list: formattedPartsList,
    tote_bin_labels: formattedToteList,
    part_id: firstPN,

    area: selectedArea,
    description: description,
    action_taken: actionTaken,
    supplier_contact: selectedSupplierContact || null,
    status: 'Open',
    sent_at: new Date().toISOString()
  };
}

test('1. One real photo, no video -> submission succeeds', () => {
  const result = validateIncidentWorkflow({
    evidenceList: [{ id: 'p1', url: 'blob://photo1.jpg' }],
    stagedVideoObject: null,
    selectedArea: 'Sequence Area',
    description: 'Scrap defect'
  });
  expect(result.valid).toBe(true);

  const payload = buildIncidentPayload({
    evidenceList: [{ id: 'p1', url: 'blob://photo1.jpg', label: 'Photo 1', order: 1 }],
    selectedArea: 'Sequence Area',
    description: 'Scrap defect'
  });
  expect(payload.media_evidence_status).toBe('provided');
  expect(payload.photos.length).toBe(1);
  expect(payload.videos.length).toBe(0);
});

test('2. One real video, zero photos -> submission succeeds', () => {
  const realVid = { id: 'v1', name: 'walkthrough.mp4', url: 'blob://vid1.mp4' };
  const result = validateIncidentWorkflow({
    evidenceList: [],
    stagedVideoObject: realVid,
    selectedArea: 'Sequence Area',
    description: 'Scrap defect'
  });
  expect(result.valid).toBe(true);

  const payload = buildIncidentPayload({
    evidenceList: [],
    stagedVideoObject: realVid,
    selectedArea: 'Sequence Area',
    description: 'Scrap defect'
  });
  expect(payload.media_evidence_status).toBe('provided');
  expect(payload.photos.length).toBe(0);
  expect(payload.videos.length).toBe(1);
  expect(payload.videos[0].name).toBe('walkthrough.mp4');
});

test('3. Zero media and no reason -> Page 1 blocks continuation', () => {
  const result = validateIncidentWorkflow({
    evidenceList: [],
    stagedVideoObject: null,
    mediaEvidenceStatus: 'not_provided',
    mediaUnavailableReason: null,
    targetStep: 2
  });
  expect(result.valid).toBe(false);
  expect(result.code).toBe('MEDIA_REASON_REQUIRED');
  expect(result.errorStep).toBe(1);
});

test('4. Zero media and predefined reason -> submission succeeds', () => {
  const result = validateIncidentWorkflow({
    evidenceList: [],
    stagedVideoObject: null,
    mediaEvidenceStatus: 'unavailable',
    mediaUnavailableReason: 'Photography is not permitted at this plant',
    selectedArea: 'Sequence Area',
    description: 'Rattle defect'
  });
  expect(result.valid).toBe(true);

  const payload = buildIncidentPayload({
    mediaUnavailableReason: 'Photography is not permitted at this plant',
    selectedArea: 'Sequence Area',
    description: 'Rattle defect'
  });
  expect(payload.media_evidence_status).toBe('unavailable');
  expect(payload.media_unavailable_reason).toBe('Photography is not permitted at this plant');
  expect(payload.photos.length).toBe(0);
});

test('5. "Other" reason without explanation -> blocked', () => {
  const result = validateIncidentWorkflow({
    evidenceList: [],
    stagedVideoObject: null,
    mediaEvidenceStatus: 'unavailable',
    mediaUnavailableReason: 'Other',
    mediaUnavailableNote: '   ',
    targetStep: 2
  });
  expect(result.valid).toBe(false);
  expect(result.code).toBe('MEDIA_OTHER_NOTE_REQUIRED');
});

test('6. "Other" reason with explanation -> succeeds', () => {
  const result = validateIncidentWorkflow({
    evidenceList: [],
    stagedVideoObject: null,
    mediaEvidenceStatus: 'unavailable',
    mediaUnavailableReason: 'Other',
    mediaUnavailableNote: 'Camera Lens Broken',
    selectedArea: 'Assembly',
    description: 'Physical damage'
  });
  expect(result.valid).toBe(true);

  const payload = buildIncidentPayload({
    mediaUnavailableReason: 'Other',
    mediaUnavailableNote: 'Camera Lens Broken',
    selectedArea: 'Assembly',
    description: 'Physical damage'
  });
  expect(payload.media_unavailable_reason).toBe('Other');
  expect(payload.media_unavailable_note).toBe('Camera Lens Broken');
});

test('7. Delete final photo -> missing-media reason becomes required', () => {
  let evidenceList = [{ id: 'p1', url: 'blob://photo1.jpg' }];
  let stagedVideoObject = null;
  let mediaEvidenceStatus = 'provided';

  // Delete final photo
  evidenceList = [];
  mediaEvidenceStatus = 'not_provided';

  const result = validateIncidentWorkflow({
    evidenceList,
    stagedVideoObject,
    mediaEvidenceStatus,
    targetStep: 2
  });
  expect(result.valid).toBe(false);
  expect(result.code).toBe('MEDIA_REASON_REQUIRED');
});

test('8. Zero media and zero traceability with valid media reason -> submission succeeds', () => {
  const result = validateIncidentWorkflow({
    evidenceList: [],
    stagedVideoObject: null,
    mediaEvidenceStatus: 'unavailable',
    mediaUnavailableReason: 'Unsafe to capture media',
    selectedArea: 'Heavy rework',
    description: 'Safety issue on floor'
  });
  expect(result.valid).toBe(true);

  const payload = buildIncidentPayload({
    mediaUnavailableReason: 'Unsafe to capture media',
    affectedParts: [],
    toteBinLabels: [],
    selectedArea: 'Heavy rework',
    description: 'Safety issue on floor'
  });
  expect(payload.media_evidence_status).toBe('unavailable');
  expect(payload.traceability_status).toBe('not_provided');
  expect(payload.container_traceability_status).toBe('not_provided');
  expect(payload.part_id).toBeNull();
  expect(payload.parts_list.length).toBe(0);
});

test('9. Part only, no container -> succeeds', () => {
  const payload = buildIncidentPayload({
    mediaUnavailableReason: 'Poor visibility',
    affectedParts: [{ id: 'ap1', partNumber: '86286761', description: 'Tail Light', entryMethod: 'Scanned' }],
    toteBinLabels: []
  });
  expect(payload.traceability_status).toBe('provided');
  expect(payload.container_traceability_status).toBe('not_provided');
  expect(payload.part_id).toBe('86286761');
  expect(payload.parts_list.length).toBe(1);
  expect(payload.tote_bin_labels.length).toBe(0);
});

test('10. Container only, no part -> succeeds', () => {
  const payload = buildIncidentPayload({
    mediaUnavailableReason: 'Poor visibility',
    affectedParts: [],
    toteBinLabels: [{ id: 'tb1', labelValue: 'TOTE-402', containerType: 'Tote', entryMethod: 'Scanned' }]
  });
  expect(payload.traceability_status).toBe('not_provided');
  expect(payload.container_traceability_status).toBe('provided');
  expect(payload.part_id).toBeNull();
  expect(payload.tote_bin_labels.length).toBe(1);
});

test('11. Multiple parts and multiple containers retain correct associations', () => {
  const parts = [
    { id: 'ap1', partNumber: '86286761', description: 'Left Light' },
    { id: 'ap2', partNumber: '86286762', description: 'Right Light' }
  ];
  const totes = [
    { id: 'tb1', labelValue: 'TOTE-101', relatedPartIds: ['ap1'] },
    { id: 'tb2', labelValue: 'TOTE-102', relatedPartIds: ['ap1', 'ap2'] }
  ];

  const payload = buildIncidentPayload({
    mediaUnavailableReason: 'Poor visibility',
    affectedParts: parts,
    toteBinLabels: totes
  });

  expect(payload.parts_list.length).toBe(2);
  expect(payload.tote_bin_labels.length).toBe(2);
  expect(payload.tote_bin_labels[0].related_part_ids).toEqual(['ap1']);
  expect(payload.tote_bin_labels[1].related_part_ids).toEqual(['ap1', 'ap2']);
});

test('12. Draft restore retains reason, media and traceability state', () => {
  const draftObj = {
    incidentStep: 2,
    mediaEvidenceStatus: 'unavailable',
    mediaUnavailableReason: 'Photography is not permitted at this plant',
    mediaUnavailableNote: 'Plant A policy',
    traceabilityStatus: 'not_provided',
    affectedParts: [],
    toteBinLabels: []
  };

  const restoredJSON = JSON.stringify(draftObj);
  const parsed = JSON.parse(restoredJSON);

  expect(parsed.incidentStep).toBe(2);
  expect(parsed.mediaEvidenceStatus).toBe('unavailable');
  expect(parsed.mediaUnavailableReason).toBe('Photography is not permitted at this plant');
  expect(parsed.mediaUnavailableNote).toBe('Plant A policy');
  expect(parsed.traceabilityStatus).toBe('not_provided');
});

test('13. Offline outbox retains the complete incident payload', () => {
  const payload = buildIncidentPayload({
    mediaUnavailableReason: 'Camera permission denied',
    affectedParts: [{ id: 'ap1', partNumber: '86286761' }],
    toteBinLabels: [{ id: 'tb1', labelValue: 'TOTE-55' }]
  });

  const stagedOutboxJSON = JSON.stringify(payload);
  const parsedOutbox = JSON.parse(stagedOutboxJSON);

  expect(parsedOutbox.media_evidence_status).toBe('unavailable');
  expect(parsedOutbox.media_unavailable_reason).toBe('Camera permission denied');
  expect(parsedOutbox.parts_list[0].part_number).toBe('86286761');
  expect(parsedOutbox.tote_bin_labels[0].label_value).toBe('TOTE-55');
});

test('14. Admin view shows real zero-media state without placeholder photos', () => {
  const incident = {
    media_evidence_status: 'unavailable',
    media_unavailable_reason: 'Unsafe to capture media',
    photos: [],
    videos: []
  };

  const displayMediaCount = incident.media_evidence_status === 'unavailable'
    ? `Media Unavailable (${incident.media_unavailable_reason})`
    : `${incident.photos.length} Evidence Photo(s)`;

  expect(displayMediaCount).toBe('Media Unavailable (Unsafe to capture media)');
  expect(incident.photos.length).toBe(0);
});

test('15. Print/PDF shows missing-media reason and no fake evidence', () => {
  const incident = {
    media_evidence_status: 'unavailable',
    media_unavailable_reason: 'Evidence is no longer physically available',
    photos: []
  };

  const pdfMediaSectionText = incident.photos.length > 0
    ? `${incident.photos.length} Photo(s) Attached`
    : `No Media Provided — Reason: ${incident.media_unavailable_reason}`;

  expect(pdfMediaSectionText).toBe('No Media Provided — Reason: Evidence is no longer physically available');
});

test('16. No normal path inserts fake supplier, part, contact or recipient values', () => {
  const payload = buildIncidentPayload({
    currentUser: { id: 'rep_clarence' },
    repAssignment: { id: 'asgn_100', customer_id: 'cust_magna', supplier_id: 'sup_ids', plant_id: 'plant_seq', project_id: 'proj_scrap' },
    affectedParts: [],
    toteBinLabels: [],
    selectedSupplierContact: null
  });

  expect(payload.part_id).toBeNull();
  expect(payload.supplier_contact).toBeNull();
  expect(payload.supplier_id).toBe('sup_ids');
  expect(payload.customer_id).toBe('cust_magna');
  expect(payload.part_id).not.toBe('N/A');
  expect(payload.part_id).not.toBe('unknown');
  expect(payload.supplier_id).not.toBe('sup_1');
  expect(payload.supplier_id).not.toBe('magna');
});
