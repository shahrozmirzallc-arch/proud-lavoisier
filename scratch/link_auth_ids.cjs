const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
});

const url = envVars.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('====================================================');
  console.log('LINKING SUPABASE AUTH IDs TO USERS TABLE ROWS');
  console.log('====================================================\n');

  const links = [
    { username: 'donna', auth_id: '43eb1bdf-2091-4e1b-8b22-5ac5c36f355b' },
    { username: 'clarence', auth_id: '3ae5d4ff-a348-4ebf-85c3-be584dc82351' },
    { username: 'colleen', auth_id: '6c1da7e5-176b-4487-b5ec-ba248ba3149f' },
    { username: 'greg', auth_id: '2647acb9-019a-4f05-82b2-38822ba830da' },
    { username: 'shahroz', auth_id: '4d202c34-0cb4-4931-8466-5f7dced52e25' }
  ];

  for (const link of links) {
    const { data, error } = await adminClient
      .from('users')
      .update({ auth_id: link.auth_id })
      .eq('username', link.username)
      .select();

    if (error) {
      console.error(`Error linking ${link.username}:`, error.message);
    } else {
      console.log(`SUCCESS: Linked ${link.username} -> auth_id '${link.auth_id}' (${data.length} row(s) updated)`);
    }
  }

  console.log('\n====================================================');
  process.exit(0);
})();
