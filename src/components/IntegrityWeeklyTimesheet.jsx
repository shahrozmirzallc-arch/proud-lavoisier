import React, { useState, useEffect } from 'react';
import { Download, Printer, Save, Plus, Trash2, FileText, CheckCircle, Calculator, DollarSign, Calendar, User, Paperclip, ShieldCheck, ExternalLink } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_BASE64 } from './LogoBase64';
import { saveEntity, getEntities } from './SharedDatabase';

const CONFIG_MILEAGE_RATE = 0.73;

export default function IntegrityWeeklyTimesheet({
  currentUserRole = 'admin',
  reps = [],
  suppliers = [],
  plants = [],
  rates = [],
  timeEntries = [],
  expenseEntries = [],
  currentUser = null
}) {
  // 1. Rep & Week Selection State
  const defaultRep = reps.length > 0 ? reps[0] : null;
  const [selectedRepId, setSelectedRepId] = useState(defaultRep ? defaultRep.id : '24');
  
  // Default to nearest Sunday (ISO YYYY-MM-DD)
  const getInitialSunday = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sun
    const diff = today.getDate() + (day === 0 ? 0 : 7 - day);
    const sunday = new Date(today.setDate(diff));
    return sunday.toISOString().substring(0, 10);
  };

  const [weekEnded, setWeekEnded] = useState(getInitialSunday());
  const [serviceProvider, setServiceProvider] = useState(defaultRep ? defaultRep.name : 'Donna Cabral');
  const [repNo, setRepNo] = useState(defaultRep ? (defaultRep.rep_id || defaultRep.id) : '24');
  const [currency, setCurrency] = useState('CAD');
  const [gstHstNo, setGstHstNo] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [approvalInfo, setApprovalInfo] = useState({
    preparedBy: defaultRep ? defaultRep.name : 'Field Rep',
    preparedAt: new Date().toLocaleDateString(),
    reviewedBy: 'Colleen / Accounting',
    reviewedAt: new Date().toLocaleDateString(),
    approvedBy: '',
    approvedAt: '',
    status: 'Draft'
  });

  // Client Matrix Rows & Expenses State
  const [rows, setRows] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Rate Helper Resolver
  const getRepSupplierRatesHelper = (repId, supplierId, plantId = '') => {
    const dbRates = rates || [];
    let rateMatch = null;
    if (plantId) {
      rateMatch = dbRates.find(r => r && (r.supplier_id === supplierId || r.client_id === supplierId) && (r.rep_id === repId || !r.rep_id) && r.plant_id === plantId);
    }
    if (!rateMatch) {
      rateMatch = dbRates.find(r => r && (r.supplier_id === supplierId || r.client_id === supplierId) && (r.rep_id === repId || !r.rep_id));
    }
    if (!rateMatch) {
      rateMatch = dbRates.find(r => r && (r.supplier_id === supplierId || r.client_id === supplierId));
    }
    if (rateMatch && (rateMatch.billing_rate !== undefined && rateMatch.billing_rate !== null && rateMatch.billing_rate !== '')) {
      const bRate = parseFloat(rateMatch.billing_rate);
      const pRate = parseFloat(rateMatch.pay_rate);
      return {
        billing_rate: isNaN(bRate) ? 0.00 : bRate,
        pay_rate: isNaN(pRate) ? 0.00 : pRate,
        currency: rateMatch.currency || 'CAD',
        is_configured: true
      };
    }
    return { billing_rate: 0.00, pay_rate: 0.00, currency: 'CAD', is_configured: false };
  };

  // Helper: Derive Mon-Sun date map from selected Sunday weekEnded
  const getWeekDateMap = (weekEndingStr) => {
    if (!weekEndingStr) return {};
    const end = new Date(weekEndingStr + 'T12:00:00');
    if (isNaN(end.getTime())) return {};
    const map = {};
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (let idx = 0; idx < 7; idx++) {
      const offset = 6 - idx; // Mon = end - 6 days, Sun = end - 0 days
      const d = new Date(end);
      d.setDate(d.getDate() - offset);
      map[days[idx]] = d.toISOString().substring(0, 10);
    }
    return map;
  };

  // Synchronize when selectedRepId or weekEnded changes
  useEffect(() => {
    const selectedUser = reps.find(r => String(r.id) === String(selectedRepId));
    if (selectedUser) {
      setServiceProvider(selectedUser.name);
      setRepNo(selectedUser.rep_id || selectedUser.id);
    }

    // Check for saved draft in localStorage or saved entities
    const draftKey = `ids_pulse_integrity_weekly_timesheet_${selectedRepId}_${weekEnded}`;
    const localSaved = localStorage.getItem(draftKey);
    const dbSaved = (getEntities('weeklyTimesheets') || []).find(w => w.rep_id === selectedRepId && w.weekEnded === weekEnded);

    const savedSheet = localSaved ? JSON.parse(localSaved) : dbSaved;

    if (savedSheet) {
      setRows(savedSheet.rows || []);
      setExpenses(savedSheet.expenses || []);
      setGstHstNo(savedSheet.gstHstNo || '');
      setCurrency(savedSheet.currency || 'CAD');
      if (savedSheet.approvalInfo) setApprovalInfo(savedSheet.approvalInfo);
      return;
    }

    // Auto-populate from real timeEntries & expenseEntries
    const weekMap = getWeekDateMap(weekEnded);
    const weekDates = Object.values(weekMap);

    // 1. Time Entries grouping by supplier
    const repTime = (timeEntries || []).filter(t => t && String(t.rep_id) === String(selectedRepId) && weekDates.includes(t.date));

    // Group by supplier_id
    const supplierGroups = {};
    repTime.forEach(t => {
      const sId = t.supplier_id || 'admin';
      if (!supplierGroups[sId]) {
        supplierGroups[sId] = [];
      }
      supplierGroups[sId].push(t);
    });

    const generatedRows = [];
    let rowIdCounter = 1;

    Object.keys(supplierGroups).forEach(sId => {
      const group = supplierGroups[sId];
      const supObj = suppliers.find(s => s.id === sId || s.name === sId);
      const clientName = supObj ? supObj.name : (sId === 'admin' ? 'Administration' : sId);
      const plant = group[0]?.plant_id || (plants.find(p => p.supplier_id === sId)?.name || '');
      const rateInfo = getRepSupplierRatesHelper(selectedRepId, sId, plant);

      const rowObj = {
        id: rowIdCounter++,
        supplier_id: sId,
        clientName,
        plant,
        description: group.map(g => g.notes || g.description).filter(Boolean).join('; ') || '',
        mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '',
        payRate: rateInfo.pay_rate,
        is_configured: rateInfo.is_configured,
        currency: rateInfo.currency
      };

      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(dayKey => {
        const dayDate = weekMap[dayKey];
        const daySum = group.filter(g => g.date === dayDate).reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);
        if (daySum > 0) rowObj[dayKey] = String(daySum);
      });

      generatedRows.push(rowObj);
    });

    if (generatedRows.length === 0) {
      // Default empty row
      generatedRows.push({
        id: 1,
        supplier_id: '',
        clientName: 'Administration',
        plant: '',
        description: '',
        mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '',
        payRate: 0.00,
        is_configured: false,
        currency: 'CAD'
      });
    }

    setRows(generatedRows);

    // 2. Expenses Auto-Population (Approved expenseEntries + Mileage from timeEntries)
    const generatedExpenses = [];
    let expIdCounter = 1;

    // Filter approved expenses
    const repExpenses = (expenseEntries || []).filter(e => e && String(e.rep_id) === String(selectedRepId) && weekDates.includes(e.date) && (e.status === 'approved' || e.status === 'approved_admin' || e.status === 'approved_customer'));

    repExpenses.forEach(exp => {
      const supObj = suppliers.find(s => s.id === exp.supplier_id);
      generatedExpenses.push({
        id: expIdCounter++,
        date: exp.date,
        clientName: supObj ? supObj.name : (exp.supplier_id || 'General Operations'),
        plant: exp.plant_id || '',
        category: exp.category || 'Supplies',
        description: exp.description || exp.notes || 'Reimbursable expense',
        amount: String(exp.amount || 0),
        receipt_url: exp.media_url || exp.receipt_url || ''
      });
    });

    // Extract mileage from timeEntries
    repTime.forEach(t => {
      if (t.mileage_km && parseFloat(t.mileage_km) > 0) {
        const mCost = (parseFloat(t.mileage_km) * CONFIG_MILEAGE_RATE).toFixed(2);
        const supObj = suppliers.find(s => s.id === t.supplier_id);
        generatedExpenses.push({
          id: expIdCounter++,
          date: t.date,
          clientName: supObj ? supObj.name : (t.supplier_id || 'IDS Travel'),
          plant: t.plant_id || '',
          category: 'Mileage',
          description: `Mileage claim: ${t.mileage_km} km @ $${CONFIG_MILEAGE_RATE}/km`,
          amount: mCost,
          receipt_url: ''
        });
      }
    });

    setExpenses(generatedExpenses);

    setApprovalInfo({
      preparedBy: selectedUser ? selectedUser.name : serviceProvider,
      preparedAt: new Date().toLocaleDateString(),
      reviewedBy: 'Colleen / Accounting',
      reviewedAt: new Date().toLocaleDateString(),
      approvedBy: '',
      approvedAt: '',
      status: 'Draft'
    });

  }, [selectedRepId, weekEnded, timeEntries, expenseEntries, reps]);

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
    setRows(prev => [...prev, {
      id: newId,
      clientName: '',
      plant: '',
      description: '',
      mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '',
      payRate: 0.00,
      is_configured: false,
      currency: currency
    }]);
  };

  // Remove Client Row
  const removeRow = (id) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Add Expense Row
  const addExpenseRow = () => {
    const newId = expenses.length ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
    setExpenses(prev => [...prev, { id: newId, date: weekEnded, clientName: '', plant: '', category: 'Supplies', description: '', amount: '', receipt_url: '' }]);
  };

  // Remove Expense Row
  const removeExpenseRow = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Calculations
  const calcRowTotalHours = (row) => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return days.reduce((sum, day) => sum + (parseFloat(row[day]) || 0), 0);
  };

  const calcRowTotalPay = (row) => {
    const hours = calcRowTotalHours(row);
    const rate = parseFloat(row.payRate) || 0;
    return hours * rate;
  };

  const calcDayTotal = (day) => {
    return rows.reduce((sum, row) => sum + (parseFloat(row[day]) || 0), 0);
  };

  const calcGrandTotalHours = () => {
    return rows.reduce((sum, row) => sum + calcRowTotalHours(row), 0);
  };

  const calcTotalLaborPay = () => {
    return rows.reduce((sum, row) => sum + calcRowTotalPay(row), 0);
  };

  const calcTotalExpenses = () => {
    return expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  const calcSubtotal = () => {
    return calcTotalLaborPay() + calcTotalExpenses();
  };

  const calcGstHstTax = () => {
    if (!gstHstNo || gstHstNo.trim() === '') return 0;
    return calcSubtotal() * 0.13; // 13% HST calculation
  };

  const calcTotalGrossPayWithTax = () => {
    return calcSubtotal() + calcGstHstTax();
  };

  // Save Draft Persistence Handler
  const handleSave = () => {
    const sheetData = {
      id: `weekly_sheet_${selectedRepId}_${weekEnded}`,
      rep_id: selectedRepId,
      serviceProvider,
      repNo,
      weekEnded,
      currency,
      gstHstNo,
      rows,
      expenses,
      approvalInfo,
      updated_at: new Date().toISOString()
    };

    // Save to localStorage
    const draftKey = `ids_pulse_integrity_weekly_timesheet_${selectedRepId}_${weekEnded}`;
    localStorage.setItem(draftKey, JSON.stringify(sheetData));

    // Persist entity to SharedDatabase
    saveEntity('weeklyTimesheets', sheetData);

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // Approval Handler
  const handleApprove = () => {
    const approverName = currentUser?.name || currentUser?.username || 'Super Admin';
    const updatedApproval = {
      ...approvalInfo,
      approvedBy: approverName,
      approvedAt: new Date().toLocaleString(),
      status: 'Approved'
    };
    setApprovalInfo(updatedApproval);

    // Save audit log
    saveEntity('systemLogs', {
      id: `log_approve_sheet_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: approverName,
      action: `Approved Weekly Timesheet for ${serviceProvider} (Week Ended: ${weekEnded})`
    });

    // Auto-save sheet with approval status
    const sheetData = {
      id: `weekly_sheet_${selectedRepId}_${weekEnded}`,
      rep_id: selectedRepId,
      serviceProvider,
      repNo,
      weekEnded,
      currency,
      gstHstNo,
      rows,
      expenses,
      approvalInfo: updatedApproval,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(`ids_pulse_integrity_weekly_timesheet_${selectedRepId}_${weekEnded}`, JSON.stringify(sheetData));
    saveEntity('weeklyTimesheets', sheetData);

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // QuickBooks Time (formerly TSheets) CSV Export Engine
  const handleQuickBooksExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"Employee","Date","Customer","Service Item","Hours","Billable","Notes","Rate","Total Pay"\n`;

    const weekMap = getWeekDateMap(weekEnded);
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    rows.forEach(r => {
      dayKeys.forEach(dayKey => {
        const hrs = parseFloat(r[dayKey]) || 0;
        if (hrs > 0) {
          const dateStr = weekMap[dayKey] || weekEnded;
          const rateVal = parseFloat(r.payRate) || 0;
          const payVal = (hrs * rateVal).toFixed(2);
          const cleanDesc = (r.description || 'Quality Inspection Labor').replace(/"/g, '""');
          csvContent += `"${serviceProvider}","${dateStr}","${r.clientName || 'General'}","Labor / Inspection","${hrs}","Yes","${cleanDesc}","${rateVal}","${payVal}"\n`;
        }
      });
    });

    expenses.forEach(e => {
      const amt = parseFloat(e.amount) || 0;
      if (amt > 0) {
        const cleanDesc = (e.description || e.category || 'Expense').replace(/"/g, '""');
        csvContent += `"${serviceProvider}","${e.date || weekEnded}","${e.clientName || 'General'}","${e.category || 'Reimbursable Expense'}","0","Yes","${cleanDesc}","${amt}","${amt}"\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `QuickBooks_TimeActivity_${serviceProvider.replace(/\s+/g, '_')}_${weekEnded}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Real Landscape PDF Generator via jsPDF
  const handleDownloadPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
    const weekMap = getWeekDateMap(weekEnded);

    // 1. Header Logo & Title
    doc.addImage(LOGO_BASE64, 'PNG', 14, 10, 46, 11);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("INTEGRITY DRIVEN SOLUTIONS INC.", 65, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("WEEKLY TIME SHEET — QUICKBOOKS AUDIT BRIDGE", 65, 20);

    // Right Header Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text(`STATUS: ${approvalInfo.status.toUpperCase()}`, 265, 14, { align: "right" });
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 265, 19, { align: "right" });

    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.8);
    doc.line(14, 24, 265, 24);

    // 2. Metadata Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 27, 251, 16, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.rect(14, 27, 251, 16, "D");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("SERVICE PROVIDER:", 18, 33);
    doc.text("REP NO:", 100, 33);
    doc.text("WEEK ENDED:", 160, 33);
    doc.text("CURRENCY / TAX ID:", 215, 33);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(String(serviceProvider), 52, 33);
    doc.text(String(repNo), 116, 33);
    doc.text(String(weekEnded), 185, 33);
    doc.text(`${currency} ${gstHstNo ? `(GST: ${gstHstNo})` : ''}`, 247, 33);

    doc.setFont("helvetica", "bold");
    doc.text("TOTAL HOURS:", 18, 39);
    doc.text("LABOR PAY:", 100, 39);
    doc.text("EXPENSES:", 160, 39);
    doc.text("GROSS PAYABLE:", 215, 39);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(14, 165, 233);
    doc.text(`${calcGrandTotalHours().toFixed(2)} hrs`, 52, 39);
    doc.text(`$${calcTotalLaborPay().toFixed(2)}`, 122, 39);
    doc.text(`$${calcTotalExpenses().toFixed(2)}`, 180, 39);
    doc.setTextColor(16, 185, 129);
    doc.setFont("helvetica", "bold");
    doc.text(`$${calcTotalGrossPayWithTax().toFixed(2)}`, 245, 39);

    // 3. Client Hours Matrix Table
    const tableBody = rows.map((r, idx) => {
      const totHrs = calcRowTotalHours(r);
      const rateVal = parseFloat(r.payRate) || 0;
      const totPay = calcRowTotalPay(r);
      const rateDisplay = r.is_configured ? `$${rateVal.toFixed(2)}` : 'Rate Not Set';

      return [
        idx + 1,
        r.clientName || 'N/A',
        r.plant || '-',
        r.description || '-',
        r.mon || '-', r.tue || '-', r.wed || '-', r.thu || '-', r.fri || '-', r.sat || '-', r.sun || '-',
        totHrs.toFixed(2),
        rateDisplay,
        `$${totPay.toFixed(2)}`
      ];
    });

    const dayHeaders = [
      `Mon (${weekMap.mon ? weekMap.mon.substring(5) : ''})`,
      `Tue (${weekMap.tue ? weekMap.tue.substring(5) : ''})`,
      `Wed (${weekMap.wed ? weekMap.wed.substring(5) : ''})`,
      `Thu (${weekMap.thu ? weekMap.thu.substring(5) : ''})`,
      `Fri (${weekMap.fri ? weekMap.fri.substring(5) : ''})`,
      `Sat (${weekMap.sat ? weekMap.sat.substring(5) : ''})`,
      `Sun (${weekMap.sun ? weekMap.sun.substring(5) : ''})`
    ];

    autoTable(doc, {
      startY: 46,
      head: [['#', 'Client Name', 'Plant', 'Description', ...dayHeaders, 'Total Hrs', 'Pay Rate', 'Total Pay']],
      body: tableBody,
      foot: [[
        '', 'TOTALS', '', '',
        calcDayTotal('mon').toFixed(2),
        calcDayTotal('tue').toFixed(2),
        calcDayTotal('wed').toFixed(2),
        calcDayTotal('thu').toFixed(2),
        calcDayTotal('fri').toFixed(2),
        calcDayTotal('sat').toFixed(2),
        calcDayTotal('sun').toFixed(2),
        calcGrandTotalHours().toFixed(2),
        '',
        `$${calcTotalLaborPay().toFixed(2)}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontSize: 7, halign: 'center' },
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5, halign: 'center' },
      bodyStyles: { fontSize: 7, textColor: [51, 65, 85] },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 40 },
        4: { cellWidth: 12, halign: 'center' },
        5: { cellWidth: 12, halign: 'center' },
        6: { cellWidth: 12, halign: 'center' },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 12, halign: 'center' },
        9: { cellWidth: 12, halign: 'center' },
        10: { cellWidth: 12, halign: 'center' },
        11: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        12: { cellWidth: 18, halign: 'right' },
        13: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14, right: 14 }
    });

    let finalY = doc.lastAutoTable.finalY + 6;

    // 4. Expenses Section Table if expenses exist
    if (expenses.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 95);
      doc.text("REIMBURSABLE EXPENSES:", 14, finalY);
      finalY += 3;

      const expBody = expenses.map(e => [
        e.date || '-',
        e.clientName || '-',
        e.category || 'Supplies',
        e.description || '-',
        `$${(parseFloat(e.amount) || 0).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: finalY,
        head: [['Date', 'Client Name', 'Category', 'Expense Description', 'Amount']],
        body: expBody,
        foot: [['', '', '', 'TOTAL REIMBURSABLE EXPENSES', `$${calcTotalExpenses().toFixed(2)}`]],
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7 },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7, textColor: [51, 65, 85] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 45 },
          2: { cellWidth: 35 },
          3: { cellWidth: 110 },
          4: { cellWidth: 36, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });

      finalY = doc.lastAutoTable.finalY + 6;
    }

    // 5. Grand Totals Summary Box & Sign-off Block
    if (finalY > 165) {
      doc.addPage();
      finalY = 20;
    }

    doc.setFillColor(248, 250, 252);
    doc.rect(14, finalY, 251, 22, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(14, finalY, 251, 22, "D");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 95);
    doc.text("PAYROLL & REIMBURSEMENT SUMMARY:", 18, finalY + 6);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Labor Hours Pay: $${calcTotalLaborPay().toFixed(2)}`, 18, finalY + 12);
    doc.text(`Expenses Total: $${calcTotalExpenses().toFixed(2)}`, 90, finalY + 12);
    doc.text(`Subtotal: $${calcSubtotal().toFixed(2)}`, 150, finalY + 12);
    if (gstHstNo) {
      doc.text(`GST/HST (13%): $${calcGstHstTax().toFixed(2)}`, 195, finalY + 12);
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(16, 185, 129);
    doc.text(`GROSS TOTAL PAYABLE: $${calcTotalGrossPayWithTax().toFixed(2)} ${currency}`, 18, finalY + 18);

    // Signature Block
    finalY += 28;
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Prepared By (Field Rep): ${approvalInfo.preparedBy} (${approvalInfo.preparedAt})`, 18, finalY);
    doc.text(`Reviewed By (Accounting): ${approvalInfo.reviewedBy} (${approvalInfo.reviewedAt})`, 105, finalY);
    doc.text(`Approved By (Admin): ${approvalInfo.approvedBy || 'Pending'} (${approvalInfo.approvedAt || '-'})`, 190, finalY);

    doc.setDrawColor(148, 163, 184);
    doc.line(18, finalY + 2, 85, finalY + 2);
    doc.line(105, finalY + 2, 175, finalY + 2);
    doc.line(190, finalY + 2, 255, finalY + 2);

    doc.save(`Integrity_Weekly_Timesheet_${serviceProvider.replace(/\s+/g, '_')}_Week_${weekEnded}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Top Action & Information Header Bar */}
      <div className="bg-surface-elevated border border-border-subtle p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Integrity Weekly Time Sheet (Live QuickBooks Bridge)
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Connected to live timeEntries & expenseEntries. Auto-fills matrix from real logged rep hours.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {saveSuccessMsg && (
            <span className="text-xs font-bold text-emerald-500 animate-pulse flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Saved & Persisted!
            </span>
          )}

          <button
            onClick={handleSave}
            className="px-3.5 py-2 bg-surface hover:bg-surface-elevated border border-border-subtle text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Save className="w-4 h-4 text-emerald-500" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handleApprove}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approve & Sign</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 bg-surface hover:bg-surface-elevated border border-border-subtle text-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            <span>Download Landscape PDF</span>
          </button>

          <button
            onClick={handleQuickBooksExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export QuickBooks Time (CSV)</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE / DISPLAY PAPER SHEET CONTAINER */}
      <div className="bg-white text-slate-900 border border-slate-300 rounded-xl p-6 sm:p-8 shadow-md font-sans text-xs max-w-6xl mx-auto w-full print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* PHYSICAL PAPER HEADER */}
        <div className="flex flex-col gap-4 border-b border-slate-400 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img src={LOGO_BASE64} alt="Integrity Logo" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-sm font-extrabold tracking-wide uppercase text-slate-900">Integrity Driven Solutions Inc.</h1>
                <h2 className="text-xs font-semibold text-slate-700">Weekly Time Sheet (QuickBooks Bridge)</h2>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${approvalInfo.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                {approvalInfo.status}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-slate-500">Live Database Synced</span>
            </div>
          </div>

          {/* TOP METADATA FORM FIELDS (REP SELECTOR, RATE, WEEK ENDED) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left Box */}
            <div className="border border-slate-400 p-3 rounded bg-slate-50/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 w-32">Service Provider:</span>
                <select
                  value={selectedRepId}
                  onChange={(e) => setSelectedRepId(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 w-52 font-bold bg-white text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  {reps.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (REP #{r.rep_id || r.id})
                    </option>
                  ))}
                  {reps.length === 0 && <option value="24">Donna Cabral (REP #24)</option>}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 w-32">Currency:</span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs font-bold bg-white text-slate-900 focus:outline-none w-52"
                >
                  <option value="CAD">CAD ($ - Canadian Dollar)</option>
                  <option value="USD">USD ($ - US Dollar)</option>
                </select>
              </div>
            </div>

            {/* Right Box */}
            <div className="border border-slate-400 p-3 rounded bg-slate-50/50 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 w-36">REP No (Auto):</span>
                <input
                  type="text"
                  readOnly
                  value={repNo}
                  className="border border-slate-300 rounded px-2 py-1 w-52 font-mono text-center font-bold bg-slate-100 text-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 w-36">For Week Ended (Sun):</span>
                <input
                  type="date"
                  value={weekEnded}
                  onChange={(e) => setWeekEnded(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 w-52 font-bold bg-white text-slate-900 focus:outline-none focus:border-blue-500 text-center shadow-sm"
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
                <th className="p-1.5 border-r border-slate-300 text-left min-w-[140px]">Description</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Mon</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Tue</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Wed</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Thu</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Fri</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Sat</th>
                <th className="p-1.5 border-r border-slate-300 w-11">Sun</th>
                <th className="p-1.5 border-r border-slate-300 w-14 bg-slate-100 font-extrabold">Total Hrs</th>
                <th className="p-1.5 border-r border-slate-300 w-24 text-right">Pay Rate</th>
                <th className="p-1.5 border-r border-slate-300 w-24 text-right bg-emerald-50">Total Pay</th>
                <th className="p-1 border-r border-slate-300 w-7 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const totalHours = calcRowTotalHours(row);
                const totalPay = calcRowTotalPay(row);

                return (
                  <tr key={row.id} className="border-b border-slate-300 hover:bg-slate-50 transition-colors">
                    <td className="p-1 text-center border-r border-slate-300 font-bold text-slate-600 bg-slate-50/50">{index + 1}</td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={row.clientName}
                        onChange={(e) => updateRow(row.id, 'clientName', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 font-semibold text-slate-900 focus:bg-amber-50 focus:outline-none"
                        placeholder="Client / Supplier Name"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={row.plant}
                        onChange={(e) => updateRow(row.id, 'plant', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                        placeholder="Plant"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                        placeholder="Activity Notes"
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
                      {totalHours > 0 ? totalHours.toFixed(2) : ''}
                    </td>

                    <td className="p-1 text-right border-r border-slate-300 font-mono">
                      {row.is_configured ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-slate-500">$</span>
                          <input
                            type="text"
                            value={row.payRate}
                            onChange={(e) => updateRow(row.id, 'payRate', e.target.value)}
                            className="w-16 text-right font-bold bg-transparent focus:bg-amber-50 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300 inline-block">
                          Rate Not Set
                        </span>
                      )}
                    </td>

                    <td className="p-1 text-right font-mono font-bold border-r border-slate-300 bg-emerald-50 text-emerald-800">
                      ${totalPay.toFixed(2)}
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
                <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase tracking-wider font-extrabold">Total Hours & Labor Pay</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('mon').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('tue').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('wed').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('thu').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('fri').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('sat').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono">{calcDayTotal('sun').toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300 font-mono text-xs bg-amber-100 font-extrabold text-slate-900">{calcGrandTotalHours().toFixed(2)}</td>
                <td className="p-1.5 border-r border-slate-300"></td>
                <td className="p-1.5 border-r border-slate-300 font-mono text-xs bg-emerald-200 font-extrabold text-emerald-950">${calcTotalLaborPay().toFixed(2)}</td>
                <td className="print:hidden"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="flex items-center justify-between mb-6 print:hidden">
          <button
            onClick={addRow}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client Row</span>
          </button>
        </div>

        {/* EXPENSES SECTION */}
        <div className="border border-slate-400 p-4 rounded bg-slate-50/40 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-300 pb-2">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">GST/HST No (Optional):</span>
              <input
                type="text"
                value={gstHstNo}
                onChange={(e) => setGstHstNo(e.target.value)}
                placeholder="e.g. 123456789 RT0001"
                className="border border-slate-300 rounded px-2.5 py-1 w-52 font-mono bg-white text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>
            <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Reimbursable Expenses Log
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 rounded">
            <table className="w-full text-left text-[11px] border-collapse bg-white text-slate-900">
              <thead>
                <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-300 text-center">
                  <th className="p-1.5 border-r border-slate-300 text-left w-24">Date</th>
                  <th className="p-1.5 border-r border-slate-300 text-left w-36">Client Name</th>
                  <th className="p-1.5 border-r border-slate-300 text-left w-32">Category</th>
                  <th className="p-1.5 border-r border-slate-300 text-left">Expense Description</th>
                  <th className="p-1.5 border-r border-slate-300 text-left w-28">Receipt Link</th>
                  <th className="p-1.5 border-r border-slate-300 w-28 text-right pr-3">Total $</th>
                  <th className="p-1 w-7 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id} className="border-b border-slate-200 hover:bg-slate-50">
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
                      <select
                        value={exp.category}
                        onChange={(e) => updateExpense(exp.id, 'category', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 font-semibold focus:bg-amber-50 focus:outline-none"
                      >
                        <option value="Fuel">Fuel</option>
                        <option value="Mileage">Mileage</option>
                        <option value="Meals">Meals</option>
                        <option value="Parking">Parking</option>
                        <option value="Tolls">Tolls</option>
                        <option value="Phone">Phone</option>
                        <option value="Supplies">Supplies</option>
                      </select>
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        value={exp.description}
                        onChange={(e) => updateExpense(exp.id, 'description', e.target.value)}
                        className="w-full bg-transparent px-1 py-0.5 text-slate-900 focus:bg-amber-50 focus:outline-none"
                      />
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {exp.receipt_url ? (
                        <a
                          href={exp.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-semibold flex items-center gap-1 text-[10px]"
                        >
                          <Paperclip className="w-3 h-3 text-blue-500" /> View Receipt
                        </a>
                      ) : (
                        <input
                          type="text"
                          placeholder="Receipt URL..."
                          value={exp.receipt_url || ''}
                          onChange={(e) => updateExpense(exp.id, 'receipt_url', e.target.value)}
                          className="w-full bg-transparent px-1 py-0.5 text-slate-500 text-[10px] focus:bg-amber-50 focus:outline-none"
                        />
                      )}
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
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-slate-400 italic">No reimbursable expenses logged for this week.</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                  <td colSpan={5} className="p-1.5 border-r border-slate-300 text-right uppercase">Total Reimbursable Expenses:</td>
                  <td className="p-1.5 text-right pr-3 font-mono font-extrabold text-slate-900">${calcTotalExpenses().toFixed(2)}</td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="flex items-center justify-between print:hidden">
            <button
              onClick={addExpenseRow}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Add Expense Row</span>
            </button>
          </div>
        </div>

        {/* SUMMARY PAYROLL FOOTER */}
        <div className="mt-6 pt-4 border-t-2 border-slate-800 flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Approval & Authorization Status</span>
            <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-300 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Prepared By:</span>
                <span className="font-bold text-slate-900">{approvalInfo.preparedBy}</span>
                <span className="text-[10px] text-slate-500">({approvalInfo.preparedAt})</span>
              </div>

              <div className="h-4 w-px bg-slate-300"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Reviewed By:</span>
                <input
                  type="text"
                  value={approvalInfo.reviewedBy}
                  onChange={(e) => setApprovalInfo(prev => ({ ...prev, reviewedBy: e.target.value }))}
                  className="border-b border-slate-400 bg-transparent px-1 font-bold text-slate-900 focus:outline-none w-36"
                />
              </div>

              <div className="h-4 w-px bg-slate-300"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">Approved By:</span>
                <span className="font-bold text-blue-700">{approvalInfo.approvedBy || 'Pending Admin Sign-off'}</span>
                {approvalInfo.approvedAt && <span className="text-[10px] text-slate-500">({approvalInfo.approvedAt})</span>}
              </div>
            </div>
          </div>

          <div className="bg-slate-100 border border-slate-300 p-4 rounded-xl flex flex-col gap-1.5 text-right min-w-[260px] shadow-sm">
            <div className="flex justify-between gap-4 text-[11px]">
              <span className="text-slate-600 font-medium">Labor Hours Pay:</span>
              <span className="font-mono font-bold">${calcTotalLaborPay().toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px]">
              <span className="text-slate-600 font-medium">Reimbursable Expenses:</span>
              <span className="font-mono font-bold">${calcTotalExpenses().toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px] border-t border-slate-200 pt-1">
              <span className="text-slate-700 font-bold">Subtotal:</span>
              <span className="font-mono font-bold">${calcSubtotal().toFixed(2)}</span>
            </div>

            {gstHstNo && (
              <div className="flex justify-between gap-4 text-[11px] text-blue-700 font-semibold">
                <span>GST/HST (13%):</span>
                <span className="font-mono">${calcGstHstTax().toFixed(2)}</span>
              </div>
            )}

            <div className="border-t-2 border-slate-400 pt-1.5 mt-1 flex justify-between gap-4 text-xs font-extrabold text-slate-900">
              <span>Gross Total Payable:</span>
              <span className="font-mono text-emerald-700 text-sm">${calcTotalGrossPayWithTax().toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
