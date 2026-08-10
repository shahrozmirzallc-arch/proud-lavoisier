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

async function testFullInsert() {
  const incObj = {
    id: `INC-FULL-TEST-${Date.now()}`,
    project_id: 'proj_oakville_900',
    client_id: 'sup_magna',
    customer_id: 'sup_magna',
    supplier_id: 'sup_magna',
    plant_id: 'plant_oakville',
    rep_id: 'rep_clarence',
    rep_name: 'Clarence Kuiken',
    media_evidence_status: 'not_provided',
    photos: [],
    videos: [],
    traceability_status: 'not_provided',
    parts_list: [],
    tote_bin_labels: [],
    defect_type: 'Dimensional Out of Spec',
    area: 'Body Shop',
    description: 'Test description',
    action_taken: 'Test action',
    supplier_contact_ids: [],
    supplier_contacts_snapshot: [],
    returned_to_supplier: 'Yes',
    sort_requested: 'No',
    rma_required: 'Unknown',
    concern_classification: 'PRR',
    release_status: 'released',
    released_to_client: true,
    released_at: new Date().toISOString(),
    released_by: 'rep_clarence',
    idempotency_key: `ik_test_${Date.now()}`,
    status: 'Released',
    created_at: new Date().toISOString()
  };

  console.log('Testing full incident insert matching schema...');
  const { data, error } = await supabase.from('incidents').insert(incObj).select();
  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('🎉 FULL INCIDENT INSERT SUCCEEDED!');
    console.log(JSON.stringify(data, null, 2));
  }
}

testFullInsert().catch(console.error);
