import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to live Vercel URL...');
  await page.goto('https://proud-lavoisier.vercel.app/', { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });

  console.log('Clicking Magna Client button...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const magnaBtn = btns.find(b => b.textContent && b.textContent.includes('Magna Client'));
    if (magnaBtn) magnaBtn.click();
  });

  await new Promise(r => setTimeout(r, 4000));

  console.log('Clicking Shift Reports Feed sub-tab...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const reportsTab = btns.find(b => b.textContent && b.textContent.includes('Shift Reports Feed'));
    if (reportsTab) reportsTab.click();
  });

  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({
    path: 'C:/Users/Sharoz/.gemini/antigravity/brain/1385a5c7-aa55-420f-8ba0-3717a40bdfcd/live_client_subtab_reports.png',
    fullPage: true
  });

  console.log('Sub-tab reports screenshot captured successfully.');
  await browser.close();
})();
