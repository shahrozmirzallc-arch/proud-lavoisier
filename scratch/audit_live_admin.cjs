const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Auditing Live Vercel Admin view...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle2' });

  // Click Donna Cabral (Admin) login
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find(b => b.textContent.includes('Donna'));
    if (adminBtn) adminBtn.click();
  });

  await new Promise(r => setTimeout(r, 4000));

  // Capture Live Admin Web Dashboard
  const ssPath = path.join(__dirname, 'live_admin_dashboard.png');
  await page.screenshot({ path: ssPath });
  console.log('Saved Live Admin Dashboard Screenshot:', ssPath);

  // Inspect Sidebar text
  const sidebarItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a, span'))
      .map(el => el.textContent.trim())
      .filter(t => t.toLowerCase().includes('timesheet') || t.toLowerCase().includes('expense') || t.toLowerCase().includes('payroll'));
  });

  console.log('Found Navigation Items on Live Web Dashboard:', sidebarItems.slice(0, 10));

  await browser.close();
})();
