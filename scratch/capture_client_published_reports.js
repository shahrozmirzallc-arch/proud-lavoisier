import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Puppeteer] Capturing Client Portal Reports View via UI login...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Click 1-Click Client Login
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Client') || b.innerText.includes('CLIENT'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Customer Dashboard (Incidents & Quality Defect Feed)
  const dashPath = path.join(ARTIFACTS_DIR, '07_client_quality_dashboard_feed.png');
  await page.screenshot({ path: dashPath, fullPage: false });
  console.log(`Saved: ${dashPath}`);

  // 2. Published Reports Tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span'));
    const target = btns.find(b => b.innerText && b.innerText.includes('Published Reports'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const reportsPath = path.join(ARTIFACTS_DIR, '08_client_published_reports_tab.png');
  await page.screenshot({ path: reportsPath, fullPage: false });
  console.log(`Saved: ${reportsPath}`);

  await browser.close();
  console.log('[Puppeteer] Client reports capture complete!');
}

run().catch(err => {
  console.error('[Puppeteer Error]:', err);
  process.exit(1);
});
