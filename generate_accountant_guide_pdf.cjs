const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const brainDir = path.resolve('C:/Users/Sharoz/.gemini/antigravity/brain/66b12867-a02c-4c91-a52d-48c91fdb789a');

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const pw = 210;
const ph = 297;
const ml = 15;
const mr = 15;
const cw = pw - ml - mr; // 180mm

const C = {
  navy:      [15, 23, 42],
  darkBlue:  [30, 58, 138],
  midBlue:   [37, 99, 235],
  lightBlue: [219, 234, 254],
  accentBg:  [241, 245, 249],
  teal:      [13, 148, 136],
  emerald:   [16, 185, 129],
  amber:     [245, 158, 11],
  red:       [225, 29, 72],
  slate700:  [51, 65, 85],
  slate800:  [30, 41, 59],
  slate50:   [248, 250, 252],
  slate500:  [100, 116, 139],
  slate300:  [203, 213, 225],
  white:     [255, 255, 255]
};

function drawHeader(title, pageNum) {
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pw, 22, 'F');
  
  doc.setFillColor(...C.midBlue);
  doc.rect(0, 22, pw, 1.5, 'F');

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('IDS PULSE OPERATIONS SUITE', ml, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('ACCOUNTANT TRAINING & SYSTEM TESTING MANUAL', pw - mr, 14, { align: 'right' });
}

function drawFooter(pageNum, totalPages) {
  const y = ph - 12;
  doc.setDrawColor(...C.slate300);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.slate500);
  doc.text('CONFIDENTIAL & PROPRIETARY — IDS PULSE OPERATIONS', ml, y + 6);
  doc.text(`Page ${pageNum} of ${totalPages}`, pw - mr, y + 6, { align: 'right' });
}

function sectionTitle(y, text, icon = '▶') {
  doc.setFillColor(...C.midBlue);
  doc.rect(ml, y, 3.5, 7, 'F');

  doc.setTextColor(...C.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${text}`, ml + 6, y + 5.5);

  return y + 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: COVER & SYSTEM OVERVIEW
// ─────────────────────────────────────────────────────────────────────────────
drawHeader('Overview', 1);

let curY = 30;

// Main Title Banner Card
doc.setFillColor(...C.accentBg);
doc.roundedRect(ml, curY, cw, 34, 3, 3, 'F');
doc.setDrawColor(...C.midBlue);
doc.setLineWidth(0.6);
doc.roundedRect(ml, curY, cw, 34, 3, 3, 'D');

doc.setTextColor(...C.darkBlue);
doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.text('ACCOUNTANT USER GUIDE & REAL-WORLD TEST SCENARIO', ml + 6, curY + 11);

doc.setFont('helvetica', 'normal');
doc.setFontSize(9.5);
doc.setTextColor(...C.slate700);
doc.text('Complete Operational Training Manual & End-to-End Test Workflow for Colleen (Accountant Role)', ml + 6, curY + 18);
doc.text('Portal URL: https://proud-lavoisier.vercel.app  |  Username: colleen  |  Password: Colleen2026!', ml + 6, curY + 26);

curY += 42;

// SECTION 1: ROLE ARCHITECTURE
curY = sectionTitle(curY, '1. ACCOUNTANT ROLE RESPONSIBILITIES & PERMISSIONS');

const cardW = (cw - 6) / 3;
const cardH = 28;

const roles = [
  { title: '⏱️ Timesheets & Hours', desc: 'Audit daily QRE shift entries, plant allocations, and overtime multipliers.', color: C.midBlue },
  { title: '🧾 Expense Lightbox', desc: 'Verify fuel, toll, & meal receipt photo attachments prior to approval.', color: C.teal },
  { title: '📥 Financial Exports', desc: 'Generate QuickBooks CSV, styled Excel ledgers, & PDF invoices.', color: C.emerald }
];

roles.forEach((r, i) => {
  const cx = ml + i * (cardW + 3);
  doc.setFillColor(...C.accentBg);
  doc.roundedRect(cx, curY, cardW, cardH, 2, 2, 'F');
  doc.setDrawColor(...r.color);
  doc.setLineWidth(0.5);
  doc.roundedRect(cx, curY, cardW, cardH, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.navy);
  doc.text(r.title, cx + 4, curY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate700);
  const lines = doc.splitTextToSize(r.desc, cardW - 8);
  doc.text(lines, cx + 4, curY + 14);
});

curY += cardH + 12;

// SECTION 2: END-TO-END WORKFLOW DIAGRAM
curY = sectionTitle(curY, '2. END-TO-END ACCOUNTING WORKFLOW');

// Workflow Boxes
const steps = [
  { num: '01', title: 'Gateway Access', desc: 'Login as colleen' },
  { num: '02', title: 'Metric Audit', desc: 'Review 4 Summary Cards' },
  { num: '03', title: 'Timesheet Check', desc: 'Audit Hours & Mileage' },
  { num: '04', title: 'Receipt Lightbox', desc: 'Verify Expense Proof' },
  { num: '05', title: 'Pulse AI Audit', desc: 'Scan Database Flags' },
  { num: '06', title: 'Export Ledgers', desc: 'QuickBooks CSV & Excel' }
];

const boxW = (cw - 10) / 6;
steps.forEach((s, i) => {
  const bx = ml + i * (boxW + 2);
  doc.setFillColor(...C.navy);
  doc.roundedRect(bx, curY, boxW, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C.amber);
  doc.text(s.num, bx + boxW / 2, curY + 7, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.white);
  doc.text(s.title, bx + boxW / 2, curY + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...C.slate300);
  const subLines = doc.splitTextToSize(s.desc, boxW - 2);
  doc.text(subLines, bx + boxW / 2, curY + 19, { align: 'center' });
});

curY += 34;

// SECTION 3: KEY METRICS EXPLANATION
curY = sectionTitle(curY, '3. FINANCIAL METRICS CALCULATION FORMULAS');

doc.setFillColor(...C.white);
doc.setDrawColor(...C.slate300);
doc.roundedRect(ml, curY, cw, 42, 2, 2, 'F');
doc.roundedRect(ml, curY, cw, 42, 2, 2, 'D');

const metricsData = [
  ['Metric Card', 'Data Source', 'Calculation Rule', 'Accountant Action'],
  ['Total Billable Hours', 'QRE Time Logs', 'Sum of all verified shift hours', 'Check against plant roster'],
  ['Mileage Tracker', 'Travel Logs', 'Total Distance (km) x Rate ($/km)', 'Verify starting/ending plant'],
  ['Pending Expenses', 'Expense Claims', 'Fuel + Tolls + Parking + Meals', 'Click photo lightbox to verify receipt'],
  ['Grand Payroll / Invoice', 'Combined Total', '(Hours x Rate) + Mileage + Expenses', 'Reconcile before exporting to QB']
];

let tableY = curY + 5;
metricsData.forEach((row, rIdx) => {
  const isHeader = rIdx === 0;
  doc.setFillColor(...(isHeader ? C.darkBlue : (rIdx % 2 === 0 ? C.accentBg : C.white)));
  doc.rect(ml + 1, tableY, cw - 2, 7, 'F');

  doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...(isHeader ? C.white : C.navy));

  doc.text(row[0], ml + 4, tableY + 5);
  doc.text(row[1], ml + 45, tableY + 5);
  doc.text(row[2], ml + 90, tableY + 5);
  doc.text(row[3], ml + 140, tableY + 5);

  tableY += 7;
});

drawFooter(1, 3);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: OPERATIONAL STEP-BY-STEP GUIDE
// ─────────────────────────────────────────────────────────────────────────────
doc.addPage();
drawHeader('Operations', 2);

curY = 30;

curY = sectionTitle(curY, '4. STEP-BY-STEP ACCOUNTING PROCEDURES');

const stepsDetail = [
  {
    step: 'STEP 1: LOGIN & LIGHT MODE SELECTION',
    bullets: [
      'Open https://proud-lavoisier.vercel.app on your browser.',
      'Enter Username: "colleen" and Password: "Colleen2026!" and click Authenticate.',
      'Notice that the interface automatically defaults to Light Mode for optimal tabular contrast.',
      'You can switch between Day (Dark) and Night (Light) mode anytime via the top header toggle.'
    ]
  },
  {
    step: 'STEP 2: TIMESHEETS & HOURS AUDITING',
    bullets: [
      'Navigate to the "Timesheets & Billing" tab on the top menu bar.',
      'Filter hours by Supplier (e.g. Auto Kabel, Magna, Hutchinson) or Plant (GM Oshawa, Ford).',
      'Audit regular vs overtime rate multipliers for weekend or night shifts.',
      'Use the "Manager Bulk Entry Portal" if you need to log or backdate hours for an entire team.'
    ]
  },
  {
    step: 'STEP 3: VERIFYING RECEIPT LIGHTBOXES',
    bullets: [
      'Scroll down to the "Expense Verification Board".',
      'Identify claims under Fuel, Tolls, Parking, or Meals.',
      'Click on the receipt thumbnail photo to expand the High-Resolution Lightbox Viewer.',
      'Cross-check the paper receipt total against the submitted amount and click Approve ✅.'
    ]
  },
  {
    step: 'STEP 4: RUNNING PULSE AI FINANCIAL AUDIT',
    bullets: [
      'Click the floating "Pulse AI Copilot" icon in the bottom right corner.',
      'Click "Run Financial Audit" to trigger automatic database scanning.',
      'Pulse AI will flag shifts >16 hours, negative value logs, or claims missing photo receipts.',
      'Resolve all flagged warnings before finalizing exports.'
    ]
  },
  {
    step: 'STEP 5: FINANCIAL DATA EXPORTS',
    bullets: [
      'QuickBooks CSV (.csv): Click "Export QuickBooks CSV" for direct import into corporate QB.',
      'Styled Excel Ledger (.xlsx): Click "Export Excel Ledger" to download styled accounting tables.',
      'PDF Client Statement (.pdf): Click "Export PDF Report" for white-labeled client invoicing.'
    ]
  }
];

stepsDetail.forEach((s) => {
  doc.setFillColor(...C.accentBg);
  doc.roundedRect(ml, curY, cw, 34, 2, 2, 'F');
  doc.setDrawColor(...C.slate300);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, curY, cw, 34, 2, 2, 'D');

  doc.setFillColor(...C.darkBlue);
  doc.rect(ml, curY, 3, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.darkBlue);
  doc.text(s.step, ml + 6, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate700);

  let bY = curY + 12;
  s.bullets.forEach((b) => {
    doc.text(`• ${b}`, ml + 8, bY);
    bY += 5;
  });

  curY += 38;
});

drawFooter(2, 3);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3: REAL-WORLD TESTING SCENARIO (SYSTEM AUDIT)
// ─────────────────────────────────────────────────────────────────────────────
doc.addPage();
drawHeader('Test Scenario', 3);

curY = 30;

curY = sectionTitle(curY, '5. REAL-WORLD COMPREHENSIVE SYSTEM TEST SCENARIO');

// Scenario Callout Box
doc.setFillColor(239, 246, 255);
doc.roundedRect(ml, curY, cw, 22, 2, 2, 'F');
doc.setDrawColor(...C.midBlue);
doc.setLineWidth(0.5);
doc.roundedRect(ml, curY, cw, 22, 2, 2, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(...C.darkBlue);
doc.text('🎯 TEST SCENARIO: GM Oshawa Plant Rework Audit (Auto Kabel Supplier)', ml + 6, curY + 7);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...C.slate700);
doc.text('This scenario tests the COMPLETE pipeline: Mobile Rep logging -> Live Database sync -> Accountant Audit -> Lightbox verification -> Pulse AI check -> QuickBooks & Excel export.', ml + 6, curY + 14);

curY += 28;

// Test Steps Box
const testSteps = [
  {
    phase: 'PHASE 1: FIELD REPRESENTATIVE (CLARENCE) ACTION',
    color: C.teal,
    items: [
      '1. Open https://proud-lavoisier.vercel.app and log in as "clarence" / "Clarence2026!".',
      '2. Click "New Suspect Material": Pin CAD defect dot on component diagram, select Part #86286761 (Auto Kabel), upload photo proof, and click "Release & Send".',
      '3. Click "Log Rework Hours": Select GM Oshawa Plant, enter 8.5 Hours, 250 Total Pcs, 240 OK, 10 NOK reworked, and log 45 km Travel Distance.',
      '4. Click "Log Expenses": Select Category "Tolls", enter Amount "$32.50", attach toll receipt photo, and submit.'
    ]
  },
  {
    phase: 'PHASE 2: ACCOUNTANT (COLLEEN) SYSTEM AUDIT & VERIFICATION',
    color: C.darkBlue,
    items: [
      '1. Open a new window, log in as "colleen" / "Colleen2026!".',
      '2. Verify Dashboard Metric Cards: Confirm Total Billable Hours updated (+8.5 hrs) and Mileage (+45 km).',
      '3. Audit Timesheets: Go to "Timesheets & Billing" tab, verify Clarence\'s 8.5 hrs logged under Auto Kabel for GM Oshawa Plant.',
      '4. Verify Receipt Lightbox: Scroll to Expense Verification, click the $32.50 Toll receipt image thumbnail, view photo in high-res Lightbox, and click Approve ✅.',
      '5. Run Pulse AI Auditor: Click Pulse AI floating widget -> Click "Run Financial Audit" -> Confirm zero unverified expense warnings remain.',
      '6. Export Financial Ledgers: Click "Export QuickBooks CSV" and "Export Excel Ledger" to verify files generated cleanly.'
    ]
  }
];

testSteps.forEach((t) => {
  doc.setFillColor(...C.slate50);
  doc.roundedRect(ml, curY, cw, 68, 2, 2, 'F');
  doc.setDrawColor(...t.color);
  doc.setLineWidth(0.6);
  doc.roundedRect(ml, curY, cw, 68, 2, 2, 'D');

  doc.setFillColor(...t.color);
  doc.rect(ml, curY, cw, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.white);
  doc.text(t.phase, ml + 6, curY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.slate800);

  let itY = curY + 14;
  t.items.forEach((item) => {
    const lines = doc.splitTextToSize(item, cw - 12);
    doc.text(lines, ml + 6, itY);
    itY += lines.length * 4.5 + 2;
  });

  curY += 74;
});

// Final Verification Sign-Off Box
doc.setFillColor(240, 253, 244);
doc.roundedRect(ml, curY, cw, 18, 2, 2, 'F');
doc.setDrawColor(...C.emerald);
doc.setLineWidth(0.5);
doc.roundedRect(ml, curY, cw, 18, 2, 2, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(4, 120, 87);
doc.text('✅ SYSTEM VERIFICATION SUCCESS CRITERIA', ml + 6, curY + 6);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...C.slate700);
doc.text('If all 6 Phase 2 verification steps pass without errors, the entire IDS Pulse Operations Suite is 100% operational and ready for production deployment!', ml + 6, curY + 12);

drawFooter(3, 3);

// ─────────────────────────────────────────────────────────────────────────────
// SAVE PDF TO ROOT AND ARTIFACTS
// ─────────────────────────────────────────────────────────────────────────────
const pdfBuffer = doc.output('arraybuffer');
const rootPath = path.resolve('IDS_Pulse_Accountant_Training_Guide.pdf');
const brainPath = path.join(brainDir, 'IDS_Pulse_Accountant_Training_Guide.pdf');

fs.writeFileSync(rootPath, Buffer.from(pdfBuffer));
fs.writeFileSync(brainPath, Buffer.from(pdfBuffer));

console.log('PDF successfully generated!');
console.log('Root:', rootPath);
console.log('Brain:', brainPath);
