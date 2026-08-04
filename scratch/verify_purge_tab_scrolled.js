import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Scrolled Sidebar Verification] Checking Purge button in System & Admin menu...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('dialog', async dialog => await dialog.dismiss());

  // 1. Log in as Super-Admin (Shahroz Mirza)
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

  // Scroll left sidebar container directly to revealing System & Admin items
  await page.evaluate(() => {
    const sidebarNav = document.querySelector('.w-72 .overflow-y-auto') || document.querySelector('aside .overflow-y-auto') || document.querySelector('.overflow-y-auto');
    if (sidebarNav) sidebarNav.scrollTop = 1000;
  });
  await new Promise(r => setTimeout(r, 1000));

  const imgShahrozScrolled = path.join(ARTIFACTS_DIR, '06a_shahroz_super_admin_purge_visible.png');
  await page.screenshot({ path: imgShahrozScrolled });
  console.log(`Saved Shahroz Scrolled: ${imgShahrozScrolled}`);

  // 2. Log in as Donna Cabral (QA Operations Lead)
  await page.evaluate(() => {
    const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('QA OPERATIONS LEAD'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll left sidebar container for Donna Cabral
  await page.evaluate(() => {
    const sidebarNav = document.querySelector('.w-72 .overflow-y-auto') || document.querySelector('aside .overflow-y-auto') || document.querySelector('.overflow-y-auto');
    if (sidebarNav) sidebarNav.scrollTop = 1000;
  });
  await new Promise(r => setTimeout(r, 1000));

  const imgDonnaScrolled = path.join(ARTIFACTS_DIR, '06b_donna_lead_purge_hidden.png');
  await page.screenshot({ path: imgDonnaScrolled });
  console.log(`Saved Donna Scrolled: ${imgDonnaScrolled}`);

  await browser.close();
  console.log('[Scrolled Sidebar Verification] Complete!');
}

run().catch(err => {
  console.error('[Scrolled Sidebar Verification Error]:', err);
  process.exit(1);
});
