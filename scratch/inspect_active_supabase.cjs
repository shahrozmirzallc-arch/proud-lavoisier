const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectAll() {
  const { data: users } = await supabase.from('users').select('*');
  console.log('=== USERS IN SUPABASE ===');
  console.log(JSON.stringify(users?.map(u => ({ id: u.id, name: u.name, username: u.username, email: u.email, role: u.role, plant_id: u.plant_id })), null, 2));

  const { data: projects } = await supabase.from('projects').select('*');
  console.log('\n=== PROJECTS IN SUPABASE ===');
  console.log(JSON.stringify(projects?.map(p => ({
    id: p.id,
    name: p.name,
    rep_id: p.rep_id,
    assigned_rep_id: p.assigned_rep_id,
    assigned_rep: p.assigned_rep,
    rep_name: p.rep_name,
    assigned_rep_name: p.assigned_rep_name,
    rep_ids: p.rep_ids,
    assigned_reps: p.assigned_reps,
    status: p.status,
    plant_id: p.plant_id,
    supplier_id: p.supplier_id
  })), null, 2));
}

inspectAll();
