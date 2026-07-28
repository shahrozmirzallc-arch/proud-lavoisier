/**
 * Sample Invoice Generator Script for IDS Pulse
 * Generates canonical invoice sample PDFs for 1, 25, and 100 line items.
 * Run via: node scripts/generate_sample_invoices.js
 */

import fs from 'fs';
import path from 'path';
import { generateIntegrityInvoicePDF } from '../src/utils/generateInvoicePdf.js';

const outDir = path.resolve('demo_reports');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('===========================================================');
console.log('  GENERATING CANONICAL INVOICE SAMPLES (1, 25, 100 ITEMS)');
console.log('===========================================================\n');

// 1. Single Item Invoice Sample
const sample1Data = {
  client: { name: 'Test Company', email: 'john@testcompany.com', contact_person: 'John Test' },
  invoiceNum: 'INV-TC-8002',
  invoiceDate: '7/26/2026',
  poNumber: 'PO-32268',
  terms: 'Net 30',
  repName: 'Clarence Kuiken',
  shipDate: '7/26/2026',
  via: 'Direct',
  fob: 'FOB Origin',
  projectName: 'Test Company',
  shipToText: 'Liaison Quality Lead at\nTest Company',
  invoiceToLines: ['Test Company', 'Attn: John Test', 'john@testcompany.com'],
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

const doc1 = generateIntegrityInvoicePDF(sample1Data);
const file1 = path.join(outDir, 'Invoice_Sample_1_Item.pdf');
fs.writeFileSync(file1, Buffer.from(doc1.output('arraybuffer')));
console.log(`  ✅ Generated: ${file1} (${doc1.internal.getNumberOfPages()} Page(s))`);

// 2. 25-Item Invoice Sample
const items25 = Array.from({ length: 25 }, (_, i) => ({
  quantity: i + 1,
  item: `Contractor Hours Line #${i + 1}`,
  description: `Shift #${100 + i} Quality Inspection Representation at Assembly Line ${i + 1}`,
  um: 'hr',
  priceEach: 45.00,
  amount: (i + 1) * 45.00
}));

const sample25Data = {
  client: { name: 'Medium Enterprise Corp', email: 'ap@mediumcorp.com', contact_person: 'David Miller' },
  invoiceNum: 'INV-ME-2500',
  invoiceDate: '7/28/2026',
  poNumber: 'PO-ME-9910',
  terms: 'Net 30',
  repName: 'Donna Cabral',
  shipDate: '7/28/2026',
  via: 'Direct',
  fob: 'FOB Origin',
  projectName: 'Medium Enterprise Audit',
  shipToText: 'Liaison Quality Lead at\nMedium Enterprise Corp',
  invoiceToLines: ['Medium Enterprise Corp', 'Attn: David Miller', 'ap@mediumcorp.com'],
  items: items25,
  taxAmount: 0.00,
  currency: 'USD',
  gstHstNo: '853120236'
};

const doc25 = generateIntegrityInvoicePDF(sample25Data);
const file25 = path.join(outDir, 'Invoice_Sample_25_Items.pdf');
fs.writeFileSync(file25, Buffer.from(doc25.output('arraybuffer')));
console.log(`  ✅ Generated: ${file25} (${doc25.internal.getNumberOfPages()} Page(s))`);

// 3. 100-Item Invoice Sample
const items100 = Array.from({ length: 100 }, (_, i) => ({
  quantity: i + 1,
  item: `Quality Audit Entry #${i + 1}`,
  description: `Batch Containment & Sorting Audit for Part Batch #${5000 + i} at Plant Facility`,
  um: 'hr',
  priceEach: 50.00,
  amount: (i + 1) * 50.00
}));

const sample100Data = {
  client: { name: 'Global Automotive Solutions', email: 'billing@globalauto.com', contact_person: 'Robert Vance' },
  invoiceNum: 'INV-GA-10000',
  invoiceDate: '7/28/2026',
  poNumber: 'PO-GA-7712',
  terms: 'Net 30',
  repName: 'Clarence Kuiken',
  shipDate: '7/28/2026',
  via: 'Direct',
  fob: 'FOB Origin',
  projectName: 'Global Automotive Enterprise Support',
  shipToText: 'Liaison Quality Lead at\nGlobal Automotive Solutions',
  invoiceToLines: ['Global Automotive Solutions', 'Attn: Robert Vance', 'billing@globalauto.com'],
  items: items100,
  taxAmount: 0.00,
  currency: 'CAD',
  gstHstNo: '853120236'
};

const doc100 = generateIntegrityInvoicePDF(sample100Data);
const file100 = path.join(outDir, 'Invoice_Sample_100_Items.pdf');
fs.writeFileSync(file100, Buffer.from(doc100.output('arraybuffer')));
console.log(`  ✅ Generated: ${file100} (${doc100.internal.getNumberOfPages()} Page(s))`);

console.log('\n===========================================================');
console.log('  SAMPLE INVOICE GENERATION COMPLETE');
console.log('===========================================================\n');
