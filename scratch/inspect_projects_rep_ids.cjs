// scratch/inspect_projects_rep_ids.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectProjects() {
  const { data: projects, error } = await supabase.from('projects').select('*');
  console.log('Projects count:', projects?.length);
  if (projects) {
    projects.forEach(p => {
      console.log('--- Project:', p.id, '---');
      console.log('  name:', p.name);
      console.log('  rep_id:', p.rep_id);
      console.log('  rep_name:', p.rep_name);
      console.log('  rep:', p.rep);
      console.log('  assigned_reps:', p.assigned_reps);
    });
  }
}

inspectProjects();
