// scratch/check_reports_schema.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  console.log('--- Checking tables schema ---');
  const { data: sr, error: srErr } = await supabase.from('shift_reports').select('*').limit(1);
  console.log('shift_reports:', srErr ? srErr.message : 'OK, sample keys: ' + Object.keys(sr[0] || {}));

  const { data: inc, error: incErr } = await supabase.from('incidents').select('*').limit(1);
  console.log('incidents:', incErr ? incErr.message : 'OK, sample keys: ' + Object.keys(inc[0] || {}));

  const { data: rw, error: rwErr } = await supabase.from('rework_logs').select('*').limit(1);
  console.log('rework_logs:', rwErr ? rwErr.message : 'OK, sample keys: ' + Object.keys(rw[0] || {}));

  const { data: ts, error: tsErr } = await supabase.from('timesheets').select('*').limit(1);
  console.log('timesheets:', tsErr ? tsErr.message : 'OK, sample keys: ' + Object.keys(ts[0] || {}));
}

checkSchema();
