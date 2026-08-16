// tests/barcode_scanner_service.test.js
import { describe, it, expect } from 'vitest';
import { parseAutomotiveBarcode } from '../src/services/barcodeScannerService.js';

describe('Authoritative Automotive Barcode & QR Code Parser Engine Suite', () => {
  describe('1. 17-Character Standard Automotive VIN Parser Gate', () => {
    it('correctly identifies and extracts 17-char VIN strings', () => {
      const vin = '1G1YY22U065100001';
      const result = parseAutomotiveBarcode(vin);

      expect(result.success).toBe(true);
      expect(result.isVIN).toBe(true);
      expect(result.partNumber).toBe(vin);
      expect(result.serialNumber).toBe('100001');
      expect(result.supplierCode).toBe('1G1');
      expect(result.vinYear).toBe('6');
      expect(result.format).toBe('VIN');
    });
  });

  describe('2. AIAG B-10 / ISO 15434 2D DataMatrix Label Gate', () => {
    it('decodes multi-token AIAG label with P (Part), Q (Qty), and S (Serial) tokens', () => {
      const rawAiag = '[)>*06\u001dPPN-84920194\u001dQ500\u001d1SUNQ-2026-99\u001dVMAGNA';
      const result = parseAutomotiveBarcode(rawAiag);

      expect(result.success).toBe(true);
      expect(result.isVIN).toBe(false);
      expect(result.partNumber).toBe('PN-84920194');
      expect(result.quantity).toBe(500);
      expect(result.serialNumber).toBe('UNQ-2026-99');
      expect(result.supplierCode).toBe('MAGNA');
      expect(result.format).toBe('AIAG_B10_2D');
    });

    it('decodes pipe-separated automotive label formats', () => {
      const pipeLabel = 'P86286761|Q120|LOT2026-08|VSTELLANTIS';
      const result = parseAutomotiveBarcode(pipeLabel);

      expect(result.success).toBe(true);
      expect(result.partNumber).toBe('86286761');
      expect(result.quantity).toBe(120);
      expect(result.lotNumber).toBe('2026-08');
      expect(result.supplierCode).toBe('STELLANTIS');
    });
  });

  describe('3. Prefix-Encoded 1D Barcode Gate', () => {
    it('strips "P" prefix from standard part number barcodes', () => {
      const barcode = 'P84920194';
      const result = parseAutomotiveBarcode(barcode);

      expect(result.success).toBe(true);
      expect(result.partNumber).toBe('84920194');
      expect(result.format).toBe('AIAG_PART_PREFIX');
    });
  });

  describe('4. Direct Component Part Number Gate', () => {
    it('normalizes direct part numbers without prefixes', () => {
      const partNum = 'pn-7t4z-7000-a';
      const result = parseAutomotiveBarcode(partNum);

      expect(result.success).toBe(true);
      expect(result.partNumber).toBe('PN-7T4Z-7000-A');
      expect(result.format).toBe('DIRECT_PART_NUMBER');
    });

    it('gracefully handles empty or null input', () => {
      const result = parseAutomotiveBarcode('');
      expect(result.success).toBe(false);
      expect(result.partNumber).toBe('');
    });
  });
});
