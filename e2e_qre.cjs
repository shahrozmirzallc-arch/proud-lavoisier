const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting QRE E2E test...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Set mobile viewport for PhoneSimulator
  await page.setViewport({ width: 390, height: 844 });
  
  try {
    const timestamp = new Date().getTime();
    await page.goto(`http://localhost:5173/?t=${timestamp}`, { waitUntil: 'networkidle0' });
    console.log('Navigated to localhost URL.');

    // Wait for the Security Gateway text input
    await page.waitForSelector('input[type="text"]');
    
    // Inject sessionStorage spy
    await page.evaluateOnNewDocument(() => {
      const origSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        console.log(`SESSION STORAGE SET: ${key} = ${value}`);
        return origSetItem.apply(this, arguments);
      };
    });

    console.log('Typing clarence');
    await page.type('input[type="text"]', 'clarence');
    
    console.log('Typing Clarence2026!');
    await page.type('input[type="password"]', 'Clarence2026!');
    
    await page.click('button[type="submit"]');
    console.log('Submitted login credentials.');
    
    // Wait for the PhoneSimulator to load its auth screen
    await page.waitForFunction(
      () => document.body.innerText.includes('OPERATOR ID') || document.body.innerText.includes('FAST AUTH PROFILES'),
      { timeout: 10000 }
    );
    console.log('Phone Simulator auth screen loaded.');

    // Click the "Clarence" Fast Auth button
    const authButtons = await page.$$('button');
    let clarenceBtn = null;
    for (let btn of authButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('Clarence')) {
        clarenceBtn = btn;
        break;
      }
    }

    if (clarenceBtn) {
      await clarenceBtn.click();
      console.log('Clicked Clarence Fast Auth button.');
    } else {
      console.log('Could not find Clarence Fast Auth button.');
    }

    // Wait for the home screen to appear by looking for a specific text or element
    await page.waitForFunction(
      () => document.body.innerText.includes('New Suspect Material'),
      { timeout: 10000 }
    );
    console.log('Login successful. QRE Home screen loaded.');

    // Try to click "New Suspect Material"
    const buttonsHome = await page.$$('button');
    let logBtnHome = null;
    for (let btn of buttonsHome) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('New Suspect Material')) {
        logBtnHome = btn;
        break;
      }
    }
    
    if (logBtnHome) {
      await logBtnHome.click();
      console.log('Clicked New Suspect Material button.');
      // Wait for incident form
      await page.waitForFunction(() => document.body.innerText.includes('PROCEED TO SCAN PART LABEL'), { timeout: 5000 });
      console.log('Incident form loaded.');
    } else {
      console.log('Could not find New Suspect Material button.');
    }

    console.log('QRE E2E Test PASSED.');
  } catch (error) {
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.error('PAGE TEXT WAS:', bodyText);
    console.error('QRE E2E Test FAILED:', error);
    await page.screenshot({ path: 'qre_failure.png' });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
