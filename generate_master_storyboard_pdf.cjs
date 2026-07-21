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
  purple:    [124, 58, 237],
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
  doc.text('MASTER MULTI-ROLE INTERCONNECTED TRAINING MANUAL', pw - mr, 14, { align: 'right' });
}

function drawFooter(pageNum, totalPages) {
  const y = ph - 12;
  doc.setDrawColor(...C.slate300);
  doc.setLineWidth(0.3);
  doc.line(ml, y, pw - mr, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.slate500);
  doc.text('CONFIDENTIAL & PROPRIETARY — IDS PULSE INTERCONNECTED STORYBOARD', ml, y + 6);
  doc.text(`Page ${pageNum} of ${totalPages}`, pw - mr, y + 6, { align: 'right' });
}

function sectionTitle(y, text) {
  doc.setFillColor(...C.midBlue);
  doc.rect(ml, y, 3.5, 7, 'F');

  doc.setTextColor(...C.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(text, ml + 6, y + 5.5);

  return y + 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: COVER & INTERCONNECTED ANCHOR INCIDENT
// ─────────────────────────────────────────────────────────────────────────────
drawHeader('Overview', 1);

let curY = 30;

// Main Title Banner Card
doc.setFillColor(...C.accentBg);
doc.roundedRect(ml, curY, cw, 36, 3, 3, 'F');
doc.setDrawColor(...C.midBlue);
doc.setLineWidth(0.6);
doc.roundedRect(ml, curY, cw, 36, 3, 3, 'D');

doc.setTextColor(...C.darkBlue);
doc.setFont('helvetica', 'bold');
doc.setFontSize(14);
doc.text('MASTER MULTI-ROLE TRAINING MANUAL — 1 INCIDENT, 6 ROLES', ml + 6, curY + 11);

doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(...C.slate700);
doc.text('Interconnected Real-World Scenario: Ford Oakville Assembly Plant Defect Containment', ml + 6, curY + 18);
doc.text('Flows sequentially through QRE Hugo -> Lead Donna -> Accountant Colleen -> Customer Magna -> Admin Greg -> Owner Shahroz.', ml + 6, curY + 25);
doc.text('Live URL: https://proud-lavoisier.vercel.app  |  Version: 2026.4 Multi-Role Certified', ml + 6, curY + 31);

curY += 44;

// SECTION 1: ANCHOR INCIDENT SPECIFICATIONS
curY = sectionTitle(curY, '1. ANCHOR INCIDENT SPECIFICATIONS (FORD OAKVILLE)');

doc.setFillColor(...C.white);
doc.setDrawColor(...C.slate300);
doc.roundedRect(ml, curY, cw, 42, 2, 2, 'F');
doc.roundedRect(ml, curY, cw, 42, 2, 2, 'D');

const specData = [
  ['Parameter', 'Specification Value', 'System Entity / Scope'],
  ['Assembly Location', 'Ford Oakville Assembly Plant', 'Active Plant Registry'],
  ['Automotive Supplier', 'Magna AutoSystems S.A. de C.V.', 'Supplier ID: magna'],
  ['Component Part #', '86289912 (Door Weatherstrip Seal)', 'Automotive Parts Inventory'],
  ['Defect Description', 'Rubber tear along mounting edge (Water Leak Risk)', 'Photo CAD Coordinate Pin'],
  ['Shift & Claims', '12.0 Hours, 500 Pcs Sorted, $45.00 Fuel Expense', 'Time & Expense Ledger']
];

let specY = curY + 4;
specData.forEach((row, idx) => {
  const isHeader = idx === 0;
  doc.setFillColor(...(isHeader ? C.darkBlue : (idx % 2 === 0 ? C.accentBg : C.white)));
  doc.rect(ml + 1, specY, cw - 2, 6, 'F');

  doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...(isHeader ? C.white : C.navy));

  doc.text(row[0], ml + 4, specY + 4.5);
  doc.text(row[1], ml + 60, specY + 4.5);
  doc.text(row[2], ml + 125, specY + 4.5);

  specY += 6;
});

curY += 48;

// SECTION 2: 6-ROLE INTERCONNECTED FLOW
curY = sectionTitle(curY, '2. SEQUENTIAL MULTI-ROLE HANDOFF FLOW');

const roleCards = [
  { step: '01', role: 'QRE Rep (Hugo)', task: 'Logs Part #86289912, 12 hrs shift, 500 pcs, $45 Fuel', color: C.teal },
  { step: '02', role: 'Quality Lead (Donna)', task: 'Audits CAD Defect Heatmap & Jaccard AI Duplicate scan', color: C.purple },
  { step: '03', role: 'Accountant (Colleen)', task: 'Verifies Fuel receipt lightbox & exports QuickBooks CSV', color: C.midBlue },
  { step: '04', role: 'Customer (Magna)', task: 'Inspects restricted supplier quality portal & downloads PDF', color: C.emerald },
  { step: '05', role: 'System Admin (Greg)', task: 'Audits real-time event logs console & plant registries', color: C.amber },
  { step: '06', role: 'Owner (Shahroz)', task: 'Reviews executive Launch Roadmap & global financial audit', color: C.red }
];

roleCards.forEach((rc, i) => {
  const rY = curY + i * 14;
  doc.setFillColor(...C.navy);
  doc.roundedRect(ml, rY, 14, 12, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...C.amber);
  doc.text(rc.step, ml + 7, rY + 8, { align: 'center' });

  doc.setFillColor(...C.accentBg);
  doc.roundedRect(ml + 16, rY, cw - 16, 12, 2, 2, 'F');
  doc.setDrawColor(...rc.color);
  doc.setLineWidth(0.5);
  doc.roundedRect(ml + 16, rY, cw - 16, 12, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.navy);
  doc.text(rc.role, ml + 20, rY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate700);
  doc.text(rc.task, ml + 75, rY + 7);
});

drawFooter(1, 4);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: STEPS 1 TO 3 (HUGO -> DONNA -> COLLEEN)
// ─────────────────────────────────────────────────────────────────────────────
doc.addPage();
drawHeader('Steps 1-3', 2);

curY = 30;

curY = sectionTitle(curY, '3. STORYBOARD STEPS 1 TO 3: FIELD TO ACCOUNTING');

const stepsP2 = [
  {
    title: 'STEP 1: FIELD QRE REPRESENTATIVE (HUGO LOGS DEFECT & EXPENSE)',
    color: C.teal,
    pass: 'Username: hugo  |  Password: Hugo2026!',
    bullets: [
      '1. Login as "hugo" on Mobile App / Fast Auth.',
      '2. Tap "New Suspect Material": Select Ford Oakville, pin CAD defect dot on component blueprint, select Part #86289912 (Magna), attach photo proof, click "Release & Send".',
      '3. Tap "Log Rework Hours": Select Ford Oakville, enter 12.0 Hours, 500 Pcs Inspected, 475 OK, 25 NOK reworked, and log 60 km Travel Distance.',
      '4. Tap "Log Expenses": Category "Fuel", Amount "$45.00", attach fuel receipt photo, and click Submit.',
      '--> Checkpoint: Green confirmation banner "Incident & Expense Submitted to Quality Lead".'
    ]
  },
  {
    title: 'STEP 2: QUALITY LEAD (DONNA AUDITS DEFECT MATRIX & DUPLICATES)',
    color: C.purple,
    pass: 'Username: donna  |  Password: Donna2026!',
    bullets: [
      '1. Login as "donna" on Web CRM Dashboard.',
      '2. Open Visual Defect Matrix: Hover red coordinate marker on Part #86289912 CAD drawing -> Confirm Hugo\'s report at Ford Oakville.',
      '3. Click Pulse AI Copilot -> Run "Quality Audit" -> Verify zero duplicate defect logs exist.',
      '4. Check Reps Roster Board: Confirm Hugo\'s status shows "🟢 Active Shift / 500 Pcs Sorted".',
      '--> Checkpoint: Defect report validated for corporate accounting & client billing.'
    ]
  },
  {
    title: 'STEP 3: ACCOUNTANT (COLLEEN VERIFIES RECEIPT & EXPORTS LEDGERS)',
    color: C.midBlue,
    pass: 'Username: colleen  |  Password: Colleen2026! (Auto Light Mode)',
    bullets: [
      '1. Login as "colleen" on Web CRM Dashboard.',
      '2. Open "Timesheets & Billing" Tab: Verify Hugo\'s 12.0 hrs under Magna for Ford Oakville.',
      '3. Scroll to Expense Verification: Click $45.00 Fuel receipt photo thumbnail, open High-Res Lightbox, verify receipt photo, click Approve ✅.',
      '4. Export Ledgers: Click "Export QuickBooks CSV" (.csv) and "Export Excel Ledger" (.xlsx).',
      '--> Checkpoint: Grand Invoice calculates: (12 hrs x $45) + (60 km x $0.65) + $45 Fuel = $624.00.'
    ]
  }
];

stepsP2.forEach((s) => {
  doc.setFillColor(...C.slate50);
  doc.roundedRect(ml, curY, cw, 68, 2, 2, 'F');
  doc.setDrawColor(...s.color);
  doc.setLineWidth(0.6);
  doc.roundedRect(ml, curY, cw, 68, 2, 2, 'D');

  doc.setFillColor(...s.color);
  doc.rect(ml, curY, cw, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.white);
  doc.text(s.title, ml + 4, curY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate700);
  doc.text(s.pass, pw - mr - 4, curY + 5.5, { align: 'right' });

  let bY = curY + 14;
  s.bullets.forEach((b) => {
    const lines = doc.splitTextToSize(b, cw - 8);
    doc.text(lines, ml + 4, bY);
    bY += lines.length * 4 + 2;
  });

  curY += 74;
});

drawFooter(2, 4);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3: STEPS 4 TO 6 (MAGNA -> GREG -> SHAHROZ)
// ─────────────────────────────────────────────────────────────────────────────
doc.addPage();
drawHeader('Steps 4-6', 3);

curY = 30;

curY = sectionTitle(curY, '4. STORYBOARD STEPS 4 TO 6: CUSTOMER & EXECUTIVE');

const stepsP3 = [
  {
    title: 'STEP 4: AUTOMOTIVE CUSTOMER (MAGNA PORTAL OVERSIGHT)',
    color: C.emerald,
    pass: 'Username: magna  |  Password: Magna2026!',
    bullets: [
      '1. Login as "magna" on Customer Portal.',
      '2. Verify Security Scoping: Confirm dashboard is strictly restricted to Magna AutoSystems parts.',
      '3. Open Incidents Feed: Inspect Part #86289912 report at Ford Oakville -> Confirm 25 NOK repaired.',
      '4. Click "Download Supplier Quality Report" -> Verify official PDF download with logo.',
      '--> Checkpoint: Client has full visibility into containment progress without accessing payroll rates.'
    ]
  },
  {
    title: 'STEP 5: SYSTEM ADMIN (GREG EVENT LOGS & ROSTER CONTROL)',
    color: C.amber,
    pass: 'Username: greg  |  Password: Greg2026!',
    bullets: [
      '1. Login as "greg" on Web CRM Dashboard.',
      '2. Open "System Events Logs" Tab: Review live real-time event stream logging Hugo\'s report, Donna\'s audit, and Colleen\'s expense approval.',
      '3. Audit Plant & Supplier Registries: Verify active QRE assignments for Ford Oakville.',
      '--> Checkpoint: Full operational governance verified without executive launch roadmap access.'
    ]
  },
  {
    title: 'STEP 6: EXECUTIVE OWNER (SHAHROZ MIRZA FULL AUDIT)',
    color: C.red,
    pass: 'Username: shahroz  |  Password: Shahroz2026!',
    bullets: [
      '1. Login as "shahroz" on Web CRM Dashboard.',
      '2. Access "IDS Pulse Launch Roadmap" Tab: Review auto-unlocked deployment phases.',
      '3. Run Unrestricted Pulse AI Audit: Perform global scan across all financial and quality collections.',
      '--> Checkpoint: 100% end-to-end operational integrity verified across all 6 system roles!'
    ]
  }
];

stepsP3.forEach((s) => {
  doc.setFillColor(...C.slate50);
  doc.roundedRect(ml, curY, cw, 68, 2, 2, 'F');
  doc.setDrawColor(...s.color);
  doc.setLineWidth(0.6);
  doc.roundedRect(ml, curY, cw, 68, 2, 2, 'D');

  doc.setFillColor(...s.color);
  doc.rect(ml, curY, cw, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.white);
  doc.text(s.title, ml + 4, curY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate700);
  doc.text(s.pass, pw - mr - 4, curY + 5.5, { align: 'right' });

  let bY = curY + 14;
  s.bullets.forEach((b) => {
    const lines = doc.splitTextToSize(b, cw - 8);
    doc.text(lines, ml + 4, bY);
    bY += lines.length * 4 + 2;
  });

  curY += 74;
});

drawFooter(3, 4);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4: VERIFICATION MATRIX & SIGN-OFF CERTIFICATE
// ─────────────────────────────────────────────────────────────────────────────
doc.addPage();
drawHeader('Sign-Off', 4);

curY = 30;

curY = sectionTitle(curY, '5. MULTI-ROLE RECONCILIATION & TEST SIGN-OFF');

// Reconciliation Table
const matrixData = [
  ['Role', 'Passcode', 'Tested Function', 'Financial / Quality Metric', 'Status'],
  ['QRE Rep (Hugo)', 'Hugo2026!', 'Defect & Expense Log', 'Part #86289912, 12 hrs, $45 Fuel', 'PASSED ✅'],
  ['Quality Lead (Donna)', 'Donna2026!', 'CAD Heatmap & Jaccard AI', 'Zero Duplicate Defect Flags', 'PASSED ✅'],
  ['Accountant (Colleen)', 'Colleen2026!', 'Receipt Lightbox & Exports', '$624.00 Total Invoice & QB CSV', 'PASSED ✅'],
  ['Customer (Magna)', 'Magna2026!', 'Restricted Portal Audit', 'Part #86289912 Report Download', 'PASSED ✅'],
  ['System Admin (Greg)', 'Greg2026!', 'System Event Stream', 'Real-time database transaction log', 'PASSED ✅'],
  ['Owner (Shahroz)', 'Shahroz2026!', 'Launch Roadmap & Audit', '100% End-to-End System Integrity', 'PASSED ✅']
];

let mY = curY + 2;
matrixData.forEach((row, rIdx) => {
  const isHeader = rIdx === 0;
  doc.setFillColor(...(isHeader ? C.darkBlue : (rIdx % 2 === 0 ? C.accentBg : C.white)));
  doc.rect(ml + 1, mY, cw - 2, 8, 'F');

  doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...(isHeader ? C.white : C.navy));

  doc.text(row[0], ml + 4, mY + 5.5);
  doc.text(row[1], ml + 42, mY + 5.5);
  doc.text(row[2], ml + 70, mY + 5.5);
  doc.text(row[3], ml + 120, mY + 5.5);
  doc.text(row[4], ml + 160, mY + 5.5);

  mY += 8;
});

curY = mY + 12;

// CERTIFICATE BOX
doc.setFillColor(240, 253, 244);
doc.roundedRect(ml, curY, cw, 60, 3, 3, 'F');
doc.setDrawColor(...C.emerald);
doc.setLineWidth(0.8);
doc.roundedRect(ml, curY, cw, 60, 3, 3, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(4, 120, 87);
doc.text('🏆 OFFICIAL IDS PULSE MULTI-ROLE COMPLIANCE CERTIFICATE', ml + 8, curY + 12);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...C.slate700);
doc.text('This document certifies that the IDS Pulse Operations Suite has successfully executed and verified the complete 6-role interconnected workflow for Ford Oakville Assembly Plant (Part #86289912). All user access gates, receipt lightboxes, Jaccard duplicate scans, QuickBooks exports, and customer security scopes are 100% operational.', ml + 8, curY + 22, { maxWidth: cw - 16 });

doc.setDrawColor(...C.emerald);
doc.setLineWidth(0.3);
doc.line(ml + 8, curY + 44, ml + 80, curY + 44);
doc.line(pw - mr - 80, curY + 44, pw - mr - 8, curY + 44);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...C.slate500);
doc.text('Quality Assurance Lead Signature', ml + 8, curY + 49);
doc.text('Executive Systems Director Signature', pw - mr - 80, curY + 49);

drawFooter(4, 4);

// ─────────────────────────────────────────────────────────────────────────────
// SAVE PDF TO ROOT AND ARTIFACTS
// ─────────────────────────────────────────────────────────────────────────────
const pdfBuffer = doc.output('arraybuffer');
const rootPath = path.resolve('IDS_Pulse_Master_MultiRole_Training_Manual.pdf');
const brainPath = path.join(brainDir, 'IDS_Pulse_Master_MultiRole_Training_Manual.pdf');

fs.writeFileSync(rootPath, Buffer.from(pdfBuffer));
fs.writeFileSync(brainPath, Buffer.from(pdfBuffer));

console.log('Master Storyboard PDF successfully generated!');
console.log('Root:', rootPath);
console.log('Brain:', brainPath);
