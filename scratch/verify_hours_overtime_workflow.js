import { readFileSync } from 'fs';

// Mock localStorage, sessionStorage and window for Node environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

global.localStorage = new LocalStorageMock();
global.sessionStorage = new LocalStorageMock();
global.Event = class Event { constructor(type) { this.type = type; } };
global.window = { 
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  Event: global.Event
};

// Load SharedDatabase functions
import { 
  getEntities, 
  saveEntity, 
  isEntryAccountingEligible, 
  isEntryApproved
} from '../src/components/SharedDatabase.js';

// Test Suite Execution
console.log('====================================================');
console.log('  IDS PULSE REAL WORKFLOW TEST SUITE: HOURS & OVERTIME');
console.log('====================================================\n');

// Staged offline queue helpers (mirroring PhoneSimulator.jsx)
const getStagedTimeEntries = () => {
  try {
    const raw = localStorage.getItem('ids_pulse_staged_time_entries');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
};

const saveStagedTimeEntriesList = (list) => {
  try {
    localStorage.setItem('ids_pulse_staged_time_entries', JSON.stringify(list));
  } catch (e) {}
};

const saveStagedTimeEntry = (entry) => {
  const current = getStagedTimeEntries();
  const exists = current.some(e => e.id === entry.id || (e.idempotency_key && e.idempotency_key === entry.idempotency_key));
  if (!exists) {
    entry.retry_count = entry.retry_count || 0;
    entry.last_error = null;
    entry.status = entry.status || 'staged_offline';
    current.push(entry);
    saveStagedTimeEntriesList(current);
  }
};

const syncStagedTimeEntries = () => {
  const staged = getStagedTimeEntries();
  if (!staged || staged.length === 0) return [];

  const createdEntries = [];
  const dbProjects = getEntities('projects') || [];

  for (let sub of staged) {
    const activeProject = dbProjects.find(p => String(p.id) === String(sub.project_id || sub.assignment_id));
    const authorizedHours = activeProject && activeProject.po_hours ? parseFloat(activeProject.po_hours) : null;
    
    // Server-side recalculation of recorded regular hours
    const existingEntries = getEntities('timeEntries') || [];
    const recordedRegularHours = existingEntries
      .filter(t => t.rep_id === sub.rep_id && String(t.project_id) === String(sub.project_id) && t.hour_type === 'regular' && isEntryAccountingEligible(t))
      .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);

    const remainingAlloc = authorizedHours !== null ? Math.max(0, authorizedHours - recordedRegularHours) : Infinity;
    const hrs = parseFloat(sub.reported_hours || sub.hours || 0);

    const regularPortion = Math.min(hrs, remainingAlloc > 0 ? remainingAlloc : 0);
    const overtimePortion = Math.max(0, hrs - regularPortion);

    const submissionId = sub.id || `sub_${Date.now()}`;

    if (regularPortion > 0) {
      const regEntry = {
        id: `te_reg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        idempotency_key: `${sub.idempotency_key || submissionId}_reg`,
        linked_submission_id: submissionId,
        rep_id: sub.rep_id,
        project_id: sub.project_id,
        supplier_id: sub.supplier_id,
        plant_id: sub.plant_id,
        work_date: sub.work_date,
        date: sub.work_date,
        reported_hours: hrs,
        regular_hours: regularPortion,
        overtime_hours: 0,
        hours: regularPortion,
        hour_type: 'regular',
        status: 'recorded',
        approval_required: false,
        approval_source: 'authorized_assignment',
        authorized_hours_snapshot: authorizedHours,
        work_type: sub.work_type,
        work_summary: sub.work_summary,
        synchronized_at: new Date().toISOString()
      };
      saveEntity('timeEntries', regEntry);
      createdEntries.push(regEntry);
    }

    if (overtimePortion > 0) {
      const otEntry = {
        id: `te_ot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        idempotency_key: `${sub.idempotency_key || submissionId}_ot`,
        linked_submission_id: submissionId,
        rep_id: sub.rep_id,
        project_id: sub.project_id,
        supplier_id: sub.supplier_id,
        plant_id: sub.plant_id,
        work_date: sub.work_date,
        date: sub.work_date,
        reported_hours: hrs,
        regular_hours: 0,
        overtime_hours: overtimePortion,
        hours: overtimePortion,
        hour_type: 'overtime',
        status: 'client_pending',
        client_review_status: 'pending',
        approval_required: true,
        approval_source: 'client_approval',
        authorized_hours_snapshot: authorizedHours,
        work_type: sub.work_type,
        work_summary: sub.work_summary,
        synchronized_at: new Date().toISOString()
      };
      saveEntity('timeEntries', otEntry);
      createdEntries.push(otEntry);
    }
  }

  saveStagedTimeEntriesList([]);
  return createdEntries;
};

// Setup Test Project with Authorized Allocation = 10 hrs
const testProject = {
  id: 'proj_test_workflow_10',
  name: 'Stellantis Quality Inspection PO-8800',
  supplier_id: 'sup_stellantis',
  plant_id: 'plant_brampton',
  po_hours: '10',
  rep_id: 'rep_123',
  rep_ids: ['rep_123']
};

saveEntity('projects', testProject);
console.log('✓ Created test project with 10.0 hrs authorized allocation');

// Clear time entries for clean test
localStorage.setItem('ids_pulse_timeEntries', JSON.stringify([]));

// Test helper to compute total recorded regular hours
function getRecordedRegularHours(repId, projId) {
  const entries = getEntities('timeEntries') || [];
  return entries
    .filter(t => t.rep_id === repId && t.project_id === projId && t.hour_type === 'regular' && isEntryAccountingEligible(t))
    .reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
}

// Function simulating Rep submission logic (mirrors PhoneSimulator.jsx handleAddTodayHoursSubmit)
function submitRepHours(repId, project, hrs, dateStr, isOfflineMode = false) {
  const authorizedHours = parseFloat(project.po_hours);
  const recordedRegular = getRecordedRegularHours(repId, project.id);
  const remainingAlloc = Math.max(0, authorizedHours - recordedRegular);

  const regularPortion = Math.min(hrs, remainingAlloc > 0 ? remainingAlloc : 0);
  const overtimePortion = Math.max(0, hrs - regularPortion);

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  if (isOfflineMode) {
    const stagedSubmission = {
      id: submissionId,
      idempotency_key: `idemp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      rep_id: repId,
      assignment_id: project.id,
      project_id: project.id,
      supplier_id: project.supplier_id,
      plant_id: project.plant_id,
      work_date: dateStr,
      reported_hours: hrs,
      work_type: 'Routine inspection',
      work_summary: 'Offline inspection submission',
      source: 'rep_reported',
      staged_at: new Date().toISOString()
    };
    saveStagedTimeEntry(stagedSubmission);
    return { status: 'staged_offline', submissionId };
  }

  const results = [];

  if (regularPortion > 0) {
    const regularEntry = {
      id: `te_reg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      idempotency_key: `idemp_reg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      linked_submission_id: submissionId,
      rep_id: repId,
      assignment_id: project.id,
      project_id: project.id,
      supplier_id: project.supplier_id,
      plant_id: project.plant_id,
      work_date: dateStr,
      date: dateStr,
      reported_hours: hrs,
      regular_hours: regularPortion,
      overtime_hours: 0,
      hours: regularPortion,
      hour_type: 'regular',
      status: 'recorded',
      approval_required: false,
      approval_source: 'authorized_assignment',
      authorized_hours_snapshot: authorizedHours,
      remaining_hours_before: remainingAlloc,
      remaining_hours_after: Math.max(0, remainingAlloc - regularPortion),
      work_type: 'Routine inspection',
      work_summary: 'Inspection within authorized allocation',
      source: 'rep_reported',
      submitted_at: new Date().toISOString()
    };
    saveEntity('timeEntries', regularEntry);
    results.push(regularEntry);
  }

  if (overtimePortion > 0) {
    const overtimeEntry = {
      id: `te_ot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      idempotency_key: `idemp_ot_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      linked_submission_id: submissionId,
      rep_id: repId,
      assignment_id: project.id,
      project_id: project.id,
      supplier_id: project.supplier_id,
      plant_id: project.plant_id,
      work_date: dateStr,
      date: dateStr,
      reported_hours: hrs,
      regular_hours: 0,
      overtime_hours: overtimePortion,
      hours: overtimePortion,
      hour_type: 'overtime',
      status: 'client_pending',
      client_review_status: 'pending',
      approval_required: true,
      approval_source: 'client_approval',
      authorized_hours_snapshot: authorizedHours,
      remaining_hours_before: Math.max(0, remainingAlloc - regularPortion),
      remaining_hours_after: 0,
      work_type: 'Routine inspection',
      work_summary: 'Inspection exceeding authorized allocation',
      source: 'rep_reported',
      submitted_at: new Date().toISOString()
    };
    saveEntity('timeEntries', overtimeEntry);
    results.push(overtimeEntry);
  }

  return { status: 'submitted_online', results, regularPortion, overtimePortion };
}

// STEP 1: Submit 2, 3, 1.5, 3.5 hrs (Total = 10 hrs within allocation)
console.log('\n--- TEST STEP 1: Sequential Submissions Within 10 Hr Allocation ---');
const sub1 = submitRepHours('rep_123', testProject, 2.0, '2026-07-28');
console.log(`Sub 1 (2.0 hrs): regular = ${sub1.regularPortion}, overtime = ${sub1.overtimePortion}, status = ${sub1.results[0].status}`);

const sub2 = submitRepHours('rep_123', testProject, 3.0, '2026-07-29');
console.log(`Sub 2 (3.0 hrs): regular = ${sub2.regularPortion}, overtime = ${sub2.overtimePortion}, status = ${sub2.results[0].status}`);

const sub3 = submitRepHours('rep_123', testProject, 1.5, '2026-07-30');
console.log(`Sub 3 (1.5 hrs): regular = ${sub3.regularPortion}, overtime = ${sub3.overtimePortion}, status = ${sub3.results[0].status}`);

const sub4 = submitRepHours('rep_123', testProject, 3.5, '2026-07-31');
console.log(`Sub 4 (3.5 hrs): regular = ${sub4.regularPortion}, overtime = ${sub4.overtimePortion}, status = ${sub4.results[0].status}`);

const totalRecordedReg = getRecordedRegularHours('rep_123', testProject.id);
console.log(`Total Recorded Regular Hours: ${totalRecordedReg} / 10.0 hrs`);
if (totalRecordedReg !== 10.0) throw new Error(`Expected 10.0 regular hours recorded, got ${totalRecordedReg}`);
console.log('✅ PASS: All 10.0 regular hours recorded automatically with status="recorded" and approval_required=false.');

// STEP 2: Submit 2 more hours when allocation is full (Overtime Split)
console.log('\n--- TEST STEP 2: Submit 2.0 Hrs Exceeding Allocation (Overtime Split) ---');
const sub5 = submitRepHours('rep_123', testProject, 2.0, '2026-07-31');
console.log(`Sub 5 (2.0 hrs): regular = ${sub5.regularPortion}, overtime = ${sub5.overtimePortion}`);
console.log(`Overtime Entry Status: ${sub5.results[0].status}, client_review_status: ${sub5.results[0].client_review_status}`);
console.log(`Accounting Eligible before Client Approval? ${isEntryAccountingEligible(sub5.results[0])}`);
if (sub5.regularPortion !== 0 || sub5.overtimePortion !== 2.0) throw new Error('Expected 0 regular and 2.0 overtime');
if (sub5.results[0].status !== 'client_pending' || isEntryAccountingEligible(sub5.results[0]) !== false) {
  throw new Error('Overtime entry must be client_pending and NOT accounting eligible before approval');
}
console.log('✅ PASS: Overtime split generated 2.0 hrs client_pending overtime (blocked from accounting).');

// STEP 3: Client Approves Overtime
console.log('\n--- TEST STEP 3: Client Approves Overtime Entry ---');
const otEntry = sub5.results[0];
const approvedOt = {
  ...otEntry,
  status: 'client_approved',
  client_review_status: 'approved',
  client_reviewed_by: 'Stellantis Quality Manager',
  client_reviewed_at: new Date().toISOString()
};
saveEntity('timeEntries', approvedOt);
console.log(`Client Approved Status: ${approvedOt.status}, client_review_status: ${approvedOt.client_review_status}`);
console.log(`Accounting Eligible AFTER Client Approval? ${isEntryAccountingEligible(approvedOt)}`);
if (!isEntryAccountingEligible(approvedOt)) throw new Error('Client approved overtime MUST be accounting eligible');
console.log('✅ PASS: Approved overtime entry successfully becomes accounting eligible.');

// STEP 4: Test Offline Staging and Reconnection Sync
console.log('\n--- TEST STEP 4: Offline Staging & Server Reconnection Sync ---');
// Clear database and test offline entry submission
localStorage.setItem('ids_pulse_timeEntries', JSON.stringify([]));
const offlineSub = submitRepHours('rep_123', testProject, 12.0, '2026-07-31', true);
console.log(`Offline Submission Status: ${offlineSub.status}`);
console.log(`Staged Entries Count: ${getStagedTimeEntries().length}`);

const syncedEntries = syncStagedTimeEntries();
console.log(`Synced Entries Count: ${syncedEntries.length}`);
console.log(`Entries details:`);
syncedEntries.forEach((e, idx) => {
  console.log(`  Entry ${idx + 1}: hour_type=${e.hour_type}, hours=${e.hours}, status=${e.status}`);
});

const postSyncReg = getRecordedRegularHours('rep_123', testProject.id);
const postSyncEntries = getEntities('timeEntries');
const postSyncOT = postSyncEntries.find(e => e.hour_type === 'overtime');

console.log(`Post-Sync Regular Hours Recorded: ${postSyncReg} / 10.0`);
console.log(`Post-Sync Overtime Hours Pending Client: ${postSyncOT ? postSyncOT.hours : 0} / 2.0`);

if (postSyncReg !== 10.0 || postSyncOT?.hours !== 2.0) {
  throw new Error('Offline sync failed to correctly split 12.0 hrs into 10.0 regular and 2.0 overtime!');
}
console.log('✅ PASS: Offline reconnection outbox sync correctly calculated allocation and split 12.0 hrs into 10.0 regular and 2.0 pending overtime.');

console.log('\n====================================================');
console.log('  ALL REAL WORKFLOW TESTS PASSED SUCCESSFULLY! (100%)');
console.log('====================================================');
