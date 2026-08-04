import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 3 Time & Approvals] Capturing Magna Client Time & Approvals view...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('dialog', async dialog => {
    console.log('AUTO-DISMISS DIALOG:', dialog.message());
    await dialog.dismiss();
  });

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Log in as Magna Client Quality Manager (Robert Sterling)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Magna Client') || b.innerText.includes('Robert Sterling'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // Click "Time & Approvals" tab in left workspace nav
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText && b.innerText.includes('Time & Approvals'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const imgTimeAppr = path.join(ARTIFACTS_DIR, '03c_magna_client_time_approvals_view.png');
  await page.screenshot({ path: imgTimeAppr, fullPage: true });
  console.log(`Saved 03c: ${imgTimeAppr}`);

  await browser.close();
  console.log('[Step 3 Time & Approvals] Complete!');
}

run().catch(err => {
  console.error('[Step 3 Time & Approvals Error]:', err);
  process.exit(1);
});
