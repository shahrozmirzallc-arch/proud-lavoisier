const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Fill login form
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', 'Shahroz');
  await page.type('input[name="password"]', 'Shahroz123$');
  await page.click('button[type="submit"]');
  
  await new Promise(r => setTimeout(r, 4000));

  // Get all options in all select elements on page
  const allSelects = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    return selects.map(s => Array.from(s.querySelectorAll('option')).map(o => o.textContent.trim()));
  });
  
  console.log('ALL SELECT OPTIONS ON PAGE:', JSON.stringify(allSelects, null, 2));
  
  await browser.close();
})();
