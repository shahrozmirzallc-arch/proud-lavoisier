// scratch/simulate_future_user_flow.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function toCloudShape(type, entity) {
  const out = { ...entity };
  if (type === 'users') {
    if ('password' in out) {
      out.passcode = out.password;
      delete out.password;
    }
  }
  return out;
}

async function testFutureUserFlow() {
  console.log('=== SIMULATING FUTURE USER CREATION & MOBILE LOGIN ===');

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const newRep = {
    id: `usr_test_${Date.now()}`,
    name: `Alex Inspector ${randomSuffix}`,
    email: `alex.rep.${randomSuffix}@goto-ids.com`,
    username: `alex_${randomSuffix}`,
    password: `AlexPass${randomSuffix}!`,
    role: 'rep',
    title: 'IDS Field Rep',
    status: 'active',
    pay_currency: 'CAD',
    created_at: new Date().toISOString()
  };

  console.log('1. Admin creates new Rep on Web Dashboard:', newRep.name, 'Username:', newRep.username, 'Password:', newRep.password);
  
  const cloudPayload = toCloudShape('users', newRep);
  const { error: insertErr } = await supabase.from('users').insert(cloudPayload);
  if (insertErr) {
    console.error('Insert error:', insertErr.message);
    return;
  }
  console.log('-> User successfully saved to Database!');

  // 2. Simulate Mobile App Login using exact Flutter logic
  console.log('\n2. Mobile App: Rep logs in with Username:', newRep.username, 'and Password:', newRep.password);
  
  const inputClean = newRep.username.trim().toLowerCase();
  const { data: userRows, error: searchErr } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.${inputClean},email.ilike.${inputClean},id.ilike.${inputClean}`);

  if (searchErr || !userRows || userRows.length === 0) {
    console.error('Mobile lookup failed:', searchErr ? searchErr.message : 'User not found');
    return;
  }

  const user = userRows[0];
  const dbPassword = user.passcode || user.password;
  const role = (user.role || '').toLowerCase().trim();

  if (dbPassword === newRep.password && ['rep', 'qre', 'quality_rep', 'field_rep'].includes(role)) {
    console.log('-> [MOBILE LOGIN SUCCESSFUL!]');
    console.log(`   Session User ID: ${user.id}`);
    console.log(`   Display Name: ${user.name}`);
    console.log(`   Role: ${user.role} (Authorized Rep)`);
    console.log('   Workspace opened successfully without any issues!');
  } else {
    console.error('-> Mobile Login Failed validation.');
  }

  // 3. Simulate Mobile App Login using Email instead of Username
  console.log('\n3. Mobile App: Rep logs in with Email:', newRep.email, 'and Password:', newRep.password);
  const emailClean = newRep.email.trim().toLowerCase();
  const { data: userEmailRows } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.${emailClean},email.ilike.${emailClean},id.ilike.${emailClean}`);

  const user2 = userEmailRows[0];
  const dbPassword2 = user2.passcode || user2.password;
  if (dbPassword2 === newRep.password) {
    console.log('-> [EMAIL LOGIN SUCCESSFUL TOO!]');
  }

  // Clean up test user
  await supabase.from('users').delete().eq('id', newRep.id);
  console.log('\n4. Cleaned up simulation test user.');
}

testFutureUserFlow();
