// scratch/inspect_supplier_contacts_array.cjs
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectSupplierContacts() {
  const { data: suppliers } = await supabase.from('suppliers').select('*');
  (suppliers || []).forEach(s => {
    console.log(`\n=== Supplier: ${s.name} (${s.id}) ===`);
    console.log('Primary Contact:', s.contact_name, '<' + s.contact_email + '>');
    console.log('Contacts Array:', JSON.stringify(s.contacts, null, 2));
  });
}

inspectSupplierContacts();
