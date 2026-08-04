import { describe, it, expect } from 'vitest';
import { isFieldRep } from '../src/components/SharedDatabase.js';

describe('IDS Rep vs Client Rep Role Distinction Suite (Rule 8)', () => {
  const testCases = [
    { user: { role: 'customer', title: 'Primary Quality Director', customer_id: 'sup_magna' }, expected: false },
    { user: { role: 'customer', title: 'Senior Supplier Quality Manager', customer_id: 'sup_gm' }, expected: false },
    { user: { role: 'client', title: 'Quality Assurance Manager' }, expected: false },
    { user: { role: 'rep', title: 'Quality Liaison Rep' }, expected: true },
    { user: { role: 'rep', title: 'Quality Inspector' }, expected: true },
    { user: { role: 'qre', title: 'Quality Resident Engineer' }, expected: true }
  ];

  testCases.forEach(({ user, expected }) => {
    it(`correctly identifies user with role="${user.role}", title="${user.title}" as ${expected}`, () => {
      const result = isFieldRep(user);
      expect(result).toBe(expected);
    });
  });
});
