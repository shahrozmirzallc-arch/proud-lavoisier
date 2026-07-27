import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('Navigating to local preview server...');
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForSelector('#login-username', { timeout: 10000 });
    await page.type('#login-username', 'diana');
    await page.type('#login-password', 'Diana2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));

    await page.evaluate(() => {
      window.scrollTo(0, 600);
      const elements = document.querySelectorAll('.overflow-y-auto');
      elements.forEach(el => el.scrollTop = 600);
    });
    await new Promise(r => setTimeout(r, 1000));

    const screenshotPath = path.join(process.cwd(), 'relocated_metrics_proof.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Proof screenshot saved to:', screenshotPath);
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
})();
