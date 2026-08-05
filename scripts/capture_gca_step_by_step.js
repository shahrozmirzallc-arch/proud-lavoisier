// scripts/capture_gca_step_by_step.js
// Automated Live Puppeteer Walkthrough — MOBILE PHONE SIMULATOR
// Captures UNIQUE screenshots at each step of the incident wizard
// Fixed: Uses Demo Fill button to populate all fields, then navigates tabs cleanly

import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const ARTIFACTS_DIR = path.join('C:', 'Users', 'Sharoz', '.gemini', 'antigravity', 'brain', '89428d1a-6335-42dd-8036-39f9c953213b');
const OUTPUT_DIR = path.join(projectRoot, 'scripts', 'gca_output');

[OUTPUT_DIR, ARTIFACTS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

const MIME_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  let filePath = path.join(projectRoot, 'dist', url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(projectRoot, 'dist', 'index.html');
  }
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, content) => {
    if (err) { res.writeHead(404); res.end('Not Found'); }
    else { res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' }); res.end(content); }
  });
});

const PORT = 4174;

async function waitMs(ms) { return new Promise(r => setTimeout(r, ms)); }

async function takeUniqueScreenshot(page, name, description) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`  ✓ Screenshot: ${name} — ${description}`);
  return filePath;
}

async function runWalkthrough() {
  return new Promise((resolve, reject) => {
    server.listen(PORT, async () => {
      console.log(`[SERVER] http://localhost:${PORT}`);
      let browser;
      try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] });
        const page = await browser.newPage();

        // CRITICAL: Use mobile viewport (width <= 768) to trigger phone-only mode
        await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2 });
        
        // Auto-dismiss dialog (confirm boxes)
        page.on('dialog', async dialog => { await dialog.accept(); });

        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 30000 });
        await waitMs(3000);

        const screenshots = [];

        // ========== STEP 1: LOGIN SCREEN ==========
        console.log('--- STEP 1: Login Screen ---');
        const s1 = await takeUniqueScreenshot(page, 'step01_login_screen', 'Clarence Kuiken Login Screen');
        screenshots.push({ step: 1, title: 'Step 1: IDS Pulse Mobile Login — Clarence Kuiken Authentication', rationale: 'Business Purpose: We start by authenticating Clarence Kuiken (IDS Field Rep, Employee #CK-905) to establish legal audit accountability. In automotive quality (IATF-16949), every quality incident must carry an authenticated identity trail linking the rep, timestamp, plant, and device.', data: 'User: clarence | Plant: Ford Oakville EV Complex | Client: Magna Powertrain', path: s1 });

        // ========== LOGIN as Clarence via DOM ==========
        console.log('--- Logging in as Clarence ---');
        // Type into the visible login form
        const usernameInput = await page.$('input[type="text"], input[placeholder*="clarence"], input[placeholder*="username"], input[placeholder*="Username"]');
        const passwordInput = await page.$('input[type="password"]');
        
        if (usernameInput && passwordInput) {
          await usernameInput.click({ clickCount: 3 });
          await usernameInput.type('clarence');
          await passwordInput.click({ clickCount: 3 });
          await passwordInput.type('password123');
          
          // Click the Quick 1-Click REP login button instead (more reliable)
          const repBtn = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const repLogin = btns.find(b => b.textContent.includes('REP') && b.textContent.includes('Clar'));
            if (repLogin) { repLogin.click(); return true; }
            // Fallback: find Sign In
            const signIn = btns.find(b => b.textContent.includes('Sign in'));
            if (signIn) { signIn.click(); return true; }
            return false;
          });
          console.log(`  Login button clicked: ${repBtn}`);
        } else {
          // Fallback: use the 1-click login buttons
          await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const repLogin = btns.find(b => b.textContent.includes('REP') || b.textContent.includes('Clar'));
            if (repLogin) repLogin.click();
          });
        }
        await waitMs(4000);

        // ========== STEP 2: HOME SCREEN ==========
        console.log('--- STEP 2: Home Screen ---');
        const homeContent = await page.evaluate(() => document.body.innerText.substring(0, 500));
        console.log(`  Page content starts: ${homeContent.substring(0, 100)}...`);
        
        const s2 = await takeUniqueScreenshot(page, 'step02_home_screen', 'Rep Home Dashboard');
        screenshots.push({ step: 2, title: 'Step 2: Rep Home Dashboard — Active Deployment Card', rationale: 'Business Purpose: The home screen displays Clarence\'s active plant deployment (Magna Powertrain / Ford Oakville EV Complex), the current Purchase Order (PO-GM-CAMI-2026-88), and assigned part number. This confirms the rep is authorized for this project before logging any incident against the supplier\'s PO budget.', data: 'Active Project: Magna Powertrain | Plant: Ford Oakville EV | PO: PO-GM-CAMI-2026-88', path: s2 });

        // ========== STEP 3: NAVIGATE TO INCIDENT SCREEN ==========
        console.log('--- STEP 3: Navigate to Incident/Alert screen ---');
        await page.evaluate(() => {
          // Click the Alert nav button (the raised center button in bottom nav)
          const btns = Array.from(document.querySelectorAll('button'));
          const alertBtn = btns.find(b => b.textContent.trim().includes('Alert') || b.textContent.trim().includes('Alerts'));
          if (alertBtn) alertBtn.click();
        });
        await waitMs(2500);

        const s3 = await takeUniqueScreenshot(page, 'step03_incident_wizard_step1_empty', 'Incident Wizard Step 1: Capture (Empty)');
        screenshots.push({ step: 3, title: 'Step 3: NEW INCIDENT REPORT — Step 1: Capture Visual Evidence (Empty)', rationale: 'Business Purpose: Step 1 is the visual evidence capture screen. For GCA audits, photographic evidence of the suspect part (e.g., LH HD up-level light connector cavity) is critical for supplier tear-down authorization. The "Demo Fill" button in the top-right corner will populate all fields with the Clarence GCA example data.', data: 'Tabs: 1. Capture | 2. Scan | 3. Describe | 4. Send | Demo Fill button available', path: s3 });

        // ========== STEP 4: CLICK "DEMO FILL" TO POPULATE ALL FIELDS ==========
        console.log('--- STEP 4: Click Demo Fill ---');
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const demoBtn = btns.find(b => b.textContent.trim().includes('Demo Fill'));
          if (demoBtn) { 
            demoBtn.click(); 
            console.log('Demo Fill clicked');
          } else {
            console.log('Demo Fill button NOT found');
          }
        });
        await waitMs(2500);

        const s4 = await takeUniqueScreenshot(page, 'step04_incident_step1_filled', 'Step 1 After Demo Fill — Evidence Photos Loaded');
        screenshots.push({ step: 4, title: 'Step 4: Capture — Visual Evidence Populated (3 Photos Staged)', rationale: 'Business Purpose: After clicking "Demo Fill", Step 1 now shows 3 staged evidence photos with annotations (Photo 1: Scrap Tag & Part Number, Photo 2: Loose bulb housing crack detail, Photo 3: Container tag batch number). Each photo carries an annotation note that will appear in the final PDF report.', data: 'Photos: 3/10 staged | Photo 1: Scrap Tag | Photo 2: Bulb Housing | Photo 3: Batch Tag', path: s4 });

        // ========== STEP 5: NAVIGATE TO STEP 2 (SCAN) ==========
        console.log('--- STEP 5: Navigate to Step 2 (Scan) ---');
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          // The Continue button on Step 1
          const continueBtn = btns.find(b => b.textContent.trim() === 'Continue' || b.textContent.includes('Continue'));
          if (continueBtn) continueBtn.click();
        });
        await waitMs(2000);

        // Check if we're on step 2 or if media dialog appeared
        const isOnStep2 = await page.evaluate(() => {
          return document.body.innerText.includes('Affected Parts') || document.body.innerText.includes('Scan');
        });
        console.log(`  On Step 2: ${isOnStep2}`);

        const s5 = await takeUniqueScreenshot(page, 'step05_incident_step2_scan', 'Step 2: Part Number Scan & Traceability');
        screenshots.push({ step: 5, title: 'Step 5: Step 2 — Part Scan & Traceability (4 Parts Scanned)', rationale: 'Business Purpose: Step 2 captures part traceability data. 4 scanned parts are shown (PN 86286761 Tail Light, PN 86291945 Headlamp Bracket, etc.) with their scan method (Barcode/QR/Manual) and verification status. For the real GCA call, the suspect part PN 86394644 would be scanned here with RMA tracking CK062026.', data: 'Scanned: PN 86286761 (Verified), PN 86291945 (Verified), PN 86291946 (Unverified), PN 86291947 (Mismatch)', path: s5 });

        // ========== STEP 6: NAVIGATE TO STEP 3 (DESCRIBE) ==========
        console.log('--- STEP 6: Navigate to Step 3 (Describe) ---');
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const step3Tab = btns.find(b => b.textContent.trim().includes('3.') || b.textContent.trim() === '3. Describe');
          if (step3Tab) step3Tab.click();
        });
        await waitMs(2000);

        const s6 = await takeUniqueScreenshot(page, 'step06_incident_step3_describe', 'Step 3: Describe Concern & Investigation');
        screenshots.push({ step: 6, title: 'Step 6: Step 3 — Describe: Concern Details & Investigation Narrative', rationale: 'Business Purpose: Step 3 captures the factory area (Review Scrap Table), defect type, suspect description, and action taken. For GCA audits, the complete multi-line narrative (ABA swap test, bump track retest, Terry Jennings Pin 12 flashover finding) must be preserved here with zero text truncation — no ellipsis, no clipping.', data: 'Area: Review Scrap Table | Defect: Spare bulb loose in housing (rattle) | Action: Removed bulb, returned light', path: s6 });

        // Scroll down to show the full description
        await page.evaluate(() => {
          const scrollContainer = document.getElementById('phone-form-scroll-container');
          if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
        });
        await waitMs(1000);

        const s6b = await takeUniqueScreenshot(page, 'step06b_incident_step3_scrolled', 'Step 3 Scrolled: Action Taken & Full Description');
        screenshots.push({ step: '6b', title: 'Step 6b: Step 3 — Scrolled: Full Action Taken & Supplier Contact', rationale: 'Business Purpose: Scrolling down reveals the complete Action Taken field ("Removed bulb, returned light to sequence area") and the supplier contact routing matrix. These fields ensure the right people at the client organization (e.g., Robert Sterling, Elena Rostova at Magna) receive the incident notification.', data: 'Action: Removed bulb, returned light to sequence area | Supplier Contacts: Robert Sterling, Elena Rostova', path: s6b });

        // ========== STEP 7: NAVIGATE TO STEP 4 (SEND) ==========
        console.log('--- STEP 7: Navigate to Step 4 (Send) ---');
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const step4Tab = btns.find(b => b.textContent.trim().includes('4.') || b.textContent.trim() === '4. Send');
          if (step4Tab) step4Tab.click();
        });
        await waitMs(2000);

        const s7 = await takeUniqueScreenshot(page, 'step07_incident_step4_send_top', 'Step 4: Send — Review Summary (Top)');
        screenshots.push({ step: 7, title: 'Step 7: Step 4 — Send: Final Review & Recipient Matrix', rationale: 'Business Purpose: Step 4 shows the final audit summary with all entered data, the IDS internal recipients (Donna Cabral, Greg Phillippe), and the Submit & Release button. This is the last checkpoint before the incident report goes live into the system and triggers email notifications.', data: 'Recipients: IDS Internal (Donna, Greg) + Client Contacts (Robert Sterling, Elena Rostova)', path: s7 });

        // Scroll down to show submit button
        await page.evaluate(() => {
          const scrollContainer = document.getElementById('phone-form-scroll-container');
          if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
        });
        await waitMs(1000);

        const s8 = await takeUniqueScreenshot(page, 'step08_incident_step4_submit', 'Step 4: Submit & Release Button');
        screenshots.push({ step: 8, title: 'Step 8: Step 4 — Submit & Release Incident Report', rationale: 'Business Purpose: The bottom of Step 4 reveals the "Submit & Release Incident Report" button. Pressing this commits the GCA incident record to the IDS Pulse database, generates a branded PDF, and broadcasts email notifications to all recipients in the distribution matrix (Aaron Repar, Matt Dillon, Donna Cabral, Greg Phillippe).', data: 'Action: Submit & Release | PDF: Auto-generated with IDS logo | Status: Ready to Send', path: s8 });

        // ========== COMPILE PDF ==========
        console.log('--- Compiling Step-by-Step PDF ---');
        await compilePdfGuide(screenshots);

        console.log('\n✅ SUCCESS: All screenshots captured and PDF compiled!');
        console.log(`   Output: ${OUTPUT_DIR}`);
        console.log(`   Artifacts: ${ARTIFACTS_DIR}`);
        resolve();
      } catch (err) {
        console.error('WALKTHROUGH ERROR:', err);
        reject(err);
      } finally {
        if (browser) await browser.close();
        server.close();
      }
    });
  });
}

async function compilePdfGuide(screenshots) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  for (let i = 0; i < screenshots.length; i++) {
    const item = screenshots[i];
    if (i > 0) doc.addPage();

    // Dark navy top bar
    doc.setFillColor(3, 29, 55);
    doc.rect(0, 0, 216, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('IDS PULSE — GCA INCIDENT REPORT STEP-BY-STEP GUIDE', 14, 11);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Step ${item.step} of ${screenshots.length}`, 202, 11, { align: 'right' });

    // Step Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    const titleLines = doc.splitTextToSize(item.title, 188);
    doc.text(titleLines, 14, 25);
    let yAfterTitle = 25 + titleLines.length * 5;

    // Rationale box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    const rationaleLines = doc.splitTextToSize(item.rationale, 178);
    const rationaleBoxH = 8 + rationaleLines.length * 3.8;
    doc.roundedRect(14, yAfterTitle + 2, 188, rationaleBoxH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(9, 105, 220);
    doc.text('BUSINESS RATIONALE:', 18, yAfterTitle + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(rationaleLines, 18, yAfterTitle + 11);

    // Data banner
    const bannerY = yAfterTitle + rationaleBoxH + 5;
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
    doc.roundedRect(14, bannerY, 188, 8, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(67, 56, 202);
    const dataText = doc.splitTextToSize(`DATA: ${item.data}`, 182);
    doc.text(dataText[0], 18, bannerY + 5.5);

    // Screenshot image
    const imgY = bannerY + 12;
    if (fs.existsSync(item.path)) {
      const imgBase64 = fs.readFileSync(item.path).toString('base64');
      // Mobile aspect ratio is 430:932 ≈ 0.46
      // Available height ~185mm
      const maxH = 185;
      const maxW = maxH * 0.46;  // ~85mm wide
      const imgX = (216 - maxW) / 2; // center horizontally

      doc.addImage(`data:image/png;base64,${imgBase64}`, 'PNG', imgX, imgY, maxW, maxH);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.rect(imgX, imgY, maxW, maxH, 'D');
    }

    // Copy screenshot to artifacts
    const artPath = path.join(ARTIFACTS_DIR, `gca_step_${item.step}.png`);
    if (fs.existsSync(item.path)) fs.copyFileSync(item.path, artPath);
  }

  const pdfName = 'IDS_GCA_Incident_Report_StepByStep_Guide.pdf';
  const pdfBuf = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(path.join(OUTPUT_DIR, pdfName), pdfBuf);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, pdfName), pdfBuf);
  console.log(`  ✓ PDF saved: ${pdfName}`);
}

runWalkthrough().catch(err => { console.error(err); process.exit(1); });
