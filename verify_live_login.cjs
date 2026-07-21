const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Use a query string to bust cache
  await page.goto('https://proud-lavoisier.vercel.app/?t=' + Date.now(), { waitUntil: 'networkidle0', timeout: 60000 });

  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'colleen');
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'Colleen2026!');

  // Click the submit button using page.click (more robust than evaluate in some cases)
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}), // Ignore if it doesn't navigate
    page.click('button[type="submit"]')
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log("SCREEN TEXT:\n", text);
  
  await browser.close();
})();
