// src/services/webPushNotificationService.js
// Authoritative Desktop & Web Push Notification Service
// Emits native browser desktop notifications for critical spills, budget caps, and shift submissions

const NOTIFICATION_PERMISSION_KEY = 'ids_pulse_notifications_enabled';

/**
 * Checks if browser notification API is supported.
 * @returns {boolean}
 */
export function isPushNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Retrieves the current permission state.
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getNotificationPermissionState() {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests permission from the user to send desktop notifications.
 * @returns {Promise<boolean>} Resolves true if granted
 */
export async function requestNotificationPermission() {
  if (!isPushNotificationSupported()) {
    console.warn('[IDS Push] Notifications not supported in this environment.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const isGranted = permission === 'granted';
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, isGranted ? 'true' : 'false');
    }
    return isGranted;
  } catch (err) {
    console.error('[IDS Push] Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Dispatches a native browser desktop notification if permission is granted.
 *
 * @param {Object} options
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification description
 * @param {string} [options.tag] - Grouping tag (e.g. 'critical_spill', 'po_budget')
 * @param {string} [options.icon] - Icon URL
 * @param {Object} [options.data] - Custom metadata
 * @returns {Notification|null}
 */
export function sendDesktopNotification({ title, body, tag = 'ids_pulse_alert', icon = '/favicon.svg', data = {} }) {
  if (!isPushNotificationSupported()) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notification = new Notification(`[IDS PULSE] ${title}`, {
      body,
      icon,
      tag,
      data,
      requireInteraction: tag.includes('critical')
    });

    notification.onclick = function() {
      if (typeof window !== 'undefined') {
        window.focus();
        this.close();
      }
    };

    return notification;
  } catch (err) {
    console.error('[IDS Push] Failed to trigger native notification:', err);
    return null;
  }
}

/**
 * Helper to broadcast critical spill notification immediately to desktop.
 *
 * @param {Object} incident
 */
export function notifyCriticalSpillDesktop(incident) {
  const partNumber = incident.suspect_part_number || incident.part_number || 'Suspect Component';
  const plantName = incident.plant_name || incident.location || 'Assembly Line';
  const repName = incident.rep_name || 'Field Inspector';

  return sendDesktopNotification({
    title: `CRITICAL SPILL ALERT: ${partNumber}`,
    body: `${repName} logged a critical containment at ${plantName}. Immediate containment action required.`,
    tag: `critical_spill_${incident.id || Date.now()}`,
    data: { incidentId: incident.id }
  });
}

/**
 * Helper to broadcast PO budget threshold notification.
 *
 * @param {Object} projectTelemetry
 */
export function notifyPOBudgetThresholdDesktop(projectTelemetry) {
  const { projectName, poNumber, burnPercentage, isCritical } = projectTelemetry;

  return sendDesktopNotification({
    title: isCritical ? `PO BUDGET CRITICAL (${burnPercentage}%)` : `PO Budget Warning (${burnPercentage}%)`,
    body: `${projectName} (PO #${poNumber}) has consumed ${burnPercentage}% of authorized budget.`,
    tag: `po_budget_${poNumber || 'general'}`,
    data: { poNumber }
  });
}
