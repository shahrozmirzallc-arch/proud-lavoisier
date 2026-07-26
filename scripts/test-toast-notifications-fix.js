import puppeteer from 'puppeteer';
import path from 'path';

const BASE_URL = 'http://localhost:4188';
const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';

async function testToastNotificationsFix() {
  console.log('Testing toast notification UI positioning and backdrop fix...');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // Login as Diana Admin
  const userInp = await page.$('#login-username');
  const passInp = await page.$('#login-password');
  if (userInp && passInp) {
    await userInp.type('diana', { delay: 20 });
    await passInp.type('Diana2026!', { delay: 20 });
    const submitBtn = await page.$('button.login-submit');
    if (submitBtn) await submitBtn.click();
    await new Promise(r => setTimeout(r, 3000));
  }

  // Trigger test notifications
  await page.evaluate(() => {
    // Dispatch a sync event or window custom event to trigger toast
    if (window.dispatchEvent) {
      const evt = new CustomEvent('ids_pulse_sync_error', { detail: { table: 'shiftReports' } });
      window.dispatchEvent(evt);
    }
  });

  await new Promise(r => setTimeout(r, 1000));

  const screenshotPath = path.join(ARTIFACTS_DIR, 'toast_notifications_fixed_position_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Toast Notification Fix Screenshot Captured: ${screenshotPath}`);

  await browser.close();
}

testToastNotificationsFix().catch(console.error);
