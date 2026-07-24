// render_pdf_to_png.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

  const pdfPath = path.join(__dirname, 'Invoice_INV-AKG-2026-20HRS_v5.pdf');
  const pdfUrl = `file:///${pdfPath.replace(/\\/g, '/')}`;

  console.log("Rendering PDF to PNG screenshot from:", pdfUrl);
  await page.goto(pdfUrl, { waitUntil: 'networkidle0' });

  const outPng = path.join(__dirname, 'pdf_render_v5.png');
  await page.screenshot({ path: outPng, fullPage: true });

  const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
  if (fs.existsSync(artifactDir)) {
    fs.copyFileSync(outPng, path.join(artifactDir, 'pdf_render_v4.png'));
  }

  console.log("Saved PDF page screenshot to:", outPng);
  await browser.close();
})();
