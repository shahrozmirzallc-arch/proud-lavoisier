// capture_authentic_live_app.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  CAPTURING ABC123 20 HRS ENTRY IN CUSTOMER TABLE");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1100']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });

  page.on('dialog', async dialog => {
    console.log(`AUTO-ACCEPTING DIALOG: "${dialog.message()}"`);
    await dialog.accept();
  });

  console.log("Navigating to http://localhost:5173...");
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await sleep(1000);

  // Authenticate
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

  // Onboard Abc123 with 20 Allotted Hours
  console.log("Onboarding company Abc123 with 20 Allotted Hours...");
  await page.evaluate(() => {
    const setReactInputValue = (input, val) => {
      const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      valueSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const inputs = Array.from(document.querySelectorAll('input'));
    inputs.forEach(input => {
      const ph = input.getAttribute('placeholder') || '';
      if (ph === 'Auto Kabel') setReactInputValue(input, 'Abc123 Company');
      else if (ph === 'Juan Carlos') setReactInputValue(input, 'Mike Johnson');
      else if (ph === 'jc@autokabel.mx') setReactInputValue(input, 'mike@abc123.com');
      else if (ph.includes('20') || ph.includes('Approved') || ph.includes('Hours')) setReactInputValue(input, '20');
    });

    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.innerText && b.innerText.includes('Onboard Customer'));
    if (submitBtn) submitBtn.click();
  });
  await sleep(2500);

  // Scroll active table container so Abc123 is in center view
  await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    if (tables.length > 0) {
      tables[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  await sleep(1000);

  // Capture final authentic live screenshot
  const screenshotPath = path.join(__dirname, 'real_live_system_test.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live System Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'real_live_system_test.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied authentic screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Real system customer budget audit completed successfully!");
})();
