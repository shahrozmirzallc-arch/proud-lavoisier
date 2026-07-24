// take_client_budget_screenshot.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("Launching headless Chrome browser for clean dashboard capture...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating to http://localhost:4173...");
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await sleep(1000);

  // Type credentials and press Enter
  console.log("Submitting login form...");
  await page.waitForSelector('#login-username', { timeout: 10000 });
  await page.focus('#login-username');
  await page.keyboard.type('greg');
  await page.focus('#login-password');
  await page.keyboard.type('Greg2026!');
  await page.keyboard.press('Enter');
  await sleep(3000);

  // Click on "Rates & Clients" or "Accounting" tab
  console.log("Clicking Rates & Clients tab...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accBtn = btns.find(b => b.innerText.includes('Accounting') || b.innerText.includes('Rates'));
    if (accBtn) accBtn.click();
  });
  await sleep(1200);

  // Click Rates & Clients Config sub-tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const subBtn = btns.find(b => b.innerText.includes('Rates & Clients Config'));
    if (subBtn) subBtn.click();
  });
  await sleep(1200);

  // Fill in Abc123 Customer Onboarding form with 20 Allotted Hours
  console.log("Populating Abc123 customer form with 20 Allotted Hours...");
  await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input'));
    inputs.forEach(input => {
      const ph = input.getAttribute('placeholder') || '';
      if (ph === 'Auto Kabel') input.value = 'Abc123';
      else if (ph === 'Juan Carlos') input.value = 'Mike Johnson';
      else if (ph === 'jc@autokabel.mx') input.value = 'mike@abc123.com';
      else if (ph.includes('20')) input.value = '20';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  await sleep(1000);

  // Take screenshot
  const screenshotPath = path.join(__dirname, 'audit_client_budget_20hrs.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Live screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts dir
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'audit_client_budget_20hrs.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Screenshot verification completed!");
})();
