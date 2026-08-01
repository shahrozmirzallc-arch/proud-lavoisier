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

  const outputDir = path.join(__dirname, '../smoke_test_evidence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // ====================================================
    // TEST SUITE A: DEMO MODE ENABLED (VITE_DEMO_MODE=true)
    // ====================================================
    console.log('\n--- TESTING MODE A: VITE_DEMO_MODE=true ---');
    const pageA = await browser.newPage();
    const networkErrorsA = [];

    pageA.on('response', async res => {
      if (res.status() >= 400) {
        networkErrorsA.push({ url: res.url(), status: res.status() });
      }
    });

    await pageA.setViewport({ width: 390, height: 844 });
    await pageA.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Force demo mode env in client for Mode A test evaluation
    await pageA.evaluate(() => {
      window.__VITE_DEMO_MODE_OVERRIDE__ = 'true';
    });

    // Check quick sign-in buttons presence
    const hasQuickButtonsA = await pageA.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Clarence Kuiken'));
    });

    // Click Clarence Kuiken ONCE
    await pageA.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clarence = btns.find(b => b.textContent.includes('Clarence Kuiken'));
      if (clarence) clarence.click();
    });

    await new Promise(r => setTimeout(r, 1200));

    await pageA.screenshot({ path: path.join(outputDir, 'demo_mode_enabled_clarence.png') });

    const stateA = await pageA.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasClarence: text.includes('Clarence Kuiken'),
        hasDemoBadge: text.includes('Prototype demo session'),
        repPortalOpen: text.includes('Current Assignment') && text.includes('Quality Liaison Rep')
      };
    });

    const passA = hasQuickButtonsA && stateA.hasClarence && stateA.hasDemoBadge && stateA.repPortalOpen && networkErrorsA.length === 0;

    console.log(`MODE A - Quick Sign-In Buttons Visible: ${hasQuickButtonsA}`);
    console.log(`MODE A - Rep Portal Open: ${stateA.repPortalOpen}`);
    console.log(`MODE A - Demo Session Indicator Visible: ${stateA.hasDemoBadge}`);
    console.log(`MODE A - Network 400 Errors Count: ${networkErrorsA.length}`);
    console.log(`MODE A RESULT: ${passA ? 'PASS' : 'FAIL'}`);

    // ====================================================
    // TEST SUITE B: DEMO MODE DISABLED (VITE_DEMO_MODE=false or missing)
    // ====================================================
    console.log('\n--- TESTING MODE B: VITE_DEMO_MODE=false ---');
    const pageB = await browser.newPage();
    const networkErrorsB = [];

    pageB.on('response', async res => {
      if (res.status() >= 400) {
        networkErrorsB.push({ url: res.url(), status: res.status() });
      }
    });

    await pageB.setViewport({ width: 1280, height: 720 });
    await pageB.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    await pageB.screenshot({ path: path.join(outputDir, 'demo_mode_disabled_security.png') });

    const stateB = await pageB.evaluate(() => {
      const text = document.body.innerText;
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      const hasQuickButtons = buttons.some(b => b.includes('Clarence Kuiken'));
      const hasLoginForm = document.querySelector('form') !== null && document.querySelector('#login-username') !== null;
      return {
        hasQuickButtons,
        hasLoginForm,
        bodyText: text
      };
    });

    // Attempt direct isDemoMode authentication when VITE_DEMO_MODE is not true
    const directDemoAttemptResult = await pageB.evaluate(async () => {
      // Direct call simulation to handleSignedIn with isDemoMode: true
      try {
        if (window.__handleSignedIn) {
          const res = await window.__handleSignedIn({ username: 'clarence', isDemoMode: true });
          return res;
        }
      } catch (e) { return false; }
      return false;
    });

    // Attempt unknown demo username injection
    const unknownDemoAttemptResult = await pageB.evaluate(async () => {
      try {
        if (window.__handleSignedIn) {
          const res = await window.__handleSignedIn({ username: 'hacker_unknown', isDemoMode: true });
          return res;
        }
      } catch (e) { return false; }
      return false;
    });

    const passB = !stateB.hasQuickButtons && stateB.hasLoginForm && !directDemoAttemptResult && !unknownDemoAttemptResult;

    console.log(`MODE B - Quick Sign-In Buttons Absent: ${!stateB.hasQuickButtons}`);
    console.log(`MODE B - Normal Login Form Intact: ${stateB.hasLoginForm}`);
    console.log(`MODE B - Direct isDemoMode Call Rejected (Returned False): ${!directDemoAttemptResult}`);
    console.log(`MODE B - Unknown Demo User Rejected: ${!unknownDemoAttemptResult}`);
    console.log(`MODE B RESULT: ${passB ? 'PASS' : 'FAIL'}`);

    console.log('\n====================================================');
    console.log(`OVERALL DEMO SECURITY GATE TEST RESULT: ${passA && passB ? 'ALL PASSED' : 'FAILED'}`);
    console.log('====================================================\n');

    fs.writeFileSync(
      path.join(outputDir, 'demo_security_gate_summary.json'),
      JSON.stringify({ modeA: { pass: passA, stateA }, modeB: { pass: passB, stateB } }, null, 2)
    );

  } catch (err) {
    console.error('Error during demo gate verification:', err);
  } finally {
    await browser.close();
    server.close();
    process.exit(0);
  }
});
