const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
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

if (!serviceKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY missing in .env');
  process.exit(1);
}

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('====================================================');
  console.log('IDS PULSE SERVICE ROLE SECURITY AUDIT (PHASE 0)');
  console.log('Target:', url);
  console.log('====================================================\n');

  // 1. List All Auth Users in auth.users
  console.log('--- 1. AUTH USERS AUDIT ---');
  const { data: usersData, error: usersErr } = await adminClient.auth.admin.listUsers();

  if (usersErr) {
    console.error('Failed to list auth users:', usersErr.message);
  } else {
    console.log(`Total Auth Users Found: ${usersData.users.length}\n`);
    usersData.users.forEach(u => {
      console.log(`User ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(`Email Confirmed: ${u.email_confirmed_at ? true : false}`);
      console.log(`Raw App Metadata:`, JSON.stringify(u.app_metadata));
      console.log(`User Metadata:`, JSON.stringify(u.user_metadata));
      console.log(`Last Sign In: ${u.last_sign_in_at || 'Never'}`);
      console.log('----------------------------------------------------');
    });
  }

  // 2. Check RPC Functions
  console.log('\n--- 2. RPC FUNCTIONS AUDIT ---');
  const rpcs = [
    'get_auth_email_by_username',
    'submit_rep_hours_atomic',
    'review_client_overtime_atomic',
    'purge_demo_data',
    'onboard_client_project'
  ];

  for (const rpc of rpcs) {
    const { data, error } = await adminClient.rpc(rpc, {});
    const missing = error && error.message.includes('Could not find the function');
    console.log(`RPC '${rpc}': Exists = ${!missing}`);
    if (error) console.log(`   Message: ${error.message}`);
    else console.log(`   Result:`, data);
  }

  // 3. Inspect Tables & Data Records
  console.log('\n--- 3. DATABASE TABLES DATA INSPECTION ---');
  const tables = [
    'incidents',
    'shift_reports',
    'work_sessions',
    'weekly_timesheets',
    'payroll',
    'time_entries',
    'expense_entries',
    'projects',
    'users',
    'suppliers',
    'overtime_decision_audit_log'
  ];

  for (const t of tables) {
    const { data, error, count } = await adminClient.from(t).select('*', { count: 'exact', head: false }).limit(2);
    if (error) {
      console.log(`Table '${t}': Error/Missing -> ${error.message}`);
    } else {
      console.log(`Table '${t}': Exists (Total Rows: ${count !== null ? count : data.length})`);
    }
  }

  process.exit(0);
})();
