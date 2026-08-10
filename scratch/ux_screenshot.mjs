import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  console.log('Navigating to live Vercel app...');
  await page.goto('https://proud-lavoisier.vercel.app/', { waitUntil: 'networkidle2', timeout: 60000 });

  // Set logged-in admin user state in localStorage and reload
  await page.evaluate(() => {
    localStorage.setItem('ids_pulse_saved_user', JSON.stringify({
      id: 'usr_donna',
      username: 'donna',
      name: 'Donna Cabral',
      role: 'admin',
      title: 'Operations Lead Admin'
    }));
    sessionStorage.setItem('ids_pulse_role', 'admin');
    sessionStorage.setItem('ids_pulse_username', 'donna');
    window.location.reload();
  });

  console.log('Reloaded page with active admin user session...');
  await new Promise(r => setTimeout(r, 4000));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const clientsRatesBtn = buttons.find(b => b.textContent.includes('Clients & Rates'));
    if (clientsRatesBtn) clientsRatesBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click ONBOARD REPS tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const repsBtn = buttons.find(b => b.textContent.trim() === 'ONBOARD REPS');
    if (repsBtn) repsBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(process.cwd(), 'ux_reps_table_fixed.png') });
  console.log('Saved ux_reps_table_fixed.png');

  // Click MANAGE CUSTOMERS tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const custBtn = buttons.find(b => b.textContent.includes('MANAGE CUSTOMERS'));
    if (custBtn) custBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(process.cwd(), 'ux_customers_table_fixed.png') });
  console.log('Saved ux_customers_table_fixed.png');

  await browser.close();
})();
