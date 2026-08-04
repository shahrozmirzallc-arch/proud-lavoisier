import puppeteer from 'puppeteer';

async function run() {
  console.log('[Purge Tab DOM Verification] Testing Super-Admin vs Other Roles...');

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  page.on('dialog', async dialog => await dialog.dismiss());

  // 1. Check Super-Admin (Shahroz Mirza)
  let loaded = false;
  for (let i = 0; i < 3; i++) {
    try {
      await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded', timeout: 10000 });
      loaded = true;
      break;
    } catch {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  if (!loaded) {
    throw new Error('Could not load http://localhost:5174/');
  }

  await new Promise(r => setTimeout(r, 2000));

  await page.type('input[placeholder*="username"], input[type="text"]', 'shahroz');
  await page.type('input[type="password"]', 'Shahroz121$');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Sign in to IDS Pulse'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const hasPurgeShahroz = await page.evaluate(() => {
    return document.body.innerText.includes('Clean Database (Purge)');
  });
  console.log(`Shahroz Mirza (Super Admin) sees Clean Database (Purge): ${hasPurgeShahroz}`);

  // 2. Check Operations Lead (Donna Cabral)
  await page.evaluate(() => {
    const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('QA OPERATIONS LEAD'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const hasPurgeDonna = await page.evaluate(() => {
    return document.body.innerText.includes('Clean Database (Purge)');
  });
  console.log(`Donna Cabral (Operations Lead) sees Clean Database (Purge): ${hasPurgeDonna}`);

  // 3. Check Accountant (Colleen Boyd)
  await page.evaluate(() => {
    const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Colleen Boyd') || b.innerText.includes('FINANCIAL CONTROLLER'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const hasPurgeColleen = await page.evaluate(() => {
    return document.body.innerText.includes('Clean Database (Purge)');
  });
  console.log(`Colleen Boyd (Financial Controller) sees Clean Database (Purge): ${hasPurgeColleen}`);

  // 4. Check Client Contact (Stellantis Client)
  await page.evaluate(() => {
    const lockBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lock Session'));
    if (lockBtn) lockBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Stellantis Client') || b.innerText.includes('Mark Vance'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const hasPurgeClient = await page.evaluate(() => {
    return document.body.innerText.includes('Clean Database (Purge)');
  });
  console.log(`Stellantis Client (Mark Vance) sees Clean Database (Purge): ${hasPurgeClient}`);

  await browser.close();

  if (hasPurgeShahroz === true && hasPurgeDonna === false && hasPurgeColleen === false && hasPurgeClient === false) {
    console.log('SUCCESS: Clean Database (Purge) tab is STRICTLY restricted to Super Admin only!');
  } else {
    console.error('FAILURE: Role restriction check failed!');
    process.exit(1);
  }
}

run().catch(err => {
  console.error('[Purge Tab DOM Verification Error]:', err);
  process.exit(1);
});
