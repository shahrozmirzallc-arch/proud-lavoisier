// scratch/inspect_supabase_live.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectSupabase() {
  console.log('--- Inspecting Live Supabase at', SUPABASE_URL, '---');

  const tables = ['projects', 'shift_reports', 'incidents', 'rework_logs', 'users', 'plants', 'suppliers', 'rates', 'assignments'];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`[TABLE: ${table}] Error: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`[TABLE: ${table}] Exists. Count: ${count}`);
      }
    } catch (err) {
      console.log(`[TABLE: ${table}] Exception:`, err.message);
    }
  }

  // Check RPCs
  console.log('\n--- Checking RPC availability ---');
  const rpcs = [
    'get_rep_mobile_bootstrap',
    'submit_rep_quality_record_atomic',
    'submit_rep_mobile_daily_report_atomic',
    'submit_rep_mobile_urgent_incident_atomic'
  ];

  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc, {});
      if (error) {
        console.log(`[RPC: ${rpc}] Response: ${error.message} (Code: ${error.code})`);
      } else {
        console.log(`[RPC: ${rpc}] Available! Result:`, data);
      }
    } catch (err) {
      console.log(`[RPC: ${rpc}] Exception:`, err.message);
    }
  }
}

inspectSupabase();
