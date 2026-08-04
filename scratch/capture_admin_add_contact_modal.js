import puppeteer from 'puppeteer';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Admin Contact Location] Capturing Admin User Directory & Onboarding Modal...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();

  await page.goto('http://localhost:5174/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  // Log in as Admin (Donna Cabral)
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const target = btns.find(b => b.innerText.includes('Donna Cabral') || b.innerText.includes('ADMIN'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click User Directory tab
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span'));
    const target = btns.find(b => b.innerText && b.innerText.includes('User Directory'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const userDirImg = path.join(ARTIFACTS_DIR, '01c_admin_user_directory.png');
  await page.screenshot({ path: userDirImg, fullPage: false });
  console.log(`Saved User Directory: ${userDirImg}`);

  // Click Onboard Client & Hours (+NEW) button
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span'));
    const target = btns.find(b => b.innerText && b.innerText.includes('Onboard Client & Hours'));
    if (target) target.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const onboardModalImg = path.join(ARTIFACTS_DIR, '01d_admin_onboard_client_modal.png');
  await page.screenshot({ path: onboardModalImg, fullPage: false });
  console.log(`Saved Onboarding Modal: ${onboardModalImg}`);

  await browser.close();
  console.log('[Admin Contact Location] Complete!');
}

run().catch(err => {
  console.error('[Admin Contact Location Error]:', err);
  process.exit(1);
});
