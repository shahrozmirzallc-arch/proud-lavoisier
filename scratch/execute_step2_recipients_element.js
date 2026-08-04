import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 2 Element Screenshot] Capturing Phone Simulator Element...');

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
  await new Promise(r => setTimeout(r, 1500));

  // Log in as IDS Rep (Clarence Kuiken)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Clarence Kuiken') || b.innerText.includes('IDS FIELD REP'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Switch to Mobile Simulator tab if available
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const simTab = btns.find(b => b.innerText && (b.innerText.includes('IDS Rep Mobile') || b.innerText.includes('Mobile Simulator')));
    if (simTab) simTab.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Open Incident Creation Wizard
  await page.evaluate(() => {
    if (typeof window.__setActiveScreen === 'function') {
      window.__setActiveScreen('incident');
    }
  });
  await new Promise(r => setTimeout(r, 1500));

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

  // Scroll down in Step 4 container
  await page.evaluate(() => {
    const scrollable = document.querySelector('.overflow-y-auto');
    if (scrollable) scrollable.scrollTop = 500;
  });
  await new Promise(r => setTimeout(r, 1000));

  const imgWizardStep4 = path.join(ARTIFACTS_DIR, '02f_rep_incident_step4_review.png');
  await page.screenshot({ path: imgWizardStep4, fullPage: false });
  console.log(`Saved 02f: ${imgWizardStep4}`);

  await browser.close();
  console.log('[Step 2 Element Screenshot] Complete!');
}

run().catch(err => {
  console.error('[Step 2 Element Screenshot Error]:', err);
  process.exit(1);
});
