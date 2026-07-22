const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle0' });
  
  // Fill login
  await page.type('#username', 'Shahroz');
  await page.type('#password', 'Shahroz123$');
  await page.click('button[type="submit"]');
  
  await page.waitForSelector('button:has-text("Time & Approvals"), span:has-text("Time & Approvals")', { timeout: 10000 }).catch(() => {});
  
  // Click Time & Approvals tab
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('Time & Approvals')) {
      await tab.click();
      break;
    }
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Get all options in the supplier dropdown
  const options = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'));
    const invoiceSelect = selects.find(s => s.textContent.includes('Magna') || s.textContent.includes('Auto-Kabel') || s.textContent.includes('General Motors'));
    if (!invoiceSelect) return [];
    return Array.from(invoiceSelect.querySelectorAll('option')).map(o => ({ text: o.textContent, value: o.value }));
  });
  
  console.log('FOUND DROPDOWN OPTIONS:', JSON.stringify(options, null, 2));
  
  await page.screenshot({ path: 'scratch/all_suppliers_live.png' });
  await browser.close();
})();
