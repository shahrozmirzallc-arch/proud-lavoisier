const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('=====================================================');
  console.log('AUDITING REDESIGNED LOG BILLABLE REWORK SCREEN ON LIVE PRODUCTION: https://proud-lavoisier.vercel.app');
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

    // Click "Log Rework" button on Home screen
    console.log('Clicking Log Rework button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reworkBtn = buttons.find(b => b.textContent.includes('Log Rework'));
      if (reworkBtn) reworkBtn.click();
    });

    await new Promise(r => setTimeout(r, 3000));

    // Capture Redesigned Log Billable Rework Screen Screenshot
    const ssPath1 = path.join(__dirname, 'live_rework_redesign_form.png');
    await page.screenshot({ path: ssPath1 });
    console.log('Saved Redesigned Log Rework Form Screenshot:', ssPath1);

    // Click Custom Input mode toggle
    console.log('Toggling to Custom Input mode...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const customBtn = buttons.find(b => b.textContent.includes('Custom Input'));
      if (customBtn) customBtn.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Click "Scan Part Barcode / QR Tag" button to open barcode scanner modal
    console.log('Opening Barcode / QR Scanner modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const scanBtn = buttons.find(b => b.textContent.includes('Scan Part Barcode'));
      if (scanBtn) scanBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capture Barcode / QR Scanner Modal Screenshot
    const ssPath2 = path.join(__dirname, 'live_rework_scanner_modal.png');
    await page.screenshot({ path: ssPath2 });
    console.log('Saved Barcode / QR Scanner Modal Screenshot:', ssPath2);

  } catch (err) {
    console.error('Error during live rework audit:', err);
  } finally {
    await browser.close();
    console.log('\nLive Rework Audit Complete!');
  }
})();
