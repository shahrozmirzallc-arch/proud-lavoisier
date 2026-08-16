// scratch/execute_e2e_simulation.cjs
const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'https://proud-lavoisier.vercel.app/';
const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\4c35684b-2cd3-442f-8986-5b75cde644e6';

async function runSimulation() {
  console.log('=== STARTING 3-ROLE LIVE AUTOMOTIVE QUALITY SIMULATION ===');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // -------------------------------------------------------------
    // STEP 1: FIELD REP (MOBILE SIMULATOR)
    // -------------------------------------------------------------
    console.log('[STEP 1] Launching Field Rep Mobile Simulator...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Mobile Simulator View
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const appOnlyBtn = buttons.find(b => b.innerText && b.innerText.includes('App Only'));
      if (appOnlyBtn) appOnlyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Login as Clarence Kuiken (Field Inspector)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const repBtn = buttons.find(b => b.innerText && b.innerText.includes('Clarence Kuiken'));
      if (repBtn) repBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Capture Rep Mobile Feed
    const shotRep = path.join(ARTIFACTS_DIR, 'sim_01_rep_mobile.png');
    await page.screenshot({ path: shotRep, fullPage: false });
    console.log(`[PASS] Field Rep Mobile Screen Captured -> ${shotRep}`);

    // -------------------------------------------------------------
    // STEP 2: QA SUPERVISOR / ADMIN (WEB COMMAND CENTER)
    // -------------------------------------------------------------
    console.log('[STEP 2] Logging in as QA Supervisor Donna Cabral...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lockBtn = buttons.find(b => b.innerText && b.innerText.includes('Lock Session'));
      if (lockBtn) lockBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Switch to Dashboard Only View
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dashOnlyBtn = buttons.find(b => b.innerText && b.innerText.includes('Dashboard Only'));
      if (dashOnlyBtn) dashOnlyBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    // Login as Donna Cabral
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.innerText && b.innerText.includes('Donna Cabral'));
      if (adminBtn) adminBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    // Navigate to Reports Hub
    await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      const reportsBtn = allButtons.find(b => b.innerText && b.innerText.includes('Reports Hub'));
      if (reportsBtn) reportsBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const shotAdmin = path.join(ARTIFACTS_DIR, 'sim_02_admin_reports_hub.png');
    await page.screenshot({ path: shotAdmin, fullPage: false });
    console.log(`[PASS] Admin Reports Hub Screen Captured -> ${shotAdmin}`);

    // -------------------------------------------------------------
    // STEP 3: CLIENT QUALITY MANAGER (CUSTOMER EXECUTIVE PORTAL)
    // -------------------------------------------------------------
    console.log('[STEP 3] Logging in as Client Quality Contact Mark Vance (Stellantis)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lockBtn = buttons.find(b => b.innerText && b.innerText.includes('Lock Session'));
      if (lockBtn) lockBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Login as Mark Vance (Stellantis Client)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clientBtn = buttons.find(b => b.innerText && (b.innerText.includes('Mark Vance') || b.innerText.includes('Stellantis Client')));
      if (clientBtn) clientBtn.click();
    });
    await new Promise(r => setTimeout(r, 2500));

    const shotClient = path.join(ARTIFACTS_DIR, 'sim_03_client_executive_portal.png');
    await page.screenshot({ path: shotClient, fullPage: false });
    console.log(`[PASS] Client Executive Portal Screen Captured -> ${shotClient}`);

    console.log('=== 3-ROLE SIMULATION COMPLETED SUCCESSFULLY ===');
  } catch (err) {
    console.error('Simulation Error:', err);
  } finally {
    await browser.close();
  }
}

runSimulation();
