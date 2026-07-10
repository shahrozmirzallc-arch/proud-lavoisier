const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const doc = new jsPDF();
let currentPage = 1;

// ─── HELPERS ────────────────────────────────────────────────────────────────

const drawHeader = (pageNum, subtitle) => {
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(14, 8, 28, 11, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("IDS PULSE", 28, 15.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 95);
  doc.text(subtitle.toUpperCase(), 196, 15, { align: "right" });

  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(0.6);
  doc.line(14, 23, 196, 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Confidential — IDS Pulse Complete System Flowchart — Page ${pageNum}`, 14, 290);
};

const drawSectionTitle = (y, title) => {
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(14, y, 182, 9, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 19, y + 6.2);
  return y + 13;
};

const drawBox = (x, y, w, h, title, lines, opts = {}) => {
  const fill = opts.fill || [248, 250, 252];
  const border = opts.border || [203, 213, 225];
  const titleColor = opts.titleColor || [15, 23, 42];
  
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, w, h, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...titleColor);
  doc.text(title, x + 3, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  let ly = y + 9.5;
  lines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, w - 6);
    wrapped.forEach(wl => {
      doc.text(wl, x + 3, ly);
      ly += 3.2;
    });
  });
};

const drawBadge = (x, y, w, h, text, bgColor, textColor) => {
  doc.setFillColor(...bgColor);
  doc.roundedRect(x, y, w, h, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(...textColor);
  doc.text(text, x + w / 2, y + h / 2 + 1.5, { align: "center" });
};

const drawArrow = (x1, y1, x2, y2, label = "") => {
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.6);
  doc.line(x1, y1, x2, y2);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hl = 2.5;
  doc.line(x2, y2, x2 - hl * Math.cos(angle - Math.PI / 6), y2 - hl * Math.sin(angle - Math.PI / 6));
  doc.line(x2, y2, x2 - hl * Math.cos(angle + Math.PI / 6), y2 - hl * Math.sin(angle + Math.PI / 6));
  if (label) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(5.5);
    doc.setTextColor(14, 165, 233);
    doc.text(label, (x1 + x2) / 2, (y1 + y2) / 2 - 1.5, { align: "center" });
  }
};

const drawDashedArrow = (x1, y1, x2, y2, label = "") => {
  doc.setDrawColor(168, 85, 247);
  doc.setLineWidth(0.5);
  const segs = 12;
  const dx = (x2 - x1) / segs;
  const dy = (y2 - y1) / segs;
  for (let i = 0; i < segs; i += 2) {
    doc.line(x1 + dx * i, y1 + dy * i, x1 + dx * (i + 1), y1 + dy * (i + 1));
  }
  if (label) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(5.5);
    doc.setTextColor(168, 85, 247);
    doc.text(label, (x1 + x2) / 2, (y1 + y2) / 2 - 1.5, { align: "center" });
  }
};

const addPage = (subtitle) => {
  doc.addPage();
  currentPage++;
  drawHeader(currentPage, subtitle);
};

const drawStepRow = (y, num, title, desc) => {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 14, 1.5, 1.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 14, 1.5, 1.5, "D");

  doc.setFillColor(30, 58, 95);
  doc.roundedRect(17, y + 2.5, 9, 9, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(String(num), 21.5, y + 9, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 30, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const wrapped = doc.splitTextToSize(desc, 160);
  let ly = y + 10.5;
  wrapped.forEach(wl => { doc.text(wl, 30, ly); ly += 3; });
};

// ════════════════════════════════════════════════════════════════════════════
// PAGE 1: AUTHENTICATION & ROLE ARCHITECTURE
// ════════════════════════════════════════════════════════════════════════════
drawHeader(1, "Authentication & Role Architecture");

let y = 28;
y = drawSectionTitle(y, "1.  USER AUTHENTICATION FLOW");

drawBox(14, y, 88, 28, "Login Gateway (SHA-256 Hashed)", [
  "User enters Username + Password at login screen.",
  "Password is hashed via crypto.subtle.digest (SHA-256).",
  "Hash is compared against stored admin credentials.",
  "Username is case-insensitive and space-stripped."
]);
drawArrow(102, y + 14, 110, y + 14);
drawBox(110, y, 86, 28, "Session Initialization", [
  "sessionStorage → ids_pulse_role, ids_pulse_admin_user",
  "sessionStorage → ids_pulse_unlocked = true",
  "Default tab set to Projects Registry for all roles.",
  "Profile dropdown configured per authenticated user."
]);

y += 33;
y = drawSectionTitle(y, "2.  USER ROLES & ACCESS MATRIX");

// Role columns
const roles = [
  { name: "Super Admin", key: "shahroz", users: "Shahroz", color: [220, 38, 38] },
  { name: "Owner", key: "owner", users: "Diana, Greg, Monica, Iris, Miriam", color: [37, 99, 235] },
  { name: "Accountant", key: "accountant", users: "Colleen", color: [16, 185, 129] },
  { name: "Shift Lead", key: "lead", users: "Donna", color: [245, 158, 11] },
  { name: "Field QRE", key: "qre", users: "Hugo, Nabil, Rogelio, Clarence", color: [168, 85, 247] },
  { name: "Customer", key: "customer", users: "AutoKabel, Magna, Hutchinson, Brose", color: [236, 72, 153] },
];

let rx = 14;
roles.forEach(role => {
  drawBadge(rx, y, 30, 7, role.name, role.color, [255, 255, 255]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  const wrapped = doc.splitTextToSize(role.users, 28);
  let ry = y + 10;
  wrapped.forEach(wl => { doc.text(wl, rx + 1, ry); ry += 2.8; });
  rx += 31;
});

y += 22;

// Access matrix table
doc.setFont("helvetica", "bold");
doc.setFontSize(6);
doc.setTextColor(30, 58, 95);
const headers = ["Feature / Tab", "Super Admin", "Owner", "Accountant", "Lead", "QRE", "Customer"];
const colW = [52, 22, 22, 22, 22, 22, 22];
let tx = 14;
headers.forEach((h, i) => {
  doc.setFillColor(i === 0 ? 241 : 248, i === 0 ? 245 : 250, i === 0 ? 249 : 252);
  doc.rect(tx, y, colW[i], 6, "F");
  doc.text(h, tx + 2, y + 4);
  tx += colW[i];
});
y += 6;

const matrixRows = [
  ["Incidents & Defect Feed", "✓", "✓", "—", "✓", "—", "—"],
  ["Visual Defect Heatmap", "✓", "✓", "—", "✓", "—", "—"],
  ["Daily Tasks Planner", "✓", "✓", "—", "✓", "—", "—"],
  ["Shift Summaries & Publish", "✓", "✓", "—", "✓", "—", "Published Only"],
  ["Suppliers Directory", "✓", "✓", "—", "—", "—", "—"],
  ["Timesheets & Mileage", "✓", "✓", "✓", "—", "Own Only", "Own Supplier"],
  ["Invoice & Billing", "✓", "✓", "✓", "—", "—", "—"],
  ["Rework Logs Feed", "✓", "✓", "—", "✓", "—", "—"],
  ["Email Logs", "✓", "✓", "—", "—", "—", "—"],
  ["User Directory", "✓", "✓", "—", "—", "—", "—"],
  ["Projects Registry", "✓", "✓", "—", "—", "—", "—"],
  ["Setup & Onboarding (CRUD)", "✓", "✓", "—", "—", "—", "—"],
  ["System Events Logger", "✓", "—", "—", "—", "—", "—"],
  ["Launch Roadmap", "✓", "—", "—", "—", "—", "—"],
  ["Customer Portal", "—", "—", "—", "—", "—", "✓"],
  ["Pulse AI Chatbot", "✓", "✓", "✓", "✓", "✓", "—"],
];

doc.setFont("helvetica", "normal");
doc.setFontSize(5.5);
matrixRows.forEach((row, ri) => {
  tx = 14;
  row.forEach((cell, ci) => {
    const bg = ri % 2 === 0 ? [248, 250, 252] : [241, 245, 249];
    doc.setFillColor(...bg);
    doc.rect(tx, y, colW[ci], 5, "F");
    doc.setTextColor(ci === 0 ? 30 : (cell === "✓" ? 16 : (cell === "—" ? 180 : 71)), ci === 0 ? 58 : (cell === "✓" ? 185 : (cell === "—" ? 180 : 85)), ci === 0 ? 95 : (cell === "✓" ? 129 : (cell === "—" ? 180 : 105)));
    doc.setFont("helvetica", ci === 0 ? "bold" : "normal");
    doc.text(cell, tx + 2, y + 3.5);
    tx += colW[ci];
  });
  y += 5;
});

y += 5;
y = drawSectionTitle(y, "3.  PROFILE SWITCHER & SESSION SECURITY");

drawBox(14, y, 88, 22, "Admin Header Profile Dropdown", [
  "Admins can switch between: Greg (Owner), Colleen (Finance),",
  "Donna (Shift Lead). Super Admin option only visible to Shahroz.",
  "Diana is blocked from accessing Super Admin profile."
]);
drawBox(108, y, 88, 22, "Session Locking & Database Reset", [
  "Lock Session: clears sessionStorage, forces re-login.",
  "Database Reset: wipes localStorage, re-seeds from SEED_DATA,",
  "re-syncs all 15 collections to Supabase PostgreSQL."
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 2: MOBILE FIELD REP WORKFLOW
// ════════════════════════════════════════════════════════════════════════════
addPage("Mobile Field Rep Workflow");

y = 28;
y = drawSectionTitle(y, "4.  PHONE SIMULATOR — COMPLETE FIELD REP WORKFLOW");

// Login Row
drawBox(14, y, 55, 22, "Rep Login Screen", [
  "Email + Password OR Quick Preset.",
  "Presets: Clarence, Hugo, Nabil, Rogelio, Donna.",
  "Master bypass: Shahroz123$"
]);
drawArrow(69, y + 11, 77, y + 11, "Auth");
drawBox(77, y, 55, 22, "Handover Detection", [
  "If previous rep had active shift, system",
  "auto-locks their draft shift report and",
  "shows Handover Alert requiring ACK."
]);
drawArrow(132, y + 11, 140, y + 11, "ACK");
drawBox(140, y, 56, 22, "Home Dashboard", [
  "Avatar, name, role, plant selector.",
  "Wi-Fi status, online/offline toggle.",
  "6 action buttons + daily task list."
]);

y += 27;

// Clock In/Out
drawBox(14, y, 88, 18, "Clock In / Clock Out System", [
  "Clock In → creates Draft shiftReport, records start time in localStorage.",
  "Clock Out → modal with elapsed hours calculation (demo: 9.0 hrs if < 1 min).",
  "Mileage auto-tracked per time entry via dashboard mileage field."
]);
drawBox(108, y, 88, 18, "Daily Tasks Viewer", [
  "Filtered by rep ID + today's date from Supabase dailyTasks.",
  "Inline toggle: completed ↔ pending per task.",
  "Tasks dispatched by admin from Daily Tasks Planner tab."
]);

y += 23;
y = drawSectionTitle(y, "5.  INCIDENT REPORT WIZARD (4-STEP + AI DUPLICATE CHECK)");

// Step 1
drawBox(14, y, 44, 32, "Step 1: Capture Photos", [
  "3 photos: Wide, Medium, Close-up.",
  "Mock camera with shutter button.",
  "Canvas annotation overlay per photo:",
  "  • Freehand red pen (4px stroke)",
  "  • Clear & redraw background",
  "  • Save as data URL",
  "Defect pin on part template."
]);
drawArrow(58, y + 16, 63, y + 16);

// Step 2
drawBox(63, y, 44, 32, "Step 2: Barcode Scan", [
  "Mock barcode scanner (part selector).",
  "QR code scanner (bin location).",
  "Manual entry with warning beep.",
  "Auto-fills part info from DB.",
  "Multi-part list builder:",
  "  • Add/remove parts",
  "  • Adjust quantity per part"
]);
drawArrow(107, y + 16, 112, y + 16);

// Step 3
drawBox(112, y, 44, 32, "Step 3: Describe Defect", [
  "Area selector dropdown.",
  "AI defect type suggestions.",
  "Custom description + action taken.",
  "Classification: PRR / QR.",
  "Toggles: Sort Required,",
  "RMA Required, Defect Returned.",
  "Audio/Video attachment toggles."
]);
drawArrow(156, y + 16, 161, y + 16);

// Step 3.5 + 4
drawBox(161, y, 35, 32, "Step 3.5: AI Dedup", [
  "Jaccard similarity analysis",
  "vs incidents in last 24hrs.",
  "Match %: Merge into",
  "existing OR Continue",
  "as new incident."
]);

y += 37;

drawBox(14, y, 88, 22, "Step 4: Review & Submit", [
  "Full preview: photos, parts, description, classification.",
  "Email preview toggle (formatted HTML notification).",
  "2-second sending animation → creates incident + email log + system event.",
  "Confirmation screen shows new Incident ID."
]);
drawArrow(102, y + 11, 110, y + 11, "Supabase Sync");
drawBox(110, y, 86, 22, "Data Created on Submit", [
  "1. Incident record → incidents collection (with photos, annotations, parts).",
  "2. Email log record → emailLogs collection.",
  "3. System event → systemLogs (hidden, Shahroz only).",
  "All 3 upserted to Supabase PostgreSQL in background."
]);

y += 27;
y = drawSectionTitle(y, "6.  REWORK LOGGER, EXPENSE CLAIMS & SHIFT SUMMARY");

drawBox(14, y, 56, 22, "Rework Logger (Phone)", [
  "Part number selector from DB parts list.",
  "Quantity sorted, hours spent, notes.",
  "Creates reworkLog record → Supabase.",
  "Dashboard Rework Feed auto-updates."
]);
drawBox(75, y, 56, 22, "Expense Claims (Phone)", [
  "Amount, category (Fuel/Tolls/Meals/Safety).",
  "Mock receipt photo capture → data URL.",
  "Creates expenseEntry (status: submitted).",
  "Admin approves/rejects on dashboard."
]);
drawBox(136, y, 60, 22, "Shift End Summary (Phone)", [
  "4-area walk checklist (Online Assembly,",
  "Sequence, Heavy Rework, Scrap Table).",
  "Bonus tasks checklist with notes.",
  "Submit → creates shiftReport + email log."
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 3: DASHBOARD TABS — OPERATIONS & QUALITY
// ════════════════════════════════════════════════════════════════════════════
addPage("Dashboard — Operations & Quality");

y = 28;
y = drawSectionTitle(y, "7.  ADMIN DASHBOARD TABS — OPERATIONS & QUALITY MANAGEMENT");

// Incidents Tab
drawBox(14, y, 88, 30, "TAB: Incidents & Defect Feed", [
  "Full list of incident reports with search, supplier filter, status filter.",
  "Detail drawer (slide-out): photo gallery, annotations, parts list, coordinates.",
  "Status toggle: Open ↔ Closed (logged to system events).",
  "EXPORTS: Individual incident audit PDF (with logo, confidentiality badge,",
  "watermark). Browser Print dialog. Resend supplier email notification."
]);
drawBox(108, y, 88, 30, "TAB: Visual Defect Heatmap Matrix", [
  "Interactive defect location heatmap on part template image.",
  "Part selector dropdown (by part number from DB).",
  "Time scrubber to visualize defect clustering over time.",
  "Hover tooltips showing individual incident details.",
  "Dot opacity based on recency of defect occurrence."
]);

y += 35;

drawBox(14, y, 88, 26, "TAB: Daily Tasks Planner", [
  "Date-scoped task assignment per representative.",
  "Rep filter dropdown to view specific rep's tasks.",
  "Create new tasks: assign instruction, rep, date.",
  "Toggle task status: completed ↔ pending.",
  "Tasks pushed live to Phone Simulator for rep."
]);
drawBox(108, y, 88, 26, "TAB: Shift Summaries Log", [
  "List of all shift walkthrough reports from reps.",
  "Detail drawer: areas walked, bonus tasks, incidents count.",
  "Publish to Customer: changes status → 'published',",
  "making report visible in Customer Portal.",
  "EXPORTS: Shift walkthrough audit PDF, browser print."
]);

y += 31;

drawBox(14, y, 88, 20, "TAB: Suppliers Directory", [
  "Grid of supplier cards: name, invoice schedule, allotted hours,",
  "contacts (name, email, role), plants served list.",
  "EXPORTS: Full supplier contacts directory PDF, browser print."
]);
drawBox(108, y, 88, 20, "TAB: Rework Logs Feed", [
  "All rework/sort activities with date filtering.",
  "Detail drawer per individual rework log.",
  "EXPORTS: Feed-level PDF + individual rework audit PDF.",
  "Browser print for both feed and individual reports."
]);

y += 25;

drawBox(14, y, 88, 18, "TAB: Email Logs", [
  "Full email delivery audit trail.",
  "Detail view: to, cc, subject, HTML body, delivery status, timestamp."
]);
drawBox(108, y, 88, 18, "TAB: User Directory", [
  "Grid of user cards: name, email, phone, role, avatar, pay currency.",
  "All registered reps, leads, owners, and accountants."
]);

y += 23;
y = drawSectionTitle(y, "8.  PULSE AI — CONVERSATIONAL DATABASE AUDITOR");

drawBox(14, y, 88, 28, "AI Chat Console (Left Panel)", [
  "Natural language chat interface with message history.",
  "Role-specific welcome messages and quick prompt chips.",
  "Admin: 'Audit Database', 'Scan Duplicates', 'Export Excel/CSV'.",
  "Accountant: 'Audit Timesheets', 'Export Excel/CSV'.",
  "Lead: 'Audit Quality Logs', 'Download Quality PDF'.",
  "QRE: 'Check my hours', 'What tasks do I have today?'."
]);
drawBox(108, y, 88, 28, "AI Audit Engine (Right Panel)", [
  "Run Scan button triggers comprehensive data audit:",
  "• Flags duplicate defect incidents (same part + area).",
  "• Detects timesheet anomalies (negative hrs, >24hr entries).",
  "• Identifies receipt mismatches in expense claims.",
  "• Checks daily hour limit breaches.",
  "Triggers: Excel, CSV, PDF exports via chat commands."
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 4: FINANCIAL, BILLING & APPROVAL WORKFLOWS
// ════════════════════════════════════════════════════════════════════════════
addPage("Financial, Billing & Approvals");

y = 28;
y = drawSectionTitle(y, "9.  TIMESHEETS, INVOICING & FINANCIAL OPERATIONS");

drawBox(14, y, 60, 26, "Sub-Tab: Log Hours & Expenses", [
  "Log Hours: rep, supplier, date, hours,",
  "mileage (km), notes → timeEntries.",
  "Log Expense: rep, supplier, date, category,",
  "amount, notes → expenseEntries.",
  "Both sync to Supabase immediately."
]);
drawBox(78, y, 58, 26, "Sub-Tab: Invoice Generator", [
  "Supplier selector, currency filter (CAD/USD).",
  "Calculates: hours × billing rate +",
  "mileage × $0.73/km + expenses.",
  "Mark entries as invoiced.",
  "PDF invoice + QuickBooks CSV export."
]);
drawBox(140, y, 56, 26, "Sub-Tab: Payroll Approvals", [
  "Expense approval queue (approve/reject).",
  "Extra hours admin final approval",
  "queue (after customer approval).",
  "Auto-creates timeEntry on approval."
]);

y += 31;

drawBox(14, y, 88, 22, "Sub-Tab: Rates & Configuration + Admin CRUD", [
  "Rate override matrix: custom billing/pay rates per rep + supplier.",
  "CRUD Sub-Tab: Customers → register new client/supplier with contacts.",
  "CRUD Sub-Tab: Locations → map new plant, link to supplier, assign rep, set rate.",
  "CRUD Sub-Tab: Reps → onboard new representative (name, email, phone, currency)."
]);
drawBox(108, y, 88, 22, "Sub-Tab: Bulk Entry + Quick Add Modals", [
  "Quick Add Rep: inline modal popup, auto-selects in registry.",
  "Quick Add Client: inline modal popup with invoice schedule.",
  "Quick Add Plant: inline modal popup with address + supplier link.",
  "All modals write directly to Supabase via saveEntity()."
]);

y += 27;
y = drawSectionTitle(y, "10. EXTRA HOURS — 3-STAGE APPROVAL WORKFLOW");

// Workflow boxes
drawBox(14, y, 38, 22, "Stage 1: Rep Files", [
  "Rep submits extra hours",
  "request with: supplier,",
  "plant, date, hours, reason.",
  "Status → pending_customer"
], { fill: [239, 246, 255], border: [147, 197, 253] });

drawArrow(52, y + 11, 58, y + 11, "Notify");

drawBox(58, y, 42, 22, "Stage 2: Customer Review", [
  "Customer sees request in",
  "their Portal approval queue.",
  "Can approve or reject with",
  "comment. Status → pending_admin"
], { fill: [254, 243, 199], border: [252, 211, 77] });

drawArrow(100, y + 11, 106, y + 11, "Escalate");

drawBox(106, y, 42, 22, "Stage 3: Admin Final", [
  "Admin reviews in Payroll tab.",
  "Approve → auto-creates new",
  "timeEntry record in timesheets.",
  "Reject → status: rejected_by_admin"
], { fill: [209, 250, 229], border: [74, 222, 128] });

drawArrow(148, y + 11, 154, y + 11, "Result");

drawBox(154, y, 42, 22, "Final Outcome", [
  "Approved: timeEntry created",
  "with '[APPROVED EXTRA HOURS]'",
  "note. Appears in timesheets.",
  "History trail with comments."
], { fill: [248, 250, 252], border: [203, 213, 225] });

y += 27;
y = drawSectionTitle(y, "11. EXPENSE CLAIMS — 2-STAGE APPROVAL WORKFLOW");

drawBox(14, y, 56, 18, "Stage 1: Rep Submits Expense", [
  "Rep files expense via Phone or Dashboard.",
  "Includes: amount, category, receipt photo, notes.",
  "Status → submitted. Synced to Supabase."
], { fill: [239, 246, 255], border: [147, 197, 253] });

drawArrow(70, y + 9, 78, y + 9, "Queue");

drawBox(78, y, 56, 18, "Stage 2: Admin Approves/Rejects", [
  "Admin reviews in Payroll & Expense Approvals.",
  "View receipt photo (lightbox modal).",
  "Approve → status: approved. Reject → status: rejected."
], { fill: [209, 250, 229], border: [74, 222, 128] });

drawArrow(134, y + 9, 142, y + 9);

drawBox(142, y, 54, 18, "Impact on Billing", [
  "Approved expenses included in client",
  "invoice calculations and payroll reports.",
  "Receipt photos embedded in audit PDFs."
], { fill: [248, 250, 252], border: [203, 213, 225] });

y += 23;
y = drawSectionTitle(y, "12. CUSTOMER PORTAL (CLIENT-FACING DASHBOARD)");

drawBox(14, y, 60, 24, "Location & QRE Assignment Grid", [
  "Shows customer's plants with assigned QRE rep.",
  "Unbilled hours progress bar per location.",
  "Weekly allotted vs actual hours comparison."
]);
drawBox(78, y, 58, 24, "Extra Hours Approval Queue", [
  "Customer can approve/reject overtime requests",
  "filed by reps working at their plants.",
  "Comment field for approval/rejection rationale.",
  "Approved requests escalate to Admin."
]);
drawBox(140, y, 56, 24, "Published Reports & Hours Audit", [
  "View published shift walkthrough reports.",
  "Weekly hours audit table filtered to",
  "customer's supplier_id only.",
  "Billing rates are hidden from customer."
]);

// ════════════════════════════════════════════════════════════════════════════
// PAGE 5: DATA ARCHITECTURE & REPORTS
// ════════════════════════════════════════════════════════════════════════════
addPage("Data Architecture & Reports");

y = 28;
y = drawSectionTitle(y, "13. DATABASE ARCHITECTURE — 15 ENTITY COLLECTIONS");

const collections = [
  ["users", "Reps, leads, owners, accountants (8 seed)"],
  ["rates", "Billing/pay rate overrides per rep+supplier+plant"],
  ["plants", "OEM assembly plant locations (6 seed)"],
  ["suppliers", "Client/supplier companies with contacts (5 seed)"],
  ["parts", "Part number registry for barcode scanning"],
  ["incidents", "Defect incident reports with photos & annotations"],
  ["shiftReports", "Shift walkthrough audit summaries"],
  ["reworkLogs", "Rework/sort activity logs"],
  ["timeEntries", "Hours + mileage per rep per day"],
  ["emailLogs", "Email delivery audit trail"],
  ["dailyTasks", "Assigned daily tasks per rep"],
  ["expenseEntries", "Expense claims with receipt photos"],
  ["projects", "Project registry with billing/pay/currency"],
  ["extraHoursRequests", "Overtime approval workflow items"],
  ["systemLogs", "System event audit trail (Shahroz only)"],
];

let cy = y;
const colWidths = [35, 147];
doc.setFillColor(30, 58, 95);
doc.rect(14, cy, colWidths[0], 6, "F");
doc.rect(14 + colWidths[0], cy, colWidths[1], 6, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(6.5);
doc.setTextColor(255, 255, 255);
doc.text("Collection", 16, cy + 4.2);
doc.text("Description", 16 + colWidths[0], cy + 4.2);
cy += 6;

doc.setFont("helvetica", "normal");
doc.setFontSize(6);
collections.forEach((row, i) => {
  const bg = i % 2 === 0 ? [248, 250, 252] : [241, 245, 249];
  doc.setFillColor(...bg);
  doc.rect(14, cy, colWidths[0], 5, "F");
  doc.rect(14 + colWidths[0], cy, colWidths[1], 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 95);
  doc.text(row[0], 16, cy + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(row[1], 16 + colWidths[0], cy + 3.5);
  cy += 5;
});

y = cy + 5;
y = drawSectionTitle(y, "14. SUPABASE SYNC MECHANISM (BROWSER LOCALSTORAGE → POSTGRESQL)");

drawStepRow(y, 1, "Initialize & Pull", "On app load, initializeDB() seeds local cache from SEED_DATA, then calls syncWithSupabase() after 100ms delay. For each of 15 collections, pulls from Supabase. If Supabase has data → overwrites local. If empty → seeds Supabase from local.");
y += 17;
drawStepRow(y, 2, "Push on Write", "Every saveEntity() call writes to Browser LocalStorage immediately (zero latency) and simultaneously fires supabase.from(type).upsert(entity) in background. Delete operations call supabase.from().delete().eq('id', entityId).");
y += 17;
drawStepRow(y, 3, "Cross-Component Reactivity", "After every write, a custom DOM event 'ids_pulse_db_update' is dispatched. Both PhoneSimulator and WebDashboard listen for this event and re-read their local state from the updated cache.");
y += 17;
drawStepRow(y, 4, "Real-Time Notifications", "Dashboard detects new data via dbUpdateTrigger prop. Plays dual-tone chime (Web Audio API sine wave). Shows toast notification banner for incidents, rework logs, shift reports, and expense claims.");
y += 17;
drawStepRow(y, 5, "Role-Based Data Sanitization", "getEntities() applies per-role data filtering. Reps see only their own records. Customers see only their supplier's data with billing rates stripped. Admins get full unrestricted access.");

// ════════════════════════════════════════════════════════════════════════════
// PAGE 6: COMPLETE REPORT CATALOG & SYSTEM EVENTS
// ════════════════════════════════════════════════════════════════════════════
addPage("Reports, Exports & System Events");

y = 28;
y = drawSectionTitle(y, "15. COMPLETE REPORT & EXPORT CATALOG");

// PDF Reports
doc.setFont("helvetica", "bold");
doc.setFontSize(7);
doc.setTextColor(30, 58, 95);
doc.text("PDF REPORTS (7 Types)", 14, y + 4);
y += 7;

const pdfReports = [
  ["Incident Audit PDF", "IDS_Pulse_Audit_{PN}_{incId}.pdf", "Incidents tab — per incident"],
  ["Shift Walkthrough PDF", "IDS_Shift_Walkthrough_{date}_{srId}.pdf", "Shift Logs tab — per report"],
  ["Supplier Directory PDF", "IDS_Supplier_Contacts_Directory.pdf", "Suppliers tab — full directory"],
  ["Timesheet Payroll PDF", "IDS_Timesheets_Audit_Report.pdf", "Timesheets tab — full payroll"],
  ["Rework Feed PDF", "IDS_Rework_Audit_Feed_{date}.pdf", "Rework Logs tab — all rework"],
  ["Individual Rework PDF", "IDS_Rework_Audit_{rwId}.pdf", "Rework Logs tab — per rework"],
  ["Client Invoice PDF", "Invoice_{ClientName}_{timestamp}.pdf", "Invoice Generator sub-tab"],
];

// Table header
doc.setFillColor(30, 58, 95);
doc.rect(14, y, 50, 5.5, "F");
doc.rect(64, y, 68, 5.5, "F");
doc.rect(132, y, 64, 5.5, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(6);
doc.setTextColor(255, 255, 255);
doc.text("Report Name", 16, y + 4);
doc.text("Output Filename", 66, y + 4);
doc.text("Generated From", 134, y + 4);
y += 5.5;

doc.setFont("helvetica", "normal");
doc.setFontSize(5.5);
pdfReports.forEach((row, i) => {
  const bg = i % 2 === 0 ? [248, 250, 252] : [241, 245, 249];
  doc.setFillColor(...bg);
  doc.rect(14, y, 50, 5, "F");
  doc.rect(64, y, 68, 5, "F");
  doc.rect(132, y, 64, 5, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(row[0], 16, y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(row[1], 66, y + 3.5);
  doc.text(row[2], 134, y + 3.5);
  y += 5;
});

y += 5;

doc.setFont("helvetica", "bold");
doc.setFontSize(7);
doc.setTextColor(30, 58, 95);
doc.text("SPREADSHEET EXPORTS (3 Types)", 14, y + 4);
y += 7;

const csvReports = [
  ["QuickBooks CSV", "QuickBooks_Export_{supplier}.csv", "Invoice Generator — per client"],
  ["Payroll CSV", "IDS_Timesheets_Payroll_{date}.csv", "Timesheets tab — full payroll"],
  ["Styled Excel (.xlsx)", "IDS_Timesheets_Payroll_{date}.xlsx", "Timesheets tab — ExcelJS workbook"],
];

doc.setFillColor(30, 58, 95);
doc.rect(14, y, 50, 5.5, "F");
doc.rect(64, y, 68, 5.5, "F");
doc.rect(132, y, 64, 5.5, "F");
doc.setFont("helvetica", "bold");
doc.setFontSize(6);
doc.setTextColor(255, 255, 255);
doc.text("Export Name", 16, y + 4);
doc.text("Output Filename", 66, y + 4);
doc.text("Generated From", 134, y + 4);
y += 5.5;

doc.setFont("helvetica", "normal");
doc.setFontSize(5.5);
csvReports.forEach((row, i) => {
  const bg = i % 2 === 0 ? [248, 250, 252] : [241, 245, 249];
  doc.setFillColor(...bg);
  doc.rect(14, y, 50, 5, "F");
  doc.rect(64, y, 68, 5, "F");
  doc.rect(132, y, 64, 5, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(row[0], 16, y + 3.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(row[1], 66, y + 3.5);
  doc.text(row[2], 134, y + 3.5);
  y += 5;
});

y += 5;
doc.setFont("helvetica", "bold");
doc.setFontSize(7);
doc.setTextColor(30, 58, 95);
doc.text("BROWSER PRINT REPORTS (5 Types)", 14, y + 4);
y += 7;

doc.setFont("helvetica", "normal");
doc.setFontSize(6);
doc.setTextColor(71, 85, 105);
const prints = [
  "1. Incident Audit Print — styled HTML from Incidents tab",
  "2. Shift Walkthrough Print — styled HTML from Shift Logs tab",
  "3. Supplier Directory Print — styled HTML from Suppliers tab",
  "4. Timesheet Payroll Print — styled HTML from Timesheets tab",
  "5. Rework Feed Print / Individual Rework Print — styled HTML from Rework Logs tab",
];
prints.forEach(p => { doc.text(p, 16, y); y += 4; });

y += 3;
y = drawSectionTitle(y, "16. HIDDEN SYSTEM EVENTS LOGGER (SUPER ADMIN ONLY)");

drawBox(14, y, 88, 30, "Logged Event Categories", [
  "• auth: Login authentication events.",
  "• system: CRUD operations (create customer, location, rep,",
  "  save/delete rate overrides, quick-add actions).",
  "• shift: Clock in/out, shift report submit, publish to customer.",
  "• incident: New incident creation, status updates (open/close).",
  "• rework: Rework log submissions.",
  "• payroll: Overtime approval, expense approval, CSV/Excel/PDF exports."
]);
drawBox(108, y, 88, 30, "Security & Access", [
  "System Events Logs tab is HIDDEN from all users except Shahroz.",
  "Sidebar button wrapped in userRole === 'shahroz' guard.",
  "Tab content double-guarded: activeTab + userRole check.",
  "Each event log records: timestamp, acting user (from",
  "sessionStorage), category, action type, and detail string.",
  "Clear console button resets log to single 'cleared' entry.",
  "All events synced to Supabase systemLogs table."
]);

y += 35;
y = drawSectionTitle(y, "17. PROJECTS REGISTRY & QUICK ADD SYSTEM");

drawBox(14, y, 88, 22, "Projects Registry Tab", [
  "List of registered projects: rep, client, plant, rates, currency, status.",
  "Create new project form with billing rate, pay rate, currency per project.",
  "Projects used by rate resolver — project rates take priority over rate overrides."
]);
drawBox(108, y, 88, 22, "Quick Add Modals (Inline Popups)", [
  "Quick Add Rep: name, email, phone, currency → auto-selects in registry.",
  "Quick Add Client: name, invoice schedule → saves to suppliers collection.",
  "Quick Add Plant: name, address, linked supplier → saves to plants collection.",
  "Available from Projects Registry tab and Rates Config sub-tab."
]);

// ─── SAVE ───────────────────────────────────────────────────────────────────
const pdfPath = path.join(__dirname, 'IDS_Pulse_Complete_System_Flowchart.pdf');
fs.writeFileSync(pdfPath, Buffer.from(doc.output('arraybuffer')));
console.log(`Successfully generated COMPLETE flowchart PDF (${currentPage} pages) at: ${pdfPath}`);
