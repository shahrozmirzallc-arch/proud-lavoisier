const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle0' });

  await page.type('#username', 'Shahroz');
  await page.type('#password', 'Shahroz123$');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));
  await page.screenshot({ path: 'scratch/grouped_tabs_live.png' });
  console.log('Successfully captured screenshot of live grouped navigation sidebar.');
  await browser.close();
})();
