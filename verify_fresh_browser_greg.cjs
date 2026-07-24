// verify_fresh_browser_greg.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  TESTING GREG LOGIN ON CLEAN BROWSER SESSION    ");
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

  // Clear cache completely
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');

  const vercelUrl = 'https://proud-lavoisier.vercel.app/?t=' + Date.now();
  console.log(`Navigating to ${vercelUrl}...`);
  await page.goto(vercelUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3000);

  // Authenticate as Greg
  console.log("Logging in as Greg...");
  await page.waitForSelector('#login-username', { timeout: 10000 });
  await page.type('#login-username', 'greg');
  await page.type('#login-password', 'Greg2026!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 10000 });
  await sleep(3000);

  // Take screenshot
  const screenshotPath = path.join(__dirname, 'fresh_greg_live_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Fresh Greg Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'fresh_greg_live_screenshot.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied fresh greg screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Fresh Greg login test completed successfully!");
})();
