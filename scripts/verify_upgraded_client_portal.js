import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating to https://proud-lavoisier.vercel.app/...");
  await page.goto('https://proud-lavoisier.vercel.app/', { waitUntil: 'networkidle0' });

  // Check if already logged in or on login screen
  const userInput = await page.$('input[type="text"]');
  if (userInput) {
    console.log("On login screen, typing credentials...");
    await page.type('input[type="text"]', 'tesla_elon');
    await page.type('input[type="password"]', 'TeslaPassword2026!');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
  } else {
    console.log("Already logged in or in dashboard!");
  }

  // Ensure Customer Portal tab is active
  await page.evaluate(() => {
    const custTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Customer Portal'));
    if (custTab) custTab.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  console.log("Capturing live production screenshot...");
  await page.screenshot({ path: 'C:/Users/Sharoz/.gemini/antigravity/brain/1385a5c7-aa55-420f-8ba0-3717a40bdfcd/live_upgraded_client_portal.png', fullPage: true });

  console.log("Done!");
  await browser.close();
})();
