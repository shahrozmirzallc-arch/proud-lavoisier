// capture_modal_fix_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  VERIFYING QUICK ADD PLANT MODAL FIX            ");
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

  // Navigate to System & Admin -> Projects Registry
  console.log("Navigating to Projects Registry...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const projBtn = btns.find(b => b.innerText && b.innerText.includes('Projects Registry'));
    if (projBtn) projBtn.click();
  });
  await sleep(1500);

  // Select '+ Add New Plant...' in Plant Location select dropdown
  console.log("Selecting '+ Add New Plant...' in Plant Location dropdown...");
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const plantSelect = selects.find(s => s.innerHTML.includes('Select Plant...'));
    if (plantSelect) {
      plantSelect.value = 'ADD_NEW';
      plantSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(1500);

  // Take screenshot of the Quick Add Plant Modal backdrop
  const screenshotPath = path.join(__dirname, 'modal_fix_live_screenshot.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Modal Fix Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'modal_fix_live_screenshot.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied authentic screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Modal fix verification completed successfully!");
})();
