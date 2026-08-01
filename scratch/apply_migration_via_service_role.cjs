const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    envVars[match[1]] = value.trim();
  }
});

const url = envVars.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('Attempting automated database migration execution...');

  // Read Phase 1 Migration SQL
  const sqlPath = path.join(__dirname, '../supabase/migrations/20260801_phase1_security_remediation.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Test executing SQL via Supabase Management REST API endpoint if accessible with service key
  const response = await fetch(`${url}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    }
  });

  console.log('Rest API root status:', response.status);
})();
