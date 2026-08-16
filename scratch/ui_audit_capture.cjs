// scratch/ui_audit_capture.cjs
const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'https://proud-lavoisier.vercel.app/';
const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\4c35684b-2cd3-442f-8986-5b75cde644e6';

async function runUiAudit() {
  console.log('[UI Audit] Launching headless Chrome browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Audit Login Screen
    console.log(`[UI Audit] 1. Loading Login Screen...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const loginPath = path.join(ARTIFACTS_DIR, 'ui_audit_01_login.png');
    await page.screenshot({ path: loginPath, fullPage: false });
    console.log(`[UI Audit] Saved 1. Login Screen -> ${loginPath}`);

    // 2. Audit Admin Command Center
    console.log('[UI Audit] 2. Logging in as Admin (Donna Cabral)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.innerText.includes('Donna Cabral'));
      if (adminBtn) adminBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    const adminPath = path.join(ARTIFACTS_DIR, 'ui_audit_02_admin_command_center.png');
    await page.screenshot({ path: adminPath, fullPage: false });
    console.log(`[UI Audit] Saved 2. Admin Command Center -> ${adminPath}`);

    // 3. Audit Supplier Quality Hub - PPM Analytics & Pareto
    console.log('[UI Audit] 3. Clicking Suppliers Directory in sidebar...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const suppBtn = buttons.find(b => b.innerText.includes('Suppliers Directory'));
      if (suppBtn) suppBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to PPM Defect Analytics subtab
    console.log('[UI Audit] 3b. Switching to PPM Defect Analytics sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const ppmTab = buttons.find(b => b.innerText.includes('PPM Defect Analytics'));
      if (ppmTab) ppmTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const ppmPath = path.join(ARTIFACTS_DIR, 'ui_audit_03_supplier_hub_ppm.png');
    await page.screenshot({ path: ppmPath, fullPage: false });
    console.log(`[UI Audit] Saved 3. Supplier PPM Analytics -> ${ppmPath}`);

    // 4. Audit Supplier Scorecards Tab
    console.log('[UI Audit] 4. Switching to Performance Scorecards sub-tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const scoreTab = buttons.find(b => b.innerText.includes('Performance Scorecards'));
      if (scoreTab) scoreTab.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    const scorecardsPath = path.join(ARTIFACTS_DIR, 'ui_audit_04_supplier_scorecards.png');
    await page.screenshot({ path: scorecardsPath, fullPage: false });
    console.log(`[UI Audit] Saved 4. Supplier Scorecards Matrix -> ${scorecardsPath}`);

    // 5. Audit Client Executive Portal (Lock Session & Login as Magna Client)
    console.log('[UI Audit] 5. Locking session and logging in as Magna Client...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lockBtn = buttons.find(b => b.innerText.includes('Lock Session'));
      if (lockBtn) lockBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // If still on dashboard, force clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Click Magna Client
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const magnaBtn = buttons.find(b => b.innerText.includes('Magna Client'));
      if (magnaBtn) magnaBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    const clientPath = path.join(ARTIFACTS_DIR, 'ui_audit_05_client_executive_portal.png');
    await page.screenshot({ path: clientPath, fullPage: false });
    console.log(`[UI Audit] Saved 5. Client Executive Portal -> ${clientPath}`);

    // 6. Audit Field Rep Mobile Phone UI (Lock Session & Login as Clarence Kuiken)
    console.log('[UI Audit] 6. Setting mobile viewport (390x844) and logging in as Clarence Kuiken...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const repBtn = buttons.find(b => b.innerText.includes('Clarence Kuiken'));
      if (repBtn) repBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    const repPath = path.join(ARTIFACTS_DIR, 'ui_audit_06_field_rep_mobile.png');
    await page.screenshot({ path: repPath, fullPage: false });
    console.log(`[UI Audit] Saved 6. Field Rep Mobile UI -> ${repPath}`);

    console.log('[UI Audit] ALL 6 SCREENSHOTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('[UI Audit Error]:', err);
  } finally {
    await browser.close();
  }
}

runUiAudit();
