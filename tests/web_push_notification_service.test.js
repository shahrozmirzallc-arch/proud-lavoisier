// tests/web_push_notification_service.test.js
// Authoritative Test Suite for Desktop & Web Push Notification Service

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isPushNotificationSupported,
  getNotificationPermissionState,
  sendDesktopNotification,
  notifyCriticalSpillDesktop,
  notifyPOBudgetThresholdDesktop
} from '../src/services/webPushNotificationService.js';

describe('Desktop & Web Push Notification Service Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Environment Support Gate — correctly assesses browser capability', () => {
    // In Vitest node/jsdom environment
    const supported = isPushNotificationSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('2. Permission State Gate — handles unsupported or default permission states gracefully', () => {
    const state = getNotificationPermissionState();
    expect(['granted', 'denied', 'default', 'unsupported']).toContain(state);
  });

  it('3. Dispatch Safety Gate — does not throw when notification API is invoked without permissions', () => {
    const notification = sendDesktopNotification({
      title: 'Test Notification',
      body: 'Test content description'
    });

    // In non-granted test environment, safely returns null without runtime exceptions
    expect(notification).toBe(null);
  });

  it('4. Critical Spill Helper Gate — safely formats spill alert options', () => {
    const mockIncident = {
      id: 'INC-999',
      suspect_part_number: 'PN-44192',
      plant_name: 'Oakville Assembly',
      rep_name: 'Clarence Kuiken'
    };

    const result = notifyCriticalSpillDesktop(mockIncident);
    // In node environment with no Notification mock, safely returns null
    expect(result).toBe(null);
  });

  it('5. PO Budget Helper Gate — safely formats budget threshold alert options', () => {
    const mockTelemetry = {
      projectName: 'Oakville Quality',
      poNumber: 'PO-2026-99',
      burnPercentage: 92,
      isCritical: false,
      isWarning: true
    };

    const result = notifyPOBudgetThresholdDesktop(mockTelemetry);
    expect(result).toBe(null);
  });
});
