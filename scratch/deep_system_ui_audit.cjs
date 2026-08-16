// scratch/deep_system_ui_audit.cjs
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://proud-lavoisier.vercel.app/';
const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\4c35684b-2cd3-442f-8986-5b75cde644e6';

async function runDeepUiAudit() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const auditFindings = [];

  async function snap(name) {
    const shotPath = path.join(ARTIFACTS_DIR, `deep_audit_${name}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`[Captured] -> deep_audit_${name}.png`);
    return shotPath;
  }

  try {
    console.log('--- AUDITING STEP 1: AUTHENTICATION & LOGIN SCREEN ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await snap('01_login_screen');

    console.log('--- AUDITING STEP 2: ADMIN COMMAND CENTER (DONNA) ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.innerText.includes('Donna Cabral'));
      if (adminBtn) adminBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    await snap('02_admin_command_center');

    console.log('--- AUDITING STEP 3: REPORTS HUB ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Reports Hub'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await snap('03_reports_hub');

    console.log('--- AUDITING STEP 4: DAILY TASKS PLANNER ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Daily Tasks Planner'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await snap('04_daily_planner');

    console.log('--- AUDITING STEP 5: TIMESHEETS & LOGGING ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Timesheets & Logging'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await snap('05_timesheets_logging');

    console.log('--- AUDITING STEP 6: CLIENTS & RATES ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Clients & Rates'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await snap('06_clients_rates');

    console.log('--- AUDITING STEP 7: SUPPLIERS DIRECTORY ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Suppliers Directory'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await snap('07_suppliers_directory');

    console.log('--- AUDITING STEP 8: PROJECTS REGISTRY ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('Projects Registry'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await snap('08_projects_registry');

    console.log('--- AUDITING STEP 9: USER DIRECTORY ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.innerText && b.innerText.includes('User Directory'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await snap('09_user_directory');

    console.log('--- AUDITING STEP 10: CLIENT EXECUTIVE PORTAL VIEW (ROBERT STERLING) ---');
    // Lock session & Login as Client
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lockBtn = buttons.find(b => b.innerText && b.innerText.includes('Lock Session'));
      if (lockBtn) lockBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clientBtn = buttons.find(b => b.innerText && (b.innerText.includes('Robert Sterling') || b.innerText.includes('Client')));
      if (clientBtn) clientBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    await snap('10_client_executive_portal');

    console.log('--- AUDITING STEP 11: FIELD REP MOBILE VIEW (PHONE SIMULATOR) ---');
    await page.setViewport({ width: 420, height: 880 });
    // Lock session & Login as Field Rep
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lockBtn = buttons.find(b => b.innerText && b.innerText.includes('Lock Session'));
      if (lockBtn) lockBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const repBtn = buttons.find(b => b.innerText && (b.innerText.includes('Clarence Kuiken') || b.innerText.includes('Field Rep')));
      if (repBtn) repBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));
    await snap('11_field_rep_mobile');

    console.log('--- ALL SCREENSHOTS CAPTURED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    await browser.close();
  }
}

runDeepUiAudit();
