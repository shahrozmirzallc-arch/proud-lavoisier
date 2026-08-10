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

async function deleteTestAccounts() {
  console.log('Deleting sarah_mitchell_1786362304425 and rachel_nakamura from production users table...');
  
  const { data, error } = await supabase
    .from('users')
    .delete()
    .in('username', ['sarah_mitchell_1786362304425', 'rachel_nakamura'])
    .select('id, username, name');

  if (error) {
    console.error('Error deleting test accounts:', error);
    process.exit(1);
  }

  console.log('DELETED RECORDS:');
  console.log(JSON.stringify(data, null, 2));
}

deleteTestAccounts();
