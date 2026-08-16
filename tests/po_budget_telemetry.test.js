// tests/po_budget_telemetry.test.js
import { describe, it, expect, beforeEach } from 'vitest';

// Browser global polyfills for Node / Vitest
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    get length() { return store.size; }
  };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

import {
  calculatePOBudgetTelemetry,
  getAllProjectsPOBudgetTelemetry,
  compileBatchInvoicingPayload
} from '../src/services/poBudgetService.js';
import { saveEntity } from '../src/components/SharedDatabase.js';

describe('Authoritative PO Budget Telemetry & Invoicing Engine Suite', () => {
  beforeEach(() => {
    localStorage.clear();

    // Seed test projects
    saveEntity('projects', {
      id: 'prj_cami_01',
      name: 'GM CAMI Assembly Containment',
      client_id: 'gm',
      po_number: 'PO-GM-CAMI-2026-88',
      po_budget: 10000,
      billing_rate: 85,
      plant_location: 'Ingersoll, ON, Canada'
    });

    saveEntity('projects', {
      id: 'prj_detroit_02',
      name: 'Stellantis Detroit Chassis Sort',
      client_id: 'stellantis',
      po_number: 'PO-STEL-DET-2026-14',
      po_budget: 20000,
      billing_rate: 100,
      plant_location: 'Detroit, MI, USA',
      currency: 'USD'
    });

    // Seed shift reports against projects
    // prj_cami_01: 80 hours @ $85 = $6,800 (68.0% healthy)
    saveEntity('shiftReports', {
      id: 'sr_cami_1',
      project_id: 'prj_cami_01',
      hours_worked: 50,
      inspected_count: 2400,
      invoiced: false
    });
    saveEntity('shiftReports', {
      id: 'sr_cami_2',
      project_id: 'prj_cami_01',
      hours_worked: 30,
      inspected_count: 1500,
      invoiced: false
    });

    // prj_detroit_02: 170 hours @ $100 = $17,000 (85.0% warning threshold trigger)
    saveEntity('shiftReports', {
      id: 'sr_det_1',
      project_id: 'prj_detroit_02',
      hours_worked: 100,
      inspected_count: 8000,
      invoiced: false
    });
    saveEntity('shiftReports', {
      id: 'sr_det_2',
      project_id: 'prj_detroit_02',
      hours_worked: 70,
      inspected_count: 5500,
      invoiced: false
    });
  });

  describe('1. PO Budget Consumption & Calculation Gate', () => {
    it('correctly evaluates healthy budget for GM CAMI (<80% spend)', () => {
      const telemetry = calculatePOBudgetTelemetry('prj_cami_01');
      expect(telemetry.authorizedBudget).toBe(10000);
      expect(telemetry.totalHours).toBe(80.0);
      expect(telemetry.totalSpend).toBe(6800);
      expect(telemetry.remainingBalance).toBe(3200);
      expect(telemetry.burnPercentage).toBe(68.0);
      expect(telemetry.status).toBe('healthy');
      expect(telemetry.isWarning).toBe(false);
      expect(telemetry.isCritical).toBe(false);
      expect(telemetry.currency).toBe('CAD');
    });

    it('triggers warning threshold for Detroit project when spend >= 80%', () => {
      const telemetry = calculatePOBudgetTelemetry('prj_detroit_02');
      expect(telemetry.authorizedBudget).toBe(20000);
      expect(telemetry.totalHours).toBe(170.0);
      expect(telemetry.totalSpend).toBe(17000);
      expect(telemetry.remainingBalance).toBe(3000);
      expect(telemetry.burnPercentage).toBe(85.0);
      expect(telemetry.status).toBe('budget_warning');
      expect(telemetry.isWarning).toBe(true);
      expect(telemetry.isCritical).toBe(false);
      expect(telemetry.currency).toBe('USD');
    });

    it('triggers critical cap exceeded when spend reaches 95%', () => {
      // Add additional 25 hours to Detroit project = 195 hrs @ $100 = $19,500 (97.5%)
      saveEntity('shiftReports', {
        id: 'sr_det_3',
        project_id: 'prj_detroit_02',
        hours_worked: 25,
        inspected_count: 2000
      });

      const telemetry = calculatePOBudgetTelemetry('prj_detroit_02');
      expect(telemetry.totalSpend).toBe(19500);
      expect(telemetry.burnPercentage).toBe(97.5);
      expect(telemetry.status).toBe('critical_cap_exceeded');
      expect(telemetry.isCritical).toBe(true);
      expect(telemetry.statusLabel).toContain('Cap Exceeded');
    });
  });

  describe('2. Enterprise-Wide Budget Telemetry Gate', () => {
    it('aggregates budget metrics across all active projects', () => {
      const allTelemetry = getAllProjectsPOBudgetTelemetry();
      expect(allTelemetry.length).toBeGreaterThanOrEqual(2);
      expect(allTelemetry.map(t => t.projectId)).toContain('prj_cami_01');
      expect(allTelemetry.map(t => t.projectId)).toContain('prj_detroit_02');
    });
  });

  describe('3. Colleen Batch Invoicing Queue Gate', () => {
    it('compiles uninvoiced shift hours grouped by project with unbilled amounts', () => {
      const queue = compileBatchInvoicingPayload();
      expect(queue.length).toBeGreaterThanOrEqual(2);

      const camiBatch = queue.find(q => q.projectId === 'prj_cami_01');
      expect(camiBatch).toBeDefined();
      expect(camiBatch.unbilledHours).toBe(80.0);
      expect(camiBatch.unbilledAmount).toBe(6800);
      expect(camiBatch.readyToInvoice).toBe(true);
      expect(camiBatch.poNumber).toBe('PO-GM-CAMI-2026-88');
    });
  });
});
