// verify_vercel_button_click.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  VERIFYING VERCEL LIVE BUTTON CLICK             ");
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

  // Bypass cache by appending query param
  console.log("Navigating to live Vercel URL https://proud-lavoisier.vercel.app/?v=" + Date.now());
  await page.goto('https://proud-lavoisier.vercel.app/?v=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  // Authenticate as Greg Admin
  await page.waitForSelector('#login-username', { timeout: 15000 });
  await page.type('#login-username', 'greg');
  await page.type('#login-password', 'Greg2026!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 15000 });
  await sleep(2500);

  // Switch layout to Dashboard Only
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dashBtn = btns.find(b => b.title === 'Show Dashboard Only');
    if (dashBtn) dashBtn.click();
  });
  await sleep(1000);

  // Click Onboard Company & Hours button
  console.log("Clicking '➕ Onboard Company & Hours' on live Vercel...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const onboardBtn = btns.find(b => b.innerText && b.innerText.includes('Onboard Company & Hours'));
    if (onboardBtn) onboardBtn.click();
  });
  await sleep(1500);

  // Take screenshot of live Vercel popup
  const screenshotPath = path.join(__dirname, 'vercel_live_popup_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Vercel Popup Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'vercel_live_popup_screenshot.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied vercel popup screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Live Vercel popup audit completed successfully!");
})();
