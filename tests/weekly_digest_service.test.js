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

import { generateWeeklyClientDigest, composeWeeklyDigestHtml, dispatchWeeklyClientDigest } from '../src/services/weeklyDigestService.js';
import { saveEntity } from '../src/components/SharedDatabase.js';

describe('Weekly Client Quality Digest Service Suite', () => {
  beforeEach(() => {
    localStorage.clear();

    // Seed test supplier
    saveEntity('suppliers', {
      id: 'magna_powertrain',
      name: 'Magna Powertrain International',
      contact_email: 'rsterling@magnapowertrain.com',
      contacts: [
        { name: 'Robert Sterling', email: 'rsterling@magnapowertrain.com', role: 'Quality Manager' }
      ]
    });

    // Seed test project
    saveEntity('projects', {
      id: 'proj_ford_oak',
      name: 'Ford Oakville Quality Containment',
      code: 'PO-FORD-OAK-2026-15',
      po_number: 'PO-FORD-OAK-2026-15',
      supplier_id: 'magna_powertrain',
      hourly_rate: 110,
      budget_hours: 45
    });

    // Seed shift reports
    saveEntity('shiftReports', {
      id: 'sr_001',
      supplier_id: 'magna_powertrain',
      date: new Date().toISOString().substring(0, 10),
      hours_worked: 8,
      inspected_count: 500,
      defective_count: 2,
      status: 'published'
    });

    saveEntity('shiftReports', {
      id: 'sr_002',
      supplier_id: 'magna_powertrain',
      date: new Date().toISOString().substring(0, 10),
      hours_worked: 7.5,
      inspected_count: 450,
      defective_count: 0,
      status: 'published'
    });

    // Seed an incident
    saveEntity('incidents', {
      id: 'INC-2026-MAGNA-01',
      supplier_id: 'magna_powertrain',
      plant_name: 'Oakville Assembly Plant',
      date: new Date().toISOString().substring(0, 10),
      level_of_concern: 'Critical',
      defect_type: 'Dimensional Porosity',
      pieces_defective: 3,
      quantity: 3
    });
  });

  it('1. Digest Compiler Gate — accurately aggregates weekly shift volumes, hours, and defects', () => {
    const digest = generateWeeklyClientDigest('magna_powertrain');

    expect(digest.supplierId).toBe('magna_powertrain');
    expect(digest.supplierName).toBe('Magna Powertrain International');
    expect(digest.summaryMetrics.totalShiftsLogged).toBe(2);
    expect(digest.summaryMetrics.totalHoursLogged).toBe(15.5);
    expect(digest.summaryMetrics.totalInspectedPieces).toBe(950);
    expect(digest.summaryMetrics.criticalSpillsCount).toBe(1);
    expect(digest.recipientEmails).toContain('rsterling@magnapowertrain.com');
  });

  it('2. HTML Digest Formatter Gate — renders canonical branding, table rows, and zero emojis', () => {
    const digest = generateWeeklyClientDigest('magna_powertrain');
    const html = composeWeeklyDigestHtml(digest);

    expect(html).toContain('Magna Powertrain International');
    expect(html).toContain('Weekly Quality Containment Digest');
    expect(html).toContain('Grade');
    expect(html).toContain('PO-FORD-OAK-2026-15');
    // Ensure zero emojis in HTML output
    const emojiRegex = /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]/u;
    expect(emojiRegex.test(html)).toBe(false);
  });

  it('3. Dispatcher Gate — executes dispatch successfully with audit logging', async () => {
    const result = await dispatchWeeklyClientDigest('magna_powertrain');

    expect(result.success).toBe(true);
    expect(result.recipients).toContain('rsterling@magnapowertrain.com');
    expect(result.summaryMetrics.totalInspectedPieces).toBe(950);
  });
});
