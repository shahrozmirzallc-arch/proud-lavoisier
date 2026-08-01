const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('=====================================================');
  console.log('AUDITING HOME SCREEN TODAY\'S SPECIAL TASKS & AUDITS CARD ON LIVE PRODUCTION: https://proud-lavoisier.vercel.app');
  console.log('=====================================================\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  try {
    console.log('Navigating to live deployment (Mobile View 390x844)...');
    await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2', timeout: 30000 });

    // Click Clarence Kuiken login button
    console.log('Logging in as Clarence Kuiken (Rep)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clarenceBtn = buttons.find(b => b.textContent.includes('Clarence'));
      if (clarenceBtn) clarenceBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    // Capture Home Screen with Today's Special Tasks & Audits card
    const ssPath1 = path.join(__dirname, 'live_home_special_tasks.png');
    await page.screenshot({ path: ssPath1 });
    console.log('Saved Home Screen Special Tasks Screenshot:', ssPath1);

    // Click "Start Audit" button on task card
    console.log('Clicking Start Audit button on task card...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const auditBtn = buttons.find(b => b.textContent.includes('Start Audit'));
      if (auditBtn) auditBtn.click();
    });

    await new Promise(r => setTimeout(r, 3000));

    // Capture Pre-filled Routine Inspection Form Screenshot
    const ssPath2 = path.join(__dirname, 'live_home_task_prefilled_insp.png');
    await page.screenshot({ path: ssPath2 });
    console.log('Saved Pre-filled Routine Inspection Screenshot:', ssPath2);

  } catch (err) {
    console.error('Error during live home task audit:', err);
  } finally {
    await browser.close();
    console.log('\nLive Home Special Tasks Audit Complete!');
  }
})();
