const dns = require('dns');
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

async function lookupAndTry() {
  console.log('Resolving DNS for db.wuqqrcowznrmmuokfxlk.supabase.co...');
  dns.resolve6(`db.${PROJECT_REF}.supabase.co`, (err, addresses) => {
    console.log('IPv6 addresses:', addresses || err.message);
  });
  dns.resolve4(`db.${PROJECT_REF}.supabase.co`, (err, addresses) => {
    console.log('IPv4 addresses:', addresses || err.message);
  });

  const poolers = [
    'aws-0-ca-central-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-us-east-2.pooler.supabase.com',
    'aws-0-us-west-1.pooler.supabase.com',
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-eu-west-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com'
  ];

  for (const host of poolers) {
    console.log(`Checking ${host}...`);
    const client = new Client({
      host,
      port: 6543,
      user: `postgres.${PROJECT_REF}`,
      password: DB_PASSWORD,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });
    try {
      await client.connect();
      console.log(`FOUND POOLER: ${host}!`);
      
      const rpcSqlPath = path.join(process.cwd(), 'supabase/migrations/20260810_incident_release_rpc.sql');
      const rpcSql = fs.readFileSync(rpcSqlPath, 'utf8');
      await client.query(rpcSql);
      console.log('✅ 20260810_incident_release_rpc.sql executed successfully!');

      const res1 = await client.query(`SELECT proname, prosecdef FROM pg_proc WHERE proname = 'release_incident_to_client';`);
      console.log('PG_PROC RESULT:');
      console.table(res1.rows);

      try {
        await client.query(`SELECT public.release_incident_to_client('{}'::jsonb, 'ik_test_empty');`);
      } catch (e) {
        console.log('REFUSAL ERROR CAUGHT AS EXPECTED:');
        console.log(e.message);
      }

      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`  ${host}: ${e.message}`);
    }
  }
}

lookupAndTry();
