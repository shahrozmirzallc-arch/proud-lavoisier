// scratch/check_user_msamit.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUser() {
  console.log('--- Checking User "msamit" in public.users ---');
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .or('username.ilike.%msamit%,email.ilike.%msa.mit%,name.ilike.%Shahroz US%');

  if (error) {
    console.error('Error fetching user:', error.message);
  } else {
    console.log('Found users in public.users:', users);
  }

  // Check login with msa.mit@hotmail.com
  console.log('\n--- Testing Supabase Auth signIn with msa.mit@hotmail.com and Shahroz123 ---');
  const { data: authData, error: aErr } = await supabase.auth.signInWithPassword({
    email: 'msa.mit@hotmail.com',
    password: 'Shahroz123'
  });

  if (aErr) {
    console.log('Auth signIn failed:', aErr.message, 'Status:', aErr.status);
  } else {
    console.log('Auth signIn SUCCESS! User ID:', authData.user?.id);
    console.log('App Metadata:', authData.user?.app_metadata);
    console.log('User Metadata:', authData.user?.user_metadata);
  }
}

checkUser();
