/**
 * Non-Authoritative Outbox Queue for Hours Submissions
 * Keeps staged items safely during offline or network interruption without creating false financial entries.
 */

const OUTBOX_STORAGE_KEY = 'ids_pulse_rep_hours_outbox_queue_v1';
let memoryStore = [];

export const getOfflineQueue = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return memoryStore;
  } catch (_err) {
    return memoryStore;
  }
};

export const saveOfflineQueue = (queue) => {
  try {
    memoryStore = queue;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(queue));
    }
  } catch (_err) {
    memoryStore = queue;
  }
};

export const enqueueOfflineSubmission = (submission) => {
  const queue = getOfflineQueue();
  const existingIdx = queue.findIndex(q => q.idempotencyKey === submission.idempotencyKey);
  const newItem = {
    ...submission,
    status: 'staged_offline',
    stagedAt: new Date().toISOString(),
    retryCount: existingIdx >= 0 ? (queue[existingIdx].retryCount || 0) + 1 : 0,
    lastError: submission.lastError || null
  };

  if (existingIdx >= 0) {
    queue[existingIdx] = newItem;
  } else {
    queue.push(newItem);
  }

  saveOfflineQueue(queue);
  return newItem;
};

export const removeOfflineSubmission = (idempotencyKey) => {
  const queue = getOfflineQueue();
  const filtered = queue.filter(q => q.idempotencyKey !== idempotencyKey);
  saveOfflineQueue(filtered);
  return filtered;
};

export const syncOfflineQueue = async (submitRpcFn) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { syncedCount: 0, errors: [] };

  let syncedCount = 0;
  const errors = [];

  for (const item of queue) {
    try {
      const result = await submitRpcFn({
        idempotencyKey: item.idempotencyKey,
        assignmentId: item.assignmentId,
        workDate: item.workDate,
        hours: item.hours,
        workType: item.workType,
        workSummary: item.workSummary,
        notes: item.notes
      });

      if (result && (result.status === 'success' || result.status === 'needs_configuration' || result.status === 'needs_allocation_configuration')) {
        removeOfflineSubmission(item.idempotencyKey);
        syncedCount++;
      } else {
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = result?.message || 'Server synchronization rejected';
        enqueueOfflineSubmission(item);
      }
    } catch (err) {
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastError = err.message || 'Network exception';
      enqueueOfflineSubmission(item);
      errors.push({ idempotencyKey: item.idempotencyKey, error: err.message });
    }
  }

  return { syncedCount, errors };
};
