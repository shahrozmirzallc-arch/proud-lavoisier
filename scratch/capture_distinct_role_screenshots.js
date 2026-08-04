import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Puppeteer] Capturing updated Login Screen and Stellantis Client Portal...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();

  // 1. Capture Login Screen with Stellantis Client button
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  const loginPath = path.join(ARTIFACTS_DIR, '00_login_screen_stellantis.png');
  await page.screenshot({ path: loginPath, fullPage: false });
  console.log(`Saved: ${loginPath}`);

  // 2. Click Stellantis Client button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Stellantis') || b.innerText.includes('CLIENT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const clientPath = path.join(ARTIFACTS_DIR, '04_client_overtime_approved_stellantis.png');
  await page.screenshot({ path: clientPath, fullPage: false });
  console.log(`Saved: ${clientPath}`);

  await browser.close();
  console.log('[Puppeteer] Login & Client capture complete!');
}

run().catch(err => {
  console.error('[Puppeteer Error]:', err);
  process.exit(1);
});
