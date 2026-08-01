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

server.listen(4178, async () => {
  console.log('Static preview server running at http://localhost:4178');

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
    await page.goto('http://localhost:4178', { waitUntil: 'networkidle2' });

    // 12. Login
    await page.screenshot({ path: path.join(outputDir, '12_login.png') });
    console.log('Saved 12_login.png');

    // Login as Clarence (Rep)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clarenceBtn = buttons.find(b => b.textContent.includes('Clarence'));
      if (clarenceBtn) clarenceBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // 01. Home
    await page.screenshot({ path: path.join(outputDir, '01_home.png') });
    console.log('Saved 01_home.png');

    // 09. Add Hours Modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addHoursBtn = buttons.find(b => b.textContent.includes("Add Today's Hours"));
      if (addHoursBtn) addHoursBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, '09_add_hours_modal.png') });
    console.log('Saved 09_add_hours_modal.png');

    // Close Add Hours modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(b => b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 02. Work
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const workBtn = buttons.find(b => b.textContent.includes('Work'));
      if (workBtn) workBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '02_work.png') });
    console.log('Saved 02_work.png');

    // 03. Alert / Incident
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const alertBtn = buttons.find(b => b.textContent.includes('Alert'));
      if (alertBtn) alertBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '03_alert.png') });
    console.log('Saved 03_alert.png');

    // Cancel Incident
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const cancelBtn = buttons.find(b => b.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 04. Reports
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const rptBtn = buttons.find(b => b.textContent.includes('Reports'));
      if (rptBtn) rptBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '04_reports.png') });
    console.log('Saved 04_reports.png');

    // 05. More
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const moreBtn = buttons.find(b => b.textContent.includes('More'));
      if (moreBtn) moreBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '05_more.png') });
    console.log('Saved 05_more.png');

    // 06. Expense
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expBtn = buttons.find(b => b.textContent.includes('Log Field Expense'));
      if (expBtn) expBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '06_expense.png') });
    console.log('Saved 06_expense.png');

    // 07. Routine Inspection & Dropdown open
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const workBtn = buttons.find(b => b.textContent.includes('Work'));
      if (workBtn) workBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inspBtn = buttons.find(b => b.textContent.includes('Routine Inspection'));
      if (inspBtn) inspBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '07_inspection.png') });
    console.log('Saved 07_inspection.png');

    // 10. Dropdown open screenshot
    await page.screenshot({ path: path.join(outputDir, '10_dropdown_open.png') });
    console.log('Saved 10_dropdown_open.png');

    // 11. Scanner Modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const scanBtn = buttons.find(b => b.textContent.includes('Scan Barcode') || b.textContent.includes('Scan QR'));
      if (scanBtn) scanBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(outputDir, '11_scanner_modal.png') });
    console.log('Saved 11_scanner_modal.png');

    // Close Scanner
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => b.textContent.includes('Close') || b.textContent.includes('Cancel'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 08. Rework
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const workBtn = buttons.find(b => b.textContent.includes('Work'));
      if (workBtn) workBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reworkBtn = buttons.find(b => b.textContent.includes('Log Billable Rework'));
      if (reworkBtn) reworkBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(outputDir, '08_rework.png') });
    console.log('Saved 08_rework.png');

    // 13. Desktop Dashboard Viewport
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('http://localhost:4178', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.textContent.includes('Shahroz') || b.textContent.includes('Donna') || b.textContent.includes('Super-Admin'));
      if (adminBtn) adminBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(outputDir, '13_desktop_dashboard.png') });
    console.log('Saved 13_desktop_dashboard.png');

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('All required screenshots captured!');
  }
});
