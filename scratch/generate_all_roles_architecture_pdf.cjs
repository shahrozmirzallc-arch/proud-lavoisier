// scratch/generate_all_roles_architecture_pdf.cjs
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\4c35684b-2cd3-442f-8986-5b75cde644e6';
const DOWNLOADS_DIR = 'C:\\Users\\Sharoz\\Downloads';
const PDF_OUTPUT_PATH = path.join(DOWNLOADS_DIR, 'IDS_Pulse_Role_Architecture_Specification.pdf');
const ARTIFACT_PDF_PATH = path.join(ARTIFACTS_DIR, 'IDS_Pulse_Role_Architecture_Specification.pdf');

// Read Canonical Logo
const logoFilePath = path.join(process.cwd(), 'src/components/LogoBase64.js');
let logoBase64 = '';
try {
  const fileContent = fs.readFileSync(logoFilePath, 'utf8');
  const match = fileContent.match(/export const LOGO_BASE64 = "(data:image\/png;base64,[^"]+)";/);
  if (match && match[1]) {
    logoBase64 = match[1];
  }
} catch (e) {
  console.warn('Could not read logo, fallback to empty string');
}

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>IDS Pulse — Role Architecture & System Specification</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');

  @page {
    size: letter portrait;
    margin: 12mm 14mm 14mm 14mm;
    @bottom-center {
      content: "Page " counter(page) " of " counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #64748b;
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0f172a;
    background-color: #ffffff;
    font-size: 9.5pt;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page-break {
    page-break-after: always;
  }

  .header-table {
    width: 100%;
    border-bottom: 2.5px solid #008F72;
    padding-bottom: 10px;
    margin-bottom: 16px;
  }

  .logo-img {
    height: 38px;
    object-fit: contain;
  }

  .doc-badge {
    display: inline-block;
    background-color: #008F72;
    color: #ffffff;
    font-size: 7.5pt;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  h1 {
    font-size: 16pt;
    font-weight: 900;
    color: #0a1628;
    letter-spacing: -0.4px;
    margin-bottom: 4px;
  }

  h2 {
    font-size: 12pt;
    font-weight: 800;
    color: #0a1628;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 4px;
    margin-top: 14px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  h3 {
    font-size: 10pt;
    font-weight: 800;
    color: #1e293b;
    margin-top: 8px;
    margin-bottom: 4px;
  }

  p {
    margin-bottom: 6px;
    color: #334155;
  }

  .role-card {
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    background-color: #f8fafc;
  }

  .role-card-admin { border-left: 5px solid #f59e0b; }
  .role-card-rep { border-left: 5px solid #008F72; }
  .role-card-client { border-left: 5px solid #1e40af; }
  .role-card-supplier { border-left: 5px solid #475569; }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-admin { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .badge-rep { background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
  .badge-client { background-color: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
  .badge-supplier { background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }

  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8px;
    margin-bottom: 12px;
    font-size: 8.5pt;
  }

  table.data-table th, table.data-table td {
    border: 1px solid #cbd5e1;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }

  table.data-table th {
    background-color: #f1f5f9;
    color: #0f172a;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    font-size: 8pt;
  }

  table.data-table tr:nth-child(even) {
    background-color: #f8fafc;
  }

  .workflow-step {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    align-items: flex-start;
  }

  .step-num {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #008F72;
    color: #ffffff;
    font-size: 8pt;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    font-weight: 700;
    color: #0f172a;
    font-size: 9pt;
  }

  .step-desc {
    font-size: 8.5pt;
    color: #475569;
  }

  .callout {
    background-color: #eff6ff;
    border: 1.5px solid #bfdbfe;
    border-radius: 6px;
    padding: 8px 12px;
    margin-top: 8px;
    margin-bottom: 10px;
    font-size: 8.5pt;
    color: #1e3a8a;
  }

  .callout-title {
    font-weight: 800;
    text-transform: uppercase;
    font-size: 8pt;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
    color: #1d4ed8;
  }

  .footer-meta {
    font-size: 7.5pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <table class="header-table">
    <tr>
      <td style="width: 50%;">
        ${logoBase64 ? `<img src="${logoBase64}" alt="IDS Logo" class="logo-img" />` : `<strong>INTEGRITY DRIVEN SOLUTIONS INC.</strong>`}
      </td>
      <td style="width: 50%; text-align: right;">
        <span class="doc-badge">Official Architecture Specification</span>
        <div style="font-size: 8pt; color: #475569; margin-top: 3px; font-family: 'JetBrains Mono', monospace; font-weight: 700;">
          DOC-ID: IDS-ARCH-2026-V4
        </div>
      </td>
    </tr>
  </table>

  <h1>IDS Pulse — Role Architecture & System Specification</h1>
  <p style="font-size: 10pt; font-weight: 600; color: #008F72; margin-bottom: 12px;">
    Enterprise Automotive Quality Tracking, Floor Dispatches & Client Multi-Role Architecture
  </p>

  <div class="callout">
    <div class="callout-title">Executive Summary</div>
    The <strong>IDS Pulse Platform</strong> by Integrity Driven Solutions Inc. (IDS) connects plant-floor field quality operations with real-time executive visibility. The system provides strict role-based access control (RBAC), multi-tier rate resolution (CAD/USD), automated PDF/HTML reporting, emergency shift handovers (Zero-Hours-Waste), and 100% truthful data lifecycle management.
  </div>

  <h2>1. End-to-End Multi-Role Operational Lifecycle</h2>

  <div class="workflow-step">
    <div class="step-num">1</div>
    <div class="step-content">
      <div class="step-title">Project, PO Budget & Rates Onboarding <span class="badge badge-admin">Super-Admin</span></div>
      <div class="step-desc">Super-Admin creates client profiles (GM, Stellantis, Magna), assigns assembly plant locations, registers purchase order caps (e.g. 00011000), and defines location-based currencies (US = USD, Canada = CAD).</div>
    </div>
  </div>

  <div class="workflow-step">
    <div class="step-num">2</div>
    <div class="step-content">
      <div class="step-title">Shift Clock-In, Walk Areas & Routine Sorting <span class="badge badge-rep">Field Rep</span></div>
      <div class="step-desc">Field Inspector launches mobile app, clocks in with GPS timestamp, executes 5 standard plant walks (Scrap Table, SAC Dept, Stamping, Chassis, Heavy Repair), logs pass/reject quantities with barcode scanning, and records containment rework.</div>
    </div>
  </div>

  <div class="workflow-step">
    <div class="step-num">3</div>
    <div class="step-content">
      <div class="step-title">Shift Submission & Quality Incident Holds <span class="badge badge-rep">Field Rep</span></div>
      <div class="step-desc">Field Rep submits Daily Quality Report and logs ad-hoc floor containment requests (+ Add Sort / Audit). Any critical defects generate immediate Quality Incident Holds with photo evidence routed to Client Quality Contacts.</div>
    </div>
  </div>

  <div class="workflow-step">
    <div class="step-num">4</div>
    <div class="step-content">
      <div class="step-title">Review, Governance & Client Publishing <span class="badge badge-admin">Super-Admin</span></div>
      <div class="step-desc">Operations team reviews submitted shift hours against PO caps, verifies rate resolution integrity, publishes report to Client Portal, and triggers automated PDF and HTML email dispatches.</div>
    </div>
  </div>

  <div class="workflow-step">
    <div class="step-num">5</div>
    <div class="step-content">
      <div class="step-title">Executive Feed, Overtime Sign-off & Timesheets <span class="badge badge-client">Client Manager</span></div>
      <div class="step-desc">Client Quality Managers inspect live defect feeds, download authoritative signed PDF reports, verify PO hours consumption, and sign off on inspector overtime requests.</div>
    </div>
  </div>

  <h2>2. System Permissions & Access Control Matrix</h2>

  <table class="data-table">
    <thead>
      <tr>
        <th>System Module / Capability</th>
        <th>Super-Admin<br><span style="font-weight: normal; font-size: 7.5pt;">(shahroz, donna, greg)</span></th>
        <th>IDS Field Rep<br><span style="font-weight: normal; font-size: 7.5pt;">(Clarence, Hugo, Nabil)</span></th>
        <th>Client Quality Mgr<br><span style="font-weight: normal; font-size: 7.5pt;">(Robert, Mark, Sarah)</span></th>
        <th>Supplier Quality<br><span style="font-weight: normal; font-size: 7.5pt;">(Tier-1 Vendors)</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Project & PO Budget Onboarding</strong></td>
        <td>Full Access</td>
        <td>No Access</td>
        <td>No Access</td>
        <td>No Access</td>
      </tr>
      <tr>
        <td><strong>Rate Engine & Currency Config</strong></td>
        <td>Full Access</td>
        <td>No Access</td>
        <td>No Access</td>
        <td>No Access</td>
      </tr>
      <tr>
        <td><strong>Emergency Shift Handover</strong></td>
        <td>Full Access</td>
        <td>No Access</td>
        <td>No Access</td>
        <td>No Access</td>
      </tr>
      <tr>
        <td><strong>Clock In / Shift Timer (GPS)</strong></td>
        <td>Full Access (Override)</td>
        <td>Full Access (Mobile)</td>
        <td>No Access</td>
        <td>No Access</td>
      </tr>
      <tr>
        <td><strong>5 Walk Areas & Routine Sorting</strong></td>
        <td>Full Access</td>
        <td>Full Access</td>
        <td>No Access</td>
        <td>No Access</td>
      </tr>
      <tr>
        <td><strong>Incident Logging (Floor)</strong></td>
        <td>Full Access</td>
        <td>Full Access</td>
        <td>No Access</td>
        <td>No Access</td>
      </tr>
      <tr>
        <td><strong>Shift Report Review & Publish</strong></td>
        <td>Full Access</td>
        <td>Submit Drafts</td>
        <td>View Published Only</td>
        <td>View Published Only</td>
      </tr>
      <tr>
        <td><strong>Client Portal & Live Incidents</strong></td>
        <td>Full Access</td>
        <td>No Access</td>
        <td>Full Access (Isolated)</td>
        <td>View Own Parts</td>
      </tr>
      <tr>
        <td><strong>Overtime Sign-Off Workflow</strong></td>
        <td>Full Access</td>
        <td>Request Only</td>
        <td>Approve / Reject</td>
        <td>No Access</td>
      </tr>
      <tr>
        <td><strong>Batch Invoicing & Financials</strong></td>
        <td>Full Access</td>
        <td>View Pay Only</td>
        <td>View Invoices</td>
        <td>No Access</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== PAGE 2 ==================== -->
  <table class="header-table">
    <tr>
      <td style="width: 50%;">
        ${logoBase64 ? `<img src="${logoBase64}" alt="IDS Logo" class="logo-img" />` : `<strong>INTEGRITY DRIVEN SOLUTIONS INC.</strong>`}
      </td>
      <td style="width: 50%; text-align: right;">
        <span class="doc-badge">Role Architecture Specifications</span>
        <div style="font-size: 8pt; color: #475569; margin-top: 3px; font-family: 'JetBrains Mono', monospace; font-weight: 700;">
          DOC-ID: IDS-ARCH-2026-V4
        </div>
      </td>
    </tr>
  </table>

  <h2>3. Role-by-Role Deep Dive Specifications</h2>

  <!-- ROLE 1: SUPER-ADMIN -->
  <div class="role-card role-card-admin">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <h3 style="color: #92400e; margin: 0;">Role 1: Super-Admin & Operations Leadership</h3>
      <span class="badge badge-admin">Executive Super-Admin</span>
    </div>
    <p><strong>Authorized Accounts:</strong> <code>shahroz</code> (Sole Unalterable Super-Admin), <code>donna</code> (Operations Lead), <code>greg</code> (Executive Director), <code>admin</code>.</p>
    <p><strong>Primary Utility & Workflows:</strong></p>
    <ul style="padding-left: 18px; margin-bottom: 6px; font-size: 8.5pt; color: #334155;">
      <li><strong>Client & Plant Onboarding:</strong> Allocates PO budgets ($/Hours), registers suspect part numbers, sets location currencies (US = USD, Canada = CAD).</li>
      <li><strong>Daily Tasks & Dispatch Planner:</strong> Schedules plant walk routines and dispatches urgent inspection priorities directly to field rep mobile devices.</li>
      <li><strong>Emergency Shift Transfer (Zero Hours Waste):</strong> Reassigns active shift projects between inspectors seamlessly without losing tracked hours.</li>
      <li><strong>Shift Report Governance:</strong> Validates shift reports, verifies PO hour burn, and publishes verified records to client portals.</li>
      <li><strong>Timesheets & Invoicing:</strong> Approves regular and overtime hours, compiles batch invoice payloads, and monitors billing margin telemetry.</li>
    </ul>
  </div>

  <!-- ROLE 2: FIELD REP -->
  <div class="role-card role-card-rep">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <h3 style="color: #065f46; margin: 0;">Role 2: IDS Field Quality Liaison Inspector (Rep)</h3>
      <span class="badge badge-rep">Field Operations</span>
    </div>
    <p><strong>Authorized Accounts:</strong> <code>Clarence Kuiken</code> (Senior Liaison Rep), <code>Hugo Ramos</code>, <code>Nabil</code>, <code>Rogelio</code>.</p>
    <p><strong>Primary Utility & Workflows:</strong></p>
    <ul style="padding-left: 18px; margin-bottom: 6px; font-size: 8.5pt; color: #334155;">
      <li><strong>Mobile Terminal Execution:</strong> Runs native Flutter Android APK (or mobile web) on plant floor with full offline caching and camera support.</li>
      <li><strong>Shift Clock-In / Timer:</strong> Records shift start with GPS timestamp and active plant location synchronization.</li>
      <li><strong>5 Standard Walk Areas:</strong> Completes mandatory inspection walkthroughs (Heavy Repair, Review Scrap Table, SAC Dept, Stamping, Chassis).</li>
      <li><strong>Routine Sorting & Barcode Scanner:</strong> Logs inspected batches (Pass/Reject counters) with continuous camera QR/barcode scanning.</li>
      <li><strong>Containment Rework & Ad-hoc Sorts:</strong> Records containment rework hours and logs supervisor requests via <code>+ Add Sort / Audit</code>.</li>
      <li><strong>Incident Hold Logger:</strong> Documents part defects, attaches photos/audio memos, and routes to selected Client Quality Contacts.</li>
    </ul>
  </div>

  <!-- ROLE 3: CLIENT QUALITY MANAGER -->
  <div class="role-card role-card-client">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <h3 style="color: #1e40af; margin: 0;">Role 3: Client Quality Representative / Customer Manager</h3>
      <span class="badge badge-client">Customer Portal</span>
    </div>
    <p><strong>Authorized Accounts:</strong> <code>Robert Sterling</code> & <code>Elena Rostova</code> (Magna), <code>Mark Vance</code> (Stellantis), <code>Sarah Jenkins</code> (GM).</p>
    <p><strong>Primary Utility & Workflows:</strong></p>
    <ul style="padding-left: 18px; margin-bottom: 6px; font-size: 8.5pt; color: #334155;">
      <li><strong>Client Executive Portal:</strong> Isolated customer portal displaying only authoritative quality metrics for their specific plant.</li>
      <li><strong>Live Quality Incidents Feed:</strong> Immediate visibility into containment holds, severity levels, containment actions, and evidence photos.</li>
      <li><strong>Published Reports Viewer:</strong> View and download official daily quality reports carrying canonical IDS branding.</li>
      <li><strong>PO Budget & Hours Burn:</strong> Transparent real-time tracking of authorized PO hours, consumed hours, and balance remaining.</li>
      <li><strong>Overtime Approval Workflow:</strong> One-click review and sign-off on inspector overtime requests with recorded manager comments.</li>
    </ul>
  </div>

  <!-- ROLE 4: SUPPLIER QUALITY LEAD -->
  <div class="role-card role-card-supplier">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
      <h3 style="color: #334155; margin: 0;">Role 4: Supplier Quality Lead / Tier-1 Vendor</h3>
      <span class="badge badge-supplier">Tier-1 Quality Hub</span>
    </div>
    <p><strong>Authorized Accounts:</strong> Component Part Suppliers & Quality Directors (e.g. Linamar, Multimatic, Martinrea).</p>
    <p><strong>Primary Utility & Workflows:</strong></p>
    <ul style="padding-left: 18px; margin-bottom: 6px; font-size: 8.5pt; color: #334155;">
      <li><strong>PPM Quality Scorecard:</strong> Tracks parts-per-million defect rates and historical quality trends across assembly plants.</li>
      <li><strong>Suspect Batch Containment:</strong> Real-time visibility into sorting results for quarantined part lots (e.g. PN 7T4Z-7000-A).</li>
      <li><strong>Inspection Yield Metrics:</strong> Complete piece count breakdowns (Passed vs Reworked vs Scrapped) per shift.</li>
    </ul>
  </div>

  <h2>4. Enterprise System Guardrails (Rules 1–16 Compliance)</h2>
  <ul style="padding-left: 18px; font-size: 8.5pt; color: #334155;">
    <li><strong>Rule 6 (Reporting & Branding):</strong> Official approved logo on all human-readable reports with zero text truncation.</li>
    <li><strong>Rule 7 (Super-Admin Protection):</strong> Shahroz Mirza (<code>shahroz</code>) is the sole unalterable Super-Admin with locked password.</li>
    <li><strong>Rule 8 (Role Distinction):</strong> Strict separation between IDS Field Reps (staff inspectors) and Client Reps (customer managers).</li>
    <li><strong>Rule 11 (Currency Rule):</strong> Location-based billing & pay currency (US plants = USD, Canadian plants = CAD).</li>
    <li><strong>Rule 14 (Zero Emojis):</strong> Emojis are strictly banned across UI, buttons, reports, and communications. Clean SVG icons only.</li>
    <li><strong>Rule 15 (Unified Rate Engine):</strong> 3-tier authoritative fallback engine; zero raw placeholder codes (<code>__new__</code>) exposed.</li>
    <li><strong>Rule 16 (Theme & Modal Contrast):</strong> WCAG AAA >7:1 contrast ratio; zero dark container leaks inside light surfaces.</li>
  </ul>

  <div class="footer-meta">
    <span>Integrity Driven Solutions Inc. — Confidential Architecture Specification</span>
    <span>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
    <span>Compliance: ISO/TS 16949 Automotive Quality Standards</span>
  </div>

</body>
</html>
`;

async function generatePdf() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: PDF_OUTPUT_PATH,
    format: 'Letter',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '14mm',
      left: '14mm',
      right: '14mm'
    }
  });

  // Copy to Artifacts folder as well
  fs.copyFileSync(PDF_OUTPUT_PATH, ARTIFACT_PDF_PATH);
  console.log(`[PASS] Generated PDF at: ${PDF_OUTPUT_PATH}`);
  console.log(`[PASS] Copied PDF to Artifacts at: ${ARTIFACT_PDF_PATH}`);

  await browser.close();
}

generatePdf();
