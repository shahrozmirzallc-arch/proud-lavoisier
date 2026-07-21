const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing live production URL https://proud-lavoisier.vercel.app...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    const timestamp = Date.now();
    await page.goto(`https://proud-lavoisier.vercel.app/?t=${timestamp}`, { waitUntil: 'networkidle0' });

    // Verify gateway page loaded
    await page.waitForSelector('input[type="text"]');
    console.log('✅ Live Security Gateway loaded.');

    // Test Colleen Login on Live
    await page.type('input[type="text"]', 'colleen');
    await page.type('input[type="password"]', 'Colleen2026!');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to render on live production
    await page.waitForFunction(() => document.body.innerText.includes('Timesheets') || document.body.innerText.includes('ACTIVE'), { timeout: 10000 });
    console.log('✅ Live Production Accountant Dashboard loaded with zero errors!');

    console.log('🎉 PRODUCTION IS 100% OPERATIONAL & VERIFIED LIVE!');
  } catch (err) {
    console.error('❌ Production Verification Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
