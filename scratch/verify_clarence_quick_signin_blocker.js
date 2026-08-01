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

server.listen(4173, '127.0.0.1', async () => {
  console.log('Verification server running at http://127.0.0.1:4173');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  
  const networkErrors = [];

  page.on('response', async response => {
    if (response.status() >= 400) {
      let bodyText = '';
      try { bodyText = await response.text(); } catch (e) { bodyText = 'Could not read body'; }
      networkErrors.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        body: bodyText.substring(0, 300)
      });
    }
  });

  const outputDir = path.join(__dirname, '../smoke_test_evidence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Click Clarence Kuiken ONCE
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clarence = btns.find(b => b.textContent.includes('Clarence Kuiken'));
      if (clarence) clarence.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    // Capture ONE screenshot
    const screenshotPath = path.join(outputDir, 'clarence_quick_signin_verified.png');
    await page.screenshot({ path: screenshotPath });

    // Measure DOM Visibility of all 5 required targets
    const verification = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const navSpans = Array.from(document.querySelectorAll('button span')).map(s => s.textContent.trim());

      const hasClarence = bodyText.includes('Clarence Kuiken');
      const hasQualityRep = bodyText.includes('Quality Liaison Rep');
      const hasAssignment = bodyText.includes('Current Assignment');
      const hasAddHours = Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes("Add Today's Hours"));
      const hasDemoIndicator = bodyText.includes('Prototype demo session');

      const hasHomeNav = navSpans.includes('Home');
      const hasWorkNav = navSpans.includes('Work');
      const hasAlertNav = navSpans.includes('Alert');
      const hasReportsNav = navSpans.includes('Reports');
      const hasMoreNav = navSpans.includes('More');

      const allNavVisible = hasHomeNav && hasWorkNav && hasAlertNav && hasReportsNav && hasMoreNav;

      return {
        hasClarence,
        hasQualityRep,
        hasAssignment,
        hasAddHours,
        hasDemoIndicator,
        allNavVisible,
        navSpans
      };
    });

    const hasInvalidCreds = networkErrors.some(e => e.body.includes('invalid_credentials') || e.url.includes('auth/v1/token'));

    console.log('\n====================================================');
    console.log('CLARENCE QUICK SIGN-IN BLOCKER VERIFICATION RESULT');
    console.log(`Clarence Kuiken Visible: ${verification.hasClarence}`);
    console.log(`Quality Liaison Rep Visible: ${verification.hasQualityRep}`);
    console.log(`Current Assignment Visible: ${verification.hasAssignment}`);
    console.log(`Add Today's Hours Visible: ${verification.hasAddHours}`);
    console.log(`Prototype Demo Session Indicator Visible: ${verification.hasDemoIndicator}`);
    console.log(`Home/Work/Alert/Reports/More Navigation Visible: ${verification.allNavVisible}`);
    console.log(`Invalid Credentials Request Occurred: ${hasInvalidCreds}`);
    console.log(`Total 400+ Network Errors Captured: ${networkErrors.length}`);
    console.log('====================================================\n');

    fs.writeFileSync(
      path.join(outputDir, 'clarence_verification_summary.json'),
      JSON.stringify({ verification, networkErrors, pass: verification.hasClarence && verification.hasQualityRep && verification.hasAssignment && verification.hasAddHours && verification.allNavVisible && !hasInvalidCreds }, null, 2)
    );

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
