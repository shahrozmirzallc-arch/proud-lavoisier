import { isFieldRep } from '../src/components/SharedDatabase.js';

console.log('[Test Suite] Verifying Strict Distinction: IDS Field Inspector vs Client Rep...');

const testCases = [
  { user: { role: 'customer', title: 'Primary Quality Director', customer_id: 'sup_magna' }, expected: false },
  { user: { role: 'customer', title: 'Senior Supplier Quality Manager', customer_id: 'sup_gm' }, expected: false },
  { user: { role: 'client', title: 'Quality Assurance Manager' }, expected: false },
  { user: { role: 'rep', title: 'Quality Liaison Rep' }, expected: true },
  { user: { role: 'rep', title: 'Quality Inspector' }, expected: true },
  { user: { role: 'qre', title: 'Quality Resident Engineer' }, expected: true }
];

let passed = true;

testCases.forEach(({ user, expected }) => {
  const result = isFieldRep(user);
  if (result !== expected) {
    console.error(`❌ FAILED for user role="${user.role}", title="${user.title}": expected ${expected}, got ${result}`);
    passed = false;
  } else {
    console.log(`✓ PASSED for user role="${user.role}", title="${user.title}": correctly returned ${result}`);
  }
});

if (!passed) {
  console.error('[Test Suite] Rule 8 Distinction Test FAILED!');
  process.exit(1);
} else {
  console.log('[Test Suite] ALL RULE 8 DISTINCTION TESTS PASSED CLEANLY!');
}
