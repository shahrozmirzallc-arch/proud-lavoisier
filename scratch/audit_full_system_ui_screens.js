import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b\\audit';
if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

async function run() {
  console.log('[System UI Audit] Starting 100% real browser DOM audit across all 4 main roles...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  // -------------------------------------------------------------
  // ROLE 1: ADMIN WORKSPACE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- AUDITING ROLE 1: ADMIN WORKSPACE ---');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Log in as Admin
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('ADMIN'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const adminTabs = [
    { id: 'live-command', label: 'Live Command Center', name: '01_admin_live_command.png' },
    { id: 'incidents', label: 'Incident Defects Feed', name: '02_admin_incidents_feed.png' },
    { id: 'defects-matrix', label: 'Visual Defect Matrix', name: '03_admin_defects_matrix.png' },
    { id: 'daily-reports', label: 'Daily Quality Reports', name: '04_admin_daily_reports.png' },
    { id: 'rework-logs', label: 'Rework Logs Feed', name: '05_admin_rework_logs.png' },
    { id: 'hours', label: 'Timesheets & Logging', name: '06_admin_timesheets.png' },
    { id: 'suppliers', label: 'Suppliers Directory', name: '07_admin_suppliers_directory.png' },
    { id: 'projects', label: 'Projects Registry', name: '08_admin_projects_registry.png' },
    { id: 'users', label: 'User Directory', name: '09_admin_user_directory.png' },
    { id: 'system-logs', label: 'System Events Logs', name: '10_admin_system_logs.png' }
  ];

  for (const tab of adminTabs) {
    await page.evaluate((lbl) => {
      const el = Array.from(document.querySelectorAll('button, span, div')).find(x => x.innerText && x.innerText.trim() === lbl);
      if (el) el.click();
    }, tab.label);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, tab.name), fullPage: false });
    console.log(`Saved Admin Tab Screenshot: ${tab.name}`);
  }

  // -------------------------------------------------------------
  // ROLE 2: IDS REP MOBILE WORKSPACE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- AUDITING ROLE 2: IDS REP MOBILE WORKSPACE ---');
  await page.evaluate(() => {
    const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Log in as IDS Rep (Clarence Kuiken)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Clarence Kuiken') || b.innerText.includes('IDS FIELD REP'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '11_rep_home_dashboard.png'), fullPage: false });
  console.log('Saved Rep Home Dashboard: 11_rep_home_dashboard.png');

  // Open Log Hours Modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Log Shift Hours') || b.innerText.includes('Log Hours'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '12_rep_log_hours_modal.png'), fullPage: false });
  console.log('Saved Rep Log Hours Modal: 12_rep_log_hours_modal.png');

  // Close modal if open
  await page.evaluate(() => {
    const closeBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText === '✕' || b.innerText === 'Cancel');
    if (closeBtns.length > 0) closeBtns[closeBtns.length - 1].click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Open Incident Creation Wizard
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('New Incident') || b.innerText.includes('Create Incident Alert'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '13_rep_incident_wizard_step1.png'), fullPage: false });
  console.log('Saved Rep Incident Wizard Step 1: 13_rep_incident_wizard_step1.png');

  // -------------------------------------------------------------
  // ROLE 3: CLIENT WORKSPACE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- AUDITING ROLE 3: CLIENT WORKSPACE ---');
  await page.evaluate(() => {
    const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Log in as Client (Stellantis Client / Mark Vance)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Stellantis Client') || b.innerText.includes('CLIENT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '14_client_home_workspace.png'), fullPage: false });
  console.log('Saved Client Home Workspace: 14_client_home_workspace.png');

  const clientTabs = [
    { label: 'Incident Defects Feed', name: '15_client_incidents_feed.png' },
    { label: 'Published Quality Reports', name: '16_client_published_reports.png' }
  ];

  for (const tab of clientTabs) {
    await page.evaluate((lbl) => {
      const el = Array.from(document.querySelectorAll('button, span, div')).find(x => x.innerText && x.innerText.trim() === lbl);
      if (el) el.click();
    }, tab.label);
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, tab.name), fullPage: false });
    console.log(`Saved Client Tab Screenshot: ${tab.name}`);
  }

  // -------------------------------------------------------------
  // ROLE 4: ACCOUNTANT WORKSPACE AUDIT
  // -------------------------------------------------------------
  console.log('\n--- AUDITING ROLE 4: ACCOUNTANT WORKSPACE ---');
  await page.evaluate(() => {
    const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Log in as Accountant (Greg Weber)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Greg Weber') || b.innerText.includes('ACCOUNTANT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, '17_accountant_home_workspace.png'), fullPage: false });
  console.log('Saved Accountant Workspace: 17_accountant_home_workspace.png');

  await browser.close();
  console.log('\n[System UI Audit] All 17 screenshots captured successfully!');
}

run().catch(err => {
  console.error('[System UI Audit Error]:', err);
  process.exit(1);
});
