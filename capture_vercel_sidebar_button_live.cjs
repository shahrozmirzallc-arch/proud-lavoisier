// capture_vercel_sidebar_button_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  CAPTURING LIVE VERCEL SIDEBAR 1-CLICK BUTTON   ");
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

  // Load live Vercel URL with cache buster
  const vercelUrl = 'https://proud-lavoisier.vercel.app/?v=' + Date.now();
  console.log(`Navigating to ${vercelUrl}...`);
  await page.goto(vercelUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Authenticate as Greg Admin
  console.log("Logging in as Greg Admin...");
  await page.waitForSelector('#login-username', { timeout: 15000 });
  await page.type('#login-username', 'greg');
  await page.type('#login-password', 'Greg2026!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 15000 });
  await sleep(2500);

  // Take screenshot showing sidebar with 1-click button on Vercel
  const screenshotPath = path.join(__dirname, 'vercel_sidebar_button_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Vercel Sidebar Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'vercel_sidebar_button_live.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied vercel sidebar screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Vercel sidebar button test completed successfully!");
})();
