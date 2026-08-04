import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 3 Client Workflow] Executing Step 3: Magna Client Quality Manager (Robert Sterling)...');

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

  // 1. Log in as Clarence Kuiken (IDS Rep) to release an incident for Magna
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Clarence Kuiken') || b.innerText.includes('IDS FIELD REP'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Open Incident Creation Wizard & Release Incident
  await page.evaluate(() => {
    if (typeof window.__setActiveScreen === 'function') {
      window.__setActiveScreen('incident');
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  // Step 1 -> Demo Fill & Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const demoBtn = btns.find(b => b.innerText && b.innerText.includes('Demo Fill'));
    if (demoBtn) demoBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.innerText && b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Step 2 -> Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const contBtn = btns.find(b => b.innerText && b.innerText.includes('Continue'));
    if (contBtn) contBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Step 3 -> Review & Send
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const revBtn = btns.find(b => b.innerText && b.innerText.includes('Review & Send'));
    if (revBtn) revBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Step 4 -> Release to Client Dashboard
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const relBtn = btns.find(b => b.innerText && (b.innerText.includes('Release Incident Alert') || b.innerText.includes('Release to Client') || b.innerText.includes('Release')));
    if (relBtn) relBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 2. Lock Session to go to Login Screen
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const lockBtn = btns.find(b => b.innerText && b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 3. Log in as Magna Client Quality Manager (Robert Sterling)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Magna Client') || b.innerText.includes('Robert Sterling'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // 4. Capture Client Portal Dashboard Feed Overview ( showing released incident! )
  const imgClientDash = path.join(ARTIFACTS_DIR, '03a_magna_client_dashboard_feed.png');
  await page.screenshot({ path: imgClientDash, fullPage: true });
  console.log(`Saved 03a: ${imgClientDash}`);

  // 5. Click on Released Incident Card (PN 7T4Z-7000-A) to open detail view
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div, tr, button'));
    const target = cards.find(c => c.innerText && (c.innerText.includes('PN-7T4Z-7000-A') || c.innerText.includes('Spare bulb') || c.innerText.includes('Stator') || c.innerText.includes('Micro-fissure')));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const imgIncidentDetail = path.join(ARTIFACTS_DIR, '03b_magna_client_incident_detail_modal.png');
  await page.screenshot({ path: imgIncidentDetail, fullPage: false });
  console.log(`Saved 03b: ${imgIncidentDetail}`);

  await browser.close();
  console.log('[Step 3 Client Workflow] Complete!');
}

run().catch(err => {
  console.error('[Step 3 Client Workflow Error]:', err);
  process.exit(1);
});
