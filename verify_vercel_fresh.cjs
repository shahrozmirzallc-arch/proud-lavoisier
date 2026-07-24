const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=================================================');
  console.log(' FRESH UNCACHED VERCEL DEPLOYMENT AUDIT          ');
  console.log('=================================================');

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Bypass browser cache completely
    await page.setCacheEnabled(false);

    const freshUrl = `https://proud-lavoisier.vercel.app/?uncache=${Date.now()}`;
    console.log(`Navigating to ${freshUrl}...`);
    const response = await page.goto(freshUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
    
    console.log('Response Status:', response.status());
    await new Promise(r => setTimeout(r, 3000));

    // Check script tags served
    const scriptSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    });
    console.log('Served Script Assets:', scriptSrcs);

    // Clear localStorage to force fresh initial render
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));

    // Take screenshot after fresh cache clearing
    const screenshotPath = path.join(__dirname, 'vercel_fresh_uncached.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Saved fresh uncached screenshot to:', screenshotPath);

    // Copy to artifacts
    const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(screenshotPath, path.join(artifactDir, 'vercel_fresh_uncached.png'));
    }

    console.log('Fresh audit completed successfully!');
  } catch (err) {
    console.error('Error during fresh Vercel audit:', err);
  } finally {
    await browser.close();
  }
})();
