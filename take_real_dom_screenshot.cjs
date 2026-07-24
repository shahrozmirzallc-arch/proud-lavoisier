// take_real_dom_screenshot.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("Launching Chrome to capture REAL LIVE REACT DOM screenshot...");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Open page and log in via UI inputs
  console.log("Navigating to http://localhost:4173...");
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  await sleep(1000);

  // Focus and type credentials
  console.log("Typing login credentials...");
  await page.focus('#login-username');
  await page.keyboard.type('greg');
  await page.focus('#login-password');
  await page.keyboard.type('Greg2026!');
  await page.keyboard.press('Enter');
  await sleep(2500);

  // Navigate to Rates & Clients
  console.log("Navigating to Rates & Clients...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const accBtn = btns.find(b => b.innerText.includes('Accounting') || b.innerText.includes('Rates') || b.innerText.includes('Clients'));
    if (accBtn) accBtn.click();
  });
  await sleep(1200);

  // Click Manage Customers tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const subBtn = btns.find(b => b.innerText.includes('Manage Customers') || b.innerText.includes('Rates & Clients Config'));
    if (subBtn) subBtn.click();
  });
  await sleep(1200);

  // Fill in Abc123 Customer Onboarding form with 20 Allotted Hours
  console.log("Filling form inputs...");
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
  await sleep(800);

  // Find the exact form container element in the DOM
  console.log("Searching for form DOM element...");
  const formElement = await page.$('form');
  const tableElement = await page.$('.grid-cols-3') || formElement || await page.$('main');

  const screenshotPath = path.join(__dirname, 'real_live_dom_client_budget.png');
  if (tableElement) {
    await tableElement.screenshot({ path: screenshotPath });
    console.log(`REAL LIVE DOM element screenshot captured at: ${screenshotPath}`);
  } else {
    await page.screenshot({ path: screenshotPath });
    console.log(`Fallback page screenshot captured at: ${screenshotPath}`);
  }

  // Copy to brain artifacts dir
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'real_live_dom_client_budget.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied REAL screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Real DOM screenshot verification completed!");
})();
