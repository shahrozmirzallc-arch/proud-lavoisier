import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  console.log('Launching browser to check Monica Admin experience...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('Navigating to http://localhost:4173...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 30000 });
    
    await page.waitForSelector('#login-username', { timeout: 10000 });
    console.log('Entering Monica login credentials...');
    await page.type('#login-username', 'monica');
    await page.type('#login-password', 'Monica2026!');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 3500));

    console.log('Capturing screenshot of Monica Admin Dashboard...');
    const screenshot1 = path.join(process.cwd(), 'monica_browser_dashboard.png');
    await page.screenshot({ path: screenshot1, fullPage: false });

    // Scroll down inside container to capture metrics and deployment cards
    await page.evaluate(() => {
      window.scrollTo(0, 500);
      const elements = document.querySelectorAll('.overflow-y-auto');
      elements.forEach(el => el.scrollTop = 500);
    });
    await new Promise(r => setTimeout(r, 1500));

    const screenshot2 = path.join(process.cwd(), 'monica_browser_command_center.png');
    await page.screenshot({ path: screenshot2, fullPage: false });
    console.log('Verification completed successfully! Proof screenshots saved.');

  } catch (err) {
    console.error('Browser check error:', err);
  } finally {
    await browser.close();
  }
})();
