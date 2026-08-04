import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Pure Click Verification] Performing natural UI navigation...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('dialog', async dialog => await dialog.dismiss());

  let success = false;
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      success = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!success) {
    await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  }

  await new Promise(r => setTimeout(r, 2000));

  // 1. Click Clarence Kuiken login button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Clarence Kuiken') || b.innerText.includes('IDS FIELD REP'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // 2. Click "New Incident" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, div, a'));
    const target = btns.find(b => b.innerText && (b.innerText.includes('New Incident') || b.innerText.includes('Incident Alert') || b.innerText.includes('File Report')));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 3. Click Demo Fill
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demoBtn = btns.find(b => b.innerText && b.innerText.includes('Demo Fill'));
    if (demoBtn) demoBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 4. Click Step 1 Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.innerText && b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 5. Click Step 2 Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.innerText && b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 6. Click Step 3 Review & Send
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const revBtn = btns.find(b => b.innerText && b.innerText.includes('Review & Send'));
    if (revBtn) revBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const imgWizardStep4 = path.join(ARTIFACTS_DIR, '02f_rep_incident_step4_review.png');
  await page.screenshot({ path: imgWizardStep4 });
  console.log(`Saved 02f: ${imgWizardStep4}`);

  await browser.close();
  console.log('[Pure Click Verification] Complete!');
}

run().catch(err => {
  console.error('[Pure Click Verification Error]:', err);
  process.exit(1);
});
