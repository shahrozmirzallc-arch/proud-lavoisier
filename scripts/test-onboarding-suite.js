import { createClient } from '@supabase/supabase-js';
import { 
  validateOnboardingPayload, 
  resolveRateValue, 
  formatRateDisplay 
} from '../src/services/onboardingService.js';

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runOnboardingTestSuite() {
  console.log("=================================================");
  console.log("  IDS PULSE ROUND 4 AUTOMATED TEST SUITE        ");
  console.log("=================================================\n");

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passedCount++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failedCount++;
    }
  }

  // -----------------------------------------------------
  // 1. Validation & Payload Mapping Unit Tests
  // -----------------------------------------------------
  console.log("--- 1. Validation & Payload Mapping Unit Tests ---");
  try {
    const valid = validateOnboardingPayload({
      supplier_name: '  Atlas Automotive Test  ',
      project_name: '  Containment Audit  ',
      billing_rate: '85.50',
      pay_rate: '45.00'
    });
    assert(valid.supplier_name === 'Atlas Automotive Test', "Supplier name trimmed correctly");
    assert(valid.project_name === 'Containment Audit', "Project name trimmed correctly");
    assert(valid.billing_rate === 85.5, "Billing rate parsed to numeric 85.5");
    assert(valid.pay_rate === 45, "Pay rate parsed to numeric 45");
    assert(valid.part_number === 'AT-4472', "Default part_number fallback applied");
    assert(valid.po_number === 'PO-2026-ATLAS', "Default po_number fallback applied");
  } catch (err) {
    assert(false, `Payload validation threw unexpected error: ${err.message}`);
  }

  try {
    validateOnboardingPayload({ supplier_name: '', project_name: 'Test', billing_rate: '50', pay_rate: '30' });
    assert(false, "Validation should throw on empty supplier_name");
  } catch (err) {
    assert(err.message.includes("Company/Supplier Name is required"), "Throws error on missing supplier_name");
  }

  try {
    validateOnboardingPayload({ supplier_name: 'Test', project_name: 'Test', billing_rate: '-10', pay_rate: '30' });
    assert(false, "Validation should throw on negative billing_rate");
  } catch (err) {
    assert(err.message.includes("Billing rate must be a valid non-negative number"), "Throws error on negative billing_rate");
  }

  // -----------------------------------------------------
  // 2. Registry Render Tests (Rate Resolver & Formatting)
  // -----------------------------------------------------
  console.log("\n--- 2. Registry Render Tests (Rate Formatting Guardrail) ---");
  const testProject = { id: 'p1', supplier_id: 'sup1', rep_id: 'rep1', billing_rate: 85.5, pay_rate: 45, currency: 'USD' };
  const missingRateProject = { id: 'p2', supplier_id: 'sup2', rep_id: 'rep2', currency: 'USD' };
  const ratesList = [{ project_id: 'p2', billing_rate: 90, pay_rate: 50 }];

  assert(formatRateDisplay(testProject, [], 'billing') === 'US$ 85.50/hr', "Formats valid billing rate correctly");
  assert(formatRateDisplay(missingRateProject, ratesList, 'billing') === 'US$ 90.00/hr', "Resolves billing rate from rates list fallback");
  assert(formatRateDisplay({ id: 'p3' }, [], 'billing') === 'Rate not configured', "Returns 'Rate not configured' when missing");
  assert(!formatRateDisplay({ id: 'p4', billing_rate: 'invalid' }, [], 'billing').includes('NaN'), "Never formats 'NaN'");

  // -----------------------------------------------------
  // 3. Schema Contract Test Against Live Supabase
  // -----------------------------------------------------
  console.log("\n--- 3. Schema Contract Test Against Live Supabase ---");
  const { data: cols, error: colErr } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (colErr) console.error("   [ColErr Debug]:", colErr);
  assert(!colErr, "Projects query executes without schema error");
  
  const { data: supplierCols, error: supErr } = await supabase
    .from('suppliers')
    .select('*')
    .limit(1);
  if (supErr) console.error("   [SupErr Debug]:", supErr);
  assert(!supErr, "Suppliers query executes without schema error");

  // -----------------------------------------------------
  // 4. RLS Rejection Test For Unauthorized Role / Anon Session
  // -----------------------------------------------------
  console.log("\n--- 4. RLS Rejection Test For Unauthenticated Session ---");
  const { data: rpcAnon, error: rpcAnonErr } = await supabase.rpc('onboard_client_project', {
    p_supplier_name: 'Unauthorized Test Client',
    p_project_name: 'Unauthorized Project',
    p_billing_rate: 85,
    p_pay_rate: 45
  });

  if (rpcAnonErr) console.log("   [RpcAnonErr Message]:", rpcAnonErr.message);
  assert(rpcAnonErr !== null, "Anonymous session invocation is rejected by RLS / Security check");
  assert(Boolean(rpcAnonErr && (rpcAnonErr.message.includes("Unauthorized") || rpcAnonErr.message.includes("permission denied"))), "Rejection message contains 'Unauthorized' or 'permission denied'");

  // -----------------------------------------------------
  // 5. Authenticated Super Admin Atomic Transaction Test
  // -----------------------------------------------------
  console.log("\n--- 5. Authenticated Super Admin Atomic Transaction Test ---");
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'shahroz@integritydriven.com',
    password: 'Shahroz123$'
  });

  if (authErr) console.error("   [AuthErr Debug]:", authErr);
  assert(!authErr && authData?.session, "Super Admin authenticated via real Supabase Auth JWT");

  if (authData?.session) {
    const testSupplierName = `Atlas Suite Test ${Date.now()}`;
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('onboard_client_project', {
      p_supplier_name: testSupplierName,
      p_contact_name: 'Marcus Vance',
      p_contact_email: 'marcus.vance@atlasauto.test',
      p_contact_phone: '+1 519-555-0188',
      p_address: '100 Automotive Way, Windsor, ON',
      p_allotted_hours: 40,
      p_plant_name: 'Atlas Windsor Plant 1',
      p_plant_city: 'Windsor',
      p_project_name: 'Incoming Quality Containment Audit — Part AT-4472',
      p_part_number: 'AT-4472',
      p_po_number: 'PO-2026-ATLAS-TEST',
      p_rep_id: '1',
      p_billing_rate: 85.00,
      p_pay_rate: 45.00,
      p_currency: 'USD'
    });

    assert(!rpcErr && rpcRes && rpcRes.success === true, "Atomic onboarding RPC executed successfully in single transaction");
    if (rpcRes) {
      assert(Boolean(rpcRes.supplier_id), `Returned supplier_id: ${rpcRes.supplier_id}`);
      assert(Boolean(rpcRes.project_id), `Returned project_id: ${rpcRes.project_id}`);
      assert(Boolean(rpcRes.plant_id), `Returned plant_id: ${rpcRes.plant_id}`);

      // Verify records in DB
      const { data: verifyProj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', rpcRes.project_id)
        .single();
      assert(verifyProj && verifyProj.supplier_id === rpcRes.supplier_id, "Project record persisted with correct supplier_id");
      assert(verifyProj && Number(verifyProj.billing_rate) === 85, "Project record persisted with billing_rate 85.00");

      const { data: verifyRate } = await supabase
        .from('rates')
        .select('*')
        .eq('project_id', rpcRes.project_id)
        .single();
      assert(verifyRate && Number(verifyRate.billing_rate) === 85, "Rate record persisted with project_id and billing_rate 85.00");

      const { data: verifyLog } = await supabase
        .from('system_logs')
        .select('*')
        .eq('category', 'onboarding')
        .order('timestamp', { ascending: false })
        .limit(1);
      assert(verifyLog && verifyLog.length > 0 && verifyLog[0].details.includes(testSupplierName), "Audit event persisted in system_logs");
    }
  }

  // -----------------------------------------------------
  // 6. Summary Output
  // -----------------------------------------------------
  console.log("\n=================================================");
  console.log(`  TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOnboardingTestSuite().catch(err => {
  console.error("Test runner encountered fatal error:", err);
  process.exit(1);
});
