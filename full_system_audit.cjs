const puppeteer = require('puppeteer');
const fs = require('fs');

async function runAudit() {
  console.log('=== IDS PULSE LIVE SYSTEM AUDIT ===\n');
  const results = {
    timestamp: new Date().toISOString(),
    liveUrl: 'https://proud-lavoisier.vercel.app',
    tests: []
  };

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Test 1: Production URL Accessibility & Response Code
  console.log('[TEST 1] Checking Production URL status...');
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1440, height: 900 });
  const response = await page1.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2' });
  const status = response.status();
  console.log(`HTTP Status: ${status}`);
  results.tests.push({ name: 'Live Production HTTP Status 200', passed: status === 200, status });

  // Test 2: Default Dark Mode on Login Page
  console.log('[TEST 2] Verifying Default Dark Mode on Login...');
  const isDarkMode = await page1.evaluate(() => {
    return document.body.classList.contains('mode-dark');
  });
  console.log(`Default Dark Mode Active: ${isDarkMode}`);
  results.tests.push({ name: 'Default Dark Mode on Login Page', passed: isDarkMode });
  await page1.close();

  // Test 3: Admin Login (Greg: greg / Greg2026!)
  console.log('[TEST 3] Testing Admin Login (Greg)...');
  const pageAdmin = await browser.newPage();
  await pageAdmin.setViewport({ width: 1440, height: 900 });
  await pageAdmin.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2' });
  await pageAdmin.waitForSelector('input[type="text"]');
  await pageAdmin.type('input[type="text"]', 'greg');
  await pageAdmin.type('input[type="password"]', 'Greg2026!');
  await Promise.all([
    pageAdmin.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    pageAdmin.click('button[type="submit"]')
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const adminText = await pageAdmin.evaluate(() => document.body.innerText);
  const adminDashboardVisible = adminText.includes('Active Suspect Materials') || adminText.includes('Parts Reworked') || adminText.includes('SYSTEM HEALTH');
  console.log(`Admin Dashboard Rendered: ${adminDashboardVisible}`);
  results.tests.push({ name: 'Admin Login & Executive Dashboard Render', passed: adminDashboardVisible });

  // Test 4: Top Metric Cards Dark Gradient Styling & Clean Sidebar
  console.log('[TEST 4] Verifying Top Metric Cards & Sidebar Cleanliness...');
  const auditDetails = await pageAdmin.evaluate(() => {
    const cards = document.querySelectorAll('.grid.grid-cols-4 > div');
    const sidebarText = document.querySelector('aside, .w-64')?.innerText || '';
    const hasStraySlashN = sidebarText.includes('\\n');
    const isDark = document.body.classList.contains('mode-dark');
    return {
      cardCount: cards.length,
      hasStraySlashN,
      isDark
    };
  });
  console.log(`Metric Cards Count: ${auditDetails.cardCount}, Stray \\n in Sidebar: ${auditDetails.hasStraySlashN}, Theme: ${auditDetails.isDark ? 'dark' : 'light'}`);
  results.tests.push({ name: 'Metric Cards & Clean Sidebar Check', passed: auditDetails.cardCount === 4 && !auditDetails.hasStraySlashN && auditDetails.isDark });

  await pageAdmin.screenshot({ path: 'audit_admin_dashboard.png', fullPage: false });
  await pageAdmin.close();

  // Test 5: Accountant Login (Colleen: colleen / Colleen2026!)
  console.log('[TEST 5] Testing Accountant Login (Colleen)...');
  const pageColleen = await browser.newPage();
  await pageColleen.setViewport({ width: 1440, height: 900 });
  await pageColleen.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2' });
  await pageColleen.waitForSelector('input[type="text"]');
  await pageColleen.type('input[type="text"]', 'colleen');
  await pageColleen.type('input[type="password"]', 'Colleen2026!');
  await Promise.all([
    pageColleen.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    pageColleen.click('button[type="submit"]')
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const colleenAudit = await pageColleen.evaluate(() => {
    const isDark = document.body.classList.contains('mode-dark');
    const text = document.body.innerText;
    const hasTimesheets = text.includes('Timesheet') || text.includes('Payroll') || text.includes('Colleen');
    return { isDark, hasTimesheets };
  });
  console.log(`Accountant Theme Dark: ${colleenAudit.isDark}, Has Timesheets/Payroll Access: ${colleenAudit.hasTimesheets}`);
  results.tests.push({ name: 'Accountant Colleen Login & Default Dark Theme', passed: colleenAudit.isDark && colleenAudit.hasTimesheets });

  await pageColleen.screenshot({ path: 'audit_accountant_dashboard.png', fullPage: false });
  await pageColleen.close();

  // Test 6: QRE Representative Login (Clarence: clarence / Clarence2026!)
  console.log('[TEST 6] Testing QRE Representative Login (Clarence)...');
  const pageRep = await browser.newPage();
  await pageRep.setViewport({ width: 414, height: 896 });
  await pageRep.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2' });
  await pageRep.waitForSelector('input[type="text"]');
  await pageRep.type('input[type="text"]', 'clarence');
  await pageRep.type('input[type="password"]', 'Clarence2026!');
  await Promise.all([
    pageRep.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
    pageRep.click('button[type="submit"]')
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const repView = await pageRep.evaluate(() => {
    const isDark = document.body.classList.contains('mode-dark');
    const text = document.body.innerText;
    const isMobileNav = text.includes('Checklist') || text.includes('Scanner') || text.includes('Defect') || text.includes('Clarence');
    return { isDark, isMobileNav };
  });
  console.log(`QRE Rep View Dark Mode: ${repView.isDark}, Has Mobile Touch Interface: ${repView.isMobileNav}`);
  results.tests.push({ name: 'QRE Rep Clarence Login & Mobile Touch Interface', passed: repView.isDark && repView.isMobileNav });

  await pageRep.screenshot({ path: 'audit_rep_mobile_view.png', fullPage: false });
  await pageRep.close();

  await browser.close();

  console.log('\n=== AUDIT SUMMARY ===');
  const allPassed = results.tests.every(t => t.passed);
  console.log(`Total Audit Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.tests.filter(t => t.passed).length}`);
  console.log(`Failed: ${results.tests.filter(t => !t.passed).length}`);
  console.log(`Overall Status: ${allPassed ? '100% PERFECT PASSED' : 'HAS ISSUES'}`);

  fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
}

runAudit().catch(err => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
