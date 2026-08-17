// scratch/register_msamit_auth.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function registerAndTest() {
  const email = 'msa.mit@hotmail.com';
  const password = 'Shahroz123';

  console.log(`Registering ${email} in Supabase Auth...`);
  const { data: signUpData, error: sErr } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        role: 'rep',
        name: 'Shahroz US $',
        username: 'msamit'
      }
    }
  });

  if (sErr) {
    console.log('SignUp error:', sErr.message);
  } else {
    console.log('SignUp SUCCESS! Auth User ID:', signUpData.user?.id);
    if (signUpData.session) {
      console.log('Session created immediately! Access token present.');
    } else {
      console.log('User created (email confirmation may be pending or enabled).');
    }
  }

  // Update public.users table with auth_id if created
  if (signUpData.user?.id) {
    await supabase.from('users').update({ auth_id: signUpData.user.id, passcode: password }).eq('email', email);
    console.log('Updated public.users with auth_id:', signUpData.user.id);
  }

  // Test sign in
  console.log('\nTesting signInWithPassword...');
  const { data: loginData, error: lErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (lErr) {
    console.log('Login result:', lErr.message, 'Status:', lErr.status);
  } else {
    console.log('LOGIN SUCCESSFUL! User:', loginData.user.id, 'Role:', loginData.user.user_metadata?.role);
  }
}

registerAndTest();
