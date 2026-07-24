// capture_shahroz_login_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  VERIFYING SHAHROZ SUPER ADMIN LOGIN & DASHBOARD");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await sleep(1000);

  // Authenticate as Shahroz Super Admin
  await page.waitForSelector('#login-username', { timeout: 10000 });
  await page.type('#login-username', 'shahroz');
  await page.type('#login-password', 'Shahroz123$');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 10000 });
  await sleep(2500);

  // Take screenshot of Shahroz Super Admin Dashboard
  const screenshotPath = path.join(__dirname, 'shahroz_dashboard_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Shahroz Dashboard Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'shahroz_dashboard_live.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied shahroz dashboard screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Shahroz login test completed successfully!");
})();
