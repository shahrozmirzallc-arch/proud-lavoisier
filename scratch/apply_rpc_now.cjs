const { Client } = require(require.resolve('pg', { paths: [process.cwd()] }));
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

const passwords = [envVars.SUPABASE_DB_PASSWORD, 'Shahroz55', 'Shahroz121$', 'Shahroz55$'];
const PROJECT_REF = 'wuqqrcowznrmmuokfxlk';

async function testAll() {
  const hosts = [
    'aws-0-ca-central-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-us-west-2.pooler.supabase.com'
  ];

  for (const host of hosts) {
    for (const port of [6543, 5432]) {
      for (const pw of passwords) {
        if (!pw) continue;
        console.log(`Trying ${host}:${port} as postgres.${PROJECT_REF}...`);
        const client = new Client({
          host,
          port,
          user: `postgres.${PROJECT_REF}`,
          password: pw,
          database: 'postgres',
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 3000
        });
        try {
          await client.connect();
          console.log(`\n🎉 CONNECTED SUCCESSFULLY to ${host}:${port}!`);

          const rpcSqlPath = path.join(process.cwd(), 'supabase/migrations/20260810_incident_release_rpc.sql');
          const rpcSql = fs.readFileSync(rpcSqlPath, 'utf8');
          
          await client.query(rpcSql);
          console.log('✅ Applied 20260810_incident_release_rpc.sql migration!');

          // 1. SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';
          const res1 = await client.query(`SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';`);
          console.log('\n=== VERIFICATION 1: PG_PROC RESULT ===');
          console.table(res1.rows);

          // 2. Call with empty payload to verify exception refusal
          console.log('\n=== VERIFICATION 2: REFUSAL TEST ON EMPTY PAYLOAD ===');
          try {
            await client.query(`SELECT public.release_incident_to_client('{}'::jsonb, 'ik_test_empty');`);
            console.error('ERROR: Empty payload did NOT throw exception!');
          } catch (e) {
            console.log('REFUSAL ERROR CAUGHT AS EXPECTED:');
            console.log('Message:', e.message);
          }

          await client.end();
          return;
        } catch (e) {
          console.log(`  Failed (${host}:${port}, pw len ${pw.length}): ${e.message}`);
        }
      }
    }
  }
}

testAll().catch(console.error);
