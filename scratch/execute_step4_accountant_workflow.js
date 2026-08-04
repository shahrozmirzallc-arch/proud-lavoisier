import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 4 Accountant Workflow] Executing Step 4: IDS Accountant (Colleen Boyd)...');

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

  // Log in as Colleen Boyd (ACCOUNTANT) via 1-click button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Colleen Boyd') || b.innerText.includes('ACCOUNTANT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Capture Colleen's Financial & Billing Dashboard Overview
  const imgAccDash = path.join(ARTIFACTS_DIR, '04a_accountant_financial_dashboard.png');
  await page.screenshot({ path: imgAccDash, fullPage: true });
  console.log(`Saved 04a: ${imgAccDash}`);

  // 2. Filter/Select Magna Powertrain International in Client Billing / Invoicing section
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const suppSelect = selects.find(s => Array.from(s.options).some(o => o.text.includes('Magna')));
    if (suppSelect) {
      const magnaOpt = Array.from(suppSelect.options).find(o => o.text.includes('Magna'));
      if (magnaOpt) {
        suppSelect.value = magnaOpt.value;
        suppSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  const imgMagnaBilling = path.join(ARTIFACTS_DIR, '04b_magna_billing_and_invoicing_detail.png');
  await page.screenshot({ path: imgMagnaBilling, fullPage: true });
  console.log(`Saved 04b: ${imgMagnaBilling}`);

  await browser.close();
  console.log('[Step 4 Accountant Workflow] Complete!');
}

run().catch(err => {
  console.error('[Step 4 Accountant Workflow Error]:', err);
  process.exit(1);
});
