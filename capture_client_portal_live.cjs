// capture_client_portal_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  LOGGING IN AS CLIENT AUTOKABEL (JUAN CARLOS)   ");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  page.on('dialog', async dialog => {
    console.log(`AUTO-ACCEPTING DIALOG: "${dialog.message()}"`);
    await dialog.accept();
  });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await sleep(1000);

  // Authenticate as Client Auto Kabel (Juan Carlos)
  console.log("Typing Client login credentials (autokabel / Autokabel2026!)...");
  await page.waitForSelector('#login-username', { timeout: 10000 });
  await page.type('#login-username', 'autokabel');
  await page.type('#login-password', 'Autokabel2026!');
  await page.click('button[type="submit"]');

  console.log("Waiting for Client VIP session unlock...");
  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 10000 });
  await sleep(2500);

  // Take screenshot of the live Client Portal View for Auto Kabel
  const screenshotPath = path.join(__dirname, 'client_portal_live_autokabel.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Client Portal Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'client_portal_live_autokabel.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied authentic screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Auto Kabel Client Portal audit completed successfully!");
})();
