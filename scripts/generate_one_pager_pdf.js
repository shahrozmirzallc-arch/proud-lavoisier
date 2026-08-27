import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LOGO_BASE64 } from '../src/components/LogoBase64.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const htmlPath = path.resolve(__dirname, '../docs/IDS_PULSE_EXECUTIVE_PRODUCT_ONE_PAGER.html');
  const pdfPath = path.resolve(__dirname, '../docs/IDS_Pulse_Executive_One_Pager.pdf');

  console.log(`[1/3] Generating Executive One-Pager HTML at: ${htmlPath}`);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IDS Pulse — Executive Product One-Pager</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    @page {
      size: A4 portrait;
      margin: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #FFFFFF;
      color: #0F172A;
      width: 210mm;
      min-height: 297mm;
      padding: 10mm 12mm;
      margin: 0 auto;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .header-table {
      width: 100%;
      border-bottom: 2.5px solid #10284A;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }

    .logo-img {
      height: 38px;
      width: auto;
      object-fit: contain;
    }

    .badge-commercial {
      background: #0284C7;
      color: #FFFFFF;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
    }

    .hero-title {
      font-size: 20px;
      font-weight: 900;
      color: #10284A;
      letter-spacing: -0.02em;
      line-height: 1.15;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .hero-sub {
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    /* KPI Highlights */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .kpi-card {
      background: #F8FAFC;
      border: 1.5px solid #CBD5E1;
      border-radius: 10px;
      padding: 8px 10px;
      text-align: center;
    }

    .kpi-val {
      font-size: 17px;
      font-weight: 900;
      color: #0284C7;
      line-height: 1;
      margin-bottom: 3px;
    }

    .kpi-val.green { color: #16A34A; }
    .kpi-val.amber { color: #D97706; }
    .kpi-val.navy { color: #10284A; }

    .kpi-label {
      font-size: 8.5px;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* 4 Pillars Grid */
    .section-heading {
      font-size: 12px;
      font-weight: 900;
      color: #10284A;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      border-left: 3.5px solid #0284C7;
      padding-left: 6px;
      margin-bottom: 8px;
    }

    .pillars-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }

    .pillar-card {
      background: #FFFFFF;
      border: 1.5px solid #CBD5E1;
      border-radius: 10px;
      padding: 10px 12px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .pillar-card.p1 { border-top: 3.5px solid #0284C7; }
    .pillar-card.p2 { border-top: 3.5px solid #16A34A; }
    .pillar-card.p3 { border-top: 3.5px solid #7C3AED; }
    .pillar-card.p4 { border-top: 3.5px solid #D97706; }

    .pillar-title {
      font-size: 11.5px;
      font-weight: 900;
      color: #10284A;
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pillar-pill {
      font-size: 7.5px;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .p1 .pillar-pill { background: #E0F2FE; color: #0369A1; }
    .p2 .pillar-pill { background: #DCFCE7; color: #15803D; }
    .p3 .pillar-pill { background: #F3E8FF; color: #6B21A8; }
    .p4 .pillar-pill { background: #FEF3C7; color: #B45309; }

    .pillar-desc {
      font-size: 9.5px;
      color: #334155;
      line-height: 1.35;
      font-weight: 600;
    }

    .pillar-list {
      margin-top: 5px;
      padding-left: 12px;
      font-size: 9px;
      color: #475569;
      font-weight: 600;
      line-height: 1.3;
    }

    .pillar-list li {
      margin-bottom: 2px;
    }

    /* Comparison / ROI Table */
    .roi-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-bottom: 12px;
    }

    .roi-table th {
      background: #10284A;
      color: #FFFFFF;
      padding: 6px 8px;
      text-align: left;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 8.5px;
    }

    .roi-table td {
      padding: 5px 8px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
      font-weight: 600;
    }

    .roi-table tr:nth-child(even) {
      background: #F8FAFC;
    }

    .highlight-cell {
      font-weight: 800;
      color: #15803D;
    }

    /* Trust & Security Badges */
    .badges-bar {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      background: #F1F5F9;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 6px 10px;
      margin-bottom: 10px;
    }

    .trust-badge {
      font-size: 8.5px;
      font-weight: 800;
      color: #1E293B;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .trust-badge span {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #16A34A;
    }

    /* Footer */
    .footer-bar {
      border-top: 1.5px solid #CBD5E1;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8.5px;
      color: #64748B;
      font-weight: 600;
    }

    .footer-bar strong {
      color: #10284A;
      font-weight: 800;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align:middle;">
        <img class="logo-img" src="${LOGO_BASE64}" alt="IDS Logo">
      </td>
      <td style="text-align:right; vertical-align:middle;">
        <span class="badge-commercial">Commercial Capability Brief</span>
        <div style="font-size:8.5px; font-weight:800; color:#64748B; margin-top:3px; letter-spacing:0.04em;">
          INTEGRITY DRIVEN SOLUTIONS INC. (IDS)
        </div>
      </td>
    </tr>
  </table>

  <!-- Hero Headline -->
  <div class="hero-title">
    IDS PULSE — Automotive Quality & Containment Operating Platform
  </div>
  <div class="hero-sub">
    The all-in-one digital operating platform engineered for Tier-1 automotive suppliers and OEM assembly plants. Eliminate containment blind spots, protect assembly line continuity, and automate daily shift reporting across the United States and Canada.
  </div>

  <!-- KPI Highlights -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-val">$50K/MIN</div>
      <div class="kpi-label">Line Stop Protection</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val green">&lt; 2 SEC</div>
      <div class="kpi-label">PDF Report Speed</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val amber">0% LOSS</div>
      <div class="kpi-label">Offline Plant Sync</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-val navy">100%</div>
      <div class="kpi-label">PO Budget Control</div>
    </div>
  </div>

  <!-- 4 Core Pillars -->
  <div class="section-heading">Integrated Platform Architecture</div>
  <div class="pillars-grid">
    
    <!-- Pillar 1 -->
    <div class="pillar-card p1">
      <div class="pillar-title">
        <span>01. Mobile Quality Inspector Client</span>
        <span class="pillar-pill">Android / PWA</span>
      </div>
      <div class="pillar-desc">
        Field inspector mobile tool for rapid containment execution directly on the assembly floor.
      </div>
      <ul class="pillar-list">
        <li><strong>1-Tap GPS Clock-In:</strong> Live running shift timer and timestamp.</li>
        <li><strong>Container Barcode Scanner:</strong> High-speed camera QR/lot reading.</li>
        <li><strong>Photo Canvas Defect Markup:</strong> Draw arrows and callouts on part photos.</li>
        <li><strong>Durable Offline Outbox:</strong> Zero data loss in steel plant dead-zones.</li>
      </ul>
    </div>

    <!-- Pillar 2 -->
    <div class="pillar-card p2">
      <div class="pillar-title">
        <span>02. HQ Web Operations Command</span>
        <span class="pillar-pill">Web Hub</span>
      </div>
      <div class="pillar-desc">
        Mission control for QA directors and operations managers overseeing multi-plant quality.
      </div>
      <ul class="pillar-list">
        <li><strong>Live Shift Telemetry:</strong> Real-time piece count and defect streaming.</li>
        <li><strong>Multi-Plant Master Matrix:</strong> Rollup across all US & Canadian facilities.</li>
        <li><strong>1-Click QA Publishing Gate:</strong> Review and release reports to clients.</li>
        <li><strong>Automated Email Dispatch:</strong> PDF/HTML daily digests sent to client SQEs.</li>
      </ul>
    </div>

    <!-- Pillar 3 -->
    <div class="pillar-card p3">
      <div class="pillar-title">
        <span>03. Client Executive Portal</span>
        <span class="pillar-pill">Client View</span>
      </div>
      <div class="pillar-desc">
        Isolated customer portal granting Tier-1 Quality Managers instant transparency.
      </div>
      <ul class="pillar-list">
        <li><strong>Certified Clean Lot Feed:</strong> Real-time container lot release statuses.</li>
        <li><strong>Defect PPM Pareto Charts:</strong> Automated non-conformance trend analytics.</li>
        <li><strong>Overtime Authorization Drawer:</strong> 1-Click field overtime sign-off.</li>
        <li><strong>Strict Data Isolation:</strong> Zero exposure of internal margins or wage rates.</li>
      </ul>
    </div>

    <!-- Pillar 4 -->
    <div class="pillar-card p4">
      <div class="pillar-title">
        <span>04. Financials & Rate Resolver</span>
        <span class="pillar-pill">Accounting</span>
      </div>
      <div class="pillar-desc">
        Automated billing and pay rate engine enforcing strict contract compliance.
      </div>
      <ul class="pillar-list">
        <li><strong>Dynamic CAD / USD Resolver:</strong> Automatic location currency rules.</li>
        <li><strong>PO Budget Cap Warning Meters:</strong> Alerts at 80% and 100% spend.</li>
        <li><strong>Pixel-Perfect PDF Invoicing:</strong> 1-Click commercial invoice creation.</li>
        <li><strong>QuickBooks Integration:</strong> Automated payroll and billing CSV export.</li>
      </ul>
    </div>

  </div>

  <!-- Operational ROI Impact Table -->
  <div class="section-heading">Operational Transformation & Business ROI</div>
  <table class="roi-table">
    <thead>
      <tr>
        <th style="width: 25%;">Operational Vector</th>
        <th style="width: 35%;">Traditional Industry Baseline</th>
        <th style="width: 40%;">IDS Pulse Enterprise Platform</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Shift Report Delivery</strong></td>
        <td>Manual paper/Excel; 24 to 48 hours latency</td>
        <td class="highlight-cell">Sub-second real-time streaming + instant PDF</td>
      </tr>
      <tr>
        <td><strong>Plant Floor Connectivity</strong></td>
        <td>Data dropped in dead-zones; lost records</td>
        <td class="highlight-cell">100% resilient IndexedDB offline queue</td>
      </tr>
      <tr>
        <td><strong>Defect Evidence Capture</strong></td>
        <td>Unsorted camera rolls & blurry email attachments</td>
        <td class="highlight-cell">Structured base64 canvas markup + part metadata</td>
      </tr>
      <tr>
        <td><strong>Purchase Order Integrity</strong></td>
        <td>Frequent unbilled hours & budget overruns</td>
        <td class="highlight-cell">Hard PO caps with automated threshold warning meters</td>
      </tr>
      <tr>
        <td><strong>Client Transparency</strong></td>
        <td>Disputed timesheets & phone tag for overtime</td>
        <td class="highlight-cell">Dedicated Client Portal with 1-Click OT sign-off</td>
      </tr>
    </tbody>
  </table>

  <!-- Trust & Compliance Bar -->
  <div class="badges-bar">
    <div class="trust-badge"><span></span> IATF 16949 / ISO 9001 Alignment</div>
    <div class="trust-badge"><span></span> WCAG AAA High-Contrast (&gt;7:1)</div>
    <div class="trust-badge"><span></span> PostgreSQL Row-Level Security</div>
    <div class="trust-badge"><span></span> USD / CAD Multi-Currency Engine</div>
  </div>

  <!-- Footer -->
  <div class="footer-bar">
    <div><strong>Integrity Driven Solutions Inc. (IDS)</strong> | Operations: <strong>operations@integritydrivensolutions.ca</strong></div>
    <div>Live Production Suite: <strong>proud-lavoisier.vercel.app</strong></div>
  </div>

</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent);
  console.log(`[2/3] Launching Puppeteer to compile Executive One-Pager PDF...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    console.log(`[3/3] SUCCESS: Executive One-Pager PDF generated at: ${pdfPath}`);
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    await browser.close();
  }
}

main();
