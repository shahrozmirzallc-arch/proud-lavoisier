// capture_login_shortcuts_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  CAPTURING LIVE VERCEL LOGIN SCREEN SHORTCUTS   ");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const vercelUrl = 'https://proud-lavoisier.vercel.app/?v=' + Date.now();
  console.log(`Navigating to ${vercelUrl}...`);
  await page.goto(vercelUrl, { waitUntil: 'domcontentloaded' });
  await sleep(3500);

  // Take screenshot of Vercel landing page with 1-click login buttons
  const screenshotPath = path.join(__dirname, 'vercel_login_shortcuts_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Vercel Login Shortcuts Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'vercel_login_shortcuts_live.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied vercel login shortcuts screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Vercel login shortcuts test completed successfully!");
})();
