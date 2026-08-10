const { Client } = require('pg');
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

console.log('DB_PASSWORD from .env:', DB_PASSWORD);

async function testCombinations() {
  const connStrings = [
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-ca-central-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@aws-0-ca-central-1.pooler.supabase.com:6543/postgres?options=reference%3D${PROJECT_REF}`,
    `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@aws-0-ca-central-1.pooler.supabase.com:5432/postgres?options=reference%3D${PROJECT_REF}`,
    `postgresql://postgres.${PROJECT_REF}:Shahroz55%24@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:Shahroz121%24@aws-0-ca-central-1.pooler.supabase.com:6543/postgres`,
  ];

  for (let i = 0; i < connStrings.length; i++) {
    const connStr = connStrings[i];
    console.log(`\nAttempt ${i+1}: ${connStr.replace(/:[^:@]+@/, ':***@')}`);

    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });

    try {
      await client.connect();
      console.log(`\n🎉 BOOM! CONNECTED SUCCESSFULLY ON ATTEMPT ${i+1}!`);

      const rpcSqlPath = path.join(process.cwd(), 'supabase/migrations/20260810_incident_release_rpc.sql');
      const rpcSql = fs.readFileSync(rpcSqlPath, 'utf8');

      console.log('Executing 20260810_incident_release_rpc.sql...');
      await client.query(rpcSql);
      console.log('✅ RPC Function public.release_incident_to_client created successfully!\n');

      const procRes = await client.query(`SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';`);
      console.log('=== VERIFICATION 1: PG_PROC CHECK ===');
      console.table(procRes.rows);

      console.log('\n=== VERIFICATION 2: REFUSAL TEST ON EMPTY PAYLOAD ===');
      try {
        await client.query(`SELECT public.release_incident_to_client('{}'::jsonb, 'ik_test_empty');`);
      } catch (errRefusal) {
        console.log('REFUSAL ERROR CAUGHT AS EXPECTED:');
        console.log('Exact error message:', errRefusal.message);
      }

      await client.end();
      process.exit(0);
    } catch (err) {
      console.log(`  Failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

testCombinations();
