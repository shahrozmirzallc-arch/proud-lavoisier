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

async function testClarenceRelease() {
  console.log('=== STEP 1: CLARENCE INCIDENT RELEASE TEST AGAINST PROJ_OAKVILLE_900 ===\n');

  const incidentId = `INC-OAK-${Date.now()}`;
  const idempotencyKey = `ik_clarence_${Date.now()}`;

  const payload = {
    id: incidentId,
    assignment_id: 'proj_oakville_900',
    project_id: 'proj_oakville_900',
    client_id: 'sup_magna',
    supplier_id: 'sup_magna',
    plant_id: 'plant_oakville',
    rep_id: 'rep_clarence',
    rep_name: 'Clarence Kuiken',
    defect_type: 'Dimensional Out of Spec',
    area: 'Body Shop / Trim Line',
    description: 'Bracket alignment exceeds +2.5mm tolerance on rear quarter panel.',
    action_taken: 'Quarantined 14 tote bins. Tagged suspect parts for containment.',
    returned_to_supplier: 'Yes',
    sort_requested: 'No',
    rma_required: 'Unknown',
    level_of_concern: 'PRR',
    concern_classification: 'PRR',
    media_evidence_status: 'unavailable',
    media_unavailable_reason: 'No Camera Available'
  };

  console.log(`Releasing incident ${incidentId} as Clarence Kuiken...`);
  const { data, error } = await supabase.rpc('release_incident_to_client', {
    p_payload: payload,
    p_idempotency_key: idempotencyKey
  });

  if (error) {
    console.error('❌ CLARENCE RELEASE FAILED WITH ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ CLARENCE RELEASE SUCCEEDED!');
    console.log('SERVER RESPONSE DATA:');
    console.log(JSON.stringify(data, null, 2));
  }

  // === STEP 3: CONFIRM INCIDENT ROW IN SUPABASE VIA REST ===
  console.log('\n=== STEP 3: CONFIRMING INCIDENT ROW IN SUPABASE VIA REST ===\n');
  console.log('Executing: GET /rest/v1/incidents?select=id,rep_id,supplier_id,client_id,released_to_client,returned_to_supplier');
  const { data: incs, error: incsErr } = await supabase
    .from('incidents')
    .select('id,rep_id,supplier_id,client_id,released_to_client,returned_to_supplier');
  
  if (incsErr) {
    console.error('INCIDENTS QUERY ERROR:', incsErr);
  } else {
    console.log('INCIDENTS IN CLOUD DATABASE:');
    console.log(JSON.stringify(incs, null, 2));
  }
}

testClarenceRelease().catch(console.error);
