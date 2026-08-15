const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function renderDiagramPNGs() {
  console.log('=== RENDERING HIGH-RES DIAGRAM PNGs VIA PUPPETEER ===');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1400, height: 1200, deviceScaleFactor: 2 });
  
  const htmlPath = path.join(__dirname, '..', 'downloadable_diagrams.html');
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0' });
  
  // Wait for Mermaid rendering
  await page.waitForSelector('.mermaid svg');

  const diagrams = [
    { id: 'diag1', filename: 'IDS_Pulse_MultiRole_Flow.png' },
    { id: 'diag2', filename: 'IDS_Pulse_Field_Incident_Flow.png' },
    { id: 'diag3', filename: 'IDS_Pulse_Admin_Onboarding_Flow.png' }
  ];

  for (const diag of diagrams) {
    const element = await page.$(`#${diag.id}`);
    if (element) {
      const outputPath = path.join(__dirname, '..', diag.filename);
      await element.screenshot({ path: outputPath, omitBackground: false });
      console.log(`Saved High-Res PNG: ${diag.filename}`);
    } else {
      console.warn(`Element #${diag.id} not found.`);
    }
  }

  await browser.close();
  console.log('=== ALL DIAGRAM PNGs RENDERED & SAVED SUCCESSFULLY ===');
}

renderDiagramPNGs().catch(err => {
  console.error('Error rendering PNGs:', err);
});
