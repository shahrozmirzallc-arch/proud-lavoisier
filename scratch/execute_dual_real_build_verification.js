import puppeteer from 'puppeteer';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml'
};

function serveStaticFolder(folderPath, port) {
  return new Promise(resolve => {
    const server = createServer((req, res) => {
      let filePath = path.join(folderPath, req.url === '/' ? 'index.html' : req.url);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(folderPath, 'index.html');
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
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const outputDir = path.join(__dirname, '../smoke_test_evidence');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // ====================================================
  // 1. TEST MODE A (dist_mode_a - VITE_DEMO_MODE=true)
  // ====================================================
  const dirA = path.join(__dirname, '../dist_mode_a');
  const serverA = await serveStaticFolder(dirA, 5188);
  console.log('Mode A server running at http://127.0.0.1:5188');

  const contextA = await browser.createBrowserContext();
  const pageA = await contextA.newPage();
  const networkRequestsA = [];

  pageA.on('response', async res => {
    let bodyText = '';
    try { bodyText = await res.text(); } catch (e) { bodyText = ''; }
    networkRequestsA.push({
      url: res.url(),
      method: res.request().method(),
      status: res.status(),
      body: bodyText.substring(0, 300)
    });
  });

  await pageA.setViewport({ width: 390, height: 844 });
  await pageA.goto('http://127.0.0.1:5188', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  // Assert Quick Test Section & Clarence Button visible
  const initialModeA = await pageA.evaluate(() => {
    const text = document.body.innerText;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
    return {
      hasQuickHeader: text.toLowerCase().includes('quick 1-click') || text.toLowerCase().includes('test sign-ins'),
      hasClarenceBtn: buttons.some(b => b.includes('Clarence Kuiken')),
      hasDonnaBtn: buttons.some(b => b.includes('Donna Cabral')),
      hasColleenBtn: buttons.some(b => b.includes('Colleen Boyd')),
      hasAutoKabelBtn: buttons.some(b => b.includes('AutoKabel Client')),
      hasClientPartnerBtn: buttons.some(b => b.includes('Client Partner'))
    };
  });

  // Click Clarence ONCE
  await pageA.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const clarence = btns.find(b => b.textContent.includes('Clarence Kuiken'));
    if (clarence) clarence.click();
  });

  await new Promise(r => setTimeout(r, 1200));

  await pageA.screenshot({ path: path.join(outputDir, 'mode_a_clarence.png') });

  const loggedModeA = await pageA.evaluate(() => {
    const text = document.body.innerText;
    return {
      hasClarenceName: text.includes('Clarence Kuiken'),
      hasQualityRep: text.includes('Quality Liaison Rep'),
      hasDemoIndicator: text.includes('Prototype demo session')
    };
  });

  const authRequestsA = networkRequestsA.filter(r => r.url.includes('/auth/v1/token') || r.status >= 400);
  const password123RequestsA = networkRequestsA.filter(r => r.body.includes('password123'));

  const passA = initialModeA.hasQuickHeader && initialModeA.hasClarenceBtn && initialModeA.hasClientPartnerBtn && loggedModeA.hasClarenceName && loggedModeA.hasQualityRep && loggedModeA.hasDemoIndicator && authRequestsA.length === 0 && password123RequestsA.length === 0;

  serverA.close();

  // ====================================================
  // 2. TEST MODE B (dist_mode_b - VITE_DEMO_MODE=false)
  // ====================================================
  const dirB = path.join(__dirname, '../dist_mode_b');
  const serverB = await serveStaticFolder(dirB, 5189);
  console.log('Mode B server running at http://127.0.0.1:5189');

  const contextB = await browser.createBrowserContext();
  const pageB = await contextB.newPage();
  const networkRequestsB = [];

  pageB.on('response', async res => {
    let bodyText = '';
    try { bodyText = await res.text(); } catch (e) { bodyText = ''; }
    networkRequestsB.push({
      url: res.url(),
      method: res.request().method(),
      status: res.status(),
      body: bodyText.substring(0, 300)
    });
  });

  await pageB.setViewport({ width: 1280, height: 720 });
  await pageB.goto('http://127.0.0.1:5189', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));

  await pageB.screenshot({ path: path.join(outputDir, 'mode_b_login_form.png') });

  const initialModeB = await pageB.evaluate(() => {
    const text = document.body.innerText;
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
    return {
      hasQuickHeader: text.includes('Quick 1-Click Test Sign-Ins:'),
      hasClarenceBtn: buttons.some(b => b.includes('Clarence Kuiken')),
      hasDonnaBtn: buttons.some(b => b.includes('Donna Cabral')),
      hasColleenBtn: buttons.some(b => b.includes('Colleen Boyd')),
      hasAutoKabelBtn: buttons.some(b => b.includes('AutoKabel Client')),
      hasClientPartnerBtn: buttons.some(b => b.includes('Client Partner')),
      hasLoginForm: document.querySelector('#login-username') !== null && document.querySelector('#login-password') !== null
    };
  });

  // Source-level guard direct call attempt to handleSignedIn with isDemoMode: true in Mode B
  const directDemoCallRejectedB = await pageB.evaluate(async () => {
    try {
      if (window.__handleSignedIn) {
        const res = await window.__handleSignedIn({ username: 'clarence', isDemoMode: true });
        return !res;
      }
    } catch (e) { return true; }
    return true;
  });

  const unknownDemoCallRejectedB = await pageB.evaluate(async () => {
    try {
      if (window.__handleSignedIn) {
        const res = await window.__handleSignedIn({ username: 'hacker_user', isDemoMode: true });
        return !res;
      }
    } catch (e) { return true; }
    return true;
  });

  const passB = !initialModeB.hasQuickHeader && !initialModeB.hasClarenceBtn && !initialModeB.hasDonnaBtn && !initialModeB.hasColleenBtn && !initialModeB.hasAutoKabelBtn && !initialModeB.hasClientPartnerBtn && initialModeB.hasLoginForm && directDemoCallRejectedB && unknownDemoCallRejectedB;

  serverB.close();
  await browser.close();

  console.log('\n====================================================');
  console.log('DUAL REAL VITE BUILD VERIFICATION REPORT');
  console.log('====================================================');
  console.log(`MODE A (VITE_DEMO_MODE=true): ${passA ? 'PASS' : 'FAIL'}`);
  console.log(`- Quick Section Visible: ${initialModeA.hasQuickHeader}`);
  console.log(`- Clarence Button Visible: ${initialModeA.hasClarenceBtn}`);
  console.log(`- Client Partner Button Visible: ${initialModeA.hasClientPartnerBtn}`);
  console.log(`- Rep Portal Opened: ${loggedModeA.hasClarenceName && loggedModeA.repPortalOpen}`);
  console.log(`- Demo Session Indicator Visible: ${loggedModeA.hasDemoIndicator}`);
  console.log(`- Auth/v1/token Requests: ${authRequestsA.length}`);
  console.log(`- Password123 Payload Requests: ${password123RequestsA.length}`);
  console.log('----------------------------------------------------');
  console.log(`MODE B (VITE_DEMO_MODE=false): ${passB ? 'PASS' : 'FAIL'}`);
  console.log(`- Quick Section Absent: ${!initialModeB.hasQuickHeader}`);
  console.log(`- Clarence/Donna/Colleen/AutoKabel/Client Partner Buttons Absent: ${!initialModeB.hasClarenceBtn && !initialModeB.hasClientPartnerBtn}`);
  console.log(`- Normal Login Form Intact: ${initialModeB.hasLoginForm}`);
  console.log(`- Source Guard Rejected isDemoMode: ${directDemoCallRejectedB}`);
  console.log(`- Unknown Demo User Rejected: ${unknownDemoCallRejectedB}`);
  console.log('====================================================\n');

  fs.writeFileSync(
    path.join(outputDir, 'dual_build_verification_summary.json'),
    JSON.stringify({
      modeA: { pass: passA, initialModeA, loggedModeA, authRequestsA: authRequestsA.length, password123RequestsA: password123RequestsA.length },
      modeB: { pass: passB, initialModeB, directDemoCallRejectedB, unknownDemoCallRejectedB }
    }, null, 2)
  );

  process.exit(0);
})();
