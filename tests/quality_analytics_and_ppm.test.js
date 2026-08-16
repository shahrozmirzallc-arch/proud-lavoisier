// tests/quality_analytics_and_ppm.test.js
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
  calculateSupplierPPM,
  getDefectParetoAnalysis,
  getSupplierQualityScorecards
} from '../src/services/qualityAnalyticsService.js';
import { saveEntity } from '../src/components/SharedDatabase.js';

describe('Supplier Quality Analytics & PPM Defect Intelligence Suite', () => {
  beforeEach(() => {
    localStorage.clear();

    // Seed test suppliers
    saveEntity('suppliers', {
      id: 'sup_magna',
      name: 'Magna Powertrain International',
      contact_person: 'Robert Sterling',
      email: 'robert@magnapowertrain.com',
      phone: '+1-519-555-0199'
    });
    saveEntity('suppliers', {
      id: 'sup_stellantis',
      name: 'Stellantis Windsor Operations',
      contact_person: 'Mark Vance',
      email: 'mark@stellantis.com',
      phone: '+1-519-555-0188'
    });

    // Seed shift reports with inspected and defective counts
    saveEntity('shiftReports', {
      id: 'sr_01',
      supplier_id: 'sup_magna',
      plant_id: 'plant_oakville',
      date: '2026-06-01',
      inspected_count: 5000,
      defective_count: 2,
      hours_worked: 8
    });
    saveEntity('shiftReports', {
      id: 'sr_02',
      supplier_id: 'sup_magna',
      plant_id: 'plant_oakville',
      date: '2026-06-02',
      inspected_count: 5000,
      defective_count: 1,
      hours_worked: 8
    });
    saveEntity('shiftReports', {
      id: 'sr_03',
      supplier_id: 'sup_stellantis',
      plant_id: 'plant_windsor',
      date: '2026-06-01',
      inspected_count: 2000,
      defective_count: 5,
      hours_worked: 8
    });

    // Seed incidents for Pareto root-cause analysis
    saveEntity('incidents', {
      id: 'inc_01',
      supplier_id: 'sup_magna',
      plant_id: 'plant_oakville',
      defect_type: 'Fractured Bracket',
      pieces_defective: 2,
      level_of_concern: 'Critical',
      part_number: 'PN-7T4Z-7000-A'
    });
    saveEntity('incidents', {
      id: 'inc_02',
      supplier_id: 'sup_magna',
      plant_id: 'plant_oakville',
      defect_type: 'Burrs on Flange',
      pieces_defective: 1,
      level_of_concern: 'Standard',
      part_number: 'PN-7T4Z-7000-A'
    });
    saveEntity('incidents', {
      id: 'inc_03',
      supplier_id: 'sup_stellantis',
      plant_id: 'plant_windsor',
      defect_type: 'Porosity in Casting',
      pieces_defective: 5,
      level_of_concern: 'Critical',
      part_number: 'PN-84920194'
    });
  });

  describe('1. Parts Per Million (PPM) Defect Calculation Gate', () => {
    it('accurately calculates PPM for Magna (3 defects across 10,000 inspected pieces = 300 PPM)', () => {
      const stats = calculateSupplierPPM({ supplierId: 'sup_magna' });
      expect(stats.totalInspected).toBe(10000);
      expect(stats.totalDefective).toBe(3);
      expect(stats.ppm).toBe(300);
      expect(stats.passRate).toBe('100.0%');
      expect(stats.ratingGrade).toBe('C'); // >200 PPM
      expect(stats.tier).toBe('action_required');
    });

    it('returns clean zero PPM when no defects exist', () => {
      saveEntity('shiftReports', {
        id: 'sr_clean',
        supplier_id: 'sup_clean',
        inspected_count: 50000,
        defective_count: 0
      });

      const stats = calculateSupplierPPM({ supplierId: 'sup_clean' });
      expect(stats.totalInspected).toBe(50000);
      expect(stats.totalDefective).toBe(0);
      expect(stats.ppm).toBe(0);
      expect(stats.ratingGrade).toBe('A');
      expect(stats.tier).toBe('world_class');
    });

    it('handles zero inspected pieces gracefully with unrated tier', () => {
      const stats = calculateSupplierPPM({ supplierId: 'sup_empty' });
      expect(stats.totalInspected).toBe(0);
      expect(stats.ppm).toBe(0);
      expect(stats.statusText).toBe('No Pieces Inspected');
      expect(stats.tier).toBe('unrated');
    });
  });

  describe('2. Defect Pareto Root Cause Breakdown Gate', () => {
    it('aggregates defects descending by volume with cumulative 80/20 metrics', () => {
      const pareto = getDefectParetoAnalysis();
      expect(Array.isArray(pareto)).toBe(true);
      expect(pareto.length).toBeGreaterThanOrEqual(3);

      // Highest defective volume should be first ('Porosity in Casting' with 5 pcs)
      expect(pareto[0].defectType).toBe('Porosity in Casting');
      expect(pareto[0].totalQuantity).toBe(5);
      expect(pareto[0].criticalCount).toBe(1);

      // Check cumulative percentages
      expect(pareto[0].percentage).toBeGreaterThan(0);
      expect(pareto[pareto.length - 1].cumulativePercentage).toBe(100);
    });

    it('filters Pareto breakdown strictly by supplier ID', () => {
      const magnaPareto = getDefectParetoAnalysis({ supplierId: 'sup_magna' });
      const types = magnaPareto.map(p => p.defectType);
      expect(types).toContain('Fractured Bracket');
      expect(types).toContain('Burrs on Flange');
      expect(types).not.toContain('Porosity in Casting');
    });
  });

  describe('3. Supplier Quality Performance Scorecard Gate', () => {
    it('generates multi-supplier scorecards with grades and total hours logged', () => {
      const scorecards = getSupplierQualityScorecards();
      expect(scorecards.length).toBeGreaterThanOrEqual(2);

      const magnaCard = scorecards.find(s => s.supplierId === 'sup_magna');
      expect(magnaCard).toBeDefined();
      expect(magnaCard.supplierName).toBe('Magna Powertrain International');
      expect(magnaCard.totalHoursLogged).toBe(16.0);
      expect(magnaCard.totalInspectedPieces).toBe(10000);
      expect(magnaCard.totalDefectivePieces).toBe(3);
    });
  });
});
