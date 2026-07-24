// capture_customer_fields_zoom.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  CAPTURING CUSTOMER FORM & REPRESENTATIVE FIELDS ");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1100']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });

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

  // Click Timesheets & Logging sidebar button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tsBtn = btns.find(b => b.innerText && b.innerText.includes('Timesheets & Logging'));
    if (tsBtn) tsBtn.click();
  });
  await sleep(1500);

  // Select Clients & Rates sub-tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const clientsRatesSubTab = btns.find(b => b.innerText && b.innerText.includes('Clients & Rates'));
    if (clientsRatesSubTab) clientsRatesSubTab.click();
  });
  await sleep(1500);

  // Target the grid container element directly for close-up view
  const gridContainer = await page.$('.grid-cols-3');
  const screenshotPath = path.join(__dirname, 'customer_fields_zoom_screenshot.png');

  if (gridContainer) {
    await gridContainer.screenshot({ path: screenshotPath });
  } else {
    await page.screenshot({ path: screenshotPath });
  }

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'customer_fields_zoom_screenshot.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied zoom screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Customer fields zoom screenshot captured successfully!");
})();
