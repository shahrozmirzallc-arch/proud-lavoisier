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

server.listen(4188, async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  const outputDir = path.join(__dirname, '../refactored_screenshots');

  try {
    await page.goto('http://localhost:4188', { waitUntil: 'networkidle2' });

    // Login as Clarence
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clarenceBtn = buttons.find(b => b.textContent.includes('Clarence'));
      if (clarenceBtn) clarenceBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Reports
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const rptBtn = buttons.find(b => b.textContent.includes('Reports'));
      if (rptBtn) rptBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, '04_reports.png') });

    // More
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const moreBtn = buttons.find(b => b.textContent.includes('More'));
      if (moreBtn) moreBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, '05_more.png') });

    // Expense
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expBtn = buttons.find(b => b.textContent.includes('Log Field Expense'));
      if (expBtn) expBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, '06_expense.png') });

    // Inspection
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const workBtn = buttons.find(b => b.textContent.includes('Work'));
      if (workBtn) workBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inspBtn = buttons.find(b => b.textContent.includes('Routine Inspection'));
      if (inspBtn) inspBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, '07_inspection.png') });
    await page.screenshot({ path: path.join(outputDir, '10_dropdown_open.png') });

    // Scanner
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const scanBtn = buttons.find(b => b.textContent.includes('Scan Barcode') || b.textContent.includes('Scan QR'));
      if (scanBtn) scanBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(outputDir, '11_scanner_modal.png') });

    // Close Scanner
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => b.textContent.includes('Close') || b.textContent.includes('Cancel'));
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Rework
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const workBtn = buttons.find(b => b.textContent.includes('Work'));
      if (workBtn) workBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reworkBtn = buttons.find(b => b.textContent.includes('Log Billable Rework'));
      if (reworkBtn) reworkBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(outputDir, '08_rework.png') });

    // Desktop
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('http://localhost:4188', { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const adminBtn = buttons.find(b => b.textContent.includes('Shahroz') || b.textContent.includes('Donna') || b.textContent.includes('Super-Admin'));
      if (adminBtn) adminBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outputDir, '13_desktop_dashboard.png') });

    console.log('Capture complete!');
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
