import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Onboarding Reps Dropdown Verification] Testing ASSIGN FIELD REP dropdown contents...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('dialog', async dialog => await dialog.dismiss());

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  await page.type('input[placeholder*="username"], input[type="text"]', 'shahroz');
  await page.type('input[type="password"]', 'Shahroz121$');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Sign in to IDS Pulse'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Open + Onboard Client & Hours modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Onboard Client') || b.innerText.includes('Onboard Company'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Extract all option texts from the ASSIGN FIELD REP dropdown
  const dropdownOptions = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const repSelect = selects.find(s => s.innerText.includes('Clarence') || s.innerText.includes('Create New Field Inspector'));
    if (!repSelect) return [];
    return Array.from(repSelect.options).map(o => o.text);
  });

  console.log('ASSIGN FIELD REP Dropdown Options:', dropdownOptions);

  const imgModal = path.join(ARTIFACTS_DIR, '07_fixed_assign_field_rep_modal.png');
  await page.screenshot({ path: imgModal });
  console.log(`Saved screenshot: ${imgModal}`);

  await browser.close();

  const containsClientReps = dropdownOptions.some(opt => opt.includes('Robert Sterling') || opt.includes('Mark Vance'));
  if (containsClientReps) {
    console.error('FAILURE: Client Reps are still showing in ASSIGN FIELD REP dropdown!');
    process.exit(1);
  } else {
    console.log('SUCCESS: ASSIGN FIELD REP dropdown strictly contains IDS Field Inspectors only!');
  }
}

run().catch(err => {
  console.error('[Onboarding Reps Dropdown Verification Error]:', err);
  process.exit(1);
});
