import React, { useState } from 'react';
import { Download, Printer, Save, Plus, Trash2, FileText, CheckCircle, RefreshCw, Calculator, DollarSign, Calendar, User } from 'lucide-react';

export default function IntegrityWeeklyTimesheet({ currentUserRole }) {
  // Header Metadata State
  const [serviceProvider, setServiceProvider] = useState('Donna Cabral');
  const [repNo, setRepNo] = useState('24');
  const [serviceRate, setServiceRate] = useState('20.00');
  const [currency, setCurrency] = useState('CAD');
  const [weekEnded, setWeekEnded] = useState('July 12, 2026');
  const [gstHstNo, setGstHstNo] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Client Hours Matrix Rows (Default pre-loaded with exact values from physical reference sheet photo)
  const [rows, setRows] = useState([
    { id: 1, clientName: 'Administration', plant: '', description: '', mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
    { id: 2, clientName: 'Forvia', plant: '', description: '', mon: '4', tue: '4', wed: '4', thu: '4', fri: '4', sat: '4', sun: '' },
    { id: 3, clientName: 'Magna Mirrors', plant: '', description: '', mon: '4', tue: '4', wed: '4', thu: '4', fri: '4', sat: '4', sun: '' },
    { id: 4, clientName: 'Coextec', plant: '', description: '', mon: '8', tue: '8', wed: '8', thu: '8', fri: '8', sat: '8', sun: '' },
    { id: 5, clientName: 'SRG', plant: '', description: '', mon: '3', tue: '3', wed: '3', thu: '3', fri: '3', sat: '3', sun: '' },
    { id: 6, clientName: 'Denso', plant: '', description: '', mon: '2', tue: '2', wed: '2', thu: '2', fri: '2', sat: '2', sun: '' },
    { id: 7, clientName: 'Autosystems', plant: '', description: '', mon: '2', tue: '2', wed: '2', thu: '2', fri: '2', sat: '2', sun: '' },
    { id: 8, clientName: 'Mechontronics', plant: '', description: '', mon: '2', tue: '2', wed: '2', thu: '2', fri: '2', sat: '2', sun: '' },
    { id: 9, clientName: 'Hella - headlights', plant: '', description: 'approved by Alfonso', mon: '6', tue: '6', wed: '6', thu: '6', fri: '6', sat: '6', sun: '' },
    { id: 10, clientName: 'Autosystems', plant: '', description: '', mon: '2', tue: '2', wed: '2', thu: '2', fri: '2', sat: '2', sun: '' },
    { id: 11, clientName: 'Polycon', plant: '', description: '', mon: '2', tue: '2', wed: '2', thu: '2', fri: '2', sat: '2', sun: '' },
    { id: 12, clientName: 'Magna Mirrors', plant: '', description: '', mon: '2', tue: '2', wed: '2', thu: '2', fri: '2', sat: '2', sun: '' },
    { id: 13, clientName: 'Hella', plant: '', description: '', mon: '', tue: '8', wed: '', thu: '', fri: '', sat: '', sun: '' },
    { id: 14, clientName: 'Oesl trigo', plant: '', description: '', mon: '1', tue: '1', wed: '1', thu: '1', fri: '1', sat: '1', sun: '' },
  ]);

  // Expenses Section Rows (Pre-loaded with phone bill & mileage from physical reference sheet photo)
  const [expenses, setExpenses] = useState([
    { id: 1, date: '7/15/2026', clientName: 'IDS / Coextec', plant: '', description: 'phone bill us calling and texting / MILEAGE', amount: '5.00' }
  ]);

  // Update Matrix Row Cell
  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Update Expense Row Cell
  const updateExpense = (id, field, value) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  // Add New Client Row
  const addRow = () => {
    const newId = rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows(prev => [...prev, { id: newId, clientName: '', plant: '', description: '', mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' }]);
  };

  // Remove Client Row
  const removeRow = (id) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Add Expense Row
  const addExpenseRow = () => {
    const newId = expenses.length ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    setExpenses(prev => [...prev, { id: newId, date: '', clientName: '', plant: '', description: '', amount: '' }]);
  };

  // Remove Expense Row
  const removeExpenseRow = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Calculations
  const calcRowTotal = (row) => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return days.reduce((sum, day) => sum + (parseFloat(row[day]) || 0), 0);
  };

  const calcDayTotal = (day) => {
    return rows.reduce((sum, row) => sum + (parseFloat(row[day]) || 0), 0);
  };

  const calcGrandTotalHours = () => {
    return rows.reduce((sum, row) => sum + calcRowTotal(row), 0);
  };

  const calcTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  const calcTotalGrossPay = () => {
    const rate = parseFloat(serviceRate) || 0;
    return (calcGrandTotalHours() * rate) + calcTotalExpenses();
  };

  // Save Handler
  const handleSave = () => {
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // QuickBooks CSV Export Engine (Formatted for QuickBooks Vendor Timesheet & Expense Import)
  const handleQuickBooksExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Vendor/Employee,Week Ended,Rate,Currency,Row,Client Name,Plant,Description,Mon,Tue,Wed,Thu,Fri,Sat,Sun,Total Hours,Expense Description,Expense Amount\n";

    rows.forEach(r => {
      const tot = calcRowTotal(r);
      if (tot > 0 || r.clientName) {
        csvContent += `"Timesheet","${serviceProvider}","${weekEnded}","${serviceRate}","${currency}","${r.id}","${r.clientName}","${r.plant}","${r.description}","${r.mon || 0}","${r.tue || 0}","${r.wed || 0}","${r.thu || 0}","${r.fri || 0}","${r.sat || 0}","${r.sun || 0}","${tot}","",""\n`;
      }
    });

    expenses.forEach(e => {
      if (e.amount || e.description) {
        csvContent += `"Expense","${serviceProvider}","${weekEnded}","${serviceRate}","${currency}","","${e.clientName}","${e.plant}","","0","0","0","0","0","0","0","0","${e.description}","${e.amount || 0}"\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuickBooks_Timesheet_${serviceProvider.replace(/\s+/g, '_')}_${weekEnded.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Top Action & Information Header Bar */}
      <div className="bg-surface-elevated border border-border-subtle p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Integrity Weekly Time Sheet (QuickBooks Digitizer)
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Digital 1:1 paper replica for Admins to log hours & Colleen to review/export into QuickBooks.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {saveSuccessMsg && (
            <span className="text-xs font-bold text-emerald-500 animate-pulse flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Saved!
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-3.5 py-2 bg-surface hover:bg-surface-elevated border border-border-subtle text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-500" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-surface hover:bg-surface-elevated border border-border-subtle text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            <span>Print 1:1 Paper Copy</span>
          </button>

          <button
            onClick={handleQuickBooksExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export for QuickBooks (CSV)</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE / DISPLAY PAPER SHEET CONTAINER */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-xl p-6 sm:p-8 shadow-md font-sans text-xs max-w-5xl mx-auto w-full print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* PHYSICAL PAPER HEADER */}
        <div className="flex flex-col gap-4 border-b border-slate-400 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-sm font-extrabold tracking-wide uppercase text-slate-900">Integrity Driven Solutions Inc.</h1>
              <h2 className="text-xs font-semibold text-slate-700">Weekly Time Sheet</h2>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">IDS</span>
                <span className="tracking-widest uppercase text-[11px]">INTEGRITY</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500">DRIVEN SOLUTIONS INC.</span>
            </div>
          </div>

          {/* TOP METADATA FORM FIELDS (SERVICER, RATE, WEEK ENDED) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left Box */}
            <div className="border border-slate-400 p-2 rounded bg-slate-50/50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 w-32">Service Provider:</span>
                <input
                  type="text"
                  value={serviceProvider}
                  onChange={(e) => setServiceProvider(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-0.5 w-48 font-bold bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 w-32">Service Rate:</span>
                <div className="flex items-center gap-1 w-48">
                  <span className="font-bold text-slate-700">$</span>
                  <input
                    type="text"
                    value={serviceRate}
                    onChange={(e) => setServiceRate(e.target.value)}
                    className="border border-slate-300 rounded px-2 py-0.5 w-full font-mono font-bold bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold bg-white focus:outline-none"
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Box */}
            <div className="border border-slate-400 p-2 rounded bg-slate-50/50 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 w-36">REP No:</span>
                <input
                  type="text"
                  value={repNo}
                  onChange={(e) => setRepNo(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-0.5 w-48 font-mono text-center font-bold bg-white text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 w-36">For the week ended:</span>
                <input
                  type="text"
                  value={weekEnded}
                  onChange={(e) => setWeekEnded(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-0.5 w-48 font-bold bg-white text-slate-900 focus:outline-none focus:border-blue-500 text-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CLIENT HOURS MATRIX TABLE */}
        <div className="overflow-x-auto w-full border border-slate-400 mb-6">
          <table className="w-full text-left text-[11px] border-collapse bg-white text-slate-900">
            <thead>
              <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-400 text-center">
                <th className="p-1.5 border-r border-slate-300 w-8">#</th>
                <th className="p-1.5 border-r border-slate-300 text-left min-w-[140px]">Client Name</th>
                <th className="p-1.5 border-r border-slate-300 text-left w-24">Plant</th>
                <th className="p-1.5 border-r border-slate-300 text-left min-w-[150px]">Description</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Mon.</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Tue.</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Wed.</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Thu.</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Fri.</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Sat.</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Sun.</th>
                <th className="p-1.5 border-r border-slate-300 w-14 bg-slate-100 font-extrabold">Total</th>
                <th className="p-1 border-r border-slate-300 w-7 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const total = calcRowTotal(row);
                return (
                  <tr key={row.id} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                    <td className="p-1 text-center border-r border-slate-300 font-bold text-slate-600 bg-slate-50/50">{index + 1}</td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={row.clientName}
                        onChange={(e) => updateRow(row.id, 'clientName', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 font-semibold text-slate-900 focus:bg-amber-50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={row.plant}
                        onChange={(e) => updateRow(row.id, 'plant', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                      />
                    </td>

                    {/* Day inputs */}
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                      <td key={day} className="p-1 border-r border-slate-300 text-center">
                        <input
                          type="text"
                          value={row[day]}
                          onChange={(e) => updateRow(row.id, day, e.target.value)}
                          className="w-full text-center bg-transparent py-0.5 font-mono text-slate-900 focus:bg-amber-100 focus:outline-none"
                        />
                      </td>
                    ))}

                    <td className="p-1 text-center font-mono font-bold border-r border-slate-300 bg-slate-100/70 text-slate-900">
                      {total > 0 ? total.toFixed(2) : ''}
                    </td>

                    <td className="p-1 text-center print:hidden">
                      <button onClick={() => removeRow(row.id)} className="text-slate-400 hover:text-red-600 transition-colors p-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-200 font-extrabold text-slate-900 border-t-2 border-slate-400 text-center">
                <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase tracking-wider font-extrabold">Total Hours</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('mon').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('tue').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('wed').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('thu').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('fri').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('sat').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('sun').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono text-xs bg-amber-100 font-extrabold text-slate-900">{calcGrandTotalHours().toFixed(2)}</td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center justify-between mb-4 print:hidden">
          <button
            onClick={addRow}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Row</span>
          </button>
        </div>

        {/* EXPENSES SECTION */}
        <div className="border border-slate-400 p-4 rounded bg-slate-50/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">GST/HST # (if applicable):</span>
              <input
                type="text"
                value={gstHstNo}
                onChange={(e) => setGstHstNo(e.target.value)}
                className="border border-slate-300 rounded px-2 py-0.5 w-48 font-mono bg-white text-slate-900 focus:outline-none"
              />
            </div>
            <span className="font-bold text-slate-700 text-xs uppercase">Reimbursable Expenses</span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-left text-[11px] border-collapse bg-white text-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <th className="p-1.5 border-r border-slate-300 text-left w-24">Date</th>
                  <th className="p-1.5 border-r border-slate-300 text-left w-36">Client Name</th>
                  <th className="p-1.5 border-r border-slate-300 text-left w-24">Plant</th>
                  <th className="p-1.5 border-r border-slate-300 text-left">Expense Description</th>
                  <th className="p-1.5 border-r border-slate-300 w-28 text-right pr-3">Total $</th>
                  <th className="p-1 w-7 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-slate-200">
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={exp.date}
                        onChange={(e) => updateExpense(exp.id, 'date', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 font-mono focus:bg-amber-50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={exp.clientName}
                        onChange={(e) => updateExpense(exp.id, 'clientName', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={exp.plant}
                        onChange={(e) => updateExpense(exp.id, 'plant', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={exp.description}
                        onChange={(e) => updateExpense(exp.id, 'description', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300 text-right pr-2">
                      <input
                        type="text"
                        value={exp.amount}
                        onChange={(e) => updateExpense(exp.id, 'amount', e.target.value)}
                        className="w-full text-right bg-transparent px-1 py-0.5 text-slate-900 font-mono font-bold focus:bg-amber-100 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 text-center print:hidden">
                      <button onClick={() => removeExpenseRow(exp.id)} className="text-slate-400 hover:text-red-600 transition-colors p-0.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                  <td colSpan={4} className="p-1.5 border-r border-slate-300 text-right uppercase">Total Expenses:</td>
                  <td className="p-1.5 text-right pr-3 font-mono font-extrabold text-slate-900">${calcTotalExpenses().toFixed(2)}</td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between print:hidden">
            <button
              onClick={addExpenseRow}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Expense Row</span>
            </button>
          </div>
        </div>

        {/* SUMMARY PAYROLL FOOTER */}
        <div className="mt-6 pt-4 border-t-2 border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase">Approval & Authorization</span>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Approved By:</span>
                <span className="border-b border-slate-400 px-4 font-bold text-slate-800">Alfonso / Admin</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Date:</span>
                <span className="border-b border-slate-400 px-4 font-bold text-slate-800">July 12, 2026</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-300 p-3 rounded-lg flex flex-col gap-1 text-right min-w-[200px]">
            <div className="flex justify-between gap-4 text-[11px]">
              <span className="text-slate-600 font-medium">Labor Hours Pay:</span>
              <span className="font-mono font-bold">${(calcGrandTotalHours() * (parseFloat(serviceRate) || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px]">
              <span className="text-slate-600 font-medium">Reimbursable Expenses:</span>
              <span className="font-mono font-bold">${calcTotalExpenses().toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-300 pt-1 mt-1 flex justify-between gap-4 text-xs font-extrabold text-slate-900">
              <span>Gross Total Payable:</span>
              <span className="font-mono text-emerald-700">${calcTotalGrossPay().toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
