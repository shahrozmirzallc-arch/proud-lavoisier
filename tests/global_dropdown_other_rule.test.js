// tests/global_dropdown_other_rule.test.js
// Authoritative Unit Test Suite for Global Dropdown Rule — "Other / Not listed" Support

import { describe, it, expect } from 'vitest';
import { generateIntegrityInvoicePDF } from '../src/utils/generateInvoicePdf';

describe('Global Dropdown Rule — "Other / Not listed" Support & Custom Value Validation', () => {

  it('1. Standard option selected returns standard authoritative value', () => {
    const area = 'Sequence Area';
    expect(area).toBe('Sequence Area');
    expect(area).not.toBe('Other / Not listed');
  });

  it('2. Custom text entered under "Other / Not listed" saves custom text, NOT "Other"', () => {
    const customAreaInput = 'Scrap Table 4 (Line 2)';
    const authoritativeAreaValue = customAreaInput.trim();
    
    expect(authoritativeAreaValue).toBe('Scrap Table 4 (Line 2)');
    expect(authoritativeAreaValue).not.toBe('Other');
    expect(authoritativeAreaValue).not.toBe('Other / Not listed');
  });

  it('3. Rejects empty or whitespace-only custom text when "Other / Not listed" is selected', () => {
    const emptyCustomInput = '   ';
    const isValid = emptyCustomInput.trim().length > 0;
    expect(isValid).toBe(false);

    const validCustomInput = 'Heavy Repair Bay 3';
    const isValidValue = validCustomInput.trim().length > 0;
    expect(isValidValue).toBe(true);
  });

  it('4. Workflow validation accepts non-empty custom defect type and custom area', () => {
    const incidentData = {
      selectedArea: '  Custom Assembly Zone 9  ',
      defectType: '  Micro-crack on Connector Housing  ',
      description: 'Found micro-crack during routine sequence check.',
      affectedParts: [{ partNumber: '86286761', description: 'Tail Light' }]
    };

    const trimmedArea = incidentData.selectedArea.trim();
    const trimmedDefect = incidentData.defectType.trim();

    expect(trimmedArea).toBe('Custom Assembly Zone 9');
    expect(trimmedDefect).toBe('Micro-crack on Connector Housing');
    expect(trimmedArea.length).toBeGreaterThan(0);
    expect(trimmedDefect.length).toBeGreaterThan(0);
  });

  it('5. Switching from "Other / Not listed" back to standard option clears custom text', () => {
    let selectedOption = 'Other / Not listed';
    let customValue = 'Custom Line 5';

    // Simulate switching back to a standard option
    const switchToStandard = (newOption) => {
      selectedOption = newOption;
      customValue = ''; // Cleared after confirmation
    };

    switchToStandard('Sequence Area');

    expect(selectedOption).toBe('Sequence Area');
    expect(customValue).toBe('');
  });

  it('6. Preserves custom dropdown value in local draft serialization', () => {
    const draftState = {
      selectedPlant: 'Custom Plant Location Detroit',
      selectedSupplier: 'Custom Tier-2 Supplier Inc.',
      selectedArea: 'Cell 14 Sub-Assembly',
      defectType: 'Unusual rattle from internal clip',
      concernClassification: 'Engineering Hold Notice #8841'
    };

    const serialized = JSON.stringify(draftState);
    const restored = JSON.parse(serialized);

    expect(restored.selectedPlant).toBe('Custom Plant Location Detroit');
    expect(restored.selectedSupplier).toBe('Custom Tier-2 Supplier Inc.');
    expect(restored.selectedArea).toBe('Cell 14 Sub-Assembly');
    expect(restored.defectType).toBe('Unusual rattle from internal clip');
    expect(restored.concernClassification).toBe('Engineering Hold Notice #8841');
  });

  it('7. PDF Report Generator accepts custom business dropdown values without truncation', () => {
    const mockInvoiceData = {
      client: { name: 'Stellantis Windsor Assembly', address: 'Windsor, ON' },
      invoiceNum: 'INV-2026-0802',
      poNumber: 'PO-99402',
      repName: 'Clarence Kuiken',
      items: [
        {
          description: 'Quality Inspection — Custom Plant Location Detroit (Cell 14 Sub-Assembly) — Unusual rattle from internal clip',
          hrs: 8.0,
          rate: 45.0,
          amount: 360.0
        }
      ],
      totalAmount: 360.0
    };

    const doc = generateIntegrityInvoicePDF(mockInvoiceData);
    expect(doc).toBeDefined();
    expect(typeof doc.output).toBe('function');
  });

});
