// verify_vercel_uncached.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  TESTING VERCEL UNCACHED HARD RELOAD            ");
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

  // Force cache disable via DevTools
  await page.setCacheEnabled(false);

  const vercelUrl = 'https://proud-lavoisier.vercel.app/?force_refresh=' + Date.now();
  console.log(`Navigating to ${vercelUrl}...`);
  await page.goto(vercelUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Authenticate as Greg
  await page.waitForSelector('#login-username', { timeout: 10000 });
  await page.type('#login-username', 'greg');
  await page.type('#login-password', 'Greg2026!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 10000 });
  await sleep(3000);

  // Take screenshot
  const screenshotPath = path.join(__dirname, 'uncached_greg_live_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Uncached Greg Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'uncached_greg_live_screenshot.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied uncached greg screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Uncached Greg test completed successfully!");
})();
