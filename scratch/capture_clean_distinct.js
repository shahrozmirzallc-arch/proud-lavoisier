import puppeteer from 'puppeteer';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml'
};

const server = createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(4222, async () => {
  console.log('Static preview server running at http://localhost:4222');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Auto-accept confirm dialogs
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  const outputDir = path.join(__dirname, '../refactored_screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const clickBottomTab = async (tabName) => {
    await page.evaluate((name) => {
      const spans = Array.from(document.querySelectorAll('span'));
      const targetSpan = spans.find(s => s.textContent.trim() === name && s.closest('button'));
      if (targetSpan) {
        targetSpan.closest('button').click();
      }
    }, tabName);
    await new Promise(r => setTimeout(r, 600));
  };

  try {
    await page.goto('http://localhost:4222', { waitUntil: 'networkidle2' });

    // 12. Login View
    await page.screenshot({ path: path.join(outputDir, '12_login.png') });
    console.log('Saved 12_login.png');

    // Login as Clarence
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clarence = btns.find(b => b.textContent.includes('Clarence'));
      if (clarence) clarence.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // 01. Rep Home
    await page.screenshot({ path: path.join(outputDir, '01_home.png') });
    await page.screenshot({ path: path.join(outputDir, '01_rep_home_emerald_refactored.png') });
    console.log('Saved 01_home.png');

    // 09. Add Hours Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addHrs = btns.find(b => b.textContent.includes("Add Today's Hours"));
      if (addHrs) addHrs.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outputDir, '09_add_hours_modal.png') });
    console.log('Saved 09_add_hours_modal.png');

    // Close Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent.includes("Cancel"));
      if (cancel) cancel.click();
    });
    await new Promise(r => setTimeout(r, 400));

    // 02. WORK Screen
    await clickBottomTab('Work');
    await page.screenshot({ path: path.join(outputDir, '02_work.png') });
    console.log('Saved 02_work.png');

    // 03. ALERT Screen
    await clickBottomTab('Alert');
    await page.screenshot({ path: path.join(outputDir, '03_alert.png') });
    console.log('Saved 03_alert.png');

    // Cancel Incident flow cleanly
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent.includes("Cancel"));
      if (cancel) cancel.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // 04. REPORTS Screen
    await clickBottomTab('Reports');
    await page.screenshot({ path: path.join(outputDir, '04_reports.png') });
    console.log('Saved 04_reports.png');

    // 05. MORE Screen
    await clickBottomTab('More');
    await page.screenshot({ path: path.join(outputDir, '05_more.png') });
    console.log('Saved 05_more.png');

    // 06. EXPENSE Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const exp = btns.find(b => b.textContent.includes('Log Field Expense'));
      if (exp) exp.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, '06_expense.png') });
    console.log('Saved 06_expense.png');

    // Go back to Work screen
    await clickBottomTab('Work');

    // 07. ROUTINE INSPECTION Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const insp = btns.find(b => b.textContent.includes('Routine Inspection'));
      if (insp) insp.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, '07_inspection.png') });
    console.log('Saved 07_inspection.png');

    // 10. Dropdown vs Custom Input Mode screenshot
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const customToggle = btns.find(b => b.textContent.trim() === 'Custom Input');
      if (customToggle) customToggle.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, '10_dropdown_open.png') });
    console.log('Saved 10_dropdown_open.png');

    // Switch back to Dropdown mode
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const dropdownToggle = btns.find(b => b.textContent.trim() === 'Dropdown');
      if (dropdownToggle) dropdownToggle.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // 11. Scanner Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const scan = btns.find(b => b.textContent.includes('Scan Inspected Part Barcode') || b.textContent.includes('Scan Part Barcode'));
      if (scan) scan.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '11_scanner_modal.png') });
    console.log('Saved 11_scanner_modal.png');

    // Close scanner modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.textContent.includes('Close') || b.textContent.includes('Cancel Scanner') || b.textContent.includes('Done'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Go back to Work tab
    await clickBottomTab('Work');

    // 08. BILLABLE REWORK Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rework = btns.find(b => b.textContent.includes('Log Billable Rework'));
      if (rework) rework.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, '08_rework.png') });
    console.log('Saved 08_rework.png');

    // 13. DESKTOP DASHBOARD
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('http://localhost:4222', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const admin = btns.find(b => b.textContent.includes('Shahroz') || b.textContent.includes('Donna') || b.textContent.includes('Super-Admin'));
      if (admin) admin.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outputDir, '13_desktop_dashboard.png') });
    console.log('Saved 13_desktop_dashboard.png');

    console.log('ALL DISTINCT SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
