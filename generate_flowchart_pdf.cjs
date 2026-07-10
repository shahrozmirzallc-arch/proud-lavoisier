const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const doc = new jsPDF({ unit: 'mm', format: 'a4' });
let pageNum = 1;
const pw = 210; // page width
const ph = 297; // page height
const ml = 16; // margin left
const mr = 16; // margin right
const cw = pw - ml - mr; // content width = 178

// ─── COLOR PALETTE ─────────────────────────────────────────────────────────
const C = {
  navy:      [17, 24, 39],
  darkBlue:  [30, 58, 95],
  midBlue:   [37, 99, 235],
  lightBlue: [219, 234, 254],
  cyan:      [14, 165, 233],
  teal:      [20, 184, 166],
  green:     [16, 185, 129],
  emerald:   [5, 150, 105],
  amber:     [245, 158, 11],
  orange:    [249, 115, 22],
  red:       [239, 68, 68],
  purple:    [139, 92, 246],
  pink:      [236, 72, 153],
  slate50:   [248, 250, 252],
  slate100:  [241, 245, 249],
  slate200:  [226, 232, 240],
  slate300:  [203, 213, 225],
  slate400:  [148, 163, 184],
  slate500:  [100, 116, 139],
  slate600:  [71, 85, 105],
  slate700:  [51, 65, 85],
  slate800:  [30, 41, 59],
  slate900:  [15, 23, 42],
  white:     [255, 255, 255],
};

// ─── DRAWING PRIMITIVES ────────────────────────────────────────────────────

const setColor = (type, color) => {
  if (type === 'fill') doc.setFillColor(...color);
  else if (type === 'draw') doc.setDrawColor(...color);
  else doc.setTextColor(...color);
};

const drawPageHeader = (subtitle) => {
  // Top accent bar
  setColor('fill', C.darkBlue);
  doc.rect(0, 0, pw, 3, 'F');

  // Logo badge
  setColor('fill', C.darkBlue);
  doc.roundedRect(ml, 8, 30, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setColor('text', C.white);
  doc.text('IDS PULSE', ml + 15, 14.8, { align: 'center' });

  // Subtitle (ASCII-safe text)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor('text', C.slate500);
  const safeSubtitle = subtitle.replace(/\u2014/g, '-').replace(/—/g, '-');
  doc.text(safeSubtitle, pw - mr, 14.8, { align: 'right' });

  // Divider
  setColor('draw', C.slate200);
  doc.setLineWidth(0.3);
  doc.line(ml, 21, pw - mr, 21);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setColor('text', C.slate400);
  doc.text('CONFIDENTIAL', ml, 289);
  doc.text('IDS Pulse - Complete System Architecture & Operational Flowchart', pw / 2, 289, { align: 'center' });
  doc.text(`Page ${pageNum}`, pw - mr, 289, { align: 'right' });
};

const newPage = (subtitle) => {
  doc.addPage();
  pageNum++;
  drawPageHeader(subtitle);
};

const drawSectionHeader = (y, number, title) => {
  // Accent line
  setColor('fill', C.darkBlue);
  doc.rect(ml, y, 3, 8, 'F');

  // Number circle
  setColor('fill', C.darkBlue);
  doc.circle(ml + 9, y + 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor('text', C.white);
  doc.text(String(number), ml + 9, y + 5.8, { align: 'center' });

  // Title
  const safeTitle = title.replace(/\u2014/g, '-').replace(/—/g, '-');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor('text', C.navy);
  doc.text(safeTitle, ml + 16, y + 5.8);

  // Underline
  setColor('draw', C.slate200);
  doc.setLineWidth(0.3);
  doc.line(ml, y + 10, pw - mr, y + 10);

  return y + 14;
};

const drawInfoCard = (x, y, w, _h, title, bullets, accentColor) => {
  // Replace any Unicode em-dash/smart quotes in bullets or title
  const safeBullets = bullets.map(b => b.replace(/\u2014/g, '-').replace(/—/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'));
  const safeTitle = title.replace(/\u2014/g, '-').replace(/—/g, '-');

  // Pre-calculate total height from wrapped text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  let totalLines = 0;
  safeBullets.forEach(bullet => {
    const lines = doc.splitTextToSize(bullet, w - 12);
    totalLines += lines.length;
  });
  const h = Math.max(_h || 0, 11 + totalLines * 3.3 + 3); // title + lines + padding

  // Card background
  setColor('fill', C.white);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');

  // Border
  setColor('draw', C.slate200);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'D');

  // Top accent stripe
  setColor('fill', accentColor || C.darkBlue);
  doc.roundedRect(x, y, w, 1.2, 2.5, 0, 'F');
  doc.rect(x, y + 0.6, w, 0.6, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColor('text', C.slate900);
  doc.text(safeTitle, x + 4, y + 6.5);

  // Bullet points (vector drawn circles instead of unicode bullets)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  let ly = y + 11;
  safeBullets.forEach(bullet => {
    const lines = doc.splitTextToSize(bullet, w - 12);
    lines.forEach((line, i) => {
      if (i === 0) {
        setColor('fill', accentColor || C.darkBlue);
        doc.circle(x + 5.5, ly - 1.2, 0.7, 'F');
      }
      setColor('text', C.slate600);
      doc.text(line, x + 8, ly);
      ly += 3.3;
    });
  });
  return h;
};

const drawFlowArrow = (x1, y1, x2, y2, label) => {
  setColor('draw', C.cyan);
  doc.setLineWidth(0.6);
  doc.line(x1, y1, x2, y2);

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 2.2;
  doc.line(x2, y2, x2 - hl * Math.cos(angle - Math.PI / 5.5), y2 - hl * Math.sin(angle - Math.PI / 5.5));
  doc.line(x2, y2, x2 - hl * Math.cos(angle + Math.PI / 5.5), y2 - hl * Math.sin(angle + Math.PI / 5.5));

  if (label) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(5.5);
    setColor('text', C.cyan);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    doc.text(label, mx, my - 1.5, { align: 'center' });
  }
};

const drawWorkflowStep = (x, y, w, _h, stepNum, title, desc, color) => {
  const safeTitle = title.replace(/\u2014/g, '-').replace(/—/g, '-');
  const safeDesc = desc.replace(/\u2014/g, '-').replace(/—/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

  // Pre-calculate height from wrapped description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const descLines = doc.splitTextToSize(safeDesc, w - 8);
  const h = Math.max(_h || 0, 11 + descLines.length * 3 + 3);

  setColor('fill', C.white);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  setColor('draw', color || C.slate200);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 2, 2, 'D');

  // Step number badge
  setColor('fill', color || C.darkBlue);
  doc.roundedRect(x + 3, y + 3, 7, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  setColor('text', C.white);
  doc.text(String(stepNum), x + 6.5, y + 6.5, { align: 'center' });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor('text', C.slate900);
  doc.text(safeTitle, x + 13, y + 6.5);

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  setColor('text', C.slate600);
  let ly = y + 11;
  descLines.forEach(l => { doc.text(l, x + 4, ly); ly += 3; });
  return h;
};

const drawTableRow = (y, cols, widths, isHeader, altBg) => {
  let x = ml;
  cols.forEach((col, i) => {
    const safeCol = String(col).replace(/\u2014/g, '-').replace(/—/g, '-').replace(/✓/g, 'Yes');

    if (isHeader) {
      setColor('fill', C.darkBlue);
      doc.rect(x, y, widths[i], 5.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      setColor('text', C.white);
      doc.text(safeCol, x + 2, y + 4);
    } else {
      setColor('fill', altBg ? C.slate100 : C.slate50);
      doc.rect(x, y, widths[i], 5, 'F');
      
      if (safeCol === 'Yes') {
        // Draw vector checkmark
        setColor('draw', C.emerald);
        doc.setLineWidth(0.4);
        const cx = x + widths[i] / 2;
        const cy = y + 2.5;
        doc.line(cx - 1.2, cy, cx - 0.4, cy + 1.0);
        doc.line(cx - 0.4, cy + 1.0, cx + 1.2, cy - 1.0);
      } else if (safeCol === '-') {
        // Draw centered hyphen
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.8);
        setColor('text', C.slate300);
        doc.text('-', x + widths[i] / 2, y + 3.5, { align: 'center' });
      } else {
        doc.setFont('helvetica', i === 0 ? 'bold' : 'normal');
        doc.setFontSize(5.8);
        setColor('text', i === 0 ? C.slate800 : C.slate700);
        
        if (i > 0 && (safeCol === 'Published' || safeCol === 'Own Only' || safeCol === 'Own Client')) {
          doc.text(safeCol, x + widths[i] / 2, y + 3.5, { align: 'center' });
        } else {
          doc.text(safeCol, x + 2, y + 3.5);
        }
      }
    }
    x += widths[i];
  });
  return y + (isHeader ? 5.5 : 5);
};

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — AUTHENTICATION & ROLE ARCHITECTURE
// ════════════════════════════════════════════════════════════════════════════
drawPageHeader('Page 1 - Authentication & Role Architecture');

let y = 25;
y = drawSectionHeader(y, 1, 'User Authentication Flow');

const h1 = drawInfoCard(ml, y, 86, 30, 'Secure Login Gateway', [
  'User enters username and password on the login screen.',
  'Password is hashed using SHA-256 via the Web Crypto API.',
  'Hash is validated against stored admin credential hashes.',
  'Username matching is case-insensitive with whitespace trimmed.',
], C.darkBlue);

drawFlowArrow(ml + 87, y + 15, ml + 91, y + 15, 'Validated');

const h2 = drawInfoCard(ml + 92, y, 86, 30, 'Session Initialization', [
  'User role and identity are stored in the browser session.',
  'Workspace unlock flag is activated for dashboard access.',
  'All users land on the Projects Registry as the default tab.',
  'Admin profile dropdown is configured per authenticated user.',
], C.midBlue);

y += Math.max(h1, h2) + 5;
y = drawSectionHeader(y, 2, 'User Roles & Permission Matrix');

// Role badges
const roleDefs = [
  { name: 'Super Admin', users: 'Shahroz', color: C.red },
  { name: 'Owner', users: 'Diana, Greg, Monica', color: C.midBlue },
  { name: 'Accountant', users: 'Colleen', color: C.green },
  { name: 'Shift Lead', users: 'Donna', color: C.amber },
  { name: 'Field QRE', users: 'Hugo, Nabil, Rogelio, Clarence', color: C.purple },
  { name: 'Customer', users: 'AutoKabel, Magna, Hutchinson, Brose', color: C.pink },
];

let bx = ml;
roleDefs.forEach(r => {
  setColor('fill', r.color);
  doc.roundedRect(bx, y, 28, 6.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  setColor('text', C.white);
  doc.text(r.name, bx + 14, y + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  setColor('text', C.slate500);
  const wrapped = doc.splitTextToSize(r.users, 27);
  let ry = y + 9;
  wrapped.forEach(wl => { doc.text(wl, bx + 1, ry); ry += 2.8; });
  bx += 30;
});

y += 18;

// Permission matrix
const mHeaders = ['Feature / Tab', 'Super Admin', 'Owner', 'Accountant', 'Lead', 'QRE', 'Customer'];
const mWidths = [52, 21, 21, 21, 21, 21, 21];
y = drawTableRow(y, mHeaders, mWidths, true);

const mRows = [
  ['Incident Defects Feed', 'Yes', 'Yes', '-', 'Yes', '-', '-'],
  ['Visual Defect Heatmap', 'Yes', 'Yes', '-', 'Yes', '-', '-'],
  ['Daily Tasks Planner', 'Yes', 'Yes', '-', 'Yes', '-', '-'],
  ['Shift Summaries & Publish', 'Yes', 'Yes', '-', 'Yes', '-', 'Published'],
  ['Suppliers Directory', 'Yes', 'Yes', '-', '-', '-', '-'],
  ['Timesheets & Mileage', 'Yes', 'Yes', 'Yes', '-', 'Own Only', 'Own Client'],
  ['Invoice & Billing', 'Yes', 'Yes', 'Yes', '-', '-', '-'],
  ['Rework Logs Feed', 'Yes', 'Yes', '-', 'Yes', '-', '-'],
  ['Email Audit Logs', 'Yes', 'Yes', '-', '-', '-', '-'],
  ['User Directory', 'Yes', 'Yes', '-', '-', '-', '-'],
  ['Projects Registry', 'Yes', 'Yes', '-', '-', '-', '-'],
  ['Setup & Onboarding', 'Yes', 'Yes', '-', '-', '-', '-'],
  ['System Events Logger', 'Yes', '-', '-', '-', '-', '-'],
  ['Launch Roadmap', 'Yes', '-', '-', '-', '-', '-'],
  ['Customer Portal', '-', '-', '-', '-', '-', 'Yes'],
  ['Pulse AI Chatbot', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', '-'],
];

mRows.forEach((row, i) => { y = drawTableRow(y, row, mWidths, false, i % 2 === 1); });

y += 5;
y = drawSectionHeader(y, 3, 'Profile Switching & Session Security');

const h3 = drawInfoCard(ml, y, 86, 22, 'Admin Profile Dropdown', [
  'Admins can switch views: Greg (Owner), Colleen (Finance), Donna (Lead).',
  'Super Admin option is only visible when logged in as Shahroz.',
  'Diana and other users are blocked from accessing the Super Admin profile.',
], C.darkBlue);

const h4 = drawInfoCard(ml + 92, y, 86, 22, 'Session Controls', [
  'Lock Session clears the browser session and forces re-authentication.',
  'Database Reset wipes all local data, re-seeds defaults, and re-syncs',
  'all 15 data collections to Supabase PostgreSQL cloud database.',
], C.midBlue);

y += Math.max(h3, h4) + 5;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — MOBILE FIELD REP WORKFLOW
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 2 - Mobile Field Rep Workflow');

y = 25;
y = drawSectionHeader(y, 4, 'Phone Simulator - Complete Field Representative Workflow');

const h2_1 = drawInfoCard(ml, y, 55, 26, 'Rep Authentication', [
  'Email and password login form.',
  'Quick login presets for each rep.',
  'Master passcode bypass available.',
  'Remember device via local storage.',
], C.purple);

drawFlowArrow(ml + 56, y + 13, ml + 60, y + 13, 'Auth');

const h2_2 = drawInfoCard(ml + 61, y, 55, 26, 'Shift Handover Detection', [
  'Detects if another rep had an active shift.',
  'Auto-locks the previous rep\'s draft report.',
  'Shows handover alert requiring acknowledgment.',
  'Records handover event in system logs.',
], C.amber);

drawFlowArrow(ml + 117, y + 13, ml + 121, y + 13, 'ACK');

const h2_3 = drawInfoCard(ml + 122, y, 56, 26, 'Home Dashboard', [
  'User profile with avatar, name, and role.',
  'Plant location selector dropdown.',
  'Online/offline status indicator.',
  'Six action buttons and daily task list.',
], C.teal);

y += Math.max(h2_1, h2_2, h2_3) + 5;

const h2_4 = drawInfoCard(ml, y, 86, 20, 'Clock In / Clock Out System', [
  'Clock In creates a draft shift report and records the start time in local storage.',
  'Clock Out shows elapsed hours calculation (demo mode uses 9.0 hours if under 1 minute).',
  'Mileage is tracked per time entry through the dashboard mileage input field.',
], C.green);

const h2_5 = drawInfoCard(ml + 92, y, 86, 20, 'Daily Tasks Viewer', [
  'Tasks filtered by representative and today\'s date from the cloud database.',
  'Each task can be toggled between completed and pending status inline.',
  'Tasks are dispatched by the admin from the Daily Tasks Planner tab on the dashboard.',
], C.midBlue);

y += Math.max(h2_4, h2_5) + 5;

y = drawSectionHeader(y, 5, 'Incident Report Wizard - 4 Steps with AI Duplicate Check');

const stepW = 41;
const hw1 = drawWorkflowStep(ml, y, stepW, 36, 1, 'Capture Photos', 'Three photo slots: wide, medium, and close-up views. Mock camera with shutter button. Canvas overlay for freehand red annotation drawing. Defect location pin placement on a part template diagram.', C.midBlue);
const hw2 = drawWorkflowStep(ml + stepW + 5, y, stepW, 36, 2, 'Barcode Scan', 'Mock barcode scanner with selectable part numbers from the database. QR code scanner for bin location lookup. Manual entry option with audio warning beep. Multi-part list builder to add, remove, and set quantities.', C.teal);
const hw3 = drawWorkflowStep(ml + stepW * 2 + 10, y, stepW, 36, 3, 'Describe Defect', 'Area selector and AI-suggested defect types based on scanned part. Free-text description and actions taken. Classification as PRR or QR. Toggle switches for sort required, RMA required, and defect returned.', C.amber);
const hw4 = drawWorkflowStep(ml + stepW * 3 + 15, y, 37, 36, '3.5', 'AI Dedup Check', 'Jaccard similarity analysis compares against incidents from the past 24 hours. Displays match percentage. Option to merge into an existing incident or continue as a new report.', C.purple);

const maxH_Page2 = Math.max(hw1, hw2, hw3, hw4);
drawFlowArrow(ml + stepW + 1, y + maxH_Page2 / 2, ml + stepW + 4, y + maxH_Page2 / 2);
drawFlowArrow(ml + stepW * 2 + 6, y + maxH_Page2 / 2, ml + stepW * 2 + 9, y + maxH_Page2 / 2);
drawFlowArrow(ml + stepW * 3 + 11, y + maxH_Page2 / 2, ml + stepW * 3 + 14, y + maxH_Page2 / 2);

y += maxH_Page2 + 5;

const h2_6 = drawInfoCard(ml, y, 86, 26, 'Step 4: Review, Preview & Submit', [
  'Full preview of all captured data: photos, annotations, parts, and description.',
  'Toggle to preview the formatted HTML email notification before sending.',
  'Two-second sending animation with progress indicator.',
  'Creates three records: incident report, email delivery log, and system event.',
], C.emerald);

const h2_7 = drawInfoCard(ml + 92, y, 86, 26, 'Additional Phone Features', [
  'Rework Logger: select part number, enter quantity sorted, hours spent, and notes.',
  'Expense Claims: enter amount, category, capture receipt photo, and submit.',
  'Shift Summary: four-area walk checklist, bonus tasks, and submit final report.',
  'Audio Feedback: distinct tones for success, scan, and warning events.',
], C.orange);

y += Math.max(h2_6, h2_7) + 5;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — DASHBOARD OPERATIONS & QUALITY
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 3 - Dashboard Operations & Quality');

y = 25;
y = drawSectionHeader(y, 6, 'Admin Dashboard - Operations & Quality Management Tabs');

const h3_1 = drawInfoCard(ml, y, 86, 32, 'Incidents & Defect Feed', [
  'Searchable list of all defect incident reports with supplier and status filters.',
  'Slide-out detail drawer with photo gallery, annotations, parts list, and coordinates.',
  'Toggle incident status between Open and Closed (logged to system events).',
  'Export individual incident as a branded PDF with logo, confidentiality badge,',
  'and watermark. Browser print dialog. Resend supplier email notification.',
], C.red);

const h3_2 = drawInfoCard(ml + 92, y, 86, 32, 'Visual Defect Heatmap Matrix', [
  'Interactive defect location map rendered on a part template image.',
  'Part number selector dropdown to switch between different components.',
  'Time scrubber slider to visualize how defect patterns cluster over time.',
  'Hover tooltips display individual incident details and timestamps.',
  'Dot opacity is weighted by recency of the defect occurrence.',
], C.purple);

y += Math.max(h3_1, h3_2) + 5;

const h3_3 = drawInfoCard(ml, y, 86, 26, 'Daily Tasks Planner', [
  'Date-scoped task list organized by representative assignment.',
  'Representative filter dropdown to view a specific person\'s tasks.',
  'Create new tasks by assigning instruction text, representative, and date.',
  'Toggle each task between completed and pending status.',
], C.midBlue);

const h3_4 = drawInfoCard(ml + 92, y, 86, 26, 'Shift Summaries Log', [
  'Chronological list of all shift walkthrough reports submitted by reps.',
  'Detail drawer showing areas walked, bonus tasks, and incident counts.',
  'Publish to Customer button changes status, making the report visible in the portal.',
  'Export as branded shift walkthrough audit PDF or use browser print.',
], C.teal);

y += Math.max(h3_3, h3_4) + 5;

const h3_5 = drawInfoCard(ml, y, 86, 20, 'Suppliers Directory', [
  'Grid of supplier cards showing name, invoice schedule, allotted hours, and contacts.',
  'Each card lists associated plant locations served by that supplier.',
  'Export full directory as a branded PDF report or use browser print.',
], C.amber);

const h3_6 = drawInfoCard(ml + 92, y, 86, 20, 'Rework Logs Feed', [
  'All rework and sort activities with date-based filtering.',
  'Detail drawer for each individual rework entry.',
  'Export as feed-level PDF, individual rework PDF, or browser print.',
], C.orange);

y += Math.max(h3_5, h3_6) + 5;

const h3_7 = drawInfoCard(ml, y, 86, 18, 'Email Delivery Logs', [
  'Complete email delivery audit trail for all sent notifications.',
  'Detail view shows: recipients, CC, subject, HTML body, status, and timestamp.',
], C.slate600);

const h3_8 = drawInfoCard(ml + 92, y, 86, 18, 'User Directory', [
  'Grid of all registered user cards: name, email, phone, role, and avatar.',
  'Displays pay currency assignment for each representative.',
], C.slate700);

y += Math.max(h3_7, h3_8) + 5;

y = drawSectionHeader(y, 7, 'Pulse AI - Conversational Database Auditor');

const h3_9 = drawInfoCard(ml, y, 86, 28, 'AI Chat Console', [
  'Natural language chat interface with persistent message history.',
  'Role-specific welcome messages and contextual quick-action chips.',
  'Admin commands: audit database, scan duplicates, export Excel or CSV.',
  'Accountant commands: audit timesheets, export financial reports.',
  'QRE commands: check hours, view assigned tasks for today.',
], C.purple);

const h3_10 = drawInfoCard(ml + 92, y, 86, 28, 'Automated Audit Engine', [
  'Comprehensive scan triggered via chat or the Run Scan button.',
  'Flags duplicate defect incidents matching on part number and area.',
  'Detects timesheet anomalies: negative hours, entries exceeding 24 hours.',
  'Identifies receipt mismatches and checks daily hour limit compliance.',
  'Directly triggers Excel, CSV, and PDF exports through chat commands.',
], C.midBlue);

y += Math.max(h3_9, h3_10) + 5;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 4 — FINANCIAL, BILLING & APPROVAL WORKFLOWS
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 4 - Financial, Billing & Approvals');

y = 25;
y = drawSectionHeader(y, 8, 'Timesheets, Invoicing & Financial Operations');

const h4_1 = drawInfoCard(ml, y, 56, 28, 'Log Hours & Expenses', [
  'Hours form: representative, supplier,',
  'date, hours worked, mileage in km, notes.',
  'Expense form: representative, supplier,',
  'date, category, dollar amount, notes.',
  'Both records sync to Supabase instantly.',
], C.midBlue);

const h4_2 = drawInfoCard(ml + 60, y, 56, 28, 'Invoice Generator', [
  'Select supplier and currency (CAD/USD).',
  'Calculates: hours multiplied by billing rate',
  'plus mileage at $0.73 per km plus expenses.',
  'Export as branded client invoice PDF.',
  'Export as QuickBooks-compatible CSV file.',
], C.green);

const h4_3 = drawInfoCard(ml + 120, y, 58, 28, 'Payroll & Expense Approvals', [
  'Queue of pending expense claims to review.',
  'View receipt photos in a lightbox modal.',
  'Approve or reject each expense with status.',
  'Extra hours admin final approval queue after',
  'customer stage. Auto-creates time entry.',
], C.amber);

y += Math.max(h4_1, h4_2, h4_3) + 5;

const h4_4 = drawInfoCard(ml, y, 86, 24, 'Rates Configuration & Admin Onboarding', [
  'Rate override matrix: set custom billing and pay rates per representative and supplier.',
  'Customers sub-tab: register new client companies with contact name, email, and role.',
  'Locations sub-tab: map new plant locations, link to supplier, assign representative, set rates.',
  'Representatives sub-tab: onboard new reps with name, email, phone, and pay currency.',
], C.darkBlue);

const h4_5 = drawInfoCard(ml + 92, y, 86, 24, 'Projects Registry & Quick Add System', [
  'Create project records linking a representative, client, plant, with billing and pay rates.',
  'Project-level rates take priority over the general rate override matrix.',
  'Quick Add modals for representatives, clients, and plants from within the registry.',
  'Each modal writes directly to Supabase and auto-selects the new record in dropdown.',
], C.teal);

y += Math.max(h4_4, h4_5) + 5;

y = drawSectionHeader(y, 9, 'Extra Hours - Three-Stage Approval Workflow');

const hw4_1 = drawWorkflowStep(ml, y, 42, 24, 1, 'Rep Files Request', 'Representative submits an overtime request specifying supplier, plant, date, hours, and written justification. Status is set to pending customer approval.', C.midBlue);
const hw4_2 = drawWorkflowStep(ml + 47, y, 42, 24, 2, 'Customer Reviews', 'Customer sees the request in their portal approval queue. They can approve or reject with a written comment. Approved requests escalate to admin review.', C.amber);
const hw4_3 = drawWorkflowStep(ml + 94, y, 42, 24, 3, 'Admin Approves', 'Admin reviews the request with customer comment in the Payroll tab. Approval automatically creates a new timesheet entry. Rejection records the reason.', C.green);
const h4_6 = drawInfoCard(ml + 141, y, 37, 24, 'Outcome', [
  'Approved: time entry created with',
  'tagged note in the timesheets.',
  'Full audit trail with timestamps',
  'and comments from each stage.',
], C.emerald);

const maxH_Page4_Extra = Math.max(hw4_1, hw4_2, hw4_3, h4_6);
drawFlowArrow(ml + 43, y + maxH_Page4_Extra / 2, ml + 46, y + maxH_Page4_Extra / 2, 'Notify');
drawFlowArrow(ml + 90, y + maxH_Page4_Extra / 2, ml + 93, y + maxH_Page4_Extra / 2, 'Escalate');
drawFlowArrow(ml + 137, y + maxH_Page4_Extra / 2, ml + 140, y + maxH_Page4_Extra / 2);

y += maxH_Page4_Extra + 5;

y = drawSectionHeader(y, 10, 'Expense Claims - Two-Stage Approval Workflow');

const hw4_4 = drawWorkflowStep(ml, y, 56, 20, 1, 'Rep Submits Claim', 'Representative files expense via the phone app or dashboard. Includes amount, category, receipt photograph, and notes. Status is set to submitted.', C.midBlue);
const hw4_5 = drawWorkflowStep(ml + 63, y, 56, 20, 2, 'Admin Reviews', 'Admin reviews in the Payroll Approvals panel. Can view receipt photo in a lightbox. Approves or rejects the claim with a status update.', C.green);
const h4_7 = drawInfoCard(ml + 126, y, 52, 20, 'Billing Impact', [
  'Approved expenses are included in client',
  'invoice calculations and payroll reports.',
  'Receipt photos are embedded in audit PDFs.',
], C.emerald);

const maxH_Page4_Exp = Math.max(hw4_4, hw4_5, h4_7);
drawFlowArrow(ml + 57, y + maxH_Page4_Exp / 2, ml + 62, y + maxH_Page4_Exp / 2, 'Queue');
drawFlowArrow(ml + 120, y + maxH_Page4_Exp / 2, ml + 125, y + maxH_Page4_Exp / 2);

y += maxH_Page4_Exp + 5;

y = drawSectionHeader(y, 11, 'Customer Portal - Client-Facing Dashboard');

const h4_8 = drawInfoCard(ml, y, 56, 22, 'Plant Assignment Grid', [
  'Displays the customer\'s plants with',
  'their assigned quality representative.',
  'Progress bar comparing unbilled vs',
  'allotted weekly hours per location.',
], C.pink);

const h4_9 = drawInfoCard(ml + 60, y, 58, 22, 'Overtime Approval Queue', [
  'Customer can approve or reject overtime',
  'requests from reps at their plants.',
  'Comment field for approval rationale.',
  'Approved requests escalate to admin.',
], C.amber);

const h4_10 = drawInfoCard(ml + 122, y, 56, 22, 'Published Reports & Audit', [
  'View published shift walkthrough reports.',
  'Weekly hours audit table filtered to the',
  'customer\'s supplier records only.',
  'Billing rates are hidden from the client.',
], C.midBlue);

y += Math.max(h4_8, h4_9, h4_10) + 5;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 5 — DATA ARCHITECTURE & SYNC
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 5 - Data Architecture & Sync');

y = 25;
y = drawSectionHeader(y, 12, 'Database Architecture - 15 Entity Collections');

const dbHeaders = ['Collection Name', 'Description'];
const dbWidths = [38, 140];
y = drawTableRow(y, dbHeaders, dbWidths, true);

const dbRows = [
  ['users', 'Representatives, leads, owners, and accountants with profile details and pay currency'],
  ['rates', 'Billing and pay rate overrides configured per representative, supplier, and plant'],
  ['plants', 'OEM assembly plant locations with addresses and brand associations'],
  ['suppliers', 'Client and supplier companies with contact information and invoice schedules'],
  ['parts', 'Part number registry used for barcode scanning and defect tracking'],
  ['incidents', 'Defect incident reports with annotated photos, parts lists, and coordinates'],
  ['shiftReports', 'Shift walkthrough audit summaries submitted by field representatives'],
  ['reworkLogs', 'Rework and sort activity logs with quantities, hours, and part numbers'],
  ['timeEntries', 'Hours worked and mileage logged per representative per day'],
  ['emailLogs', 'Email delivery audit trail for all system-generated notifications'],
  ['dailyTasks', 'Daily task assignments dispatched to representatives by administrators'],
  ['expenseEntries', 'Expense claims with receipt photographs, amounts, and approval status'],
  ['projects', 'Project registry entries linking reps, clients, plants with rates and currency'],
  ['extraHoursRequests', 'Overtime approval workflow items with three-stage status tracking'],
  ['systemLogs', 'System event audit trail accessible exclusively to the Super Admin'],
];

dbRows.forEach((row, i) => { y = drawTableRow(y, row, dbWidths, false, i % 2 === 1); });

y += 5;
y = drawSectionHeader(y, 13, 'Supabase Synchronization - Browser LocalStorage to PostgreSQL');

const hs1 = drawWorkflowStep(ml, y, cw, 14, 1, 'Initialize & Pull from Cloud', 'On application load, the database initializer seeds the local browser cache from default data, then after a brief delay pulls the latest records from Supabase. If the cloud has data, it overwrites local. If the cloud is empty, it seeds Supabase from local defaults.', C.darkBlue);
y += hs1 + 3;

const hs2 = drawWorkflowStep(ml, y, cw, 14, 2, 'Push on Every Write Operation', 'Every save operation writes to Browser LocalStorage immediately for zero-latency user experience, then simultaneously fires a background upsert to the Supabase PostgreSQL database. Delete operations call the Supabase delete endpoint by entity ID.', C.midBlue);
y += hs2 + 3;

const hs3 = drawWorkflowStep(ml, y, cw, 14, 3, 'Cross-Component Reactivity', 'After every database write, a custom DOM event is dispatched. Both the Phone Simulator and the Web Dashboard listen for this event and re-read their local state from the updated cache, ensuring both panels stay in sync.', C.teal);
y += hs3 + 3;

const hs4 = drawWorkflowStep(ml, y, cw, 14, 4, 'Real-Time Audio & Visual Notifications', 'The dashboard detects new data arrivals via reactive props. It plays a dual-tone synthesizer chime using the Web Audio API and displays a toast notification banner for new incidents, rework logs, shift reports, and expense claims.', C.green);
y += hs4 + 3;

const hs5 = drawWorkflowStep(ml, y, cw, 14, 5, 'Role-Based Data Sanitization', 'The data access layer applies per-role filtering on every read. Representatives see only their own records. Customers see only their supplier\'s data with billing rates stripped. Administrators receive full unrestricted access to all collections.', C.purple);
y += hs5 + 3;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 6 — REPORTS, EXPORTS & SYSTEM EVENTS
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 6 - Reports, Exports & System Events');

y = 25;
y = drawSectionHeader(y, 14, 'Complete Report & Export Catalog');

// PDF table
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
setColor('text', C.darkBlue);
doc.text('PDF Reports - 7 Types', ml, y + 3);
y += 6;

const rptH = ['Report Name', 'Output Filename Pattern', 'Generated From'];
const rptW = [50, 72, 56];
y = drawTableRow(y, rptH, rptW, true);

const rptRows = [
  ['Incident Audit Report', 'IDS_Pulse_Audit_{PartNo}_{IncId}.pdf', 'Incidents tab - per incident'],
  ['Shift Walkthrough Report', 'IDS_Shift_Walkthrough_{Date}_{SrId}.pdf', 'Shift Logs tab - per report'],
  ['Supplier Contacts Directory', 'IDS_Supplier_Contacts_Directory.pdf', 'Suppliers tab - full directory'],
  ['Timesheet Payroll Audit', 'IDS_Timesheets_Audit_Report.pdf', 'Timesheets tab - full payroll'],
  ['Rework Feed Report', 'IDS_Rework_Audit_Feed_{Date}.pdf', 'Rework Logs tab - all entries'],
  ['Individual Rework Audit', 'IDS_Rework_Audit_{RwId}.pdf', 'Rework Logs tab - per entry'],
  ['Client Billing Invoice', 'Invoice_{ClientName}_{Timestamp}.pdf', 'Invoice Generator sub-tab'],
];
rptRows.forEach((row, i) => { y = drawTableRow(y, row, rptW, false, i % 2 === 1); });

y += 5;
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
setColor('text', C.darkBlue);
doc.text('Spreadsheet Exports - 3 Types', ml, y + 3);
y += 6;

y = drawTableRow(y, rptH, rptW, true);
const csvRows = [
  ['QuickBooks CSV Export', 'QuickBooks_Export_{Supplier}.csv', 'Invoice Generator - per client'],
  ['Payroll CSV Export', 'IDS_Timesheets_Payroll_{Date}.csv', 'Timesheets tab - full payroll'],
  ['Styled Excel Workbook', 'IDS_Timesheets_Payroll_{Date}.xlsx', 'Timesheets tab - via ExcelJS'],
];
csvRows.forEach((row, i) => { y = drawTableRow(y, row, rptW, false, i % 2 === 1); });

y += 5;
doc.setFont('helvetica', 'bold');
doc.setFontSize(7);
setColor('text', C.darkBlue);
doc.text('Browser Print Reports - 5 Types', ml, y + 3);
y += 6;

const printRows = [
  ['Incident Audit Print', 'Styled HTML document', 'Incidents tab - per incident'],
  ['Shift Walkthrough Print', 'Styled HTML document', 'Shift Logs tab - per report'],
  ['Supplier Directory Print', 'Styled HTML document', 'Suppliers tab - full directory'],
  ['Timesheet Payroll Print', 'Styled HTML document', 'Timesheets tab - full payroll'],
  ['Rework Log Print', 'Styled HTML document', 'Rework Logs tab - feed or individual'],
];
y = drawTableRow(y, rptH, rptW, true);
printRows.forEach((row, i) => { y = drawTableRow(y, row, rptW, false, i % 2 === 1); });

y += 5;
y = drawSectionHeader(y, 15, 'Hidden System Events Logger - Super Admin Exclusive');

const h6_1 = drawInfoCard(ml, y, 86, 32, 'Tracked Event Categories', [
  'Authentication: login events and session initialization records.',
  'System: all onboarding operations - create customer, location, representative, save or delete rate overrides, quick-add actions from modals.',
  'Shift: clock in and out, shift report submissions, publish to customer.',
  'Incident: new incident creation, status updates between open and closed.',
  'Rework: rework log submissions.',
  'Payroll: overtime approvals, expense approvals, CSV, Excel, and PDF exports.',
], C.emerald);

const h6_2 = drawInfoCard(ml + 92, y, 86, 32, 'Access Control & Security', [
  'The System Events Logs tab is completely hidden from all non-Super Admin users.',
  'The sidebar button is wrapped in a role guard that checks for the shahroz role.',
  'The tab content panel has a secondary guard preventing direct URL navigation.',
  'Each event records: timestamp, acting user identity, category, action, and details.',
  'The clear console button resets the log to a single "cleared" audit entry.',
  'All event records are synchronized to the Supabase systemLogs cloud table.',
], C.darkBlue);

y += Math.max(h6_1, h6_2) + 5;

y = drawSectionHeader(y, 16, 'Projects Registry & Quick Add System');

const h6_3 = drawInfoCard(ml, y, 86, 22, 'Projects Registry Tab', [
  'List of registered projects: rep, client, plant, rates, currency, status.',
  'Create new project form with billing rate, pay rate, currency per project.',
  'Projects used by rate resolver - project rates take priority over rate overrides.',
], C.darkBlue);

const h6_4 = drawInfoCard(ml + 92, y, 86, 22, 'Quick Add Modals (Inline Popups)', [
  'Quick Add Rep: name, email, phone, currency - auto-selects in registry.',
  'Quick Add Client: name, invoice schedule - saves to suppliers collection.',
  'Quick Add Plant: name, address, linked supplier - saves to plants collection.',
  'Available from Projects Registry tab and Rates Config sub-tab.',
], C.teal);

y += Math.max(h6_3, h6_4) + 5;

// ─── SAVE ───────────────────────────────────────────────────────────────────
const outputPath = path.join(__dirname, 'IDS_Pulse_System_Architecture_FIXED.pdf');
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(`Successfully generated professional ${pageNum}-page flowchart at: ${outputPath}`);
