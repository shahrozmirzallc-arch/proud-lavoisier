const puppeteer = require('puppeteer');

(async () => {
  console.log('=================================================');
  console.log(' AUDITING BROWSER CONSOLE ERRORS ON VERCEL LIVE ');
  console.log(' URL: https://proud-lavoisier.vercel.app         ');
  console.log('=================================================');

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(err.toString());
    });

    page.on('requestfailed', request => {
      failedRequests.push(`${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('Navigating to https://proud-lavoisier.vercel.app...');
    const response = await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Response HTTP Status:', response.status());
    await new Promise(r => setTimeout(r, 4000));

    console.log('\n--- BROWSER CONSOLE ERRORS ---');
    if (errors.length === 0) {
      console.log('NONE! Zero console errors detected.');
    } else {
      errors.forEach((e, idx) => console.log(`${idx + 1}. ${e}`));
    }

    console.log('\n--- FAILED NETWORK REQUESTS ---');
    if (failedRequests.length === 0) {
      console.log('NONE! All script/CSS assets loaded cleanly.');
    } else {
      failedRequests.forEach((f, idx) => console.log(`${idx + 1}. ${f}`));
    }

    // Check root DOM element content
    const rootHTML = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.substring(0, 300) : 'NO ROOT ELEMENT FOUND';
    });
    console.log('\n--- ROOT DOM INNER HTML ---');
    console.log(rootHTML);

  } catch (err) {
    console.error('Audit script exception:', err);
  } finally {
    await browser.close();
  }
})();
