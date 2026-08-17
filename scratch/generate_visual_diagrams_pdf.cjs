// scratch/generate_visual_diagrams_pdf.cjs
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\Sharoz\\.gemini\\antigravity\\brain\\4c35684b-2cd3-442f-8986-5b75cde644e6';
const DOWNLOADS_DIR = 'C:\\Users\\Sharoz\\Downloads';
const PDF_OUTPUT_PATH = path.join(DOWNLOADS_DIR, 'IDS_Pulse_Role_Architecture_Diagrams.pdf');
const ARTIFACT_PDF_PATH = path.join(ARTIFACTS_DIR, 'IDS_Pulse_Role_Architecture_Diagrams.pdf');

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
<title>IDS Pulse — Role Architecture Diagrams</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700;800&display=swap');

  @page {
    size: letter portrait;
    margin: 10mm 12mm 12mm 12mm;
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
    font-size: 9pt;
    line-height: 1.4;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page-break {
    page-break-after: always;
  }

  .header-table {
    width: 100%;
    border-bottom: 2.5px solid #008F72;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }

  .logo-img {
    height: 36px;
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
    font-size: 15pt;
    font-weight: 900;
    color: #0a1628;
    letter-spacing: -0.4px;
    margin-bottom: 4px;
  }

  h2 {
    font-size: 11pt;
    font-weight: 800;
    color: #0a1628;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 3px;
    margin-top: 10px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .diagram-container {
    width: 100%;
    background-color: #f8fafc;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .diagram-title {
    font-size: 9.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

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

  svg text {
    font-family: 'Inter', sans-serif;
  }

  .footer-meta {
    font-size: 7.5pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 4px;
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

  <!-- ==================== PAGE 1: END-TO-END PIPELINE & ROLE 1 & ROLE 2 ==================== -->
  <table class="header-table">
    <tr>
      <td style="width: 50%;">
        ${logoBase64 ? `<img src="${logoBase64}" alt="IDS Logo" class="logo-img" />` : `<strong>INTEGRITY DRIVEN SOLUTIONS INC.</strong>`}
      </td>
      <td style="width: 50%; text-align: right;">
        <span class="doc-badge">Role Architecture Diagrams</span>
        <div style="font-size: 8pt; color: #475569; margin-top: 3px; font-family: 'JetBrains Mono', monospace; font-weight: 700;">
          DOC-ID: IDS-DIAGRAMS-2026-V4
        </div>
      </td>
    </tr>
  </table>

  <h1>IDS Pulse — Visual Role Architecture & Flow Diagrams</h1>
  <p style="font-size: 9.5pt; font-weight: 600; color: #008F72; margin-bottom: 8px;">
    System Process Maps, Role Interaction Pipelines & Permission Boundaries
  </p>

  <!-- DIAGRAM 1: END TO END MULTI-ROLE WORKFLOW PIPELINE -->
  <div class="diagram-container">
    <div class="diagram-title" style="color: #0a1628;">
      <span>Diagram 1: End-to-End Multi-Role Workflow Pipeline</span>
      <span class="badge badge-admin">Phases 1 - 4</span>
    </div>
    <svg viewBox="0 0 720 175" width="100%" height="175">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
        </marker>
        <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#008F72" />
        </marker>
        <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
        </marker>
      </defs>

      <!-- Step 1: Admin Onboard -->
      <g transform="translate(10, 15)">
        <rect width="150" height="145" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
        <rect width="150" height="26" rx="8" fill="#d97706"/>
        <text x="75" y="18" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">1. SUPER-ADMIN</text>
        <text x="12" y="44" fill="#78350f" font-size="8.5" font-weight="700">Project & PO Onboard</text>
        <text x="12" y="60" fill="#92400e" font-size="7.5">- Create Client & Plant</text>
        <text x="12" y="74" fill="#92400e" font-size="7.5">- Set PO Budget (00011000)</text>
        <text x="12" y="88" fill="#92400e" font-size="7.5">- Rates (US=USD, CA=CAD)</text>
        <text x="12" y="104" fill="#78350f" font-size="8.5" font-weight="700">Daily Planner</text>
        <text x="12" y="120" fill="#92400e" font-size="7.5">- Assign Reps to Plants</text>
        <text x="12" y="134" fill="#92400e" font-size="7.5">- Dispatch Priority Tasks</text>
      </g>

      <!-- Arrow 1 -> 2 -->
      <path d="M 160 85 L 188 85" stroke="#d97706" stroke-width="2.5" marker-end="url(#arrow-amber)"/>

      <!-- Step 2: Field Rep Floor -->
      <g transform="translate(195, 15)">
        <rect width="160" height="145" rx="8" fill="#d1fae5" stroke="#059669" stroke-width="2"/>
        <rect width="160" height="26" rx="8" fill="#008F72"/>
        <text x="80" y="18" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">2. FIELD INSPECTOR</text>
        <text x="12" y="44" fill="#064e3b" font-size="8.5" font-weight="700">Plant Floor Execution</text>
        <text x="12" y="60" fill="#065f46" font-size="7.5">- GPS Clock-In & Shift Start</text>
        <text x="12" y="74" fill="#065f46" font-size="7.5">- 5 Walk Areas Routine</text>
        <text x="12" y="88" fill="#065f46" font-size="7.5">- Sorting (+1/+5/+10/+25)</text>
        <text x="12" y="102" fill="#065f46" font-size="7.5">- Camera QR/Barcode Scan</text>
        <text x="12" y="116" fill="#065f46" font-size="7.5">- + Add Sort / Audit Floor</text>
        <text x="12" y="134" fill="#065f46" font-size="7.5">- Sign Daily Quality Report</text>
      </g>

      <!-- Arrow 2 -> 3 -->
      <path d="M 355 85 L 378 85" stroke="#008F72" stroke-width="2.5" marker-end="url(#arrow-green)"/>

      <!-- Step 3: Admin Review & Publish -->
      <g transform="translate(385, 15)">
        <rect width="150" height="145" rx="8" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
        <rect width="150" height="26" rx="8" fill="#b45309"/>
        <text x="75" y="18" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">3. ADMIN REVIEW</text>
        <text x="12" y="44" fill="#78350f" font-size="8.5" font-weight="700">Governance & Publishing</text>
        <text x="12" y="60" fill="#92400e" font-size="7.5">- Verify Shift Hours Logged</text>
        <text x="12" y="74" fill="#92400e" font-size="7.5">- Audit PO Hours Burn</text>
        <text x="12" y="88" fill="#92400e" font-size="7.5">- Emergency Shift Handover</text>
        <text x="12" y="102" fill="#92400e" font-size="7.5">- Publish Shift Report</text>
        <text x="12" y="120" fill="#78350f" font-size="8.5" font-weight="700">Automated Dispatch</text>
        <text x="12" y="134" fill="#92400e" font-size="7.5">- PDF & HTML Email to Client</text>
      </g>

      <!-- Arrow 3 -> 4 -->
      <path d="M 535 85 L 558 85" stroke="#0284c7" stroke-width="2.5" marker-end="url(#arrow)"/>

      <!-- Step 4: Client Executive Portal -->
      <g transform="translate(565, 15)">
        <rect width="145" height="145" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
        <rect width="145" height="26" rx="8" fill="#1e40af"/>
        <text x="72" y="18" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">4. CLIENT PORTAL</text>
        <text x="10" y="44" fill="#1e3a8a" font-size="8.5" font-weight="700">Executive Oversight</text>
        <text x="10" y="60" fill="#1e40af" font-size="7.5">- Live Incident Feed</text>
        <text x="10" y="74" fill="#1e40af" font-size="7.5">- Containment Holds & Photos</text>
        <text x="10" y="88" fill="#1e40af" font-size="7.5">- Download Signed PDF</text>
        <text x="10" y="104" fill="#1e3a8a" font-size="8.5" font-weight="700">Governance Sign-Off</text>
        <text x="10" y="120" fill="#1e40af" font-size="7.5">- Overtime Approvals</text>
        <text x="10" y="134" fill="#1e40af" font-size="7.5">- PO Balance Monitoring</text>
      </g>
    </svg>
  </div>

  <!-- DIAGRAM 2: ROLE 1 SUPER-ADMIN DETAILED ARCHITECTURE -->
  <div class="diagram-container">
    <div class="diagram-title" style="color: #92400e;">
      <span>Diagram 2: Super-Admin & Operations Leadership Architecture</span>
      <span class="badge badge-admin">Role 1 Details</span>
    </div>
    <svg viewBox="0 0 720 140" width="100%" height="140">
      <!-- Center Hub -->
      <rect x="250" y="8" width="220" height="38" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
      <text x="360" y="24" fill="#f59e0b" font-size="9" font-weight="900" text-anchor="middle">SUPER-ADMIN COMMAND CENTER</text>
      <text x="360" y="38" fill="#94a3b8" font-size="7.5" font-weight="600" text-anchor="middle">shahroz, donna, greg, admin (Super-Admin Rights)</text>

      <!-- Connecting Lines -->
      <path d="M 360 46 L 70 85" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 46 L 210 85" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 46 L 360 85" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 46 L 510 85" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 46 L 650 85" stroke="#cbd5e1" stroke-width="2"/>

      <!-- Node 1: Onboarding -->
      <g transform="translate(10, 85)">
        <rect width="125" height="48" rx="6" fill="#ffffff" stroke="#f59e0b" stroke-width="1.5"/>
        <text x="62" y="16" fill="#0f172a" font-size="8" font-weight="800" text-anchor="middle">Onboarding & Rates</text>
        <text x="62" y="28" fill="#64748b" font-size="7" text-anchor="middle">Clients, Plants & PO Caps</text>
        <text x="62" y="38" fill="#d97706" font-size="7" font-weight="700" text-anchor="middle">CAD / USD Rate Engine</text>
      </g>

      <!-- Node 2: Daily Planner -->
      <g transform="translate(150, 85)">
        <rect width="125" height="48" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
        <text x="62" y="16" fill="#0f172a" font-size="8" font-weight="800" text-anchor="middle">Daily Planner Hub</text>
        <text x="62" y="28" fill="#64748b" font-size="7" text-anchor="middle">Assign Reps & Walk Areas</text>
        <text x="62" y="38" fill="#0284c7" font-size="7" font-weight="700" text-anchor="middle">Real-time Task Dispatch</text>
      </g>

      <!-- Node 3: Shift Handover -->
      <g transform="translate(295, 85)">
        <rect width="130" height="48" rx="6" fill="#ffffff" stroke="#d97706" stroke-width="1.5"/>
        <text x="65" y="16" fill="#0f172a" font-size="8" font-weight="800" text-anchor="middle">Emergency Handover</text>
        <text x="65" y="28" fill="#64748b" font-size="7" text-anchor="middle">Zero-Hours-Waste Protocol</text>
        <text x="65" y="38" fill="#059669" font-size="7" font-weight="700" text-anchor="middle">Instant Inspector Swap</text>
      </g>

      <!-- Node 4: Reports Governance -->
      <g transform="translate(445, 85)">
        <rect width="125" height="48" rx="6" fill="#ffffff" stroke="#059669" stroke-width="1.5"/>
        <text x="62" y="16" fill="#0f172a" font-size="8" font-weight="800" text-anchor="middle">Reports Governance</text>
        <text x="62" y="28" fill="#64748b" font-size="7" text-anchor="middle">Submitted -> Published</text>
        <text x="62" y="38" fill="#059669" font-size="7" font-weight="700" text-anchor="middle">Automated Email Dispatch</text>
      </g>

      <!-- Node 5: Invoicing -->
      <g transform="translate(585, 85)">
        <rect width="125" height="48" rx="6" fill="#ffffff" stroke="#6366f1" stroke-width="1.5"/>
        <text x="62" y="16" fill="#0f172a" font-size="8" font-weight="800" text-anchor="middle">Timesheets & Invoicing</text>
        <text x="62" y="28" fill="#64748b" font-size="7" text-anchor="middle">Overtime Approvals</text>
        <text x="62" y="38" fill="#6366f1" font-size="7" font-weight="700" text-anchor="middle">Batch Invoice Export</text>
      </g>
    </svg>
  </div>

  <div class="page-break"></div>

  <!-- ==================== PAGE 2: ROLE 2, ROLE 3 & ROLE 4 DETAILED ARCHITECTURE ==================== -->
  <table class="header-table">
    <tr>
      <td style="width: 50%;">
        ${logoBase64 ? `<img src="${logoBase64}" alt="IDS Logo" class="logo-img" />` : `<strong>INTEGRITY DRIVEN SOLUTIONS INC.</strong>`}
      </td>
      <td style="width: 50%; text-align: right;">
        <span class="doc-badge">Field, Client & Supplier Diagrams</span>
        <div style="font-size: 8pt; color: #475569; margin-top: 3px; font-family: 'JetBrains Mono', monospace; font-weight: 700;">
          DOC-ID: IDS-DIAGRAMS-2026-V4
        </div>
      </td>
    </tr>
  </table>

  <!-- DIAGRAM 3: ROLE 2 FIELD REP MOBILE TERMINAL -->
  <div class="diagram-container">
    <div class="diagram-title" style="color: #065f46;">
      <span>Diagram 3: IDS Field Quality Liaison Inspector (Rep) Mobile Flow</span>
      <span class="badge badge-rep">Role 2 Details</span>
    </div>
    <svg viewBox="0 0 720 145" width="100%" height="145">
      <!-- Center Hub -->
      <rect x="235" y="8" width="250" height="36" rx="8" fill="#008F72" stroke="#047857" stroke-width="2"/>
      <text x="360" y="23" fill="#ffffff" font-size="9" font-weight="900" text-anchor="middle">IDS FIELD REP MOBILE TERMINAL</text>
      <text x="360" y="35" fill="#d1fae5" font-size="7.5" font-weight="600" text-anchor="middle">Flutter Android APK & Web Viewport (Clarence Kuiken, Hugo, Nabil)</text>

      <!-- Connecting Lines -->
      <path d="M 360 44 L 65 80" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 44 L 185 80" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 44 L 305 80" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 44 L 425 80" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 44 L 545 80" stroke="#cbd5e1" stroke-width="2"/>
      <path d="M 360 44 L 660 80" stroke="#cbd5e1" stroke-width="2"/>

      <!-- Node 1: Clock In -->
      <g transform="translate(10, 80)">
        <rect width="105" height="52" rx="6" fill="#ffffff" stroke="#059669" stroke-width="1.5"/>
        <text x="52" y="16" fill="#065f46" font-size="7.5" font-weight="800" text-anchor="middle">1. Shift Clock-In</text>
        <text x="52" y="28" fill="#64748b" font-size="7" text-anchor="middle">GPS Stamped Timer</text>
        <text x="52" y="40" fill="#059669" font-size="7" font-weight="700" text-anchor="middle">Active Plant Link</text>
      </g>

      <!-- Node 2: 5 Walk Areas -->
      <g transform="translate(130, 80)">
        <rect width="110" height="52" rx="6" fill="#ffffff" stroke="#0284c7" stroke-width="1.5"/>
        <text x="55" y="16" fill="#0284c7" font-size="7.5" font-weight="800" text-anchor="middle">2. 5 Walk Areas</text>
        <text x="55" y="28" fill="#64748b" font-size="7" text-anchor="middle">Heavy Repair, Scrap,</text>
        <text x="55" y="40" fill="#0284c7" font-size="7" font-weight="700" text-anchor="middle">SAC, Stamping, Chassis</text>
      </g>

      <!-- Node 3: Routine Inspection -->
      <g transform="translate(250, 80)">
        <rect width="110" height="52" rx="6" fill="#ffffff" stroke="#059669" stroke-width="1.5"/>
        <text x="55" y="16" fill="#065f46" font-size="7.5" font-weight="800" text-anchor="middle">3. Routine Sorting</text>
        <text x="55" y="28" fill="#64748b" font-size="7" text-anchor="middle">Dynamic Part Number</text>
        <text x="55" y="40" fill="#059669" font-size="7" font-weight="700" text-anchor="middle">Pass/Reject Counters</text>
      </g>

      <!-- Node 4: QR/Barcode -->
      <g transform="translate(370, 80)">
        <rect width="110" height="52" rx="6" fill="#ffffff" stroke="#d97706" stroke-width="1.5"/>
        <text x="55" y="16" fill="#d97706" font-size="7.5" font-weight="800" text-anchor="middle">4. QR/Barcode</text>
        <text x="55" y="28" fill="#64748b" font-size="7" text-anchor="middle">Continuous Camera</text>
        <text x="55" y="40" fill="#d97706" font-size="7" font-weight="700" text-anchor="middle">Batch Tag Logging</text>
      </g>

      <!-- Node 5: Containment Rework -->
      <g transform="translate(490, 80)">
        <rect width="110" height="52" rx="6" fill="#ffffff" stroke="#6366f1" stroke-width="1.5"/>
        <text x="55" y="16" fill="#4338ca" font-size="7.5" font-weight="800" text-anchor="middle">5. Log Rework</text>
        <text x="55" y="28" fill="#64748b" font-size="7" text-anchor="middle">Reworked Pcs & Hours</text>
        <text x="55" y="40" fill="#4338ca" font-size="7" font-weight="700" text-anchor="middle">+ Add Sort / Audit</text>
      </g>

      <!-- Node 6: Incident Holds -->
      <g transform="translate(610, 80)">
        <rect width="100" height="52" rx="6" fill="#ffffff" stroke="#dc2626" stroke-width="1.5"/>
        <text x="50" y="16" fill="#dc2626" font-size="7.5" font-weight="800" text-anchor="middle">6. Incident Holds</text>
        <text x="50" y="28" fill="#64748b" font-size="7" text-anchor="middle">Photo Evidence</text>
        <text x="50" y="40" fill="#dc2626" font-size="7" font-weight="700" text-anchor="middle">Client Contact Route</text>
      </g>
    </svg>
  </div>

  <!-- DIAGRAM 4: ROLE 3 CLIENT QUALITY MANAGER & ROLE 4 SUPPLIER -->
  <div style="display: flex; gap: 10px;">
    
    <!-- LEFT: ROLE 3 CLIENT QUALITY MANAGER -->
    <div class="diagram-container" style="flex: 1; margin-bottom: 0;">
      <div class="diagram-title" style="color: #1e40af;">
        <span>Diagram 4A: Client Executive Portal</span>
        <span class="badge badge-client">Role 3</span>
      </div>
      <svg viewBox="0 0 340 145" width="100%" height="145">
        <!-- Center Hub -->
        <rect x="50" y="8" width="240" height="32" rx="6" fill="#1e40af" stroke="#2563eb" stroke-width="1.5"/>
        <text x="170" y="21" fill="#ffffff" font-size="8.5" font-weight="800" text-anchor="middle">CLIENT EXECUTIVE PORTAL</text>
        <text x="170" y="32" fill="#bfdbfe" font-size="7" text-anchor="middle">Robert Sterling @ Magna, Mark Vance @ Stellantis</text>

        <!-- Node 1 -->
        <g transform="translate(10, 50)">
          <rect width="150" height="40" rx="5" fill="#ffffff" stroke="#2563eb" stroke-width="1"/>
          <text x="75" y="16" fill="#1e3a8a" font-size="7.5" font-weight="700" text-anchor="middle">Live Incidents Feed</text>
          <text x="75" y="28" fill="#64748b" font-size="6.5" text-anchor="middle">Containment Holds & Photos</text>
        </g>

        <!-- Node 2 -->
        <g transform="translate(180, 50)">
          <rect width="150" height="40" rx="5" fill="#ffffff" stroke="#2563eb" stroke-width="1"/>
          <text x="75" y="16" fill="#1e3a8a" font-size="7.5" font-weight="700" text-anchor="middle">Published Reports Hub</text>
          <text x="75" y="28" fill="#64748b" font-size="6.5" text-anchor="middle">Download Signed PDF Summary</text>
        </g>

        <!-- Node 3 -->
        <g transform="translate(10, 98)">
          <rect width="150" height="40" rx="5" fill="#ffffff" stroke="#059669" stroke-width="1"/>
          <text x="75" y="16" fill="#065f46" font-size="7.5" font-weight="700" text-anchor="middle">PO Budget Burn Tracker</text>
          <text x="75" y="28" fill="#64748b" font-size="6.5" text-anchor="middle">Authorized vs Consumed Hours</text>
        </g>

        <!-- Node 4 -->
        <g transform="translate(180, 98)">
          <rect width="150" height="40" rx="5" fill="#ffffff" stroke="#d97706" stroke-width="1"/>
          <text x="75" y="16" fill="#78350f" font-size="7.5" font-weight="700" text-anchor="middle">Overtime Sign-Off</text>
          <text x="75" y="28" fill="#64748b" font-size="6.5" text-anchor="middle">1-Click OT Authorization</text>
        </g>
      </svg>
    </div>

    <!-- RIGHT: ROLE 4 SUPPLIER QUALITY -->
    <div class="diagram-container" style="flex: 1; margin-bottom: 0;">
      <div class="diagram-title" style="color: #334155;">
        <span>Diagram 4B: Supplier Quality Hub</span>
        <span class="badge badge-supplier">Role 4</span>
      </div>
      <svg viewBox="0 0 340 145" width="100%" height="145">
        <!-- Center Hub -->
        <rect x="50" y="8" width="240" height="32" rx="6" fill="#334155" stroke="#475569" stroke-width="1.5"/>
        <text x="170" y="21" fill="#ffffff" font-size="8.5" font-weight="800" text-anchor="middle">SUPPLIER QUALITY INTELLIGENCE</text>
        <text x="170" y="32" fill="#cbd5e1" font-size="7" text-anchor="middle">Tier-1 Component Suppliers & QA Leads</text>

        <!-- Node 1 -->
        <g transform="translate(10, 50)">
          <rect width="320" height="26" rx="5" fill="#ffffff" stroke="#475569" stroke-width="1"/>
          <text x="160" y="17" fill="#0f172a" font-size="7.5" font-weight="700" text-anchor="middle">PPM Defect Quality Scorecards & Historical Trends</text>
        </g>

        <!-- Node 2 -->
        <g transform="translate(10, 82)">
          <rect width="320" height="26" rx="5" fill="#ffffff" stroke="#475569" stroke-width="1"/>
          <text x="160" y="17" fill="#0f172a" font-size="7.5" font-weight="700" text-anchor="middle">Suspect Part Number Containment Logs & Batch Yields</text>
        </g>

        <!-- Node 3 -->
        <g transform="translate(10, 114)">
          <rect width="320" height="26" rx="5" fill="#ffffff" stroke="#475569" stroke-width="1"/>
          <text x="160" y="17" fill="#0f172a" font-size="7.5" font-weight="700" text-anchor="middle">Direct Shift Sorting Data on PN 7T4Z-7000-A / PN 84920194</text>
        </g>
      </svg>
    </div>

  </div>

  <div class="footer-meta">
    <span>Integrity Driven Solutions Inc. — Visual Role Architecture Specification</span>
    <span>Document ID: IDS-DIAGRAMS-2026-V4</span>
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
      top: '10mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  // Copy to Artifacts folder as well
  fs.copyFileSync(PDF_OUTPUT_PATH, ARTIFACT_PDF_PATH);
  console.log(`[PASS] Generated Visual Diagrams PDF at: ${PDF_OUTPUT_PATH}`);
  console.log(`[PASS] Copied PDF to Artifacts at: ${ARTIFACT_PDF_PATH}`);

  await browser.close();
}

generatePdf();
