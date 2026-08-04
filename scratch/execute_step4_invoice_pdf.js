import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 4 Invoicing Control] Navigating to Invoicing Control sub-tab...');

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

  // Log in as Colleen Boyd (ACCOUNTANT)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Colleen Boyd') || b.innerText.includes('ACCOUNTANT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // Click "Timesheets & Logging" tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText && b.innerText.includes('Timesheets & Logging'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Click "Invoicing Control" sub-tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText && b.innerText.includes('Invoicing Control'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const imgInvCtrl = path.join(ARTIFACTS_DIR, '04d_accountant_invoicing_control_view.png');
  await page.screenshot({ path: imgInvCtrl, fullPage: true });
  console.log(`Saved 04d: ${imgInvCtrl}`);

  await browser.close();
  console.log('[Step 4 Invoicing Control] Complete!');
}

run().catch(err => {
  console.error('[Step 4 Invoicing Control Error]:', err);
  process.exit(1);
});
