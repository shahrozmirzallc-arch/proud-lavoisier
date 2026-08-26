const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rnzyyuxkgnzcvxewbmop.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuenl5dXhrZ256Y3Z4ZXdibW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMDExNjAsImV4cCI6MjA1Njg3NzE2MH0.U4T_w8zM-e4Cfq26kM0ZfM_U5r69iXwZ0vPZ5F-G_uA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectProjects() {
  const { data: users, error: uErr } = await supabase.from('users').select('*');
  console.log('--- USERS IN DB ---');
  console.log(users?.map(u => ({ id: u.id, name: u.name, username: u.username, email: u.email, role: u.role })));

  const { data: projects, error: pErr } = await supabase.from('projects').select('*');
  console.log('\n--- PROJECTS IN DB ---');
  console.log(projects?.map(p => ({
    id: p.id,
    name: p.name,
    rep_id: p.rep_id,
    assigned_rep_id: p.assigned_rep_id,
    assigned_rep: p.assigned_rep,
    rep_name: p.rep_name,
    assigned_rep_name: p.assigned_rep_name,
    rep_ids: p.rep_ids,
    assigned_reps: p.assigned_reps
  })));
}

inspectProjects();
