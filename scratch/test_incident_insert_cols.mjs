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

async function probeIncidentsColumns() {
  const testCols = [
    'assignment_id',
    'customer_id',
    'local_tracking_ref',
    'concern_classification'
  ];

  for (const col of testCols) {
    const obj = { id: `INC_PROBE_${col}_${Date.now()}`, [col]: 'test' };
    const { error } = await supabase.from('incidents').insert(obj);
    if (error && error.message.includes('does not exist')) {
      console.log(`❌ Column "${col}" DOES NOT EXIST on incidents table`);
    } else {
      console.log(`✅ Column "${col}" EXISTS on incidents table`);
    }
  }
}

probeIncidentsColumns().catch(console.error);
