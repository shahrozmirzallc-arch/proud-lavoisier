const fs = require('fs');
const path = require('path');
const { Client } = require(require.resolve('pg', { paths: [process.cwd()] }));
const { createClient } = require('@supabase/supabase-js');

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

const DB_PASSWORD = envVars.SUPABASE_DB_PASSWORD;
const PROJECT_REF = 'wuqqrcowznrmmuokfxlk';

async function executeAndVerifyRpc() {
  console.log('=== EXECUTING AND VERIFYING INCIDENT RELEASE RPC ===\n');

  console.log(`Connecting directly to db.${PROJECT_REF}.supabase.co:5432...`);
  let client;
  try {
    client = new Client({
      connectionString: `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 12000
    });
    await client.connect();
  } catch (err) {
    console.log('Direct connect failed:', err.message, '- Trying pooler...');
    client = new Client({
      connectionString: `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-ca-central-1.pooler.supabase.com:5432/postgres`,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 12000
    });
    await client.connect();
  }

  console.log('Connected to Supabase Postgres.');

  // Read SQL migration file
  const rpcSqlPath = path.join(process.cwd(), 'supabase/migrations/20260810_incident_release_rpc.sql');
  const rpcSql = fs.readFileSync(rpcSqlPath, 'utf8');

  console.log('Executing 20260810_incident_release_rpc.sql...');
  await client.query(rpcSql);
  console.log('RPC Function created/updated successfully in database!\n');

  // Verification 1: SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';
  console.log('Verification 1: Checking pg_proc for release_incident_to_client...');
  const procRes = await client.query(`SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';`);
  console.log('PG_PROC RESULT:');
  console.table(procRes.rows);

  // Verification 2: Calling with empty payload to verify exception refusal
  console.log('\nVerification 2: Testing refusal when called with empty payload...');
  try {
    await client.query(`SELECT public.release_incident_to_client('{}'::jsonb, 'ik_test_empty');`);
    console.error('ERROR: Function failed to refuse empty payload!');
  } catch (err) {
    console.log('REFUSAL ERROR CAUGHT AS EXPECTED:');
    console.log('Error message:', err.message);
  }

  await client.end();

  // Verification 3: Test Real Incident Release as Clarence via Supabase JS Client RPC call
  console.log('\nVerification 3: Testing real incident release as Clarence through Supabase client...');
  const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
  const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const realPayload = {
    id: `INC-TEST-${Date.now()}`,
    rep_id: 'rep_clarence',
    rep_name: 'Clarence Kuiken',
    assignment_id: 'proj_oakville_900', // Valid Oakville project assignment
    defect_type: 'Dimensional Out of Spec',
    area: 'Body Shop',
    description: 'Phase 3 RPC verification incident report.',
    action_taken: 'Contained suspect parts and tagged bin.',
    returned_to_supplier: 'Yes',
    sort_requested: 'No',
    rma_required: 'Unknown',
    level_of_concern: 'PRR',
    media_evidence_status: 'unavailable',
    media_unavailable_reason: 'No Camera Available'
  };

  const idempotencyKey = `ik_test_clarence_${Date.now()}`;

  console.log('Dispatching rpc("release_incident_to_client", payload, idempotencyKey)...');
  const { data: rpcResponse, error: rpcError } = await supabase.rpc('release_incident_to_client', {
    p_payload: realPayload,
    p_idempotency_key: idempotencyKey
  });

  if (rpcError) {
    console.error('RPC Execution Error:', rpcError);
  } else {
    console.log('RPC RELEASE RESPONSE RETURNED:');
    console.log(JSON.stringify(rpcResponse, null, 2));
  }

  console.log('\n=== EXECUTION & VERIFICATION COMPLETE ===');
}

executeAndVerifyRpc().catch(console.error);
