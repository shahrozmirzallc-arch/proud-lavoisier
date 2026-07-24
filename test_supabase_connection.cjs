const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const supabaseAnonKey = 'sb_publishable_S7Qpf1lJ6OCYbYrE-_5iLQ_lN9iEdNe';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

(async () => {
  console.log('Testing connection to Supabase project:', supabaseUrl);
  try {
    const { data, error } = await supabase.from('users').select('*').limit(5);
    if (error) {
      console.log('Supabase Query Response (Error or RLS):', error.message);
    } else {
      console.log('Supabase Users Count:', data ? data.length : 0);
      console.log('Users Data:', data);
    }
  } catch (err) {
    console.error('Exception during Supabase test:', err.message || err);
  }
})();
