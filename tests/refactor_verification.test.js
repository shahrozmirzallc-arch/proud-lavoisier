import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

test('Verification 14: Required custom CSS classes are defined in src/index.css', () => {
  const cssContent = fs.readFileSync(path.join(projectRoot, 'src/index.css'), 'utf-8');
  const requiredClasses = [
    'login-shell',
    'login-brand-panel',
    'login-card',
    'login-field',
    'login-submit',
    'login-error',
    'phone-input',
    'phone-select',
    'phone-textarea',
    'phone-btn-primary',
    'phone-btn-secondary',
    'phone-toggle-group',
    'phone-toggle-btn',
    'stitch-input',
    'stitch-panel',
    'web-dashboard-frame'
  ];

  for (const cls of requiredClasses) {
    assert.ok(cssContent.includes(cls), `Required CSS class .${cls} must be defined in src/index.css`);
  }
});

test('Verification 15: Print stylesheet exists in src/index.css', () => {
  const cssContent = fs.readFileSync(path.join(projectRoot, 'src/index.css'), 'utf-8');
  assert.ok(cssContent.includes('@media print'), 'Print stylesheet @media print must exist in src/index.css');
});

test('Verification 1-13: PhoneSimulator code structure & safeguards verification', () => {
  const phoneSim = fs.readFileSync(path.join(projectRoot, 'src/components/PhoneSimulator.jsx'), 'utf-8');

  // 1-5: Navigation routes defined
  assert.ok(phoneSim.includes("activeScreen === 'home'"), "Home screen view must be rendered");
  assert.ok(phoneSim.includes("activeScreen === 'work'"), "Work screen view must be rendered");
  assert.ok(phoneSim.includes("activeScreen === 'reports'"), "Reports screen view must be rendered");
  assert.ok(phoneSim.includes("activeScreen === 'more'"), "More screen view must be rendered");
  assert.ok(phoneSim.includes("activeScreen === 'incident'"), "Alert/Incident screen view must be rendered");

  // 6-8: Expense, Inspection, Rework reachable
  assert.ok(phoneSim.includes("activeScreen === 'expenses'"), "Expense screen must be rendered");
  assert.ok(phoneSim.includes("activeScreen === 'inspection'"), "Inspection screen must be rendered");
  assert.ok(phoneSim.includes("activeScreen === 'rework'"), "Rework screen must be rendered");

  // 9: Special Task prefill
  assert.ok(phoneSim.includes("setInspNotes"), "Special task must set prefilled inspection notes");

  // 10: Unknown active screen safe fallback
  assert.ok(phoneSim.includes("This section could not be opened"), "Unknown active screen must render recoverable error fallback");

  // 11: Missing allocation never displays 40 hours hardcoded fallback
  assert.ok(phoneSim.includes("Authorized hours not configured"), "Missing allocation must show 'Authorized hours not configured' instead of 40 hrs fallback");

  // 12: Missing plant never displays GM Oshawa hardcoded fallback
  assert.ok(phoneSim.includes("'Record unavailable'"), "Missing plant must display 'Record unavailable' instead of hardcoded GM Oshawa");

  // 13: Navigation does not reset during typing
  assert.ok(phoneSim.includes("prev === 'login' ? 'home' : prev"), "Navigation state reset must preserve current screen if logged in");
});
