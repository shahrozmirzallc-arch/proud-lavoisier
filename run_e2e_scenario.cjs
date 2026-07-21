const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const artifactDir = process.env.ARTIFACT_DIR || path.join(__dirname, '.tempmediaStorage');
if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('Logging in as Greg (Admin)...');
    await page.goto('https://proud-lavoisier.vercel.app/?t=' + Date.now(), { waitUntil: 'networkidle0' });
    await page.waitForSelector('input[type="text"]');
    await page.type('input[type="text"]', 'greg');
    await page.type('input[type="password"]', 'Greg2026!');
    
    await page.click('button[type="submit"]');
    
    // Wait for client-side render to finish (dashboard should appear)
    await new Promise(r => setTimeout(r, 4000));
    console.log('Taking empty dashboard screenshot...');
    await page.screenshot({ path: path.join(artifactDir, '1_dashboard_empty.png') });

    console.log('Clicking "Restore Demo Seeds"...');
    // Find and click the Restore Demo Seeds button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const seedBtn = buttons.find(b => b.innerText.includes('Restore Demo Seeds'));
      if (seedBtn) seedBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000)); // Wait for data to populate and charts to render
    console.log('Taking populated dashboard screenshot...');
    await page.screenshot({ path: path.join(artifactDir, '2_dashboard_populated.png') });

    console.log('Navigating to Timesheets...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div, button'));
      const tsTab = tabs.find(b => b.innerText && b.innerText.includes('INVOICING, RATES & PAYROLL PORTAL'));
      if (tsTab) tsTab.click();
    });

    await new Promise(r => setTimeout(r, 3000));
    console.log('Taking timesheets screenshot...');
    await page.screenshot({ path: path.join(artifactDir, '3_timesheets_populated.png') });

    console.log('Scenario completed successfully!');
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    await browser.close();
  }
})();
