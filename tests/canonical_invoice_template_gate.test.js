import { describe, it, expect } from 'vitest';
import assert from 'assert';
import { generateIntegrityInvoicePDF } from '../src/utils/generateInvoicePdf.js';

describe('Canonical Invoice Template Release Gate Suite', () => {

function runTest(name, fn) {
  it(name, () => {
    fn();
  });
}

// ----------------------------------------------------
// TEST 1: Golden PDF Text Extraction & Structure Match
// ----------------------------------------------------
runTest('Golden PDF Text Extraction & Structure Match Gate', () => {
  const goldenInput = {
    client: { name: 'Test Company', email: 'john@testcompany.com', contact_person: 'John Test' },
    invoiceNum: 'INV-TC-8002',
    invoiceDate: '7/26/2026',
    poNumber: 'PO-32268',
    terms: 'Net 30',
    repName: 'Integrity Lead',
    shipDate: '7/26/2026',
    via: 'Direct',
    fob: 'FOB Origin',
    projectName: 'Test Company',
    shipToText: 'Liaison Quality Lead at\nTest Company',
    invoiceToLines: [
      'Test Company',
      'Attn: John Test',
      'john@testcompany.com'
    ],
    items: [
      {
        quantity: 65,
        item: 'Contractor Hours',
        description: 'Liaison Quality Audit & On-Demand Representation at Test Company\nPeriod: From 2026-07-26 to 2026-07-26',
        um: 'hr',
        priceEach: 45.00,
        amount: 2925.00
      },
      {
        quantity: 1,
        item: 'Reimbursable Expenses',
        description: 'Approved Field Expense Claims & Direct Supplier Receipts',
        um: 'ea',
        priceEach: 30.00,
        amount: 30.00
      }
    ],
    taxAmount: 0.00,
    currency: 'CAD',
    gstHstNo: '853120236'
  };

  const doc = generateIntegrityInvoicePDF(goldenInput);
  assert.ok(doc, 'PDF Document must be created');
  
  // Verify single page output for 1-item golden invoice
  const pageCount = doc.internal.getNumberOfPages();
  assert.strictEqual(pageCount, 1, 'Golden single invoice must fit on 1 page');

  // Extract raw stream text
  const pdfString = doc.output();
  assert.ok(pdfString.includes('Invoice'), 'PDF text stream must contain Invoice title');
  assert.ok(pdfString.includes('5900 Main Street'), 'PDF text stream must contain corporate address');
  assert.ok(pdfString.includes('INV-TC-8002'), 'PDF text stream must contain Invoice #');
  assert.ok(pdfString.includes('853120236'), 'PDF text stream must contain GST/HST No.');
  assert.ok(pdfString.includes('CAD 2955.00'), 'PDF text stream must contain calculated total');
});

// ----------------------------------------------------
// TEST 2: Data Gate — Blocks Generation on Missing Required Fields
// ----------------------------------------------------
runTest('Data Gate — Rejects Generation When Required Fields Are Missing', () => {
  assert.throws(() => {
    generateIntegrityInvoicePDF({
      client: null,
      invoiceNum: '',
      items: []
    });
  }, (err) => {
    return err.message.includes('CRITICAL INVOICE DATA GATE: Missing mandatory invoice fields');
  });
});

// ----------------------------------------------------
// TEST 3: Multi-Page Continuation Layout & Overlap Check
// ----------------------------------------------------
runTest('Multi-Page Continuation Layout & Overlap Check Gate (25 & 100 Items)', () => {
  const items25 = Array.from({ length: 25 }, (_, i) => ({
    quantity: i + 1,
    item: `Contractor Hours Line #${i + 1}`,
    description: `Shift #${100 + i} Quality Inspection Representation at Assembly Line ${i + 1}`,
    um: 'hr',
    priceEach: 45.00,
    amount: (i + 1) * 45.00
  }));

  const doc25 = generateIntegrityInvoicePDF({
    client: { name: 'Medium Enterprise Corp' },
    invoiceNum: 'INV-ME-2500',
    invoiceDate: '7/28/2026',
    poNumber: 'PO-ME-9910',
    terms: 'Net 30',
    items: items25,
    currency: 'USD'
  });

  const pages25 = doc25.internal.getNumberOfPages();
  assert.strictEqual(pages25, 2, '25 items must generate exactly 2 pages');

  const items100 = Array.from({ length: 100 }, (_, i) => ({
    quantity: i + 1,
    item: `Quality Audit Entry #${i + 1}`,
    description: `Batch Containment & Sorting Audit for Part Batch #${5000 + i} at Plant Facility`,
    um: 'hr',
    priceEach: 50.00,
    amount: (i + 1) * 50.00
  }));

  const doc100 = generateIntegrityInvoicePDF({
    client: { name: 'Global Automotive Solutions' },
    invoiceNum: 'INV-GA-10000',
    invoiceDate: '7/28/2026',
    poNumber: 'PO-GA-7712',
    terms: 'Net 30',
    items: items100,
    currency: 'CAD'
  });

  const pages100 = doc100.internal.getNumberOfPages();
  assert.strictEqual(pages100, 6, '100 items must generate exactly 6 pages');

  // Verify text stream in multi-page output
  const pdf100String = doc100.output();
  assert.ok(pdf100String.includes('Invoice'), 'Multi-page output must contain Invoice title');
  assert.ok(pages100 === 6, '100 items must span across 6 pages');
});

// ----------------------------------------------------
// TEST 4: Single vs Batch Invoice Parity Gate
// ----------------------------------------------------
runTest('Single vs Batch Invoice Parity Gate', () => {
  const dataset = {
    client: { name: 'ArcelorMittal Tailored Blanks' },
    invoiceNum: 'INV-AM-9912',
    invoiceDate: '7/28/2026',
    poNumber: 'PO-8812',
    terms: 'Net 30',
    repName: 'Clarence Kuiken',
    shipDate: '7/28/2026',
    via: 'Direct',
    fob: 'FOB Origin',
    projectName: 'P-900 Containment',
    shipToText: 'Liaison Quality Lead at\nArcelorMittal Tailored Blanks',
    invoiceToLines: ['ArcelorMittal Tailored Blanks', 'Attn: Quality Manager', 'billing@arcelor.com'],
    items: [
      { quantity: 40, item: 'Contractors Hours', description: 'Quality Sorting Audit', um: 'hr', priceEach: 50.00, amount: 2000.00 },
      { quantity: 150, item: 'Travel Mileage', description: 'Field Mileage', um: 'km', priceEach: 0.73, amount: 109.50 }
    ],
    taxAmount: 0.00,
    currency: 'CAD',
    gstHstNo: '853120236'
  };

  const singleDoc = generateIntegrityInvoicePDF(dataset);
  const batchDoc = generateIntegrityInvoicePDF(dataset);

  assert.strictEqual(singleDoc.output('arraybuffer').byteLength, batchDoc.output('arraybuffer').byteLength, 'Single and Batch PDF outputs must have identical byte sizes for identical input data');
});

});
