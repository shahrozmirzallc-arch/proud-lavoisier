const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 60000 });

  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'colleen');
  await page.waitForSelector('input[type="password"]');
  await page.type('input[type="password"]', 'Colleen2026!');

  // Click the submit button using evaluate
  await page.evaluate(() => {
    document.querySelector('button[type="submit"]').click();
  });

  // Wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log("SCREEN TEXT:\n", text);
  
  await browser.close();
})();
