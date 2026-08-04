import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Puppeteer] Launching browser for interactive portal captures...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();

  // 1. Admin Portal Setup Screenshot
  console.log('[1/6] Logging in as Admin (Donna Cabral)...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await page.waitForSelector('button');
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('ADMIN'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span'));
    const target = btns.find(b => b.innerText && (b.innerText.includes('Suppliers') || b.innerText.includes('Clients')));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const adminScreenshotPath = path.join(ARTIFACTS_DIR, '01_admin_stellantis_master_setup.png');
  await page.screenshot({ path: adminScreenshotPath, fullPage: false });
  console.log(`Saved: ${adminScreenshotPath}`);

  // 2. Rep Mobile View Screenshot
  console.log('[2/6] Logging in as Rep (Clarence Kuiken) Mobile View...');
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Clarence Kuiken') || b.innerText.includes('REP'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const repScreenshotPath = path.join(ARTIFACTS_DIR, '02_rep_incident_release_stellantis.png');
  await page.screenshot({ path: repScreenshotPath, fullPage: false });
  console.log(`Saved: ${repScreenshotPath}`);

  // 3. Rep Hours Logged Screenshot
  console.log('[3/6] Capturing Rep Hours Status View...');
  const repHoursScreenshotPath = path.join(ARTIFACTS_DIR, '03_rep_hours_logged_split.png');
  await page.screenshot({ path: repHoursScreenshotPath, fullPage: false });
  console.log(`Saved: ${repHoursScreenshotPath}`);

  // 4. Client Overtime Approvals Portal (1366x768)
  console.log('[4/6] Logging in as Client Quality Manager (Mark Vance)...');
  await page.setViewport({ width: 1366, height: 768 });
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Client') || b.innerText.includes('CLIENT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, h3, span'));
    const target = btns.find(b => b.innerText && (b.innerText.includes('Overtime Approvals') || b.innerText.includes('Approvals')));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const clientScreenshotPath = path.join(ARTIFACTS_DIR, '04_client_overtime_approved_stellantis.png');
  await page.screenshot({ path: clientScreenshotPath, fullPage: false });
  console.log(`Saved: ${clientScreenshotPath}`);

  // 5. Accountant Financial Portal Screenshot
  console.log('[5/6] Logging in as Financial Accountant (Colleen Boyd)...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Colleen Boyd') || b.innerText.includes('ACCOUNTANT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span'));
    const target = btns.find(b => b.innerText && (b.innerText.includes('Hours & Overtime') || b.innerText.includes('Timesheet')));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const accountantScreenshotPath = path.join(ARTIFACTS_DIR, '05_accountant_invoicing_stellantis.png');
  await page.screenshot({ path: accountantScreenshotPath, fullPage: false });
  console.log(`Saved: ${accountantScreenshotPath}`);

  // 6. Admin Case Archive Screenshot
  console.log('[6/6] Logging back as Admin for Case Archive View...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('ADMIN'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const archiveScreenshotPath = path.join(ARTIFACTS_DIR, '06_admin_case_archived_stellantis.png');
  await page.screenshot({ path: archiveScreenshotPath, fullPage: false });
  console.log(`Saved: ${archiveScreenshotPath}`);

  await browser.close();
  console.log('[Puppeteer] All 6 interactive role screenshots captured successfully!');
}

run().catch(err => {
  console.error('[Puppeteer Interactive Error]:', err);
  process.exit(1);
});
