import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 1 Add Contact Submit] Submitting new Client Contact David Miller...');
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

  // Click + Add Contact button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText && b.innerText.includes('+ Add Contact'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Fill in form inputs
  const inputs = await page.$$('input');
  if (inputs.length >= 3) {
    await inputs[inputs.length - 3].type('David Miller');
    await inputs[inputs.length - 2].type('Plant Operations Supervisor');
    await inputs[inputs.length - 1].type('david.miller@magna.com');
  }

  // Click Save Contact button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText && b.innerText.includes('Save Contact'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const submittedPath = path.join(ARTIFACTS_DIR, '01g_magna_3_contacts_registered_live.png');
  await page.screenshot({ path: submittedPath, fullPage: false });
  console.log(`Saved Submitted Screenshot: ${submittedPath}`);

  await browser.close();
  console.log('[Step 1 Add Contact Submit] Complete!');
}

run().catch(err => {
  console.error('[Step 1 Add Contact Submit Error]:', err);
  process.exit(1);
});
