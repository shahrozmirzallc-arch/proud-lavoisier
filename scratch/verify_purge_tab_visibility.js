import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Purge Tab Visibility Verification] Testing Super-Admin vs Other Roles on http://localhost:5174/...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('dialog', async dialog => await dialog.dismiss());

  // 1. Verify Super-Admin (Shahroz Mirza) -> Clean Database (Purge) MUST BE VISIBLE
  console.log('Testing Super-Admin (Shahroz Mirza)...');
  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // Type credentials for Shahroz Mirza
  await page.type('input[placeholder*="username"], input[type="text"]', 'shahroz');
  await page.type('input[type="password"]', 'Shahroz121$');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Sign in to IDS Pulse'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  const imgSuperAdmin = path.join(ARTIFACTS_DIR, '06a_shahroz_super_admin_purge_visible.png');
  await page.screenshot({ path: imgSuperAdmin });
  console.log(`Saved Super Admin screenshot: ${imgSuperAdmin}`);

  // 2. Verify QA Lead / Operations (Donna Cabral) -> Clean Database (Purge) MUST BE HIDDEN
  console.log('Testing Operations Lead (Donna Cabral)...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('QA OPERATIONS LEAD'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  const imgDonnaLead = path.join(ARTIFACTS_DIR, '06b_donna_lead_purge_hidden.png');
  await page.screenshot({ path: imgDonnaLead });
  console.log(`Saved Donna Lead screenshot: ${imgDonnaLead}`);

  await browser.close();
  console.log('[Purge Tab Visibility Verification] Complete!');
}

run().catch(err => {
  console.error('[Purge Tab Visibility Verification Error]:', err);
  process.exit(1);
});
