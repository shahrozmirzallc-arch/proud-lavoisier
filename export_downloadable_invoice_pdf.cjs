// export_downloadable_invoice_pdf.cjs
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  console.log("=================================================");
  console.log(" EXPORTING REAL 20-HOUR DOWNLOADABLE INVOICE PDF ");
  console.log("=================================================");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,1000']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  // Enable download behavior
  const downloadPath = path.join(__dirname, 'downloads');
  if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

  const client = await page.target().createCDPSession();
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  console.log("Navigating to http://localhost:4173...");
  await page.goto('http://localhost:4173', { waitUntil: 'domcontentloaded' });
  await sleep(1000);

  // Authenticate as Colleen
  await page.waitForSelector('#login-username', { timeout: 10000 });
  await page.type('#login-username', 'colleen');
  await page.type('#login-password', 'Colleen2026!');
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => sessionStorage.getItem('ids_pulse_unlocked') === 'true', { timeout: 10000 });
  await sleep(2000);

  // Open 20-hour invoice payload
  await page.evaluate(() => {
    const payload = {
      client: { name: 'Auto-Kabel Group North America' },
      invoiceNum: 'INV-AKG-2026-20HRS',
      invoiceDate: new Date().toLocaleDateString('en-US'),
      poNumber: 'PO-AKG-984210',
      terms: 'Net 30',
      repName: 'Hugo V. (QRE Specialist)',
      shipDate: new Date().toLocaleDateString('en-US'),
      via: 'Direct Quality Audit',
      fob: 'FOB Destination',
      projectName: 'Ford Oakville Line 2 Wire Harness Containment',
      shipToText: 'Liaison QA Lead at\nFord Oakville Assembly Plant\nGate 4 Sorting Bay',
      invoiceToLines: [
        'Auto-Kabel Management GmbH & Co. KG',
        'Attn: Accounts Payable & Quality Purchasing',
        'Direct PO Ref: PO-AKG-984210',
        '47800 Anchor Court, Plymouth MI 48170',
        'Tax ID / VAT: US-982400192'
      ],
      items: [
        {
          quantity: 20.0,
          item: 'Contractor Quality Audit Hours',
          description: 'Liaison Quality Inspection & Sorting Services by Integrity Driven Solutions\nField Rep: Hugo V. | 20.0 Billable Hours @ $34.00/hr\nContainment Project: Ford Oakville Line 2 Main Harness Defect Audit',
          um: 'hr',
          priceEach: 34.00,
          amount: 680.00
        }
      ],
      taxAmount: 0.00,
      currency: 'USD',
      gstHstNo: '853120236'
    };

    const evt = new CustomEvent('ids_pulse_open_invoice', { detail: payload });
    window.dispatchEvent(evt);
  });

  await sleep(2000);

  // Click Download PDF button
  console.log("Triggering 1-Click PDF Download...");
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const downloadBtn = buttons.find(b => b.textContent.includes('Download PDF'));
    if (downloadBtn) downloadBtn.click();
  });

  await sleep(3000);

  // Check downloaded file
  const files = fs.readdirSync(downloadPath);
  console.log("Downloaded files:", files);

  const pdfFile = files.find(f => f.endsWith('.pdf'));
  if (pdfFile) {
    const srcPdf = path.join(downloadPath, pdfFile);
    const targetPdf = path.join(__dirname, 'Invoice_INV-AKG-2026-20HRS_v5.pdf');
    fs.copyFileSync(srcPdf, targetPdf);

    const artifactDir = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\db8c5851-2fbb-4e2e-a61d-b7dfddf9f71f';
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(srcPdf, path.join(artifactDir, 'Invoice_INV-AKG-2026-20HRS_v5.pdf'));
    }
    console.log("Successfully exported downloadable PDF to:", targetPdf);
  }

  await browser.close();
  console.log("PDF export flow completed successfully!");
})();
