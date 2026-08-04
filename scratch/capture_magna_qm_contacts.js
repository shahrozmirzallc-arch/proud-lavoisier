import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 1 Detail] Capturing Magna QM Contacts detail view & +Add Contact button...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Log in as Admin (Donna Cabral)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('ADMIN'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click Suppliers Directory tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span'));
    const target = btns.find(b => b.innerText && b.innerText.includes('Suppliers Directory'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const screenshotPath = path.join(ARTIFACTS_DIR, '01e_magna_add_contact_button_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Saved Detail Screenshot: ${screenshotPath}`);

  await browser.close();
  console.log('[Step 1 Detail] Complete!');
}

run().catch(err => {
  console.error('[Step 1 Detail Error]:', err);
  process.exit(1);
});
