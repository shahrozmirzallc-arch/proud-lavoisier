import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { generateIntegrityInvoicePDF } from '../utils/generateInvoicePdf';
import { LOGO_BASE64 } from './LogoBase64';

export const InvoiceModal = ({
  isOpen,
  onClose,
  invoiceData = {}
}) => {
  if (!isOpen) return null;

  const {
    client = { name: 'ArcelorMittal Tailored Blanks' },
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
  } = invoiceData;

  const subtotal = items.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const total = subtotal + parseFloat(taxAmount || 0);

  const handleDownloadPDF = () => {
    const doc = generateIntegrityInvoicePDF(invoiceData);
    doc.save(`Invoice_${invoiceNum || 'IDS'}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-950 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl overflow-hidden my-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        
        {/* Modal Toolbar (Hidden during browser print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-blue-400">IDS Pulse</span>
            <span className="text-slate-400 text-sm font-semibold">| Standard Client Invoice Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas (Faithful layout replica) */}
        <div className="p-8 sm:p-12 bg-white font-sans text-xs text-black leading-tight max-w-[800px] mx-auto select-none print:p-0">
          
          {/* TOP HEADER ROW */}
          <div className="flex justify-between items-start mb-6">
            
            {/* Top Left: Transparent Logo & Company Address */}
            <div className="flex flex-col items-start">
              <img 
                src={LOGO_BASE64} 
                alt="Integrity Driven Solutions Inc." 
                className="h-14 w-auto object-contain flex-shrink-0 mb-2 -ml-1" 
              />
              <div className="flex flex-col text-[11px] text-black font-normal space-y-0.5 ml-0.5">
                <p>P.O. Box 505</p>
                <p>5900 Main Street</p>
                <p>Orono, ON L0B 1M0</p>
              </div>
            </div>

            {/* Top Right: Title & Date / Invoice # box */}
            <div className="flex flex-col items-end gap-2">
              <h1 className="text-3xl font-extrabold text-black tracking-tight">Invoice</h1>
              <div className="border border-black grid grid-cols-2 text-center w-48 text-[11px]">
                <div className="border-r border-b border-black font-normal py-1">Date</div>
                <div className="border-b border-black font-normal py-1">Invoice #</div>
                <div className="border-r border-black py-1 font-medium">{invoiceDate}</div>
                <div className="py-1 font-medium">{invoiceNum}</div>
              </div>
            </div>
          </div>

          {/* ADDRESSES ROW */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            
            {/* Invoice To Box */}
            <div className="border border-black min-h-[140px] flex flex-col">
              <div className="border-b border-black px-2 py-1 font-normal text-[11px]">
                Invoice To
              </div>
              <div className="p-2.5 text-[11px] space-y-0.5">
                {invoiceToLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </div>

            {/* Ship To Box */}
            <div className="border border-black min-h-[140px] flex flex-col -mt-2">
              <div className="border-b border-black px-2 py-1 font-normal text-[11px]">
                Ship To
              </div>
              <div className="p-2.5 text-[11px] whitespace-pre-line space-y-0.5">
                {shipToText}
              </div>
            </div>
          </div>

          {/* ORDER INFO TABLE */}
          <div className="border border-black grid grid-cols-7 text-center text-[11px] mb-6">
            <div className="border-r border-b border-black py-1">P.O. No.</div>
            <div className="border-r border-b border-black py-1">Terms</div>
            <div className="border-r border-b border-black py-1">Rep</div>
            <div className="border-r border-b border-black py-1">Ship</div>
            <div className="border-r border-b border-black py-1">Via</div>
            <div className="border-r border-b border-black py-1">F.O.B.</div>
            <div className="border-b border-black py-1">Project</div>

            <div className="border-r border-black py-1.5">{poNumber}</div>
            <div className="border-r border-black py-1.5">{terms}</div>
            <div className="border-r border-black py-1.5">{repName}</div>
            <div className="border-r border-black py-1.5">{shipDate}</div>
            <div className="border-r border-black py-1.5">{via}</div>
            <div className="border-r border-black py-1.5">{fob}</div>
            <div className="py-1.5">{projectName}</div>
          </div>

          {/* LINE ITEMS TABLE WITH FULL VERTICAL DIVIDERS */}
          <div className="border border-black relative min-h-[380px] flex flex-col mb-0">
            
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b border-black text-[11px] font-normal text-left">
              <div className="col-span-2 border-r border-black p-1.5 text-center">Quantity</div>
              <div className="col-span-2 border-r border-black p-1.5">Item</div>
              <div className="col-span-5 border-r border-black p-1.5">Description</div>
              <div className="col-span-1 border-r border-black p-1.5 text-center">U/M</div>
              <div className="col-span-1 border-r border-black p-1.5 text-right">Price Each</div>
              <div className="col-span-1 p-1.5 text-right">Amount</div>
            </div>

            {/* Table Rows Body Container */}
            <div className="flex-1 grid grid-cols-12 text-[11px] relative divide-x divide-black">
              <div className="col-span-2 p-2 text-center">
                {items.map((it, idx) => <div key={idx}>{it.quantity}</div>)}
              </div>
              <div className="col-span-2 p-2">
                {items.map((it, idx) => <div key={idx}>{it.item}</div>)}
              </div>
              <div className="col-span-5 p-2 whitespace-pre-line">
                {items.map((it, idx) => <div key={idx} className="mb-2">{it.description}</div>)}
              </div>
              <div className="col-span-1 p-2 text-center">
                {items.map((it, idx) => <div key={idx}>{it.um}</div>)}
              </div>
              <div className="col-span-1 p-2 text-right">
                {items.map((it, idx) => <div key={idx}>{parseFloat(it.priceEach || 0).toFixed(2)}</div>)}
              </div>
              <div className="col-span-1 p-2 text-right">
                {items.map((it, idx) => <div key={idx}>{parseFloat(it.amount || 0).toFixed(2)}</div>)}
              </div>
            </div>
          </div>

          {/* FOOTER / TAX / TOTAL SECTION */}
          <div className="flex justify-end mb-2">
            <div className="border border-t-0 border-black w-64 text-[11px]">
              <div className="font-bold text-right p-1.5 pr-2">Sales Tax Summary</div>
              <div className="flex justify-between px-3 py-1 border-t border-black">
                <span>Total Tax</span>
                <span>{currency} {parseFloat(taxAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* GRAND TOTAL BOX */}
          <div className="border border-black grid grid-cols-12 text-[11px] mb-4">
            <div className="col-span-7"></div>
            <div className="col-span-5 border-l border-black flex justify-between items-center px-4 py-2">
              <span className="text-xl font-bold">Total</span>
              <span className="text-sm font-normal">{currency} {total.toFixed(2)}</span>
            </div>
          </div>

          {/* GST / HST FOOTER */}
          <div className="text-[11px]">
            <span className="font-normal">GST/HST No.</span>
            <span className="ml-16">{gstHstNo}</span>
          </div>

        </div>

      </div>
    </div>
  );
};
