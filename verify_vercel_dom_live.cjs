// verify_vercel_dom_live.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log("  INSPECTING LIVE VERCEL DOM FOR ONBOARD BUTTON  ");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  const vercelUrl = 'https://proud-lavoisier.vercel.app/?v=' + Date.now();
  console.log(`Navigating to ${vercelUrl}...`);
  await page.goto(vercelUrl, { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  // Authenticate as Greg
  await page.type('#login-username', 'greg');
  await page.type('#login-password', 'Greg2026!');
  await page.click('button[type="submit"]');
  await sleep(4000);

  // Check if button text 'Onboard Company & Hours' exists in DOM
  const buttonTexts = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, span, div'));
    return btns.filter(b => b.innerText && b.innerText.includes('Onboard Company')).map(b => ({
      tagName: b.tagName,
      className: b.className,
      innerText: b.innerText
    }));
  });

  console.log("Found Onboard Company elements on live Vercel DOM:", JSON.stringify(buttonTexts, null, 2));

  // Take screenshot of live Vercel
  const screenshotPath = path.join(__dirname, 'vercel_dom_inspection_live.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Authentic Live Vercel DOM Screenshot captured at: ${screenshotPath}`);

  // Copy to brain artifacts directory
  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    const artifactPath = path.join(artifactDir, 'vercel_dom_inspection_live.png');
    fs.copyFileSync(screenshotPath, artifactPath);
    console.log(`Copied vercel dom inspection screenshot to artifacts dir: ${artifactPath}`);
  }

  await browser.close();
  console.log("Vercel DOM inspection completed successfully!");
})();
