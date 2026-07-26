import puppeteer from 'puppeteer';

const artifactPath = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f\\executive_dashboard_live_screenshot.png';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function capture() {
  console.log("Launching browser for Command Center capture...");
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1536, height: 1100 }
  });
  const page = await browser.newPage();
  
  console.log("Navigating to https://proud-lavoisier.vercel.app...");
  await page.goto('https://proud-lavoisier.vercel.app', { waitUntil: 'networkidle0' });
  await sleep(2000);
  
  const userField = await page.$('#login-username');
  if (userField) {
    console.log("Entering credentials for shahroz...");
    await page.type('#login-username', 'shahroz');
    await page.type('#login-password', 'Shahroz123$');
    await sleep(500);
    
    console.log("Submitting login form...");
    await page.click('button[type="submit"]');
    await sleep(5000);
  }

  // Click on "Live Command Center" tab button
  console.log("Clicking on 'Live Command Center' sidebar tab...");
  const commandCenterBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.textContent.includes('Live Command Center'));
  });

  if (commandCenterBtn && commandCenterBtn.asElement()) {
    await commandCenterBtn.asElement().click();
    await sleep(3000);
    console.log("Successfully switched to Live Command Center!");
  } else {
    console.log("Could not find Live Command Center button, capturing current tab.");
  }
  
  console.log(`Taking screenshot...`);
  await page.screenshot({ path: artifactPath, fullPage: false });
  console.log("Command Center screenshot saved successfully!");
  
  await browser.close();
}

capture().catch(err => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
