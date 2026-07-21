const puppeteer = require('puppeteer');

const users = [
  { u: 'greg', p: 'Greg2026!', expected: 'Dashboard' },
  { u: 'colleen', p: 'Colleen2026!', expected: 'Dashboard' },
  { u: 'monica', p: 'Monica2026!', expected: 'Dashboard' },
  { u: 'iris', p: 'Iris2026!', expected: 'Dashboard' },
  { u: 'donna', p: 'Donna2026!', expected: 'Dashboard' },
  { u: 'miriam', p: 'Miriam2026!', expected: 'Dashboard' },
  { u: 'idspulse', p: 'Pulse2026!', expected: 'Dashboard' },
  { u: 'diana', p: 'DianaPulse2026!', expected: 'Dashboard' },
  { u: 'shahroz', p: 'Shahroz123$', expected: 'Dashboard' },
  { u: 'hugo', p: 'Hugo2026!', expected: 'App' },
  { u: 'nabil', p: 'Nabil2026!', expected: 'App' },
  { u: 'rogelio', p: 'Rogelio2026!', expected: 'App' },
  { u: 'clarence', p: 'Clarence2026!', expected: 'App' }
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  let allPassed = true;

  for (const user of users) {
    let context;
    let page;
    try {
      context = await browser.createBrowserContext(); // Fix: createBrowserContext
      page = await context.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      console.log(`Testing ${user.u}...`);
      await page.goto('https://proud-lavoisier.vercel.app/?t=' + Date.now(), { waitUntil: 'networkidle0', timeout: 30000 });
      
      await page.waitForSelector('input[type="text"]', { timeout: 10000 });
      await page.type('input[type="text"]', user.u);
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.type('input[type="password"]', user.p);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 8000 }).catch(() => {}),
        page.click('button[type="submit"]')
      ]);

      await new Promise(r => setTimeout(r, 1500));
      
      const text = await page.evaluate(() => document.body.innerText);
      
      if (text.includes('AUTHENTICATE SESSION') || text.includes('Invalid')) {
        console.log(`❌ FAILED: ${user.u} - Stuck on login screen.`);
        allPassed = false;
      } else {
        console.log(`✅ PASSED: ${user.u} successfully logged in.`);
      }
      
      await page.close();
      await context.close();
    } catch (err) {
      console.log(`❌ ERROR on ${user.u}:`, err.message);
      allPassed = false;
      if (page) await page.close().catch(()=>{});
      if (context) await context.close().catch(()=>{});
    }
  }

  if (allPassed) {
    console.log('\n🎉 ALL 13 USERS SUCCESSFULLY VERIFIED ON PRODUCTION URL!');
  } else {
    console.log('\n⚠️ SOME LOGINS FAILED.');
  }

  await browser.close();
})();
