// diagnose_user_login_flow.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  DIAGNOSING EXACT USER FLOW ON LIVE VERCEL      ");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  console.log("Navigating to https://proud-lavoisier.vercel.app ...");
  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle0' });
  await sleep(1500);

  // Take screenshot of what a fresh user sees when opening Vercel URL
  const initialScreenshotPath = path.join(__dirname, 'vercel_initial_landing_page.png');
  await page.screenshot({ path: initialScreenshotPath, fullPage: false });
  console.log(`Captured fresh landing page screenshot: ${initialScreenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(initialScreenshotPath, path.join(artifactDir, 'vercel_initial_landing_page.png'));
  }

  await browser.close();
  console.log("Landing page diagnosis complete!");
})();
