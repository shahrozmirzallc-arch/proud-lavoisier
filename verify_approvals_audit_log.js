import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to live Vercel production site...');
  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2' });

  // Check if login needed
  const usernameInput = await page.$('input[placeholder*="username" i], input[type="text"]');
  if (usernameInput) {
    console.log('Logging in as test_company...');
    await page.type('input[placeholder*="username" i], input[type="text"]', 'test_company');
    await page.type('input[type="password"]', 'IDSPulse2026!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  }

  await new Promise(r => setTimeout(r, 4000));

  // Click Time & Approvals tab on the sidebar
  console.log('Clicking Time & Approvals button...');
  const approvalsBtn = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.trim().includes('Time & Approvals'));
  });

  if (approvalsBtn) {
    await approvalsBtn.click();
    await new Promise(r => setTimeout(r, 2000));
  }

  // Take screenshot of live Time & Approvals with decision audit log
  const screenshotPath = path.resolve('overtime_decision_audit_log_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Screenshot captured at:', screenshotPath);

  // Copy screenshot to artifacts folder
  const artifactPath = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f\\overtime_decision_audit_log_live.png';
  const fs = await import('fs');
  fs.copyFileSync(screenshotPath, artifactPath);
  console.log('Copied to artifact path:', artifactPath);

  await browser.close();
})();
