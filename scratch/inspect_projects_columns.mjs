import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
  if (m) {
    let v = (m[2] || '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    envVars[m[1]] = v;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function inspectCols() {
  console.log('Testing minimal valid project object on projects table...');
  const testObj = {
    id: 'proj_oakville_900',
    name: 'Ford Oakville Quality Liaison',
    supplier_id: 'sup_magna',
    client_id: 'sup_magna',
    plant_id: 'plant_oakville',
    rep_id: 'rep_clarence',
    po_hours: 45,
    billing_rate: 45,
    pay_rate: 28,
    currency: 'CAD',
    status: 'Active',
    start_date: new Date().toISOString().split('T')[0]
  };

  const { data, error } = await supabase.from('projects').upsert(testObj).select();
  if (error) {
    console.error('Projects upsert error:', error);
  } else {
    console.log('🎉 PROJECTS UPSERT SUCCEEDED!');
    console.log(JSON.stringify(data, null, 2));
  }
}

inspectCols().catch(console.error);
