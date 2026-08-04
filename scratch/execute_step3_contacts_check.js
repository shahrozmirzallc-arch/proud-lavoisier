import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 3 Client Contacts Check] Capturing Step 3 Contact Selection UI...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
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

  // Step 2 -> Click Continue to get to Step 3
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.innerText && b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const imgWizardStep3 = path.join(ARTIFACTS_DIR, '02e_rep_incident_step3_contacts.png');
  await page.screenshot({ path: imgWizardStep3 });
  console.log(`Saved 02e: ${imgWizardStep3}`);

  await browser.close();
  console.log('[Step 3 Client Contacts Check] Complete!');
}

run().catch(err => {
  console.error('[Step 3 Client Contacts Check Error]:', err);
  process.exit(1);
});
