const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\89428d1a-6335-42dd-8036-39f9c953213b';

async function runAudit() {
  console.log('Launching browser for real DOM verification & screenshot capture...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:4173...');
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });

  // 1. Sign in as Clarence Kuiken
  console.log('Signing in as Clarence Kuiken...');
  const clarenceBtn = await page.waitForSelector('button:has-text("Clarence Kuiken"), button:has-text("Sign in as Clarence")');
  if (clarenceBtn) {
    await clarenceBtn.click();
  } else {
    // Fill credentials manually
    await page.type('input[type="email"]', 'clarence@integritydrivensolutions.com');
    await page.type('input[type="password"]', 'Clarence121$');
    await page.click('button[type="submit"]');
  }

  await page.waitForTimeout(1500);

  // Capture Screenshot 1: Rep Home Dashboard
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_rep_home_dashboard.png') });
  console.log('Saved 01_rep_home_dashboard.png');

  // Click Log Incident
  const logIncBtn = await page.waitForSelector('button:has-text("Report Incident"), button:has-text("Log Incident"), [data-testid="log-incident-btn"]');
  await logIncBtn.click();
  await page.waitForTimeout(1000);

  // Capture Screenshot 2: Step 1 Assignment Selection
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_incident_step1_assignment.png') });
  console.log('Saved 02_incident_step1_assignment.png');

  // Proceed to Step 2
  const step1Next = await page.waitForSelector('button:has-text("Next Step"), button:has-text("Continue")');
  await step1Next.click();
  await page.waitForTimeout(800);

  // Confirm no traceability and proceed to Step 3
  const continueNoTraceability = await page.waitForSelector('button:has-text("Continue without traceability"), button:has-text("Skip Traceability")');
  await continueNoTraceability.click();
  await page.waitForTimeout(800);

  // Capture Screenshot 3: Step 3 Page 3 Overhaul
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_incident_step3_describe.png') });
  console.log('Saved 03_incident_step3_describe.png');

  // Fill Page 3 fields
  console.log('Filling Page 3 Describe fields...');
  const areaInput = await page.waitForSelector('input[placeholder*="Sequence Area"], input[placeholder*="Area Found"]');
  await areaInput.type('Heavy Repair Bay 3');

  const defectTypeInput = await page.waitForSelector('input[placeholder*="Loose component"]');
  await defectTypeInput.type('Hairline Crack');

  const suspectDefectArea = await page.waitForSelector('#suspect-defect-input');
  await suspectDefectArea.type('Hairline crack observed across upper housing lens seal during final quality audit.');

  const actionTakenArea = await page.waitForSelector('#action-taken-input');
  await actionTakenArea.type('Quarantined 2 suspect totes and notified line supervisor immediately.');

  // Click Yes on Returned to Supplier
  const returnedYes = await page.waitForSelector('button[aria-label="Returned to Supplier Yes"]');
  await returnedYes.click();

  // Click Yes on Sort Requested
  const sortYes = await page.waitForSelector('button[aria-label="Sort Requested Yes"]');
  await sortYes.click();

  // Click Yes on RMA Required
  const rmaYes = await page.waitForSelector('button[aria-label="RMA Required Yes"]');
  await rmaYes.click();

  const rmaInput = await page.waitForSelector('input[placeholder*="RMA"], input[placeholder*="Return Material Authorization"]');
  await rmaInput.type('RMA-2026-9901');

  await page.waitForTimeout(500);

  // Capture Screenshot 4: Step 3 Filled with Active Yes/No Buttons
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_incident_step3_filled.png') });
  console.log('Saved 04_incident_step3_filled.png');

  // Click Review & Send / Step 4
  const reviewBtn = await page.waitForSelector('button:has-text("Review & Send"), button:has-text("Step 4")');
  await reviewBtn.click();
  await page.waitForTimeout(1000);

  // Capture Screenshot 5: Step 4 Audit & Release
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_incident_step4_audit.png') });
  console.log('Saved 05_incident_step4_audit.png');

  // Expand Outgoing Email Preview
  const emailPreviewToggle = await page.waitForSelector('button:has-text("Inspect Outgoing Email Preview")');
  await emailPreviewToggle.click();
  await page.waitForTimeout(600);

  // Capture Screenshot 6: Email Preview Expanded with EMAIL SENDING OFF Badge
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_incident_step4_email_preview.png') });
  console.log('Saved 06_incident_step4_email_preview.png');

  // Click Release to Client Dashboard
  const releaseBtn = await page.waitForSelector('button:has-text("Release to Client Dashboard")');
  await releaseBtn.click();
  await page.waitForTimeout(1200);

  // Capture Screenshot 7: Release Confirmation Screen
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_incident_release_confirmation.png') });
  console.log('Saved 07_incident_release_confirmation.png');

  // Now change viewport to 768x1024 tablet verification
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_tablet_viewport_768x1024.png') });
  console.log('Saved 08_tablet_viewport_768x1024.png');

  await browser.close();
  console.log('Verification completed cleanly!');
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
