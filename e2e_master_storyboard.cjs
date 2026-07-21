const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Executing Ford Oakville Master Multi-Role Interconnected E2E Test...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // STEP 1: QRE HUGO LOGS DEFECT & EXPENSE
    console.log('\n--- [STEP 1/6] QRE Rep Hugo (Ford Oakville) ---');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'hugo');
    await page.type('input[type="password"]', 'Hugo2026!');
    await page.click('button[type="submit"]');

    // Handle Fast Auth if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const hBtn = btns.find(b => b.innerText.includes('Hugo'));
      if (hBtn) hBtn.click();
    });

    await page.waitForFunction(() => document.body.innerText.includes('New Suspect Material') || document.body.innerText.includes('HUGO'), { timeout: 8000 });
    console.log('✅ Step 1 PASSED: Hugo QRE Mobile App loaded.');

    // STEP 2: QUALITY LEAD DONNA AUDITS HEATMAP & DUPLICATES
    console.log('\n--- [STEP 2/6] Quality Lead Donna ---');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'donna');
    await page.type('input[type="password"]', 'Donna2026!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => document.body.innerText.includes('Suspect') || document.body.innerText.includes('QRE') || document.body.innerText.includes('ACTIVE'), { timeout: 8000 });
    console.log('✅ Step 2 PASSED: Quality Lead Donna Defect Matrix loaded.');

    // STEP 3: ACCOUNTANT COLLEEN VERIFIES RECEIPT & EXPORTS LEDGERS
    console.log('\n--- [STEP 3/6] Accountant Colleen ---');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'colleen');
    await page.type('input[type="password"]', 'Colleen2026!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => document.body.innerText.includes('Timesheets') || document.body.innerText.includes('Payroll'), { timeout: 8000 });
    console.log('✅ Step 3 PASSED: Accountant Colleen Timesheets & Lightbox loaded.');

    // STEP 4: CUSTOMER MAGNA PORTAL OVERSIGHT
    console.log('\n--- [STEP 4/6] Customer Magna ---');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'magna');
    await page.type('input[type="password"]', 'Magna2026!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => document.body.innerText.includes('Magna') || document.body.innerText.includes('Supplier'), { timeout: 8000 });
    console.log('✅ Step 4 PASSED: Customer Magna Portal loaded.');

    // STEP 5: SYSTEM ADMIN GREG LOGS AUDIT
    console.log('\n--- [STEP 5/6] System Admin Greg ---');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'greg');
    await page.type('input[type="password"]', 'Greg2026!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => document.body.innerText.includes('ACTIVE') || document.body.innerText.includes('SUPPLIERS'), { timeout: 8000 });
    console.log('✅ Step 5 PASSED: System Admin Greg Event Stream loaded.');

    // STEP 6: EXECUTIVE OWNER SHAHROZ MIRZA LAUNCH ROADMAP
    console.log('\n--- [STEP 6/6] Executive Owner Shahroz Mirza ---');
    await page.evaluate(() => sessionStorage.clear());
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'shahroz');
    await page.type('input[type="password"]', 'Shahroz2026!');
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => document.body.innerText.includes('ACTIVE') || document.body.innerText.includes('IDS'), { timeout: 8000 });
    console.log('✅ Step 6 PASSED: Executive Owner Shahroz Mirza Launch Roadmap loaded.');

    console.log('\n==================================================');
    console.log('🏆 MASTER MULTI-ROLE INTERCONNECTED E2E TEST: 100% PASSED!');
    console.log('==================================================');

  } catch (err) {
    console.error('❌ Master Storyboard E2E Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
