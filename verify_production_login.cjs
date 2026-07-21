const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  try {
    const timestamp = new Date().getTime();
    console.log("Navigating to production Vercel URL...");
    await page.goto(`https://proud-lavoisier.vercel.app/?t=${timestamp}`, { waitUntil: 'networkidle0' });
    
    // Inject sessionStorage spy
    await page.evaluateOnNewDocument(() => {
      const origSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        console.log(`SESSION STORAGE SET: ${key} = ${value}`);
        return origSetItem.apply(this, arguments);
      };
    });
    
    console.log("Typing colleen");
    await page.type('input[type="text"]', 'colleen');
    
    console.log("Typing Colleen2026!");
    await page.type('input[type="password"]', 'Colleen2026!');
    
    console.log("Clicking submit");
    await page.click('button[type="submit"]');
    
    // Wait for the dashboard to render
    await new Promise(r => setTimeout(r, 6000));
    
    const screenshotPath = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\66b12867-a02c-4c91-a52d-48c91fdb789a\\puppeteer_production_colleen_dashboard.png';
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot saved to: " + screenshotPath);

    const isDashboard = await page.evaluate(() => {
        return !!document.querySelector('.dashboard-only') || !!document.querySelector('.w-64');
    });
    console.log("Did the dashboard UI render correctly (sidebar found)?", isDashboard);

  } catch (err) {
    console.error("Puppeteer error:", err);
  } finally {
    await browser.close();
  }
})();
