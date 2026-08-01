const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('=====================================================');
  console.log('AUDITING LIVE PRODUCTION URL: https://proud-lavoisier.vercel.app');
  console.log('=====================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // Set viewport to mobile phone view first to test Phone Simulator on Live Vercel
  await page.setViewport({ width: 390, height: 844 });

  try {
    console.log('Navigating to live deployment (Mobile View 390x844)...');
    await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });

    // Click Clarence Kuiken login button
    console.log('Clicking Clarence Kuiken login button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clarenceBtn = buttons.find(b => b.textContent.includes('Clarence'));
      if (clarenceBtn) clarenceBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    // Capture Mobile App Home Screen Screenshot
    const ssPath1 = path.join(__dirname, 'live_mobile_home.png');
    await page.screenshot({ path: ssPath1 });
    console.log('Saved Mobile Home Screenshot:', ssPath1);

    // Inspect Mobile DOM for Expense button/card
    const expenseBtnFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, span, div'));
      const found = buttons.filter(b => b.textContent && b.textContent.toLowerCase().includes('expense'));
      return found.map(f => f.textContent.trim()).slice(0, 10);
    });

    console.log('Mobile App Live DOM Expense Elements:', expenseBtnFound);

    // Click "Add Expense" card on Home screen or Expenses tab on bottom bar
    console.log('Clicking Add Expense / Expenses tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expBtn = buttons.find(b => b.textContent.includes('Add Expense') || b.textContent.includes('Expenses'));
      if (expBtn) expBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capture Live Mobile Expense Form Screenshot
    const ssPath2 = path.join(__dirname, 'live_mobile_expense_form.png');
    await page.screenshot({ path: ssPath2 });
    console.log('Saved Mobile Expense Form Screenshot:', ssPath2);

    // Now switch to Desktop View (1280x900) to test Web Dashboard on Live Vercel
    await page.setViewport({ width: 1280, height: 900 });
    await new Promise(r => setTimeout(r, 2000));

    // Capture Live Web Dashboard Timesheet & Expenses Screenshot
    const ssPath3 = path.join(__dirname, 'live_desktop_dashboard.png');
    await page.screenshot({ path: ssPath3 });
    console.log('Saved Desktop Dashboard Screenshot:', ssPath3);

  } catch (err) {
    console.error('Error during live audit:', err);
  } finally {
    await browser.close();
    console.log('\nLive Vercel Audit Complete!');
  }
})();
