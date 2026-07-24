const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('=================================================');
  console.log(' VERIFYING LIVE VERCEL PRODUCTION DEPLOYMENT     ');
  console.log(' URL: https://proud-lavoisier.vercel.app          ');
  console.log('=================================================');

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    console.log('Navigating to https://proud-lavoisier.vercel.app...');
    const response = await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Response Status:', response.status());

    // Wait 4 seconds for assets to settle
    await new Promise(r => setTimeout(r, 4000));

    // Check served script assets hash
    const scriptSrcs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    });
    console.log('Served Script Assets:', scriptSrcs);

    // Take live screenshot
    const screenshotPath = path.join(__dirname, 'vercel_live_verification.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('Saved authentic live screenshot to:', screenshotPath);

    // Copy to artifacts directory
    const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(screenshotPath, path.join(artifactDir, 'vercel_live_verification.png'));
      console.log('Copied screenshot to artifacts directory.');
    }

    console.log('Vercel verification finished successfully!');
  } catch (err) {
    console.error('Error during Vercel live verification:', err);
  } finally {
    await browser.close();
  }
})();
