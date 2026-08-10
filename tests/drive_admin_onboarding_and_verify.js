import puppeteer from 'puppeteer';
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

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runAdminOnboardingAndVerify() {
  console.log('=== STEP 1: ONBOARDING CLIENT & PROJECT THROUGH ADMIN DASHBOARD APP UI ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();

  // Listen to browser console logs and errors
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Supabase') || text.includes('[Onboarding') || text.includes('Error') || text.includes('Warning')) {
      console.log('  [Browser Console]:', text);
    }
  });

  console.log('Navigating to Admin Dashboard...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Set Donna session in browser
  await page.evaluate(() => {
    localStorage.removeItem('ids_pulse_db');
    localStorage.removeItem('ids_pulse_db_version');
    const donnaUser = {
      id: 'usr_donna',
      name: 'Donna Cabral',
      role: 'admin',
      username: 'donna'
    };
    localStorage.setItem('ids_pulse_saved_user', JSON.stringify(donnaUser));
    sessionStorage.setItem('ids_pulse_role', 'admin');
    sessionStorage.setItem('ids_pulse_username', 'donna');
  });

  await page.reload({ waitUntil: 'networkidle0' });
  await delay(1500);

  console.log('Executing performAtomicClientOnboarding via app DOM/window scope...');
  const onboardingResult = await page.evaluate(async () => {
    // Find sup_magna in database
    const db = JSON.parse(localStorage.getItem('ids_pulse_db') || '{}');
    const suppliers = db.suppliers || [];
    const magnaSup = suppliers.find(s => s.id === 'sup_magna' || s.name.includes('Magna'));

    const payload = {
      supplier_id: magnaSup ? magnaSup.id : 'sup_magna',
      supplier_name: magnaSup ? magnaSup.name : 'Magna Powertrain International',
      contact_name: 'Robert Sterling',
      contact_email: 'robert.sterling@magna.com',
      contact_phone: '519-555-0199',
      address: '50 Casmir Ct, Concord, ON L4K 4ec',
      allotted_hours: '45',
      plant_id: 'plant_oakville',
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

    // Access performAtomicClientOnboarding from window or import
    if (window.performAtomicClientOnboarding) {
      return await window.performAtomicClientOnboarding(payload);
    }
    return payload;
  });

  console.log('Onboarding Payload Processed.');
  await delay(3000); // Allow background async sync to complete

  await browser.close();

  // === STEP 2: CHECK CLOUD SUPABASE REST API ===
  console.log('\n=== STEP 2: CHECKING CLOUD SUPABASE TABLES VIA REST ===\n');

  console.log('Executing: GET /rest/v1/projects?select=id,name,client_id,supplier_id,plant_id');
  const projRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id,name,client_id,supplier_id,plant_id`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  const projectsData = await projRes.json();
  console.log('PROJECTS CLOUD RESULT:');
  console.log(JSON.stringify(projectsData, null, 2));

  console.log('\nExecuting: GET /rest/v1/plants?select=id,name');
  const plantRes = await fetch(`${SUPABASE_URL}/rest/v1/plants?select=id,name`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  const plantsData = await plantRes.json();
  console.log('PLANTS CLOUD RESULT:');
  console.log(JSON.stringify(plantsData, null, 2));

  // Check offline queue if projects or plants failed to write
  if (!Array.isArray(projectsData) || projectsData.length === 0) {
    console.log('\n=== CHECKING OFFLINE QUEUE / ERRORS ===');
    const queueRes = await fetch(`${SUPABASE_URL}/rest/v1/system_logs?select=*&order=created_at.desc&limit=5`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    });
    console.log('SYSTEM LOGS:', await queueRes.json());
  }
}

runAdminOnboardingAndVerify().catch(console.error);
