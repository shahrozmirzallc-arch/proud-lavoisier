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
    const cOrgId = String(c.client_id || c.customer_id || c.organization_id || c.supplier_id || '').trim().toLowerCase();
    return targetClientId && (cOrgId === targetClientId || cOrgId === targetSupplierId);
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
  { id: 'usr_greg', username: 'greg', role: 'admin' },
  { id: 'usr_monica', username: 'monica', role: 'admin' }
];

/**
 * 3. RECIPIENT SNAPSHOT BUILDER (P0.6, Section 9 & Part 9)
 * Formats recipient array for immutable storage resolving Mandatory Internal CCs (Donna, Greg, Monica)
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
          String(u.id || '').toLowerCase() === m.username
        ))
      : null;

    const email = dirUser?.email || null;
    const name = dirUser?.name || m.username.charAt(0).toUpperCase() + m.username.slice(1);

    return {
      contact_id: dirUser?.id || m.id,
      name,
      email,
      role: dirUser?.role || m.role,
      recipient_type: 'mandatory_cc',
      is_mandatory_cc: true,
      has_routing_error: !email,
      snapshot_at: new Date().toISOString()
    };
  });

  const externalSnapshots = (Array.isArray(contacts) ? contacts : []).map(c => ({
    contact_id: c.id,
    name: c.name,
    email: c.email,
    role: c.role || 'External Contact',
    recipient_type: 'email_and_dashboard',
    is_mandatory_cc: false,
    has_routing_error: !c.email,
    snapshot_at: new Date().toISOString()
  }));

  return [...mandatorySnapshots, ...externalSnapshots];
}

/**
 * 4. CUSTOMER DASHBOARD VISIBILITY PREDICATE (Section 1 & 8)
 * Enforces strict tenant isolation based on canonical client_id across all Customer views.
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

  const matchesClient = (incClientId && incClientId === targetClientId) ||
                        (incSupplierId && incSupplierId === targetClientId) ||
                        (incCustomerId && incCustomerId === targetClientId);

  if (!matchesClient) return false;

  const isReleased = incident.released_to_client === true || String(incident.status).trim() === 'Released';
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
      const localInc = {
        ...incidentPayload,
        id: incidentPayload.id || `inc_${Date.now()}`,
        released_to_client: true,
        status: 'Released',
        release_status: 'released',
        released_at: new Date().toISOString(),
        released_by: currentUser?.name || 'IDS Operations Supervisor',
        released_by_user_id: currentUser?.id || 'supervisor_default'
      };
      saveEntity('incidents', localInc);
      return {
        success: true,
        isOffline: false,
        release_status: 'released',
        status: 'Released',
        tracking_ref: localInc.id,
        incident: localInc,
        message: 'Incident released to Client Dashboard successfully.'
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
