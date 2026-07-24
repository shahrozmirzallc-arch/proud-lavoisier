// capture_fast_onboard_hub_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  CAPTURING FAST ONBOARD COMPANY & HOURS HUB HUB  ");
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

  // Authenticate as Greg Admin
  await page.waitForSelector('#login-username', { timeout: 10000 });
  await page.type('#login-username', 'greg');
  await page.type('#login-password', 'Greg2026!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 10000 });
  await sleep(2000);

  // Switch layout to Dashboard Only
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dashBtn = btns.find(b => b.title === 'Show Dashboard Only');
    if (dashBtn) dashBtn.click();
  });
  await sleep(800);

  // Click top header button '➕ Onboard Company & Hours'
  console.log("Clicking '➕ Onboard Company & Hours' header button...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const onboardBtn = btns.find(b => b.innerText && b.innerText.includes('Onboard Company & Hours'));
    if (onboardBtn) onboardBtn.click();
  });
  await sleep(1200);

  // Take screenshot of the new fast onboarding modal
  const screenshotPath = path.join(__dirname, 'fast_onboard_hub_live_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Fast Onboard Hub Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'fast_onboard_hub_live_screenshot.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied fast onboard screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Fast onboard hub test completed successfully!");
})();
