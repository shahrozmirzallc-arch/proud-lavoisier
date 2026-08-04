// scratch/capture_distinct_screenshots.js
// Capture 8 distinct, authentic live DOM screenshots using Puppeteer

const puppeteer = require('puppeteer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/Sharoz/.gemini/antigravity/brain/89428d1a-6335-42dd-8036-39f9c953213b';

async function run() {
  console.log('[Puppeteer] Building app for preview...');
  
  // Start preview server
  const previewProcess = spawn('npx.cmd', ['vite', 'preview', '--port', '4179'], {
    cwd: 'C:/Users/Sharoz/Documents/antigravity/proud-lavoisier',
    stdio: 'inherit',
    shell: true
  });

  // Wait 3 seconds for preview server
  await new Promise(r => setTimeout(r, 3000));

  console.log('[Puppeteer] Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  try {
    console.log('[Puppeteer] Navigating to http://localhost:4179...');
    await page.goto('http://localhost:4179', { waitUntil: 'networkidle0' });

    // 01: Rep Home Dashboard
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_rep_home_dashboard.png') });
    console.log('Saved 01_rep_home_dashboard.png');

    // Click "Log Incident" or navigate into Incident workflow
    const logIncBtn = await page.$('button::-p-text("Log Incident"), button::-p-text("Report Defect"), [data-testid="log-incident-btn"]');
    if (logIncBtn) {
      await logIncBtn.click();
    } else {
      // Find any button containing "Incident" or navigate
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const incBtn = btns.find(b => b.textContent.includes('Incident') || b.textContent.includes('Defect'));
        if (incBtn) incBtn.click();
      });
    }
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));

    // 02: Step 1 Assignment
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_incident_step1_assignment.png') });
    console.log('Saved 02_incident_step1_assignment.png');

    // Navigate to Step 2 then Step 3
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent.includes('Continue') || b.textContent.includes('Next') || b.textContent.includes('Step 2'));
      if (nextBtn) nextBtn.click();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent.includes('Continue') || b.textContent.includes('Next') || b.textContent.includes('Step 3'));
      if (nextBtn) nextBtn.click();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));

    // 03: Step 3 Describe Defect
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_incident_step3_describe.png') });
    console.log('Saved 03_incident_step3_describe.png');

    // Fill Step 3 narrative
    await page.evaluate(() => {
      const textareas = document.querySelectorAll('textarea');
      if (textareas.length >= 1) textareas[0].value = 'Light on scrap table at sequence area for rattle. Spare bulb in housing.';
      if (textareas.length >= 2) textareas[1].value = 'Removed bulb, returned light to sequence area.';
      
      const inputs = document.querySelectorAll('input[type="text"]');
      if (inputs.length > 0) inputs[0].value = 'Assembly Line 4';

      // Trigger change events
      textareas.forEach(t => t.dispatchEvent(new Event('input', { bubbles: true })));
      inputs.forEach(i => i.dispatchEvent(new Event('input', { bubbles: true })));
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 400)));

    // 04: Step 3 Filled
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_incident_step3_filled.png') });
    console.log('Saved 04_incident_step3_filled.png');

    // Advance to Step 4 Audit
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reviewBtn = btns.find(b => b.textContent.includes('Review') || b.textContent.includes('Step 4') || b.textContent.includes('Proceed'));
      if (reviewBtn) reviewBtn.click();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));

    // 05: Step 4 Audit
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_incident_step4_audit.png') });
    console.log('Saved 05_incident_step4_audit.png');

    // Click "Preview Email" button to open email preview modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const emailBtn = btns.find(b => b.textContent.toLowerCase().includes('email') || b.textContent.toLowerCase().includes('preview'));
      if (emailBtn) emailBtn.click();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 600)));

    // 06: Step 4 Email Preview Modal
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_incident_step4_email_preview.png') });
    console.log('Saved 06_incident_step4_email_preview.png');

    // Close Email Preview Modal if open
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title="Close"], button::-p-text("Close"), .modal-close');
      if (closeBtn) closeBtn.click();
      else {
        const btns = Array.from(document.querySelectorAll('button'));
        const close = btns.find(b => b.textContent.includes('Close') || b.textContent.includes('×') || b.textContent.includes('Back'));
        if (close) close.click();
      }
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 400)));

    // Click Release Incident Report button
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const releaseBtn = btns.find(b => b.textContent.toLowerCase().includes('release') || b.textContent.toLowerCase().includes('submit'));
      if (releaseBtn) releaseBtn.click();
    });
    await page.evaluate(() => new Promise(r => setTimeout(r, 800)));

    // 07: Step 4 Release Confirmation Modal
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_incident_release_confirmation.png') });
    console.log('Saved 07_incident_release_confirmation.png');

    // 08: Tablet Viewport 768x1024
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 400)));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_tablet_viewport_768x1024.png') });
    console.log('Saved 08_tablet_viewport_768x1024.png');

  } catch (err) {
    console.error('Puppeteer capture error:', err);
  } finally {
    await browser.close();
    previewProcess.kill();
  }

  // Print SHA-256 Hashes
  console.log('\n--- VERIFYING SHA-256 HASHES ---');
  const files = [
    '01_rep_home_dashboard.png',
    '02_incident_step1_assignment.png',
    '03_incident_step3_describe.png',
    '04_incident_step3_filled.png',
    '05_incident_step4_audit.png',
    '06_incident_step4_email_preview.png',
    '07_incident_release_confirmation.png',
    '08_tablet_viewport_768x1024.png'
  ];

  const hashes = {};
  files.forEach(f => {
    const p = path.join(ARTIFACT_DIR, f);
    if (fs.existsSync(p)) {
      const h = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
      hashes[f] = h;
      console.log(`${f}: ${h}`);
    }
  });

  const uniqueHashes = new Set(Object.values(hashes));
  console.log(`\nTotal Unique Screenshot Hashes: ${uniqueHashes.size} / ${files.length}`);
}

run();
