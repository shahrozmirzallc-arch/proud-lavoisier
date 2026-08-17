// scratch/inspect_client_contacts_db.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectContacts() {
  console.log('--- Inspecting Plants ---');
  const { data: plants } = await supabase.from('plants').select('*');
  console.log('Plants:', (plants || []).map(p => ({ id: p.id, name: p.name, city: p.city })));

  console.log('\n--- Inspecting Suppliers ---');
  const { data: suppliers } = await supabase.from('suppliers').select('*');
  console.log('Suppliers:', (suppliers || []).map(s => ({
    id: s.id,
    name: s.name,
    contact_name: s.contact_name,
    contact_email: s.contact_email,
    contacts: s.contacts
  })));

  console.log('\n--- Inspecting Users (role: customer/client) ---');
  const { data: users } = await supabase.from('users').select('*').in('role', ['customer', 'client']);
  console.log('Customer/Client Users:', (users || []).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    supplier_id: u.supplier_id,
    customer_id: u.customer_id,
    title: u.title
  })));

  console.log('\n--- Inspecting Contacts table ---');
  const { data: contacts, error } = await supabase.from('contacts').select('*');
  console.log('Contacts table:', error ? error.message : (contacts || []).length);
  if (contacts && contacts.length > 0) {
    console.log(contacts);
  }
}

inspectContacts();
