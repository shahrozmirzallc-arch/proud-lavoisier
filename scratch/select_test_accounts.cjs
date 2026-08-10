const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
const envText = fs.readFileSync(envPath, 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) env[k.trim()] = v.trim();
});

const url = env.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function selectTestAccounts() {
  console.log('Querying production users table for the two test accounts...');
  
  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, email, role, customer_id, supplier_id, plant_id, created_at')
    .or('username.ilike.%sarah_mitchell%,username.ilike.%rachel_nakamura%,id.ilike.%sarah_mitchell%,id.ilike.%rachel_nakamura%,email.ilike.%sarah_mitchell%,email.ilike.%rachel_nakamura%');

  if (error) {
    console.error('Error selecting test accounts:', error);
    process.exit(1);
  }

  console.log('QUERY RESULT:');
  console.log(JSON.stringify(data, null, 2));
}

selectTestAccounts();
