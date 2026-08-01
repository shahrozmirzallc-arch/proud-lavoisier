const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('=====================================================');
  console.log('AUDITING REDESIGNED ROUTINE QUALITY INSPECTION SCREEN ON LIVE PRODUCTION: https://proud-lavoisier.vercel.app');
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

    // Click "Start Routine Inspection" button on Home screen
    console.log('Clicking Start Routine Inspection button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inspBtn = buttons.find(b => b.textContent.includes('Start Routine Inspection'));
      if (inspBtn) inspBtn.click();
    });

    await new Promise(r => setTimeout(r, 3000));

    // Capture Redesigned Routine Inspection Form Screenshot
    const ssPath1 = path.join(__dirname, 'live_insp_redesign_form.png');
    await page.screenshot({ path: ssPath1 });
    console.log('Saved Redesigned Routine Inspection Form Screenshot:', ssPath1);

    // Click "Scan Inspected Part Barcode / QR Tag" button to open barcode scanner modal
    console.log('Opening Inspection Barcode / QR Scanner modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const scanBtn = buttons.find(b => b.textContent.includes('Scan Inspected Part Barcode'));
      if (scanBtn) scanBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Capture Inspection Barcode / QR Scanner Modal Screenshot
    const ssPath2 = path.join(__dirname, 'live_insp_scanner_modal.png');
    await page.screenshot({ path: ssPath2 });
    console.log('Saved Inspection Barcode / QR Scanner Modal Screenshot:', ssPath2);

  } catch (err) {
    console.error('Error during live inspection audit:', err);
  } finally {
    await browser.close();
    console.log('\nLive Routine Inspection Audit Complete!');
  }
})();
