import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = 'C:/Users/Sharoz/.gemini/antigravity/brain/4c35684b-2cd3-442f-8986-5b75cde644e6';

async function main() {
  console.log('[1/4] Booting Vite Dev Server programmatically on port 5199...');
  const server = await createServer({
    root: path.resolve(__dirname, '..'),
    server: { port: 5199 }
  });
  await server.listen();
  console.log('Vite server running at http://localhost:5199');

  console.log('[2/4] Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log('[3/4] Navigating to dashboard...');
    await page.goto('http://localhost:5199', { waitUntil: 'networkidle0', timeout: 30000 });

    // Click Donna 1-click bypass button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const donnaBtn = btns.find(b => b.textContent && (b.textContent.includes('Donna') || b.textContent.includes('Director')));
      if (donnaBtn) donnaBtn.click();
    });

    await new Promise(r => setTimeout(r, 2500));

    // Click Operations Hub button in sidebar
    console.log('[4/4] Capturing screenshots of Operations Hub views...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const hubBtn = btns.find(b => b.textContent && b.textContent.includes('Operations Hub'));
      if (hubBtn) hubBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));

    // 1. Master Operations Matrix Table
    const p1 = path.join(ARTIFACTS_DIR, 'operations_hub_01_master_matrix.png');
    await page.screenshot({ path: p1 });
    console.log('Saved: ' + p1);

    // 2. User Accounts View
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const uBtn = btns.find(b => b.textContent && b.textContent.includes('User Accounts & Logins'));
      if (uBtn) uBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const p2 = path.join(ARTIFACTS_DIR, 'operations_hub_02_user_accounts.png');
    await page.screenshot({ path: p2 });
    console.log('Saved: ' + p2);

    // 3. Projects & PO Budgets View
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const prBtn = btns.find(b => b.textContent && b.textContent.includes('Projects & PO Budgets'));
      if (prBtn) prBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const p3 = path.join(ARTIFACTS_DIR, 'operations_hub_03_projects_budgets.png');
    await page.screenshot({ path: p3 });
    console.log('Saved: ' + p3);

    // 4. Clients & Plants Directory View
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cBtn = btns.find(b => b.textContent && b.textContent.includes('Clients & Plants Directory'));
      if (cBtn) cBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const p4 = path.join(ARTIFACTS_DIR, 'operations_hub_04_clients_directory.png');
    await page.screenshot({ path: p4 });
    console.log('Saved: ' + p4);

    console.log('SUCCESS: All 4 Operations Hub views captured perfectly!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
    await server.close();
  }
}

main();
