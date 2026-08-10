const { Client } = require(require.resolve('pg', { paths: [process.cwd()] }));
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

const PROJECT_REF = 'wuqqrcowznrmmuokfxlk';
const DB_PASSWORD = envVars.SUPABASE_DB_PASSWORD;

async function executeWithDelay() {
  console.log('=== WAITING 35 SECONDS FOR POOLER CIRCUIT BREAKER RESET ===');
  for (let i = 35; i > 0; i -= 5) {
    console.log(`Waiting... ${i}s remaining`);
    await new Promise(r => setTimeout(r, 5000));
  }

  console.log(`\nConnecting to aws-0-ca-central-1.pooler.supabase.com:6543 as postgres.${PROJECT_REF}...`);
  const client = new Client({
    host: 'aws-0-ca-central-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  await client.connect();
  console.log('🎉 CONNECTED TO SUPABASE POSTGRES!');

  const rpcSqlPath = path.join(process.cwd(), 'supabase/migrations/20260810_incident_release_rpc.sql');
  const rpcSql = fs.readFileSync(rpcSqlPath, 'utf8');

  console.log('Executing 20260810_incident_release_rpc.sql...');
  await client.query(rpcSql);
  console.log('✅ RPC Function public.release_incident_to_client created successfully!\n');

  // Verification 1: SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';
  console.log('=== VERIFICATION 1: PG_PROC CHECK ===');
  const procRes = await client.query(`SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';`);
  console.log('PG_PROC RESULT:');
  console.table(procRes.rows);

  // Verification 2: Calling with empty payload to verify exception refusal
  console.log('\n=== VERIFICATION 2: REFUSAL TEST ON EMPTY PAYLOAD ===');
  try {
    await client.query(`SELECT public.release_incident_to_client('{}'::jsonb, 'ik_test_empty');`);
    console.error('ERROR: Empty payload did NOT throw exception!');
  } catch (err) {
    console.log('REFUSAL ERROR CAUGHT AS EXPECTED:');
    console.log('Exact error message:', err.message);
  }

  await client.end();

  // Verification 3: Test Real Incident Release as Clarence via Supabase JS Client RPC call
  console.log('\n=== VERIFICATION 3: REAL INCIDENT RELEASE VIA SUPABASE JS CLIENT ===');
  const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
  const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const realPayload = {
    id: `INC-TEST-${Date.now()}`,
    rep_id: 'rep_clarence',
    rep_name: 'Clarence Kuiken',
    assignment_id: 'proj_oakville_900',
    defect_type: 'Dimensional Out of Spec',
    area: 'Body Shop',
    description: 'Phase 3 RPC verification incident report executed as Clarence.',
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

executeWithDelay().catch(console.error);
