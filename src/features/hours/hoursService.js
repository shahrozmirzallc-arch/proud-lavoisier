/**
 * Hours Service — Orchestration & Business Validation Layer
 * IDS Pulse — Hours & Overtime Feature Module
 */

import {
  submitRepHoursRpc,
  reviewClientOvertimeRpc,
  resubmitReturnedOvertimeRpc
} from './hoursRepository.js';
import {
  enqueueOfflineSubmission,
  removeOfflineSubmission,
  syncOfflineQueue
} from './OfflineHoursQueue.js';

export const submitRepHours = async ({
  assignmentId,
  workDate,
  hours,
  workType = 'Routine inspection',
  workSummary = '',
  notes = '',
  isOffline = false,
  idempotencyKey = null
}) => {
  const key = idempotencyKey || `hours_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const submissionPayload = {
    idempotencyKey: key,
    assignmentId,
    workDate,
    hours: Number(hours),
    workType,
    workSummary,
    notes
  };

  // If browser is offline, stage in durable outbox queue without creating financial time_entries
  if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    const stagedItem = enqueueOfflineSubmission(submissionPayload);
    return {
      status: 'staged_offline',
      message: 'Saved on this phone — waiting for internet connection.',
      idempotencyKey: key,
      stagedItem
    };
  }

  try {
    const result = await submitRepHoursRpc(submissionPayload);

    // On success or configuration required, clear outbox item if retrying
    if (result && (result.status === 'success' || result.status === 'needs_configuration' || result.status === 'needs_allocation_configuration')) {
      removeOfflineSubmission(key);
    }

    return result;
  } catch (err) {
    // Retain in outbox on network or RPC exception without creating false local financial entry
    enqueueOfflineSubmission({
      ...submissionPayload,
      lastError: err.message
    });

    return {
      status: 'staged_offline',
      message: `Network failure: ${err.message}. Saved safely on this device — waiting to sync.`,
      idempotencyKey: key,
      error: err.message
    };
  }
};

export const reviewClientOvertime = async ({ timeEntryId, action, comment }) => {
  if (!['approve', 'approved', 'return', 'returned', 'reject', 'rejected'].includes(action)) {
    throw new Error(`Invalid action: ${action}`);
  }

  if (['return', 'returned', 'reject', 'rejected'].includes(action) && (!comment || !comment.trim())) {
    throw new Error('A mandatory comment is required for return or rejection.');
  }

  return await reviewClientOvertimeRpc({ timeEntryId, action, comment: comment ? comment.trim() : '' });
};

export const resubmitReturnedOvertime = async ({ timeEntryId, workSummary, comment }) => {
  return await resubmitReturnedOvertimeRpc({ timeEntryId, workSummary, comment });
};

export const processOfflineOutboxQueue = async () => {
  return await syncOfflineQueue(submitRepHoursRpc);
};
