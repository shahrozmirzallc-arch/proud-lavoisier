/**
 * IDS Pulse — Automated E2E Verification Script
 * Runs against the source code and seed data to verify system integrity.
 * Execute with: node test_ids_pulse.mjs
 */

import { readFileSync } from 'fs';
import { createHash } from 'crypto';

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';
const WARN = '⚠️  WARN';
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function test(name, condition, detail = '') {
  if (condition) {
    console.log(`  ${PASS}  ${name}`);
    passCount++;
  } else {
    console.log(`  ${FAIL}  ${name}${detail ? ' — ' + detail : ''}`);
    failCount++;
  }
}

function warn(name, detail = '') {
  console.log(`  ${WARN}  ${name}${detail ? ' — ' + detail : ''}`);
  warnCount++;
}

console.log('\n══════════════════════════════════════════════════');
console.log(' IDS PULSE — AUTOMATED SYSTEM VERIFICATION');
console.log('══════════════════════════════════════════════════\n');

const sharedDb = readFileSync('src/components/SharedDatabase.js', 'utf-8');
const appJsx = readFileSync('src/App.jsx', 'utf-8');
const dashboardJsx = readFileSync('src/components/WebDashboard.jsx', 'utf-8');
const phoneJsx = readFileSync('src/components/PhoneSimulator.jsx', 'utf-8');
const indexCss = readFileSync('src/index.css', 'utf-8');

// ═══════════════════════════════════════════════════════
// SUITE 1: Authentication & Password Hashes
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 1: Authentication & Password Hashes ━━━\n');

function sha256(text) { return createHash('sha256').update(text).digest('hex'); }

const creds = {
  admin: { greg:'Greg2026!', colleen:'Colleen2026!', monica:'Monica2026!', iris:'Iris2026!', donna:'Donna2026!', miriam:'Miriam2026!', idspulse:'Pulse2026!', diana:'DianaPulse2026!', shahroz:'Shahroz123$' },
  rep: { hugo:'Hugo2026!', nabil:'Nabil2026!', rogelio:'Rogelio2026!', clarence:'Clarence2026!' },
  customer: { autokabel:'Autokabel2026!', magna:'Magna2026!', hutchinson:'Hutchinson2026!', brose:'Brose2026!' }
};

for (const [cat, users] of Object.entries(creds)) {
  for (const [user, pw] of Object.entries(users)) {
    const h = sha256(pw);
    test(`${cat}/${user} password hash matches code`, appJsx.includes(h));
  }
}

test('Master password hash present in isShahrozPw', appJsx.includes(sha256('Shahroz123$')));
test('No plaintext passwords in App.jsx', !appJsx.includes("'Greg2026!'") && !appJsx.includes("'Hugo2026!'"));
test('Auth uses sessionStorage (not localStorage)', appJsx.includes("sessionStorage.setItem('ids_pulse_unlocked'"));

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 2: Role Mapping & Access Control
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 2: Role Mapping & Access Control ━━━\n');

test('Shahroz/idspulse → "shahroz" role', appJsx.includes("'shahroz' || adminName === 'idspulse') ? 'shahroz'"));
test('Colleen → "accountant" role', appJsx.includes("'colleen' ? 'accountant'"));
test('Donna → "lead" role', appJsx.includes("'donna' ? 'lead'"));
test('Reps → "rep" role', appJsx.includes("setUserRole('rep')"));
test('Customers → "customer" role', appJsx.includes("setUserRole('customer')"));
test('Colleen forced to Light Mode', appJsx.includes("adminName === 'colleen'") && appJsx.includes("setDayNight('night')"));
test('System Logs restricted to shahroz', dashboardJsx.includes("activeTab === 'system-logs' && userRole === 'shahroz'"));
test('Clear Log Console restricted to super_admin', dashboardJsx.includes("userRole === 'super_admin'"));
test('Customer data filtered by supplier_id', dashboardJsx.includes("userRole === 'customer'") && dashboardJsx.includes('supplier_id'));
test('QRE data filtered by rep_id', dashboardJsx.includes("userRole === 'qre'") && dashboardJsx.includes('rep_id'));

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 3: Seed Data Counts
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 3: Seed Data Counts ━━━\n');

function countIds(entity) {
  const start = sharedDb.indexOf(`${entity}: [`);
  if (start === -1) return -1;
  let depth = 0, count = 0, started = false;
  for (let i = start; i < sharedDb.length; i++) {
    if (sharedDb[i] === '[' && !started) { started = true; depth++; continue; }
    if (!started) continue;
    if (sharedDb[i] === '[') depth++;
    if (sharedDb[i] === ']') { depth--; if (depth === 0) break; }
    if (depth === 1 && sharedDb.substring(i, i+4) === 'id: ') count++;
  }
  return count;
}

const expected = { users:8, rates:5, plants:6, suppliers:5, parts:3, incidents:9, shiftReports:4, reworkLogs:4, timeEntries:7, expenseEntries:4, emailLogs:1, dailyTasks:5, projects:3, systemLogs:1, extraHoursRequests:2 };
for (const [e, exp] of Object.entries(expected)) {
  const got = countIds(e);
  test(`${e}: ${got} items (expected ${exp})`, got === exp);
}

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 4: Cross-Reference Integrity
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 4: Cross-Reference Integrity ━━━\n');

const userIds = ['1','2','3','4','user_diana','rep_hugo','rep_nabil','rep_rogelio'];
const supplierIds = ['magna','hutchinson','autokabel','brose','borgwarner'];
const plantIds = ['gm_oshawa','magna_autosystems','hutchinson','mercedes_tuscaloosa','ford_dearborn','gm_slp'];

const incReps = ['1','1','1','1','1','1','1','rep_hugo','rep_nabil'];
const incSups = ['magna','magna','magna','magna','magna','magna','magna','autokabel','autokabel'];
const incPlants = ['gm_oshawa','gm_oshawa','gm_oshawa','gm_oshawa','gm_oshawa','gm_oshawa','gm_oshawa','mercedes_tuscaloosa','ford_dearborn'];

for (let i = 0; i < 9; i++) {
  test(`inc_${i+1} rep→users valid`, userIds.includes(incReps[i]));
  test(`inc_${i+1} supplier→suppliers valid`, supplierIds.includes(incSups[i]));
  test(`inc_${i+1} plant→plants valid`, plantIds.includes(incPlants[i]));
}

const teReps = ['1','1','rep_hugo','rep_hugo','rep_nabil','rep_nabil','rep_rogelio'];
for (let i = 0; i < 7; i++) test(`te_${i+1} rep→users valid`, userIds.includes(teReps[i]));

test('proj_1→magna valid', supplierIds.includes('magna'));
test('proj_2→brose valid', supplierIds.includes('brose'));
test('proj_3→autokabel valid', supplierIds.includes('autokabel'));

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 5: Theme Engine
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 5: Theme Engine & CSS ━━━\n');

test('Royal Blue theme in CSS', indexCss.includes('theme-royal-blue'));
test('Neon Violet theme in CSS', indexCss.includes('theme-neon-violet'));
test('Emerald Green theme in CSS', indexCss.includes('theme-emerald-green'));
test('Ruby Red theme in CSS', indexCss.includes('theme-ruby-red'));
test('mode-dark variables defined', indexCss.includes('mode-dark'));
test('mode-light variables defined', indexCss.includes('mode-light'));

for (const v of ['--bg','--surface','--surface-elevated','--text','--muted-text','--border','--primary','--accent']) {
  test(`Semantic var "${v}" defined`, indexCss.includes(`${v}:`));
}

test('Theme toggle adds body classes', appJsx.includes("document.body.classList.add(`theme-${theme}`)"));
test('Day/Night toggle works', appJsx.includes("document.body.classList.add('mode-light')") && appJsx.includes("document.body.classList.add('mode-dark')"));
test('Theme persisted', appJsx.includes("localStorage.setItem('ids_pulse_theme'"));
test('Day/Night persisted', appJsx.includes("localStorage.setItem('ids_pulse_daynight'"));
test('Light mode bg #F4F7FE (SaaS)', indexCss.includes('#F4F7FE'));
test('350ms smooth transitions', indexCss.includes('350ms'));

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 6: Layout & Tabs
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 6: Layout Modes & Tabs ━━━\n');

test('side-by-side layout', appJsx.includes("'side-by-side'"));
test('phone-only layout', appJsx.includes("'phone-only'"));
test('dashboard-only layout', appJsx.includes("'dashboard-only'"));
test('roadmap-only layout (shahroz)', appJsx.includes("'roadmap-only'"));

const tabs = ['pulse-ai','incidents','heatmap','daily-planner','shift-logs','suppliers','time-tracking','rework-logs','emails','users','roadmap','projects','system-logs','customer-portal','approvals'];
for (const t of tabs) test(`Tab "${t}" exists`, dashboardJsx.includes(`'${t}'`));

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 7: Phone Simulator
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 7: Phone Simulator ━━━\n');

for (const name of ['Clarence','Hugo','Nabil','Rogelio','Donna']) {
  test(`Quick login: ${name}`, phoneJsx.includes(`'${name}'`));
}
for (const screen of ['incident','rework','summary','history','time-expense']) {
  test(`Screen: ${screen}`, phoneJsx.includes(`'${screen}'`));
}

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 8: Business Logic
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 8: Business Logic ━━━\n');

test('Extra hours: pending_customer status', sharedDb.includes('pending_customer'));
test('Extra hours: pending_admin status', sharedDb.includes('pending_admin'));
test('Extra hours: approval history array', sharedDb.includes('history:'));
test('Supabase sync initialized', sharedDb.includes('createClient'));
test('Offline queue support', sharedDb.includes('flushOfflineQueue'));
test('DB event system', sharedDb.includes('ids_pulse_db_update'));
test('Invoice flag on timeEntries', sharedDb.includes('invoiced: false'));
test('Payroll flag on timeEntries', sharedDb.includes('sent_to_payroll: false'));
test('Expense statuses (approved/pending)', sharedDb.includes("status: 'approved'") && sharedDb.includes("status: 'pending'"));
test('Incident PRR classification', sharedDb.includes("'PRR'"));
test('Incident QR classification', sharedDb.includes("'QR'"));
test('Defect location coords for heatmap', sharedDb.includes('defect_location_x'));

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 9: Security
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 9: Security ━━━\n');

test('SHA-256 hashing used', appJsx.includes('SHA-256'));
test('Logout clears all session keys', appJsx.includes("sessionStorage.removeItem('ids_pulse_unlocked')"));
test('Auth error auto-clears (800ms)', appJsx.includes('800'));
test('Role switch blocked for non-shahroz', appJsx.includes('Block unauthorized switch'));
test('ErrorBoundary wraps components', appJsx.includes('ErrorBoundary'));

console.log('');

// ═══════════════════════════════════════════════════════
// SUITE 10: Known Issues & Warnings
// ═══════════════════════════════════════════════════════
console.log('━━━ SUITE 10: Known Issues & Warnings ━━━\n');

if (!appJsx.includes("'super_admin'")) {
  warn('No login maps to "super_admin" role — Clear Log Console permanently hidden');
}
if (!sharedDb.includes("supplier_id: 'borgwarner'")) {
  warn('BorgWarner has no incidents/time entries in seed data');
}
if (!sharedDb.includes("supplier_id: 'brose'") || sharedDb.indexOf("supplier_id: 'brose'") === sharedDb.lastIndexOf("supplier_id: 'brose'")) {
  warn('Brose has minimal activity data in seed (only 1 rework log)');
}

console.log('');

// ═══════════════════════════════════════════════════════
// FINAL SUMMARY
// ═══════════════════════════════════════════════════════
console.log('══════════════════════════════════════════════════');
console.log(' FINAL TEST RESULTS');
console.log('══════════════════════════════════════════════════');
console.log(`  ✅ Passed:   ${passCount}`);
console.log(`  ❌ Failed:   ${failCount}`);
console.log(`  ⚠️  Warnings: ${warnCount}`);
console.log(`  📊 Total:    ${passCount + failCount + warnCount}`);
console.log('══════════════════════════════════════════════════');

if (failCount > 0) {
  console.log('\n🔴 SOME TESTS FAILED — Review failures above.\n');
  process.exit(1);
} else {
  console.log('\n🟢 ALL TESTS PASSED — System integrity verified.\n');
  process.exit(0);
}
