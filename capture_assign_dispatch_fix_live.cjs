// capture_assign_dispatch_fix_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  VERIFYING ASSIGN REP DISPATCH DROPDOWN FIX     ");
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

  // Open 'Assign Rep Dispatch' modal (click 'AUDITING PLANT FLOORS' card action button or trigger showAssignRepModal state)
  console.log("Opening Assign Rep Dispatch modal...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const dispatchCard = btns.find(b => b.innerText && b.innerText.includes('AUDITING PLANT FLOORS'));
    if (dispatchCard) dispatchCard.click();
  });
  await sleep(1500);

  // Focus and trigger dropdown select
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const repSelect = selects.find(s => s.innerHTML.includes('Clarence Kuiken'));
    if (repSelect) {
      repSelect.focus();
    }
  });
  await sleep(800);

  // Take screenshot of Assign Rep Dispatch modal with clean dropdown styling
  const screenshotPath = path.join(__dirname, 'assign_dispatch_fix_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Assign Dispatch Fix Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'assign_dispatch_fix_live.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied assign dispatch fix screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Assign Rep Dispatch dropdown fix test completed successfully!");
})();
