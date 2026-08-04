import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Step 5 Admin Master Archival] Executing Step 5: Super Admin Shahroz Mirza...');

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

  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch {
    console.log('Falling back to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
  }

  await new Promise(r => setTimeout(r, 1000));

  // Log in as Shahroz Mirza (Super Admin) or Admin 1-click
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const userIn = inputs.find(i => i.placeholder && i.placeholder.includes('username'));
    const passIn = inputs.find(i => i.type === 'password');

    if (userIn) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(userIn, 'shahroz');
      userIn.dispatchEvent(new Event('input', { bubbles: true }));
    }
    if (passIn) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(passIn, 'Shahroz121$');
      passIn.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const btns = Array.from(document.querySelectorAll('button'));
    const subBtn = btns.find(b => b.innerText && (b.innerText.includes('Sign In') || b.innerText.includes('Log In')));
    if (subBtn) subBtn.click();
  });
  await new Promise(r => setTimeout(r, 2500));

  // If still on login screen, use Admin 1-click shortcut
  const isStillOnLogin = await page.evaluate(() => !!document.querySelector('input[type="password"]'));
  if (isStillOnLogin) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('ADMIN'));
      if (target) target.click();
    });
    await new Promise(r => setTimeout(r, 2500));
  }

  // 1. Capture Shahroz's Super Admin Command Center Overview
  const imgShahrozDash = path.join(ARTIFACTS_DIR, '05a_shahroz_super_admin_command_center.png');
  await page.screenshot({ path: imgShahrozDash, fullPage: true });
  console.log(`Saved 05a: ${imgShahrozDash}`);

  // 2. Click "System Events Logs" tab in left workspace nav
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText && b.innerText.includes('System Events Logs'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const imgAuditLogs = path.join(ARTIFACTS_DIR, '05b_shahroz_system_event_audit_logs.png');
  await page.screenshot({ path: imgAuditLogs, fullPage: true });
  console.log(`Saved 05b: ${imgAuditLogs}`);

  await browser.close();
  console.log('[Step 5 Admin Master Archival] Complete!');
}

run().catch(err => {
  console.error('[Step 5 Admin Master Archival Error]:', err);
  process.exit(1);
});
