import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Puppeteer] Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  
  // 1. Admin Master Setup Screen
  console.log('[1/6] Navigating to Admin Dashboard...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    sessionStorage.setItem('ids_pulse_role', 'admin');
    sessionStorage.setItem('ids_pulse_user', JSON.stringify({ id: 'usr_greg', name: 'Greg Phillippe', role: 'admin', username: 'greg' }));
  });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const adminScreenshotPath = path.join(ARTIFACTS_DIR, '01_admin_stellantis_master_setup.png');
  await page.screenshot({ path: adminScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${adminScreenshotPath}`);

  // 2. Rep Mobile View & Incident Release
  console.log('[2/6] Navigating to Rep Mobile View (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.evaluate(() => {
    sessionStorage.setItem('ids_pulse_role', 'rep');
    sessionStorage.setItem('ids_pulse_user', JSON.stringify({ id: 'rep_clarence', name: 'Clarence Kuiken', role: 'rep', username: 'clarence' }));
  });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const repScreenshotPath = path.join(ARTIFACTS_DIR, '02_rep_incident_release_stellantis.png');
  await page.screenshot({ path: repScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${repScreenshotPath}`);

  // 3. Rep Hours Logged & Split
  console.log('[3/6] Capturing Rep Hours Logged & Split...');
  const repHoursScreenshotPath = path.join(ARTIFACTS_DIR, '03_rep_hours_logged_split.png');
  await page.screenshot({ path: repHoursScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${repHoursScreenshotPath}`);

  // 4. Client Portal & Overtime Approval (1366x768)
  console.log('[4/6] Navigating to Client Portal (Mark Vance - Stellantis)...');
  await page.setViewport({ width: 1366, height: 768 });
  await page.evaluate(() => {
    sessionStorage.setItem('ids_pulse_role', 'customer');
    sessionStorage.setItem('ids_pulse_user', JSON.stringify({
      id: 'user_cust_stellantis_mark',
      name: 'Mark Vance (Primary Quality Mgr)',
      role: 'customer',
      customer_id: 'sup_stellantis',
      supplier_id: 'sup_stellantis',
      username: 'stellantis_client'
    }));
  });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const clientScreenshotPath = path.join(ARTIFACTS_DIR, '04_client_overtime_approved_stellantis.png');
  await page.screenshot({ path: clientScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${clientScreenshotPath}`);

  // 5. Accountant Financial Portal
  console.log('[5/6] Navigating to Financial Accountant Portal...');
  await page.evaluate(() => {
    sessionStorage.setItem('ids_pulse_role', 'accountant');
    sessionStorage.setItem('ids_pulse_user', JSON.stringify({ id: 'acct_1', name: 'Colleen Boyd', role: 'accountant', username: 'colleen' }));
  });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const accountantScreenshotPath = path.join(ARTIFACTS_DIR, '05_accountant_invoicing_stellantis.png');
  await page.screenshot({ path: accountantScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${accountantScreenshotPath}`);

  // 6. Admin Case Archive
  console.log('[6/6] Navigating to Admin Portal for Case Archive...');
  await page.evaluate(() => {
    sessionStorage.setItem('ids_pulse_role', 'owner');
    sessionStorage.setItem('ids_pulse_user', JSON.stringify({ id: 'usr_donna', name: 'Donna Cabral', role: 'owner', username: 'donna' }));
  });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  const archiveScreenshotPath = path.join(ARTIFACTS_DIR, '06_admin_case_archived_stellantis.png');
  await page.screenshot({ path: archiveScreenshotPath, fullPage: false });
  console.log(`Saved screenshot: ${archiveScreenshotPath}`);

  await browser.close();
  console.log('[Puppeteer] All 6 screenshots captured successfully!');
}

run().catch(err => {
  console.error('[Puppeteer Error]:', err);
  process.exit(1);
});
