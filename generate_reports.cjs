const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');
const ExcelJS = require('exceljs');

const logoPath = path.join(__dirname, 'public', 'logo.png');
let logoBase64 = '';
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  const base64Data = logoBuffer.toString('base64');
  logoBase64 = `data:image/png;base64,${base64Data}`;
}

const artifactsDir = 'C:\\Users\\Sharoz\\Documents\\antigravity\\proud-lavoisier\\demo_reports';
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

const users = [
  { id: '1', name: 'Clarence Kuiken', role: 'rep' },
  { id: '2', name: 'Donna Cabral', role: 'lead' }
];

const inc_1 = {
  id: 'inc_1',
  rep_id: '1',
  plant_id: 'gm_oshawa',
  supplier_id: 'magna',
  part_id: '86286761',
  area: 'Scrap table at Sequence Area',
  description: 'Light on scrap table at sequence area for rattle. Spare bulb in housing again. Removed bulb and returned light to sequence area. Bulb was removed before scrap tag was written up. Please ensure all base lights do not have spare bulbs in housing causing rattling sound.',
  action_taken: 'Removed bulb, returned light to sequence area',
  supplier_contact: 'Martin',
  status: 'Closed',
  created_at: '2026-05-28T08:30:00Z',
  rma_required: 'N',
  defect_location_x: 0.30,
  defect_location_y: 0.50,
  parts_list: [
    { part_number: '86286761', description: 'Tail Light Assembly', bin: 'BIN-MAG-6761', qty: 1 }
  ]
};

const inc_3 = {
  id: 'inc_3',
  rep_id: '1',
  plant_id: 'gm_oshawa',
  supplier_id: 'magna',
  part_id: '86286761',
  area: 'Online assembly',
  description: 'Gasket seal misaligned, creating outer gap on right edge. CRITICAL SAFETY ISSUE: Possible water leakage into tail light casing causing circuit short and immediate signal failure. High risk of field recall. Requires immediate supplier sort and RMA containment.',
  action_taken: 'Realigned gasket, initiated Sort / RMA action',
  supplier_contact: 'Martin',
  status: 'Red Alert',
  created_at: '2026-05-28T14:40:00Z',
  rma_required: 'Yes',
  defect_location_x: 0.50,
  defect_location_y: 0.74,
  parts_list: [
    { part_number: '86286761', description: 'Tail Light Assembly', bin: 'BIN-MAG-6761', qty: 1 }
  ]
};

const timeEntries = [
  { rep_id: '1', date: '2026-06-03', plant_id: 'gm_oshawa', hours: 9, mileage_km: 45 }
];

// Confidentiality Logic
const getConfidentiality = (data, type = "incident") => {
  if (type === "payroll") {
    return {
      level: "STRICTLY CONFIDENTIAL",
      sub: "INTERNAL PAYROLL & FINANCIAL RECORD",
      color: "#ef4444",
      colorRGB: [239, 68, 68],
      bgHex: "#fef2f2",
      bgRGB: [254, 242, 242],
      reason: "Contains representative hours and billing rates"
    };
  }

  const desc = (data?.description || "").toLowerCase();
  const action = (data?.action_taken || "").toLowerCase();
  const status = data?.status || "";
  const isCritical = status === "Red Alert" || data?.rma_required === "Y" || data?.rma_required === "Yes";
  
  const hasCriticalKeywords = 
    desc.includes("fail") || desc.includes("safety") || desc.includes("recall") || 
    desc.includes("critical") || desc.includes("scrap") || desc.includes("non-conforming") || 
    desc.includes("leak") || desc.includes("short") || desc.includes("crack") ||
    action.includes("scrap") || action.includes("return") || action.includes("rma");

  if (isCritical || hasCriticalKeywords) {
    return {
      level: "STRICTLY CONFIDENTIAL",
      sub: "CRITICAL QUALITY AUDIT ESCALATION",
      color: "#ef4444",
      colorRGB: [239, 68, 68],
      bgHex: "#fef2f2",
      bgRGB: [254, 242, 242],
      reason: isCritical ? "Critical alert status / RMA required" : "Sensitive defect narrative detected"
    };
  }

  return {
    level: "CONFIDENTIAL",
    sub: "QUALITY ASSURANCE PROPERTY OF IDS",
    color: "#f59e0b",
    colorRGB: [245, 158, 11],
    bgHex: "#fffbeb",
    bgRGB: [255, 251, 235],
    reason: "Standard supplier quality audit"
  };
};

// 1. Generate PDF Reports
const generatePdf = (inc, filename) => {
  const conf = getConfidentiality(inc, "incident");
  const doc = new jsPDF();
  
  // Draw Dark Blue background container for the logo image to make the white text pop
  if (logoBase64) {
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(20, 13, 50, 13, 2, 2, "F");
    doc.addImage(logoBase64, 'PNG', 22, 14, 46, 11);
  }
  
  // Confidentiality Badge in top right corner
  doc.setDrawColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
  doc.setFillColor(conf.bgRGB[0], conf.bgRGB[1], conf.bgRGB[2]);
  doc.rect(130, 14, 60, 11, "FD");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
  doc.text(conf.level, 160, 19.5, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.5);
  doc.text(conf.sub, 160, 23, { align: "center" });

  // Background Watermark
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(248, 250, 252);
  doc.text(`IDS ${conf.level}`, 25, 140, { angle: 45 });

  // Header Separator line
  doc.setDrawColor(30, 58, 95); 
  doc.setLineWidth(1.2);
  doc.line(20, 33, 190, 33);
  
  const firstPN = inc.parts_list?.[0]?.part_number || inc.part_id;
  const partSubject = inc.parts_list && inc.parts_list.length > 1
    ? `${firstPN} (+${inc.parts_list.length - 1} others)`
    : firstPN;

  const fields = [
    { label: "Incident ID:", val: inc.id },
    { label: "Logged By (Rep):", val: users.find(u => u.id === inc.rep_id)?.name || 'Clarence Kuiken' },
    { label: "Report Date:", val: new Date(inc.created_at).toLocaleDateString() },
    { label: "Affected Part Number:", val: partSubject },
    { label: "Area Discovered:", val: inc.area },
    { label: "Defect Coordinates:", val: inc.defect_location_x !== undefined && inc.defect_location_x !== null ? `X: ${inc.defect_location_x} | Y: ${inc.defect_location_y}` : 'N/A' },
    { label: "Immediate Action:", val: inc.action_taken },
    { label: "Supplier QM Contact:", val: inc.supplier_contact },
    { label: "Review Status Level:", val: inc.status },
    { label: "Classification Reasoning:", val: conf.reason }
  ];
  
  // Metadata Box background
  doc.setFillColor(248, 250, 252);
  doc.rect(20, 39, 170, 100, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(20, 39, 170, 100, "D");

  let y = 46;
  fields.forEach((f) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(f.label, 25, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    if (f.label === "Classification Reasoning:") {
      doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
      doc.setFont("helvetica", "bold");
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(String(f.val), 72, y);
    
    y += 9.5;
  });
  
  if (inc.parts_list && inc.parts_list.length > 0) {
    y = 148;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 95);
    doc.text("Affected Parts Checklist:", 20, y);
    y += 8;
    
    doc.setFontSize(9.5);
    inc.parts_list.forEach((p) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`PN ${p.part_number}`, 25, y);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`- ${p.description} (Qty: ${p.qty}, Bin: ${p.bin})`, 60, y);
      y += 8;
    });
  } else {
    y = 148;
  }
  
  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(30, 58, 95);
  doc.text("Defect Narrative details:", 20, y);
  
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  
  const splitText = doc.splitTextToSize(inc.description, 170);
  doc.text(splitText, 20, y);
  
  // Page Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, 274, 190, 274);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Generated by IDS Pulse Auditor | Date: 2026-06-03", 20, 281);
  doc.text("Page 1 of 1", 172, 281);
  doc.text(`CLASSIFICATION: ${conf.level} / ${conf.sub}`, 62, 281);
  
  const buffer = doc.output('arraybuffer');
  fs.writeFileSync(path.join(artifactsDir, filename), Buffer.from(buffer));
  console.log(`Saved PDF: ${filename}`);
};

// 2. Generate CSV Timesheets
const generateCsv = (filename) => {
  const conf = getConfidentiality(timeEntries, "payroll");
  const csvLines = [
    `[IDS PULSE BRAND LOGO: INTEGRITY DRIVEN SOLUTIONS INC.]`,
    `INTEGRITY DRIVEN SOLUTIONS INC. (IDS)`,
    `Quality on the floor.`,
    `====================================================================================================`,
    `REPORT TITLE:,QuickBooks Timesheets & Payroll Summary Export`,
    `GENERATION TIMESTAMP:,2026-06-03 17:46:30`,
    `CLASSIFICATION LEVEL:,${conf.level} (${conf.sub})`,
    `DETERMINED REASON:,${conf.reason}`,
    `====================================================================================================`,
    ``, // blank separator row
    `Employee/Rep Name,Date,Plant,Hours,Mileage (KM),Mileage Cost ($0.73),Total Billing`
  ];
  
  const rows = timeEntries.map(entry => {
    const rep = users.find(u => u.id === entry.rep_id);
    const repName = rep ? rep.name : 'Unknown Rep';
    const plant = entry.plant_id === 'gm_oshawa' ? 'GM Oshawa Plant' : 'Hutchinson Plant';
    const mileageCost = entry.mileage_km * 0.73;
    const totalBilling = entry.hours * 28.00 + mileageCost;
    return [
      `"${repName.replace(/"/g, '""')}"`,
      `"${entry.date}"`,
      `"${plant.replace(/"/g, '""')}"`,
      entry.hours,
      entry.mileage_km,
      mileageCost.toFixed(2),
      totalBilling.toFixed(2)
    ].join(",");
  });
  csvLines.push(...rows);
  
  const totalHours = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);
  const totalMileage = timeEntries.reduce((acc, curr) => acc + curr.mileage_km, 0);
  const totalMileageCost = totalMileage * 0.73;
  const totalInvoicedEst = totalHours * 28.00 + totalMileageCost;

  csvLines.push(``); // blank separator
  csvLines.push(`====================================================================================================`);
  csvLines.push(`REPORT SUMMARY & STATISTICS`);
  csvLines.push(`Total Payroll Records:,${timeEntries.length}`);
  csvLines.push(`Total Billing Hours Worked:,${totalHours.toFixed(2)} hrs`);
  csvLines.push(`Total Mileage Claimed:,${totalMileage.toFixed(2)} km`);
  csvLines.push(`Total Mileage Reimbursement:,${totalMileageCost.toFixed(2)} USD`);
  csvLines.push(`Total Invoiced Billing Cost:,${totalInvoicedEst.toFixed(2)} USD`);
  csvLines.push(`====================================================================================================`);
  csvLines.push(`FOOTER & SECURITY NOTICE`);
  csvLines.push(`Classification Confirmation:,${conf.level} - PROPERTY OF INTEGRITY DRIVEN SOLUTIONS INC.`);
  csvLines.push(`Security Policy Details:,Restricted to internal payroll processing. Unauthorized sharing is strictly prohibited.`);
  csvLines.push(`(C) 2026 Integrity Driven Solutions Inc. All rights reserved.`);
  
  fs.writeFileSync(path.join(artifactsDir, filename), csvLines.join("\n"));
  console.log(`Saved CSV: ${filename}`);
};

// 2.5. Generate Excel Timesheets (Styled)
const generateExcel = (filename) => {
  const conf = getConfidentiality(timeEntries, "payroll");
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payroll & Mileage');

  // Configure columns
  worksheet.columns = [
    { key: 'A', width: 25 }, // Employee Name
    { key: 'B', width: 16 }, // Date
    { key: 'C', width: 22 }, // Plant
    { key: 'D', width: 12 }, // Hours
    { key: 'E', width: 18 }, // Mileage (KM)
    { key: 'F', width: 20 }, // Mileage Cost
    { key: 'G', width: 20 }  // Total Billing
  ];

  const primaryBlue = '1E3A5F';
  const textSlate = '475569';
  const redAlertBg = 'FEF2F2';
  const redAlertBorder = 'EF4444';

  // 1. Company Brand Header
  worksheet.mergeCells('A1:G1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'INTEGRITY DRIVEN SOLUTIONS INC. (IDS)';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 35;

  worksheet.mergeCells('A2:G2');
  const subtitleCell = worksheet.getCell('A2');
  subtitleCell.value = 'Quality on the floor. | IDS Pulse Payroll Portal';
  subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFF' } };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C5282' } };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;

  // 2. Report Metadata
  worksheet.getCell('A4').value = 'Report Title:';
  worksheet.getCell('A4').font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell('B4').value = 'QuickBooks Timesheets & Payroll Summary Export';
  worksheet.getCell('B4').font = { bold: true };

  worksheet.getCell('A5').value = 'Generated Time:';
  worksheet.getCell('A5').font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell('B5').value = '2026-06-03 17:46:30';

  worksheet.getCell('A6').value = 'Classification:';
  worksheet.getCell('A6').font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell('B6').value = 'STRICTLY CONFIDENTIAL - INTERNAL PAYROLL & FINANCIAL';
  worksheet.getCell('B6').font = { bold: true, color: { argb: 'B91C1C' } };

  // Style a mini red box for classification notice
  for (let col = 1; col <= 7; col++) {
    const cell = worksheet.getCell(7, col);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: redAlertBg } };
    cell.border = {
      top: { style: 'thin', color: { argb: redAlertBorder } },
      bottom: { style: 'thin', color: { argb: redAlertBorder } }
    };
  }
  worksheet.getCell('A7').value = 'Security Alert:';
  worksheet.getCell('A7').font = { bold: true, color: { argb: 'B91C1C' } };
  worksheet.mergeCells('B7:G7');
  worksheet.getCell('B7').value = 'RESTRICTED INTERNAL PAYROLL RECORD - DO NOT SHARE OUTSIDE IDS';
  worksheet.getCell('B7').font = { size: 9, bold: true, color: { argb: 'B91C1C' } };
  worksheet.getRow(7).height = 22;

  // 3. Main Data Table Headers
  const headers = [
    'Employee/Rep Name',
    'Date',
    'Plant',
    'Hours Worked',
    'Mileage (KM)',
    'Mileage Cost ($0.73)',
    'Total Billing'
  ];

  const headerRow = worksheet.getRow(10);
  headerRow.values = headers;
  headerRow.height = 26;

  for (let col = 1; col <= 7; col++) {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
    cell.alignment = { vertical: 'middle', horizontal: col <= 3 ? 'left' : (col <= 5 ? 'center' : 'right') };
    cell.border = {
      top: { style: 'medium', color: { argb: '0F172A' } },
      bottom: { style: 'medium', color: { argb: '0F172A' } }
    };
  }

  // 4. Data Rows
  timeEntries.forEach((entry, idx) => {
    const rIdx = 11 + idx;
    const row = worksheet.getRow(rIdx);
    const rep = users.find(u => u.id === entry.rep_id);
    const repName = rep ? rep.name : 'Unknown Rep';
    const plantName = entry.plant_id === 'gm_oshawa' ? 'GM Oshawa Plant' : 'Hutchinson Plant';
    const mileageCost = entry.mileage_km * 0.73;
    const totalBilling = entry.hours * 28.00 + mileageCost;

    row.values = [
      repName,
      entry.date,
      plantName,
      entry.hours,
      entry.mileage_km,
      mileageCost,
      totalBilling
    ];
    row.height = 22;

    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(4).numFmt = '#,##0.00';
    row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(5).numFmt = '#,##0';
    row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell(6).numFmt = '$#,##0.00';
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
    row.getCell(7).numFmt = '$#,##0.00';

    for (let col = 1; col <= 7; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Arial', size: 10 };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'CBD5E1' } }
      };
    }
  });

  // 5. Total Row
  const totalHours = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);
  const totalMileage = timeEntries.reduce((acc, curr) => acc + curr.mileage_km, 0);
  const totalMileageCost = totalMileage * 0.73;
  const totalInvoicedEst = totalHours * 28.00 + totalMileageCost;

  const totalRowIdx = 11 + timeEntries.length;
  const totalRow = worksheet.getRow(totalRowIdx);
  totalRow.values = [
    `Total (${timeEntries.length} Rep${timeEntries.length > 1 ? 's' : ''})`,
    '',
    '',
    totalHours,
    totalMileage,
    totalMileageCost,
    totalInvoicedEst
  ];
  totalRow.height = 24;

  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
  totalRow.getCell(4).font = { bold: true };
  totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
  totalRow.getCell(4).numFmt = '#,##0.00';
  totalRow.getCell(5).font = { bold: true };
  totalRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
  totalRow.getCell(5).numFmt = '#,##0';
  totalRow.getCell(6).font = { bold: true };
  totalRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
  totalRow.getCell(6).numFmt = '$#,##0.00';
  totalRow.getCell(7).font = { bold: true, color: { argb: '047857' } };
  totalRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
  totalRow.getCell(7).numFmt = '$#,##0.00';

  for (let col = 1; col <= 7; col++) {
    const cell = totalRow.getCell(col);
    cell.border = {
      top: { style: 'thin', color: { argb: '475569' } },
      bottom: { style: 'double', color: { argb: '475569' } }
    };
  }

  // 6. Report Summary & Statistics
  const statsStartIdx = totalRowIdx + 3;
  worksheet.getCell(`A${statsStartIdx}`).value = 'REPORT SUMMARY & STATISTICS';
  worksheet.getCell(`A${statsStartIdx}`).font = { size: 11, bold: true, color: { argb: primaryBlue } };

  worksheet.getCell(`A${statsStartIdx+1}`).value = 'Total Payroll Records:';
  worksheet.getCell(`A${statsStartIdx+1}`).font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell(`B${statsStartIdx+1}`).value = timeEntries.length;
  worksheet.getCell(`B${statsStartIdx+1}`).alignment = { horizontal: 'left' };

  worksheet.getCell(`A${statsStartIdx+2}`).value = 'Total Hours Worked:';
  worksheet.getCell(`A${statsStartIdx+2}`).font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell(`B${statsStartIdx+2}`).value = `${totalHours.toFixed(2)} hrs`;

  worksheet.getCell(`A${statsStartIdx+3}`).value = 'Total Mileage Claimed:';
  worksheet.getCell(`A${statsStartIdx+3}`).font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell(`B${statsStartIdx+3}`).value = `${totalMileage.toFixed(2)} km`;

  worksheet.getCell(`A${statsStartIdx+4}`).value = 'Total Mileage Reimbursement:';
  worksheet.getCell(`A${statsStartIdx+4}`).font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell(`B${statsStartIdx+4}`).value = totalMileageCost;
  worksheet.getCell(`B${statsStartIdx+4}`).numFmt = '$#,##0.00';
  worksheet.getCell(`B${statsStartIdx+4}`).alignment = { horizontal: 'left' };

  worksheet.getCell(`A${statsStartIdx+5}`).value = 'Total Invoiced Cost:';
  worksheet.getCell(`A${statsStartIdx+5}`).font = { bold: true, color: { argb: textSlate } };
  worksheet.getCell(`B${statsStartIdx+5}`).value = totalInvoicedEst;
  worksheet.getCell(`B${statsStartIdx+5}`).numFmt = '$#,##0.00';
  worksheet.getCell(`B${statsStartIdx+5}`).font = { bold: true, color: { argb: '047857' } };
  worksheet.getCell(`B${statsStartIdx+5}`).alignment = { horizontal: 'left' };

  // 7. Security Notice Footer
  const footerStartIdx = statsStartIdx + 8;
  worksheet.getCell(`A${footerStartIdx}`).value = 'FOOTER & SECURITY NOTICE';
  worksheet.getCell(`A${footerStartIdx}`).font = { size: 9, bold: true, color: { argb: textSlate } };

  worksheet.mergeCells(`A${footerStartIdx+1}:G${footerStartIdx+1}`);
  worksheet.getCell(`A${footerStartIdx+1}`).value = 'Restricted to internal payroll processing. Unauthorized sharing is strictly prohibited.';
  worksheet.getCell(`A${footerStartIdx+1}`).font = { size: 8.5, italic: true, color: { argb: '64748B' } };

  worksheet.mergeCells(`A${footerStartIdx+2}:G${footerStartIdx+2}`);
  worksheet.getCell(`A${footerStartIdx+2}`).value = '(C) 2026 Integrity Driven Solutions Inc. All rights reserved. | Powered by IDS Pulse';
  worksheet.getCell('A' + (footerStartIdx+2)).font = { size: 8, color: { argb: '94A3B8' } };

  // Write file
  const fullPath = path.join(artifactsDir, filename);
  workbook.xlsx.writeFile(fullPath).then(() => {
    console.log(`Saved Excel Workbook: ${filename}`);
  }).catch((err) => {
    console.error('Error writing Excel Workbook:', err);
  });
};

// 3. Generate HTML Print Views
const generateHtmlPrint = (inc, filename) => {
  const conf = getConfidentiality(inc, "incident");
  let partsSectionHtml = '';
  if (inc.parts_list && inc.parts_list.length > 0) {
    partsSectionHtml = `
      <div class="desc" style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
        <h3>Defective Parts List</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Part Number</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Description</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0;">Bin</th>
              <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${inc.parts_list.map(p => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${p.part_number}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.description}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; color: #10B981; font-weight: 500;">${p.bin}</td>
                <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${p.qty}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  const firstPN = inc.parts_list?.[0]?.part_number || inc.part_id;
  const partSubject = inc.parts_list && inc.parts_list.length > 1
    ? `${firstPN} (+${inc.parts_list.length - 1} others)`
    : firstPN;

  const html = `
    <html>
      <head>
        <title>IDS Pulse Report - PN ${partSubject}</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; position: relative; }
          .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; z-index: 1; }
          .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A5F; padding-bottom: 15px; margin-bottom: 24px; }
          .logo-section { display: flex; align-items: center; gap: 12px; }
          .shield-icon { width: 34px; height: 34px; background: #1E3A5F; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; }
          .pulse-wave { width: 18px; height: 18px; border-bottom: 2.5px solid #22D3EE; border-top: 2.5px solid #22D3EE; transform: rotate(15deg); }
          .company-details { display: flex; flex-direction: column; }
          .company-title { color: #1E3A5F; font-size: 18px; font-weight: 800; margin: 0; line-height: 1.1; letter-spacing: -0.02em; }
          .company-subtitle { font-size: 8px; color: #64748b; margin-top: 2px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
          .confidentiality-tag { border: 1.5px solid ${conf.color}; background: ${conf.bgHex}; color: ${conf.color}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
          .confidentiality-sub { font-size: 7px; display: block; margin-top: 2px; font-weight: bold; color: ${conf.color}; opacity: 0.8; text-transform: uppercase; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 64px; font-weight: 900; color: rgba(226, 232, 240, 0.25); pointer-events: none; z-index: 0; white-space: nowrap; text-transform: uppercase; font-family: sans-serif; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
          .field { background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid #f1f5f9; }
          .label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
          .val { font-size: 13px; font-weight: 600; color: #0f172a; }
          .desc { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
          .desc h3 { color: #1E3A5F; font-size: 15px; margin-top: 0; margin-bottom: 8px; font-weight: 700; }
          .desc p { font-size: 13px; color: #334155; margin: 0; white-space: pre-wrap; }
          .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 40px; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="watermark">IDS ${conf.level}</div>
        <div class="card">
          <div class="header-container">
            <div class="logo-section" style="display: flex; align-items: center; background: #1e3a5f; padding: 6px 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <img src="${logoBase64}" style="height: 28px; width: auto; object-fit: contain;" />
            </div>
            <div class="confidentiality-tag">
              ${conf.level}
              <span class="confidentiality-sub">${conf.sub}</span>
            </div>
          </div>

          <div class="grid">
            <div class="field"><span class="label">Incident ID</span><span class="val">${inc.id}</span></div>
            <div class="field"><span class="label">Logged By (Rep)</span><span class="val">${users.find(u => u.id === inc.rep_id)?.name || 'Clarence Kuiken'}</span></div>
            <div class="field"><span class="label">Report Date</span><span class="val">${new Date(inc.created_at).toLocaleString()}</span></div>
            <div class="field"><span class="label">Affected Part Number</span><span class="val">${partSubject}</span></div>
            <div class="field"><span class="label">Area Discovered</span><span class="val">${inc.area}</span></div>
            <div class="field"><span class="label">Defect Coordinates</span><span class="val">${inc.defect_location_x !== undefined && inc.defect_location_x !== null ? `X: ${inc.defect_location_x} | Y: ${inc.defect_location_y}` : 'N/A'}</span></div>
            <div class="field"><span class="label">Action Taken</span><span class="val">${inc.action_taken}</span></div>
            <div class="field"><span class="label">Supplier QM Contact</span><span class="val">${inc.supplier_contact}</span></div>
            <div class="field"><span class="label">RMA Required</span><span class="val">${inc.rma_required || 'N'}</span></div>
            <div class="field"><span class="label">Current Status</span><span class="val">${inc.status}</span></div>
            <div class="field" style="grid-column: span 2;"><span class="label">Classification Rationale</span><span class="val" style="font-weight: 500; font-size: 11px; color: ${conf.color};">${conf.reason}</span></div>
          </div>
          
          ${partsSectionHtml}
          
          <div class="desc">
            <h3>Defect Narrative Details</h3>
            <p>${inc.description}</p>
          </div>

          <div class="footer">
            <span>System: IDS Pulse Audit Portal</span>
            <span>CLASSIFICATION: ${conf.level} / ${conf.sub}</span>
            <span>&copy; 2026 Integrity Driven Solutions Inc.</span>
          </div>
        </div>
      </body>
    </html>
  `;
  fs.writeFileSync(path.join(artifactsDir, filename), html);
  console.log(`Saved Print HTML: ${filename}`);
};

// Generate All
generatePdf(inc_1, 'IDS_Pulse_Audit_86286761_inc_1.pdf');
generatePdf(inc_3, 'IDS_Pulse_Audit_86286761_inc_3.pdf');
generateCsv('IDS_Timesheets_Payroll_2026-06-03.csv');
generateExcel('IDS_Timesheets_Payroll_2026-06-03.xlsx');
generateHtmlPrint(inc_1, 'IDS_Print_Report_inc_1.html');
generateHtmlPrint(inc_3, 'IDS_Print_Report_inc_3.html');

console.log('All reports generated successfully in artifacts folder!');
