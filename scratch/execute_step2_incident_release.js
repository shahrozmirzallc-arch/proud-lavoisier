import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 2 Incident Release Verification] Verifying F. REPORT RECIPIENTS auto-routing for Client Contacts...');

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

  let loaded = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Loading http://localhost:5174/ (attempt ${attempt})...`);
      await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      loaded = true;
      break;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  if (!loaded) {
    throw new Error('Failed to load dev server on port 5174 after 3 attempts.');
  }

  await new Promise(r => setTimeout(r, 2000));

  // Log in as IDS Rep (Clarence Kuiken)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Clarence Kuiken') || b.innerText.includes('IDS FIELD REP'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // Open Incident Creation Wizard
  await page.evaluate(() => {
    if (typeof window.__setActiveScreen === 'function') {
      window.__setActiveScreen('incident');
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Step 1 -> Click Demo Fill & Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demoBtn = btns.find(b => b.innerText && b.innerText.includes('Demo Fill'));
    if (demoBtn) demoBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.innerText && b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Step 2 -> Click Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.innerText && b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Step 3 -> Click "Review & Send" button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const revBtn = btns.find(b => b.innerText && b.innerText.includes('Review & Send'));
    if (revBtn) revBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll down in Step 4 so F. REPORT RECIPIENTS is fully visible
  await page.evaluate(() => {
    const containers = Array.from(document.querySelectorAll('div'));
    const scrollable = containers.find(c => c.scrollHeight > c.clientHeight && c.innerText.includes('F. REPORT RECIPIENTS'));
    if (scrollable) scrollable.scrollTop = 450;
  });
  await new Promise(r => setTimeout(r, 1000));

  const imgWizardStep4 = path.join(ARTIFACTS_DIR, '02f_rep_incident_step4_review.png');
  await page.screenshot({ path: imgWizardStep4, fullPage: false });
  console.log(`Saved 02f: ${imgWizardStep4}`);

  await browser.close();
  console.log('[Step 2 Incident Release Verification] Complete!');
}

run().catch(err => {
  console.error('[Step 2 Incident Release Verification Error]:', err);
  process.exit(1);
});
