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

async function executeClarenceE2E() {
  console.log('=== STEP 1: CLARENCE INCIDENT CREATION & RELEASE VIA REP APP ===\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 400, height: 850 }
  });

  const page = await browser.newPage();

  let toastMessage = null;
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Incident') || text.includes('[Supabase') || text.includes('Error')) {
      console.log('  [Rep App Console]:', text);
    }
  });

  console.log('Navigating to Rep App as Clarence...');
  await page.goto('https://proud-lavoisier.vercel.app/', { waitUntil: 'networkidle0' });

  // Sign in as Clarence Kuiken
  await page.evaluate(() => {
    localStorage.removeItem('ids_pulse_db');
    localStorage.removeItem('ids_pulse_db_version');
    const clarenceUser = {
      id: 'rep_clarence',
      name: 'Clarence Kuiken',
      role: 'rep',
      username: 'clarence'
    };
    localStorage.setItem('ids_pulse_saved_user', JSON.stringify(clarenceUser));
    sessionStorage.setItem('ids_pulse_role', 'rep');
    sessionStorage.setItem('ids_pulse_username', 'clarence');
  });

  await page.reload({ waitUntil: 'networkidle0' });
  await delay(2000);

  console.log('Filling Incident Form (Step 1 -> Step 2 -> Step 3)...');
  await page.evaluate(async () => {
    window.localStorage.setItem('ids_pulse_selected_project_id', 'proj_oakville_900');
    
    if (window.__setMediaUnavailable) {
      window.__setMediaUnavailable('No Camera Available');
    }

    if (window.__setPartNumber) {
      window.__setPartNumber('PN 84920194');
    }

    if (window.__setIncidentField) {
      window.__setIncidentField('area', 'Body Shop / Trim Line');
      window.__setIncidentField('defect_type', 'Dimensional Out of Spec');
      window.__setIncidentField('description', 'Bracket alignment exceeds +2.5mm tolerance on rear quarter panel.');
      window.__setIncidentField('action_taken', 'Quarantined 14 tote bins. Tagged suspect parts for containment.');
      window.__setIncidentField('concern_classification', 'PRR');
    }
  });

  await delay(1000);

  console.log('Advancing to Step 4 (Review & Send)...');
  await page.evaluate(() => {
    if (window.__setIncStep) window.__setIncStep(4);
  });
  await delay(1500);

  console.log('Clicking "Release to Client Dashboard" button in DOM...');
  const releaseClicked = await page.evaluate(async () => {
    const btns = Array.from(document.querySelectorAll('button'));
    const relBtn = btns.find(b => b.textContent.includes('Release to Client Dashboard'));
    if (relBtn) {
      relBtn.click();
      return true;
    }
    return false;
  });

  console.log('Release Button Clicked:', releaseClicked);
  await delay(4000); // Allow RPC network request & UI state update

  await browser.close();

  // === STEP 3: CHECK CLOUD INCIDENTS ROW VIA REST ===
  console.log('\n=== STEP 3: QUERYING SUPABASE REST FOR RELEASED INCIDENT ROW ===\n');
  console.log('Executing: GET /rest/v1/incidents?select=id,rep_id,supplier_id,client_id,released_to_client,returned_to_supplier,sort_requested,rma_required');

  const incRes = await fetch(`${SUPABASE_URL}/rest/v1/incidents?select=id,rep_id,supplier_id,client_id,released_to_client,returned_to_supplier,sort_requested,rma_required`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
  });
  const incidentsInCloud = await incRes.json();
  console.log('INCIDENTS IN CLOUD DATABASE:');
  console.log(JSON.stringify(incidentsInCloud, null, 2));

  // === STEP 4: MAGNA CLIENT PORTAL VISIBILITY AUDIT ===
  console.log('\n=== STEP 4: AUDITING MAGNA CLIENT PORTAL VISIBILITY ===\n');
  const browserClient = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1400, height: 900 }
  });

  const pageMagna = await browserClient.newPage();
  await pageMagna.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Log in as Robert Sterling (Magna Client Quality Manager)
  await pageMagna.evaluate(() => {
    localStorage.removeItem('ids_pulse_db');
    localStorage.removeItem('ids_pulse_db_version');
    const robertUser = {
      id: 'usr_robert_sterling',
      name: 'Robert Sterling',
      role: 'customer',
      supplier_id: 'sup_magna',
      customer_id: 'sup_magna',
      username: 'robert_sterling'
    };
    localStorage.setItem('ids_pulse_saved_user', JSON.stringify(robertUser));
    sessionStorage.setItem('ids_pulse_role', 'customer');
    sessionStorage.setItem('ids_pulse_username', 'robert_sterling');
    sessionStorage.setItem('ids_pulse_customer_id', 'sup_magna');
  });

  await pageMagna.reload({ waitUntil: 'networkidle0' });
  await delay(2000);

  const magnaVisibleIncidents = await pageMagna.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('ids_pulse_db') || '{}');
    const incs = (db.incidents || []).filter(i => i.supplier_id === 'sup_magna' || i.client_id === 'sup_magna');
    return { clientIncidentsCount: incs.length, clientIncidents: incs };
  });

  console.log('MAGNA CLIENT PORTAL AUDIT RESULT:');
  console.log(JSON.stringify(magnaVisibleIncidents, null, 2));

  // === STEP 5: STELLANTIS / GM CROSS-CLIENT ISOLATION AUDIT ===
  console.log('\n=== STEP 5: AUDITING STELLANTIS CROSS-CLIENT ISOLATION ===\n');
  const pageStellantis = await browserClient.newPage();
  await pageStellantis.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Log in as Mark Vance (Stellantis Client)
  await pageStellantis.evaluate(() => {
    localStorage.removeItem('ids_pulse_db');
    localStorage.removeItem('ids_pulse_db_version');
    const markUser = {
      id: 'usr_mark_vance',
      name: 'Mark Vance',
      role: 'customer',
      supplier_id: 'sup_stellantis',
      customer_id: 'sup_stellantis',
      username: 'mark_vance'
    };
    localStorage.setItem('ids_pulse_saved_user', JSON.stringify(markUser));
    sessionStorage.setItem('ids_pulse_role', 'customer');
    sessionStorage.setItem('ids_pulse_username', 'mark_vance');
    sessionStorage.setItem('ids_pulse_customer_id', 'sup_stellantis');
  });

  await pageStellantis.reload({ waitUntil: 'networkidle0' });
  await delay(2000);

  const stellantisVisibleIncidents = await pageStellantis.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('ids_pulse_db') || '{}');
    const incs = (db.incidents || []).filter(i => i.supplier_id === 'sup_stellantis' || i.client_id === 'sup_stellantis');
    return { clientIncidentsCount: incs.length, clientIncidents: incs };
  });

  console.log('STELLANTIS CLIENT PORTAL AUDIT RESULT (EXPECTED 0 MAGNA INCIDENTS):');
  console.log(JSON.stringify(stellantisVisibleIncidents, null, 2));

  await browserClient.close();
}

executeClarenceE2E().catch(console.error);
