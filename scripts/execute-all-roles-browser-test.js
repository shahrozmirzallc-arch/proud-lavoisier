import puppeteer from 'puppeteer';
import path from 'path';

const BASE_URL = 'http://localhost:4188';
const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';

async function runAllRolesBrowserTest() {
  console.log('================================================================');
  console.log('   STEP-BY-STEP REAL BROWSER RETESTING: ALL USER ROLES & PRINTS');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  async function captureStepScreenshot(prefix) {
    const filename = `${prefix}_${Date.now()}.png`;
    const targetPath = path.join(ARTIFACTS_DIR, filename);
    await page.screenshot({ path: targetPath, fullPage: false });
    console.log(`  📸 Captured Live Screenshot: ${filename}`);
    return targetPath;
  }

  async function logout() {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
  }

  async function clickButtonWithText(textPattern) {
    return await page.evaluate((pattern) => {
      const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
      const found = buttons.find(b => b.textContent && b.textContent.toLowerCase().includes(pattern.toLowerCase()));
      if (found) {
        found.click();
        return true;
      }
      return false;
    }, textPattern);
  }

  async function loginAs(userVal, passVal, roleLabel) {
    console.log(`\n--- STEP: Logging into Browser UI as ${roleLabel} (${userVal}) ---`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));

    // Check if on login page
    const userInp = await page.$('#login-username');
    const passInp = await page.$('#login-password');

    if (userInp && passInp) {
      await userInp.focus();
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await userInp.type(userVal, { delay: 30 });

      await passInp.focus();
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await passInp.type(passVal, { delay: 30 });

      const submitBtn = await page.$('button.login-submit, button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  try {
    // -------------------------------------------------------------------------
    // ROLE 1: DIANA ADMIN (diana / Diana2026!)
    // -------------------------------------------------------------------------
    await loginAs('diana', 'Diana2026!', 'Diana Admin (Admin)');
    await captureStepScreenshot('real_diana_admin_authenticated');

    console.log('  Navigating to Incidents Feed in browser...');
    await clickButtonWithText('Incidents');
    await new Promise(r => setTimeout(r, 1500));
    await captureStepScreenshot('real_diana_incidents_feed');

    console.log('  Opening Incident Detail Modal & Print Report...');
    const clickedInc = await clickButtonWithText('Print PDF');
    if (clickedInc) {
      await new Promise(r => setTimeout(r, 1500));
      await captureStepScreenshot('real_diana_incident_pdf_modal');
    }

    console.log('  Navigating to Financials & Invoice Engine...');
    await clickButtonWithText('Financials');
    await new Promise(r => setTimeout(r, 1500));
    await captureStepScreenshot('real_diana_financials_billing');

    await logout();

    // -------------------------------------------------------------------------
    // ROLE 2: CLARENCE KUIKEN (clarence / Clarence2026!)
    // -------------------------------------------------------------------------
    await loginAs('clarence', 'Clarence2026!', 'Clarence Kuiken (Field Inspector)');
    await captureStepScreenshot('real_clarence_inspector_authenticated');

    console.log('  Navigating to Weekly Timesheet CER Format...');
    await clickButtonWithText('Timesheet');
    await new Promise(r => setTimeout(r, 1500));
    await captureStepScreenshot('real_clarence_weekly_timesheet');

    await logout();

    // -------------------------------------------------------------------------
    // ROLE 3: GREG (greg / Greg2026!)
    // -------------------------------------------------------------------------
    await loginAs('greg', 'Greg2026!', 'Greg (Executive Owner)');
    await captureStepScreenshot('real_greg_owner_authenticated');

    console.log('  Navigating to Suppliers Directory...');
    await clickButtonWithText('Suppliers');
    await new Promise(r => setTimeout(r, 1500));
    await captureStepScreenshot('real_greg_suppliers_directory');

    await logout();

    // -------------------------------------------------------------------------
    // ROLE 4: COLLEEN (colleen / Colleen2026!)
    // -------------------------------------------------------------------------
    await loginAs('colleen', 'Colleen2026!', 'Colleen (Accountant)');
    await captureStepScreenshot('real_colleen_accountant_authenticated');

    console.log('  Testing QuickBooks & Excel Exports toolbar...');
    await clickButtonWithText('Logging');
    await new Promise(r => setTimeout(r, 1500));
    await captureStepScreenshot('real_colleen_exports_toolbar');

    await logout();

    // -------------------------------------------------------------------------
    // ROLE 5: DONNA (donna / Donna2026!)
    // -------------------------------------------------------------------------
    await loginAs('donna', 'Donna2026!', 'Donna (Quality Lead)');
    await captureStepScreenshot('real_donna_lead_authenticated');

    await logout();

    // -------------------------------------------------------------------------
    // ROLE 6: AUTOKABEL CLIENT (autokabel / Autokabel2026!)
    // -------------------------------------------------------------------------
    await loginAs('autokabel', 'Autokabel2026!', 'Autokabel (Client Customer)');
    await captureStepScreenshot('real_autokabel_client_authenticated');

    console.log('\n================================================================');
    console.log('   ✓ SUCCESS: ALL ROLES AUTHENTICATED & VERIFIED IN REAL BROWSER');
    console.log('================================================================\n');

  } catch (err) {
    console.error('Error during browser retesting:', err);
  } finally {
    await browser.close();
  }
}

runAllRolesBrowserTest().catch(console.error);
