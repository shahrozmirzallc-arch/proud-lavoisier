// tests/daily_quality_report_areas.test.js
// Authoritative Unit Test Suite for Daily Quality Report Area Terminology Fix

import { describe, it, expect } from 'vitest';
import { formatAreaName, normalizeAndMergeShiftAreas, CANONICAL_SHIFT_AREAS } from '../src/utils/shiftAreaUtils';

describe('Daily Quality Report Area Terminology Fix & Legacy Compatibility Suite', () => {

  it('1. Verifies exact canonical 5 areas in required order', () => {
    expect(CANONICAL_SHIFT_AREAS).toEqual([
      'Install Area',
      'Sequence Area',
      'Heavy Repair',
      'Review Scrap Table',
      'SAC Department'
    ]);

    const defaultMerged = normalizeAndMergeShiftAreas([]);
    const defaultNames = defaultMerged.map(a => a.name);

    expect(defaultNames).toEqual([
      'Install Area',
      'Sequence Area',
      'Heavy Repair',
      'Review Scrap Table',
      'SAC Department'
    ]);
  });

  it('2. Maps legacy area names to canonical corrected display labels', () => {
    expect(formatAreaName('Online assembly')).toBe('Install Area');
    expect(formatAreaName('online assembly')).toBe('Install Area');
    expect(formatAreaName('Heavy rework')).toBe('Heavy Repair');
    expect(formatAreaName('heavy rework')).toBe('Heavy Repair');
    expect(formatAreaName('Sequence area')).toBe('Sequence Area');
    expect(formatAreaName('Review Scrap Table')).toBe('Review Scrap Table');
    expect(formatAreaName('SAC Department')).toBe('SAC Department');
  });

  it('3. Normalizes legacy draft without creating duplicate areas or losing statuses and notes', () => {
    const legacyDraftAreas = [
      { id: 'wa_1', name: 'Online assembly', status: 'issues', notes: 'Gasket seal gap found' },
      { id: 'wa_2', name: 'Sequence area', status: 'no_issues', notes: 'Walked sequence line' },
      { id: 'wa_3', name: 'Heavy rework', status: 'no_issues', notes: 'All heavy repair bays clear' },
      { id: 'wa_4', name: 'Review Scrap Table', status: 'issues', notes: 'Scrap light reworked' }
    ];

    const normalized = normalizeAndMergeShiftAreas(legacyDraftAreas);

    // Must be exactly 5 areas
    expect(normalized).toHaveLength(5);

    // Exact order check
    expect(normalized[0].name).toBe('Install Area');
    expect(normalized[0].status).toBe('issues');
    expect(normalized[0].notes).toBe('Gasket seal gap found');

    expect(normalized[1].name).toBe('Sequence Area');
    expect(normalized[1].status).toBe('no_issues');
    expect(normalized[1].notes).toBe('Walked sequence line');

    expect(normalized[2].name).toBe('Heavy Repair');
    expect(normalized[2].status).toBe('no_issues');
    expect(normalized[2].notes).toBe('All heavy repair bays clear');

    expect(normalized[3].name).toBe('Review Scrap Table');
    expect(normalized[3].status).toBe('issues');
    expect(normalized[3].notes).toBe('Scrap light reworked');

    // New SAC Department area added automatically
    expect(normalized[4].name).toBe('SAC Department');
    expect(normalized[4].status).toBe('pending');
  });

  it('4. Prevents duplicates if draft already has both legacy and new names', () => {
    const mixedDraft = [
      { id: 'wa_1', name: 'Online assembly', status: 'issues', notes: 'Legacy note' },
      { id: 'wa_2', name: 'Install Area', status: 'issues', notes: 'Updated note' },
      { id: 'wa_3', name: 'Heavy rework', status: 'no_issues', notes: 'Bay check' }
    ];

    const merged = normalizeAndMergeShiftAreas(mixedDraft);

    expect(merged.filter(a => a.name === 'Install Area')).toHaveLength(1);
    expect(merged.filter(a => a.name === 'Heavy Repair')).toHaveLength(1);
    expect(merged).toHaveLength(5);
  });

  it('5. New submissions save canonical area names cleanly', () => {
    const freshWalk = [
      { id: 'wa_1', name: 'Install Area', status: 'no_issues', notes: 'Line clear' },
      { id: 'wa_2', name: 'Sequence Area', status: 'no_issues', notes: 'OK' },
      { id: 'wa_3', name: 'Heavy Repair', status: 'issues', notes: 'Bay 2 hold' },
      { id: 'wa_4', name: 'Review Scrap Table', status: 'no_issues', notes: 'Verified' },
      { id: 'wa_5', name: 'SAC Department', status: 'no_issues', notes: 'SAC audited' }
    ];

    const saved = normalizeAndMergeShiftAreas(freshWalk);
    expect(saved.map(s => s.name)).toEqual([
      'Install Area',
      'Sequence Area',
      'Heavy Repair',
      'Review Scrap Table',
      'SAC Department'
    ]);
  });

});
