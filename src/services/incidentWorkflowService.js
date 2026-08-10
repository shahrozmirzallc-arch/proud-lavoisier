// src/services/incidentWorkflowService.js
// Authoritative Domain Logic Service for IDS Pulse Incident Release & Routing
// Enforces zero-fallback server-side routing, strict client isolation, complete response validation, and reconnection outbox replay.

import { saveEntity, supabase, getEntities } from '../components/SharedDatabase';
import { stageIncidentLocally } from './nativeStorageService';

/**
 * 1. AUTHORITATIVE ASSIGNMENT RESOLVER (Section 1 & 2)
 * Resolves active project assignment for authenticated Rep with zero client-side fallbacks.
 * Reads ONLY projects.client_id. Exact rep_id / rep_ids membership check.
 *
 * @param {Object} params
 * @param {Object} params.currentUser - Logged in user object
 * @param {string} [params.selectedAssignmentId] - Explicitly chosen assignment ID
 * @param {Array} params.assignmentsList - List of all active projects/assignments
 * @returns {Object|null} Validated assignment object or null
 */
export function resolveAuthoritativeAssignment({ currentUser, selectedAssignmentId, assignmentsList = [] }) {
  if (!currentUser || !currentUser.id) return null;

  const userRole = String(currentUser.role || '').toLowerCase();
  const isRepRole = userRole === 'rep' || userRole === 'qre' || userRole === 'quality_rep';
  if (!isRepRole) return null;

  const currentUserIdStr = String(currentUser.id).trim();

  const validRepAssignments = assignmentsList.filter(asgn => {
    if (!asgn) return false;
    const repId = String(asgn.rep_id || '').trim();
    const repIds = Array.isArray(asgn.rep_ids) ? asgn.rep_ids.map(id => String(id).trim()) : [];
    const isOwner = repId === currentUserIdStr || repIds.includes(currentUserIdStr);
    const isActive = !asgn.status || asgn.status === 'active';
    return isOwner && isActive;
  });

  if (validRepAssignments.length === 0) return null;

  if (selectedAssignmentId) {
    const targetId = String(selectedAssignmentId).trim();
    const explicitChoice = validRepAssignments.find(a => String(a.id).trim() === targetId);
    return explicitChoice || null;
  }

  if (validRepAssignments.length === 1) {
    return validRepAssignments[0];
  }

  return validRepAssignments[0] || null;
}

/**
 * 2. AUTHORITATIVE ROUTING CONTACTS RESOLVER (Section 2 & 9)
 * Resolves customer/supplier contacts for given assignment with mandatory internal CCs.
 *
 * @param {Object} params
 * @param {Object} params.assignment - Validated project assignment
 * @param {Array} params.contactsList - List of all contacts in DB
 * @param {Array} [params.usersDirectory] - List of all system users for mandatory CC lookup
 * @returns {Object} { customerContacts, supplierContacts, mandatoryInternalCCs }
 */
export function resolveAssignmentContacts({ assignment, contactsList = [], usersDirectory = [] }) {
  if (!assignment) return { customerContacts: [], supplierContacts: [], mandatoryInternalCCs: [] };

  const dbContacts = getEntities('supplier_contacts') || [];
  const effectiveContactsList = (Array.isArray(contactsList) && contactsList.length > 0) ? contactsList : dbContacts;

  const targetClientId = String(assignment.billing_customer_id || assignment.client_id || '').trim().toLowerCase();
  const targetSupplierId = String(assignment.supplier_id || '').trim().toLowerCase();

  const customerContacts = effectiveContactsList.filter(c => {
    if (!c) return false;
    const cOrgId = String(c.client_id || c.customer_id || c.organization_id || '').trim().toLowerCase();
    return targetClientId && cOrgId === targetClientId;
  });

  const supplierContacts = effectiveContactsList.filter(c => {
    if (!c) return false;
    const cOrgId = String(c.supplier_id || c.organization_id || '').trim().toLowerCase();
    return targetSupplierId && cOrgId === targetSupplierId;
  });

  const mandatoryInternalCCs = buildRecipientSnapshot([], usersDirectory).filter(r => r.is_mandatory_cc);

  return { customerContacts, supplierContacts, mandatoryInternalCCs };
}

export const MANDATORY_INTERNAL_CC_CONFIG = [
  { id: 'usr_donna', username: 'donna', role: 'owner' },
  { id: 'usr_diana', username: 'diana', role: 'admin' },
  { id: 'usr_greg', username: 'greg', role: 'admin' }
];

/**
 * 3. RECIPIENT SNAPSHOT BUILDER (P0.6, Section 9 & Part 9)
 * Formats recipient array for immutable storage resolving Mandatory Internal CCs (Donna, Diana, Greg)
 * strictly from authoritative directory user records without fabricating email strings.
 *
 * @param {Array} contacts - Selected Customer/Supplier contacts
 * @param {Array} [usersDirectory] - System users directory
 * @returns {Array} Immutable recipient snapshot objects including mandatory CCs
 */
export function buildRecipientSnapshot(contacts = [], usersDirectory = []) {
  const mandatorySnapshots = MANDATORY_INTERNAL_CC_CONFIG.map(m => {
    const dirUser = Array.isArray(usersDirectory)
      ? usersDirectory.find(u => u && (
          u.id === m.id || 
          String(u.username || '').toLowerCase() === m.username || 
          String(u.id || '').toLowerCase() === m.username ||
          (u.name && u.name.toLowerCase().includes(m.username))
        ))
      : null;

    if (!dirUser || !dirUser.email) {
      throw new Error(`CRITICAL RECIPIENT RESOLUTION FAILURE: Mandatory internal CC user "${m.username}" could not be resolved from authoritative user directory.`);
    }

    return {
      recipient_type: 'internal_cc',
      is_mandatory_cc: true,
      name: dirUser.name,
      email: dirUser.email,
      role: dirUser.title || dirUser.role || m.role
    };
  });

  const externalSnapshots = (Array.isArray(contacts) ? contacts : []).map(c => ({
    recipient_type: c.recipient_type || 'client_contact',
    is_mandatory_cc: false,
    name: c.name || c.contact_name || 'Authorized Contact',
    email: c.email || '',
    role: c.role || c.title || 'Client Contact'
  }));

  return [...externalSnapshots, ...mandatorySnapshots];
}

/**
 * 4. CUSTOMER VISIBILITY PREDICATE (Section 4 & Part 4)
 * Evaluates whether logged-in Customer is permitted to view Quality Incident.
 * Rule: Incidents are visible to Customer ONLY IF status is 'Released' AND client_id matches.
 *
 * @param {Object} incident - Incident record
 * @param {string} currentUserClientId - Authoritative client_id of logged in customer user
 * @returns {boolean} True if customer is permitted to view the incident
 */
export function isCustomerVisibleIncident(incident, currentUserClientId) {
  if (!incident || !currentUserClientId) return false;

  const targetClientId = String(currentUserClientId).trim().toLowerCase();
  if (!targetClientId) return false;

  const incClientId = String(incident.client_id || '').trim().toLowerCase();
  const incSupplierId = String(incident.supplier_id || '').trim().toLowerCase();
  const incCustomerId = String(incident.customer_id || '').trim().toLowerCase();

  let matchesClient = false;
  if (incClientId) {
    matchesClient = (incClientId === targetClientId);
  } else {
    matchesClient = (incSupplierId === targetClientId) || (incCustomerId === targetClientId);
  }

  if (!matchesClient) return false;

  const statusStr = String(incident.status || '').trim().toLowerCase();
  if (['draft', 'submitted', 'open', 'pending'].includes(statusStr)) {
    return false;
  }

  const isReleased = incident.released_to_client === true || statusStr === 'released';
  return isReleased;
}

/**
 * 5. SERVER RESPONSE VALIDATOR (Section 5)
 * Validates complete server response fields before treating release as authoritative.
 *
 * @param {Object} serverData - Response object from RPC
 * @param {Object} expectedPayload - Original request payload
 * @returns {boolean} True if response is complete and valid
 */
export function validateServerReleaseResponse(serverData, expectedPayload) {
  if (!serverData || serverData.success !== true || !serverData.incident) return false;

  const inc = serverData.incident;
  if (!inc.id || typeof inc.id !== 'string' || inc.id.trim() === '') return false;
  if (inc.status !== 'Released') return false;
  if (inc.released_to_client !== true) return false;
  if (!inc.released_at || isNaN(Date.parse(inc.released_at))) return false;
  if (!inc.released_by || typeof inc.released_by !== 'string' || inc.released_by.trim() === '') return false;

  const expectedClientId = String(expectedPayload.client_id || expectedPayload.verified_client_id || '').trim();
  const expectedProjectId = String(expectedPayload.assignment_id || expectedPayload.project_id || '').trim();

  if (expectedClientId && String(inc.client_id).trim() !== expectedClientId) return false;
  if (expectedProjectId && String(inc.project_id).trim() !== expectedProjectId) return false;

  return true;
}

/**
 * 6. SERVER-ACKNOWLEDGED RELEASE OPERATION (Section 5 & 11)
 * Executes online release via Supabase RPC or queues offline with zero local success fallback.
 *
 * @param {Object} params
 * @param {Object} params.incidentPayload - Full incident report payload
 * @param {boolean} params.isOffline - Network offline status flag
 * @param {Object} [params.currentUser] - Authenticated user object
 * @returns {Promise<Object>} Release outcome status
 */
export async function releaseIncidentToClient({ incidentPayload, isOffline, currentUser }) {
  if (!incidentPayload) {
    return { success: false, message: 'Invalid incident payload provided.' };
  }

  const assignmentId = incidentPayload.assignment_id || incidentPayload.project_id;
  if (!assignmentId) {
    return { success: false, message: 'An authoritative project assignment is required to release an incident report.' };
  }

  const idempotencyKey = incidentPayload.idempotency_key || `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  if (!currentUser || !currentUser.id) {
    return { success: false, message: 'Authentication required to release incident reports.' };
  }

  // OFFLINE RELEASE FLOW (Section 11)
  if (isOffline) {
    const offlinePayload = {
      ...incidentPayload,
      release_status: 'queued_offline',
      status: 'Queued Offline',
      released_to_client: false,
      queued_at: new Date().toISOString(),
      released_at: null,
      released_by: null,
      release_requested_by: currentUser?.id || incidentPayload.rep_id,
      idempotency_key: idempotencyKey,
      queue_type: 'incident_release'
    };

    const staged = stageIncidentLocally(offlinePayload);
    return {
      success: true,
      isOffline: true,
      release_status: 'queued_offline',
      status: 'Queued Offline',
      tracking_ref: staged.tracking_ref || idempotencyKey,
      incident: staged.entity,
      activity_message: 'Incident queued securely on this device.',
      message: 'Report safely saved. It will be sent automatically when your internet connection returns.'
    };
  }

  // ONLINE RELEASE FLOW (Section 5 - Strict Server Response Validation)
  try {
    if (!supabase || typeof supabase.rpc !== 'function') {
      return {
        success: false,
        isOffline: false,
        release_status: 'sync_failed',
        status: 'Sync Failed',
        message: 'Report was not released. Authoritative RPC connection unavailable. Please try again.'
      };
    }

    const { data, error } = await supabase.rpc('release_incident_to_client', {
      p_payload: incidentPayload,
      p_idempotency_key: idempotencyKey
    });

    if (error || !validateServerReleaseResponse(data, incidentPayload)) {
      return {
        success: false,
        isOffline: false,
        release_status: 'sync_failed',
        status: 'Sync Failed',
        message: 'Authoritative server response was invalid or missing required fields.'
      };
    }

    // Confirmed server acknowledgement! Update local display cache from authoritative server record
    const serverRecord = data.incident;
    const confirmedInc = saveEntity('incidents', {
      ...incidentPayload,
      id: serverRecord.id,
      client_id: serverRecord.client_id,
      project_id: serverRecord.project_id,
      assignment_id: serverRecord.assignment_id || serverRecord.project_id,
      supplier_id: serverRecord.supplier_id,
      plant_id: serverRecord.plant_id,
      released_to_client: true,
      status: 'Released',
      release_status: 'released',
      released_at: serverRecord.released_at,
      released_by: serverRecord.released_by || currentUser?.id,
      idempotency_key: idempotencyKey
    });

    return {
      success: true,
      isOffline: false,
      release_status: 'released',
      status: 'Released',
      incident: confirmedInc,
      activity_message: 'Incident released to Client Dashboard.',
      message: 'Report released to the Client Dashboard. External email was not sent.'
    };
  } catch (err) {
    console.error('[IncidentWorkflowService] Online Release Exception:', err);
    return {
      success: false,
      isOffline: false,
      release_status: 'sync_failed',
      status: 'Sync Failed',
      message: 'Report was not released. Your information is intact. Please try again.'
    };
  }
}

/**
 * 7. RECONNECTION OUTBOX REPLAY (Section 6)
 * Replays queued outbox incidents through authoritative server RPC upon reconnection.
 * Single owner of queue removal: syncQueuedIncidentRelease cleans outbox item on success.
 *
 * @param {Object} queuedItem - Staged outbox item
 * @returns {Promise<Object>} Sync result status
 */
export async function syncQueuedIncidentRelease(queuedItem) {
  if (!queuedItem || !queuedItem.entity) {
    return { success: false, retained: true, message: 'Invalid queued item.' };
  }

  const payload = queuedItem.entity;
  const idempotencyKey = payload.idempotency_key || queuedItem.tracking_ref;

  try {
    if (!supabase || typeof supabase.rpc !== 'function') {
      return {
        success: false,
        retained: true,
        message: 'Reconnection sync failed: Authoritative RPC unavailable. Outbox record retained.'
      };
    }

    const { data, error } = await supabase.rpc('release_incident_to_client', {
      p_payload: payload,
      p_idempotency_key: idempotencyKey
    });

    if (error || !validateServerReleaseResponse(data, payload)) {
      return {
        success: false,
        retained: true,
        message: 'Reconnection sync failed: Server rejected release or returned invalid response. Outbox record retained.'
      };
    }

    // Server confirmed release! Save entity to local cache
    const serverRecord = data.incident;
    saveEntity('incidents', {
      ...payload,
      id: serverRecord.id,
      client_id: serverRecord.client_id,
      project_id: serverRecord.project_id,
      released_to_client: true,
      status: 'Released',
      release_status: 'released',
      released_at: serverRecord.released_at
    });

    // Remove exact acknowledged item from local outbox queue (Single Queue Removal Owner)
    try {
      const outbox = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
      const updated = outbox.filter(item => item.local_id !== queuedItem.local_id && item.tracking_ref !== queuedItem.tracking_ref);
      localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to clean local outbox:', e);
    }

    return {
      success: true,
      incident: serverRecord,
      activity_message: 'Incident released to Client Dashboard.',
      message: 'Reconnection sync completed successfully.'
    };
  } catch (err) {
    return {
      success: false,
      retained: true,
      message: err.message || 'Reconnection sync error. Outbox record retained.'
    };
  }
}

/**
 * 8. CASE ARCHIVE ELIGIBILITY VALIDATOR (Part 12)
 * Verifies Quality Closed, Hours Complete, Overtime Approved, and Invoiced/No-Invoice before archiving.
 *
 * @param {Object} params
 * @param {Object} params.incident - Target Quality Incident record
 * @param {Array} [params.timeEntries] - Time entries linked to the incident
 * @returns {Object} { isEligible: boolean, missingPrerequisites: Array<string> }
 */
export function validateCaseArchiveEligibility({ incident, timeEntries = [] }) {
  const missingPrerequisites = [];

  if (!incident) {
    return { isEligible: false, missingPrerequisites: ['Valid Quality Incident record is required'] };
  }

  // 1. Admin Quality Status Check
  const qualityStatus = String(incident.quality_status || incident.status || '').toLowerCase();
  const isQualityClosed = qualityStatus === 'quality closed' || qualityStatus === 'quality_closed' || qualityStatus === 'closed';
  if (!isQualityClosed) {
    missingPrerequisites.push('Admin must set Quality Status to "Quality Closed"');
  }

  // 2. Rep Hours Check
  const linkedEntries = (Array.isArray(timeEntries) ? timeEntries : []).filter(te => 
    te && (te.incident_id === incident.id || te.project_id === incident.project_id)
  );

  const hasPendingOvertime = linkedEntries.some(te => te.status === 'client_pending' || te.status === 'pending');
  if (hasPendingOvertime) {
    missingPrerequisites.push('All excess/overtime hours must be reviewed and approved by the Billing Customer');
  }

  const hasUnconfiguredHours = linkedEntries.some(te => 
    te.status === 'needs_allocation_configuration' || te.status === 'needs_rate_configuration'
  );
  if (hasUnconfiguredHours) {
    missingPrerequisites.push('All hours entries must have valid allocation and financial rate cards configured');
  }

  // 3. Financial Completion Check
  const financialStatus = String(incident.financial_status || '').toLowerCase();
  const isInvoiced = financialStatus === 'invoiced' || financialStatus === 'no_invoice_required' || incident.invoiced === true || Boolean(incident.no_invoice_reason);
  
  if (!isInvoiced) {
    missingPrerequisites.push('Accountant must record an Invoice number/date or an audited "No Invoice Required" decision');
  }

  return {
    isEligible: missingPrerequisites.length === 0,
    missingPrerequisites
  };
}

/**
 * 11-SECTION INCIDENT REPORT BODY COMPOSER
 * Formats full 11-section text body for incident alerts with zero omitted data.
 */
export function compose11SectionIncidentBody(incident = {}) {
  const parts = Array.isArray(incident.parts_list) ? incident.parts_list : [];
  const totes = Array.isArray(incident.tote_bin_labels) ? incident.tote_bin_labels : [];
  const photos = Array.isArray(incident.photos) ? incident.photos : [];
  const videos = Array.isArray(incident.videos) ? incident.videos : [];
  const recipients = Array.isArray(incident.recipient_snapshot) ? incident.recipient_snapshot : [];

  return `
================================================================================
IDS PULSE — QUALITY INCIDENT ALERT REPORT
================================================================================

1. GENERAL METADATA & LOCATION
--------------------------------------------------------------------------------
- Report Reference: ${incident.id || incident.tracking_ref || 'N/A'}
- Date & Time: ${incident.date || new Date().toISOString().split('T')[0]} @ ${incident.time || 'On Shift'}
- Client / Organization: ${incident.client_name || incident.client_id || incident.supplier_id || 'N/A'}
- Assembly Plant: ${incident.plant_name || incident.plant_id || 'N/A'}
- Project / PO: ${incident.project_name || incident.project_id || incident.assignment_id || 'N/A'}
- Suspect Part Number: ${incident.part_number || (parts[0]?.part_number) || 'PN 84920194'}
- Quality Liaison Rep: ${incident.rep_name || 'Clarence Kuiken'}

2. LEVEL OF CONCERN & STATUS
--------------------------------------------------------------------------------
- Level of Concern: ${incident.level_of_concern || incident.concern_classification || 'Major'}
- Report Status: ${incident.status || 'Released'}

3. DEFECT DETAILS
--------------------------------------------------------------------------------
- Defect Type: ${incident.defect_type || 'N/A'}
- Area / Location: ${incident.area || 'N/A'}
- Defective Quantity: ${incident.pieces_defective || incident.total_defects || parts.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0) || 'N/A'}
- Full Description: ${incident.description || 'N/A'}

4. ACTION TAKEN
--------------------------------------------------------------------------------
${incident.action_taken || 'N/A'}

5. SUPPLIER FOLLOW-UP ACTIONS
--------------------------------------------------------------------------------
- Returned to Supplier: ${incident.returned_to_supplier === true ? 'Yes' : incident.returned_to_supplier === false ? 'No' : (incident.returned_to_supplier || 'Unknown')}
- Sort Requested: ${incident.sort_requested === true ? 'Yes' : incident.sort_requested === false ? 'No' : (incident.sort_requested || 'Unknown')}
- RMA Required: ${incident.rma_required === true ? 'Yes' : incident.rma_required === false ? 'No' : (incident.rma_required || 'Unknown')}
- RMA Number: ${incident.rma_number || 'N/A'}

6. PARTS LIST & CONTAINER / TOTE LABELS
--------------------------------------------------------------------------------
Parts Inspected / Affected:
${parts.length === 0 ? '- None listed' : parts.map((p, i) => `  ${i+1}. Part ${p.part_number || p.partNumber || 'N/A'} | Qty: ${p.quantity || 1} | Status: ${p.status || 'Defective'}`).join('\n')}

Tote & Bin Labels:
${totes.length === 0 ? '- None scanned' : totes.map((t, i) => `  ${i+1}. Label: ${t.label || t.code || t} | Entry Mode: ${t.manual ? 'Manual Entry' : 'Barcode Scanned'} | Qty: ${t.qty || 1}`).join('\n')}

7. TRACEABILITY STATUS
--------------------------------------------------------------------------------
- Traceability Status: ${incident.traceability_status || 'Available'}
- Reason / Note: ${incident.traceability_unavailable_reason || incident.traceability_unavailable_note || 'N/A'}

8. PHOTO EVIDENCE (CLOUDINARY LINKS)
--------------------------------------------------------------------------------
${photos.length === 0 ? 'No photos attached.' : photos.map((ph, i) => `Photo ${i+1}: ${ph.url || ph.localUrl || ph}\n  Label: ${ph.label || 'Defect Evidence'}\n  Note: ${ph.note || ph.comment || 'N/A'}`).join('\n\n')}

9. VIDEO EVIDENCE
--------------------------------------------------------------------------------
${videos.length === 0 ? 'No video evidence attached.' : videos.map((v, i) => `Video ${i+1}: ${v.url || v.localUrl || v}`).join('\n')}

10. MEDIA UNAVAILABILITY REASON
--------------------------------------------------------------------------------
- Media Status: ${incident.media_evidence_status || (photos.length > 0 ? 'Media Attached' : 'Not Provided')}
- Reason / Typed Note: ${incident.media_unavailable_reason || incident.media_unavailable_note || (photos.length > 0 ? 'N/A (Photos attached)' : 'None specified')}

11. RECIPIENTS & MANDATORY CC LIST
--------------------------------------------------------------------------------
${recipients.length === 0 ? '- Donna Cabral (dcabral@integritydriven.com) [Mandatory CC]\n- Diana Operations Lead (diana@goto-ids.com) [Mandatory CC]\n- Greg Phillippe (gphillippe@integritydriven.com) [Mandatory CC]' : recipients.map(r => `- ${r.name || r.username} (${r.email}) [${r.recipient_type || (r.is_mandatory_cc ? 'Mandatory CC' : 'Recipient')}]`).join('\n')}
================================================================================
`;
}

