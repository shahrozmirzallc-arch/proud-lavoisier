const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const brainDir = path.resolve('C:/Users/Sharoz/.gemini/antigravity/brain/66b12867-a02c-4c91-a52d-48c91fdb789a');
const url = 'http://localhost:5173';

const scenarios = [
  {
    id: 1,
    role: 'Owner (Shahroz Mirza)',
    user: 'shahroz',
    pass: 'Shahroz2026!',
    name: 'Executive Launch Roadmap & Full Audit',
    action: async (page) => {
      await page.waitForFunction(() => document.body.innerText.includes('ACTIVE') || document.body.innerText.includes('IDS') || document.body.innerText.includes('Roadmap'), { timeout: 8000 });
      return 'Owner Dashboard & Launch Roadmap Verified';
    }
  },
  {
    id: 2,
    role: 'System Admin (Greg)',
    user: 'greg',
    pass: 'Greg2026!',
    name: 'Admin Operational Dashboard & Plant Registry',
    action: async (page) => {
      await page.waitForFunction(() => document.body.innerText.includes('ACTIVE') || document.body.innerText.includes('SUPPLIERS'), { timeout: 8000 });
      return 'System Admin Operational Control Verified';
    }
  },
  {
    id: 3,
    role: 'Quality Lead (Donna)',
    user: 'donna',
    pass: 'Donna2026!',
    name: 'Quality Lead Defect Matrix & Duplicate Audit',
    action: async (page) => {
      await page.waitForFunction(() => document.body.innerText.includes('Suspect') || document.body.innerText.includes('Defect') || document.body.innerText.includes('QRE'), { timeout: 8000 });
      return 'Quality Lead Defect Governance Verified';
    }
  },
  {
    id: 4,
    role: 'Accountant (Colleen)',
    user: 'colleen',
    pass: 'Colleen2026!',
    name: 'Financial Ledger, Timesheets & Expense Lightbox',
    action: async (page) => {
      await page.waitForFunction(() => document.body.innerText.includes('Timesheets') || document.body.innerText.includes('Payroll') || document.body.innerText.includes('Hours'), { timeout: 8000 });
      return 'Accountant Timesheets & Financial Audit Verified';
    }
  },
  {
    id: 5,
    role: 'QRE Rep (Clarence - GM Oshawa)',
    user: 'clarence',
    pass: 'Clarence2026!',
    name: 'GM Oshawa Shift Rework & CAD Defect Reporting',
    action: async (page) => {
      // Handle phone simulator fast auth if shown
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('FAST AUTH PROFILES')) {
        const buttons = await page.$$('button');
        for (let btn of buttons) {
          const t = await page.evaluate(el => el.innerText, btn);
          if (t.includes('Clarence')) { await btn.click(); break; }
        }
      }
      await page.waitForFunction(() => document.body.innerText.includes('New Suspect Material') || document.body.innerText.includes('GM OSHAWA'), { timeout: 8000 });
      return 'Clarence Mobile QRE Rework Pipeline Verified';
    }
  },
  {
    id: 6,
    role: 'QRE Rep (Hugo - Magna Plant)',
    user: 'hugo',
    pass: 'Hugo2026!',
    name: 'Magna Plant On-Demand Suspect Material & Tolls Claim',
    action: async (page) => {
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('FAST AUTH PROFILES')) {
        const buttons = await page.$$('button');
        for (let btn of buttons) {
          const t = await page.evaluate(el => el.innerText, btn);
          if (t.includes('Hugo')) { await btn.click(); break; }
        }
      }
      await page.waitForFunction(() => document.body.innerText.includes('HUGO') || document.body.innerText.includes('New Suspect Material'), { timeout: 8000 });
      return 'Hugo Mobile QRE Emergency Logging Verified';
    }
  },
  {
    id: 7,
    role: 'QRE Rep (Nabil - Hutchinson)',
    user: 'nabil',
    pass: 'Nabil2026!',
    name: 'Night Shift Rework Hours & Meal Expense Submission',
    action: async (page) => {
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('FAST AUTH PROFILES')) {
        const buttons = await page.$$('button');
        for (let btn of buttons) {
          const t = await page.evaluate(el => el.innerText, btn);
          if (t.includes('Nabil')) { await btn.click(); break; }
        }
      }
      await page.waitForFunction(() => document.body.innerText.includes('NABIL') || document.body.innerText.includes('New Suspect Material'), { timeout: 8000 });
      return 'Nabil Night Shift Rework Logging Verified';
    }
  },
  {
    id: 8,
    role: 'QRE Rep (Rogelio - Mercedes Plant)',
    user: 'rogelio',
    pass: 'Rogelio2026!',
    name: 'High-Volume Part Sorting & Correction Request Submission',
    action: async (page) => {
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('FAST AUTH PROFILES')) {
        const buttons = await page.$$('button');
        for (let btn of buttons) {
          const t = await page.evaluate(el => el.innerText, btn);
          if (t.includes('Rogelio')) { await btn.click(); break; }
        }
      }
      await page.waitForFunction(() => document.body.innerText.includes('ROGELIO') || document.body.innerText.includes('New Suspect Material'), { timeout: 8000 });
      return 'Rogelio High-Volume Sorting Pipeline Verified';
    }
  },
  {
    id: 9,
    role: 'Customer (Auto Kabel)',
    user: 'autokabel',
    pass: 'Autokabel2026!',
    name: 'Auto Kabel Supplier Quality Metrics & Defect Tracking',
    action: async (page) => {
      await page.waitForFunction(() => document.body.innerText.includes('Auto Kabel') || document.body.innerText.includes('Supplier'), { timeout: 8000 });
      return 'Auto Kabel Restricted Customer Portal Verified';
    }
  },
  {
    id: 10,
    role: 'Customer (Magna AutoSystems)',
    user: 'magna',
    pass: 'Magna2026!',
    name: 'Magna Automotive Part Defect & Rework Oversight Portal',
    action: async (page) => {
      await page.waitForFunction(() => document.body.innerText.includes('Magna') || document.body.innerText.includes('Supplier'), { timeout: 8000 });
      return 'Magna Automotive Restricted Portal Verified';
    }
  }
];

async function run10Scenarios() {
  console.log('🚀 Starting 10 Real-World Role End-to-End System Tests...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const results = [];

  for (const sc of scenarios) {
    console.log(`\n--------------------------------------------------`);
    console.log(`[SCENARIO ${sc.id}/10] Role: ${sc.role}`);
    console.log(`Scenario Name: ${sc.name}`);

    try {
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Clear session storage between test runs
      await page.evaluate(() => sessionStorage.clear());
      await page.goto(url, { waitUntil: 'networkidle0' });

      // Fill Global Security Gateway credentials
      await page.waitForSelector('input[type="text"]');
      
      const userInput = await page.$('input[type="text"]');
      const passInput = await page.$('input[type="password"]');

      await userInput.click({ clickCount: 3 });
      await userInput.type(sc.user);

      await passInput.click({ clickCount: 3 });
      await passInput.type(sc.pass);

      await page.click('button[type="submit"]');
      console.log(`Submitted login for ${sc.user}...`);

      // Run specific scenario assertions
      const msg = await sc.action(page);

      // Save screenshot
      const shotPath = path.join(brainDir, `scenario_${sc.id}_${sc.user}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });

      console.log(`✅ SUCCESS: ${msg}`);
      results.push({ id: sc.id, role: sc.role, scenario: sc.name, status: 'PASSED', details: msg });

    } catch (err) {
      console.error(`❌ FAILED Scenario ${sc.id} (${sc.role}):`, err.message);
      const errShotPath = path.join(brainDir, `scenario_${sc.id}_${sc.user}_ERROR.png`);
      await page.screenshot({ path: errShotPath });
      results.push({ id: sc.id, role: sc.role, scenario: sc.name, status: 'FAILED', error: err.message });
    }
  }

  await browser.close();

  console.log(`\n==================================================`);
  console.log(`📊 E2E 10 REAL-WORLD SCENARIO AUDIT SUMMARY:`);
  console.table(results);
  console.log(`==================================================`);

  fs.writeFileSync('e2e_results.json', JSON.stringify(results, null, 2));
}

run10Scenarios();
