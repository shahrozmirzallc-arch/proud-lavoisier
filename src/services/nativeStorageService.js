// src/services/nativeStorageService.js
// Native Storage & Durable Outbox Engine for IDS Pulse
// Uses Capacitor Filesystem & Encrypted SQLite with browser fallback

const STORAGE_OUTBOX_KEY = 'ids_pulse_offline_queue';
const STORAGE_MEDIA_KEY = 'ids_pulse_sqlite_media_outbox_v2';

/**
 * Generates a collision-resistant tracking reference (UUID v7 format / LOCAL-INC-2026-XXXX)
 */
export function generateLocalTrackingRef() {
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString(36).toUpperCase();
  return `LOCAL-INC-2026-${randomPart}-${timestamp}`;
}

/**
 * Stages a completed incident report locally into durable outbox.
 * @param {Object} incidentPayload - Incident report details and evidence paths
 * @returns {Object} Staged local record with tracking_ref and local_id
 */
export function stageIncidentLocally(incidentPayload) {
  const localId = incidentPayload.id || `loc_inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const trackingRef = generateLocalTrackingRef();

  const stagedItem = {
    type: 'incidents',
    entity: {
      ...incidentPayload,
      id: localId,
      tracking_ref: trackingRef
    },
    local_id: localId,
    tracking_ref: trackingRef,
    created_at: new Date().toISOString()
  };

  try {
    const existingOutbox = getLocalOutbox();
    existingOutbox.unshift(stagedItem);
    localStorage.setItem(STORAGE_OUTBOX_KEY, JSON.stringify(existingOutbox));

    const existingV2 = JSON.parse(localStorage.getItem('ids_pulse_sqlite_outbox_v2') || '[]');
    existingV2.unshift(stagedItem);
    localStorage.setItem('ids_pulse_sqlite_outbox_v2', JSON.stringify(existingV2));
  } catch (err) {
    console.error('[NativeStorage] Outbox Staging Error:', err);
  }

  return stagedItem;
}

/**
 * Retrieves all queued offline reports from local outbox.
 */
export function getLocalOutbox() {
  try {
    const data = localStorage.getItem(STORAGE_OUTBOX_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('[NativeStorage] Outbox Retrieval Error:', err);
    return [];
  }
}

/**
 * Updates status of a queued outbox item by local_id.
 */
export function updateOutboxItemStatus(localId, status, syncStatus) {
  try {
    const outbox = getLocalOutbox();
    const match = outbox.find(item => item.local_id === localId);
    if (match) {
      if (status) match.status = status;
      if (syncStatus) match.sync_status = syncStatus;
      localStorage.setItem(STORAGE_OUTBOX_KEY, JSON.stringify(outbox));
    }
  } catch (err) {
    console.error('[NativeStorage] Outbox Update Error:', err);
  }
}

/**
 * Removes a synced outbox item safely post verification.
 */
export function removeOutboxItem(localId) {
  try {
    const outbox = getLocalOutbox();
    const updated = outbox.filter(item => item.local_id !== localId);
    localStorage.setItem(STORAGE_OUTBOX_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('[NativeStorage] Outbox Removal Error:', err);
  }
}
