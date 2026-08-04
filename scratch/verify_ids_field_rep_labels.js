import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[IDS Field Rep Label Verification] Capturing modal screenshot...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('dialog', async dialog => await dialog.dismiss());

  let loaded = false;
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      loaded = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!loaded) {
    throw new Error('Could not load http://localhost:5174/');
  }

  await new Promise(r => setTimeout(r, 1500));

  await page.type('input[placeholder*="username"], input[type="text"]', 'shahroz');
  await page.type('input[type="password"]', 'Shahroz121$');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Sign in to IDS Pulse'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Open Onboard Client modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Onboard Client') || b.innerText.includes('Onboard Company'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const imgModal = path.join(ARTIFACTS_DIR, '08_ids_field_rep_standardized_modal.png');
  await page.screenshot({ path: imgModal });
  console.log(`Saved screenshot: ${imgModal}`);

  await browser.close();
  console.log('[IDS Field Rep Label Verification] Complete!');
}

run().catch(err => {
  console.error('[IDS Field Rep Label Verification Error]:', err);
  process.exit(1);
});
