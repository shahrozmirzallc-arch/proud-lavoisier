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

server.listen(4199, async () => {
  console.log('Static preview server running at http://localhost:4199');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const outputDir = path.join(__dirname, '../refactored_screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    await page.goto('http://localhost:4199', { waitUntil: 'networkidle2' });

    // 12. Login View
    await page.screenshot({ path: path.join(outputDir, '12_login.png') });
    console.log('Captured 12_login.png');

    // Login as Clarence
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clarence = btns.find(b => b.textContent.includes('Clarence'));
      if (clarence) clarence.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // 01. Rep Home
    await page.screenshot({ path: path.join(outputDir, '01_home.png') });
    await page.screenshot({ path: path.join(outputDir, '01_rep_home_emerald_refactored.png') });
    console.log('Captured 01_home.png');

    // 09. Add Hours Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addHrs = btns.find(b => b.textContent.includes("Add Today's Hours"));
      if (addHrs) addHrs.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, '09_add_hours_modal.png') });
    console.log('Captured 09_add_hours_modal.png');

    // Close Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent.includes("Cancel"));
      if (cancel) cancel.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 02. WORK Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const work = btns.find(b => b.textContent.trim() === 'Work');
      if (work) work.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outputDir, '02_work.png') });
    console.log('Captured 02_work.png');

    // 03. ALERT / INCIDENT Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const alertBtn = btns.find(b => b.textContent.trim() === 'Alert');
      if (alertBtn) alertBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outputDir, '03_alert.png') });
    console.log('Captured 03_alert.png');

    // Cancel Incident
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancel = btns.find(b => b.textContent.includes("Cancel"));
      if (cancel) cancel.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 04. REPORTS Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rpt = btns.find(b => b.textContent.trim() === 'Reports');
      if (rpt) rpt.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outputDir, '04_reports.png') });
    console.log('Captured 04_reports.png');

    // 05. MORE Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const more = btns.find(b => b.textContent.trim() === 'More');
      if (more) more.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outputDir, '05_more.png') });
    console.log('Captured 05_more.png');

    // 06. EXPENSE Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const exp = btns.find(b => b.textContent.includes('Log Field Expense'));
      if (exp) exp.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outputDir, '06_expense.png') });
    console.log('Captured 06_expense.png');

    // Go back to Work screen to click Inspection & Rework
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const work = btns.find(b => b.textContent.trim() === 'Work');
      if (work) work.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 07. ROUTINE INSPECTION Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const insp = btns.find(b => b.textContent.includes('Routine Inspection'));
      if (insp) insp.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outputDir, '07_inspection.png') });
    console.log('Captured 07_inspection.png');

    // 10. Dropdown Open
    await page.evaluate(() => {
      const sel = document.querySelector('select');
      if (sel) sel.focus();
    });
    await page.screenshot({ path: path.join(outputDir, '10_dropdown_open.png') });
    console.log('Captured 10_dropdown_open.png');

    // 11. Scanner Modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const scan = btns.find(b => b.textContent.includes('Scan'));
      if (scan) scan.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, '11_scanner_modal.png') });
    console.log('Captured 11_scanner_modal.png');

    // Close scanner
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find(b => b.textContent.includes('Close') || b.textContent.includes('Cancel'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // Go to Work tab to launch Rework
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const work = btns.find(b => b.textContent.trim() === 'Work');
      if (work) work.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 08. BILLABLE REWORK Screen
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rework = btns.find(b => b.textContent.includes('Log Billable Rework'));
      if (rework) rework.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outputDir, '08_rework.png') });
    console.log('Captured 08_rework.png');

    // 13. DESKTOP DASHBOARD
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('http://localhost:4199', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const admin = btns.find(b => b.textContent.includes('Shahroz') || b.textContent.includes('Donna') || b.textContent.includes('Super-Admin'));
      if (admin) admin.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, '13_desktop_dashboard.png') });
    console.log('Captured 13_desktop_dashboard.png');

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
