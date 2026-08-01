import puppeteer from 'puppeteer';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '../dist');

// Simple static file server for dist
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
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

server.listen(4173, async () => {
  console.log('Static preview server running at http://localhost:4173');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const outputDir = path.join(__dirname, '../baseline_screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' });

    // Login as Clarence (Rep)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clarenceBtn = buttons.find(b => b.textContent.includes('Clarence'));
      if (clarenceBtn) clarenceBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 1: Rep Home
    await page.screenshot({ path: path.join(outputDir, '01_rep_home_baseline.png') });
    console.log('Saved 01_rep_home_baseline.png');

    // Screenshot 2: Routine Inspection
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Start Routine Inspection'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outputDir, '02_routine_inspection_baseline.png') });
    console.log('Saved 02_routine_inspection_baseline.png');

    // Screenshot 3: Log Rework
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const homeBtn = buttons.find(b => b.textContent.includes('Home') || b.textContent.includes('Back'));
      if (homeBtn) homeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Log Rework'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outputDir, '03_log_rework_baseline.png') });
    console.log('Saved 03_log_rework_baseline.png');

    // Screenshot 4: Log Expense
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const homeBtn = buttons.find(b => b.textContent.includes('Home') || b.textContent.includes('Back'));
      if (homeBtn) homeBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Log Expense'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(outputDir, '04_log_expense_baseline.png') });
    console.log('Saved 04_log_expense_baseline.png');

  } catch (err) {
    console.error('Error during baseline captures:', err);
  } finally {
    await browser.close();
    server.close();
    console.log('Baseline capture complete!');
  }
});
