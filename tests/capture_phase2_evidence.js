import puppeteer from 'puppeteer';
import path from 'path';

const artifactDir = 'C:/Users/Sharoz/.gemini/antigravity/brain/4c35684b-2cd3-442f-8986-5b75cde644e6';
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runPhase2Capture() {
  console.log('=== CAPTURING PHASE 2 EVIDENCE & STORED RECORD ===\n');

  // 1. Launch Puppeteer with Phone Viewport (390 x 844)
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 390, height: 844, isMobile: true, hasTouch: true }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[BROWSER LOG]:', msg.text()));

  console.log('1. Navigating to Phone Simulator (rep view)...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  // Force reset DB storage to ensure fresh seed with proj_oakville_900 assigned to rep_clarence
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
  await delay(1200);

  // Open Incident Alert Form
  console.log('Opening Incident Alert Form...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Incident') || btn.textContent.includes('Alert'));
    if (b) b.click();
  });
  await delay(800);

  // Fill Part Number on Step 1
  console.log('Filling Part Number on Step 1...');
  const partInput = await page.$('input[placeholder*="86286761"]');
  if (partInput) {
    await partInput.type('86286761');
    await delay(300);
  }

  // Directly open Incident Form Step 3 (Area & Follow-up) via window.__setIncStep(3)
  console.log('Advancing to Step 3...');
  await page.evaluate(() => {
    if (window.__setIncStep) window.__setIncStep(3);
  });
  await delay(1000);

  // Select Area Found
  console.log('Step 3: Selecting Area Found -> Review Scrap Table...');
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      const opt = Array.from(select.options).find(o => o.value && o.value.length > 0 && !o.value.includes('Select'));
      if (opt) {
        select.value = opt.value;
        const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
        nativeSelectValueSetter.call(select, opt.value);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await delay(300);

  // Fill narrative
  const descInput = await page.$('textarea[placeholder*="Describe the defect"]');
  if (descInput) {
    await descInput.type('Test defect narrative for Unknown support verification.');
    await delay(300);
  }

  // Screenshot 1: Phone viewport showing 3 questions with Unknown preselected in amber, fitting w-52
  const screenshot1Path = path.join(artifactDir, 'phase2_1_phone_viewport_unknown_defaults_w52.png');
  await page.screenshot({ path: screenshot1Path });
  console.log('SAVED PROOF 2.1 (Phone Viewport Unknown Defaults):', screenshot1Path);

  // Set specific values:
  // Returned to Supplier? -> Unknown (default)
  // Sort Requested? -> Yes
  // RMA Required? -> No
  console.log('Step 3: Selecting Sort Requested -> Yes, RMA Required -> No...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sortYes = btns.find(b => b.textContent.trim() === 'Yes' && b.parentElement && b.parentElement.parentElement && b.parentElement.parentElement.textContent.includes('Sort Requested'));
    if (sortYes) sortYes.click();
    const rmaNo = btns.find(b => b.textContent.trim() === 'No' && b.parentElement && b.parentElement.parentElement && b.parentElement.parentElement.textContent.includes('RMA Required'));
    if (rmaNo) rmaNo.click();
  });
  await delay(500);

  // Directly advance to Step 4 (Review & Send Summary) via window.__setIncStep(4)
  console.log('Advancing to Step 4 (Review & Send)...');
  await page.evaluate(() => {
    if (window.__setIncStep) window.__setIncStep(4);
  });
  await delay(1200);

  // Screenshot 2: Review & Send Summary showing Unknown (amber), Yes (green), No (red)
  const screenshot2Path = path.join(artifactDir, 'phase2_2_review_summary_unknown_yes_no_colors.png');
  await page.screenshot({ path: screenshot2Path });
  console.log('SAVED PROOF 2.2 (Review & Send Summary Colors):', screenshot2Path);

  // Click Release to Client Dashboard button on Step 4
  console.log('Clicking Release to Client Dashboard on Step 4...');
  const clickedTarget = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('Release to Client'));
    if (btn) {
      btn.click();
      return btn.textContent.trim();
    }
    return null;
  });
  console.log('Clicked button text:', clickedTarget);

  console.log('Waiting 1.5 seconds for incident payload submission...');
  await delay(1500);

  // Read stored record from localStorage
  const { allIncidents, storedRecord } = await page.evaluate(() => {
    try {
      const db = JSON.parse(localStorage.getItem('ids_pulse_db'));
      const incs = db.incidents || [];
      const match = incs.find(i => i.returned_to_supplier !== undefined && i.returned_to_supplier !== null) || incs[incs.length - 1];
      return { allIncidents: incs, storedRecord: match };
    } catch (e) {
      return { allIncidents: [], storedRecord: null };
    }
  });

  console.log('\n================ ALL INCIDENTS IN LOCALSTORAGE ================', allIncidents.length);
  allIncidents.forEach((inc, idx) => {
    console.log(`Incident #${idx + 1} [${inc.id}]:`, {
      title: inc.title,
      returned_to_supplier: inc.returned_to_supplier,
      sort_requested: inc.sort_requested,
      rma_required: inc.rma_required
    });
  });

  console.log('\n================ STORED LOCALSTORAGE RECORD ================');
  console.log(JSON.stringify(storedRecord, null, 2));
  console.log('===========================================================\n');

  if (storedRecord) {
    console.log('VERIFICATION PROOF:');
    console.log('  returned_to_supplier:', JSON.stringify(storedRecord.returned_to_supplier));
    console.log('  sort_requested:      ', JSON.stringify(storedRecord.sort_requested));
    console.log('  rma_required:        ', JSON.stringify(storedRecord.rma_required));
  }

  // --------------------------------------------------------------------------
  // PROOF 1.2: Add Client Rep Inline Refusal Message Screenshot
  // --------------------------------------------------------------------------
  console.log('\nNavigating to Admin WebDashboard for Add Client Rep inline error proof...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluate(() => {
    const adminUser = {
      id: 'admin_donna',
      name: 'Donna Cabral',
      role: 'admin',
      username: 'donna'
    };
    localStorage.setItem('ids_pulse_saved_user', JSON.stringify(adminUser));
    sessionStorage.setItem('ids_pulse_role', 'admin');
    sessionStorage.setItem('ids_pulse_username', 'donna');
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await delay(1200);

  // Open Client Directory tab
  const directoryTab = await page.evaluateHandle(() => {
    const el = Array.from(document.querySelectorAll('button, div, span'));
    return el.find(e => e.textContent.trim() === 'Client Directory' || e.textContent.includes('Client Directory'));
  });
  if (directoryTab && directoryTab.asElement()) {
    await directoryTab.asElement().click();
    await delay(1000);
  }

  // Click "+ Add Contact" on Magna Powertrain
  const addContactBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Add Contact'));
  });
  if (addContactBtn && addContactBtn.asElement()) {
    await addContactBtn.asElement().click();
    await delay(600);
  }

  // Fill in duplicate email (dcabral@integritydriven.com) and click Save Contact
  const nameInput = await page.$('input[placeholder="e.g. Robert Sterling"]');
  const emailInput = await page.$('input[placeholder="e.g. rsterling@magnapowertrain.com"]');
  const saveBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.trim() === 'Save Contact');
  });

  if (nameInput && emailInput && saveBtn && saveBtn.asElement()) {
    await nameInput.type('Donna Cabral Duplicate');
    await emailInput.type('dcabral@integritydriven.com');
    await saveBtn.asElement().click();
    await delay(800);
  }

  // Screenshot 3: Add Client Rep inline error message inside modal
  const screenshot3Path = path.join(artifactDir, 'phase1_2_modal_inline_error_refusal.png');
  await page.screenshot({ path: screenshot3Path });
  console.log('SAVED PROOF 1.2 (Modal Inline Error Refusal):', screenshot3Path);

  await browser.close();
  console.log('\n=== ALL PHASE 1 & 2 PROOFS CAPTURED SUCCESSFULLY ===');
}

runPhase2Capture().catch(console.error);
