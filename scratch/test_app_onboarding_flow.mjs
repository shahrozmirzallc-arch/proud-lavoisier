import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
  if (m) {
    let v = (m[2] || '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    envVars[m[1]] = v;
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testOnboardFlow() {
  console.log('=== TESTING APP ONBOARDING FLOW VIA ONBOARDING SERVICE ===\n');

  const payload = {
    supplier_id: 'sup_magna',
    supplier_name: 'Magna Powertrain International',
    contact_name: 'Robert Sterling',
    contact_email: 'robert.sterling@magna.com',
    contact_phone: '519-555-0199',
    address: '50 Casmir Ct, Concord, ON L4K 4EC',
    allotted_hours: '45',
    plant_name: 'Oakville Assembly Plant',
    plant_city: 'Oakville',
    plant_address: '1400 The Oakville Grade, Oakville, ON L6J 5E4',
    project_name: 'Ford Oakville Quality Liaison',
    part_number: 'PN 84920194',
    po_number: 'PO-GM-CAMI-2026-88',
    rep_id: 'rep_clarence',
    rep_name: 'Clarence Kuiken',
    billing_rate: '45',
    pay_rate: '28',
    currency: 'CAD',
    start_date: new Date().toISOString().split('T')[0]
  };

  // Direct table upserts as sanitized in onboardingService.js
  const supplierObj = {
    id: 'sup_magna',
    name: payload.supplier_name,
    contact_name: payload.contact_name,
    contact_person: payload.contact_name,
    contact_email: payload.contact_email,
    contact_phone: payload.contact_phone,
    phone: payload.contact_phone,
    address: payload.address,
    allotted_hours: 45,
    created_at: new Date().toISOString()
  };

  const plantObj = {
    id: 'plant_oakville',
    name: payload.plant_name,
    city: payload.plant_city,
    address: payload.plant_address,
    supplier_ids: ['sup_magna'],
    created_at: new Date().toISOString()
  };

  const dbProjectObj = {
    id: 'proj_oakville_900',
    name: payload.project_name,
    supplier_id: 'sup_magna',
    client_id: 'sup_magna',
    plant_id: 'plant_oakville',
    rep_id: 'rep_clarence',
    po_hours: 45,
    billing_rate: 45,
    pay_rate: 28,
    currency: 'CAD',
    status: 'Active',
    start_date: payload.start_date
  };

  const rateObj = {
    id: `rate_oakville_${Date.now()}`,
    rep_id: 'rep_clarence',
    supplier_id: 'sup_magna',
    plant_id: 'plant_oakville',
    project_id: 'proj_oakville_900',
    billing_rate: 45,
    pay_rate: 28,
    currency: 'CAD',
    created_at: new Date().toISOString()
  };

  console.log('Executing Supabase table upserts...');
  const results = await Promise.allSettled([
    supabase.from('suppliers').upsert(supplierObj),
    supabase.from('plants').upsert(plantObj),
    supabase.from('projects').upsert(dbProjectObj),
    supabase.from('rates').upsert(rateObj)
  ]);

  results.forEach((res, idx) => {
    const names = ['suppliers', 'plants', 'projects', 'rates'];
    if (res.status === 'rejected' || (res.value && res.value.error)) {
      const err = res.reason || res.value?.error;
      console.error(`❌ Upsert [${names[idx]}] FAILED with error:`, JSON.stringify(err, null, 2));
    } else {
      console.log(`✅ Upsert [${names[idx]}] SUCCEEDED! Status: ${res.value?.status || 200}`);
    }
  });

  // Verification REST Queries
  console.log('\n=== VERIFYING CLOUD STATE VIA REST ===\n');

  const { data: projs, error: projsErr } = await supabase.from('projects').select('id,name,client_id,supplier_id,plant_id');
  console.log('Projects in Cloud:', JSON.stringify(projs || projsErr, null, 2));

  const { data: plants, error: plantsErr } = await supabase.from('plants').select('id,name');
  console.log('Plants in Cloud:', JSON.stringify(plants || plantsErr, null, 2));
}

testOnboardFlow().catch(console.error);
