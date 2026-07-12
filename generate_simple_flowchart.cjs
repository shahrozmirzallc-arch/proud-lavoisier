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
  slate400:  [148, 163, 184],
  slate500:  [100, 116, 139],
  slate600:  [71, 85, 105],
  slate700:  [51, 65, 85],
  slate800:  [30, 41, 59],
  slate900:  [15, 23, 42],
  white:     [255, 255, 255],
};

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

  // Subtitle
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
  doc.text('CLIENT PRESENTATION', ml, 289);
  doc.text('IDS Pulse - App Workflow & Structure Presentation', pw / 2, 289, { align: 'center' });
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
  const safeBullets = bullets.map(b => b.replace(/\u2014/g, '-').replace(/—/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"'));
  const safeTitle = title.replace(/\u2014/g, '-').replace(/—/g, '-');

  // Pre-calculate height
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  let totalLines = 0;
  safeBullets.forEach(bullet => {
    const lines = doc.splitTextToSize(bullet, w - 12);
    totalLines += lines.length;
  });
  const h = Math.max(_h || 0, 12 + totalLines * 3.8 + 4);

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
  doc.setFontSize(8.5);
  setColor('text', C.slate900);
  doc.text(safeTitle, x + 4, y + 7);

  // Bullet points
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  let ly = y + 12;
  safeBullets.forEach(bullet => {
    const lines = doc.splitTextToSize(bullet, w - 12);
    lines.forEach((line, i) => {
      if (i === 0) {
        setColor('fill', accentColor || C.darkBlue);
        doc.circle(x + 5.5, ly - 1.2, 0.7, 'F');
      }
      setColor('text', C.slate600);
      doc.text(line, x + 8, ly);
      ly += 3.8;
    });
  });
  return h;
};

const drawWorkflowStep = (x, y, w, _h, stepNum, title, desc, color) => {
  const safeTitle = title.replace(/\u2014/g, '-').replace(/—/g, '-');
  const safeDesc = desc.replace(/\u2014/g, '-').replace(/—/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

  // Pre-calculate height from wrapped description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  const descLines = doc.splitTextToSize(safeDesc, w - 8);
  const h = Math.max(_h || 0, 12 + descLines.length * 3.3 + 3);

  setColor('fill', C.white);
  doc.roundedRect(x, y, w, h, 2, 2, 'F');
  setColor('draw', color || C.slate200);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 2, 2, 'D');

  // Step number badge
  setColor('fill', color || C.darkBlue);
  doc.roundedRect(x + 3, y + 3, 7, 5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  setColor('text', C.white);
  doc.text(String(stepNum), x + 6.5, y + 6.5, { align: 'center' });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColor('text', C.slate900);
  doc.text(safeTitle, x + 13, y + 6.5);

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setColor('text', C.slate600);
  let ly = y + 11.5;
  descLines.forEach(l => { doc.text(l, x + 4, ly); ly += 3.3; });
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
    doc.setFontSize(6);
    setColor('text', C.cyan);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    doc.text(label, mx, my - 1.5, { align: 'center' });
  }
};

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1 — CONCEPT OVERVIEW & MOBILE APP WORKFLOW
// ════════════════════════════════════════════════════════════════════════════
drawPageHeader('Page 1 - App Overview & Field representative App Flow');

let y = 25;
y = drawSectionHeader(y, 1, 'IDS Pulse Overview');

const h1 = drawInfoCard(ml, y, 86, 32, 'Why IDS Pulse?', [
  'Provides real-time reporting from the assembly floor directly to customers.',
  'Bridges the gap between Quality Representatives, Managers, and Clients.',
  'Eliminates delayed notifications, manual sheets, and unverified data.',
  'Ensures operations are visible, traceable, and instantly actionable.',
], C.darkBlue);

const h2 = drawInfoCard(ml + 92, y, 86, 32, 'Core Software Architecture', [
  'Mobile representative App: For field reps to log quality issues on the floor.',
  'Web Customer Portal: For clients to track alerts, hours, and approve shifts.',
  'Web Admin Dashboard: For corporate managers to control rates and billing.',
  'Real-Time Cloud Sync: Auto-saves every entry to the database instantly.',
], C.midBlue);

y += Math.max(h1, h2) + 6;
y = drawSectionHeader(y, 2, 'Mobile Representative App Flow');

const h3 = drawInfoCard(ml, y, 56, 26, 'Shift Startup', [
  'Representative logs in securely.',
  'Selects the plant location.',
  'Clocks in to open a new shift.',
  'Downloads active daily tasks checklist.',
], C.purple);

drawFlowArrow(ml + 57, y + 13, ml + 62, y + 13, 'Shift Active');

const h4 = drawInfoCard(ml + 63, y, 56, 26, 'Floor Activities', [
  'Scans parts barcodes or QR codes.',
  'Captures defect photos with notes.',
  'Draws directly on defect photos.',
  'Logs rework details and expenses.',
], C.teal);

drawFlowArrow(ml + 120, y + 13, ml + 125, y + 13, 'Shift End');

const h5 = drawInfoCard(ml + 126, y, 52, 26, 'Shift Walk & Summary', [
  'Performs physical walkthroughs.',
  'Completes 4-area walk checklist.',
  'Reviews reports for accuracy.',
  'Submits summary to customer.',
], C.emerald);

y += Math.max(h3, h4, h5) + 6;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 2 — INCIDENT WIZARD & REWORK FLOWS
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 2 - Incident Wizard & Rework Flows');

y = 25;
y = drawSectionHeader(y, 3, 'Incident Report Wizard (On-Floor Logging)');

const stepW = 41;
const hw1 = drawWorkflowStep(ml, y, stepW, 36, 1, 'Capture & Mark', 'Rep captures up to three photos (wide, medium, close-up) and draws red annotations on the screen to highlight the defect.', C.midBlue);
const hw2 = drawWorkflowStep(ml + stepW + 5, y, stepW, 36, 2, 'Scan Part & Bin', 'Rep scans the part barcode and QR bin tag. System auto-fills part descriptions, supplier names, and details from the database.', C.teal);
const hw3 = drawWorkflowStep(ml + stepW * 2 + 10, y, stepW, 36, 3, 'Describe Defect', 'Rep selects standard defects, writes brief concern details, and categorizes the concern (PRR or QR) for client notification.', C.amber);
const hw4 = drawWorkflowStep(ml + stepW * 3 + 15, y, 37, 36, '4', 'AI Check & Send', 'App checks for recent duplicate logs using Jaccard similarity. Rep previews the HTML email and clicks submit to notify the supplier.', C.purple);

const maxH_Incident = Math.max(hw1, hw2, hw3, hw4);
drawFlowArrow(ml + stepW + 1, y + maxH_Incident / 2, ml + stepW + 4, y + maxH_Incident / 2);
drawFlowArrow(ml + stepW * 2 + 6, y + maxH_Incident / 2, ml + stepW * 2 + 9, y + maxH_Incident / 2);
drawFlowArrow(ml + stepW * 3 + 11, y + maxH_Incident / 2, ml + stepW * 3 + 14, y + maxH_Incident / 2);

y += maxH_Incident + 6;
y = drawSectionHeader(y, 4, 'Floor Security & Incident History features');

const h2_1 = drawInfoCard(ml, y, 86, 24, 'Shift Handover Protection', [
  'Detects if another representative had an active shift on the same device.',
  'Auto-locks the previous draft shift report to prevent tampering.',
  'Presents handover alert requiring validation before continuing.',
], C.red);

const h2_2 = drawInfoCard(ml + 92, y, 86, 24, 'Offline Capability & History', [
  'Offline Mode: saves reports to LocalStorage if internet drops on floor.',
  'Syncs background data directly to Supabase once back online.',
  'Incident History tab lets representatives review past reports directly.',
], C.slate600);

y += Math.max(h2_1, h2_2) + 6;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 3 — WEB DASHBOARD & CUSTOMER PORTAL OVERVIEW
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 3 - Web Dashboard & Customer Portal');

y = 25;
y = drawSectionHeader(y, 5, 'Web Corporate Dashboard (For Administrators)');

const h6 = drawInfoCard(ml, y, 86, 32, 'Operations Management', [
  'Incident Defective Feed: Real-time feed of logged defect activities on the floor.',
  'Visual Defect Heatmap: Interactive part diagram showing defect clusters over time.',
  'Daily Tasks Planner: Dispatches specific floor tasks to representatives.',
  'Shift Walkthrough Summaries: Log of walkthrough checklists and daily tasks.',
], C.navy);

const h7 = drawInfoCard(ml + 92, y, 86, 32, 'Finance & Billing Control', [
  'Timesheets Payroll Panel: Records of logged hours, expenses, and rep mileage.',
  'Client Invoice Generator: Auto-calculates invoice details by client.',
  'Overtime Approval Queue: Reviews escalated extra hours requests.',
  'Expense Approval Portal: Reviews filed claims and captures receipts.',
], C.midBlue);

y += Math.max(h6, h7) + 6;
y = drawSectionHeader(y, 6, 'Web Customer Portal (For Clients)');

const h8 = drawInfoCard(ml, y, 56, 28, 'Live Floor Progress', [
  'Track QRE representative shift status.',
  'Monitor active hours in real-time.',
  'View progress bar of weekly hours.',
  'Review plant coverage status.',
], C.pink);

const h9 = drawInfoCard(ml + 60, y, 58, 28, 'Overtime Review Queue', [
  'View extra hours requests from reps.',
  'Approve/Reject overtime with comments.',
  'Approved items move to admin queue.',
  'Transparent, timestamped audit trail.',
], C.amber);

const h10 = drawInfoCard(ml + 122, y, 56, 28, 'Published Shift Reports', [
  'Access shift summaries published by reps.',
  'Audit hours billed to your supplier.',
  'Compare actual vs budgeted coverage.',
  'Rates are hidden from customer view.',
], C.teal);

y += Math.max(h8, h9, h10) + 6;


// ════════════════════════════════════════════════════════════════════════════
// PAGE 4 — APPROVAL WORKFLOWS & DATAFLOWS
// ════════════════════════════════════════════════════════════════════════════
newPage('Page 4 - Simple Approval Workflows & Security');

y = 25;
y = drawSectionHeader(y, 7, 'Overtime (Extra Hours) Approval Workflow');

const hw3_1 = drawWorkflowStep(ml, y, 42, 24, 1, 'Rep Files Overtime', 'Representative files an extra hours request on the mobile app, providing hours and reason.', C.midBlue);
drawFlowArrow(ml + 43, y + 12, ml + 46, y + 12, 'Request');

const hw3_2 = drawWorkflowStep(ml + 47, y, 42, 24, 2, 'Client Review', 'Client reviews request in Customer Portal. Approves or rejects it with comment.', C.amber);
drawFlowArrow(ml + 90, y + 12, ml + 93, y + 12, 'Escalate');

const hw3_3 = drawWorkflowStep(ml + 94, y, 42, 24, 3, 'Admin Final Review', 'Corporate manager performs a final review of the request. Approved items move to timesheet.', C.green);
drawFlowArrow(ml + 137, y + 12, ml + 140, y + 12, 'Approve');

const h11 = drawInfoCard(ml + 141, y, 37, 24, 'Billed Hours', [
  'Time entry auto-created.',
  'Added to client invoice.',
  'Recorded in payroll.',
], C.emerald);

y += Math.max(hw3_1, hw3_2, hw3_3, h11) + 6;
y = drawSectionHeader(y, 8, 'Expense Claims Approval Workflow');

const hw3_4 = drawWorkflowStep(ml, y, 56, 20, 1, 'Rep Files Claim', 'Representative uploads claim details (amount, category, notes, receipt photo) via the app.', C.midBlue);
drawFlowArrow(ml + 57, y + 10, ml + 62, y + 10, 'Submit');

const hw3_5 = drawWorkflowStep(ml + 63, y, 56, 20, 2, 'Admin Review', 'Corporate manager reviews claim on the dashboard. Inspects receipt photo and approves.', C.green);
drawFlowArrow(ml + 120, y + 10, ml + 125, y + 10, 'Payout');

const h12 = drawInfoCard(ml + 126, y, 52, 20, 'Invoice & Payroll', [
  'Approved claim is added to next invoice.',
  'Representative is reimbursed in payroll.',
  'Receipt photos linked directly to reports.',
], C.emerald);

y += Math.max(hw3_4, hw3_5, h12) + 6;

// ─── SAVE ───────────────────────────────────────────────────────────────────
const outputPath = path.join(__dirname, 'IDS_Pulse_Software_Flowchart_Simple_Final.pdf');
fs.writeFileSync(outputPath, Buffer.from(doc.output('arraybuffer')));
console.log(`Successfully generated simple flowchart at: ${outputPath}`);
