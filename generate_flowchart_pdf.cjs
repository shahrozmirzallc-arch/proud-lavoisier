const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const doc = new jsPDF();

// Helper to draw header (Logo replaced with clean text badge)
const drawHeader = (pageNumber) => {
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(20, 13, 26, 12, 1, 1, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text("IDS PULSE", 33, 21.2, { align: "center" });
  
  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 95);
  doc.text("IDS PULSE — OPERATIONAL FLOWCHART", 190, 21, { align: "right" });
  
  // Header line
  doc.setDrawColor(30, 58, 95);
  doc.setLineWidth(1.0);
  doc.line(20, 31, 190, 31);
  
  // Footer page number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Confidential — IDS Pulse Functional Workflow & Operational Flowchart — Page ${pageNumber}`, 20, 285);
};

// Helper to draw boxes with text (with automatic wrapping to prevent overflow)
const drawFlowBox = (x, y, w, h, title, lines) => {
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, w, h, 2, 2, "F");
  
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, w, h, 2, 2, "D");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(title, x + 3, y + 5);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.0);
  doc.setTextColor(71, 85, 105);
  let ly = y + 10;
  lines.forEach(line => {
    const wrapped = doc.splitTextToSize(line, w - 6);
    wrapped.forEach(wl => {
      doc.text(wl, x + 3, ly);
      ly += 3.4;
    });
  });
};

// Helper to draw arrows
const drawArrow = (x1, y1, x2, y2, label = "") => {
  doc.setDrawColor(14, 165, 233); // Bright Cyan
  doc.setLineWidth(0.75);
  doc.line(x1, y1, x2, y2);
  
  // Draw arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLength = 3;
  const arrowX1 = x2 - headLength * Math.cos(angle - Math.PI / 6);
  const arrowY1 = y2 - headLength * Math.sin(angle - Math.PI / 6);
  const arrowX2 = x2 - headLength * Math.cos(angle + Math.PI / 6);
  const arrowY2 = y2 - headLength * Math.sin(angle + Math.PI / 6);
  
  doc.line(x2, y2, arrowX1, arrowY1);
  doc.line(x2, y2, arrowX2, arrowY2);
  
  if (label) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.setTextColor(14, 165, 233);
    doc.text(label, (x1 + x2) / 2, (y1 + y2) / 2 - 2, { align: "center" });
  }
};

// ================= PAGE 1: MOBILE APP FLOW =================
drawHeader(1);

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.setTextColor(15, 23, 42);
doc.text("Field Quality Representative - Mobile App Flow", 20, 42);

doc.setFont("helvetica", "normal");
doc.setFontSize(9.5);
doc.setTextColor(71, 85, 105);
doc.text("This chart illustrates the step-by-step operational flow for representatives conducting field quality audits on site, from passcode authentication to clock-out submissions.", 20, 48, { maxWidth: 170 });

// Flow Diagram Layout
// Row 1
drawFlowBox(20, 65, 45, 22, "1. Passcode Gate", [
  "Reps enter numeric pin",
  "or user-identity alias",
  "to authenticate session."
]);

drawArrow(65, 76, 80, 76, "Success");

drawFlowBox(80, 65, 45, 22, "2. Handover Lock", [
  "Reps review past shifts,",
  "open defects, & alerts",
  "before work starts."
]);

drawArrow(125, 76, 140, 76, "Acknowledge");

drawFlowBox(140, 65, 45, 22, "3. Start Work Shift", [
  "Clocks in locally, logs",
  "start time, & triggers",
  "real-time system sync."
]);

// Arrow from Row 1 to Row 2
drawArrow(162, 87, 162, 105);

// Row 2: Main Operations Loop
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.5);
doc.roundedRect(18, 105, 174, 80, 3, 3, "D");
doc.setFont("helvetica", "bold");
doc.setFontSize(8.5);
doc.setTextColor(30, 58, 95);
doc.text("DAILY ACTIONS & SORTING LOOP (SHIFT LOGS)", 22, 111);

// Inside loop boxes
drawFlowBox(24, 118, 48, 25, "Action A: Suspect Material", [
  "1. Take photo & annotate",
  "2. Scan part/bin barcode",
  "3. Fill details (PRR/QR)",
  "4. Release & Send Email"
]);

drawFlowBox(80, 118, 48, 25, "Action B: Log Rework", [
  "Logs rework quantities",
  "for containment parts,",
  "associating rework time",
  "with specific supplier."
]);

drawFlowBox(136, 118, 48, 25, "Action C: Expenses", [
  "Logs fuel, tolls, meals,",
  "or hotel costs, uploads",
  "receipt image, & logs",
  "travel mileage."
]);

// Rework arrows showing looping back
drawArrow(48, 143, 48, 155);
drawArrow(104, 143, 104, 155);
drawArrow(160, 143, 160, 155);

drawFlowBox(24, 155, 160, 20, "Local Cache Manager (Browser LocalStorage)", [
  "Ensures zero floor latency. Every logged incident, rework quantity, or expense receipt",
  "is immediately cached locally and queued for background Supabase PostgreSQL upload."
]);

// Row 3: End Shift
drawArrow(104, 185, 104, 200, "Shift Completed");

drawFlowBox(80, 200, 48, 25, "4. End Shift Checklist", [
  "Reps walk sequence line,",
  "heavy repair, & scrap table,",
  "logging checks, & clocks out",
  "to submit Shift Report."
]);

drawArrow(128, 212, 145, 212, "Finalize");

drawFlowBox(145, 200, 40, 25, "5. Sent & Locked", [
  "Shift details lock.",
  "Report pushes to Lead",
  "dashboard in real-time."
]);


// ================= PAGE 2: CRM ADMIN & ACCOUNTING FLOW =================
doc.addPage();
drawHeader(2);

doc.setFont("helvetica", "bold");
doc.setFontSize(16);
doc.setTextColor(15, 23, 42);
doc.text("Web CRM Dashboard & Operations Flow", 20, 42);

doc.setFont("helvetica", "normal");
doc.setFontSize(9.5);
doc.setTextColor(71, 85, 105);
doc.text("This chart outlines the workflow of quality leads, administrators, and accountants managing the operation, verifying floor audits, processing payroll, and billing clients.", 20, 48, { maxWidth: 170 });

// Flow Diagram Layout
// Row 1: Manager Review & Audit
drawFlowBox(20, 65, 45, 25, "1. Real-Time Monitor", [
  "Dashboard receives real-",
  "time shift & incident logs,",
  "triggering audio bells and",
  "flashing toast notifications."
]);

drawArrow(65, 77, 80, 77, "Audit");

drawFlowBox(80, 65, 45, 25, "2. Incident Containment", [
  "Admin audits defect details.",
  "Can update status, request",
  "rework, or click 'Publish'",
  "to show Customer Portal."
]);

drawArrow(125, 77, 140, 77, "Approve");

drawFlowBox(140, 65, 45, 25, "3. Daily Tasks Planner", [
  "Leads assign inspection",
  "checklists & custom tasks",
  "to representatives for the",
  "upcoming shift."
]);

// Row 2: Invoicing and Payroll
drawArrow(162, 90, 162, 110);

drawFlowBox(140, 110, 45, 25, "4. Timesheets Control", [
  "Accountant (Colleen) audits",
  "rep hours, backdates logs,",
  "handles bulk hour entry,",
  "and approves travel mileage."
]);

drawArrow(140, 122, 125, 122, "Process");

drawFlowBox(80, 110, 45, 25, "5. Billing & Invoice Hub", [
  "Applies plant-specific",
  "billing rates, adds mileage,",
  "adds expenses, and exports",
  "invoices directly to PDF."
]);

drawArrow(80, 122, 65, 122, "Approve");

drawFlowBox(20, 110, 45, 25, "6. Payroll Processing", [
  "Generates payroll summary",
  "by rep (pay rates x hours),",
  "incorporates mileage, and",
  "exports QuickBooks CSV."
]);


// Customer Portal Flow Box
doc.setDrawColor(226, 232, 240);
doc.setLineWidth(0.5);
doc.roundedRect(18, 155, 174, 75, 3, 3, "D");
doc.setFont("helvetica", "bold");
doc.setFontSize(8.5);
doc.setTextColor(30, 58, 95);
doc.text("CUSTOMER PORTAL & TRANSPARENCY WORKFLOW", 22, 161);

drawFlowBox(24, 168, 48, 25, "A. Authenticated View", [
  "Customer logs in with company",
  "ID (e.g. autokabel). Dashboard",
  "filters strictly to their own",
  "plants and part incidents."
]);

drawArrow(72, 180, 85, 180, "Review");

drawFlowBox(85, 168, 50, 25, "B. Published Incidents Feed", [
  "Customer views verified scrap",
  "table defects, inspects annotated",
  "photos, and downloads incident",
  "PDF reports for accountability."
]);

drawArrow(135, 180, 148, 180, "Approve");

drawFlowBox(148, 168, 38, 25, "C. Extra Hours Hub", [
  "Approve/reject extra",
  "hours requests sent by",
  "reps for overtime work."
]);


// ================= PAGE 3: HYBRID CLOUD SYNC SEQUENCE =================
doc.addPage();
drawHeader(3);

doc.setFont("helvetica", "bold");
doc.setFontSize(13);
doc.setTextColor(30, 58, 95);
doc.text("Real-Time Synchronization Data Flow Architecture", 20, 42);

// Steps card
const drawStepCard = (y, stepNo, title, desc) => {
  doc.setFillColor(248, 250, 252);
  doc.rect(20, y, 170, 16, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(20, y, 170, 16, "D");
  
  // Step badge
  doc.setFillColor(30, 58, 95);
  doc.roundedRect(24, y + 3, 10, 10, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(String(stepNo), 29, y + 10, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 38, y + 7);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.0);
  doc.setTextColor(71, 85, 105);
  
  const wrappedDesc = doc.splitTextToSize(desc, 148);
  let ly = y + 12;
  wrappedDesc.forEach(line => {
    doc.text(line, 38, ly);
    ly += 3.8;
  });
};

let sy = 52;
drawStepCard(sy, 1, "Mobile Local Commit", "Rep logs suspect material. Local database commits it immediately to Browser LocalStorage (instant responsiveness).");
sy += 19;
drawStepCard(sy, 2, "Async Cloud Storage Upload", "Mobile app uploads annotated photo assets directly to secure cloud storage (AWS S3) to resolve image path URLs.");
sy += 19;
drawStepCard(sy, 3, "Database Persistence Write", "Mobile sync engine uploads JSON payload with photo URL. API server commits it to Supabase PostgreSQL.");
sy += 19;
drawStepCard(sy, 4, "WebSockets Event Trigger", "API server broadcasts 'ids_pulse_db_update' signal via WebSocket protocol to active manager dashboard sessions.");
sy += 19;
drawStepCard(sy, 5, "Reactive Dashboard Rerender", "Web dashboard receives sync broadcast, fetches latest updates, plays synthesizer bell chime, and displays notification toast.");

// Save PDF
const pdfPath = path.join(__dirname, 'IDS_Pulse_System_Flowchart_v3.pdf');
fs.writeFileSync(pdfPath, Buffer.from(doc.output('arraybuffer')));
console.log(`Successfully generated flowchart PDF at: ${pdfPath}`);
