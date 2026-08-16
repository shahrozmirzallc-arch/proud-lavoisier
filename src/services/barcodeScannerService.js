// src/services/barcodeScannerService.js
// Authoritative Automotive Barcode, QR Code, and AIAG B-10 Parser Service

/**
 * Parses raw barcode / 2D DataMatrix / QR scan data according to AIAG B-10 / ISO 15434 automotive standards.
 * Extracts part number, lot number, serial, supplier code, quantity, and VIN.
 *
 * @param {string} rawData - Scanned barcode or QR text
 * @returns {Object} Parsed automotive component metadata
 */
export function parseAutomotiveBarcode(rawData) {
  if (!rawData || typeof rawData !== 'string') {
    return {
      success: false,
      raw: '',
      partNumber: '',
      lotNumber: '',
      serialNumber: '',
      quantity: 1,
      supplierCode: '',
      isVIN: false,
      format: 'unknown'
    };
  }

  const raw = rawData.trim();

  // 1. Check for 17-character Standard Automotive VIN (Vehicle Identification Number)
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  if (vinRegex.test(raw)) {
    return {
      success: true,
      raw,
      partNumber: raw,
      lotNumber: 'N/A',
      serialNumber: raw.slice(11), // 6-digit production sequence
      quantity: 1,
      supplierCode: raw.slice(0, 3), // World Manufacturer Identifier (WMI)
      isVIN: true,
      vinYear: raw[9],
      format: 'VIN'
    };
  }

  // 2. Check for AIAG B-10 / ISO 15434 Data Matrix Format (e.g., [)>*06... or GS separated)
  const groupSeparator = String.fromCharCode(29);
  if (raw.includes('[)>') || raw.includes(groupSeparator) || raw.includes('|')) {
    const sanitized = raw.replaceAll(groupSeparator, '|');
    const tokens = sanitized.replace(/^\[\)>[\s\S]*?[0-9]{2}/, '').split(/[|\n\r]/);

    let partNumber = '';
    let lotNumber = '';
    let serialNumber = '';
    let quantity = 1;
    let supplierCode = '';

    tokens.forEach(t => {
      const token = t.trim();
      if (!token) return;

      if (token.startsWith('P') && !token.startsWith('PO') && !token.startsWith('PN-')) {
        partNumber = token.slice(1);
      } else if (token.startsWith('1P')) {
        partNumber = token.slice(2);
      } else if (token.startsWith('PN-')) {
        partNumber = token;
      } else if (token.startsWith('Q')) {
        quantity = Number(token.slice(1)) || 1;
      } else if (token.startsWith('1T') || token.startsWith('T') || token.startsWith('LOT')) {
        lotNumber = token.replace(/^(1T|T|LOT)/, '');
      } else if (token.startsWith('1S') || token.startsWith('S')) {
        serialNumber = token.replace(/^(1S|S)/, '');
      } else if (token.startsWith('V')) {
        supplierCode = token.slice(1);
      }
    });

    if (partNumber) {
      return {
        success: true,
        raw,
        partNumber,
        lotNumber: lotNumber || 'N/A',
        serialNumber: serialNumber || 'N/A',
        quantity,
        supplierCode: supplierCode || 'N/A',
        isVIN: false,
        format: 'AIAG_B10_2D'
      };
    }
  }

  // 3. Check for Prefix-Encoded 1D Barcodes (e.g., "P84920194" - P followed by digits/code, excluding explicit PN-)
  if (/^P[0-9][A-Z0-9\-_]{2,}$/i.test(raw)) {
    return {
      success: true,
      raw,
      partNumber: raw.slice(1).toUpperCase(),
      lotNumber: 'N/A',
      serialNumber: 'N/A',
      quantity: 1,
      supplierCode: 'N/A',
      isVIN: false,
      format: 'AIAG_PART_PREFIX'
    };
  }

  // 4. Standard Direct Part Number / Component Code (e.g., "84920194", "PN-7T4Z-7000-A")
  return {
    success: true,
    raw,
    partNumber: raw.toUpperCase(),
    lotNumber: 'N/A',
    serialNumber: 'N/A',
    quantity: 1,
    supplierCode: 'N/A',
    isVIN: false,
    format: 'DIRECT_PART_NUMBER'
  };
}

/**
 * Initializes and starts the camera video stream for real-time barcode scanning.
 *
 * @param {HTMLVideoElement} videoElement - Target HTML5 Video Element
 * @param {Function} onScan - Callback receiving (parsedResult)
 * @param {Function} onError - Callback receiving (error)
 * @returns {Promise<MediaStream>} Active media stream
 */
export async function startCameraScanner(videoElement, onScan, onError) {
  if (!navigator?.mediaDevices?.getUserMedia) {
    if (onError) onError(new Error('Camera media devices API not supported on this browser'));
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    if (videoElement) {
      videoElement.srcObject = stream;
      await videoElement.play();
    }

    return stream;
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}

/**
 * Cleanly stops camera stream and releases hardware locks.
 *
 * @param {MediaStream} stream - Active MediaStream instance
 */
export function stopCameraScanner(stream) {
  if (stream && stream.getTracks) {
    stream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {
        // Safe track release
      }
    });
  }
}
