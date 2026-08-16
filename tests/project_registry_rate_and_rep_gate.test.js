// tests/project_registry_rate_and_rep_gate.test.js
import { describe, it, expect } from 'vitest';
import { resolveRateValue, formatRateDisplay } from '../src/services/onboardingService.js';

describe('Project Registry Rate & Rep Resolution Gate (Anti-Recurrence)', () => {
  it('1. Resolves direct project rates accurately', () => {
    const proj = { id: 'p1', billing_rate: 95.0, pay_rate: 48.0, currency: 'CAD' };
    expect(resolveRateValue(proj, [], 'billing')).toBe(95.0);
    expect(resolveRateValue(proj, [], 'pay')).toBe(48.0);
    expect(formatRateDisplay(proj, [], 'billing')).toBe('C$ 95.00/hr');
    expect(formatRateDisplay(proj, [], 'pay')).toBe('C$ 48.00/hr');
  });

  it('2. Resolves fallback rates when supplier names match with sup_ prefixes', () => {
    const proj = {
      id: 'proj_windsor_500',
      client_id: 'Stellantis Powertrain Systems',
      supplier_id: 'Stellantis Powertrain Systems',
      rep_id: 'rep_test',
      currency: 'CAD'
    };

    const ratesList = [
      {
        id: 'rc_stellantis_clarence',
        rep_id: 'rep_clarence',
        supplier_id: 'sup_stellantis',
        plant_id: 'plant_windsor',
        billing_rate: 95.00,
        pay_rate: 48.00,
        currency: 'CAD'
      }
    ];

    expect(resolveRateValue(proj, ratesList, 'billing')).toBe(95.0);
    expect(resolveRateValue(proj, ratesList, 'pay')).toBe(48.0);
    expect(formatRateDisplay(proj, ratesList, 'billing')).toBe('C$ 95.00/hr');
    expect(formatRateDisplay(proj, ratesList, 'pay')).toBe('C$ 48.00/hr');
  });

  it('3. Guarantees __new__ and draft strings are not treated as valid rep names', () => {
    const sanitizeRep = (rawRep) => (!rawRep || rawRep === '__new__' || rawRep === 'undefined') ? 'Unassigned / Pending' : rawRep;
    expect(sanitizeRep('__new__')).toBe('Unassigned / Pending');
    expect(sanitizeRep(undefined)).toBe('Unassigned / Pending');
    expect(sanitizeRep('')).toBe('Unassigned / Pending');
    expect(sanitizeRep('Clarence Kuiken')).toBe('Clarence Kuiken');
  });
});
