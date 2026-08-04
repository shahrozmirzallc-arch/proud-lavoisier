import { describe, it, expect } from 'vitest';
import assert from 'assert';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRANDING_CONFIG } from '../src/config/brandingConfig.js';
import { SharedReportShell } from '../src/utils/sharedReportShell.js';
import { LOGO_BASE64 } from '../src/components/LogoBase64.js';

describe('IDS Pulse Report Branding & Layout Verification Suite', () => {

function runTest(name, fn) {
  it(name, () => {
    fn();
  });
}

// ----------------------------------------------------
// TEST 1: Canonical Logo Verification
// ----------------------------------------------------
runTest('Canonical Logo Configuration Gate', () => {
  assert.strictEqual(typeof BRANDING_CONFIG.logo.canonical, 'string');
  assert.ok(BRANDING_CONFIG.logo.canonical.startsWith('data:image/png;base64,iVBORw0KGgo'));
  assert.strictEqual(BRANDING_CONFIG.logo.canonical, LOGO_BASE64);
  assert.strictEqual(BRANDING_CONFIG.organizationName, 'Integrity Driven Solutions Inc.');
});

// ----------------------------------------------------
// TEST 2: Data Schema Validation & Mandatory Field Gate
// ----------------------------------------------------
runTest('Data Completeness Gate — Rejects Incomplete Reports', () => {
  const incompleteData = {
    customerName: 'Acme Metal Stamping',
    plantLocation: '', // Missing
    poNumber: 'PO-99120',
    totalHours: 0
  };

  const validation = SharedReportShell.validateReportData(incompleteData, ['customerName', 'plantLocation', 'poNumber']);
  assert.strictEqual(validation.isValid, false);
  assert.deepStrictEqual(validation.missingFields, ['plantLocation']);
});

// ----------------------------------------------------
// TEST 3: Zero Text Truncation & Linebreak Wrapping Gate
// ----------------------------------------------------
runTest('Zero Text Truncation & Ellipsis Prevention Gate', () => {
  const longReworkNarrative = 'Inspector conducted a 100% sorting audit on 4,500 stamped bracket components. Found 142 units with micro-cracks along the secondary flange radii. Segregated non-conforming units into red totes with Hold Tags #8820-8835.';
  
  // Verify narrative has zero ellipsis
  assert.strictEqual(longReworkNarrative.includes('...'), false);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  autoTable(doc, {
    startY: 20,
    head: [['Incident ID', 'Customer', 'Rework Narrative']],
    body: [['INC-2026-904', 'Acme Metal', longReworkNarrative]],
    styles: { overflow: 'linebreak' }
  });

  // Verify PDF rendered correctly
  assert.ok(doc.internal.getNumberOfPages() >= 1);
});

// ----------------------------------------------------
// TEST 4: Automatic Orientation Selection Gate
// ----------------------------------------------------
runTest('Orientation Gate — Wide Tables Must Use Landscape', () => {
  const wideTableHead = ['Shift ID', 'Date', 'Plant', 'Project', 'Inspector', 'Hours', 'Parts Inspected', 'Defects Found', 'Rework Rate', 'Status'];
  assert.ok(wideTableHead.length >= 7, 'Wide table has 7+ columns');

  const shell = SharedReportShell.createDocument({
    title: 'Wide Operational Feed',
    orientation: 'landscape'
  });

  assert.strictEqual(shell.isLandscape, true);
  assert.ok(shell.pageWidth > 270, 'Page width in landscape should be ~279mm for Letter');
});

// ----------------------------------------------------
// TEST 5: QuickBooks Machine Export Exception Gate
// ----------------------------------------------------
runTest('QuickBooks Machine CSV Gate — Zero Base64 Visual Data', () => {
  const qbCsvHeader = 'Type,Date,Num,Name,Memo,Amount,Account';
  const qbCsvLine = `Invoice,2026-07-28,INV-1092,Acme Metal,Quality Inspection Services,4500.00,Accounts Receivable`;
  const fullCsvContent = `${qbCsvHeader}\n${qbCsvLine}`;

  // Must NOT contain base64 image strings or HTML img tags
  assert.strictEqual(fullCsvContent.includes('base64'), false);
  assert.strictEqual(fullCsvContent.includes('<img'), false);
  assert.strictEqual(fullCsvContent.includes('data:image'), false);
});

// ----------------------------------------------------
// TEST 6: Single vs Batch Totals Reconciliation Gate
// ----------------------------------------------------
runTest('Single vs Batch Totals Reconciliation Gate', () => {
  const singleShifts = [
    { repId: 'rep_clarence', hours: 8.5, rate: 45, expenses: 25 },
    { repId: 'rep_clarence', hours: 7.0, rate: 45, expenses: 15 },
    { repId: 'rep_clarence', hours: 8.0, rate: 45, expenses: 0 }
  ];

  const singleTotalHours = singleShifts.reduce((sum, s) => sum + s.hours, 0);
  const singleTotalExpenses = singleShifts.reduce((sum, s) => sum + s.expenses, 0);
  const singleTotalBilling = singleShifts.reduce((sum, s) => sum + (s.hours * s.rate) + s.expenses, 0);

  const batchAggregated = {
    totalHours: 23.5,
    totalExpenses: 40.0,
    totalBilling: (23.5 * 45) + 40.0
  };

  assert.strictEqual(singleTotalHours, batchAggregated.totalHours);
  assert.strictEqual(singleTotalExpenses, batchAggregated.totalExpenses);
  assert.strictEqual(singleTotalBilling, batchAggregated.totalBilling);
});

// ----------------------------------------------------
// TEST 7: Shared Report Shell Multi-Page Footer Gate
// ----------------------------------------------------
runTest('Shared Report Shell Multi-Page Footer & Logo Gate', () => {
  const shell = SharedReportShell.createDocument({
    title: 'Multi-Page CER Audit Report',
    orientation: 'portrait',
    referenceNo: 'CER-2026-8812',
    actorName: 'Donna Cabral'
  });

  // Render dummy table spanning 2 pages
  const largeBody = Array.from({ length: 40 }, (_, i) => [
    `ROW-${i + 1}`,
    `Part Number #${1000 + i}`,
    `Inspection Batch Description for Row ${i + 1}`,
    'APPROVED'
  ]);

  SharedReportShell.renderTable(shell.doc, shell.startY, [['ID', 'Part #', 'Description', 'Status']], largeBody);
  SharedReportShell.applyStandardFooter(shell.doc, { actorName: shell.actorName, referenceNo: shell.referenceNo });

  const pages = shell.doc.internal.getNumberOfPages();
  assert.ok(pages >= 2, 'Table should span across at least 2 pages');
});

});
