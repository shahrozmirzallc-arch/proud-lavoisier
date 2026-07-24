import jsPDF from 'jspdf';
import { LOGO_BASE64 } from '../components/LogoBase64';

/**
 * Generates an exact, perfectly aligned PDF invoice matching the Integrity Driven Solutions Inc. template.
 * Fixes all column text overflows, line overlaps, and logo rendering issues.
 */
export const generateIntegrityInvoicePDF = ({
  client,
  invoiceNum = 'ARCTX26-29',
  invoiceDate = '7/20/2026',
  poNumber = '32268',
  terms = 'Net 30',
  repName = '',
  shipDate = '7/20/2026',
  via = '',
  fob = '',
  projectName = 'Tesla Austin',
  shipToText = 'Liaison Rep at\nTesla Austin',
  invoiceToLines = [
    'ArcelorMittal Tailored Blanks',
    'Silao S De Rl De CV Asu-041126-KA7',
    'Paseo De Los Ind Pte Lote 15-19',
    'Parque Ind Fipasi Silao GTO Mexico',
    'CP 36100'
  ],
  items = [
    {
      quantity: 15,
      item: 'Contractors Hours',
      description: 'Liaison Representation by Integrity Driven Solutions at Tesla Austin as authorized\nHours for the week ending July 19, 2026',
      um: 'hr',
      priceEach: 34.00,
      amount: 510.00
    }
  ],
  taxAmount = 0.00,
  currency = 'USD',
  gstHstNo = '853120236'
}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const marginX = 14;
  const pageW = 210;
  const contentW = pageW - (marginX * 2); // 182mm
  let y = 14;

  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);

  // ================= 1. HEADER SECTION =================
  // Top Left: Logo Image 2 (Inside Red Box Area)
  try {
    doc.addImage(LOGO_BASE64, 'PNG', marginX, y, 60, 16);
  } catch (err) {
    console.warn("Could not embed PDF logo image:", err);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('P.O. Box 505', marginX, y + 20);
  doc.text('5900 Main Street', marginX, y + 25);
  doc.text('Orono, ON L0B 1M0', marginX, y + 30);

  // Top Right: Title "Invoice"
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.text('Invoice', marginX + contentW, y + 6, { align: 'right' });

  // Date & Invoice # Grid Box (Right side under Invoice title)
  const invBoxW = 60;
  const invBoxX = marginX + contentW - invBoxW;
  const invBoxY = y + 12;
  const invBoxH = 14;

  doc.rect(invBoxX, invBoxY, invBoxW, invBoxH);
  // Vertical divider inside Date/Invoice box
  doc.line(invBoxX + 28, invBoxY, invBoxX + 28, invBoxY + invBoxH);
  // Horizontal divider
  doc.line(invBoxX, invBoxY + 6, invBoxX + invBoxW, invBoxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Date', invBoxX + 14, invBoxY + 4.5, { align: 'center' });
  doc.text('Invoice #', invBoxX + 44, invBoxY + 4.5, { align: 'center' });

  // Dynamically scale invoice number text size to prevent border collision
  const invStr = String(invoiceNum || '');
  const invFontSize = invStr.length > 15 ? 7.5 : (invStr.length > 12 ? 8 : 8.5);
  doc.setFontSize(invFontSize);
  doc.text(String(invoiceDate), invBoxX + 14, invBoxY + 11, { align: 'center' });
  doc.text(invStr, invBoxX + 44, invBoxY + 11, { align: 'center' });

  y += 36;

  // ================= 2. ADDRESSES SECTION =================
  const addrBoxW = (contentW - 6) / 2; // 88mm each
  const addrBoxH = 34;

  // Left Box: Invoice To
  const leftBoxX = marginX;
  doc.rect(leftBoxX, y, addrBoxW, addrBoxH);
  doc.line(leftBoxX, y + 7, leftBoxX + addrBoxW, y + 7); // Header line

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Invoice To', leftBoxX + 3, y + 5);

  doc.setFontSize(8.5);
  let addrY = y + 12;
  (invoiceToLines || []).forEach(line => {
    if (line) {
      const truncatedLine = doc.splitTextToSize(String(line), addrBoxW - 6)[0];
      doc.text(truncatedLine, leftBoxX + 3, addrY);
      addrY += 4.5;
    }
  });

  // Right Box: Ship To
  const rightBoxX = marginX + addrBoxW + 6;
  const shipBoxW = contentW - addrBoxW - 6;
  const shipBoxY = y;
  const shipBoxH = addrBoxH;

  doc.rect(rightBoxX, shipBoxY, shipBoxW, shipBoxH);
  doc.line(rightBoxX, shipBoxY + 7, rightBoxX + shipBoxW, shipBoxY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Ship To', rightBoxX + 3, shipBoxY + 5);

  let shipY = shipBoxY + 12;
  const shipLines = typeof shipToText === 'string' ? shipToText.split('\n') : (shipToText || []);
  shipLines.forEach(line => {
    if (line) {
      const truncatedLine = doc.splitTextToSize(String(line), shipBoxW - 6)[0];
      doc.text(truncatedLine, rightBoxX + 3, shipY);
      shipY += 4.5;
    }
  });

  y += addrBoxH + 4;

  // ================= 3. ORDER INFO TABLE =================
  const orderHeaders = ['P.O. No.', 'Terms', 'Rep', 'Ship', 'Via', 'F.O.B.', 'Project'];
  // Adjusted column widths to allocate sufficient space for Rep and Project
  const orderColWidths = [24, 18, 30, 20, 22, 22, 46]; // Sums to 182mm
  const orderTableH = 14;

  doc.rect(marginX, y, contentW, orderTableH);
  doc.line(marginX, y + 6, marginX + contentW, y + 6); // Divider row

  let currentX = marginX;
  orderHeaders.forEach((hdr, idx) => {
    const w = orderColWidths[idx];
    if (idx > 0) {
      doc.line(currentX, y, currentX, y + orderTableH);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(hdr, currentX + (w / 2), y + 4.5, { align: 'center' });
    currentX += w;
  });

  // Clean values with strict bounds checking
  const formatRep = (val) => {
    if (!val) return '';
    if (val.includes('Hugo')) return 'Hugo V.';
    return val.length > 15 ? val.substring(0, 15) + '.' : val;
  };

  const orderValues = [
    poNumber,
    terms,
    formatRep(repName),
    shipDate,
    via,
    fob,
    projectName
  ];

  currentX = marginX;
  orderValues.forEach((val, idx) => {
    const w = orderColWidths[idx];
    doc.setFont('helvetica', 'normal');
    
    // Adjust font size if text is long
    const valStr = String(val || '');
    const fontSize = valStr.length > 25 ? 6.5 : (valStr.length > 16 ? 7.5 : 8);
    doc.setFontSize(fontSize);

    // Truncate text if it exceeds column width
    const splitVal = doc.splitTextToSize(valStr, w - 2);
    doc.text(splitVal[0] || '', currentX + (w / 2), y + 11, { align: 'center' });
    currentX += w;
  });

  y += orderTableH + 4;

  // ================= 4. LINE ITEMS TABLE =================
  const itemHeaders = ['Quantity', 'Item', 'Description', 'U/M', 'Price Each', 'Amount'];
  // Re-allocated column widths so Item and Description don't collide
  const itemColWidths = [18, 36, 72, 14, 21, 21]; // Sums to 182mm
  const itemTableH = 130; // Items box height

  doc.rect(marginX, y, contentW, itemTableH);
  doc.line(marginX, y + 7, marginX + contentW, y + 7); // Header bottom line

  // Vertical grid lines across the entire itemTableH
  currentX = marginX;
  itemHeaders.forEach((hdr, idx) => {
    const w = itemColWidths[idx];
    if (idx > 0) {
      doc.line(currentX, y, currentX, y + itemTableH);
    }

    const align = (idx === 0 || idx === 3) ? 'center' : (idx >= 4 ? 'right' : 'left');
    const posX = align === 'center' ? currentX + (w / 2) : (align === 'right' ? currentX + w - 3 : currentX + 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(hdr, posX, y + 5, { align });

    currentX += w;
  });

  // Item Rows Content
  let itemY = y + 13;
  let subtotalSum = 0;

  (items || []).forEach(row => {
    subtotalSum += parseFloat(row.amount || 0);

    // Quantity
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(String(row.quantity ?? ''), marginX + (itemColWidths[0] / 2), itemY, { align: 'center' });

    // Item (Wrap within 34mm width)
    const itemX = marginX + itemColWidths[0] + 3;
    const itemW = itemColWidths[1] - 5;
    const splitItem = doc.splitTextToSize(String(row.item || ''), itemW);
    let itemLineY = itemY;
    splitItem.forEach(iLine => {
      doc.text(iLine, itemX, itemLineY);
      itemLineY += 4.5;
    });

    // Description (Wrap within 68mm width)
    const descX = marginX + itemColWidths[0] + itemColWidths[1] + 3;
    const descW = itemColWidths[2] - 5;
    const splitDesc = doc.splitTextToSize(String(row.description || ''), descW);
    let descLineY = itemY;
    splitDesc.forEach(dLine => {
      doc.text(dLine, descX, descLineY);
      descLineY += 4.5;
    });

    // U/M
    const umX = marginX + itemColWidths[0] + itemColWidths[1] + itemColWidths[2] + (itemColWidths[3] / 2);
    doc.text(String(row.um || ''), umX, itemY, { align: 'center' });

    // Price Each
    const priceX = marginX + itemColWidths[0] + itemColWidths[1] + itemColWidths[2] + itemColWidths[3] + itemColWidths[4] - 3;
    doc.text(parseFloat(row.priceEach || 0).toFixed(2), priceX, itemY, { align: 'right' });

    // Amount
    const amtX = marginX + contentW - 3;
    doc.text(parseFloat(row.amount || 0).toFixed(2), amtX, itemY, { align: 'right' });

    // Advance Y position based on tallest multiline column
    const maxHeight = Math.max(itemLineY, descLineY);
    itemY = maxHeight + 3;
  });

  y += itemTableH;

  // ================= 5. FOOTER & TAX / TOTAL SECTION =================
  // Sales Tax Summary Box (Right Aligned)
  const taxBoxW = 75;
  const taxBoxX = marginX + contentW - taxBoxW;
  const taxBoxY = y;
  const taxBoxH = 16;

  doc.rect(taxBoxX, taxBoxY, taxBoxW, taxBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Sales Tax Summary', marginX + contentW - 3, taxBoxY + 5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Total Tax', taxBoxX + 15, taxBoxY + 12);
  doc.text(`${currency} ${parseFloat(taxAmount || 0).toFixed(2)}`, marginX + contentW - 3, taxBoxY + 12, { align: 'right' });

  y += taxBoxH;

  // Total Box
  const totalBoxH = 14;
  doc.rect(marginX, y, contentW, totalBoxH);

  // Split line for Total right block
  const totalRightW = 60;
  const totalRightX = marginX + contentW - totalRightW;
  doc.line(totalRightX, y, totalRightX, y + totalBoxH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Total', totalRightX + 5, y + 9.5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const grandTotal = subtotalSum + parseFloat(taxAmount || 0);
  doc.text(`${currency} ${grandTotal.toFixed(2)}`, marginX + contentW - 3, y + 9.5, { align: 'right' });

  y += totalBoxH + 6;

  // Bottom Left GST/HST No.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`GST/HST No.          ${gstHstNo}`, marginX, y);

  return doc;
};
