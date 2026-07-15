import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Server, FileText, Users, Mail, DollarSign, Database, 
  Search, Filter, ChevronRight, X, Clock, CheckCircle2, UserCheck, AlertCircle, 
  FileSpreadsheet, Calendar, ArrowRight, UserPlus, MapPin, Printer, Download, Eye, Sparkles,
  Milestone, TrendingUp, FolderKanban, PlusCircle
} from 'lucide-react';
import { getEntities, saveEntity, resetDB, logSystemEvent, addProject, deleteRate } from './SharedDatabase';
import { jsPDF } from 'jspdf';
import { LOGO_BASE64 } from './LogoBase64';

export default function WebDashboard({ dbUpdateTrigger, forceRoadmapOnly = false, userRole = 'admin', currentUserRepId = '', currentUserCustomerId = '', layoutMode = 'side-by-side' }) {
  const [incidents, setIncidents] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [reworkLogs, setReworkLogs] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [expenseEntries, setExpenseEntries] = useState([]);
  const [selectedReceiptPhoto, setSelectedReceiptPhoto] = useState(null);
  const [users, setUsers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [shiftReports, setShiftReports] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [plants, setPlants] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedCurrencyFilter, setSelectedCurrencyFilter] = useState('all');

  // Quick Add Modal States
  const [showQuickAddRep, setShowQuickAddRep] = useState(false);
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [showQuickAddPlant, setShowQuickAddPlant] = useState(false);
  
  // Quick Add Rep Form State
  const [quickRepName, setQuickRepName] = useState('');
  const [quickRepEmail, setQuickRepEmail] = useState('');
  const [quickRepPhone, setQuickRepPhone] = useState('');
  const [quickRepPayCurrency, setQuickRepPayCurrency] = useState('CAD');

  // Quick Add Client Form State
  const [quickClientName, setQuickClientName] = useState('');
  const [quickClientSchedule, setQuickClientSchedule] = useState('weekly');

  // Quick Add Plant Form State
  const [quickPlantName, setQuickPlantName] = useState('');
  const [quickPlantAddress, setQuickPlantAddress] = useState('');
  const [quickPlantSupplierId, setQuickPlantSupplierId] = useState('');

  // Task Assignee State
  const [selectedTaskRepId, setSelectedTaskRepId] = useState('all');
  const [selectedDispatchRepId, setSelectedDispatchRepId] = useState('1');
  
  // New Project Form state
  const [newProjRep, setNewProjRep] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjPlant, setNewProjPlant] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjStartDate, setNewProjStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [newProjBilling, setNewProjBilling] = useState('');
  const [newProjPay, setNewProjPay] = useState('');
  const [newProjCurrency, setNewProjCurrency] = useState('USD');
  
  // Navigation & Date Navigation Filtering
  const [activeTab, setActiveTab] = useState('projects');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('2026-06-01');
  const [showAllDates, setShowAllDates] = useState(false);
  
  // Accounting Sub-tab Navigation
  const [accountingSubTab, setAccountingSubTab] = useState('log-hours');
  
  // Log Hours Form Inputs
  const [logHoursRepId, setLogHoursRepId] = useState('rep_hugo');
  const [logHoursSupplierId, setLogHoursSupplierId] = useState('autokabel');
  const [logHoursDate, setLogHoursDate] = useState(new Date().toISOString().substring(0, 10));
  const [logHoursQty, setLogHoursQty] = useState('');
  const [logHoursMileage, setLogHoursMileage] = useState('');
  const [logHoursNotes, setLogHoursNotes] = useState('');

  // Log Expense Form Inputs
  const [logExpRepId, setLogExpRepId] = useState('rep_hugo');
  const [logExpSupplierId, setLogExpSupplierId] = useState('autokabel');
  const [logExpDate, setLogExpDate] = useState(new Date().toISOString().substring(0, 10));
  const [logExpCategory, setLogExpCategory] = useState('Fuel');
  const [logExpAmount, setLogExpAmount] = useState('');
  const [logExpNotes, setLogExpNotes] = useState('');

  // Rates Overrides State
  const [configRepId, setConfigRepId] = useState('rep_hugo');
  const [configSupplierId, setConfigSupplierId] = useState('autokabel');
  const [configPayRate, setConfigPayRate] = useState('25');
  const [configBillingRate, setConfigBillingRate] = useState('35');
  const [rates, setRates] = useState([]);

  // Invoicing States
  const [selectedInvoiceSupplier, setSelectedInvoiceSupplier] = useState('autokabel');
  const [selectedInvoiceCurrency, setSelectedInvoiceCurrency] = useState('all');

  // Extra Hours Requests State
  const [extraHoursRequests, setExtraHoursRequests] = useState([]);
  const [extraHoursQty, setExtraHoursQty] = useState('8.0');
  const [extraHoursDate, setExtraHoursDate] = useState(new Date().toISOString().substring(0, 10));
  const [extraHoursReason, setExtraHoursReason] = useState('');
  const [extraHoursSupplierId, setExtraHoursSupplierId] = useState('autokabel');
  const [extraHoursPlantId, setExtraHoursPlantId] = useState('mercedes_tuscaloosa');
  const [selectedEditingRequestId, setSelectedEditingRequestId] = useState(null);
  
  // Comments for Approval workflows
  const [customerApprovalComment, setCustomerApprovalComment] = useState('');
  const [adminApprovalComment, setAdminApprovalComment] = useState('');

  // Admin CRUD tabs
  const [adminCrudTab, setAdminCrudTab] = useState('customers');
  // CRUD states
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerContactName, setNewCustomerContactName] = useState('');
  const [newCustomerContactEmail, setNewCustomerContactEmail] = useState('');
  const [newCustomerContactRole, setNewCustomerContactRole] = useState('Quality Manager');

  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationHours, setNewLocationHours] = useState('10');
  const [newLocationRepId, setNewLocationRepId] = useState('rep_hugo');
  const [newLocationBillRate, setNewLocationBillRate] = useState('35');
  const [newLocationSupplierId, setNewLocationSupplierId] = useState('autokabel');

  const [newRepName, setNewRepName] = useState('');
  const [newRepEmail, setNewRepEmail] = useState('');
  const [newRepPhone, setNewRepPhone] = useState('');
  const [newRepPayCurrency, setNewRepPayCurrency] = useState('CAD');

  // Load rates and extra hours requests from database on mount and update
  useEffect(() => {
    setRates(getEntities('rates') || []);
    setExtraHoursRequests(getEntities('extraHoursRequests') || []);
  }, [dbUpdateTrigger]);

  // Dynamic Rate Override Resolver with Plant/Location scoping and active session role protection
  const getRepSupplierRates = (rep_id, supplier_id, plant_id = '') => {
    const role = sessionStorage.getItem('ids_pulse_role') || 'rep';
    const isAdmin = ['admin', 'owner', 'accountant', 'lead', 'shahroz'].includes(role);
    if (!isAdmin) {
      return { billing_rate: 0, pay_rate: 0, currency: 'USD' };
    }

    const dbProjects = getEntities('projects') || [];
    const projMatch = dbProjects.find(p => p && p.rep_id === rep_id && p.client_id === supplier_id && (!plant_id || p.plant_id === plant_id));
    if (projMatch) {
      return {
        billing_rate: parseFloat(projMatch.billing_rate) || 28.00,
        pay_rate: parseFloat(projMatch.pay_rate) || 20.00,
        currency: projMatch.currency || 'USD'
      };
    }
    const dbRates = getEntities('rates') || [];
    const match = dbRates.find(r => r && r.rep_id === rep_id && r.supplier_id === supplier_id && (!plant_id || r.plant_id === plant_id));
    if (match) {
      const bRate = parseFloat(match.billing_rate);
      const pRate = parseFloat(match.pay_rate);
      return {
        billing_rate: isNaN(bRate) ? 28.00 : bRate,
        pay_rate: isNaN(pRate) ? 20.00 : pRate,
        currency: 'USD'
      };
    }
    return { billing_rate: 28.00, pay_rate: 20.00, currency: 'USD' };
  };

  const getRepPayCurrency = (rep_id) => {
    const rep = users.find(u => u && u.id === rep_id);
    if (rep && rep.pay_currency) {
      return rep.pay_currency;
    }
    if (rep_id === 'rep_hugo' || rep_id === 'rep_nabil' || rep_id === 'rep_rogelio') {
      return 'USD';
    }
    return 'CAD';
  };

  // Look up project currency for expenses based on rep & supplier combination
  const getExpenseCurrency = (exp) => {
    const dbProjects = getEntities('projects') || [];
    const projMatch = dbProjects.find(p => p && p.rep_id === exp.rep_id && p.client_id === exp.supplier_id);
    if (projMatch) {
      return projMatch.currency || 'USD';
    }
    return 'USD';
  };

  // Submit handers
  const handleLogHoursSubmit = (e) => {
    e.preventDefault();
    if (!logHoursQty || parseFloat(logHoursQty) <= 0) {
      alert("Please enter a valid amount of hours.");
      return;
    }
    const newEntry = {
      id: `te_${Date.now()}`,
      rep_id: logHoursRepId,
      supplier_id: logHoursSupplierId,
      plant_id: suppliers.find(s => s.id === logHoursSupplierId)?.plants_served?.[0] || 'gm_oshawa',
      date: logHoursDate,
      hours: parseFloat(logHoursQty),
      mileage_km: parseFloat(logHoursMileage || 0),
      notes: logHoursNotes,
      invoiced: false,
      created_at: new Date().toISOString()
    };
    saveEntity('timeEntries', newEntry);
    setTimeEntries(getEntities('timeEntries'));
    setLogHoursQty('');
    setLogHoursMileage('');
    setLogHoursNotes('');
    alert("Hours logged successfully!");
  };

  const handleLogExpenseSubmit = (e) => {
    e.preventDefault();
    if (!logExpAmount || parseFloat(logExpAmount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }
    const newEntry = {
      id: `exp_${Date.now()}`,
      rep_id: logExpRepId,
      supplier_id: logExpSupplierId,
      date: logExpDate,
      category: logExpCategory,
      amount: parseFloat(logExpAmount),
      notes: logExpNotes,
      invoiced: false,
      status: 'submitted',
      created_at: new Date().toISOString()
    };
    saveEntity('expenseEntries', newEntry);
    setExpenseEntries(getEntities('expenseEntries'));
    setLogExpAmount('');
    setLogExpNotes('');
    alert("Expense claim submitted successfully!");
  };

  const handleSaveRateConfig = (e) => {
    e.preventDefault();
    const newRate = {
      id: `rate_${Date.now()}`,
      rep_id: configRepId,
      supplier_id: configSupplierId,
      billing_rate: parseFloat(configBillingRate),
      pay_rate: parseFloat(configPayRate)
    };
    saveEntity('rates', newRate);
    setRates(getEntities('rates'));
    const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
    logSystemEvent('system', 'save_rate', `${user} configured custom rate for Rep ${configRepId} serving client ${configSupplierId} (Bill: $${configBillingRate}, Pay: $${configPayRate}).`);
    alert("Custom rate override saved successfully!");
  };

  const handleDeleteRate = (rateId) => {
    deleteRate(rateId);
    setRates(getEntities('rates') || []);
    const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
    logSystemEvent('system', 'delete_rate', `${user} deleted custom rate override configuration ID ${rateId}.`);
  };

  const handleMarkAsInvoiced = (clientEntries, clientExpenses) => {
    clientEntries.forEach(entry => {
      entry.invoiced = true;
      saveEntity('timeEntries', entry);
    });
    clientExpenses.forEach(exp => {
      exp.invoiced = true;
      saveEntity('expenseEntries', exp);
    });
    setTimeEntries(getEntities('timeEntries'));
    setExpenseEntries(getEntities('expenseEntries'));
    alert("Marked as invoiced!");
  };

  const handleExportClientQuickBooks = (clientEntries) => {
    if (selectedInvoiceCurrency === 'all') {
      alert("Please select a specific Billing Currency (CAD or USD) to export separate timesheets.");
      return;
    }
    let csv = "Date,Name,Customer:Job,Service Item,Duration,Notes,Billing Status\n";
    clientEntries.forEach(entry => {
      const repName = users.find(u => u.id === entry.rep_id)?.name || 'Rep';
      const clientName = suppliers.find(s => s.id === entry.supplier_id)?.name || 'Client';
      const date = entry.date;
      const duration = entry.hours;
      const notes = entry.notes || 'Shift sorting log';
      csv += `"${date}","${repName}","${clientName}","Standard Sorting Support","${duration}","${notes}","Billable"\n`;
    });
    const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
    logSystemEvent('payroll', 'quickbooks_export', `${user} exported QuickBooks CSV timesheets for supplier ${selectedInvoiceSupplier}.`);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `QuickBooks_Export_${selectedInvoiceSupplier}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateClientInvoicePDF = (client, dateRangeStr, clientEntries, clientExpenses) => {
    if (selectedInvoiceCurrency === 'all') {
      alert("Please select a specific Billing Currency (CAD or USD) to print separate statements for the client.");
      return;
    }
    const curSymbol = selectedInvoiceCurrency === 'CAD' ? 'C$' : 'US$';
    try {
      const doc = new jsPDF();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("INVOICE", 14, 20);

      doc.setFontSize(10);
      doc.setFont("Helvetica", "normal");
      doc.text("Integrity Driven Solutions Inc. (IDS)", 14, 28);
      doc.text("Email: billing@integritydriven.com | Web: www.integritydriven.com", 14, 33);

      doc.setFont("Helvetica", "bold");
      doc.text("BILL TO:", 14, 45);
      doc.setFont("Helvetica", "normal");
      doc.text(client?.name || 'Unknown Client', 14, 50);
      doc.text("Billing Schedule: " + (client?.invoice_schedule || 'weekly').toUpperCase(), 14, 55);

      doc.setFont("Helvetica", "bold");
      doc.text("INVOICE DETAILS:", 120, 45);
      doc.setFont("Helvetica", "normal");
      doc.text("Invoice Period: " + dateRangeStr, 120, 50);
      doc.text("Date Generated: " + new Date().toLocaleDateString(), 120, 55);

      let y = 70;
      doc.setFillColor(30, 41, 59);
      doc.rect(14, y, 182, 8, "F");
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Item Description", 16, y + 5);
      doc.text("Hours / Qty", 100, y + 5);
      doc.text("Rate", 130, y + 5);
      doc.text("Subtotal", 160, y + 5);

      y += 12;
      doc.setTextColor(0, 0, 0);
      doc.setFont("Helvetica", "normal");

      let totalBill = 0;

      clientEntries.forEach(entry => {
        const repName = users.find(u => u.id === entry.rep_id)?.name || 'Rep';
        const { billing_rate } = getRepSupplierRates(entry.rep_id, entry.supplier_id, entry.plant_id);
        const sub = entry.hours * billing_rate;
        totalBill += sub;
        
        const descText = `${repName} - Hours worked (${entry.date})`;
        const wrappedDesc = doc.splitTextToSize(descText, 80);
        
        doc.text(wrappedDesc[0] || '', 16, y);
        doc.text(`${entry.hours} hrs`, 100, y);
        doc.text(`${curSymbol}${billing_rate.toFixed(2)}/hr`, 130, y);
        doc.text(`${curSymbol}${sub.toFixed(2)}`, 160, y);
        
        for (let k = 1; k < wrappedDesc.length; k++) {
          y += 5;
          doc.text(wrappedDesc[k], 16, y);
        }
        y += 8;
      });

      clientEntries.forEach(entry => {
        if (entry.mileage_km > 0) {
          const repName = users.find(u => u.id === entry.rep_id)?.name || 'Rep';
          const sub = entry.mileage_km * 0.73;
          totalBill += sub;
          
          const descText = `${repName} - Travel Mileage (${entry.date})`;
          const wrappedDesc = doc.splitTextToSize(descText, 80);
          
          doc.text(wrappedDesc[0] || '', 16, y);
          doc.text(`${entry.mileage_km} km`, 100, y);
          doc.text(`${curSymbol}0.73/km`, 130, y);
          doc.text(`${curSymbol}${sub.toFixed(2)}`, 160, y);
          
          for (let k = 1; k < wrappedDesc.length; k++) {
            y += 5;
            doc.text(wrappedDesc[k], 16, y);
          }
          y += 8;
        }
      });

      clientExpenses.forEach(exp => {
        const repName = users.find(u => u.id === exp.rep_id)?.name || 'Rep';
        const sub = parseFloat(exp.amount || 0);
        totalBill += sub;
        
        const descText = `${repName} - Reimbursement (${exp.category}: ${exp.notes})`;
        const wrappedDesc = doc.splitTextToSize(descText, 80);
        
        doc.text(wrappedDesc[0] || '', 16, y);
        doc.text(`1 qty`, 100, y);
        doc.text(`${curSymbol}${sub.toFixed(2)}`, 130, y);
        doc.text(`${curSymbol}${sub.toFixed(2)}`, 160, y);
        
        for (let k = 1; k < wrappedDesc.length; k++) {
          y += 5;
          doc.text(wrappedDesc[k], 16, y);
        }
        y += 8;
      });

      y += 5;
      doc.line(14, y, 196, y);
      y += 8;
      doc.setFont("Helvetica", "bold");
      doc.text("TOTAL DUE:", 120, y);
      doc.text(`${curSymbol}${totalBill.toFixed(2)}`, 160, y);

      const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
      logSystemEvent('payroll', 'invoice_export', `${user} generated client billing invoice PDF for ${client.name}.`);
      doc.save(`Invoice_${client.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error generating PDF: " + err.message);
    }
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustomerName) {
      alert("Customer name is required.");
      return;
    }
    const newId = newCustomerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCust = {
      id: newId,
      name: newCustomerName,
      invoice_schedule: 'weekly',
      contacts: [
        { name: newCustomerContactName, email: newCustomerContactEmail, role: newCustomerContactRole }
      ],
      plants_served: []
    };
    saveEntity('suppliers', newCust);
    setSuppliers(getEntities('suppliers'));
    const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
    logSystemEvent('system', 'create_customer', `${user} onboarded new client/supplier ${newCustomerName} with contact ${newCustomerContactName}.`);
    setNewCustomerName('');
    setNewCustomerAddress('');
    setNewCustomerContactName('');
    setNewCustomerContactEmail('');
    alert("Customer created successfully!");
  };

  const handleCreateLocation = (e) => {
    e.preventDefault();
    if (!newLocationName) {
      alert("Location name is required.");
      return;
    }
    const newId = newLocationName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newPlant = {
      id: newId,
      name: newLocationName,
      address: newLocationAddress,
      oem_brand: newLocationName.split(' ')[0] || 'OEM'
    };
    saveEntity('plants', newPlant);
    
    const sup = suppliers.find(s => s.id === newLocationSupplierId);
    if (sup) {
      if (!sup.plants_served.includes(newId)) {
        sup.plants_served.push(newId);
        saveEntity('suppliers', sup);
        setSuppliers(getEntities('suppliers'));
      }
    }

    const newRate = {
      id: `rate_${Date.now()}`,
      rep_id: newLocationRepId,
      supplier_id: newLocationSupplierId,
      plant_id: newId,
      billing_rate: parseFloat(newLocationBillRate),
      pay_rate: 20.00
    };
    saveEntity('rates', newRate);
    setRates(getEntities('rates'));
    
    const userLoc = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
    logSystemEvent('system', 'create_location', `${userLoc} created plant location ${newLocationName} mapped to supplier ${newLocationSupplierId}.`);

    setNewLocationName('');
    setNewLocationAddress('');
    alert("Location created and mapped successfully!");
  };

  const handleCreateRep = (e) => {
    e.preventDefault();
    if (!newRepName) {
      alert("Representative name is required.");
      return;
    }
    const newId = `rep_${newRepName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const newRep = {
      id: newId,
      name: newRepName,
      email: newRepEmail,
      role: 'rep',
      phone: newRepPhone,
      pay_currency: newRepPayCurrency,
      avatar: newRepName.split(' ').map(n => n[0]).join('').toUpperCase()
    };
    saveEntity('users', newRep);
    setUsers(getEntities('users'));
    
    const userRep = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
    logSystemEvent('system', 'create_representative', `${userRep} onboarded representative ${newRepName} (${newRepPayCurrency}).`);

    setNewRepName('');
    setNewRepEmail('');
    setNewRepPhone('');
    setNewRepPayCurrency('CAD');
    alert("Representative onboarding successful!");
  };

  const handleQuickAddRepSubmit = (e) => {
    if (e) e.preventDefault();
    if (!quickRepName) {
      alert("Representative name is required.");
      return;
    }
    const newId = `rep_${quickRepName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const newRep = {
      id: newId,
      name: quickRepName,
      email: quickRepEmail,
      role: 'rep',
      phone: quickRepPhone,
      pay_currency: quickRepPayCurrency,
      avatar: quickRepName.split(' ').map(n => n[0]).join('').toUpperCase()
    };
    saveEntity('users', newRep);
    setUsers(getEntities('users'));
    const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
    logSystemEvent('system', 'quick_add_rep', `${user} quick-added representative ${quickRepName}.`);
    setQuickRepName('');
    setQuickRepEmail('');
    setQuickRepPhone('');
    setQuickRepPayCurrency('CAD');
    setShowQuickAddRep(false);
    
    // Auto-select in registry & matrix overrides
    setNewProjRep(newId);
    setConfigRepId(newId);
    setSelectedDispatchRepId(newId);
    
    alert(`Representative ${quickRepName} added successfully!`);
  };

  const handleQuickAddClientSubmit = (e) => {
    if (e) e.preventDefault();
    if (!quickClientName) {
      alert("Client name is required.");
      return;
    }
    const newId = quickClientName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCust = {
      id: newId,
      name: quickClientName,
      invoice_schedule: quickClientSchedule,
      contacts: [],
      plants_served: []
    };
    saveEntity('suppliers', newCust);
    setSuppliers(getEntities('suppliers'));
    setQuickClientName('');
    setQuickClientSchedule('weekly');
    setShowQuickAddClient(false);

    // Auto-select
    setNewProjClient(newId);
    setConfigSupplierId(newId);
    setSelectedInvoiceSupplier(newId);
    
    alert(`Client ${quickClientName} added successfully!`);
  };

  const handleQuickAddPlantSubmit = (e) => {
    if (e) e.preventDefault();
    if (!quickPlantName) {
      alert("Plant name is required.");
      return;
    }
    const newId = quickPlantName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newPlant = {
      id: newId,
      name: quickPlantName,
      address: quickPlantAddress,
      oem_brand: quickPlantName.split(' ')[0] || 'OEM'
    };
    saveEntity('plants', newPlant);
    setPlants(getEntities('plants'));

    if (quickPlantSupplierId) {
      const sup = suppliers.find(s => s.id === quickPlantSupplierId);
      if (sup) {
        if (!sup.plants_served.includes(newId)) {
          sup.plants_served.push(newId);
          saveEntity('suppliers', sup);
          setSuppliers(getEntities('suppliers'));
        }
      }
    }

    setQuickPlantName('');
    setQuickPlantAddress('');
    setQuickPlantSupplierId('');
    setShowQuickAddPlant(false);

    // Auto-select
    setNewProjPlant(newId);
    
    alert(`Plant ${quickPlantName} added successfully!`);
  };

  const handleExtraHoursSubmit = (e) => {
    e.preventDefault();
    if (!extraHoursQty || parseFloat(extraHoursQty) <= 0) {
      alert("Enter a valid number of extra hours.");
      return;
    }

    if (selectedEditingRequestId) {
      const dbReqs = getEntities('extraHoursRequests') || [];
      const match = dbReqs.find(r => r.id === selectedEditingRequestId);
      if (match) {
        match.supplier_id = extraHoursSupplierId;
        match.plant_id = extraHoursPlantId;
        match.date = extraHoursDate;
        match.hours = parseFloat(extraHoursQty);
        match.reason = extraHoursReason;
        match.status = 'pending_customer';
        if (!match.history) match.history = [];
        match.history.push({
          status: 'pending_customer',
          user: users.find(u => u.id === currentUserRepId)?.name || 'Rep',
          timestamp: new Date().toISOString(),
          comment: 'Request revised and resubmitted for customer approval.'
        });
        saveEntity('extraHoursRequests', match);
        setSelectedEditingRequestId(null);
        setExtraHoursRequests(getEntities('extraHoursRequests'));
        setExtraHoursReason('');
        alert("Overtime request revised and resubmitted successfully!");
        return;
      }
    }

    const newReq = {
      rep_id: currentUserRepId,
      supplier_id: extraHoursSupplierId,
      plant_id: extraHoursPlantId,
      date: extraHoursDate,
      hours: parseFloat(extraHoursQty),
      reason: extraHoursReason,
      userName: users.find(u => u.id === currentUserRepId)?.name || 'Rep'
    };
    const newReqItem = {
      id: `ehr_${Date.now()}`,
      status: 'pending_customer',
      created_at: new Date().toISOString(),
      history: [{ status: 'pending_customer', user: users.find(u => u.id === currentUserRepId)?.name || 'Rep', timestamp: new Date().toISOString(), comment: 'Request submitted' }],
      ...newReq
    };
    saveEntity('extraHoursRequests', newReqItem);
    setExtraHoursRequests(getEntities('extraHoursRequests'));
    setExtraHoursReason('');
    alert("Extra hours request filed successfully! Pending Customer approval.");
  };

  const handleCustomerApproval = (reqId, statusAction) => {
    const dbReqs = getEntities('extraHoursRequests');
    const match = dbReqs.find(r => r.id === reqId);
    if (match) {
      match.status = statusAction === 'approve' ? 'pending_admin' : 'rejected_by_customer';
      match.customer_comment = customerApprovalComment;
      if (!match.history) match.history = [];
      match.history.push({
        status: match.status,
        user: suppliers.find(s => s.id === currentUserCustomerId)?.name || 'Customer Manager',
        timestamp: new Date().toISOString(),
        comment: customerApprovalComment || (statusAction === 'approve' ? 'Customer approved.' : 'Customer rejected.')
      });
      saveEntity('extraHoursRequests', match);
      setExtraHoursRequests(getEntities('extraHoursRequests'));
      const user = suppliers.find(s => s.id === currentUserCustomerId)?.name || 'Customer Manager';
      logSystemEvent('payroll', 'customer_overtime_approval', `Customer ${user} ${statusAction}d overtime request ${reqId} for ${match.hours} hrs.`);
      setCustomerApprovalComment('');
      alert(`Request ${statusAction === 'approve' ? 'Approved' : 'Rejected'}!`);
    }
  };

  const handleAdminApproval = (reqId, statusAction) => {
    const dbReqs = getEntities('extraHoursRequests');
    const match = dbReqs.find(r => r.id === reqId);
    if (match) {
      match.status = statusAction === 'approve' ? 'approved' : 'rejected_by_admin';
      match.admin_comment = adminApprovalComment;
      if (!match.history) match.history = [];
      match.history.push({
        status: match.status,
        user: 'Admin Manager',
        timestamp: new Date().toISOString(),
        comment: adminApprovalComment || (statusAction === 'approve' ? 'Admin approved.' : 'Admin rejected.')
      });
      
      if (statusAction === 'approve') {
        const newTime = {
          id: `te_${Date.now()}`,
          rep_id: match.rep_id,
          supplier_id: match.supplier_id,
          plant_id: match.plant_id,
          date: match.date,
          hours: match.hours,
          notes: `[APPROVED EXTRA HOURS]: ${match.reason}`,
          invoiced: false,
          created_at: new Date().toISOString()
        };
        saveEntity('timeEntries', newTime);
        setTimeEntries(getEntities('timeEntries'));
      }

      saveEntity('extraHoursRequests', match);
      setExtraHoursRequests(getEntities('extraHoursRequests'));
      const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
      logSystemEvent('payroll', 'admin_overtime_approval', `${user} ${statusAction}d overtime request ${reqId} for Rep ${match.rep_id}.`);
      setAdminApprovalComment('');
      alert(`Request ${statusAction === 'approve' ? 'Approved & Added to Timesheets' : 'Rejected'}!`);
    }
  };

  const handleAdminExpenseApproval = (expId, statusAction) => {
    const dbExps = getEntities('expenseEntries');
    const match = dbExps.find(e => e.id === expId);
    if (match) {
      match.status = statusAction === 'approve' ? 'approved' : 'rejected';
      saveEntity('expenseEntries', match);
      setExpenseEntries(getEntities('expenseEntries'));
      const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
      logSystemEvent('payroll', 'admin_expense_approval', `${user} ${statusAction}d expense claim ${expId} for Rep ${match.rep_id}.`);
      alert(`Expense claim ${statusAction === 'approve' ? 'Approved' : 'Rejected'}!`);
    }
  };

  const handlePublishReport = (reportId) => {
    const dbReports = getEntities('shiftReports');
    const match = dbReports.find(r => r.id === reportId);
    if (match) {
      match.status = 'published';
      saveEntity('shiftReports', match);
      setShiftReports(getEntities('shiftReports'));
      const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
      logSystemEvent('shift', 'publish_report', `${user} published shift report ${reportId} to Customer Portal.`);
      alert("Report published successfully to Customer!");
    }
  };

  // Heat Map States
  const [selectedHeatmapPart, setSelectedHeatmapPart] = useState('86286761');
  const [scrubIndex, setScrubIndex] = useState(0);
  const [hoveredDot, setHoveredDot] = useState(null);
  
  // Selected Detail View overlays
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedEmailLog, setSelectedEmailLog] = useState(null);
  const [selectedShiftReport, setSelectedShiftReport] = useState(null);
  const [selectedReworkLog, setSelectedReworkLog] = useState(null);
  const [openTooltip, setOpenTooltip] = useState(null);

  // Launch Roadmap States
  const [roadmapTeamType, setRoadmapTeamType] = useState('onshore');
  const [activeRoadmapPhase, setActiveRoadmapPhase] = useState(1);
  const [isBudgetLocked, setIsBudgetLocked] = useState(userRole !== 'shahroz');
  const [budgetPassword, setBudgetPassword] = useState('');
  const [budgetLockError, setBudgetLockError] = useState(false);
  const [isRoadmapLocked, setIsRoadmapLocked] = useState(userRole !== 'shahroz');
  const [roadmapPassword, setRoadmapPassword] = useState('');
  const [roadmapLockError, setRoadmapLockError] = useState(false);

  const getWelcomeText = (role) => {
    if (role === 'shahroz') {
      return "Welcome back, Shahroz Mirza! I am Pulse AI. As Owner, you have complete control. I can audit timesheets, verify defect metrics, run duplicate defect scans, or compile financial reports for you.";
    } else if (role === 'admin') {
      return "Welcome back, Greg Phillippe! I am Pulse AI. As Admin, I can audit timesheets for mistakes, verify defect records, and prepare compliance exports for you.";
    } else if (role === 'accountant') {
      return "Welcome back, Colleen Boyd! I am Pulse AI. As Accountant, I can verify timesheets for numerical errors, flag missing receipts, and calculate grand billing totals.";
    } else if (role === 'lead') {
      return "Welcome back, Donna Cabral! I am Pulse AI. As Quality Lead, I can audit defect logs for duplicates, verify supplier contact compliance, and analyze defect narratives.";
    } else if (role === 'qre') {
      return "Welcome, QRE Field Representative! You can log your daily hours, submit expense claims, or request approval for extra hours worked.";
    } else if (role === 'customer') {
      return "Welcome back! As a Customer partner, you can audit the weekly hours sorted at your plants, see active QRE assignments, and approve pending extra-hours requests.";
    }
    return "Welcome back! I am Pulse AI, your virtual assistant. Let me know how I can help you today.";
  };

  // Pulse AI States
  const [pulseAiChat, setPulseAiChat] = useState(() => [
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: getWelcomeText(userRole),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [pulseAiInput, setPulseAiInput] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [hasRunAudit, setHasRunAudit] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

    useEffect(() => {
    if (forceRoadmapOnly && userRole === 'shahroz') {
      setActiveTab('roadmap');
    } else {
      if (userRole === 'accountant') {
        setActiveTab('time-tracking');
      } else if (userRole === 'qre') {
        setActiveTab('time-tracking');
      } else if (userRole === 'customer') {
        setActiveTab('customer-portal');
      } else {
        setActiveTab('incidents');
      }
    }
    
    if (userRole === 'shahroz') {
      setIsRoadmapLocked(false);
      setIsBudgetLocked(false);
    } else {
      setIsRoadmapLocked(true);
      setIsBudgetLocked(true);
    }

    setPulseAiChat([
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: getWelcomeText(userRole),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [forceRoadmapOnly, userRole]);

  // Live Ontario Clock Widget
  const [currentTime, setCurrentTime] = useState(new Date());

  // Toast Notifications
  const [notifications, setNotifications] = useState([]);
  const prevIncidentsCount = useRef(null);
  const prevReworkCount = useRef(null);
  const prevShiftReportsCount = useRef(null);
  const prevShiftReportsMap = useRef(null);
  const prevExpenseEntriesCount = useRef(null);

  // Play audio notification chime using Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Chime 1: "Ding" (Higher Pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.3);
      
      // Chime 2: "Dong" (Lower Pitch, slightly delayed)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      setTimeout(() => {
        try {
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6 note
          gain2.gain.setValueAtTime(0.15, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.4);
        } catch (err) {
          console.error(err);
        }
      }, 100);
    } catch (e) {
      console.error("Audio API error:", e);
    }
  };

  const addNotification = (title, message, type = "info") => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, title, message, type }]);
    playNotificationSound();
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 6000);
  };

  // Quick Action Forms state
  const [showAssignRepModal, setShowAssignRepModal] = useState(false);
  const [assignRepName, setAssignRepName] = useState('Clarence Kuiken');
  const [assignPlant, setAssignPlant] = useState('gm_oshawa');

  // New Daily Utilities states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showHelpDrawer, setShowHelpDrawer] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(5); // 0-11
  const [calendarYear, setCalendarYear] = useState(2026);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCalendarModal(false);
      }
    };
    if (showCalendarModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCalendarModal]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load data dynamically and detect new submissions for toasts
  useEffect(() => {
    const currentInc = getEntities('incidents') || [];
    const currentRework = getEntities('reworkLogs') || [];
    const currentShift = getEntities('shiftReports') || [];
    const currentExpenses = getEntities('expenseEntries') || [];

    // Check if this is the initial data load
    if (prevIncidentsCount.current === null) {
      prevIncidentsCount.current = currentInc.length;
      prevReworkCount.current = currentRework.length;
      prevShiftReportsCount.current = currentShift.length;
      prevExpenseEntriesCount.current = currentExpenses.length;
      
      const initialMap = {};
      currentShift.forEach(sr => {
        if (sr) initialMap[sr.id] = sr.status;
      });
      prevShiftReportsMap.current = initialMap;
    } else {
      // Detect new quality incident
      if (currentInc.length > prevIncidentsCount.current) {
        const newInc = currentInc[currentInc.length - 1];
        const partPN = newInc?.parts_list?.[0]?.part_number || newInc?.part_id || 'Unknown';
        const rep = getEntities('users')?.find(u => u.id === newInc.rep_id)?.name || 'Clarence Kuiken';
        
        addNotification(
          "⚠️ New Defect Incident!",
          `${rep} reported a defect on Part #${partPN} in ${newInc.area}.`,
          "defect"
        );
        prevIncidentsCount.current = currentInc.length;
      }

      // Detect new rework entry
      if (currentRework.length > prevReworkCount.current) {
        const newRework = currentRework[currentRework.length - 1];
        const rep = getEntities('users')?.find(u => u.id === newRework.rep_id)?.name || 'Clarence Kuiken';
        addNotification(
          "🔧 Rework Entry Logged",
          `${rep} completed ${newRework.qty_reworked} pcs of Part #${newRework.part_number}.`,
          "rework"
        );
        prevReworkCount.current = currentRework.length;
      }

      // Track shift status transitions or new submissions
      const prevShiftsMap = prevShiftReportsMap.current || {};
      currentShift.forEach(sr => {
        if (!sr) return;
        const prevStatus = prevShiftsMap[sr.id];
        if (prevStatus === undefined) {
          // New shift report added
          const rep = getEntities('users')?.find(u => u.id === sr.rep_id)?.name || 'Clarence Kuiken';
          if (sr.status === 'Draft') {
            addNotification(
              "🟢 Rep Started Shift",
              `${rep} clocked in and started their shift walkthrough.`,
              "shift"
            );
            logSystemEvent('shift', 'clock_in', `${rep} clocked in and draft shift report created.`);
          } else {
            addNotification(
              "📝 Shift Report Submitted",
              `${rep} completed their shift. Total Hours: ${sr.total_hours || 8.0} hrs.`,
              "shift"
            );
            logSystemEvent('shift', 'completed', `${rep} completed their shift report walkthrough.`);
          }
        } else if (prevStatus === 'Draft' && sr.status === 'Sent') {
          // Draft was submitted/completed
          const rep = getEntities('users')?.find(u => u.id === sr.rep_id)?.name || 'Clarence Kuiken';
          addNotification(
            "📝 Shift Report Submitted",
            `${rep} completed their shift. Total Hours: ${sr.total_hours || 8.0} hrs.`,
            "shift"
          );
          logSystemEvent('shift', 'completed', `${rep} completed and sent their shift report walkthrough.`);
        }
      });
      
      // Update prevShiftReportsMap and count
      const newMap = {};
      currentShift.forEach(sr => {
        if (sr) newMap[sr.id] = sr.status;
      });
      prevShiftReportsMap.current = newMap;
      prevShiftReportsCount.current = currentShift.length;

      // Detect new expense entry
      if (currentExpenses.length > prevExpenseEntriesCount.current) {
        const newExpense = currentExpenses[currentExpenses.length - 1];
        const rep = getEntities('users')?.find(u => u.id === newExpense.rep_id)?.name || 'Clarence Kuiken';
        addNotification(
          "💵 New Expense Logged",
          `${rep} logged a ${newExpense.category} expense of $${parseFloat(newExpense.amount).toFixed(2)}.`,
          "expense"
        );
        prevExpenseEntriesCount.current = currentExpenses.length;
      }
    }

    // Set state values
    setIncidents(currentInc);
    setEmailLogs(getEntities('emailLogs') || []);
    setReworkLogs(currentRework);
    setTimeEntries(getEntities('timeEntries') || []);
    setExpenseEntries(currentExpenses);
    setUsers(getEntities('users') || []);
    setSuppliers(getEntities('suppliers') || []);
    setShiftReports(currentShift);
    setDailyTasks(getEntities('dailyTasks') || []);
    setPlants(getEntities('plants') || []);
    setProjects(getEntities('projects') || []);
  }, [dbUpdateTrigger]);

  const handleReset = () => {
    const confirmReset = window.confirm(
      "Restore Demo Seeds?\n\nThis will reset your local browser demo state back to the default settings (seed incidents, checklists, and timesheets). This is safe and only affects your current browser. Do you want to proceed?"
    );
    if (!confirmReset) return;

    resetDB();
    setSelectedIncident(null);
    setSelectedEmailLog(null);
    setSelectedShiftReport(null);
    alert('Demo database successfully restored to default seed states.');
  };

  const handleUpdateStatus = (incidentId, newStatus) => {
    const dbIncidents = getEntities('incidents');
    const found = dbIncidents.find(inc => inc.id === incidentId);
    if (found) {
      found.status = newStatus;
      saveEntity('incidents', found);
      const user = sessionStorage.getItem('ids_pulse_admin_user') || 'Admin';
      logSystemEvent('incident', 'update_status', `${user} updated incident ${incidentId} status to ${newStatus}.`);
      
      // Update local state immediately
      setIncidents(getEntities('incidents'));
      setSelectedIncident(found);
    }
  };

  const handleAssignRepSubmit = (e) => {
    e.preventDefault();
    alert(`Success: Assigned ${assignRepName} to active dispatch at ${assignPlant === 'gm_oshawa' ? 'GM Oshawa Plant' : 'Magna Belleville'}.`);
    setShowAssignRepModal(false);
  };

  // Filtered lists
  const filteredIncidents = incidents.filter(inc => {
    // 1. Role-based scoping
    if (userRole === 'qre' && inc.rep_id !== currentUserRepId) {
      return false;
    }
    if (userRole === 'customer' && inc.supplier_id !== currentUserCustomerId) {
      return false;
    }

    const matchesSearch = 
      inc.part_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.parts_list && inc.parts_list.some(p => p.part_number.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.area.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = selectedSupplierFilter === 'all' || inc.supplier_id === selectedSupplierFilter;
    const matchesStatus = selectedStatusFilter === 'all' || inc.status === selectedStatusFilter;
    const matchesDate = showAllDates || inc.created_at.startsWith(selectedDate);
    return matchesSearch && matchesSupplier && matchesStatus && matchesDate;
  });

  // Task operation helpers
  const handleToggleTaskStatus = (task) => {
    const updated = { ...task, status: task.status === 'completed' ? 'pending' : 'completed' };
    saveEntity('dailyTasks', updated);
  };

  const handleAddTask = (text, assignedRepId = selectedDispatchRepId) => {
    if (!text.trim()) return;
    const newTask = {
      id: `dt_${Date.now()}`,
      rep_id: assignedRepId || '1',
      date: selectedDate,
      task: text.trim(),
      status: 'pending'
    };
    saveEntity('dailyTasks', newTask);
    setNewTaskText('');
  };
  // Date Formatting Helper
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T00:00:00');
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Get all dates with records in the database
  const getAvailableDates = () => {
    const datesSet = new Set();
    incidents.forEach(inc => inc.created_at && datesSet.add(inc.created_at.substring(0, 10)));
    shiftReports.forEach(sr => sr.date && datesSet.add(sr.date));
    reworkLogs.forEach(rw => rw.created_at && datesSet.add(rw.created_at.substring(0, 10)));
    timeEntries.forEach(te => te.date && datesSet.add(te.date));
    dailyTasks.forEach(dt => dt.date && datesSet.add(dt.date));
    expenseEntries.forEach(ee => ee.date && datesSet.add(ee.date));
    const datesArray = Array.from(datesSet).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    datesArray.sort((a, b) => b.localeCompare(a));
    return datesArray;
  };

  // Get recent dates for navigation strip chips (consecutive 7-day rolling window)
  const getRecentDates = () => {
    const allDates = getAvailableDates();
    let latestDateStr = '2026-06-01';
    if (allDates.length > 0) {
      latestDateStr = allDates[0]; // latest date with records
    }
    
    const endDefault = new Date(latestDateStr + 'T00:00:00');
    const startDefault = new Date(endDefault);
    startDefault.setDate(endDefault.getDate() - 6);
    
    const selectedObj = new Date(selectedDate + 'T00:00:00');
    let endBase = endDefault;
    
    if (!isNaN(selectedObj.getTime())) {
      if (selectedObj < startDefault || selectedObj > endDefault) {
        // If selected date is outside the default window, align the window to selectedDate
        endBase = new Date(selectedObj);
      }
    }
    
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endBase);
      d.setDate(endBase.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  // Check if any database records exist for selectedDate
  const hasDataForSelectedDate = () => {
    return getAvailableDates().includes(selectedDate);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCalendarMonthIndex(prev => {
      if (prev === 0) {
        setCalendarYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonthIndex(prev => {
      if (prev === 11) {
        setCalendarYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Dot Activity Indicator Helper
  const getDateActivity = (dateStr) => {
    const hasIncidents = incidents.some(inc => inc.created_at.startsWith(dateStr));
    const hasShifts = shiftReports.some(sr => sr.date === dateStr);
    const hasRework = reworkLogs.some(log => log.created_at.startsWith(dateStr));
    return { hasIncidents, hasShifts, hasRework };
  };

  // Live Ontario Clock / Selected Date Activities Feed
  const getDynamicActivities = () => {
    const list = [];
    
    // Shift Reports
    shiftReports.forEach(sr => {
      if (showAllDates || sr.date === selectedDate) {
        const repName = users.find(u => u.id === sr.rep_id)?.name || 'Clarence Kuiken';
        list.push({
          time: sr.sent_at ? new Date(sr.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '05:30 PM',
          date: sr.date,
          title: 'Shift Report Submitted',
          desc: `Walkthrough sent for ${sr.plant_id === 'gm_oshawa' ? 'GM Oshawa' : 'Hutchinson'} | Rep: ${repName}`,
          color: 'border-emerald-500',
          timestamp: sr.sent_at || `${sr.date}T17:30:00Z`
        });
      }
    });

    // Incidents
    incidents.forEach(inc => {
      if (showAllDates || inc.created_at.startsWith(selectedDate)) {
        const repName = users.find(u => u.id === inc.rep_id)?.name || 'Clarence Kuiken';
        const firstPN = inc.parts_list?.[0]?.part_number || inc.part_id;
        const partSubject = inc.parts_list && inc.parts_list.length > 1
          ? `${firstPN} (+${inc.parts_list.length - 1} others)`
          : firstPN;
        list.push({
          time: new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: inc.created_at.substring(0, 10),
          title: 'Defect Incident Reported',
          desc: `PN ${partSubject} | ${inc.area} | Rep: ${repName}`,
          color: 'border-red-500',
          timestamp: inc.created_at
        });
      }
    });

    // Rework logs
    reworkLogs.forEach(rw => {
      if (showAllDates || rw.created_at.startsWith(selectedDate)) {
        const repName = users.find(u => u.id === rw.rep_id)?.name || 'Clarence Kuiken';
        list.push({
          time: new Date(rw.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: rw.created_at.substring(0, 10),
          title: 'Rework Logged',
          desc: `${rw.qty} pcs reworked (${rw.time_spent_minutes}m spent) | Rep: ${repName}`,
          color: 'border-sky-500',
          timestamp: rw.created_at
        });
      }
    });

    // Sort by timestamp desc
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return list;
  };

  // Calculations for metrics cards (filtered by date if selected)
  const totalOpenIncidents = incidents.filter(i => 
    (showAllDates || i.created_at.startsWith(selectedDate)) && 
    (i.status === 'Open' || i.status === 'Acknowledged')
  ).length;

  const totalReworkPcs = reworkLogs
    .filter(r => showAllDates || r.created_at.startsWith(selectedDate))
    .reduce((acc, curr) => acc + curr.qty, 0);

  const activeRepsCount = users.filter(u => u.role === 'rep').length;
  
  // Hours and Mileage cost calculation (Colleen's Phase 1 utility)
  const ratePerKm = 0.73;
  const totalMileage = timeEntries
    .filter(t => showAllDates || t.date === selectedDate)
    .reduce((acc, curr) => acc + curr.mileage_km, 0);

  const totalHours = timeEntries
    .filter(t => showAllDates || t.date === selectedDate)
    .reduce((acc, curr) => acc + curr.hours, 0);
  
  const totalMileageCost = totalMileage * ratePerKm;
  const totalHoursCost = totalHours * 28.00;
  const totalInvoicedEst = totalMileageCost + totalHoursCost;

  // Dynamic currency-aware totals for Admin billing overview
  const activeEntries = timeEntries.filter(t => showAllDates || t.date === selectedDate);
  const cadInvoicedTotal = activeEntries
    .filter(t => getRepSupplierRates(t.rep_id, t.supplier_id, t.plant_id).currency === 'CAD')
    .reduce((acc, curr) => {
      const rates = getRepSupplierRates(curr.rep_id, curr.supplier_id, curr.plant_id);
      return acc + (curr.hours * rates.billing_rate) + (curr.mileage_km * 0.73);
    }, 0);
    
  const usdInvoicedTotal = activeEntries
    .filter(t => getRepSupplierRates(t.rep_id, t.supplier_id, t.plant_id).currency === 'USD')
    .reduce((acc, curr) => {
      const rates = getRepSupplierRates(curr.rep_id, curr.supplier_id, curr.plant_id);
      return acc + (curr.hours * rates.billing_rate) + (curr.mileage_km * 0.73);
    }, 0);
  
  const totalExpenseClaimed = expenseEntries
    .filter(e => showAllDates || e.date === selectedDate)
    .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
  const grandTotalWithExpenses = totalInvoicedEst + totalExpenseClaimed;

  // Print & PDF methods
  const getConfidentiality = (data, type = "incident") => {
    if (type === "payroll") {
      return {
        level: "STRICTLY CONFIDENTIAL",
        sub: "INTERNAL PAYROLL & FINANCIAL RECORD",
        color: "#ef4444",
        colorRGB: [239, 68, 68],
        bgHex: "#fef2f2",
        bgRGB: [254, 242, 242],
        reason: "Contains representative hours and billing rates"
      };
    }

    if (type === "suppliers") {
      return {
        level: "CONFIDENTIAL",
        sub: "INTERNAL SUPPLY CHAIN DIRECTORY",
        color: "#f59e0b",
        colorRGB: [245, 158, 11],
        bgHex: "#fffbeb",
        bgRGB: [255, 251, 235],
        reason: "Restricted partner contacts and communications list"
      };
    }

    if (type === "rework") {
      return {
        level: "STRICTLY CONFIDENTIAL",
        sub: "REWORK & LABOR RECORD",
        color: "#ef4444",
        colorRGB: [239, 68, 68],
        bgHex: "#fef2f2",
        bgRGB: [254, 242, 242],
        reason: "Contains billable hours, scrap rates, and rework productivity metrics"
      };
    }

    if (type === "shift") {
      const hasIssues = data?.areas_walked?.some(area => {
        if (area.status === 'issues') return true;
        const notes = (area.notes || "").toLowerCase();
        return notes.includes("fail") || notes.includes("safety") || notes.includes("defect") || notes.includes("issue") || notes.includes("rattle");
      });
      const hasBonusIssues = data?.bonus_tasks?.some(t => {
        const notes = (t.notes || "").toLowerCase();
        return notes.includes("fail") || notes.includes("safety") || notes.includes("defect") || notes.includes("issue");
      });

      if (hasIssues || hasBonusIssues) {
        return {
          level: "STRICTLY CONFIDENTIAL",
          sub: "OPERATIONS & FLOOR COMPLIANCE AUDIT",
          color: "#ef4444",
          colorRGB: [239, 68, 68],
          bgHex: "#fef2f2",
          bgRGB: [254, 242, 242],
          reason: "Contains logged quality issues in walked areas"
        };
      }
      return {
        level: "CONFIDENTIAL",
        sub: "INTERNAL OPERATIONS RECORD",
        color: "#f59e0b",
        colorRGB: [245, 158, 11],
        bgHex: "#fffbeb",
        bgRGB: [255, 251, 235],
        reason: "Standard daily representative activity record"
      };
    }

    const desc = (data?.description || "").toLowerCase();
    const action = (data?.action_taken || "").toLowerCase();
    const status = data?.status || "";
    const isCritical = status === "Red Alert" || data?.rma_required === "Y" || data?.rma_required === "Yes";
    
    const hasCriticalKeywords = 
      desc.includes("fail") || desc.includes("safety") || desc.includes("recall") || 
      desc.includes("critical") || desc.includes("scrap") || desc.includes("non-conforming") || 
      desc.includes("leak") || desc.includes("short") || desc.includes("crack") ||
      action.includes("scrap") || action.includes("return") || action.includes("rma");

    if (isCritical || hasCriticalKeywords) {
      return {
        level: "STRICTLY CONFIDENTIAL",
        sub: "CRITICAL QUALITY AUDIT ESCALATION",
        color: "#ef4444",
        colorRGB: [239, 68, 68],
        bgHex: "#fef2f2",
        bgRGB: [254, 242, 242],
        reason: isCritical ? "Critical alert status / RMA required" : "Sensitive defect narrative detected"
      };
    }

    return {
      level: "CONFIDENTIAL",
      sub: "QUALITY ASSURANCE PROPERTY OF IDS",
      color: "#f59e0b",
      colorRGB: [245, 158, 11],
      bgHex: "#fffbeb",
      bgRGB: [255, 251, 235],
      reason: "Standard supplier quality audit"
    };
  };

  const handlePrintReport = (inc) => {
    const conf = getConfidentiality(inc, "incident");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let partsSectionHtml = '';
    if (inc.parts_list && inc.parts_list.length > 0) {
      partsSectionHtml = `
        <div class="desc" style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
          <h3>Defective Parts List</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 8px; border: 1px solid #e2e8f0;">Part Number</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0;">Description</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0;">Bin</th>
                <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${inc.parts_list.map(p => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">${p.part_number}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0;">${p.description}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; color: #10B981; font-weight: 500;">${p.bin}</td>
                  <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${p.qty}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const firstPN = inc.parts_list?.[0]?.part_number || inc.part_id;
    const partSubject = inc.parts_list && inc.parts_list.length > 1
      ? `${firstPN} (+${inc.parts_list.length - 1} others)`
      : firstPN;

    printWindow.document.write(`
      <html>
        <head>
          <title>IDS Pulse Report - PN ${partSubject}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; position: relative; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; z-index: 1; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A5F; padding-bottom: 15px; margin-bottom: 24px; }
            .logo-section { display: flex; align-items: center; gap: 12px; }
            .shield-icon { width: 34px; height: 34px; background: #1E3A5F; clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; }
            .pulse-wave { width: 18px; height: 18px; border-bottom: 2.5px solid #22D3EE; border-top: 2.5px solid #22D3EE; transform: rotate(15deg); }
            .company-details { display: flex; flex-direction: column; }
            .company-title { color: #1E3A5F; font-size: 18px; font-weight: 800; margin: 0; line-height: 1.1; letter-spacing: -0.02em; }
            .company-subtitle { font-size: 8px; color: #64748b; margin-top: 2px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
            .confidentiality-tag { border: 1.5px solid ${conf.color}; background: ${conf.bgHex}; color: ${conf.color}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
            .confidentiality-sub { font-size: 7px; display: block; margin-top: 2px; font-weight: bold; color: ${conf.color}; opacity: 0.8; text-transform: uppercase; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 64px; font-weight: 900; color: rgba(226, 232, 240, 0.25); pointer-events: none; z-index: 0; white-space: nowrap; text-transform: uppercase; font-family: sans-serif; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .field { background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid #f1f5f9; }
            .label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
            .val { font-size: 13px; font-weight: 600; color: #0f172a; }
            .desc { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
            .desc h3 { color: #1E3A5F; font-size: 15px; margin-top: 0; margin-bottom: 8px; font-weight: 700; }
            .desc p { font-size: 13px; color: #334155; margin: 0; white-space: pre-wrap; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 40px; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="watermark">IDS ${conf.level}</div>
          <div class="card">
            <div class="header-container">
              <div class="logo-section" style="display: flex; align-items: center; background: #1e3a5f; padding: 6px 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <img src="${LOGO_BASE64}" style="height: 28px; width: auto; object-fit: contain;" />
              </div>
              <div class="confidentiality-tag">
                ${conf.level}
                <span class="confidentiality-sub">${conf.sub}</span>
              </div>
            </div>

            <div class="grid">
              <div class="field"><span class="label">Incident ID</span><span class="val">${inc.id}</span></div>
              <div class="field"><span class="label">Logged By (Rep)</span><span class="val">${users.find(u => u.id === inc.rep_id)?.name || 'Clarence Kuiken'}</span></div>
              <div class="field"><span class="label">Report Date</span><span class="val">${new Date(inc.created_at).toLocaleString()}</span></div>
              <div class="field"><span class="label">Affected Part Number</span><span class="val">${partSubject}</span></div>
              <div class="field"><span class="label">Area Discovered</span><span class="val">${inc.area}</span></div>
              <div class="field"><span class="label">Defect Coordinates</span><span class="val">${inc.defect_location_x !== undefined && inc.defect_location_x !== null ? `X: ${inc.defect_location_x} | Y: ${inc.defect_location_y}` : 'N/A'}</span></div>
              <div class="field"><span class="label">Action Taken</span><span class="val">${inc.action_taken}</span></div>
              <div class="field"><span class="label">Supplier QM Contact</span><span class="val">${inc.supplier_contact}</span></div>
              <div class="field"><span class="label">RMA Required</span><span class="val">${inc.rma_required || 'N'}</span></div>
              <div class="field"><span class="label">Current Status</span><span class="val">${inc.status}</span></div>
              <div class="field" style="grid-column: span 2;"><span class="label">Classification Rationale</span><span class="val" style="font-weight: 500; font-size: 11px; color: ${conf.color};">${conf.reason}</span></div>
            </div>
            
            ${partsSectionHtml}
            
            <div class="desc">
              <h3>Defect Narrative Details</h3>
              <p>${inc.description}</p>
            </div>

            <div class="footer">
              <span>System: IDS Pulse Audit Portal</span>
              <span>CLASSIFICATION: ${conf.level} / ${conf.sub}</span>
              <span>&copy; 2026 Integrity Driven Solutions Inc.</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadReport = (inc) => {
    const conf = getConfidentiality(inc, "incident");
    const doc = new jsPDF();
    
    // Draw Dark Blue background container for the logo image to make the white text pop
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(20, 13, 50, 13, 2, 2, "F");
    doc.addImage(LOGO_BASE64, 'PNG', 22, 14, 46, 11);
    
    // Confidentiality Badge in top right corner
    doc.setDrawColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.setFillColor(conf.bgRGB[0], conf.bgRGB[1], conf.bgRGB[2]);
    doc.rect(130, 14, 60, 11, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.text(conf.level, 160, 19.5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(conf.sub, 160, 23, { align: "center" });

    // Background Watermark (Light rotated text matching classifier)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(248, 250, 252); // Very faint slate grey
    doc.text(`IDS ${conf.level}`, 25, 140, { angle: 45 });

    // Header Separator line
    doc.setDrawColor(30, 58, 95); 
    doc.setLineWidth(1.2);
    doc.line(20, 33, 190, 33);
    
    const firstPN = inc.parts_list?.[0]?.part_number || inc.part_id;
    const partSubject = inc.parts_list && inc.parts_list.length > 1
      ? `${firstPN} (+${inc.parts_list.length - 1} others)`
      : firstPN;

    const fields = [
      { label: "Incident ID:", val: inc.id },
      { label: "Logged By (Rep):", val: users.find(u => u.id === inc.rep_id)?.name || 'Clarence Kuiken' },
      { label: "Report Date:", val: new Date(inc.created_at).toLocaleDateString() },
      { label: "Affected Part Number:", val: partSubject },
      { label: "Area Discovered:", val: inc.area },
      { label: "Defect Coordinates:", val: inc.defect_location_x !== undefined && inc.defect_location_x !== null ? `X: ${inc.defect_location_x} | Y: ${inc.defect_location_y}` : 'N/A' },
      { label: "Immediate Action:", val: inc.action_taken },
      { label: "Supplier QM Contact:", val: inc.supplier_contact },
      { label: "Review Status Level:", val: inc.status },
      { label: "Classification Reasoning:", val: conf.reason }
    ];
    
    // Metadata Box background
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 39, 170, 100, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(20, 39, 170, 100, "D");

    let y = 46;
    fields.forEach((f) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(f.label, 25, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      if (f.label === "Classification Reasoning:") {
        doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(f.val), 72, y);
      
      y += 9.5;
    });
    
    if (inc.parts_list && inc.parts_list.length > 0) {
      y = 148;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 95);
      doc.text("Affected Parts Checklist:", 20, y);
      y += 8;
      
      doc.setFontSize(9.5);
      inc.parts_list.forEach((p) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`PN ${p.part_number}`, 25, y);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`- ${p.description} (Qty: ${p.qty}, Bin: ${p.bin})`, 60, y);
        y += 8;
      });
    } else {
      y = 148;
    }
    
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(30, 58, 95);
    doc.text("Defect Narrative details:", 20, y);
    
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    
    const splitText = doc.splitTextToSize(inc.description, 170);
    doc.text(splitText, 20, y);
    
    // Page Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 274, 190, 274);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by IDS Pulse Auditor | Date: " + new Date().toLocaleDateString(), 20, 281);
    doc.text("Page 1 of 1", 190, 281, { align: "right" });
    doc.text(`CLASSIFICATION: ${conf.level} / ${conf.sub}`, 105, 286, { align: "center" });
    
    doc.save(`IDS_Pulse_Audit_${firstPN}_${inc.id}.pdf`);
  };

  const handleResendSupplierEmail = (inc) => {
    alert(`Incident notification email has been successfully queued and resent to: martin.s@magna.com (CC: Donna Cabral, Greg Phillippe)`);
  };

  const handleDownloadShiftReport = (sr) => {
    const conf = getConfidentiality(sr, "shift");
    const doc = new jsPDF();
    
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(20, 13, 50, 13, 2, 2, "F");
    doc.addImage(LOGO_BASE64, 'PNG', 22, 14, 46, 11);
    
    doc.setDrawColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.setFillColor(conf.bgRGB[0], conf.bgRGB[1], conf.bgRGB[2]);
    doc.rect(130, 14, 60, 11, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.text(conf.level, 160, 19.5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(conf.sub, 160, 23, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(248, 250, 252);
    doc.text(`IDS ${conf.level}`, 25, 140, { angle: 45 });

    doc.setDrawColor(30, 58, 95); 
    doc.setLineWidth(1.2);
    doc.line(20, 33, 190, 33);

    const repName = users.find(u => u.id === sr.rep_id)?.name || 'Clarence Kuiken';
    const fields = [
      { label: "Report Type:", val: "Shift Walkthrough Audit Summary" },
      { label: "Logged By (Rep):", val: repName },
      { label: "Report Date:", val: sr.date },
      { label: "Plant Location:", val: "GM Oshawa Plant" },
      { label: "Time Compiled:", val: new Date(sr.sent_at).toLocaleString() },
      { label: "Classification Reasoning:", val: conf.reason }
    ];

    doc.setFillColor(248, 250, 252);
    doc.rect(20, 39, 170, 60, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(20, 39, 170, 60, "D");

    let y = 46;
    fields.forEach((f) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(f.label, 25, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      if (f.label === "Classification Reasoning:") {
        doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(f.val), 72, y);
      
      y += 9;
    });

    y = 108;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 95);
    doc.text("Walked Area Audits Checklist:", 20, y);
    y += 8;

    sr.areas_walked.forEach((area) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(area.name, 25, y);

      const statusText = area.status === 'issues' ? 'DEFECTS FOUND' : 'NO ISSUES';
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      if (area.status === 'issues') {
        doc.setTextColor(239, 68, 68);
      } else {
        doc.setTextColor(16, 185, 129);
      }
      doc.text(`[${statusText}]`, 75, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      const notes = area.notes || 'Rep walked area and confirmed no active part issues.';
      const splitNotes = doc.splitTextToSize(notes, 85);
      doc.text(splitNotes, 105, y);

      y += Math.max(8, splitNotes.length * 4.5);
    });

    if (sr.bonus_tasks && sr.bonus_tasks.length > 0) {
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 95);
      doc.text("Requested Sorts & Audits:", 20, y);
      y += 8;

      sr.bonus_tasks.forEach((t) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(t.task, 25, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(16, 185, 129);
        doc.text("[COMPLETED]", 105, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        const notes = t.notes || 'Audit check completed.';
        const splitNotes = doc.splitTextToSize(notes, 55);
        doc.text(splitNotes, 130, y);

        y += Math.max(8, splitNotes.length * 4.5);
      });
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 274, 190, 274);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by IDS Pulse Shift Auditor | Date: " + new Date().toLocaleDateString(), 20, 281);
    doc.text("Page 1 of 1", 190, 281, { align: "right" });
    doc.text(`CLASSIFICATION: ${conf.level} / ${conf.sub}`, 105, 286, { align: "center" });

    doc.save(`IDS_Shift_Walkthrough_${sr.date}_${sr.id}.pdf`);
  };

  const handlePrintShiftReport = (sr) => {
    const conf = getConfidentiality(sr, "shift");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const repName = users.find(u => u.id === sr.rep_id)?.name || 'Clarence Kuiken';

    printWindow.document.write(`
      <html>
        <head>
          <title>IDS Walkthrough Audit Report - ${sr.date}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; position: relative; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; z-index: 1; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A5F; padding-bottom: 15px; margin-bottom: 24px; }
            .logo-section { display: flex; align-items: center; background: #1e3a5f; padding: 6px 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .confidentiality-tag { border: 1.5px solid ${conf.color}; background: ${conf.bgHex}; color: ${conf.color}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
            .confidentiality-sub { font-size: 7px; display: block; margin-top: 2px; font-weight: bold; color: ${conf.color}; opacity: 0.8; text-transform: uppercase; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 50px; font-weight: 900; color: rgba(226, 232, 240, 0.25); pointer-events: none; z-index: 0; white-space: nowrap; text-transform: uppercase; font-family: sans-serif; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .field { background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid #f1f5f9; }
            .label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
            .val { font-size: 13px; font-weight: 600; color: #0f172a; }
            .section-title { color: #1E3A5F; font-size: 15px; margin-top: 20px; margin-bottom: 12px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
            
            .table-styled { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .table-styled th { background: #f1f5f9; padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 9px; }
            .table-styled td { padding: 10px 8px; border: 1px solid #e2e8f0; }
            
            .badge-issues { background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
            .badge-no_issues { background: #dcfce7; color: #10b981; border: 1px solid #86efac; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; }
            .badge-completed { background: #dcfce7; color: #10b981; border: 1px solid #86efac; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; text-transform: uppercase; }

            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 40px; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="watermark">IDS ${conf.level}</div>
          <div class="card">
            <div class="header-container">
              <div class="logo-section">
                <img src="${LOGO_BASE64}" style="height: 28px; width: auto; object-fit: contain;" />
              </div>
              <div class="confidentiality-tag">
                ${conf.level}
                <span class="confidentiality-sub">${conf.sub}</span>
              </div>
            </div>

            <div class="grid">
              <div class="field"><span class="label">Report Type</span><span class="val">Shift Walkthrough Audit Summary</span></div>
              <div class="field"><span class="label">Logged By (Rep)</span><span class="val">${repName}</span></div>
              <div class="field"><span class="label">Report Date</span><span class="val">${sr.date}</span></div>
              <div class="field"><span class="label">Plant Location</span><span class="val">GM Oshawa Plant</span></div>
              <div class="field"><span class="label">Time Compiled</span><span class="val">${new Date(sr.sent_at).toLocaleString()}</span></div>
              <div class="field" style="grid-column: span 2;"><span class="label">Classification Rationale</span><span class="val" style="font-weight: 500; font-size: 11px; color: ${conf.color};">${conf.reason}</span></div>
            </div>

            <div class="section-title">Walked Area Audits</div>
            <table class="table-styled">
              <thead>
                <tr>
                  <th style="width: 25%;">Area Walked</th>
                  <th style="width: 20%;">Audit Status</th>
                  <th style="width: 55%;">Notes & Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${sr.areas_walked.map(area => `
                  <tr>
                    <td style="font-weight: bold; color: #0f172a;">${area.name}</td>
                    <td>
                      <span class="badge-${area.status}">
                        ${area.status === 'issues' ? 'Defects Found' : 'No Issues'}
                      </span>
                    </td>
                    <td style="color: #475569;">${area.notes || 'Rep walked area and confirmed no active part issues.'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            ${sr.bonus_tasks && sr.bonus_tasks.length > 0 ? `
              <div class="section-title">Requested Sorts & Audits</div>
              <table class="table-styled">
                <thead>
                  <tr>
                    <th style="width: 40%;">Task Instruction</th>
                    <th style="width: 20%;">Task Status</th>
                    <th style="width: 40%;">Rep Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${sr.bonus_tasks.map(t => `
                    <tr>
                      <td style="font-weight: bold; color: #0f172a;">${t.task}</td>
                      <td><span class="badge-completed">Completed</span></td>
                      <td style="color: #475569;">${t.notes || 'Audit check completed.'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}

            <div class="footer">
              <span>System: IDS Pulse Audit Portal</span>
              <span>CLASSIFICATION: ${conf.level} / ${conf.sub}</span>
              <span>&copy; 2026 Integrity Driven Solutions Inc.</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSupplierDirectoryReport = () => {
    const conf = getConfidentiality(null, "suppliers");
    const doc = new jsPDF();
    
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(20, 13, 50, 13, 2, 2, "F");
    doc.addImage(LOGO_BASE64, 'PNG', 22, 14, 46, 11);
    
    doc.setDrawColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.setFillColor(conf.bgRGB[0], conf.bgRGB[1], conf.bgRGB[2]);
    doc.rect(130, 14, 60, 11, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.text(conf.level, 160, 19.5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(conf.sub, 160, 23, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(248, 250, 252);
    doc.text(`IDS ${conf.level}`, 25, 140, { angle: 45 });

    doc.setDrawColor(30, 58, 95); 
    doc.setLineWidth(1.2);
    doc.line(20, 33, 190, 33);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Supplier Partnership Quality Contacts Directory", 20, 44);

    let y = 54;
    suppliers.forEach((sup) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y, 170, 42, "F");
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.rect(20, y, 170, 42, "D");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(sup.name, 25, y + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text("ACTIVE PARTNERSHIP", 150, y + 8);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Quality Management Contacts:", 25, y + 16);

      let cy = y + 24;
      sup.contacts.forEach((c) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 58, 95);
        doc.text(`${c.name} (${c.role})`, 30, cy);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(14, 165, 233);
        doc.text(c.email, 120, cy);
        cy += 8;
      });

      y += 48;
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 274, 190, 274);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by IDS Supplier Intelligence | Date: " + new Date().toLocaleDateString(), 20, 281);
    doc.text("Page 1 of 1", 190, 281, { align: "right" });
    doc.text(`CLASSIFICATION: ${conf.level} / ${conf.sub}`, 105, 286, { align: "center" });

    doc.save(`IDS_Supplier_Contacts_Directory.pdf`);
  };

  const handlePrintSupplierDirectoryReport = () => {
    const conf = getConfidentiality(null, "suppliers");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>IDS Supplier Partnership Directory</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; position: relative; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; z-index: 1; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A5F; padding-bottom: 15px; margin-bottom: 24px; }
            .logo-section { display: flex; align-items: center; background: #1e3a5f; padding: 6px 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .confidentiality-tag { border: 1.5px solid ${conf.color}; background: ${conf.bgHex}; color: ${conf.color}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
            .confidentiality-sub { font-size: 7px; display: block; margin-top: 2px; font-weight: bold; color: ${conf.color}; opacity: 0.8; text-transform: uppercase; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 50px; font-weight: 900; color: rgba(226, 232, 240, 0.25); pointer-events: none; z-index: 0; white-space: nowrap; text-transform: uppercase; font-family: sans-serif; }
            
            .supplier-card { border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
            .supplier-name { color: #1E3A5F; font-size: 16px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .badge-active { background: #dcfce7; color: #10b981; border: 1px solid #86efac; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: bold; }
            
            .contact-row { display: flex; justify-content: space-between; background: white; border: 1px solid #f1f5f9; padding: 8px 12px; border-radius: 8px; font-size: 11px; margin-bottom: 6px; }
            .contact-info { font-weight: 700; color: #334155; }
            .contact-role { font-weight: 500; color: #64748b; font-size: 9px; text-transform: uppercase; margin-top: 2px; }
            
            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 40px; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="watermark">IDS ${conf.level}</div>
          <div class="card">
            <div class="header-container">
              <div class="logo-section">
                <img src="${LOGO_BASE64}" style="height: 28px; width: auto; object-fit: contain;" />
              </div>
              <div class="confidentiality-tag">
                ${conf.level}
                <span class="confidentiality-sub">${conf.sub}</span>
              </div>
            </div>

            <h2 style="color: #1E3A5F; font-size: 18px; font-weight: 850; margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Supplier Partnership Directory</h2>

            ${suppliers.map(sup => `
              <div class="supplier-card">
                <div class="supplier-name">
                  <span>${sup.name}</span>
                  <span class="badge-active">ACTIVE PARTNERSHIP</span>
                </div>
                <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Quality Management Contacts</div>
                ${sup.contacts.map(c => `
                  <div class="contact-row">
                    <div>
                      <div class="contact-info">${c.name}</div>
                      <div class="contact-role">${c.role}</div>
                    </div>
                    <div style="font-family: monospace; align-self: center;"><a href="mailto:${c.email}" style="color: #0EA5E9; text-decoration: none;">${c.email}</a></div>
                  </div>
                `).join('')}
              </div>
            `).join('')}

            <div class="footer">
              <span>System: IDS Supplier Directory</span>
              <span>CLASSIFICATION: ${conf.level} / ${conf.sub}</span>
              <span>&copy; 2026 Integrity Driven Solutions Inc.</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadTimesheetReport = () => {
    const conf = getConfidentiality(timeEntries, "payroll");
    const doc = new jsPDF();
    
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(20, 13, 50, 13, 2, 2, "F");
    doc.addImage(LOGO_BASE64, 'PNG', 22, 14, 46, 11);
    
    doc.setDrawColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.setFillColor(conf.bgRGB[0], conf.bgRGB[1], conf.bgRGB[2]);
    doc.rect(130, 14, 60, 11, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.text(conf.level, 160, 19.5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(conf.sub, 160, 23, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(248, 250, 252);
    doc.text(`IDS ${conf.level}`, 25, 140, { angle: 45 });

    doc.setDrawColor(30, 58, 95); 
    doc.setLineWidth(1.2);
    doc.line(20, 33, 190, 33);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Timesheet Payroll Summary Audit Report", 20, 44);

    doc.setFillColor(248, 250, 252);
    doc.rect(20, 50, 170, 24, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(20, 50, 170, 24, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("TOTAL HOURS BILLED", 25, 57);
    doc.text("TOTAL MILEAGE CLAIMED", 82, 57);
    doc.text("ESTIMATED INVOICE COST", 138, 57);

    const totalHoursVal = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);
    const totalMileageVal = timeEntries.reduce((acc, curr) => acc + curr.mileage_km, 0);
    const totalInvoicedEstVal = totalHoursVal * 28.00 + totalMileageVal * 0.73;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${totalHoursVal} Hours`, 25, 66);
    doc.text(`${totalMileageVal} km ($0.73/km)`, 82, 66);
    doc.setTextColor(14, 165, 233);
    doc.text(`$${totalInvoicedEstVal.toFixed(2)}`, 138, 66);

    let y = 86;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 58, 95);
    doc.text("Detailed Representative Labor Log:", 20, y);
    y += 6;

    doc.setFillColor(241, 245, 249);
    doc.rect(20, y, 170, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Employee Name", 22, y + 5);
    doc.text("Date Logged", 68, y + 5);
    doc.text("Hours", 100, y + 5);
    doc.text("Mileage", 120, y + 5);
    doc.text("Total Cost", 155, y + 5);
    
    y += 7;

    timeEntries.forEach((entry) => {
      const rep = users.find(u => u.id === entry.rep_id)?.name || 'Unknown Rep';
      const mileageCost = entry.mileage_km * 0.73;
      const hourlyBilling = entry.hours * 28.00;
      const total = mileageCost + hourlyBilling;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(rep, 22, y + 6);
      doc.text(entry.date, 68, y + 6);
      doc.text(`${entry.hours} hrs`, 100, y + 6);
      doc.text(`${entry.mileage_km} km`, 120, y + 6);
      
      doc.setFont("helvetica", "bold");
      doc.text(`$${total.toFixed(2)}`, 155, y + 6);
      
      y += 8;
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 274, 190, 274);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by IDS Timesheets Auditor | Date: " + new Date().toLocaleDateString(), 20, 281);
    doc.text("Page 1 of 1", 190, 281, { align: "right" });
    doc.text(`CLASSIFICATION: ${conf.level} / ${conf.sub}`, 105, 286, { align: "center" });

    doc.save(`IDS_Timesheets_Audit_Report.pdf`);
  };

  const handlePrintTimesheetReport = () => {
    const conf = getConfidentiality(timeEntries, "payroll");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalHoursVal = timeEntries.reduce((acc, curr) => acc + curr.hours, 0);
    const totalMileageVal = timeEntries.reduce((acc, curr) => acc + curr.mileage_km, 0);
    const totalInvoicedEstVal = totalHoursVal * 28.00 + totalMileageVal * 0.73;

    printWindow.document.write(`
      <html>
        <head>
          <title>IDS Payroll and Mileage Timesheets Audit Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; position: relative; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; z-index: 1; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A5F; padding-bottom: 15px; margin-bottom: 24px; }
            .logo-section { display: flex; align-items: center; background: #1e3a5f; padding: 6px 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .confidentiality-tag { border: 1.5px solid ${conf.color}; background: ${conf.bgHex}; color: ${conf.color}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
            .confidentiality-sub { font-size: 7px; display: block; margin-top: 2px; font-weight: bold; color: ${conf.color}; opacity: 0.8; text-transform: uppercase; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 50px; font-weight: 900; color: rgba(226, 232, 240, 0.25); pointer-events: none; z-index: 0; white-space: nowrap; text-transform: uppercase; font-family: sans-serif; }
            
            .summary-box { display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
            .summary-item { display: flex; flex-direction: column; }
            .summary-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            .summary-val { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 4px; }

            .table-styled { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .table-styled th { background: #f1f5f9; padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 9px; }
            .table-styled td { padding: 10px 8px; border: 1px solid #e2e8f0; }

            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 40px; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="watermark">IDS ${conf.level}</div>
          <div class="card">
            <div class="header-container">
              <div class="logo-section">
                <img src="${LOGO_BASE64}" style="height: 28px; width: auto; object-fit: contain;" />
              </div>
              <div class="confidentiality-tag">
                ${conf.level}
                <span class="confidentiality-sub">${conf.sub}</span>
              </div>
            </div>

            <h2 style="color: #1E3A5F; font-size: 18px; font-weight: 850; margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Timesheet Payroll Summary Audit Report</h2>

            <div class="summary-box">
              <div class="summary-item">
                <span class="summary-label">Total Hours Billed</span>
                <span class="summary-val">${totalHoursVal} Hours</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total Mileage Claimed</span>
                <span class="summary-val">${totalMileageVal} km</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Invoice Estimate Total</span>
                <span class="summary-val" style="color: #0ea5e9;">$${totalInvoicedEstVal.toFixed(2)}</span>
              </div>
            </div>

            <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Detailed Representative Labor Log</div>
            <table class="table-styled">
              <thead>
                <tr>
                  <th>Employee/Rep Name</th>
                  <th>Date Logged</th>
                  <th>Hours Billed ($28.00/hr)</th>
                  <th>Mileage (KM)</th>
                  <th>Mileage Cost ($0.73/km)</th>
                  <th>Total Billing</th>
                </tr>
              </thead>
              <tbody>
                ${(timeEntries || []).filter(entry => entry).map(entry => {
                  const rep = users.find(u => u && u.id === entry.rep_id)?.name || 'Unknown Rep';
                  const mileageCost = (entry.mileage_km || 0) * 0.73;
                  const hourlyBilling = (entry.hours || 0) * 28.00;
                  const total = mileageCost + hourlyBilling;
                  return `
                    <tr>
                      <td style="font-weight: bold; color: #0f172a;">${rep}</td>
                      <td>${entry.date || ''}</td>
                      <td>${entry.hours || 0} hrs ($${hourlyBilling.toFixed(2)})</td>
                      <td>${entry.mileage_km || 0} km</td>
                      <td style="color: #10b981; font-weight: 500;">$${mileageCost.toFixed(2)}</td>
                      <td style="font-weight: 800; color: #0f172a;">$${total.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>

            <div class="footer">
              <span>System: IDS Payroll Timesheets</span>
              <span>CLASSIFICATION: ${conf.level} / ${conf.sub}</span>
              <span>&copy; 2026 Integrity Driven Solutions Inc.</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadReworkFeedReport = () => {
    const conf = getConfidentiality(null, "rework");
    const doc = new jsPDF();
    
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(20, 13, 50, 13, 2, 2, "F");
    doc.addImage(LOGO_BASE64, 'PNG', 22, 14, 46, 11);
    
    doc.setDrawColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.setFillColor(conf.bgRGB[0], conf.bgRGB[1], conf.bgRGB[2]);
    doc.rect(130, 14, 60, 11, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.text(conf.level, 160, 19.5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(conf.sub, 160, 23, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(248, 250, 252);
    doc.text(`IDS ${conf.level}`, 25, 140, { angle: 45 });

    doc.setDrawColor(30, 58, 95); 
    doc.setLineWidth(1.2);
    doc.line(20, 33, 190, 33);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 58, 95);
    doc.text("Supplier Defect Rework Summary Feed Report", 20, 44);

    let y = 54;
    
    doc.setFillColor(241, 245, 249);
    doc.rect(20, y, 170, 7, "F");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Date Logged", 22, y + 5);
    doc.text("Field Rep", 46, y + 5);
    doc.text("Part ID", 80, y + 5);
    doc.text("Supplier", 100, y + 5);
    doc.text("Qty", 122, y + 5);
    doc.text("Hours", 137, y + 5);
    doc.text("Rework Narrative / Notes", 152, y + 5);
    
    y += 7;

    const filteredRework = reworkLogs.filter(rw => showAllDates || rw.created_at.startsWith(selectedDate));

    filteredRework.forEach((rw) => {
      const rep = users.find(u => u.id === rw.rep_id)?.name || 'Clarence Kuiken';

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(new Date(rw.created_at).toLocaleDateString(), 22, y + 5);
      doc.text(rep, 46, y + 5);
      doc.text(`PN ${rw.part_id}`, 80, y + 5);
      doc.text(rw.supplier_id.toUpperCase(), 100, y + 5);
      
      doc.setFont("helvetica", "bold");
      doc.text(`${rw.qty} pcs`, 122, y + 5);
      doc.text(`${Math.round(rw.time_spent_minutes / 60 * 10) / 10} hrs`, 137, y + 5);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      const notes = rw.notes || 'N/A';
      const splitNotes = doc.splitTextToSize(notes, 36);
      doc.text(splitNotes[0] + (splitNotes.length > 1 ? "..." : ""), 152, y + 5);
      
      y += 8;
    });

    if (filteredRework.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("No rework logged on this date.", 25, y + 10);
    }

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 274, 190, 274);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by IDS Rework Feed Auditor | Date: " + new Date().toLocaleDateString(), 20, 281);
    doc.text("Page 1 of 1", 190, 281, { align: "right" });
    doc.text(`CLASSIFICATION: ${conf.level} / ${conf.sub}`, 105, 286, { align: "center" });

    doc.save(`IDS_Rework_Audit_Feed_${selectedDate}.pdf`);
  };

  const handlePrintReworkFeedReport = () => {
    const conf = getConfidentiality(null, "rework");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const filteredRework = reworkLogs.filter(rw => showAllDates || rw.created_at.startsWith(selectedDate));

    printWindow.document.write(`
      <html>
        <head>
          <title>IDS Rework Logs Feed Report</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; position: relative; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; z-index: 1; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A5F; padding-bottom: 15px; margin-bottom: 24px; }
            .logo-section { display: flex; align-items: center; background: #1e3a5f; padding: 6px 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .confidentiality-tag { border: 1.5px solid ${conf.color}; background: ${conf.bgHex}; color: ${conf.color}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
            .confidentiality-sub { font-size: 7px; display: block; margin-top: 2px; font-weight: bold; color: ${conf.color}; opacity: 0.8; text-transform: uppercase; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 50px; font-weight: 900; color: rgba(226, 232, 240, 0.25); pointer-events: none; z-index: 0; white-space: nowrap; text-transform: uppercase; font-family: sans-serif; }

            .table-styled { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
            .table-styled th { background: #f1f5f9; padding: 8px; border: 1px solid #e2e8f0; text-align: left; font-weight: 800; color: #475569; text-transform: uppercase; font-size: 9px; }
            .table-styled td { padding: 10px 8px; border: 1px solid #e2e8f0; }

            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 40px; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="watermark">IDS ${conf.level}</div>
          <div class="card">
            <div class="header-container">
              <div class="logo-section">
                <img src="${LOGO_BASE64}" style="height: 28px; width: auto; object-fit: contain;" />
              </div>
              <div class="confidentiality-tag">
                ${conf.level}
                <span class="confidentiality-sub">${conf.sub}</span>
              </div>
            </div>

            <h2 style="color: #1E3A5F; font-size: 18px; font-weight: 850; margin-top: 0; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Defect Rework Logs Feed Report</h2>

            <table class="table-styled">
              <thead>
                <tr>
                  <th>Date logged</th>
                  <th>Field Rep</th>
                  <th>Part Affected</th>
                  <th>Supplier</th>
                  <th>Pieces Reworked</th>
                  <th>Time Spent</th>
                  <th>Notes & Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRework.map(rw => {
                  const rep = users.find(u => u.id === rw.rep_id)?.name || 'Clarence Kuiken';
                  return `
                    <tr>
                      <td>${new Date(rw.created_at).toLocaleDateString()}</td>
                      <td style="font-weight: bold; color: #0EA5E9;">${rep}</td>
                      <td style="font-weight: bold;">PN ${rw.part_id}</td>
                      <td style="text-transform: uppercase; font-size: 10px; font-weight: bold; color: #64748b;">${rw.supplier_id}</td>
                      <td style="font-weight: bold; color: #10b981;">${rw.qty} pcs</td>
                      <td style="font-weight: bold; color: #0ea5e9;">${Math.round(rw.time_spent_minutes / 60 * 10) / 10} hrs</td>
                      <td style="color: #475569;">${rw.notes || 'N/A'}</td>
                    </tr>
                  `;
                }).join('')}
                ${filteredRework.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; color: #94a3b8; font-style: italic; padding: 24px;">No rework logged on this date.</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>

            <div class="footer">
              <span>System: IDS Rework Logging Feed</span>
              <span>CLASSIFICATION: ${conf.level} / ${conf.sub}</span>
              <span>&copy; 2026 Integrity Driven Solutions Inc.</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadReworkReport = (rw) => {
    const conf = getConfidentiality(rw, "rework");
    const doc = new jsPDF();
    
    doc.setFillColor(30, 58, 95);
    doc.roundedRect(20, 13, 50, 13, 2, 2, "F");
    doc.addImage(LOGO_BASE64, 'PNG', 22, 14, 46, 11);
    
    doc.setDrawColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.setFillColor(conf.bgRGB[0], conf.bgRGB[1], conf.bgRGB[2]);
    doc.rect(130, 14, 60, 11, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
    doc.text(conf.level, 160, 19.5, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.text(conf.sub, 160, 23, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(248, 250, 252);
    doc.text(`IDS ${conf.level}`, 25, 140, { angle: 45 });

    doc.setDrawColor(30, 58, 95); 
    doc.setLineWidth(1.2);
    doc.line(20, 33, 190, 33);

    const repName = users.find(u => u.id === rw.rep_id)?.name || 'Clarence Kuiken';
    const fields = [
      { label: "Rework ID:", val: rw.id },
      { label: "Logged By (Rep):", val: repName },
      { label: "Date Logged:", val: new Date(rw.created_at).toLocaleDateString() },
      { label: "Part Number:", val: `PN ${rw.part_id}` },
      { label: "Supplier Partner:", val: rw.supplier_id.toUpperCase() },
      { label: "Pieces Reworked:", val: `${rw.qty} pcs` },
      { label: "Time Allocated:", val: `${Math.round(rw.time_spent_minutes / 60 * 10) / 10} hours` },
      { label: "Classification Reasoning:", val: conf.reason }
    ];

    doc.setFillColor(248, 250, 252);
    doc.rect(20, 39, 170, 80, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(20, 39, 170, 80, "D");

    let y = 46;
    fields.forEach((f) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      doc.text(f.label, 25, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      if (f.label === "Classification Reasoning:") {
        doc.setTextColor(conf.colorRGB[0], conf.colorRGB[1], conf.colorRGB[2]);
        doc.setFont("helvetica", "bold");
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(String(f.val), 72, y);
      
      y += 9.5;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 95);
    doc.text("Rework Activity Remarks & Notes:", 20, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(rw.notes || 'No notes recorded for this rework activity.', 170);
    doc.text(splitNotes, 20, y);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 274, 190, 274);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Generated by IDS Rework Auditor | Date: " + new Date().toLocaleDateString(), 20, 281);
    doc.text("Page 1 of 1", 190, 281, { align: "right" });
    doc.text(`CLASSIFICATION: ${conf.level} / ${conf.sub}`, 105, 286, { align: "center" });

    doc.save(`IDS_Rework_Audit_${rw.id}.pdf`);
  };

  const handlePrintReworkReport = (rw) => {
    const conf = getConfidentiality(rw, "rework");
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const repName = users.find(u => u.id === rw.rep_id)?.name || 'Clarence Kuiken';

    printWindow.document.write(`
      <html>
        <head>
          <title>IDS Rework Audit - ${rw.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background: #f8fafc; position: relative; }
            .card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; z-index: 1; }
            .header-container { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1E3A5F; padding-bottom: 15px; margin-bottom: 24px; }
            .logo-section { display: flex; align-items: center; background: #1e3a5f; padding: 6px 14px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .confidentiality-tag { border: 1.5px solid ${conf.color}; background: ${conf.bgHex}; color: ${conf.color}; font-size: 9px; font-weight: 800; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; }
            .confidentiality-sub { font-size: 7px; display: block; margin-top: 2px; font-weight: bold; color: ${conf.color}; opacity: 0.8; text-transform: uppercase; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 50px; font-weight: 900; color: rgba(226, 232, 240, 0.25); pointer-events: none; z-index: 0; white-space: nowrap; text-transform: uppercase; font-family: sans-serif; }
            
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .field { background: #f8fafc; padding: 10px 14px; border-radius: 10px; border: 1px solid #f1f5f9; }
            .label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
            .val { font-size: 13px; font-weight: 600; color: #0f172a; }
            .desc { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
            .desc h3 { color: #1E3A5F; font-size: 15px; margin-top: 0; margin-bottom: 8px; font-weight: 700; }
            .desc p { font-size: 13px; color: #334155; margin: 0; white-space: pre-wrap; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 40px; font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="watermark">IDS ${conf.level}</div>
          <div class="card">
            <div class="header-container">
              <div class="logo-section">
                <img src="${LOGO_BASE64}" style="height: 28px; width: auto; object-fit: contain;" />
              </div>
              <div class="confidentiality-tag">
                ${conf.level}
                <span class="confidentiality-sub">${conf.sub}</span>
              </div>
            </div>

            <div class="grid">
              <div class="field"><span class="label">Rework ID</span><span class="val">${rw.id}</span></div>
              <div class="field"><span class="label">Logged By (Rep)</span><span class="val">${repName}</span></div>
              <div class="field"><span class="label">Date Logged</span><span class="val">${new Date(rw.created_at).toLocaleString()}</span></div>
              <div class="field"><span class="label">Part Number Reworked</span><span class="val">PN ${rw.part_id}</span></div>
              <div class="field"><span class="label">Supplier Partner</span><span class="val">${rw.supplier_id.toUpperCase()}</span></div>
              <div class="field"><span class="label">Pieces Reworked</span><span class="val">${rw.qty} pcs</span></div>
              <div class="field"><span class="label">Time Spent (Labor)</span><span class="val">${Math.round(rw.time_spent_minutes / 60 * 10) / 10} hours</span></div>
              <div class="field" style="grid-column: span 2;"><span class="label">Classification Rationale</span><span class="val" style="font-weight: 500; font-size: 11px; color: ${conf.color};">${conf.reason}</span></div>
            </div>

            <div class="desc">
              <h3>Rework Activity Remarks & Notes</h3>
              <p>${rw.notes || 'No notes recorded for this rework activity.'}</p>
            </div>

            <div class="footer">
              <span>System: IDS Rework Records</span>
              <span>CLASSIFICATION: ${conf.level} / ${conf.sub}</span>
              <span>&copy; 2026 Integrity Driven Solutions Inc.</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Export timesheets to real CSV file
  const handleExportQuickBooks = () => {
    try {
      const conf = getConfidentiality(timeEntries, "payroll");
      const todayDate = new Date().toISOString().substring(0, 10);
      
      const csvLines = [
        `[IDS PULSE LOGO: SHIELD & WAVE]`,
        `INTEGRITY DRIVEN SOLUTIONS INC. (IDS)`,
        `Quality on the floor.`,
        `====================================================================================================`,
        `REPORT TITLE:,QuickBooks Timesheets & Payroll Summary Export`,
        `GENERATION TIMESTAMP:,${new Date().toLocaleString()}`,
        `CLASSIFICATION LEVEL:,${conf.level} (${conf.sub})`,
        `DETERMINED REASON:,${conf.reason}`,
        `====================================================================================================`,
        ``, // blank separator row
        `Employee/Rep Name,Date,Plant,Hours,Mileage (KM),Mileage Cost ($0.73),Total Billing`
      ];
      
      const rows = (timeEntries || []).filter(entry => entry).map(entry => {
        const rep = users.find(u => u && u.id === entry.rep_id);
        const repName = rep ? rep.name : 'Unknown Rep';
        const plant = entry.plant_id === 'gm_oshawa' ? 'GM Oshawa Plant' : 'Hutchinson Plant';
        const mileageCost = (entry.mileage_km || 0) * 0.73;
        const totalBilling = (entry.hours || 0) * 28.00 + mileageCost;
        return [
          `"${repName.replace(/"/g, '""')}"`,
          `"${entry.date || ''}"`,
          `"${plant.replace(/"/g, '""')}"`,
          entry.hours || 0,
          entry.mileage_km || 0,
          mileageCost.toFixed(2),
          totalBilling.toFixed(2)
        ].join(",");
      });

      const overtimeRows = expenseEntries.filter(e => e.category === 'Overtime Request' && (e.status === 'approved_customer' || e.status === 'approved_admin')).map(entry => {
        const rep = users.find(u => u && u.id === entry.rep_id);
        const repName = rep ? rep.name : 'Unknown Rep';
        const totalBilling = (entry.amount || 0) * 28.00;
        return [
          `"${repName.replace(/"/g, '""')}"`,
          `"${entry.date || ''}"`,
          `"Overtime Approved"`,
          entry.amount || 0,
          0,
          "0.00",
          totalBilling.toFixed(2)
        ].join(",");
      });

      csvLines.push(...rows);
      csvLines.push(...overtimeRows);
      
      // Calculate sums for the spreadsheet summary footer block
      const totalHours = (timeEntries || []).filter(Boolean).reduce((acc, curr) => acc + (curr.hours || 0), 0) + 
                         expenseEntries.filter(e => e.category === 'Overtime Request' && (e.status === 'approved_customer' || e.status === 'approved_admin')).reduce((acc, curr) => acc + (curr.amount || 0), 0);
      const totalMileage = (timeEntries || []).filter(Boolean).reduce((acc, curr) => acc + (curr.mileage_km || 0), 0);
      const totalMileageCost = totalMileage * 0.73;
      const totalInvoicedEst = totalHours * 28.00 + totalMileageCost;

      csvLines.push(``); // blank separator
      csvLines.push(`====================================================================================================`);
      csvLines.push(`REPORT SUMMARY & STATISTICS`);
      csvLines.push(`Total Payroll Records:,${timeEntries.length + overtimeRows.length}`);
      csvLines.push(`Total Billing Hours Worked:,${totalHours.toFixed(2)} hrs`);
      csvLines.push(`Total Mileage Claimed:,${totalMileage.toFixed(2)} km`);
      csvLines.push(`Total Mileage Reimbursement:,${totalMileageCost.toFixed(2)} USD`);
      csvLines.push(`Total Invoiced Billing Cost:,${totalInvoicedEst.toFixed(2)} USD`);
      csvLines.push(`====================================================================================================`);
      csvLines.push(`FOOTER & SECURITY NOTICE`);
      csvLines.push(`Classification Confirmation:,${conf.level} - PROPERTY OF INTEGRITY DRIVEN SOLUTIONS INC.`);
      csvLines.push(`Security Policy Details:,Restricted to internal payroll processing. Unauthorized sharing is strictly prohibited.`);
      csvLines.push(`(C) 2026 Integrity Driven Solutions Inc. All rights reserved.`);
      
      const csvText = csvLines.join("\n");
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `IDS_Timesheets_Payroll_${todayDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Error generating CSV file.");
    }
  };

  // Export timesheets to real styled Excel Workbook (.xlsx)
  const handleExportExcel = async () => {
    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Payroll & Mileage');

      // Configure columns
      worksheet.columns = [
        { key: 'A', width: 25 }, // Employee Name
        { key: 'B', width: 16 }, // Date
        { key: 'C', width: 22 }, // Plant
        { key: 'D', width: 12 }, // Hours
        { key: 'E', width: 18 }, // Mileage (KM)
        { key: 'F', width: 20 }, // Mileage Cost
        { key: 'G', width: 20 }  // Total Billing
      ];

      const primaryBlue = '1E3A5F';
      const textSlate = '475569';
      const redAlertBg = 'FEF2F2';
      const redAlertBorder = 'EF4444';

      // 1. Company Brand Header
      worksheet.mergeCells('A1:G1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'INTEGRITY DRIVEN SOLUTIONS INC. (IDS)';
      titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(1).height = 35;

      worksheet.mergeCells('A2:G2');
      const subtitleCell = worksheet.getCell('A2');
      subtitleCell.value = 'Quality on the floor. | IDS Pulse Payroll Portal';
      subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFFFFF' } };
      subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2C5282' } };
      subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getRow(2).height = 20;

      // 2. Report Metadata
      const conf = getConfidentiality(timeEntries, "payroll");
      worksheet.getCell('A4').value = 'Report Title:';
      worksheet.getCell('A4').font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell('B4').value = 'QuickBooks Timesheets & Payroll Summary Export';
      worksheet.getCell('B4').font = { bold: true };

      worksheet.getCell('A5').value = 'Generated Time:';
      worksheet.getCell('A5').font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell('B5').value = new Date().toLocaleString();

      worksheet.getCell('A6').value = 'Classification:';
      worksheet.getCell('A6').font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell('B6').value = 'STRICTLY CONFIDENTIAL - INTERNAL PAYROLL & FINANCIAL';
      worksheet.getCell('B6').font = { bold: true, color: { argb: 'B91C1C' } };

      // Style a mini red box for classification notice
      for (let col = 1; col <= 7; col++) {
        const cell = worksheet.getCell(7, col);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: redAlertBg } };
        cell.border = {
          top: { style: 'thin', color: { argb: redAlertBorder } },
          bottom: { style: 'thin', color: { argb: redAlertBorder } }
        };
      }
      worksheet.getCell('A7').value = 'Security Alert:';
      worksheet.getCell('A7').font = { bold: true, color: { argb: 'B91C1C' } };
      worksheet.mergeCells('B7:G7');
      worksheet.getCell('B7').value = 'RESTRICTED INTERNAL PAYROLL RECORD - DO NOT SHARE OUTSIDE IDS';
      worksheet.getCell('B7').font = { size: 9, bold: true, color: { argb: 'B91C1C' } };
      worksheet.getRow(7).height = 22;

      // 3. Main Data Table Headers
      const headers = [
        'Employee/Rep Name',
        'Date',
        'Plant',
        'Hours Worked',
        'Mileage (KM)',
        'Mileage Cost ($0.73)',
        'Total Billing'
      ];

      const headerRow = worksheet.getRow(10);
      headerRow.values = headers;
      headerRow.height = 26;

      for (let col = 1; col <= 7; col++) {
        const cell = headerRow.getCell(col);
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryBlue } };
        cell.alignment = { vertical: 'middle', horizontal: col <= 3 ? 'left' : (col <= 5 ? 'center' : 'right') };
        cell.border = {
          top: { style: 'medium', color: { argb: '0F172A' } },
          bottom: { style: 'medium', color: { argb: '0F172A' } }
        };
      }

      // 4. Data Rows
      timeEntries.forEach((entry, idx) => {
        const rIdx = 11 + idx;
        const row = worksheet.getRow(rIdx);
        const rep = users.find(u => u.id === entry.rep_id);
        const repName = rep ? rep.name : 'Unknown Rep';
        const plantName = entry.plant_id === 'gm_oshawa' ? 'GM Oshawa Plant' : 'Hutchinson Plant';
        const mileageCost = entry.mileage_km * 0.73;
        const totalBilling = entry.hours * 28.00 + mileageCost;

        row.values = [
          repName,
          entry.date,
          plantName,
          entry.hours,
          entry.mileage_km,
          mileageCost,
          totalBilling
        ];
        row.height = 22;

        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' };
        row.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(4).numFmt = '#,##0.00';
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(5).numFmt = '#,##0';
        row.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(6).numFmt = '$#,##0.00';
        row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
        row.getCell(7).numFmt = '$#,##0.00';

        for (let col = 1; col <= 7; col++) {
          const cell = row.getCell(col);
          cell.font = { name: 'Arial', size: 10 };
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'CBD5E1' } }
          };
        }
      });

      // 5. Total Row
      const totalHours = (timeEntries || []).filter(Boolean).reduce((acc, curr) => acc + (curr.hours || 0), 0);
      const totalMileage = (timeEntries || []).filter(Boolean).reduce((acc, curr) => acc + (curr.mileage_km || 0), 0);
      const totalMileageCost = totalMileage * 0.73;
      const totalInvoicedEst = totalHours * 28.00 + totalMileageCost;

      const totalRowIdx = 11 + timeEntries.length;
      const totalRow = worksheet.getRow(totalRowIdx);
      totalRow.values = [
        `Total (${timeEntries.length} Rep${timeEntries.length > 1 ? 's' : ''})`,
        '',
        '',
        totalHours,
        totalMileage,
        totalMileageCost,
        totalInvoicedEst
      ];
      totalRow.height = 24;

      totalRow.getCell(1).font = { bold: true };
      totalRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      totalRow.getCell(4).font = { bold: true };
      totalRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' };
      totalRow.getCell(4).numFmt = '#,##0.00';
      totalRow.getCell(5).font = { bold: true };
      totalRow.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      totalRow.getCell(5).numFmt = '#,##0';
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(6).alignment = { vertical: 'middle', horizontal: 'right' };
      totalRow.getCell(6).numFmt = '$#,##0.00';
      totalRow.getCell(7).font = { bold: true, color: { argb: '047857' } };
      totalRow.getCell(7).alignment = { vertical: 'middle', horizontal: 'right' };
      totalRow.getCell(7).numFmt = '$#,##0.00';

      for (let col = 1; col <= 7; col++) {
        const cell = totalRow.getCell(col);
        cell.border = {
          top: { style: 'thin', color: { argb: '475569' } },
          bottom: { style: 'double', color: { argb: '475569' } }
        };
      }

      // 6. Expenses Summary Table (v3.1)
      const expStartIdx = totalRowIdx + 3;
      worksheet.getCell(`A${expStartIdx}`).value = 'EXPENSES SUMMARY TABLE';
      worksheet.getCell(`A${expStartIdx}`).font = { name: 'Arial', size: 11, bold: true, color: { argb: primaryBlue } };

      const fuelTotal = expenseEntries.reduce((acc, curr) => acc + (curr.category === 'Fuel' ? parseFloat(curr.amount || 0) : 0), 0);
      const parkingTotal = expenseEntries.reduce((acc, curr) => acc + (curr.category === 'Parking' ? parseFloat(curr.amount || 0) : 0), 0);
      const tollsTotal = expenseEntries.reduce((acc, curr) => acc + (curr.category === 'Tolls' ? parseFloat(curr.amount || 0) : 0), 0);
      const mealsTotal = expenseEntries.reduce((acc, curr) => acc + (curr.category === 'Meals' ? parseFloat(curr.amount || 0) : 0), 0);
      const grandTotalExpenses = fuelTotal + parkingTotal + tollsTotal + mealsTotal;

      const expHeaderRow = worksheet.getRow(expStartIdx + 1);
      expHeaderRow.values = [
        'Expense Category',
        'Fuel Reimbursement',
        'Parking Cost',
        'Toll Fees',
        'Meal Allowance',
        '',
        'Total Expenses'
      ];
      expHeaderRow.height = 24;

      for (let col = 1; col <= 7; col++) {
        if (col === 6) continue;
        const cell = expHeaderRow.getCell(col);
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '047857' } };
        cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'left' : 'right' };
      }
      worksheet.mergeCells(`E${expStartIdx+1}:F${expStartIdx+1}`);

      const expDataRow = worksheet.getRow(expStartIdx + 2);
      expDataRow.values = [
        'Total Claims ($)',
        fuelTotal,
        parkingTotal,
        tollsTotal,
        mealsTotal,
        '',
        grandTotalExpenses
      ];
      expDataRow.height = 22;

      expDataRow.getCell(1).font = { name: 'Arial', size: 10, bold: true };
      expDataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

      for (let col = 2; col <= 7; col++) {
        if (col === 6) continue;
        const cell = expDataRow.getCell(col);
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '$#,##0.00';
      }
      worksheet.mergeCells(`E${expStartIdx+2}:F${expStartIdx+2}`);

      for (let col = 1; col <= 7; col++) {
        if (col === 6) continue;
        const cell = expDataRow.getCell(col);
        cell.border = {
          bottom: { style: 'double', color: { argb: '047857' } }
        };
      }

      // 7. Report Summary & Statistics
      const statsStartIdx = expStartIdx + 5;
      worksheet.getCell(`A${statsStartIdx}`).value = 'REPORT SUMMARY & STATISTICS';
      worksheet.getCell(`A${statsStartIdx}`).font = { size: 11, bold: true, color: { argb: primaryBlue } };

      worksheet.getCell(`A${statsStartIdx+1}`).value = 'Total Payroll Records:';
      worksheet.getCell(`A${statsStartIdx+1}`).font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell(`B${statsStartIdx+1}`).value = timeEntries.length;
      worksheet.getCell(`B${statsStartIdx+1}`).alignment = { horizontal: 'left' };

      worksheet.getCell(`A${statsStartIdx+2}`).value = 'Total Hours Worked:';
      worksheet.getCell(`A${statsStartIdx+2}`).font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell(`B${statsStartIdx+2}`).value = `${totalHours.toFixed(2)} hrs`;

      worksheet.getCell(`A${statsStartIdx+3}`).value = 'Total Mileage Claimed:';
      worksheet.getCell(`A${statsStartIdx+3}`).font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell(`B${statsStartIdx+3}`).value = `${totalMileage.toFixed(2)} km`;

      worksheet.getCell(`A${statsStartIdx+4}`).value = 'Total Mileage Reimbursement:';
      worksheet.getCell(`A${statsStartIdx+4}`).font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell(`B${statsStartIdx+4}`).value = totalMileageCost;
      worksheet.getCell(`B${statsStartIdx+4}`).numFmt = '$#,##0.00';
      worksheet.getCell(`B${statsStartIdx+4}`).alignment = { horizontal: 'left' };

      worksheet.getCell(`A${statsStartIdx+5}`).value = 'Total Expense Reimbursement:';
      worksheet.getCell(`A${statsStartIdx+5}`).font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell(`B${statsStartIdx+5}`).value = grandTotalExpenses;
      worksheet.getCell(`B${statsStartIdx+5}`).numFmt = '$#,##0.00';
      worksheet.getCell(`B${statsStartIdx+5}`).alignment = { horizontal: 'left' };

      worksheet.getCell(`A${statsStartIdx+6}`).value = 'Grand Invoice Total:';
      worksheet.getCell(`A${statsStartIdx+6}`).font = { bold: true, color: { argb: textSlate } };
      worksheet.getCell(`B${statsStartIdx+6}`).value = totalInvoicedEst + grandTotalExpenses;
      worksheet.getCell(`B${statsStartIdx+6}`).numFmt = '$#,##0.00';
      worksheet.getCell(`B${statsStartIdx+6}`).font = { bold: true, color: { argb: '047857' } };
      worksheet.getCell(`B${statsStartIdx+6}`).alignment = { horizontal: 'left' };

      // 8. Security Notice Footer
      const footerStartIdx = statsStartIdx + 9;
      worksheet.getCell(`A${footerStartIdx}`).value = 'FOOTER & SECURITY NOTICE';
      worksheet.getCell(`A${footerStartIdx}`).font = { size: 9, bold: true, color: { argb: textSlate } };

      worksheet.mergeCells(`A${footerStartIdx+1}:G${footerStartIdx+1}`);
      worksheet.getCell(`A${footerStartIdx+1}`).value = 'Restricted to internal payroll processing. Unauthorized sharing is strictly prohibited.';
      worksheet.getCell(`A${footerStartIdx+1}`).font = { size: 8.5, italic: true, color: { argb: '64748B' } };

      worksheet.mergeCells(`A${footerStartIdx+2}:G${footerStartIdx+2}`);
      worksheet.getCell(`A${footerStartIdx+2}`).value = '(C) 2026 Integrity Driven Solutions Inc. All rights reserved. | Powered by IDS Pulse';
      worksheet.getCell('A' + (footerStartIdx+2)).font = { size: 8, color: { argb: '94A3B8' } };

      // Write to buffer and download
      const todayDate = new Date().toISOString().substring(0, 10);
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `IDS_Timesheets_Payroll_${todayDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export Excel:', error);
      alert('Error generating Excel file: ' + error.message);
    }
  };

  // Pulse AI Database Audit Engine
  const runPulseAiAudit = () => {
    setIsAuditing(true);
    const logs = [];

    // 1. Audit Timesheet Data
    timeEntries.forEach((entry) => {
      // Rule A: Hours > 16 in a day
      if (entry.hours > 16) {
        logs.push({
          type: 'error',
          category: 'Timesheet',
          message: `Representative hours exceed standard threshold. Logged ${entry.hours} hrs on ${entry.date}.`,
          item: entry
        });
      }
      // Rule B: Negative values
      if (entry.hours < 0 || entry.mileage_km < 0) {
        logs.push({
          type: 'error',
          category: 'Timesheet',
          message: `Negative values detected: Logged ${entry.hours} hrs, ${entry.mileage_km} km on ${entry.date}.`,
          item: entry
        });
      }
    });

    // 2. Audit Defect Incidents
    incidents.forEach((inc) => {
      // Rule A: Missing Supplier Contact or description too short
      if (!inc.supplier_contact || inc.supplier_contact.trim() === '') {
        logs.push({
          type: 'warning',
          category: 'Incident Log',
          message: `Incident ${inc.id} lacks a registered Supplier QM Contact.`,
          item: inc
        });
      }
      if (!inc.description || inc.description.trim().length < 15) {
        logs.push({
          type: 'warning',
          category: 'Incident Log',
          message: `Incident ${inc.id} description is critically short or incomplete.`,
          item: inc
        });
      }
    });

    // 3. AI Duplicate Defects Check
    // We group by day, part_id, and area
    const dayGroups = {};
    incidents.forEach((inc) => {
      const day = inc.created_at.substring(0, 10);
      const key = `${day}_${inc.part_id}_${inc.area}`;
      if (!dayGroups[key]) {
        dayGroups[key] = [];
      }
      dayGroups[key].push(inc);
    });

    Object.keys(dayGroups).forEach((key) => {
      const group = dayGroups[key];
      if (group.length > 1) {
        logs.push({
          type: 'warning',
          category: 'Duplicate Detection',
          message: `Potential duplicate incident logs detected (Qty: ${group.length}) for part ${group[0].part_id} in ${group[0].area} on date ${key.substring(0,10)}.`,
          items: group
        });
      }
    });

    // 4. Audit Expense Claims
    expenseEntries.forEach((entry) => {
      if (entry.amount > 100 && (!entry.receipt_photo || entry.receipt_photo.trim() === '')) {
        logs.push({
          type: 'warning',
          category: 'Expense Verification',
          message: `⚠️ Audit Alert: High expense entry logged without receipt validation (Logged $${parseFloat(entry.amount).toFixed(2)} under ${entry.category} on ${entry.date}).`,
          item: entry
        });
      }
    });

    let filteredLogs = logs;
    if (userRole === 'lead') {
      filteredLogs = logs.filter(log => log.category === 'Incident Log' || log.category === 'Duplicate Detection');
    } else if (userRole === 'accountant') {
      filteredLogs = logs.filter(log => log.category === 'Timesheet' || log.category === 'Expense Verification');
    }

    setAuditLogs(filteredLogs);
    setHasRunAudit(true);
    setIsAuditing(false);
    return filteredLogs;
  };

  // Shared AI Command & Permission Processor
  const processAiCommand = (cmdText) => {
    const lowerText = cmdText.toLowerCase();
    let responseText = '';
    let action = null; // 'excel' | 'csv' | 'pdf' | 'audit' | null

    // 1. Financial check
    const isFinancialQuery = lowerText.includes('excel') || lowerText.includes('xlsx') || lowerText.includes('payroll') || lowerText.includes('csv') || lowerText.includes('quickbooks') || lowerText.includes('qb');
    if (isFinancialQuery && userRole === 'lead') {
      return {
        responseText: "Access Denied: As Quality Lead, you do not have permission to view, audit, or export financial timesheets or payroll records.",
        action: null
      };
    }

    // 2. Quality check
    const isQualityQuery = lowerText.includes('report') || lowerText.includes('pdf') || lowerText.includes('download') || lowerText.includes('defect') || lowerText.includes('duplicate');
    if (isQualityQuery && userRole === 'accountant') {
      return {
        responseText: "Access Denied: As Accountant, you do not have permission to view, audit, or export quality defect incidents or reports.",
        action: null
      };
    }

    // 3. Process commands
    if (lowerText.includes('audit') || lowerText.includes('error') || lowerText.includes('mistake') || lowerText.includes('number') || lowerText.includes('defect') || lowerText.includes('duplicate')) {
      const logs = runPulseAiAudit();
      const count = logs.length;
      if (userRole === 'lead') {
        responseText = count > 0 
          ? `I have completed the Quality Defect audit. ⚠️ Found ${count} potential defect log gaps or duplicate entries in the system. I have flagged them in the Audit Center.`
          : "I have successfully audited the Quality Defect logs. 🟢 All entries are complete, and no duplicate defects or missing supplier QM contacts were found!";
      } else if (userRole === 'accountant') {
        responseText = count > 0 
          ? `I have completed the Financial timesheet audit. ⚠️ Found ${count} potential errors, negative values, or missing receipts in the system. I have flagged them in the Audit & Verification Center.`
          : "I have successfully audited all timesheets and mileage logs. 🟢 No calculations discrepancies, negative hours, or missing receipts were found!";
      } else {
        responseText = count > 0 
          ? `I have completed the full system audit. ⚠️ Found ${count} total warnings (timesheet discrepancies, missing receipts, and duplicate defect logs). I have flagged them in the Audit Center on the right panel.`
          : "I have successfully audited the entire database. 🟢 All calculations are correct, and no math discrepancies, overlaps, or duplicate logs were found!";
      }
      action = 'audit';
    } else if (lowerText.includes('excel') || lowerText.includes('xlsx') || lowerText.includes('payroll')) {
      const name = userRole === 'shahroz' ? 'Shahroz' : 'Colleen';
      responseText = `Sure ${name}, I am compiling and exporting the styled Excel spreadsheet (.xlsx) now. It will include dynamic headers, total invoicing calculations, and proper alignments.`;
      action = 'excel';
    } else if (lowerText.includes('csv') || lowerText.includes('quickbooks') || lowerText.includes('qb')) {
      responseText = "Sure, exporting the QuickBooks CSV spreadsheet now. It contains corporate headers and formatted timesheets.";
      action = 'csv';
    } else if (lowerText.includes('report') || lowerText.includes('pdf') || lowerText.includes('download')) {
      responseText = userRole === 'lead' ? "Generating compiled Quality Rework Feed report PDF..." : "Generating compiled Timesheet Audit report PDF...";
      action = 'pdf';
    } else if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
      if (userRole === 'shahroz') {
        responseText = "Hello Shahroz Mirza! I am online and ready to audit. Let me know if you want me to audit timesheets, verify defect metrics, or export documents.";
      } else if (userRole === 'admin' || userRole === 'owner') {
        responseText = "Hello Greg Phillippe! I am online and ready to audit. Let me know if you want me to audit timesheets or export documents.";
      } else if (userRole === 'accountant') {
        responseText = "Hello Colleen Boyd! I am online and ready to audit timesheets or export payroll spreadsheets.";
      } else if (userRole === 'lead') {
        responseText = "Hello Donna Cabral! I am online and ready to audit quality logs or run duplicate defect checks.";
      } else {
        responseText = "Hello! I am online and ready to assist you. Let me know what you need.";
      }
    } else {
      if (userRole === 'lead') {
        responseText = "I'm not sure how to process that request. As Quality Lead, you can ask me to: \n1. 'Audit quality defect logs' \n2. 'Scan for duplicate defects' \n3. 'Download Quality Report PDF'";
      } else if (userRole === 'accountant') {
        responseText = "I'm not sure how to process that request. As Accountant, you can ask me to: \n1. 'Audit timesheets and receipts' \n2. 'Download the styled Excel payroll sheet' \n3. 'Export QuickBooks CSV timesheets'";
      } else {
        responseText = "I'm not sure how to process that request. You can ask me to: \n1. 'Audit the database for mistakes' \n2. 'Download the styled Excel payroll sheet' \n3. 'Export QuickBooks CSV timesheets'\n4. 'Download the Timesheet PDF report'";
      }
    }

    return { responseText, action };
  };

  // Immediate Chip Command Executor
  const executeQuickCommand = (cmdText) => {
    // Add user message
    const userMsg = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: cmdText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setPulseAiChat(prev => [...prev, userMsg]);

    setTimeout(() => {
      const { responseText, action } = processAiCommand(cmdText);

      if (action === 'excel') {
        handleExportExcel();
      } else if (action === 'csv') {
        handleExportQuickBooks();
      } else if (action === 'pdf') {
        if (userRole === 'lead') {
          handleDownloadReworkFeedReport();
        } else {
          handleDownloadTimesheetReport();
        }
      }

      const aiMsg = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setPulseAiChat(prev => [...prev, aiMsg]);
    }, 800);
  };

  // Input Box Submit Parser
  const handleSendPulseAiMessage = (e) => {
    if (e) e.preventDefault();
    const text = pulseAiInput.trim();
    if (!text) return;

    // Add user message
    const userMsg = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setPulseAiChat(prev => [...prev, userMsg]);
    setPulseAiInput('');

    setTimeout(() => {
      const { responseText, action } = processAiCommand(text);

      if (action === 'excel') {
        handleExportExcel();
      } else if (action === 'csv') {
        handleExportQuickBooks();
      } else if (action === 'pdf') {
        if (userRole === 'lead') {
          handleDownloadReworkFeedReport();
        } else {
          handleDownloadTimesheetReport();
        }
      }

      const aiMsg = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setPulseAiChat(prev => [...prev, aiMsg]);
    }, 800);
  };

  return (
    <div className={`web-dashboard-frame flex-1 bg-[#080d1a] border border-slate-850 rounded-3xl p-6 shadow-2xl flex flex-col ${layoutMode === 'dashboard-only' || layoutMode === 'roadmap-only' ? 'min-h-[calc(100vh-140px)]' : 'h-[780px]'} overflow-hidden text-left relative`}>
      
      {/* Dashboard Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="IDS Logo" className="h-10 w-auto object-contain flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white leading-none m-0 tracking-tight">
                {forceRoadmapOnly ? 'IDS Pulse Production Launch Roadmap' : 'IDS Pulse Portal'}
              </h1>
              <span className="text-[9px] bg-[#1E3A5F]/60 border border-[#22D3EE]/25 text-[#22D3EE] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                {forceRoadmapOnly ? 'Roadmap' : 'Web CRM'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-none">
              {forceRoadmapOnly 
                ? 'Visual 36-Week Rollout Timeline, Team Staffing Budget Estimations & Store Approvals Checklist'
                : 'Management, Audit Tracking & Supplier Intelligence Platform'}
            </p>
          </div>
        </div>

        {/* Right Header Panel: Clock + User Profile + Help Guide + Reset DB */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="text-right hidden md:flex flex-col text-[10px] font-medium text-slate-400 pr-1.5 h-9 justify-center">
            <span className="text-slate-350 font-bold font-mono leading-none">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} EST
            </span>
            <span className="text-[8px] text-slate-500 mt-0.5 leading-none">Ontario Plant Time</span>
          </div>

          {/* User Profile Widget */}
          <div className="flex items-center gap-2 px-2.5 h-9 bg-slate-900/60 border border-slate-800 rounded-xl">
            {(() => {
              const uRole = sessionStorage.getItem('ids_pulse_role') || 'admin';
              const uUser = sessionStorage.getItem('ids_pulse_admin_user') || 'donna';
              let initials = 'DC';
              let fullName = 'Donna Cabral';
              let title = 'QA Supervisor';
              
              if (uRole === 'accountant' || uUser === 'colleen') { initials = 'CB'; fullName = 'Colleen B.'; title = 'Accountant'; }
              else if (uRole === 'shahroz' || uUser === 'shahroz') { initials = 'SM'; fullName = 'Shahroz Mirza'; title = 'Super Admin'; }
              else if (uUser === 'greg') { initials = 'GP'; fullName = 'Greg Phillippe'; title = 'Director of Quality'; }
              else if (uUser === 'monica') { initials = 'MV'; fullName = 'Monica Vargas'; title = 'Executive Assistant'; }
              else if (uUser === 'diana') { initials = 'DP'; fullName = 'Diana Pulse'; title = 'Executive Admin'; }
              else if (uUser === 'iris') { initials = 'IR'; fullName = 'Iris R.'; title = 'QA Admin'; }
              else if (uUser === 'miriam') { initials = 'MB'; fullName = 'Miriam B.'; title = 'QA Coordinator'; }
              
              return (
                <>
                  <div className="w-6 h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center font-bold text-[9px] text-[#22D3EE] border border-[#22D3EE]/25">
                    {initials}
                  </div>
                  <div className="hidden lg:flex flex-col text-left justify-center">
                    <span className="text-[9px] font-extrabold text-white leading-none">{fullName}</span>
                    <span className="text-[7px] text-[#22D3EE] font-bold mt-0.5 leading-none">{title}</span>
                  </div>
                </>
              );
            })()}
          </div>

          <button 
            onClick={() => setShowHelpDrawer(true)}
            className="h-9 flex items-center gap-1 bg-[#1E3A5F]/60 hover:bg-[#1E3A5F] text-[#22D3EE] border border-[#22D3EE]/25 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all hover:scale-102"
            title="Open Interactive Guide"
          >
            <span>❓ How to use this Portal</span>
          </button>

          <button 
            onClick={handleReset}
            className="h-9 flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-450 hover:text-white px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            title="Restore local browser sandbox seeds"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Restore Demo Seeds</span>
          </button>
        </div>
      </div>

      {/* DAILY CALENDAR DATE NAVIGATION & FLOOR HEALTH STATUS STRIP */}
      {!forceRoadmapOnly && (
        <div className="flex flex-col mt-4 flex-shrink-0 bg-slate-900/35 border border-slate-800/80 p-3.5 rounded-2xl gap-3" onClick={(e) => e.stopPropagation()}>
          
          {/* Top Row: Active selected date display and quick toggle options */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-850 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Active View:</span>
              <button
                key="active-date-display-trigger"
                type="button"
                onClick={() => {
                  const dObj = new Date(selectedDate + 'T00:00:00');
                  setCalendarMonthIndex(isNaN(dObj.getTime()) ? 5 : dObj.getMonth());
                  setCalendarYear(isNaN(dObj.getTime()) ? 2026 : dObj.getFullYear());
                  setShowCalendarModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#1E3A5F]/80 text-[#22D3EE] hover:text-white rounded-xl border border-[#22D3EE]/30 cursor-pointer transition-all shadow-sm text-xs font-bold animate-pulse-subtle"
                aria-label="Active date selection, click to choose a date from calendar"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {showAllDates 
                    ? "Showing All Historical Records" 
                    : `Selected: ${formatReadableDate(selectedDate)}`}
                </span>
              </button>

              {/* Show All History Quick Toggle */}
              <button
                key="show-all-history-toggle"
                type="button"
                onClick={() => setShowAllDates(!showAllDates)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  showAllDates
                    ? 'bg-indigo-650/30 text-indigo-300 border-indigo-500/40 shadow-md'
                    : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:bg-slate-900'
                }`}
                aria-label={showAllDates ? "Switch to daily filtered view" : "Show all historical records"}
              >
                {showAllDates ? '📅 Filter by Day' : '🌍 Show All History'}
              </button>
            </div>
          </div>

          {/* Bottom Row: Choose Date Calendar button, Recent Date Chips, and Floor Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider pr-1 flex-shrink-0">
                Audited Date:
              </span>
              
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Choose Date calendar trigger button at the start of dates (exactly where circled) */}
                <button
                  key="choose-date-btn-start"
                  type="button"
                  onClick={() => {
                    const dObj = new Date(selectedDate + 'T00:00:00');
                    setCalendarMonthIndex(isNaN(dObj.getTime()) ? 5 : dObj.getMonth());
                    setCalendarYear(isNaN(dObj.getTime()) ? 2026 : dObj.getFullYear());
                    setShowCalendarModal(true);
                  }}
                  className="h-8 w-8 bg-[#0EA5E9] hover:bg-[#0284c7] text-white rounded-lg flex-shrink-0 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105"
                  title="Choose Custom Date"
                  aria-label="Open date picker calendar modal"
                >
                  <Calendar className="w-4 h-4 text-white" />
                </button>

                {/* Dynamic Recent Date Chips (Exactly 7 consecutive days) */}
                {getRecentDates().map(dateStr => {
                  const dateObj = new Date(dateStr + 'T00:00:00');
                  const isSelected = selectedDate === dateStr && !showAllDates;
                  const activity = getDateActivity(dateStr);
                  const isToday = dateStr === '2026-06-01';
                  
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setShowAllDates(false);
                      }}
                      className={`h-8 px-2.5 rounded-lg flex-shrink-0 flex items-center gap-1.5 border transition-all cursor-pointer hover:scale-102 ${
                        isSelected
                          ? 'bg-[#1E3A5F] border-[#22D3EE]/30 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                      aria-label={`Select date ${formatReadableDate(dateStr)}`}
                    >
                      <span className="text-[8px] font-bold uppercase tracking-wider text-slate-505">
                        {isToday ? 'TODAY' : dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-xs font-extrabold">
                        {dateObj.toLocaleDateString('en-US', { day: '2-digit' })}
                      </span>
                      
                      {/* Visual Event Dots for daily items check */}
                      <div className="flex gap-0.5 ml-0.5">
                        {activity.hasIncidents && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Incident Logged"></span>}
                        {activity.hasShifts && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Shift Completed"></span>}
                        {activity.hasRework && <span className="w-1.5 h-1.5 bg-sky-500 rounded-full" title="Rework Registered"></span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={`h-8 px-3 rounded-xl border flex items-center gap-2 text-[10px] font-bold ${
              showAllDates 
                ? 'bg-slate-900/60 border-slate-850 text-slate-400' 
                : totalOpenIncidents > 0
                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                showAllDates 
                  ? 'bg-slate-400' 
                  : totalOpenIncidents > 0 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-emerald-500'
              }`}></div>
              <span>
                {showAllDates 
                  ? 'All History Mode' 
                  : totalOpenIncidents > 0 
                  ? `${totalOpenIncidents} Open Incidents` 
                  : 'Floor Clear (No Incidents)'}
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Metrics Cards row with Helper Explanations */}
      {!forceRoadmapOnly && (
        <div className="grid grid-cols-4 gap-4 mt-5 flex-shrink-0">
        <div className="glass-panel hover:border-slate-700/60 glow-pulse-red rounded-2xl p-4 flex flex-col justify-between h-28 border-red-500/10 hover:border-red-500/30 transition-all">
          <div>
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Active Suspect Materials</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block leading-none">{totalOpenIncidents}</span>
          </div>
          <span className="text-[9px] text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/20 px-2 py-0.5 rounded font-bold w-fit">
            Awaiting Supplier Actions
          </span>
        </div>
        
        <div className="glass-panel hover:border-slate-700/60 glow-pulse-emerald rounded-2xl p-4 flex flex-col justify-between h-28 border-emerald-500/10 hover:border-emerald-500/30 transition-all">
          <div>
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Parts Reworked</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block leading-none">{totalReworkPcs} pcs</span>
          </div>
          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold w-fit">
            Rework Logs Synced
          </span>
        </div>
        
        <div className="glass-panel hover:border-slate-700/60 glow-pulse-blue rounded-2xl p-4 flex flex-col justify-between h-28 border-sky-500/10 hover:border-sky-500/30 transition-all">
          <div>
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Active Rep Dispatches</span>
            <span className="text-2xl font-extrabold text-white mt-0.5 block leading-none">{activeRepsCount} reps</span>
          </div>
          <span className="text-[9px] text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded font-bold w-fit">
            Auditing Plant Floors
          </span>
        </div>
        
        {['admin', 'owner', 'accountant', 'lead', 'shahroz'].includes(userRole) ? (
          <div className="glass-panel hover:border-slate-700/60 glow-pulse-purple rounded-2xl p-4 flex flex-col justify-between h-28 border-purple-500/10 hover:border-purple-500/30 transition-all">
            <div>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Supplier Invoice Billable</span>
              <span className="text-2xl font-extrabold text-white mt-0.5 block leading-none">
                {selectedCurrencyFilter === 'CAD' ? `C$ ${cadInvoicedTotal.toFixed(2)}` : 
                 selectedCurrencyFilter === 'USD' ? `US$ ${usdInvoicedTotal.toFixed(2)}` : 
                 `C$ ${cadInvoicedTotal.toFixed(2)} / US$ ${usdInvoicedTotal.toFixed(2)}`}
              </span>
            </div>
            <span className="text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold w-fit">
              Rate: $0.73/km standard
            </span>
          </div>
        ) : (
          <div className="glass-panel hover:border-slate-700/60 glow-pulse-purple rounded-2xl p-4 flex flex-col justify-between h-28 border-purple-500/10 hover:border-purple-500/30 transition-all">
            <div>
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Total Audited Hours</span>
              <span className="text-2xl font-extrabold text-white mt-0.5 block leading-none">{totalHours.toFixed(1)} hrs</span>
            </div>
            <span className="text-[9px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded font-bold w-fit">
              Audited Floor Hours Logged
            </span>
          </div>
        )}
      </div>
      )}

      {/* Main Panel Content Area */}
      <div className="flex-1 flex gap-5 mt-5 min-h-0">
        
        {/* Navigation Sidebar */}
        {!forceRoadmapOnly && (
          <div className="w-56 flex flex-col gap-2 flex-shrink-0">
            {/* QRE SIDEBAR BUTTONS */}
            {userRole === 'qre' && (
              <>
                <button 
                  onClick={() => setActiveTab('pulse-ai')}
                  className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border relative overflow-hidden group ${
                    activeTab === 'pulse-ai' 
                      ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/50 shadow-md shadow-[#22D3EE]/10' 
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                    <span>Pulse AI Help</span>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('time-tracking')}
                  className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                    activeTab === 'time-tracking' 
                      ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                      : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>My Hours & Expenses</span>
                  </div>
                  {activeTab === 'time-tracking' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                </button>
              </>
            )}

            {/* CUSTOMER SIDEBAR BUTTONS */}
            {userRole === 'customer' && (
              <>
                <button 
                  onClick={() => setActiveTab('customer-portal')}
                  className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                    activeTab === 'customer-portal' 
                      ? 'bg-sky-500/10 text-white border-sky-400/30 shadow-md shadow-sky-400/5' 
                      : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-sky-400" />
                    <span>Customer Dashboard</span>
                  </div>
                  {activeTab === 'customer-portal' && <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>}
                </button>

                <button 
                  onClick={() => setActiveTab('shift-logs')}
                  className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                    activeTab === 'shift-logs' 
                      ? 'bg-sky-500/10 text-white border-sky-400/30 shadow-md shadow-sky-400/5' 
                      : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span>Published Reports</span>
                  </div>
                  {activeTab === 'shift-logs' && <div className="w-1.5 h-1.5 rounded-full bg-sky-400"></div>}
                </button>

                <button 
                  onClick={() => setActiveTab('approvals')}
                  className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                    activeTab === 'approvals' 
                      ? 'bg-amber-500/10 text-white border-amber-400/30 shadow-md shadow-amber-400/5' 
                      : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Time & Approvals</span>
                  </div>
                  {expenseEntries.filter(e => e.status === 'pending_customer').length > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {expenseEntries.filter(e => e.status === 'pending_customer').length}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* ADMIN SIDEBAR BUTTONS */}
            {['admin', 'owner', 'accountant', 'lead', 'shahroz'].includes(userRole) && (
              <>
                <button 
                  onClick={() => setActiveTab('pulse-ai')}
                  className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border relative overflow-hidden group ${
                    activeTab === 'pulse-ai' 
                      ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/50 shadow-md shadow-[#22D3EE]/10' 
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                  }`}
                >
                  <div className="absolute inset-y-0 left-0 w-[3px] bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]"></div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#22D3EE] animate-pulse" />
                    <span className="text-[#22D3EE] font-extrabold tracking-wide">Pulse AI</span>
                  </div>
                  <span className="text-[7.5px] bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">Beta</span>
                </button>

                {/* Hide these tabs from accountant */}
                {userRole !== 'accountant' && (
                  <>
                 <button
                    onClick={() => setActiveTab('incidents')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'incidents' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-[#22D3EE]" />
                      <span>Incident Defects Feed</span>
                    </div>
                    {activeTab === 'incidents' && <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>}
                  </button>

                  <button 
                    onClick={() => setActiveTab('heatmap')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'heatmap' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#22D3EE]" />
                      <span>Visual Defect Matrix</span>
                    </div>
                    {activeTab === 'heatmap' && <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>}
                  </button>

                  <button 
                    onClick={() => setActiveTab('daily-planner')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'daily-planner' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#22D3EE]" />
                      <span>Daily Tasks Planner</span>
                    </div>
                    {activeTab === 'daily-planner' && <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>}
                  </button>

                  <button 
                    onClick={() => setActiveTab('shift-logs')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'shift-logs' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#0EA5E9]" />
                      <span>Shift Summaries Log</span>
                    </div>
                    {activeTab === 'shift-logs' && <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]"></div>}
                  </button>

                  <button 
                    onClick={() => setActiveTab('suppliers')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'suppliers' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 text-[#0EA5E9]" />
                      <span>Suppliers Directory</span>
                    </div>
                    {activeTab === 'suppliers' && <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]"></div>}
                  </button>
                  </>
                )}

                  <button 
                    onClick={() => setActiveTab('time-tracking')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'time-tracking' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Timesheets & Mileage</span>
                    </div>
                    {activeTab === 'time-tracking' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                  </button>

                {/* Hide these from accountant */}
                {userRole !== 'accountant' && (
                  <>
                  <button 
                    onClick={() => setActiveTab('rework-logs')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'rework-logs' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 text-[#22D3EE]" />
                      <span>Rework Logs Feed</span>
                    </div>
                    {activeTab === 'rework-logs' && <div className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></div>}
                  </button>

                  <button 
                    onClick={() => setActiveTab('emails')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'emails' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span>Email Logs</span>
                    </div>
                    {activeTab === 'emails' && <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>}
                  </button>
                  </>
                )}

                  <button 
                    onClick={() => setActiveTab('users')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'users' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>User Directory</span>
                    </div>
                    {activeTab === 'users' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>}
                  </button>

                  {userRole === 'shahroz' && (
                    <button 
                      onClick={() => setActiveTab('roadmap')}
                      className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                        activeTab === 'roadmap' 
                          ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                          : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Milestone className="w-4 h-4 text-amber-400" />
                        <span>Launch Roadmap</span>
                      </div>
                      {activeTab === 'roadmap' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>}
                    </button>
                  )}

                  <button 
                    onClick={() => setActiveTab('projects')}
                    className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                      activeTab === 'projects' 
                        ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                        : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderKanban className="w-4 h-4 text-cyan-400" />
                      <span>Projects Registry</span>
                    </div>
                    {activeTab === 'projects' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>}
                  </button>

                  {userRole === 'shahroz' && (
                    <button 
                      onClick={() => setActiveTab('system-logs')}
                      className={`w-full h-10 px-3.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-between border ${
                        activeTab === 'system-logs' 
                          ? 'bg-[#1E3A5F] text-white border-[#22D3EE]/30 shadow-md shadow-[#22D3EE]/5' 
                          : 'bg-slate-900/40 text-slate-400 hover:bg-slate-900/90 hover:text-slate-200 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Server className="w-4 h-4 text-emerald-450" />
                        <span>System Events Logs</span>
                      </div>
                      {activeTab === 'system-logs' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>}
                    </button>
                  )}
                </>
              )}
            </div>
        )}

        <div className="flex-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-5 flex flex-col min-h-0">
{/* TAB 0: PULSE AI (Conversational Database Auditor & Copilot) */}
          {activeTab === 'pulse-ai' && (
            <div className="flex-1 flex gap-5 min-h-0">
              {/* Left Side: Chat Console */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-950/45 border border-slate-850 p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#1E3A5F]/60 border border-[#22D3EE]/25 flex items-center justify-center">
                      <Sparkles className="w-4.5 h-4.5 text-[#22D3EE] animate-pulse" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Pulse AI</h3>
                      <p className="text-[9px] text-[#22D3EE] font-bold">Online & Synchronized with database</p>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1E3A5F]/60 border border-[#22D3EE]/25 text-[#22D3EE] rounded-lg text-[8.5px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE] animate-ping"></span>
                    <span>System Ready</span>
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin my-3 pr-1 flex flex-col gap-3.5 text-left">
                  {pulseAiChat.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[8.5px] text-slate-500 font-bold uppercase">
                          {msg.sender === 'user' ? 'Shahroz Mirza' : 'Pulse AI'}
                        </span>
                        <span className="text-[7.5px] text-slate-600 font-medium">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div 
                        className={`p-3 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                          msg.sender === 'user'
                            ? 'bg-[#1E3A5F] text-white rounded-tr-none border border-[#22D3EE]/20'
                            : 'bg-slate-900 text-slate-250 rounded-tl-none border border-slate-800'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Prompts Chips Section */}
                <div className="flex flex-wrap gap-1.5 mb-3 flex-shrink-0">
                  {(userRole === 'shahroz' || userRole === 'admin' || userRole === 'owner') && (
                    <>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Audit database for mistakes")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        🔍 Audit Database for Errors
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Check for duplicate incident reports")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        🚨 Scan Duplicate Defects
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Export styled Excel (.xlsx)")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        📊 Export Styled Excel (.xlsx)
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Export QuickBooks CSV")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        📄 Export QuickBooks CSV
                      </button>
                    </>
                  )}
                  {userRole === 'accountant' && (
                    <>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Audit timesheets and receipts")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        🔍 Audit Timesheets & Receipts
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Export styled Excel (.xlsx)")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        📊 Export Styled Excel (.xlsx)
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Export QuickBooks CSV")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        📄 Export QuickBooks CSV
                      </button>
                    </>
                  )}
                  {userRole === 'lead' && (
                    <>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Audit defect logs")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        🔍 Audit Quality Defect Logs
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Check for duplicate incident reports")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        🚨 Scan Duplicate Defects
                      </button>
                      <button 
                        type="button"
                        onClick={() => executeQuickCommand("Download Quality Report (PDF)")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white text-[9.5px] font-bold cursor-pointer transition-colors"
                      >
                        📋 Download Quality Report (PDF)
                      </button>
                    </>
                  )}
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendPulseAiMessage} className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="text"
                    value={pulseAiInput}
                    onChange={(e) => setPulseAiInput(e.target.value)}
                    placeholder="Ask Pulse AI to audit timesheets or export files..."
                    className="flex-1 h-10 px-3.5 bg-slate-900 border border-slate-800 focus:border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-colors"
                  />
                  <button 
                    type="submit"
                    className="w-10 h-10 bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white rounded-xl border border-[#22D3EE]/20 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Right Side: Audit & Security Center */}
              <div className="w-80 flex flex-col min-h-0 bg-slate-950/45 border border-slate-850 p-4 rounded-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0 text-left">
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Audit & Security Center</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5">Database anomaly checking ruleset</p>
                  </div>
                  <button 
                    type="button"
                    onClick={runPulseAiAudit}
                    className="px-2.5 py-1 bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold rounded-lg text-[9px] uppercase cursor-pointer transition-colors"
                  >
                    Run Scan
                  </button>
                </div>

                {/* Audit center content body */}
                <div className="flex-1 overflow-y-auto scrollbar-thin my-3 pr-1 flex flex-col gap-3 text-left">
                  {!hasRunAudit ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 gap-2">
                      <Shield className="w-10 h-10 text-slate-600 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Database Scanner Idle</span>
                      <span className="text-[9px]">Click "Run Scan" or ask Pulse AI in the chat to audit live data for issues.</span>
                    </div>
                  ) : (
                    <>
                      {/* Database Status summary box */}
                      <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl flex flex-col gap-1.5">
                        <span className="text-[8.5px] text-slate-500 font-extrabold uppercase">Scan Summary</span>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="flex flex-col">
                            <span className="text-slate-450 font-medium">Flagged Items:</span>
                            <span className={`font-bold mt-0.5 ${auditLogs.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {auditLogs.length} warnings
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-450 font-medium">Database Status:</span>
                            <span className={`font-bold mt-0.5 ${auditLogs.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {auditLogs.length > 0 ? 'Action Required' : 'Secure / Correct'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Flagged logs checklist */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[8.5px] text-slate-500 font-extrabold uppercase mb-1">Scan Warnings ({auditLogs.length})</span>
                        
                        {auditLogs.length === 0 ? (
                          <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-[10px] font-bold">
                            🟢 All calculations verified! 100% accurate data.
                          </div>
                        ) : (
                          auditLogs.map((log, index) => (
                            <div 
                              key={index}
                              className={`p-3 border rounded-xl flex flex-col gap-1.5 ${
                                log.type === 'error'
                                  ? 'bg-red-950/10 border-red-500/20 text-red-200'
                                  : 'bg-amber-950/10 border-amber-500/20 text-amber-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide ${
                                  log.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {log.category}
                                </span>
                                <span className="text-[8.5px] font-bold text-slate-500 font-mono">#{index + 1}</span>
                              </div>
                              <span className="text-[10px] leading-relaxed font-semibold">{log.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Audit center footer */}
                <div className="pt-2 border-t border-slate-800 flex-shrink-0 text-left">
                  <span className="text-[8px] text-slate-500 block uppercase font-bold">Verification Engine v1.2</span>
                  <span className="text-[8px] text-slate-600 block mt-0.5">
                    {userRole === 'lead' 
                      ? "Rules check: Duplicate defect logs, incomplete narratives, missing contacts" 
                      : userRole === 'accountant' 
                        ? "Rules check: Daily limits, negative hour logs, expense/receipt mismatch" 
                        : "Rules check: Daily limit, negative logs, duplicate defect logs, expense validation"}
                  </span>
                </div>
              </div>
            </div>
          )}

              {activeTab === 'daily-planner' && (
            <div className="flex-1 flex gap-4 min-h-0">
              
              <div className="flex-1 flex flex-col min-h-0 border-r border-slate-800/60 pr-4">
                <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/60 mb-3 flex-shrink-0">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Today's Audit Tasks</h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Assign and check off floor tasks for <span className="text-[#22D3EE] font-bold">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Filter:</span>
                      <select 
                        value={selectedTaskRepId}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowQuickAddRep(true);
                          } else {
                            setSelectedTaskRepId(e.target.value);
                          }
                        }}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#0EA5E9]"
                      >
                        <option value="all">All Representatives</option>
                        {users.filter(u => u.role === 'rep' || u.role === 'qre' || u.id === '1' || u.id === 'rep_hugo' || u.id === 'rep_nabil' || u.id === 'rep_rogelio').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                        <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Rep...</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Task completion rate badge */}
                  {(() => {
                    const dayTasks = dailyTasks.filter(t => t.date === selectedDate && (selectedTaskRepId === 'all' || t.rep_id === selectedTaskRepId));
                    const completed = dayTasks.filter(t => t.status === 'completed').length;
                    const total = dayTasks.length;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-medium">Progress:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                          pct === 100 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : total > 0 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                          {completed}/{total} Completed ({pct}%)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-2.5 pr-1">
                  {dailyTasks.filter(t => t.date === selectedDate && (selectedTaskRepId === 'all' || t.rep_id === selectedTaskRepId)).length > 0 ? (
                    dailyTasks.filter(t => t.date === selectedDate && (selectedTaskRepId === 'all' || t.rep_id === selectedTaskRepId)).map(t => (
                      <div 
                        key={t.id}
                        onClick={() => handleToggleTaskStatus(t)}
                        className="bg-slate-900/50 hover:bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.005]"
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={t.status === 'completed'}
                            onChange={() => {}} // handled by onClick on parent card for glove/easy tap
                            className="rounded border-slate-800 text-[#0EA5E9] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex flex-col gap-0.5 text-left">
                            <span className={`text-xs ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200 font-semibold'}`}>
                              {t.task}
                            </span>
                            <span className="text-[9px] text-[#22D3EE]/80 font-bold uppercase tracking-wider">
                              Assigned to: {users.find(u => u.id === t.rep_id)?.name || 'Clarence Kuiken'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'completed' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {t.status === 'completed' ? '🟢 Done' : '⏳ Pending'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-550">
                      <CheckCircle2 className="w-8 h-8 text-slate-700 mb-2" />
                      <p className="text-xs font-semibold">
                        {!showAllDates && !hasDataForSelectedDate() ? "No records found for this date." : "No tasks scheduled for this day."}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Use the quick presets below to dispatch items to representatives!</p>
                    </div>
                  )}
                </div>

                {/* Add Task Form (with Presets for non-tech-savvy users) */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex-shrink-0">
                  <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-2">Create & Dispatch Task</span>
                  
                  {/* Rep Assignment Selector for dispatch */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign To Rep:</span>
                    <select 
                      value={selectedDispatchRepId}
                      onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          setShowQuickAddRep(true);
                        } else {
                          setSelectedDispatchRepId(e.target.value);
                        }
                      }}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0EA5E9]"
                    >
                      {users.filter(u => u.role === 'rep' || u.role === 'qre' || u.id === '1' || u.id === 'rep_hugo' || u.id === 'rep_nabil' || u.id === 'rep_rogelio').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                      <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Rep...</option>
                    </select>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {[
                      { label: '🔍 Audit PN 86286761', task: 'Audit sequence line for PN 86286761 (tail light rattles)' },
                      { label: '🔍 Audit PN 86291945', task: 'Conduct bin sort inspection for PN 86291945' },
                      { label: '📋 Sequence Line Walk', task: 'Walk sequence area assembly and interview line operators' },
                      { label: '🛠️ Rework Verification', task: 'Audit rework table logs and verify part specifications' },
                      { label: '🏷️ Scrap Table Check', task: 'Check scrap tables and verify defect labeling tags' },
                      { label: '📞 Call Magna QM', task: 'Call Martin (Magna QM) to review open PRR items' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddTask(preset.task, selectedDispatchRepId)}
                        className="text-[9px] bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-750 text-slate-400 hover:text-white px-2 py-1 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Add Textbox */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddTask(newTaskText, selectedDispatchRepId);
                    }}
                    className="flex gap-2"
                  >
                    <input 
                      type="text" 
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="Type custom task to dispatch..."
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-[#0EA5E9]"
                    />
                    <button 
                      type="submit"
                      className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                    >
                      + Dispatch Task
                    </button>
                  </form>
                </div>

              </div>

              {/* Right Column: Sync Center */}
              <div className="w-64 flex flex-col gap-3.5 flex-shrink-0">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block">Floor Sync Center</span>
                
                {/* Active check-in status card */}
                {(() => {
                  const dayEntries = timeEntries.filter(t => t.date === selectedDate && (selectedTaskRepId === 'all' || t.rep_id === selectedTaskRepId));
                  const report = shiftReports.find(r => r.date === selectedDate && (selectedTaskRepId === 'all' || r.rep_id === selectedTaskRepId));
                  const reworkToday = reworkLogs.filter(r => r.created_at.startsWith(selectedDate) && (selectedTaskRepId === 'all' || r.rep_id === selectedTaskRepId));
                  const qtyReworked = reworkToday.reduce((acc, curr) => acc + curr.qty, 0);
                  
                  return (
                    <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-3">
                      <div>
                        <span className="text-[9px] text-[#22D3EE] font-bold uppercase tracking-wider block mb-1.5">Rep Check-In Status</span>
                        {dayEntries.length > 0 ? (
                          <div className="flex flex-col gap-2.5 max-h-[150px] overflow-y-auto pr-1">
                            {dayEntries.map(entry => {
                              const repUser = users.find(u => u.id === entry.rep_id);
                              return (
                                <div key={entry.id} className="flex items-start gap-2.5 border-b border-slate-850/50 pb-2 last:border-b-0 last:pb-0">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 animate-pulse"></div>
                                  <div className="text-left">
                                    <p className="text-xs font-bold text-white">{repUser?.name || 'Representative'}</p>
                                    <p className="text-[9px] text-slate-400">Shift: <span className="text-white font-semibold">{entry.hours} hrs</span> | Mileage: <span className="text-white font-semibold">{entry.mileage_km} km</span></p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic text-left">No rep clocked in on this date.</p>
                        )}
                      </div>

                      <div className="border-t border-slate-850 pt-2.5">
                        <span className="text-[9px] text-[#22D3EE] font-bold uppercase tracking-wider block text-left">Rework & Defect Metrics</span>
                        <div className="mt-1.5 grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                            <span className="text-[18px] font-extrabold text-white block leading-none">{qtyReworked}</span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wide block mt-1">Pcs Reworked</span>
                          </div>
                          <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                            <span className="text-[18px] font-extrabold text-red-400 block leading-none">
                              {incidents.filter(inc => inc.created_at.startsWith(selectedDate) && (selectedTaskRepId === 'all' || inc.rep_id === selectedTaskRepId)).length}
                            </span>
                            <span className="text-[8px] text-slate-500 uppercase tracking-wide block mt-1">Incidents</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-850 pt-2.5">
                        <span className="text-[9px] text-[#22D3EE] font-bold uppercase tracking-wider block text-left">Shift Walkthrough checklist</span>
                        {report ? (
                          <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-left">
                            <p className="font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Checklist Submitted</span>
                            </p>
                            <p className="text-[9px] text-slate-400 leading-relaxed mt-0.5">
                              {report.areas_walked.filter(a => a.status === 'issues').length} areas reported issues.
                            </p>
                            <button 
                              type="button"
                              onClick={() => setSelectedShiftReport(report)}
                              className="text-[#0EA5E9] hover:underline text-left font-bold mt-1 cursor-pointer"
                            >
                              Review walkthrough logs &rarr;
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic mt-1.5">Shift walkthrough not compiled.</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>
          )}

          {/* TAB 0.8: VISUAL HEAT MAPS */}
          {activeTab === 'heatmap' && (() => {
            const availDates = incidents.length > 0 
              ? Array.from(new Set(incidents.map(i => i.created_at.substring(0, 10)))).sort()
              : ['2026-05-28', '2026-06-01', '2026-06-02', '2026-06-03'];
            const targetScrubDate = availDates[Math.min(scrubIndex, availDates.length - 1)] || availDates[availDates.length - 1];

            const currentFilteredList = incidents.filter(inc => {
              const incPartNo = inc.parts_list?.[0]?.part_number || inc.part_id;
              const matchesPart = incPartNo === selectedHeatmapPart;
              const matchesDate = inc.created_at.substring(0, 10) <= targetScrubDate;
              const matchesSupplier = selectedSupplierFilter === 'all' || inc.supplier_id === selectedSupplierFilter;
              const matchesStatus = selectedStatusFilter === 'all' || inc.status === selectedStatusFilter;
              return matchesPart && matchesDate && matchesSupplier && matchesStatus;
            });

            // Density calculation helper
            const getIncidentWeight = (inc, list) => {
              if (inc.defect_location_x === undefined || inc.defect_location_y === undefined) return 1;
              let count = 0;
              list.forEach(other => {
                if (other.defect_location_x === undefined || other.defect_location_y === undefined) return;
                const dx = inc.defect_location_x - other.defect_location_x;
                const dy = inc.defect_location_y - other.defect_location_y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 0.08) count++;
              });
              return count;
            };

            // Zone breakdown stats
            const isHeadlight = selectedHeatmapPart === '86291945' || selectedHeatmapPart === '86201945';
            
            const zoneA = currentFilteredList.filter(i => i.defect_location_x !== undefined && (isHeadlight ? i.defect_location_x < 0.45 : i.defect_location_x < 0.40)).length;
            const zoneB = currentFilteredList.filter(i => i.defect_location_x !== undefined && (isHeadlight ? (i.defect_location_x >= 0.45 && i.defect_location_x <= 0.70) : (i.defect_location_x >= 0.40 && i.defect_location_x <= 0.60))).length;
            const zoneC = currentFilteredList.filter(i => i.defect_location_x !== undefined && (isHeadlight ? i.defect_location_x > 0.70 : i.defect_location_x > 0.60)).length;

            const totalWithCoords = zoneA + zoneB + zoneC || 1;

            return (
              <div className="flex-1 flex gap-5 min-h-0">
                {/* Left Panel: Filters, scrubber, statistics */}
                <div className="w-80 flex flex-col gap-4 flex-shrink-0 border-r border-slate-850 pr-5 min-h-0 overflow-y-auto">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Defect Matrix Location Map</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Visualize physical defect distributions and hotspot clusters on floor parts.</p>
                  </div>

                  {/* Part Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Audit Part Target</label>
                    <select 
                      value={selectedHeatmapPart}
                      onChange={(e) => {
                        setSelectedHeatmapPart(e.target.value);
                        setHoveredDot(null);
                      }}
                      className="h-9 bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-xl px-3.5 text-xs text-white focus:outline-none"
                    >
                      <option value="86286761">Tail Light Assembly (PN 86286761)</option>
                      <option value="86291945">Headlight Housing (PN 86291945)</option>
                      <option value="86201945">Headlight Housing - Alt (PN 86201945)</option>
                    </select>
                  </div>

                  {/* Timeline Scrubber */}
                  <div className="flex flex-col gap-2 bg-slate-950/40 p-3 rounded-2xl border border-slate-850">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Timeline Scrubber</span>
                      <span className="text-[#22D3EE] font-extrabold font-mono text-[10px] bg-[#1E3A5F]/40 border border-[#22D3EE]/20 px-2 py-0.5 rounded">
                        {targetScrubDate}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max={availDates.length - 1} 
                      value={Math.min(scrubIndex, availDates.length - 1)} 
                      onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        setScrubIndex(idx);
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                    />
                    <div className="flex justify-between text-[8px] text-slate-600 font-extrabold uppercase mt-1">
                      <span>{availDates[0]}</span>
                      <span>{availDates[availDates.length - 1]}</span>
                    </div>
                  </div>

                  {/* Metric overview cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850/80">
                      <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">Zone Total Defects</span>
                      <span className="text-xl font-extrabold text-white mt-1 block">{currentFilteredList.length}</span>
                    </div>
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-850/80">
                      <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider block">Critical Hotspots</span>
                      <span className="text-xl font-extrabold text-rose-500 mt-1 block">
                        {currentFilteredList.filter(i => getIncidentWeight(i, currentFilteredList) >= 3).length}
                      </span>
                    </div>
                  </div>

                  {/* Zone stats breakdown */}
                  <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-850 flex flex-col gap-2.5">
                    <span className="text-[9px] text-[#22D3EE] font-extrabold uppercase tracking-wider pl-0.5">Floor Hotspots Zone Audit</span>
                    
                    <div className="flex flex-col gap-2 text-[10px]">
                      {/* Zone 1 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between font-bold text-slate-400">
                          <span>{isHeadlight ? "Low Beam Housing" : "Left Lens Housing"}</span>
                          <span className="text-white">{zoneA} ({Math.round((zoneA/totalWithCoords)*100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-[#0EA5E9] h-full rounded-full" style={{ width: `${(zoneA/totalWithCoords)*100}%` }}></div>
                        </div>
                      </div>

                      {/* Zone 2 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between font-bold text-slate-400">
                          <span>{isHeadlight ? "Central Reflector Casing" : "Gasket / Seal Core"}</span>
                          <span className="text-white">{zoneB} ({Math.round((zoneB/totalWithCoords)*100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(zoneB/totalWithCoords)*100}%` }}></div>
                        </div>
                      </div>

                      {/* Zone 3 */}
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between font-bold text-slate-400">
                          <span>{isHeadlight ? "Adjustment / Harness" : "Right Lens Housing"}</span>
                          <span className="text-white">{zoneC} ({Math.round((zoneC/totalWithCoords)*100)}%)</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(zoneC/totalWithCoords)*100}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend color grading */}
                  <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 text-[9px] text-slate-400 flex flex-col gap-1.5">
                    <span className="font-bold text-slate-500 uppercase tracking-wider">Hotspot Density Scale</span>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#EF4444] block shadow shadow-red-500/20"></span><span>High-Density Hotspot (&ge; 3 defects)</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#F97316] block shadow shadow-orange-500/20"></span><span>Medium-Density (2 defects)</span></div>
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#0EA5E9] block shadow shadow-blue-500/20"></span><span>Low-Density (1 defect)</span></div>
                  </div>
                </div>

                {/* Right Panel: Large SVG Visual Map canvas */}
                <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-850 p-6 flex flex-col items-center justify-center relative min-w-0">
                  <div className="absolute top-4 left-4 bg-slate-900/60 border border-slate-850 px-3 py-1 rounded-xl text-[10px] text-slate-400">
                    Active Layer: <span className="text-white font-bold">{isHeadlight ? "Headlight Housing Spec" : "Tail Light Spec"}</span>
                  </div>

                  <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center border border-slate-800 bg-[#070b13]/60 rounded-3xl p-5 shadow-2xl">
                    <svg viewBox="0 0 100 100" className="w-full h-full object-contain">
                      {isHeadlight ? (
                        <g>
                          <path d="M10,50 C10,25 40,20 90,40 C90,40 70,75 30,70 C15,68 10,60 10,50 Z" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                          <circle cx="45" cy="48" r="14" fill="#0EA5E9" opacity="0.1" stroke="#38BDF8" strokeWidth="0.5" />
                          <circle cx="75" cy="42" r="8" fill="#0EA5E9" opacity="0.1" stroke="#38BDF8" strokeWidth="0.5" />
                          <path d="M12,48 C20,35 45,35 45,48" stroke="#64748B" strokeWidth="1" fill="none" />
                        </g>
                      ) : (
                        <g>
                          <rect x="5" y="25" width="90" height="50" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
                          <rect x="10" y="30" width="35" height="40" rx="4" fill="#991B1B" opacity="0.1" stroke="#DC2626" strokeWidth="0.5" />
                          <rect x="55" y="30" width="35" height="40" rx="4" fill="#991B1B" opacity="0.1" stroke="#DC2626" strokeWidth="0.5" />
                          <line x1="50" y1="25" x2="50" y2="75" stroke="#475569" strokeDasharray="2 2" strokeWidth="0.5" />
                        </g>
                      )}

                      {/* Map defect hotspot dots */}
                      {currentFilteredList.map((inc) => {
                        if (inc.defect_location_x === undefined || inc.defect_location_y === undefined) return null;
                        const w = getIncidentWeight(inc, currentFilteredList);
                        const color = w >= 3 ? '#EF4444' : w === 2 ? '#F97316' : '#0EA5E9';
                        
                        return (
                          <g key={inc.id}>
                            <circle 
                              cx={inc.defect_location_x * 100} 
                              cy={inc.defect_location_y * 100} 
                              r={4 + w * 1.5} 
                              fill={color} 
                              opacity="0.25"
                              className="animate-pulse"
                            />
                            <circle 
                              cx={inc.defect_location_x * 100} 
                              cy={inc.defect_location_y * 100} 
                              r="3" 
                              fill={color} 
                              stroke="#FFFFFF" 
                              strokeWidth="0.6"
                              className="cursor-pointer hover:r-4 transition-all"
                              onMouseEnter={() => setHoveredDot(inc)}
                              onMouseLeave={() => setHoveredDot(null)}
                              onClick={() => setSelectedIncident(inc)}
                            />
                          </g>
                        );
                      })}
                    </svg>

                    {/* Floating tooltips inside SVG wrapper */}
                    {hoveredDot && (
                      <div 
                        className="absolute bg-slate-950/95 border border-[#22D3EE]/30 p-2.5 rounded-xl text-[10px] text-left max-w-[200px] shadow-2xl z-20 pointer-events-none animate-in fade-in duration-150" 
                        style={{ 
                          left: `${hoveredDot.defect_location_x * 100}%`, 
                          top: `${hoveredDot.defect_location_y * 100}%`, 
                          transform: 'translate(-50%, -108%)' 
                        }}
                      >
                        <p className="font-mono text-[#22D3EE] font-bold">{hoveredDot.id}</p>
                        <p className="text-white font-semibold mt-0.5">{hoveredDot.area}</p>
                        <p className="text-slate-400 mt-1 line-clamp-2">"{hoveredDot.description}"</p>
                        <div className="border-t border-slate-800/80 mt-1.5 pt-1.5 flex flex-col gap-0.5 text-[8px] text-slate-500">
                          <p>Plant: <span className="text-slate-350 font-medium">{
                            hoveredDot.plant_id === 'gm_oshawa' ? 'GM Oshawa' :
                            hoveredDot.plant_id === 'magna_autosystems' ? 'Magna Belleville' :
                            hoveredDot.plant_id === 'hutchinson' ? 'Hutchinson' :
                            hoveredDot.plant_id || 'GM Oshawa'
                          }</span></p>
                          <p>Rep: <span className="text-slate-350 font-medium">{users.find(u => u.id === hoveredDot.rep_id)?.name || 'Clarence Kuiken'}</span></p>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-slate-500 mt-4 text-center">💡 Hover over coordinates for summary preview, click dot to open incident detail drawer profile.</p>
                </div>
              </div>
            );
          })()}
          
          {/* TAB 1: INCIDENTS FEED (Split layout: Table + Activities) */}
          {activeTab === 'incidents' && (
            <div className="flex-1 flex gap-4 min-h-0">
              {/* Left Column: Incidents Table */}
              <div className="flex-1 flex flex-col min-h-0 border-r border-slate-800/60 pr-4">
                <div className="flex gap-2 mb-3 flex-shrink-0">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search parts, defects..."
                      className="w-full h-8 bg-slate-950/60 border border-slate-850 focus:border-[#0EA5E9] focus:bg-slate-900/40 rounded-xl pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/20 transition-all placeholder-slate-500"
                    />
                  </div>
                  
                  <select 
                    value={selectedSupplierFilter}
                    onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                    className="h-8 bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-xl px-3.5 text-xs text-slate-350 focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/20 transition-all"
                  >
                    <option value="all">All Suppliers</option>
                    <option value="magna">Magna AutoSystems</option>
                    <option value="hutchinson">Hutchinson</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-thin">
                  {filteredIncidents.length > 0 && (
                    <span className="text-[9px] text-[#22D3EE] font-bold mb-2 flex items-center gap-1">
                      <span>💡 Tip:</span>
                      <span className="text-slate-400">Scroll down inside this list to view more reports.</span>
                    </span>
                  )}
                  {filteredIncidents.length > 0 ? (
                     <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                          <th className="py-2 px-2">Date Found</th>
                          <th className="py-2 px-2">Part No.</th>
                          <th className="py-2 px-2">Field Rep</th>
                          <th className="py-2 px-2">Supplier</th>
                          <th className="py-2 px-2">Status Indicator</th>
                          <th className="py-2 px-2">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredIncidents.map(inc => (
                          <tr key={inc.id} className="hover:bg-slate-900/40 text-slate-300 transition-colors">
                            <td className="py-2 px-2 font-medium">{new Date(inc.created_at).toLocaleDateString()}</td>
                             <td className="py-2 px-2 font-semibold text-white">
                               {inc.parts_list && inc.parts_list.length > 0 ? (
                                 <span>
                                   {inc.parts_list[0].part_number}
                                   {inc.parts_list.length > 1 && (
                                     <span className="text-slate-400 font-normal text-[10px] ml-1">
                                       (+{inc.parts_list.length - 1} others)
                                     </span>
                                   )}
                                 </span>
                               ) : (
                                 inc.part_id
                               )}
                             </td>
                            <td className="py-2 px-2 font-medium text-slate-300">
                              {users.find(u => u.id === inc.rep_id)?.name || 'Clarence Kuiken'}
                            </td>
                            <td className="py-2 px-2 text-[#22D3EE] font-medium">Magna</td>
                            <td className="py-2 px-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                inc.status === 'Open' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                inc.status === 'Acknowledged' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {inc.status === 'Open' ? '🔴 Red Alert (Awaiting Review)' : 
                                 inc.status === 'Acknowledged' ? '🟡 In Progress' : '🟢 Closed'}
                              </span>
                            </td>
                            <td className="py-2 px-2">
                              <button 
                                onClick={() => setSelectedIncident(inc)}
                                className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/85 text-[#22D3EE] border border-[#22D3EE]/25 py-1 px-2.5 rounded-lg font-bold flex items-center gap-0.5 cursor-pointer text-[10px]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
                      <AlertCircle className="w-7 h-7 text-slate-600 mb-2" />
                      <p className="text-xs">{!showAllDates && !hasDataForSelectedDate() ? "No records found for this date." : "No active incident reports logged."}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Factory Floor Activity Log (Dynamic) */}
              <div className="w-60 flex flex-col gap-3 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Live Floor Activity</span>
                  <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">Real-Time</span>
                </div>
                
                <div className="flex-1 bg-slate-950/40 rounded-xl p-3 border border-slate-850 flex flex-col gap-3.5 overflow-y-auto">
                  {getDynamicActivities().length > 0 ? (
                    getDynamicActivities().map((act, idx) => (
                      <div key={idx} className={`border-l-2 ${act.color} pl-2 py-0.5`}>
                        <p className="text-[10px] text-slate-405 font-mono flex items-center justify-between">
                          <span>{act.time}</span>
                          <span className="text-[8px] text-slate-550 font-medium">{act.date}</span>
                        </p>
                        <p className="text-xs text-white font-bold mt-0.5">{act.title}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{act.desc}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[10px] text-slate-550 py-10 italic">
                      {!showAllDates && !hasDataForSelectedDate() ? "No records found for this date." : "No floor activity recorded on this day."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 1.25: CUSTOMER QUALITY PARTNER PORTAL */}
          {activeTab === 'customer-portal' && (
            <div className="flex-1 flex flex-col gap-5 min-h-0 text-left">
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Customer Portal Dashboard</h3>
                  <span className="text-[10px] text-slate-500">Quality, audit hours tracking, and representative assignments for {(suppliers.find(s => s.id === currentUserCustomerId)?.name || currentUserCustomerId.toUpperCase())}</span>
                </div>
              </div>

              {/* Scrollable Contents */}
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-6">
                
                {/* 1. Location & Rep Assignments Grid */}
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#22D3EE]" /> My Locations & Active QRE Assignments
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {(suppliers.find(s => s.id === currentUserCustomerId)?.plants_served || []).map(pId => {
                      const plant = plants.find(pl => pl.id === pId);
                      if (!plant) return null;
                      
                      // Find assigned rep from rates matrix
                      const plantRate = rates.find(r => r.plant_id === pId && r.supplier_id === currentUserCustomerId);
                      const rep = users.find(u => u.id === (plantRate?.rep_id || '1'));
                      
                      // Calculate unbilled hours logged in cycle
                      const unbilledHours = timeEntries
                        .filter(t => t.plant_id === pId && t.supplier_id === currentUserCustomerId && !t.invoiced)
                        .reduce((acc, curr) => acc + curr.hours, 0);

                      return (
                        <div key={pId} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-xs font-bold text-white leading-tight">{plant.name}</h5>
                              <span className="text-[9px] text-slate-500 font-medium">{plant.address}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-sky-400/10 text-sky-400 text-[8px] font-extrabold uppercase">{plant.oem_brand}</span>
                          </div>
                          
                          {/* Rep Assignment Details */}
                          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center text-xs text-[#22D3EE] font-bold">{rep?.avatar || 'QRE'}</span>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned QRE</span>
                              <span className="text-xs text-white font-bold">{rep?.name || 'Assigned Rep'}</span>
                            </div>
                          </div>

                          {/* Hours Progress bar */}
                          <div className="flex flex-col gap-1.5 mt-2">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                              <span>Hours Tracked (Current Cycle):</span>
                              <span className="text-white font-bold">{unbilledHours} hrs</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-850">
                              <div 
                                className="bg-[#0EA5E9] h-full rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, (unbilledHours / 40) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-slate-500 font-semibold uppercase">Standard allocation: 40 hrs/wk max</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Extra Hours Approvals Workflow Queue */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-sky-400" /> Overtime & Extra Hours Approvals Queue
                    </h4>
                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                      {extraHoursRequests.filter(r => r.supplier_id === currentUserCustomerId && r.status === 'pending_customer').length === 0 ? (
                        <div className="text-center py-8 text-slate-550 italic">No pending extra hours requests.</div>
                      ) : (
                        extraHoursRequests.filter(r => r.supplier_id === currentUserCustomerId && r.status === 'pending_customer').map(req => (
                          <div key={req.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-extrabold text-white uppercase">{req.userName}</span>
                              <span className="text-sky-400 font-extrabold">{req.hours} hrs requested</span>
                            </div>
                            <div className="text-[10px] text-slate-400"><strong className="text-slate-500 uppercase tracking-wider">Location:</strong> {plants.find(p => p.id === req.plant_id)?.name || req.plant_id}</div>
                            <div className="text-[10px] text-slate-400"><strong className="text-slate-500 uppercase tracking-wider">Reason:</strong> "{req.reason}"</div>
                            
                            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-850">
                              <input 
                                type="text" 
                                placeholder="Add optional approval/rejection comment..." 
                                value={customerApprovalComment}
                                onChange={(e) => setCustomerApprovalComment(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none"
                              />
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => handleCustomerApproval(req.id, 'approve')}
                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[9px] uppercase rounded"
                                >
                                  Approve Request
                                </button>
                                <button 
                                  onClick={() => handleCustomerApproval(req.id, 'reject')}
                                  className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] uppercase rounded"
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 3. Published Shift Summaries Log */}
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0EA5E9]" /> Published Quality Shift Reports
                    </h4>
                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                      {(() => {
                        const customerPlants = suppliers.find(s => s.id === currentUserCustomerId)?.plants_served || [];
                        const customerReports = shiftReports.filter(r => r.status === 'published' && customerPlants.includes(r.plant_id));
                        
                        if (customerReports.length === 0) {
                          return <div className="text-center py-8 text-slate-550 italic">No published shift logs available.</div>;
                        }
                        
                        return customerReports.map(report => {
                          const rep = users.find(u => u.id === report.rep_id);
                          const plant = plants.find(p => p.id === report.plant_id);
                          return (
                            <div key={report.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 flex flex-col gap-2">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-white">{plant?.name || 'Oshawa'}</span>
                                <span className="text-slate-400 font-mono">{report.date}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                <span className="text-slate-500 font-bold uppercase mr-1">Rep:</span> {rep?.name || 'Resident Engineer'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                <span className="text-slate-500 font-bold uppercase mr-1">Walkthrough:</span> {report.areas_walked.length} areas checked, {report.incidents_count} concerns logged.
                              </div>
                              <button 
                                onClick={() => setSelectedShiftReport(report)}
                                className="mt-1 w-max text-[#22D3EE] hover:text-[#0EA5E9] text-[9px] font-bold uppercase tracking-wider transition-colors"
                              >
                                View Report Details →
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: CUSTOMER APPROVALS (OVERTIME) */}
          {activeTab === 'approvals' && userRole === 'customer' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Time & Expense Approvals
                </h3>
                <span className="text-[10px] text-slate-500 font-medium">Review QRE Overtime & Expenses</span>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-4">
                {(() => {
                  const customerPlants = suppliers.find(s => s.id === currentUserCustomerId)?.plants_served || [];
                  // Find expenses for reps assigned to this customer's plants
                  const pendingApprovals = expenseEntries.filter(e => e.status === 'pending_customer');
                  
                  if (pendingApprovals.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center p-10 bg-slate-900/20 border border-slate-800/50 rounded-2xl">
                        <CheckCircle2 className="w-10 h-10 text-emerald-500/50 mb-3" />
                        <h4 className="text-white font-bold">All caught up!</h4>
                        <p className="text-xs text-slate-400">No pending overtime or expense requests require your approval.</p>
                      </div>
                    );
                  }

                  return pendingApprovals.map(req => {
                    const rep = users.find(u => u.id === req.rep_id);
                    // Determine cost impact: amount is hours for overtime, rep rate is 28 (or from rates)
                    const costImpact = (req.amount * 28).toFixed(2);
                    
                    return (
                      <div key={req.id} className="stitch-panel p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-start border-b border-slate-800/50 pb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-bold uppercase rounded">
                                {req.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">{req.date}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <User className="w-4 h-4 text-sky-400" />
                              {rep?.name || 'Unknown Rep'}
                            </h4>
                          </div>
                          <div className="flex flex-col items-end text-right">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Requested Amount</span>
                            <span className="text-lg font-black text-white">{req.amount} {req.category.includes('Overtime') ? 'Hours' : 'USD'}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason for Request</span>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            {req.notes}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-800/50">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-950/30 border border-sky-900/50 rounded-lg">
                            <DollarSign className="w-4 h-4 text-sky-400" />
                            <div className="flex flex-col">
                              <span className="text-[8px] font-bold text-sky-500 uppercase">Estimated Cost Impact</span>
                              <span className="text-xs font-bold text-sky-300">${costImpact} USD</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                const confirmReject = window.confirm('Are you sure you want to reject this request?');
                                if (confirmReject) {
                                  const updated = { ...req, status: 'rejected' };
                                  saveEntity('expenseEntries', updated);
                                  logSystemEvent('payroll', 'expense_reject', `Customer rejected overtime request ${req.id} for ${rep?.name}.`);
                                  window.dispatchEvent(new Event('ids_pulse_db_update'));
                                }
                              }}
                              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <X className="w-4 h-4" /> Reject
                            </button>
                            <button 
                              onClick={() => {
                                const updated = { ...req, status: 'approved_customer' };
                                saveEntity('expenseEntries', updated);
                                logSystemEvent('payroll', 'expense_approve', `Customer approved overtime request ${req.id} for ${rep?.name}.`);
                                window.dispatchEvent(new Event('ids_pulse_db_update'));
                                alert('Request approved! It has been forwarded to the IDS Accountant.');
                              }}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB 1.5: DAILY SHIFT SUMMARIES LOG (Donna requested to view rep reports) */}
          {activeTab === 'shift-logs' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">End-Of-Shift Walkthrough logs</h3>
                <span className="text-[10px] text-slate-500 font-medium">Auto-aggregated shift logs from rep phones</span>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-3">
                {shiftReports.filter(sr => {
                  if (userRole === 'customer') {
                    const customerPlants = suppliers.find(s => s.id === currentUserCustomerId)?.plants_served || [];
                    return sr.status === 'published' && customerPlants.includes(sr.plant_id);
                  }
                  return true;
                }).map(sr => (
                  <div key={sr.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#1E3A5F]/60 flex items-center justify-center text-white border border-[#22D3EE]/20 flex-shrink-0">
                        <Calendar className="w-5 h-5 text-[#22D3EE]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white leading-none">Shift Walkthrough Report</h4>
                          <span className="text-[9px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                            {sr.date}
                          </span>
                          {sr.status === 'published' && (
                            <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Published
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                          Rep: <span className="text-white font-semibold">{users.find(u => u.id === sr.rep_id)?.name}</span> | 
                          Plant: <span className="text-white font-semibold">{plants.find(p => p.id === sr.plant_id)?.name || sr.plant_id}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {['admin', 'owner', 'accountant', 'lead', 'shahroz'].includes(userRole) && sr.status !== 'published' && (
                        <button 
                          onClick={() => handlePublishReport(sr.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />
                          <span>Publish to Customer</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => setSelectedShiftReport(sr)}
                        className="bg-[#1E3A5F] hover:bg-[#1E3A5F]/85 text-[#22D3EE] border border-[#22D3EE]/30 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 flex-shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SUPPLIERS DIRECTORY */}
          {activeTab === 'suppliers' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Supplier Partnerships</h3>
                  <span className="text-[10px] text-slate-500">Tier-1 supplier quality contacts</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrintSupplierDirectoryReport}
                    className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Directory</span>
                  </button>
                  <button 
                    onClick={handleDownloadSupplierDirectoryReport}
                    className="flex items-center gap-1.5 bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 grid grid-cols-2 gap-4">
                {suppliers.map(sup => (
                  <div key={sup.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 h-fit">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-extrabold text-white">{sup.name}</h4>
                        <span className="text-[10px] text-slate-500">Active Supplier Partner</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full">ACTIVE CONTRACT</span>
                    </div>
                    
                    <div className="border-t border-slate-800/80 pt-2 flex flex-col gap-1.5 text-xs text-slate-400">
                      <div><span className="font-bold text-slate-500">QM Contacts:</span></div>
                      {sup.contacts.map((c, i) => (
                        <div key={i} className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex justify-between items-center text-[10px]">
                          <div>
                            <p className="font-semibold text-slate-200">{c.name}</p>
                            <p className="text-slate-500 text-[9px]">{c.role}</p>
                          </div>
                          <a href={`mailto:${c.email}`} className="text-[#0EA5E9] hover:underline font-mono">{c.email}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIME & MILEAGE TRACKING (COLLEEN'S VIEW) */}
          {activeTab === 'time-tracking' && (
            userRole === 'qre' ? (
              <div className="flex-1 flex flex-col gap-4 min-h-0 text-left">
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Representative Portal</h3>
                    <span className="text-[10px] text-slate-500">Log hours, expenses, and request overtime approvals</span>
                  </div>
                  
                  {/* Sub-tabs */}
                  <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                    <button
                      onClick={() => setAccountingSubTab('log-hours')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'log-hours' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Log Hours & Expenses
                    </button>
                    <button
                      onClick={() => setAccountingSubTab('extra-hours')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'extra-hours' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Request Overtime / Extra Hours
                    </button>
                    <button
                      onClick={() => setAccountingSubTab('my-logs')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'my-logs' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      My Submissions History
                    </button>
                  </div>
                </div>

                {/* Scrollable area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-4">
                  {accountingSubTab === 'log-hours' && (
                    <div className="grid grid-cols-2 gap-6">
                      {/* QRE log hours form */}
                      <form onSubmit={(e) => {
                        handleLogHoursSubmit(e);
                      }} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-left">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#22D3EE]" /> Log My Hours & Mileage
                        </h4>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Representative</span>
                          <span className="text-xs text-white bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 font-semibold">
                            {users.find(u => u.id === currentUserRepId)?.name || 'Me'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client (Supplier)</label>
                          <select value={logHoursSupplierId} onChange={(e) => {
                            setLogHoursSupplierId(e.target.value);
                            setLogHoursRepId(currentUserRepId);
                          }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0EA5E9]">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input type="date" value={logHoursDate} onChange={(e) => setLogHoursDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hours Worked</label>
                            <input type="number" step="0.5" placeholder="8.0" value={logHoursQty} onChange={(e) => setLogHoursQty(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mileage (KM)</label>
                          <input type="number" placeholder="KM travelled" value={logHoursMileage} onChange={(e) => setLogHoursMileage(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notes / Activity summary</label>
                          <input type="text" placeholder="Detail the sort activity" value={logHoursNotes} onChange={(e) => setLogHoursNotes(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <button type="submit" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-colors mt-2">Log Hours</button>
                      </form>

                      {/* QRE log expense form */}
                      <form onSubmit={(e) => {
                        handleLogExpenseSubmit(e);
                      }} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-left h-fit">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" /> Log My Expense Claim
                        </h4>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Representative</span>
                          <span className="text-xs text-white bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 font-semibold">
                            {users.find(u => u.id === currentUserRepId)?.name || 'Me'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client (Supplier)</label>
                          <select value={logExpSupplierId} onChange={(e) => {
                            setLogExpSupplierId(e.target.value);
                            setLogExpRepId(currentUserRepId);
                          }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input type="date" value={logExpDate} onChange={(e) => setLogExpDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                            <select value={logExpCategory} onChange={(e) => setLogExpCategory(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                              <option value="Fuel">Fuel</option>
                              <option value="Meals">Meals</option>
                              <option value="Parking">Parking</option>
                              <option value="Tolls">Tolls</option>
                              <option value="Supplies">Supplies</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount ($)</label>
                          <input type="number" step="0.01" placeholder="0.00" value={logExpAmount} onChange={(e) => setLogExpAmount(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Claim Notes</label>
                          <input type="text" placeholder="Purpose of travel or purchase" value={logExpNotes} onChange={(e) => setLogExpNotes(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <button type="submit" className="bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-colors mt-2">Log Expense</button>
                      </form>
                    </div>
                  )}

                  {accountingSubTab === 'extra-hours' && (
                    <div className="grid grid-cols-2 gap-6">
                      <form onSubmit={handleExtraHoursSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-left">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-sky-400" /> {selectedEditingRequestId ? "Revise Overtime Request" : "File Request for Overtime / Extra Hours"}
                        </h4>
                        {selectedEditingRequestId && (
                          <div className="bg-cyan-500/10 border border-cyan-500/35 p-2.5 rounded-xl text-[10px] text-cyan-400 font-bold flex justify-between items-center">
                            <span>Editing Rejected Request: #{selectedEditingRequestId}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEditingRequestId(null);
                                setExtraHoursReason('');
                              }}
                              className="text-xs font-black text-cyan-400 hover:text-white cursor-pointer px-1"
                              title="Cancel Edit Mode"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client (Supplier)</label>
                          <select value={extraHoursSupplierId} onChange={(e) => setExtraHoursSupplierId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Location (Plant)</label>
                          <select value={extraHoursPlantId} onChange={(e) => setExtraHoursPlantId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                            {(suppliers.find(s => s.id === extraHoursSupplierId)?.plants_served || []).map(pId => (
                              <option key={pId} value={pId}>{plants.find(pl => pl.id === pId)?.name || pId}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date Range / Shift Date</label>
                            <input type="date" value={extraHoursDate} onChange={(e) => setExtraHoursDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Requested Hours</label>
                            <input type="number" step="0.5" value={extraHoursQty} onChange={(e) => setExtraHoursQty(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Justification Reason</label>
                          <textarea placeholder="Please detail the reason for extra hours sorting request..." value={extraHoursReason} onChange={(e) => setExtraHoursReason(e.target.value)} required rows="3" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none" />
                        </div>
                        <button type="submit" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-colors mt-2">File Overtime Request</button>
                      </form>

                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">My Overtime Requests Status</h4>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
                          {extraHoursRequests.filter(r => r.rep_id === currentUserRepId).length === 0 ? (
                            <div className="text-center py-6 text-slate-550 italic">No extra hours requests filed.</div>
                          ) : (
                            extraHoursRequests.filter(r => r.rep_id === currentUserRepId).map(req => (
                              <div key={req.id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex flex-col gap-2 text-left">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{suppliers.find(s => s.id === req.supplier_id)?.name || 'Client'}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                    req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                    req.status.startsWith('rejected') ? 'bg-rose-500/10 text-rose-400' :
                                    'bg-sky-500/10 text-sky-400'
                                  }`}>{req.status.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="text-xs font-semibold text-white">{req.hours} hours on {req.date}</div>
                                <div className="text-[10px] text-slate-400 italic">" {req.reason} "</div>
                                {req.customer_comment && <div className="text-[9px] text-slate-500"><strong className="text-slate-400">Customer Note:</strong> {req.customer_comment}</div>}
                                {req.admin_comment && <div className="text-[9px] text-slate-500"><strong className="text-slate-400">Admin Note:</strong> {req.admin_comment}</div>}
                                {req.status.startsWith('rejected') && (
                                  <button
                                    onClick={() => {
                                      setSelectedEditingRequestId(req.id);
                                      setExtraHoursSupplierId(req.supplier_id);
                                      setExtraHoursPlantId(req.plant_id);
                                      setExtraHoursDate(req.date);
                                      setExtraHoursQty(req.hours.toString());
                                      setExtraHoursReason(req.reason);
                                      alert("Form loaded with rejected request details. Modify and submit to resubmit.");
                                    }}
                                    className="mt-1 px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-[9px] uppercase rounded border border-cyan-500/20 transition-colors w-fit cursor-pointer"
                                  >
                                    Revise & Resubmit
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {accountingSubTab === 'my-logs' && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Logged Hours Summary (No Rates)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th className="py-2">Date</th><th className="py-2">Client</th><th className="py-2 text-right">Hours</th><th className="py-2 text-right">Mileage</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 text-slate-300">
                              {timeEntries.filter(t => t.rep_id === currentUserRepId).length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-6 text-slate-550 italic">No hours logged.</td></tr>
                              ) : (
                                timeEntries.filter(t => t.rep_id === currentUserRepId).map(entry => (
                                  <tr key={entry.id} className="hover:bg-slate-950/40">
                                    <td className="py-2 font-mono">{entry.date}</td>
                                    <td className="py-2 text-slate-400">{suppliers.find(s => s.id === entry.supplier_id)?.name || 'Client'}</td>
                                    <td className="py-2 text-right text-white font-bold">{entry.hours} hrs</td>
                                    <td className="py-2 text-right text-sky-400">{entry.mileage_km || 0} km</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Logged Expenses (Reimbursable Claims)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th className="py-2">Date</th><th className="py-2">Category</th><th className="py-2">Amount</th><th className="py-2 text-right">Status</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850 text-slate-300">
                              {expenseEntries.filter(e => e.rep_id === currentUserRepId).length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-6 text-slate-550 italic">No expense claims.</td></tr>
                              ) : (
                                expenseEntries.filter(e => e.rep_id === currentUserRepId).map(exp => (
                                  <tr key={exp.id} className="hover:bg-slate-950/40">
                                    <td className="py-2 font-mono">{exp.date}</td>
                                    <td className="py-2 text-slate-400">{exp.category}</td>
                                    <td className="py-2 text-white font-bold">${parseFloat(exp.amount).toFixed(2)}</td>
                                    <td className="py-2 text-right">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                        exp.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                                        exp.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                                        'bg-sky-500/10 text-sky-400'
                                      }`}>{exp.status || 'submitted'}</span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 min-h-0 text-left">
                {/* Portal Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Invoicing, Rates & Payroll Portal</h3>
                    <span className="text-[10px] text-slate-500">Colleen's accountant workspace</span>
                  </div>
                  
                  {/* Sub-tab navigation */}
                  <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                    <button
                      onClick={() => setAccountingSubTab('log-hours')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'log-hours' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Log Hours & Expenses
                    </button>
                    <button
                      onClick={() => setAccountingSubTab('invoice-gen')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'invoice-gen' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Invoicing Control
                    </button>
                    <button
                      onClick={() => setAccountingSubTab('payroll')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'payroll' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Rep Payroll
                    </button>
                    <button
                      onClick={() => setAccountingSubTab('rates-config')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'rates-config' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Clients & Rates
                    </button>
                    <button
                      onClick={() => setAccountingSubTab('bulk-entry')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        accountingSubTab === 'bulk-entry' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Bulk Hours Entry
                    </button>
                  </div>
                </div>

                {/* Scrollable Sub-tab Contents */}
                <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-4">
                  
                  {/* SUB-TAB 1: LOG HOURS & EXPENSES */}
                  {accountingSubTab === 'log-hours' && (
                    <div className="grid grid-cols-2 gap-6">
                      <form onSubmit={handleLogHoursSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-left">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#22D3EE]" /> Log Representative Hours & Mileage
                        </h4>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Representative</label>
                          <select value={logHoursRepId} onChange={(e) => setLogHoursRepId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0EA5E9]">
                            {users.filter(u => u.role === 'rep').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client (Supplier)</label>
                          <select value={logHoursSupplierId} onChange={(e) => setLogHoursSupplierId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0EA5E9]">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input type="date" value={logHoursDate} onChange={(e) => setLogHoursDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hours</label>
                            <input type="number" step="0.5" placeholder="e.g. 8.0" value={logHoursQty} onChange={(e) => setLogHoursQty(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mileage (KM)</label>
                          <input type="number" placeholder="KM travelled" value={logHoursMileage} onChange={(e) => setLogHoursMileage(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                          <input type="text" placeholder="Shift sorting notes" value={logHoursNotes} onChange={(e) => setLogHoursNotes(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <button type="submit" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-colors mt-2">Log Hours</button>
                      </form>

                      <form onSubmit={handleLogExpenseSubmit} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-left h-fit">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-400" /> Log Rep Expense Claim
                        </h4>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Representative</label>
                          <select value={logExpRepId} onChange={(e) => setLogExpRepId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                            {users.filter(u => u.role === 'rep').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client (Supplier)</label>
                          <select value={logExpSupplierId} onChange={(e) => setLogExpSupplierId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input type="date" value={logExpDate} onChange={(e) => setLogExpDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                            <select value={logExpCategory} onChange={(e) => setLogExpCategory(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                              <option value="Fuel">Fuel</option>
                              <option value="Meals">Meals</option>
                              <option value="Parking">Parking</option>
                              <option value="Tolls">Tolls</option>
                              <option value="Supplies">Supplies</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Amount ($)</label>
                          <input type="number" step="0.01" placeholder="0.00" value={logExpAmount} onChange={(e) => setLogExpAmount(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Notes</label>
                          <input type="text" placeholder="Purpose of expense" value={logExpNotes} onChange={(e) => setLogExpNotes(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                        </div>
                        <button type="submit" className="bg-[#10B981] hover:bg-[#10B981]/90 text-white font-bold py-2 rounded-xl text-xs cursor-pointer transition-colors mt-2">Log Expense</button>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB 2: INVOICING CONTROL CENTER */}
                  {accountingSubTab === 'invoice-gen' && (() => {
                    const client = suppliers.filter(Boolean).find(s => s.id === selectedInvoiceSupplier) || suppliers.filter(Boolean)[0] || { id: 'unknown', name: 'Unknown Client', invoice_schedule: 'weekly' };
                    
                    const clientEntries = timeEntries.filter(t => t && t.supplier_id === (client?.id || selectedInvoiceSupplier) && !t.invoiced && (selectedInvoiceCurrency === 'all' || getRepSupplierRates(t.rep_id, t.supplier_id, t.plant_id).currency === selectedInvoiceCurrency));
                    const clientExpenses = expenseEntries.filter(e => e && e.supplier_id === (client?.id || selectedInvoiceSupplier) && !e.invoiced && (selectedInvoiceCurrency === 'all' || getExpenseCurrency(e) === selectedInvoiceCurrency));

                    const cadEntries = clientEntries.filter(t => getRepSupplierRates(t.rep_id, t.supplier_id, t.plant_id).currency === 'CAD');
                    const cadExpenses = clientExpenses.filter(e => getExpenseCurrency(e) === 'CAD');
                    const cadHourly = cadEntries.reduce((acc, curr) => acc + ((curr.hours || 0) * getRepSupplierRates(curr.rep_id, curr.supplier_id, curr.plant_id).billing_rate), 0);
                    const cadMileage = cadEntries.reduce((acc, curr) => acc + ((curr.mileage_km || 0) * 0.73), 0);
                    const cadExpense = cadExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                    const cadTotal = cadHourly + cadMileage + cadExpense;

                    const usdEntries = clientEntries.filter(t => getRepSupplierRates(t.rep_id, t.supplier_id, t.plant_id).currency === 'USD');
                    const usdExpenses = clientExpenses.filter(e => getExpenseCurrency(e) === 'USD');
                    const usdHourly = usdEntries.reduce((acc, curr) => acc + ((curr.hours || 0) * getRepSupplierRates(curr.rep_id, curr.supplier_id, curr.plant_id).billing_rate), 0);
                    const usdMileage = usdEntries.reduce((acc, curr) => acc + ((curr.mileage_km || 0) * 0.73), 0);
                    const usdExpense = usdExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                    const usdTotal = usdHourly + usdMileage + usdExpense;

                    const clientHourlySub = selectedInvoiceCurrency === 'CAD' ? cadHourly : (selectedInvoiceCurrency === 'USD' ? usdHourly : cadHourly + usdHourly);
                    const clientMileageSub = selectedInvoiceCurrency === 'CAD' ? cadMileage : (selectedInvoiceCurrency === 'USD' ? usdMileage : cadMileage + usdMileage);
                    const clientExpenseSub = selectedInvoiceCurrency === 'CAD' ? cadExpense : (selectedInvoiceCurrency === 'USD' ? usdExpense : cadExpense + usdExpense);
                    const clientGrandTotal = selectedInvoiceCurrency === 'CAD' ? cadTotal : (selectedInvoiceCurrency === 'USD' ? usdTotal : cadTotal + usdTotal);

                    const hoursSubDisplay = selectedInvoiceCurrency === 'all' ? `C$ ${cadHourly.toFixed(2)} + US$ ${usdHourly.toFixed(2)}` : (selectedInvoiceCurrency === 'CAD' ? `C$ ${cadHourly.toFixed(2)}` : `US$ ${usdHourly.toFixed(2)}`);
                    const mileageSubDisplay = selectedInvoiceCurrency === 'all' ? `C$ ${cadMileage.toFixed(2)} + US$ ${usdMileage.toFixed(2)}` : (selectedInvoiceCurrency === 'CAD' ? `C$ ${cadMileage.toFixed(2)}` : `US$ ${usdMileage.toFixed(2)}`);
                    const expenseSubDisplay = selectedInvoiceCurrency === 'all' ? `C$ ${cadExpense.toFixed(2)} + US$ ${usdExpense.toFixed(2)}` : (selectedInvoiceCurrency === 'CAD' ? `C$ ${cadExpense.toFixed(2)}` : `US$ ${usdExpense.toFixed(2)}`);
                    const grandTotalDisplay = selectedInvoiceCurrency === 'all' ? `C$ ${cadTotal.toFixed(2)} & US$ ${usdTotal.toFixed(2)}` : (selectedInvoiceCurrency === 'CAD' ? `C$ ${cadTotal.toFixed(2)}` : `US$ ${usdTotal.toFixed(2)}`);
                    const invoiceCurrencySymbol = selectedInvoiceCurrency === 'all' ? '' : (selectedInvoiceCurrency === 'CAD' ? 'C$' : 'US$');

                    const dates = clientEntries.filter(e => e && e.date).map(e => e.date).sort();
                    const dateRangeStr = dates.length > 0 ? `From ${dates[0]} to ${dates[dates.length - 1]}` : 'No pending periods';

                    return (
                      <div className="flex flex-col gap-4 text-left">
                        {/* Approval Workflows alerts for Admin */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-sky-400" /> Overtime Approvals Queue</h5>
                            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                              {extraHoursRequests.filter(r => r && r.status === 'pending_admin').length === 0 ? (
                                <div className="text-[10px] text-slate-550 italic py-2">No pending overtime final approvals.</div>
                              ) : (
                                extraHoursRequests.filter(r => r && r.status === 'pending_admin').map(req => (
                                  <div key={req.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="font-bold text-white">{users.find(u => u && u.id === req.rep_id)?.name || 'Rep'} @ {plants.find(p => p && p.id === req.plant_id)?.name || req.plant_id}</span>
                                      <span className="text-sky-400 font-bold">{req.hours || 0} hrs</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">"{req.reason || ''}"</p>
                                    <div className="flex gap-2 mt-1">
                                      <input type="text" placeholder="Admin note..." value={adminApprovalComment} onChange={(e) => setAdminApprovalComment(e.target.value)} className="bg-slate-900 border border-slate-800 text-[10px] px-2 py-1 rounded flex-1 text-white" />
                                      <button onClick={() => handleAdminApproval(req.id, 'approve')} className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[9px] uppercase rounded">Approve</button>
                                      <button onClick={() => handleAdminApproval(req.id, 'reject')} className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] uppercase rounded">Reject</button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Expense Claims Queue</h5>
                            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                              {expenseEntries.filter(e => e && e.status === 'submitted').length === 0 ? (
                                <div className="text-[10px] text-slate-550 italic py-2">No pending expense claims.</div>
                              ) : (
                                expenseEntries.filter(e => e && e.status === 'submitted').map(exp => {
                                  const repName = users.find(u => u && u.id === exp.rep_id)?.name || 'Rep';
                                  return (
                                    <div key={exp.id} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex flex-col gap-1.5">
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-bold text-white">{repName} ({exp.category || 'Expense'})</span>
                                        <span className="text-emerald-400 font-bold">${parseFloat(exp.amount || 0).toFixed(2)}</span>
                                      </div>
                                      <p className="text-[10px] text-slate-400">"{exp.notes || ''}"</p>
                                      <div className="flex gap-2 mt-1">
                                        <button onClick={() => handleAdminExpenseApproval(exp.id, 'approve')} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[9px] uppercase rounded">Approve</button>
                                        <button onClick={() => handleAdminExpenseApproval(exp.id, 'reject')} className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white font-bold text-[9px] uppercase rounded">Reject</button>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Invoicing Controls */}
                        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4">
                          <div className="flex gap-4 col-span-2">
                            <div className="flex flex-col">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Select Client</label>
                              <select 
                                value={selectedInvoiceSupplier} 
                                onChange={(e) => {
                                  if (e.target.value === 'ADD_NEW') {
                                    setShowQuickAddClient(true);
                                  } else {
                                    setSelectedInvoiceSupplier(e.target.value);
                                  }
                                }}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                              >
                                {suppliers.filter(Boolean).map(s => <option key={s.id} value={s.id}>{s.name} ({(s.invoice_schedule || 'weekly').toUpperCase()})</option>)}
                                <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Client...</option>
                              </select>
                            </div>
                            <div className="flex flex-col">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Billing Currency</label>
                              <select value={selectedInvoiceCurrency} onChange={(e) => setSelectedInvoiceCurrency(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white">
                                <option value="all">All Currencies (Combined View)</option>
                                <option value="CAD">CAD Only (C$)</option>
                                <option value="USD">USD Only (US$)</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleGenerateClientInvoicePDF(client, dateRangeStr, clientEntries, clientExpenses)} disabled={clientEntries.length === 0 && clientExpenses.length === 0} className="flex items-center gap-1.5 bg-[#0EA5E9] disabled:opacity-40 hover:bg-[#0EA5E9]/90 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"><Printer className="w-4 h-4" /> PDF Invoice</button>
                            <button onClick={() => handleExportClientQuickBooks(clientEntries)} disabled={clientEntries.length === 0} className="flex items-center gap-1.5 bg-[#10B981] disabled:opacity-40 hover:bg-[#10B981]/90 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer"><FileSpreadsheet className="w-4 h-4" /> QuickBooks CSV</button>
                            <button onClick={() => handleMarkAsInvoiced(clientEntries, clientExpenses)} disabled={clientEntries.length === 0 && clientExpenses.length === 0} className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 disabled:opacity-40 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer"><CheckCircle2 className="w-4 h-4" /> Mark Invoiced</button>
                          </div>
                        </div>

                        {/* Consolidated Totals */}
                        <div className="grid grid-cols-4 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                          <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-bold uppercase">Hours Billing</span><span className="text-lg font-bold text-white mt-0.5">{clientEntries.reduce((acc, curr) => acc + (curr.hours || 0), 0)} hrs</span><span className="text-[10px] text-slate-400 mt-1">Sub: {hoursSubDisplay}</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-bold uppercase">Mileage</span><span className="text-lg font-bold text-white mt-0.5">{clientEntries.reduce((acc, curr) => acc + (curr.mileage_km || 0), 0)} km</span><span className="text-[10px] text-slate-400 mt-1">Sub: {mileageSubDisplay}</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-bold uppercase">Expenses</span><span className="text-lg font-bold text-emerald-450 mt-0.5">{expenseSubDisplay}</span><span className="text-[10px] text-slate-400 mt-1">Reimbursable claims</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-slate-500 font-bold uppercase">Invoice Total</span><span className="text-lg font-bold text-[#22D3EE] mt-0.5">{grandTotalDisplay}</span><span className="text-[9px] text-slate-400 mt-1">{dateRangeStr}</span></div>
                        </div>

                        {/* Items Table list */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-[#22D3EE]" /> Consolidated Items List</h4>
                          {clientEntries.length === 0 && clientExpenses.length === 0 ? <div className="text-center py-6 text-slate-550">All hours and expenses are invoiced for this client.</div> : (
                            <div className="flex flex-col gap-4">
                              {clientEntries.length > 0 && (
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th className="py-2">Rep</th><th className="py-2">Date</th><th className="py-2 text-right">Hours</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Hours Billing</th><th className="py-2 text-right">Mileage</th><th className="py-2 text-right">Mileage Billing</th></tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-850 text-slate-300">
                                    {clientEntries.map(entry => {
                                      const { billing_rate, currency } = getRepSupplierRates(entry.rep_id, entry.supplier_id, entry.plant_id);
                                      const rowSymbol = currency === 'CAD' ? 'C$' : 'US$';
                                      return (
                                        <tr key={entry.id} className="hover:bg-slate-950/40">
                                          <td className="py-2 text-white font-semibold">{users.find(u => u && u.id === entry.rep_id)?.name || 'Rep'}</td>
                                          <td className="py-2 font-mono">{entry.date || ''}</td>
                                          <td className="py-2 text-right">{entry.hours || 0} hrs</td>
                                          <td className="py-2 text-right text-slate-400">{rowSymbol} {(billing_rate || 28.00).toFixed(2)}/hr</td>
                                          <td className="py-2 text-right text-white font-bold">{rowSymbol} {((entry.hours || 0) * (billing_rate || 28.00)).toFixed(2)}</td>
                                          <td className="py-2 text-right text-sky-400">{entry.mileage_km || 0} km</td>
                                          <td className="py-2 text-right text-emerald-450">{rowSymbol} {((entry.mileage_km || 0) * 0.73).toFixed(2)}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}

                              {clientExpenses.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-850">
                                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pending Reimbursements</h5>
                                  <table className="w-full text-xs text-left">
                                    <thead>
                                      <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th className="py-2">Rep</th><th className="py-2">Date</th><th className="py-2">Category</th><th className="py-2">Notes</th><th className="py-2 text-right">Amount</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-850 text-slate-300">
                                      {clientExpenses.map(exp => {
                                        const expCurr = getExpenseCurrency(exp);
                                        const expSymbol = expCurr === 'CAD' ? 'C$' : 'US$';
                                        return (
                                          <tr key={exp.id} className="hover:bg-slate-950/40">
                                            <td className="py-2 text-white font-semibold">{users.find(u => u && u.id === exp.rep_id)?.name || 'Rep'}</td>
                                            <td className="py-2 font-mono">{exp.date || ''}</td>
                                            <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase">{exp.category}</span></td>
                                            <td className="py-2 text-slate-400">{exp.notes || ''}</td>
                                            <td className="py-2 text-right text-emerald-400 font-bold">{expSymbol} {parseFloat(exp.amount || 0).toFixed(2)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* SUB-TAB 3: PAYROLL */}
                  {accountingSubTab === 'payroll' && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-left">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-850">Rep Bi-Weekly Payroll Preview</h4>
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th className="py-2">Rep</th><th className="py-2">Client</th><th className="py-2 text-right">Hours</th><th className="py-2 text-right">Rate</th><th className="py-2 text-right">Hours Pay</th><th className="py-2 text-right">Mileage</th><th className="py-2 text-right">Mileage Pay</th><th className="py-2 text-right">Expenses</th><th className="py-2 text-right">Net Payout</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 text-slate-300">
                          {users.filter(u => u.role === 'rep').map(rep => {
                            const repTime = timeEntries.filter(t => t.rep_id === rep.id);
                            const repExpenses = expenseEntries.filter(e => e.rep_id === rep.id && e.status === 'approved');
                            const clients = [...new Set(repTime.map(e => e.supplier_id))];
                            if (clients.length === 0 && repExpenses.length === 0) return <tr key={rep.id}><td className="py-2 text-slate-500 font-semibold">{rep.name}</td><td colSpan="8" className="py-2 text-center text-slate-600 italic">No logs in cycle</td></tr>;
                            return clients.map((clientId, idx) => {
                              const clientHours = repTime.filter(t => t.supplier_id === clientId).reduce((acc, curr) => acc + curr.hours, 0);
                              const clientMileage = repTime.filter(t => t.supplier_id === clientId).reduce((acc, curr) => acc + curr.mileage_km, 0);
                              const expAmt = idx === 0 ? repExpenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0) : 0;
                              const { pay_rate } = getRepSupplierRates(rep.id, clientId);
                              const hoursPay = clientHours * pay_rate;
                              const mileagePay = clientMileage * 0.73;
                              return (
                                <tr key={`${rep.id}_${clientId}`} className="hover:bg-slate-950/40">
                                  {idx === 0 ? <td className="py-2 text-white font-extrabold" rowSpan={clients.length}>{rep.name}</td> : null}
                                  <td className="py-2 text-slate-400">{suppliers.find(s => s.id === clientId)?.name || 'Client'}</td>
                                  <td className="py-2 text-right">{clientHours} hrs</td>
                                  <td className="py-2 text-right font-mono text-slate-500">${pay_rate.toFixed(2)}</td>
                                  <td className="py-2 text-right text-white font-semibold">${hoursPay.toFixed(2)}</td>
                                  <td className="py-2 text-right text-sky-400">{clientMileage} km</td>
                                  <td className="py-2 text-right text-emerald-450">${mileagePay.toFixed(2)}</td>
                                  <td className="py-2 text-right text-emerald-400">${expAmt > 0 ? `$${expAmt.toFixed(2)}` : '—'}</td>
                                  <td className="py-2 text-right text-[#22D3EE] font-black">${(hoursPay + mileagePay + expAmt).toFixed(2)}</td>
                                </tr>
                              );
                            });
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {accountingSubTab === 'bulk-entry' && (
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 text-left">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-850 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#22D3EE]" /> Weekly Manager Bulk Entry Portal
                      </h4>
                      <p className="text-[10px] text-slate-400 max-w-[500px]">
                        Log or backdate hours and mileage for multiple supplier locations in a single form at the end of the week.
                      </p>
                      
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const date = document.getElementById('bulk_date').value;
                          const repId = document.getElementById('bulk_rep').value;
                          const supId = document.getElementById('bulk_sup').value;
                          const plantId = document.getElementById('bulk_plant').value;
                          const hours = parseFloat(document.getElementById('bulk_hours').value || 0);
                          const mileage = parseFloat(document.getElementById('bulk_mileage').value || 0);
                          
                          if (hours <= 0 && mileage <= 0) {
                            return alert("Please enter valid hours or mileage!");
                          }
                          
                          const dbTime = getEntities('timeEntries') || [];
                          const newEntry = {
                            id: 'time_' + Date.now(),
                            rep_id: repId,
                            supplier_id: supId,
                            plant_id: plantId,
                            date: date,
                            hours: hours,
                            mileage_km: mileage,
                            invoiced: false,
                            sent_to_payroll: false
                          };
                          
                          dbTime.push(newEntry);
                          saveEntity('timeEntries', newEntry);
                          window.dispatchEvent(new Event('ids_pulse_db_update'));
                          alert("Bulk log entry successfully added to Colleen's billing overview!");
                          document.getElementById('bulk_hours').value = '';
                          document.getElementById('bulk_mileage').value = '';
                        }}
                        className="flex flex-col gap-4 max-w-[450px] mt-2"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                            <input type="date" id="bulk_date" defaultValue={new Date().toISOString().substring(0, 10)} required className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Representative</label>
                            <select id="bulk_rep" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                              {users.filter(u => u.role === 'rep').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client Supplier</label>
                            <select id="bulk_sup" defaultValue="autokabel" onChange={(ev) => {
                              const sId = ev.target.value;
                              const plantSel = document.getElementById('bulk_plant');
                              if (plantSel) {
                                const supObj = suppliers.find(s => s.id === sId);
                                const plantsList = supObj?.plants_served || [];
                                plantSel.innerHTML = plantsList.map(pId => `<option value="${pId}">${plants.find(p => p.id === pId)?.name || pId}</option>`).join('');
                              }
                            }} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Location / Plant</label>
                            <select id="bulk_plant" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                              {(suppliers.find(s => s.id === 'autokabel')?.plants_served || []).map(pId => (
                                <option key={pId} value={pId}>{plants.find(p => p.id === pId)?.name || pId}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Hours Worked</label>
                            <input type="number" step="0.5" id="bulk_hours" placeholder="e.g. 10.0" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mileage (km)</label>
                            <input type="number" step="1" id="bulk_mileage" placeholder="e.g. 45" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                          </div>
                        </div>

                        <button type="submit" className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors mt-2 cursor-pointer">
                          Add Bulk Log Entry
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SUB-TAB 4: CLIENTS & RATES */}
                  {accountingSubTab === 'rates-config' && (
                    <div className="flex flex-col gap-6 text-left">
                      {/* Sub-navigation for CRUD setups */}
                      <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850 w-max">
                        <button onClick={() => setAdminCrudTab('customers')} className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer ${adminCrudTab === 'customers' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'}`}>Manage Customers</button>
                        <button onClick={() => setAdminCrudTab('locations')} className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer ${adminCrudTab === 'locations' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'}`}>Manage Locations</button>
                        <button onClick={() => setAdminCrudTab('reps')} className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer ${adminCrudTab === 'reps' ? 'bg-[#0EA5E9] text-white' : 'text-slate-400 hover:text-slate-200'}`}>Onboard Reps</button>
                      </div>

                      {/* CRUD TAB 1: CUSTOMERS */}
                      {adminCrudTab === 'customers' && (
                        <div className="grid grid-cols-3 gap-6">
                          <form onSubmit={handleCreateCustomer} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-[#0EA5E9]" /> Add New Customer</h4>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
                              <input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Auto Kabel" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Primary Contact Name</label>
                              <input type="text" value={newCustomerContactName} onChange={(e) => setNewCustomerContactName(e.target.value)} placeholder="Juan Carlos" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
                              <input type="email" value={newCustomerContactEmail} onChange={(e) => setNewCustomerContactEmail(e.target.value)} placeholder="jc@autokabel.mx" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <button type="submit" className="bg-[#0EA5E9] text-white font-bold py-2 rounded-xl text-xs mt-2">Onboard Customer</button>
                          </form>

                          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Active Customers List</h4>
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th>Client Name</th><th>Invoicing</th><th>Contacts</th><th>Schedule</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850 text-slate-300">
                                {suppliers.map(s => (
                                  <tr key={s.id}>
                                    <td className="py-2 text-white font-bold">{s.name}</td>
                                    <td className="py-2 font-mono text-slate-450">{s.id.toUpperCase()}</td>
                                    <td className="py-2">{s.contacts.map(c => c.name).join(", ")}</td>
                                    <td className="py-2"><span className="px-2 py-0.5 rounded bg-sky-400/10 text-sky-400 text-[9px] font-bold uppercase">{s.invoice_schedule || 'weekly'}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* CRUD TAB 2: LOCATIONS */}
                      {adminCrudTab === 'locations' && (
                        <div className="grid grid-cols-3 gap-6">
                          <form onSubmit={handleCreateLocation} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" /> Map New Location</h4>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Parent Customer</label>
                              <select value={newLocationSupplierId} onChange={(e) => setNewLocationSupplierId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Location / Plant Name</label>
                              <input type="text" value={newLocationName} onChange={(e) => setNewLocationName(e.target.value)} placeholder="Mercedes Tuscaloosa" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Physical Address</label>
                              <input type="text" value={newLocationAddress} onChange={(e) => setNewLocationAddress(e.target.value)} placeholder="Tuscaloosa, AL" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Default QRE Assignment</label>
                              <select value={newLocationRepId} onChange={(e) => setNewLocationRepId(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                                {users.filter(u => u.role === 'rep').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Std Hrs/Wk</label>
                                <input type="number" value={newLocationHours} onChange={(e) => setNewLocationHours(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                              </div>
                              <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bill Rate ($/hr)</label>
                                <input type="number" value={newLocationBillRate} onChange={(e) => setNewLocationBillRate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                              </div>
                            </div>
                            <button type="submit" className="bg-[#0EA5E9] text-white font-bold py-2 rounded-xl text-xs mt-2">Map Location & Rates</button>
                          </form>

                          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Active Locations Mapping</h4>
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th>Location</th><th>OEM</th><th>Parent Customer</th><th>Address</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850 text-slate-300">
                                {plants.map(p => {
                                  const parent = suppliers.find(s => s.plants_served.includes(p.id));
                                  return (
                                    <tr key={p.id}>
                                      <td className="py-2 text-white font-bold">{p.name}</td>
                                      <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-sky-400/10 text-sky-400 text-[8px] font-extrabold uppercase">{p.oem_brand}</span></td>
                                      <td className="py-2 text-slate-400">{parent?.name || 'IDS Global'}</td>
                                      <td className="py-2 text-slate-400">{p.address}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* CRUD TAB 3: REPS */}
                      {adminCrudTab === 'reps' && (
                        <div className="grid grid-cols-3 gap-6">
                          <form onSubmit={handleCreateRep} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2 flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-purple-400" /> Onboard QRE Representative</h4>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                              <input type="text" value={newRepName} onChange={(e) => setNewRepName(e.target.value)} placeholder="Hugo Picon" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                              <input type="email" value={newRepEmail} onChange={(e) => setNewRepEmail(e.target.value)} placeholder="hugo.p@integritydriven.com" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Phone Contact</label>
                              <input type="text" value={newRepPhone} onChange={(e) => setNewRepPhone(e.target.value)} placeholder="+1 555-123-4567" className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Payment Currency</label>
                              <select value={newRepPayCurrency} onChange={(e) => setNewRepPayCurrency(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white">
                                <option value="CAD">CAD (C$)</option>
                                <option value="USD">USD (US$)</option>
                              </select>
                            </div>
                            <button type="submit" className="bg-[#0EA5E9] text-white font-bold py-2 rounded-xl text-xs mt-2">Onboard QRE</button>
                          </form>

                          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Active Field Representatives</h4>
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th>Rep Name</th><th>Email</th><th>Phone</th><th>Pay Currency</th><th>Role</th></tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850 text-slate-300">
                                {users.filter(u => u.role === 'rep').map(r => (
                                  <tr key={r.id}>
                                    <td className="py-2 text-white font-bold flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center text-[10px] text-[#22D3EE] font-bold">{r.avatar}</span>
                                      {r.name}
                                    </td>
                                    <td className="py-2 font-mono text-slate-450">{r.email}</td>
                                    <td className="py-2 text-slate-400">{r.phone}</td>
                                    <td className="py-2 font-mono text-[#22D3EE] font-bold">{r.pay_currency || getRepPayCurrency(r.id)}</td>
                                    <td className="py-2"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase">Field QRE</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* RATES OVERRIDES SECTION */}
                      {adminCrudTab === 'customers' && (
                        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800">
                          <form onSubmit={handleSaveRateConfig} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Set Custom Rate Override</h4>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Representative</label>
                              <select 
                                value={configRepId} 
                                onChange={(e) => {
                                  if (e.target.value === 'ADD_NEW') {
                                    setShowQuickAddRep(true);
                                  } else {
                                    setConfigRepId(e.target.value);
                                  }
                                }}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                              >
                                {users.filter(u => u.role === 'rep' || u.role === 'qre' || u.id === '1' || u.id === 'rep_hugo' || u.id === 'rep_nabil' || u.id === 'rep_rogelio').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Rep...</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client</label>
                              <select 
                                value={configSupplierId} 
                                onChange={(e) => {
                                  if (e.target.value === 'ADD_NEW') {
                                    setShowQuickAddClient(true);
                                  } else {
                                    setConfigSupplierId(e.target.value);
                                  }
                                }}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                              >
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Client...</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pay Rate ($/hr)</label>
                              <input type="number" step="0.5" value={configPayRate} onChange={(e) => setConfigPayRate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Bill Rate ($/hr)</label>
                              <input type="number" step="0.5" value={configBillingRate} onChange={(e) => setConfigBillingRate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                            </div>
                            <button type="submit" className="bg-[#0EA5E9] text-white font-bold py-2 rounded-xl text-xs mt-2">Save Rate Override</button>
                          </form>
                          
                          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 flex flex-col gap-3">
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-850 pb-2">Custom Rates Overrides Matrix</h4>
                            {rates.length === 0 ? <div className="text-center py-6 text-slate-550 italic">No custom rates configured. System defaults applied ($28/hr billing, $20/hr pay).</div> : (
                              <table className="w-full text-xs text-left">
                                <thead>
                                  <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]"><th>Rep</th><th>Client</th><th className="text-right">Bill Rate</th><th className="text-right">Pay Rate</th><th className="text-right">Action</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850 text-slate-300">
                                  {(rates || []).filter(Boolean).map(r => {
                                    const projMatch = (projects || []).find(p => p && p.rep_id === r.rep_id && p.client_id === r.supplier_id);
                                    const billSymbol = projMatch && projMatch.currency === 'CAD' ? 'C$' : 'US$';
                                    const repPayCurrency = getRepPayCurrency(r.rep_id);
                                    const paySymbol = repPayCurrency === 'CAD' ? 'C$' : 'US$';
                                    return (
                                      <tr key={r.id}>
                                        <td className="py-2 text-white font-semibold">{users.find(u => u.id === r.rep_id)?.name || 'Rep'}</td>
                                        <td className="py-2 text-slate-400">{suppliers.find(s => s.id === r.supplier_id)?.name || 'Client'}</td>
                                        <td className="py-2 text-right font-bold text-[#22D3EE]">{billSymbol} {parseFloat(r.billing_rate).toFixed(2)}/hr</td>
                                        <td className="py-2 text-right font-bold text-emerald-450">{paySymbol} {parseFloat(r.pay_rate).toFixed(2)}/hr</td>
                                        <td className="py-2 text-right"><button onClick={() => handleDeleteRate(r.id)} className="px-2 py-0.5 bg-slate-800 text-rose-400 text-[9px] uppercase rounded">Delete</button></td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )
          )}
          {activeTab === 'emails' && (
            <div className="flex-1 flex flex-col min-h-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 mb-3">Outgoing Transaction Mail Audit</h3>
              
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase text-[9px]">
                      <th className="py-2 px-3">Sent Time</th>
                      <th className="py-2 px-3">Subject Line</th>
                      <th className="py-2 px-3">Field Rep</th>
                      <th className="py-2 px-3">Recipient(s)</th>
                      <th className="py-2 px-3">CC Email Headers</th>
                      <th className="py-2 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {emailLogs.map(log => {
                      const incident = incidents.find(i => i.id === log.incident_id);
                      const repName = incident ? (users.find(u => u.id === incident.rep_id)?.name || 'Clarence Kuiken') : 'System';
                      return (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-3 px-3 font-mono text-[10px]">{new Date(log.sent_at).toLocaleTimeString()}</td>
                          <td className="py-3 px-3 font-bold text-white">{log.subject}</td>
                          <td className="py-3 px-3 text-[#22D3EE] font-medium">{repName}</td>
                          <td className="py-3 px-3 truncate max-w-[120px] text-slate-400">{log.to_emails}</td>
                          <td className="py-3 px-3 text-indigo-400 text-[10px]">{log.cc_emails}</td>
                          <td className="py-3 px-3">
                            <button 
                              onClick={() => setSelectedEmailLog(log)}
                              className="text-[#22D3EE] font-bold hover:underline cursor-pointer"
                            >
                              Inspect Body
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: USER DIRECTORY & QUICK DISPATCH */}
          {activeTab === 'users' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Operational Rep Directory & Active Assignments</h3>
                <button 
                  onClick={() => setShowAssignRepModal(true)}
                  className="bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign Rep Dispatch</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 flex flex-col gap-4">
                {/* Statistics Cards Header */}
                <div className="grid grid-cols-4 gap-3 flex-shrink-0">
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Active Reps</span>
                    <span className="text-xl font-extrabold text-white mt-1 block leading-none">{users.filter(u => u.role === 'rep').length}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Reps On Shift</span>
                    <span className="text-xl font-extrabold text-emerald-450 mt-1 block leading-none">
                      {users.filter(u => u && u.role === 'rep' && shiftReports.some(sr => sr.rep_id === u.id && sr.status === 'Draft')).length}
                    </span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Suspect Materials</span>
                    <span className="text-xl font-extrabold text-amber-450 mt-1 block leading-none">{incidents.length}</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-left">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Rework Logged</span>
                    <span className="text-xl font-extrabold text-[#22D3EE] mt-1 block leading-none">
                      {reworkLogs.reduce((acc, curr) => acc + (curr.pieces_reworked || curr.quantity || 0), 0)} pcs
                    </span>
                  </div>
                </div>

                {/* Reps Detail List Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {users.filter(u => u && u.role === 'rep').map(u => {
                    const activeShift = shiftReports.find(r => r.rep_id === u.id && r.status === 'Draft');
                    const assignedRates = rates.filter(r => r.rep_id === u.id);
                    const assignedPlants = assignedRates.map(r => plants.find(p => p.id === r.plant_id || p.id === r.supplier_id)).filter(Boolean);
                    
                    const totalHours = timeEntries.filter(t => t.rep_id === u.id).reduce((acc, curr) => acc + (curr.hours || 0), 0);
                    const totalIncidents = incidents.filter(i => i.rep_id === u.id).length;
                    const totalRework = reworkLogs.filter(rl => rl.rep_id === u.id).reduce((acc, curr) => acc + (curr.pieces_reworked || curr.quantity || 0), 0);
                    
                    return (
                      <div key={u.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3.5 hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1E3A5F] flex items-center justify-center font-bold text-sm text-[#22D3EE] border border-[#0EA5E9]/25">
                              {u.avatar}
                            </div>
                            <div className="text-left">
                              <h4 className="text-xs font-black text-white">{u.name}</h4>
                              <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{u.email} • {u.phone}</p>
                            </div>
                          </div>
                          
                          {activeShift ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold uppercase rounded-full tracking-wider animate-pulse flex items-center gap-1 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> On Shift
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-950 text-slate-500 text-[8px] font-extrabold uppercase rounded-full tracking-wider border border-slate-850">
                              Off Shift
                            </span>
                          )}
                        </div>

                        {/* Location Details */}
                        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl flex flex-col gap-1.5 text-[10px] text-left">
                          <div className="flex justify-between">
                            <span className="text-slate-500 uppercase font-bold text-[8.5px]">Assigned Locations:</span>
                            <span className="text-slate-300 font-semibold text-right max-w-[150px] truncate">
                              {assignedPlants.map(p => p.name).join(', ') || 'General / Dispatch Queue'}
                            </span>
                          </div>
                          {activeShift && (
                            <div className="flex justify-between border-t border-slate-900 pt-1.5">
                              <span className="text-emerald-400 uppercase font-bold text-[8.5px]">Active Plant Location:</span>
                              <span className="text-emerald-350 font-bold">
                                {plants.find(p => p.id === activeShift.plant_id)?.name || activeShift.plant_id}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Performance Stats */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-850/60 text-center">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Hours Logged</span>
                            <span className="text-xs font-black text-white mt-0.5">{totalHours.toFixed(1)} hrs</span>
                          </div>
                          <div className="flex flex-col border-l border-r border-slate-900">
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Suspect Materials</span>
                            <span className="text-xs font-black text-white mt-0.5">{totalIncidents}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Rework Logged</span>
                            <span className="text-xs font-black text-white mt-0.5">{totalRework} pcs</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: REWORK LOGS FEED */}
          {activeTab === 'rework-logs' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Defect Rework Logs Feed</h3>
                  <span className="text-[10px] text-slate-500 font-medium">Rep rework pieces, hours, and notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrintReworkFeedReport}
                    className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Feed</span>
                  </button>
                  <button 
                    onClick={handleDownloadReworkFeedReport}
                    className="flex items-center gap-1.5 bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Report</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
                {reworkLogs.length > 0 && (
                  <span className="text-[9px] text-[#22D3EE] font-bold mb-1.5 block">
                    💡 Tip: Click any row to view details, download PDF, or print.
                  </span>
                )}
                <table className="w-full border-collapse text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2 px-3">Date logged</th>
                      <th className="py-2 px-3">Field Rep</th>
                      <th className="py-2 px-3">Part Affected</th>
                      <th className="py-2 px-3">Supplier</th>
                      <th className="py-2 px-3">Pieces Reworked</th>
                      <th className="py-2 px-3">Time Spent</th>
                      <th className="py-2 px-3">Notes & Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-855 text-slate-350">
                    {reworkLogs
                      .filter(rw => showAllDates || rw.created_at.startsWith(selectedDate))
                      .map(rw => {
                        const rep = users.find(u => u.id === rw.rep_id)?.name || 'Clarence Kuiken';
                        return (
                          <tr 
                            key={rw.id} 
                            onClick={() => setSelectedReworkLog(rw)}
                            className="hover:bg-slate-900/60 text-slate-300 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 px-3 font-medium">{new Date(rw.created_at).toLocaleDateString()}</td>
                            <td className="py-2.5 px-3 text-[#22D3EE] font-semibold">{rep}</td>
                            <td className="py-2.5 px-3 font-semibold text-white">PN {rw.part_id}</td>
                            <td className="py-2.5 px-3 uppercase text-[10px] text-slate-450 font-bold">{rw.supplier_id}</td>
                            <td className="py-2.5 px-3 font-bold text-white text-center bg-emerald-500/5">{rw.qty} pcs</td>
                            <td className="py-2.5 px-3 font-bold text-sky-400">{Math.round(rw.time_spent_minutes / 60 * 10) / 10} hrs</td>
                            <td className="py-2.5 px-3 text-slate-400 max-w-[200px] truncate" title={rw.notes}>{rw.notes}</td>
                          </tr>
                        );
                      })}
                    {reworkLogs.filter(rw => showAllDates || rw.created_at.startsWith(selectedDate)).length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500 italic">
                          {!showAllDates && !hasDataForSelectedDate() ? "No records found for this date." : "No rework logged on this date."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: LAUNCH ROADMAP & TIMELINE */}
          {activeTab === 'roadmap' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
              {isRoadmapLocked && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[6px] rounded-2xl flex flex-col items-center justify-center z-30 px-6 py-8 text-center border border-slate-800/80">
                  <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-xl shadow-lg shadow-amber-500/5 animate-pulse">
                    🔒
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Confidential Launch Roadmap Lock</h3>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">Enter passcode to unlock the 36-week product timeline and team budgeting models.</p>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const pw = roadmapPassword.trim().toLowerCase().replace(/\s+/g, '');
                      if (pw === 'shahroz') {
                        setIsRoadmapLocked(false);
                        setRoadmapLockError(false);
                        setRoadmapPassword('');
                      } else {
                        setRoadmapLockError(true);
                      }
                    }}
                    className="mt-4 flex gap-1.5 w-full max-w-[240px]"
                  >
                    <input
                      type="password"
                      placeholder="Passcode"
                      value={roadmapPassword}
                      onChange={(e) => setRoadmapPassword(e.target.value)}
                      className={`flex-1 bg-slate-900 border text-[11px] px-3 py-1.5 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 ${
                        roadmapLockError ? 'border-red-500/50' : 'border-slate-800'
                      }`}
                    />
                    <button
                      type="submit"
                      className="bg-amber-500 hover:bg-amber-500/85 text-slate-950 font-bold text-[10.5px] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      Unlock
                    </button>
                  </form>
                  {roadmapLockError && (
                    <span className="text-[9px] text-red-400 font-bold mt-2 block animate-bounce">⚠️ Incorrect passcode</span>
                  )}
                </div>
              )}

              {/* Header section */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-amber-400" />
                    <span>Production Launch Roadmap & Time-to-Market</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Visual 36-week engineering schedule, dynamic budget estimators, and app store validation mitigations</span>
                </div>
                {/* Team Toggle */}
                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Estimate Base:</span>
                  <button
                    onClick={() => setRoadmapTeamType('onshore')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roadmapTeamType === 'onshore'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Onshore Team (US/CA)
                  </button>
                  <button
                    onClick={() => setRoadmapTeamType('offshore')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      roadmapTeamType === 'offshore'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Offshore Team
                  </button>
                  {!isRoadmapLocked && (
                    <>
                      <div className="w-px h-4 bg-slate-800 mx-1"></div>
                      <button
                        onClick={() => setIsRoadmapLocked(true)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-400 hover:bg-slate-900 cursor-pointer flex items-center gap-1 transition-colors"
                        title="Lock Roadmap tab"
                      >
                        <span>🔒 Lock Roadmap</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Roadmap Body */}
              <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
                {/* Left Side: Chronological Phase Timeline (Scrollable) */}
                <div className="w-[45%] flex flex-col gap-3 overflow-y-auto scrollbar-thin pr-1 flex-shrink-0">
                  <div className="p-3.5 bg-slate-900/40 border border-slate-850 rounded-xl">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-white">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Product Lifecycle Roadmap (36 Weeks)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Developing, testing, auditing, and expanding the production-ready iOS, Android, and web suite. Currently, major components are simulated in this prototype.
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-slate-450 border-t border-slate-800/60 pt-2 font-semibold">
                      <span>Prototype status:</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Phase 1, 2, 3 Active
                      </span>
                    </div>
                  </div>

                  {/* List of 7 Phases */}
                  <div className="flex flex-col gap-2.5">
                    {[
                      {
                        id: 1,
                        weeks: 'W1–W4',
                        title: 'Discovery & Core Spec',
                        status: 'Completed',
                        statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                        desc: 'Figma wireframes, database schema definition, security policies, and API specifications.'
                      },
                      {
                        id: 2,
                        weeks: 'W4–W9',
                        title: 'Database & Backend APIs',
                        status: 'Prototype Ready',
                        statusColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                        desc: 'API endpoint builds, Express server backend, database seeding routines, file storage setup.'
                      },
                      {
                        id: 3,
                        weeks: 'W9–W15',
                        title: 'Web Portal & Mobile Launch',
                        status: 'Prototype Testing',
                        statusColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                        desc: 'Vite React dashboard modules, spreadsheet generation, and real-time socket connections.'
                      },
                      {
                        id: 4,
                        weeks: 'W15–W21',
                        title: 'Multi-Plant Rollout (USA/CA/MX)',
                        status: 'Prototype Testing',
                        statusColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                        desc: 'React Native camera masks, canvas drawings, offline DB sync, and email preview routing.'
                      },
                      {
                        id: 5,
                        weeks: 'W21–W26',
                        title: 'Pulse AI & Smart Auditing',
                        status: 'Prototype Testing',
                        statusColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                        desc: 'OpenAI assistants, similarity algorithms, custom audit rules, and commands parsing.'
                      },
                      {
                        id: 6,
                        weeks: 'W26–W31',
                        title: 'ERP & QuickBooks Sync',
                        status: 'Planned',
                        statusColor: 'bg-slate-800 text-slate-450 border-slate-700/50',
                        desc: 'Playwright automation testing, closed user testing on TestFlight, penetration testing.'
                      },
                      {
                        id: 7,
                        weeks: 'W31–W36',
                        title: 'Predictive Rework Analytics',
                        status: 'Planned',
                        statusColor: 'bg-slate-800 text-slate-450 border-slate-700/50',
                        desc: 'Apple & Google submission pipelines, store metadata setups, and Vercel/ECS servers deployment.'
                      }
                    ].map((phase) => (
                      <button
                        key={phase.id}
                        onClick={() => setActiveRoadmapPhase(phase.id)}
                        className={`w-full p-3 text-left rounded-xl border transition-all cursor-pointer flex gap-3 ${
                          activeRoadmapPhase === phase.id
                            ? 'bg-[#1E3A5F]/40 border-amber-500/40 shadow-md shadow-amber-500/5'
                            : 'bg-slate-900/30 border-slate-850 hover:bg-slate-900/60 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800 px-2 py-1.5 rounded-lg min-w-[52px] h-fit">
                          <span className="text-[10px] font-extrabold text-amber-400 uppercase leading-none">{phase.weeks}</span>
                          <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase leading-none">Phase {phase.id}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{phase.title}</h4>
                            <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md border font-semibold flex-shrink-0 ${phase.statusColor}`}>
                              {phase.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 leading-normal">{phase.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Side: Details Pane */}
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-thin pr-1">
                  
                  {/* Phase Details Card */}
                  {(() => {
                    const phases = {
                      1: {
                        title: 'Phase 1: Discovery, Design & System Architecture',
                        duration: 'Weeks 1–4 (Month 1)',
                        status: '100% Completed in Mock/Specs',
                        teamLevel: { pm: 80, backend: 60, web: 40, mobile: 40 },
                        tasks: [
                          'Finalizing Figma UI/UX screens for Mobile App (Dark Mode UI, Camera Overlay, Canvas Annotations).',
                          'Design of the Web Dashboard Layout (Tab structures, Slide-out panels, Pulse AI widget).',
                          'Database Schema Architecture (PostgreSQL or MongoDB + Redis for caching and sockets).',
                          'Writing Swagger/OpenAPI specifications for communications.'
                        ],
                        risk: 'Requirements and UI scope changes during mid-phase.',
                        mitigation: 'Freeze the visual interface specs early inside prototype and sign off on layout states.'
                      },
                      2: {
                        title: 'Phase 2: Database & Backend APIs',
                        duration: 'Weeks 4–9 (Month 2)',
                        status: 'Prototype Simulated & Seeding Done',
                        teamLevel: { pm: 30, backend: 100, web: 40, mobile: 30 },
                        tasks: [
                          'Setting up Server Frameworks (Node.js/Express, Python/FastAPI, or Go).',
                          'Database implementation & seeding routines.',
                          'Developing authentication endpoints (JWT, Session cookies, Multi-Factor Authentication for admins).',
                          'File storage setup (AWS S3 or Google Cloud Storage) for receipt photos, incident defect images, and generated PDFs.'
                        ],
                        risk: 'Database query bottlenecks during peak shift logs.',
                        mitigation: 'Implement caching on recent incident entries using Redis and use index keys for timestamp searches.'
                      },
                      3: {
                        title: 'Phase 3: Web Portal & Mobile Launch',
                        duration: 'Weeks 9–15 (Months 3–4)',
                        status: 'Active Prototype Testing',
                        teamLevel: { pm: 40, backend: 50, web: 100, mobile: 10 },
                        tasks: [
                          'Building responsive dashboard pages with clean grid modules.',
                          'Excel Workbook (.xlsx) generation on the backend (using libraries like exceljs) for layout alignment.',
                          'PDF generation service (Puppeteer/pdfmake) to compile reports with background watermarks.',
                          'Real-time socket connections (Socket.io) to instantly push toast notifications and play chimes.'
                        ],
                        risk: 'Vercel or hosting platform deployment builds scaling issues.',
                        mitigation: 'Utilize Vite bundle chunk-splitting and client-side optimization to maintain 95+ Lighthouse score.'
                      },
                      4: {
                        title: 'Phase 4: Multi-Plant Rollout (USA/CA/MX)',
                        duration: 'Weeks 15–21 (Months 4–5)',
                        status: 'Active Simulator Mockup',
                        teamLevel: { pm: 40, backend: 50, web: 10, mobile: 100 },
                        tasks: [
                          'Cross-platform framework setup using React Native or Flutter to reduce engineering effort.',
                          'Camera API integration with custom overlay masks for barcode/QR code scans.',
                          'Canvas-based drawing overlay logic (saving drawn arrows/annotations onto photos).',
                          'Offline Sync: SQLite/WatermelonDB to queue entries locally when offline and auto-upload.'
                        ],
                        risk: 'Apple rejects the submission if it looks like a wrapped web view.',
                        mitigation: 'Build the interface using native UI modules, native animations, offline sync storage, and native device camera controls.'
                      },
                      5: {
                        title: 'Phase 5: Pulse AI & Smart Auditing',
                        duration: 'Weeks 21–26 (Months 5–6)',
                        status: 'AI Simulator Integrated',
                        teamLevel: { pm: 30, backend: 90, web: 50, mobile: 30 },
                        tasks: [
                          'Conversational AI: Integrating OpenAI Assistants API (GPT-4o mini) utilizing Function Calling.',
                          'Audit Engine: Codifying rules (Hours > 16, negative fields, missing supplier contact, expense > $100 without a receipt).',
                          'Jaccard Similarity Engine running on database insertions to check duplicate reports.'
                        ],
                        risk: 'High OpenAI API token usage costs.',
                        mitigation: 'Caching common user command reports in Redis and utilizing rate-limit throttling in backend controller.'
                      },
                      6: {
                        title: 'Phase 6: ERP & QuickBooks Sync',
                        duration: 'Weeks 26–31 (Month 7)',
                        status: 'Planned',
                        teamLevel: { pm: 50, backend: 50, web: 50, mobile: 50 },
                        tasks: [
                          'Automated testing pipelines using Playwright for web and Appium for mobile.',
                          'Beta testing with real representatives using Apple TestFlight and Google Play Console Internal Testing.',
                          'Penetration testing: checking for SQL injection, JWT exploits, and unauthorized API endpoint access.'
                        ],
                        risk: 'Critical security bugs found logic late, causing timeline slips.',
                        mitigation: 'Implement unit testing rules throughout development phases and run monthly automated scanner checks.'
                      },
                      7: {
                        title: 'Phase 7: Predictive Rework Analytics',
                        duration: 'Weeks 31–36 (Months 8–9)',
                        status: 'Planned',
                        teamLevel: { pm: 60, backend: 60, web: 30, mobile: 40 },
                        tasks: [
                          'Preparing Apple & Google Play Store builds, graphic launch assets, and store page description optimization.',
                          'Google Play Store closed beta testing (requires 20 testers for 14 days if using personal developer account).',
                          'Apple App Store standard review submission (24 to 72 hours).',
                          'Configuring Vercel or cloud web server domains, SSL certificates, and setting up staging/production pipelines.'
                        ],
                        risk: 'Google Play 14-day beta constraint delaying release.',
                        mitigation: 'Register a Corporate/Organization Developer Account rather than a personal account, which bypasses the 20-tester closed beta rule.'
                      }
                    };

                    const currentPhaseObj = phases[activeRoadmapPhase] || phases[1];

                    return (
                      <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in duration-200">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                          <div>
                            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">{currentPhaseObj.title}</h4>
                            <span className="text-[10px] text-amber-400 font-bold block mt-0.5">{currentPhaseObj.duration}</span>
                          </div>
                          <span className="text-[9px] bg-slate-950 border border-slate-800 text-slate-350 px-2 py-0.5 rounded font-extrabold uppercase">
                            {currentPhaseObj.status}
                          </span>
                        </div>

                        {/* Deliverable details */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wider">Key Tasks & Targets:</span>
                          <ul className="flex flex-col gap-1">
                            {currentPhaseObj.tasks.map((task, idx) => (
                              <li key={idx} className="text-[10.5px] text-slate-300 flex items-start gap-1.5 leading-relaxed">
                                <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Resource usage indicators */}
                        <div className="grid grid-cols-4 gap-2 border-t border-b border-slate-850 py-2.5 my-1 bg-slate-950/20 px-2 rounded-lg">
                          {[
                            { name: 'PM / Designer', val: currentPhaseObj.teamLevel.pm },
                            { name: 'Backend Eng', val: currentPhaseObj.teamLevel.backend },
                            { name: 'Web Dev', val: currentPhaseObj.teamLevel.web },
                            { name: 'Mobile Dev', val: currentPhaseObj.teamLevel.mobile }
                          ].map((role, idx) => (
                            <div key={idx} className="flex flex-col gap-1">
                              <span className="text-[8.5px] text-slate-500 font-bold uppercase">{role.name}</span>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${role.val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Risk alerts */}
                        <div className="bg-amber-500/5 border border-amber-500/15 p-2.5 rounded-lg flex gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <span className="text-amber-400 font-bold text-xs">⚠️</span>
                          </div>
                          <div className="text-[10px]">
                            <span className="text-slate-300 font-bold block">Risk: {currentPhaseObj.risk}</span>
                            <span className="text-slate-400 block mt-0.5"><span className="text-amber-400/90 font-bold">Mitigation:</span> {currentPhaseObj.mitigation}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Team Cost Estimation Card */}
                  <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Recommended Team & Budgets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isBudgetLocked && (
                          <button
                            onClick={() => setIsBudgetLocked(true)}
                            className="text-[9px] text-[#22D3EE] hover:text-white font-extrabold uppercase bg-[#1E3A5F]/60 hover:bg-[#1E3A5F] border border-[#22D3EE]/25 px-2 py-0.5 rounded cursor-pointer transition-colors"
                          >
                            🔒 Lock Section
                          </button>
                        )}
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Estimated build time: 36 weeks</span>
                      </div>
                    </div>

                    <div className="relative">
                      {/* Password Lock Overlay */}
                      {isBudgetLocked && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[5px] rounded-xl flex flex-col items-center justify-center z-10 px-4 py-2 text-center min-h-[120px]">
                          <span className="text-lg mb-1">🔒</span>
                          <span className="text-[10px] font-extrabold text-white uppercase tracking-wider block">Confidential Budget Restrictive Access</span>
                          <span className="text-[8.5px] text-slate-450 mt-0.5 block">Enter password to view cost estimations</span>
                          
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const pw = budgetPassword.trim().toLowerCase().replace(/\s+/g, '');
                              if (pw === 'shahroz') {
                                setIsBudgetLocked(false);
                                setBudgetLockError(false);
                                setBudgetPassword('');
                              } else {
                                setBudgetLockError(true);
                              }
                            }}
                            className="mt-2.5 flex gap-1.5 w-full max-w-[200px]"
                          >
                            <input
                              type="password"
                              placeholder="Password"
                              value={budgetPassword}
                              onChange={(e) => setBudgetPassword(e.target.value)}
                              className={`flex-1 bg-slate-900 border text-[11px] px-2.5 py-1 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-[#22D3EE]/50 ${
                                budgetLockError ? 'border-red-500/50' : 'border-slate-800'
                              }`}
                            />
                            <button
                              type="submit"
                              className="bg-[#22D3EE] hover:bg-[#22D3EE]/85 text-slate-950 font-bold text-[10.5px] px-3 py-1 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                            >
                              Unlock
                            </button>
                          </form>
                          {budgetLockError && (
                            <span className="text-[9px] text-red-400 font-bold mt-1.5 block animate-bounce">⚠️ Incorrect password</span>
                          )}
                        </div>
                      )}

                      <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${isBudgetLocked ? 'filter blur-[5px] select-none pointer-events-none' : ''}`}>
                        {/* Left: Financial summary */}
                        <div className="bg-slate-950/70 border border-slate-850 rounded-xl p-3 flex flex-col justify-center items-center text-center">
                          <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider">total estimated budget</span>
                          <span className="text-lg font-black text-emerald-400 mt-1">
                            {roadmapTeamType === 'onshore' ? '$146,000 – $240,000' : '$52,000 – $90,000'}
                          </span>
                          <span className="text-[9.5px] text-slate-500 mt-1 leading-normal italic">
                            {roadmapTeamType === 'onshore' 
                              ? 'Based on standard US/Canada developer hourly rates' 
                              : 'Based on South Asia/Eastern Europe offshore agency rates'}
                          </span>
                        </div>

                        {/* Right: Role cost breakdowns */}
                        <div className="flex flex-col gap-1.5 text-[10.5px]">
                          {[
                            { role: '1 PM / UI Designer', onshore: '$22,000 – $38,000', offshore: '$9,000 – $15,000' },
                            { role: '1 Backend / DevOps', onshore: '$45,000 – $75,000', offshore: '$17,000 – $27,000' },
                            { role: '1 Web Developer', onshore: '$37,000 – $60,000', offshore: '$12,000 – $22,000' },
                            { role: '1 Mobile Developer', onshore: '$42,000 – $67,000', offshore: '$14,000 – $26,000' }
                          ].map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-slate-800/40 pb-1 text-slate-350">
                              <span className="font-semibold text-slate-400">{item.role}</span>
                              <span className="font-bold text-white">
                                {roadmapTeamType === 'onshore' ? item.onshore : item.offshore}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 7.5: PROJECTS REGISTRY & RATES MANAGER */}
          {activeTab === 'projects' && (
            <div className="flex-1 flex flex-col gap-6 min-h-0 text-left">
              {/* Top Summary Row */}
              {(() => {
                const activeProjects = projects.filter(p => p.status === 'Active');
                const cadBilled = activeProjects
                  .filter(p => p.currency === 'CAD')
                  .reduce((sum, p) => sum + (parseFloat(p.billing_rate) || 0) * 160, 0);
                const usdBilled = activeProjects
                  .filter(p => p.currency === 'USD')
                  .reduce((sum, p) => sum + (parseFloat(p.billing_rate) || 0) * 160, 0);

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
                    <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 flex flex-col gap-1 shadow-md shadow-black/10">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Active Projects</span>
                        <FolderKanban className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-black text-white mt-2">{activeProjects.length} Projects</div>
                      <div className="text-[10px] text-emerald-450 font-semibold flex items-center gap-1 mt-1">
                        <span>🟢 Monitoring live assignments</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 flex flex-col gap-1 shadow-md shadow-black/10">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CAD Est. Monthly Revenue</span>
                        <DollarSign className="w-5 h-5 text-emerald-450" />
                      </div>
                      <div className="text-2xl font-black text-white mt-2">C$ {cadBilled.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Based on 160 standard hrs/rep</div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 flex flex-col gap-1 shadow-md shadow-black/10">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">USD Est. Monthly Revenue</span>
                        <DollarSign className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-2xl font-black text-white mt-2">US$ {usdBilled.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Based on 160 standard hrs/rep</div>
                    </div>
                  </div>
                );
              })()}

              {/* Main Workspace Layout */}
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 min-h-0">
                {/* Left Column: Projects Registry Table (Span 2) */}
                <div className="xl:col-span-2 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col min-h-0">
                  <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-950/20">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-cyan-400" />
                        <span>Active Projects Registry</span>
                      </h3>
                      <span className="text-[10px] text-slate-500 font-medium">Registry of representatives actively working at supplier locations</span>
                    </div>
                    {/* Currency filter toggle */}
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 text-[10px]">
                      <button 
                        onClick={() => setSelectedCurrencyFilter('all')}
                        className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                          selectedCurrencyFilter === 'all' ? 'bg-[#1E3A5F] text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ALL
                      </button>
                      <button 
                        onClick={() => setSelectedCurrencyFilter('USD')}
                        className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                          selectedCurrencyFilter === 'USD' ? 'bg-[#1E3A5F] text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        USD
                      </button>
                      <button 
                        onClick={() => setSelectedCurrencyFilter('CAD')}
                        className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                          selectedCurrencyFilter === 'CAD' ? 'bg-[#1E3A5F] text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        CAD
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950/50 sticky top-0 z-10 border-b border-slate-850">
                        <tr className="font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3.5 px-6">Client/Supplier</th>
                          <th className="py-3.5 px-6">Project #</th>
                          <th className="py-3.5 px-6">Description</th>
                          <th className="py-3.5 px-6">Location</th>
                          <th className="py-3.5 px-6">Representative</th>
                          <th className="py-3.5 px-6">Start Date</th>
                          <th className="py-3.5 px-6 text-right">Billing Rate</th>
                          <th className="py-3.5 px-6 text-right">Pay Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40 text-slate-300">
                        {(() => {
                          const filtered = projects.filter(p => {
                            if (selectedCurrencyFilter !== 'all' && p.currency !== selectedCurrencyFilter) return false;
                            return true;
                          });
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan="8" className="py-8 text-center text-slate-500 italic">No projects found matching the criteria.</td>
                              </tr>
                            );
                          }
                          return filtered.map(p => {
                            const clientName = suppliers.find(s => s.id === p.client_id)?.name || p.client_id;
                            const plantName = plants.find(pl => pl.id === p.plant_id)?.name || p.plant_id;
                            const repName = users.find(u => u.id === p.rep_id)?.name || p.rep_id;
                            return (
                              <tr key={p.id} className="hover:bg-slate-950/40 transition-colors">
                                <td className="py-3 px-6 font-semibold text-white capitalize">{clientName}</td>
                                <td className="py-3 px-6 font-mono text-[#22D3EE] font-bold">{p.project_number}</td>
                                <td className="py-3 px-6 text-slate-400">{p.description}</td>
                                <td className="py-3 px-6 text-slate-300">{plantName}</td>
                                <td className="py-3 px-6 font-medium text-slate-200">{repName}</td>
                                <td className="py-3 px-6 text-slate-400">{p.start_date}</td>
                                <td className="py-3 px-6 text-right font-bold text-emerald-400">{p.currency === 'CAD' ? 'C$' : 'US$'} {parseFloat(p.billing_rate).toFixed(2)}/hr</td>
                                <td className="py-3 px-6 text-right text-slate-400">{p.currency === 'CAD' ? 'C$' : 'US$'} {parseFloat(p.pay_rate).toFixed(2)}/hr</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Create / Edit Project Form Panel (Span 1) */}
                <div className="xl:col-span-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col min-h-0">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 pb-2 border-b border-slate-850">
                    Register New Project
                  </h3>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newProjRep || !newProjClient || !newProjPlant || !newProjBilling || !newProjPay) {
                        alert("Please fill in all required fields.");
                        return;
                      }
                      const repDetails = users.find(u => u.id === newProjRep);
                      const newProjectItem = {
                        project_number: `PRJ-${newProjClient.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
                        client_id: newProjClient,
                        description: `Rep ${repDetails ? repDetails.name.split(' ')[1] || repDetails.name : 'Staff'} ${newProjDesc || 'Inspection'}`,
                        plant_id: newProjPlant,
                        rep_id: newProjRep,
                        start_date: newProjStartDate || new Date().toISOString().split('T')[0],
                        currency: newProjCurrency,
                        billing_rate: parseFloat(newProjBilling),
                        pay_rate: parseFloat(newProjPay),
                        status: 'Active'
                      };
                      addProject(newProjectItem);
                      logSystemEvent('system', 'create_project', `Registered new project ${newProjectItem.project_number} for client ${newProjClient} at location ${newProjPlant}.`);
                      alert("Project registered successfully!");
                      // Reset fields
                      setNewProjDesc('');
                      setNewProjBilling('');
                      setNewProjPay('');
                      window.dispatchEvent(new Event('ids_pulse_db_update'));
                    }}
                    className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1 scrollbar-thin"
                  >
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assign Representative</label>
                      <select 
                        value={newProjRep} 
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowQuickAddRep(true);
                          } else {
                            setNewProjRep(e.target.value);
                          }
                        }}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="">Select Rep...</option>
                        {users.filter(u => u.role === 'rep' || u.role === 'qre' || u.id === '1' || u.id === 'rep_hugo' || u.id === 'rep_nabil' || u.id === 'rep_rogelio').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                        <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Rep...</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client / Supplier</label>
                      <select 
                        value={newProjClient} 
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowQuickAddClient(true);
                          } else {
                            setNewProjClient(e.target.value);
                          }
                        }}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="">Select Client...</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                        <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Client...</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Plant Location</label>
                      <select 
                        value={newProjPlant} 
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowQuickAddPlant(true);
                          } else {
                            setNewProjPlant(e.target.value);
                          }
                        }}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      >
                        <option value="">Select Plant...</option>
                        {plants.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                        <option value="ADD_NEW" className="text-cyan-400 font-bold">+ Add New Plant...</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description / Scope</label>
                      <input 
                        type="text" 
                        value={newProjDesc} 
                        onChange={(e) => setNewProjDesc(e.target.value)}
                        placeholder="e.g. Line Quality Audit" 
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</label>
                      <input 
                        type="date" 
                        value={newProjStartDate} 
                        onChange={(e) => setNewProjStartDate(e.target.value)}
                        className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billing Rate / Hr</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-slate-500 text-[10px] font-mono">$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={newProjBilling} 
                            onChange={(e) => setNewProjBilling(e.target.value)}
                            placeholder="0.00" 
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pay Rate / Hr</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-slate-500 text-[10px] font-mono">$</span>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={newProjPay} 
                            onChange={(e) => setNewProjPay(e.target.value)}
                            placeholder="0.00" 
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-1 text-left">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Billing Currency</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input 
                            type="radio" 
                            name="newProjCurrency" 
                            checked={newProjCurrency === 'USD'}
                            onChange={() => setNewProjCurrency('USD')}
                            className="text-[#22D3EE] focus:ring-[#22D3EE] bg-slate-950 border-slate-850"
                          />
                          USD (US$)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input 
                            type="radio" 
                            name="newProjCurrency" 
                            checked={newProjCurrency === 'CAD'}
                            onChange={() => setNewProjCurrency('CAD')}
                            className="text-[#22D3EE] focus:ring-[#22D3EE] bg-slate-950 border-slate-850"
                          />
                          CAD (C$)
                        </label>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="mt-4 w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-[#22D3EE] border border-cyan-500/20 font-bold py-2.5 rounded-xl text-xs cursor-pointer flex justify-center items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Register Project Assignment</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SYSTEM EVENTS LOGS */}
          {activeTab === 'system-logs' && userRole === 'shahroz' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-450" />
                    <span>Real-time System Events Logger</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-medium">Audit logs of all database transactions, client authentication, and phone simulator background events</span>
                </div>
                <button 
                  onClick={() => {
                    localStorage.setItem('ids_pulse_db', JSON.stringify({
                      ...JSON.parse(localStorage.getItem('ids_pulse_db') || '{}'),
                      systemLogs: [{ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), category: 'system', action: 'clear', details: 'System logs manually cleared by admin.' }]
                    }));
                    window.dispatchEvent(new Event('ids_pulse_db_update'));
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold py-1.5 px-3 rounded-lg text-xs cursor-pointer"
                >
                  Clear Log Console
                </button>
              </div>

              <div className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl p-4 flex flex-col gap-3 min-h-0">
                <div className="flex gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800 text-[10px] items-center justify-between">
                  <span className="text-slate-400 font-semibold">Live stream enabled • Console buffered to LocalStorage</span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">Receiving Stream</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin font-mono text-[10.5px] p-3 bg-black/60 rounded-xl border border-slate-900 flex flex-col gap-1.5">
                  {(() => {
                    const logs = getEntities('systemLogs') || [];
                    if (logs.length === 0) {
                      return <div className="text-slate-650 italic text-center py-10">Console buffer empty. Perform operations on the phone simulator or dashboard to see logs stream.</div>;
                    }
                    return logs.slice().reverse().map(l => {
                      let badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                      if (l.category === 'auth') badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                      if (l.category === 'shift') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                      if (l.category === 'incident') badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                      if (l.category === 'rework') badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
                      if (l.category === 'system') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                      if (l.category === 'payroll') badgeColor = 'bg-emerald-500/10 text-[#22D3EE] border-emerald-500/20';
                      return (
                        <div key={l.id} className="pb-1.5 border-b border-slate-900/30 flex items-start gap-3">
                          <span className="text-slate-550 flex-shrink-0">[{new Date(l.timestamp).toLocaleTimeString()}]</span>
                          <span className={`px-1.5 py-0.5 rounded border text-[8px] font-extrabold uppercase tracking-wider ${badgeColor}`}>{l.category}</span>
                          <span className="text-slate-400"><strong className="text-white">{l.action.toUpperCase()}</strong>: {l.details}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* OVERLAY PANEL 1: INCIDENT DETAIL DRAWER */}
      {selectedIncident && (
        <div 
          className="absolute inset-y-0 right-0 w-[420px] bg-slate-950 border-l border-slate-800 shadow-2xl p-5 flex flex-col z-40 animate-in slide-in-from-right duration-250"
          onClick={() => setOpenTooltip(null)}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4 flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-white">Incident Details</h3>
              <span className="text-[10px] text-slate-500 font-mono">{selectedIncident.id}</span>
            </div>
            <button 
              onClick={() => setSelectedIncident(null)} 
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scrollable Middle Body */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 min-h-0">
            
            {/* Photo Gallery with annotations */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">visual audit proofs</span>
              <div className="grid grid-cols-3 gap-2">
                {selectedIncident.photos.map(p => (
                  <div key={p.id} className="aspect-square bg-slate-900 border border-slate-800 rounded-lg overflow-hidden relative group">
                    <img src={p.url} className="w-full h-full object-cover" alt="Audit" />
                    <span className="absolute bottom-1 right-1 bg-slate-950/85 text-[8px] px-1 py-0.5 rounded text-[#22D3EE] font-bold">{p.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Defective Parts List */}
            {selectedIncident.parts_list && selectedIncident.parts_list.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Affected Defective Parts ({selectedIncident.parts_list.length})</span>
                <div className="flex flex-col gap-2">
                  {selectedIncident.parts_list.map((item) => (
                    <div key={item.id || item.part_number} className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
                      <div className="min-w-0">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>PN {item.part_number}</span>
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.2 rounded-md font-medium">{item.bin}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">{item.description}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">qty</span>
                        <span className="text-white font-extrabold text-sm">{item.qty} pcs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Defect description summary */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 text-xs text-slate-300">
              <p className="font-semibold text-slate-500">Defect Narrative:</p>
              <p className="mt-1 leading-relaxed">{selectedIncident.description}</p>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800/80 pt-2 text-slate-400">
                <div><span className="font-bold">Rep Logged:</span> <span className="text-[#22D3EE] font-extrabold">{users.find(u => u.id === selectedIncident.rep_id)?.name || 'Clarence Kuiken'}</span></div>
                <div><span className="font-bold">Part Affected:</span> <span className="text-white font-semibold">{selectedIncident.parts_list && selectedIncident.parts_list.length > 0 ? selectedIncident.parts_list[0].part_number : selectedIncident.part_id}</span></div>
                <div><span className="font-bold">Area Found:</span> <span className="text-white font-semibold">{selectedIncident.area}</span></div>
                <div><span className="font-bold">Action Taken:</span> <span className="text-white font-semibold">{selectedIncident.action_taken}</span></div>
                <div className="col-span-2"><span className="font-bold">Supplier Contact:</span> <span className="text-[#22D3EE] font-semibold">{selectedIncident.supplier_contact}</span></div>
              </div>
            </div>

            {/* Defect Location Heatmap Placement Coordinates */}
            {selectedIncident.defect_location_x !== undefined && selectedIncident.defect_location_x !== null && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Defect Matrix Coordinates</span>
                <div className="relative bg-slate-950 rounded-lg p-2 border border-slate-850 flex items-center justify-center h-28 overflow-hidden">
                  <svg viewBox="0 0 100 100" className="w-full h-full max-h-24 object-contain">
                    {(() => {
                      const partNo = selectedIncident.parts_list && selectedIncident.parts_list.length > 0 ? selectedIncident.parts_list[0].part_number : selectedIncident.part_id;
                      if (partNo === '86291945' || partNo === '86201945') {
                        return (
                          <g>
                            <path d="M10,50 C10,25 40,20 90,40 C90,40 70,75 30,70 C15,68 10,60 10,50 Z" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                            <circle cx="45" cy="48" r="14" fill="#0EA5E9" opacity="0.1" stroke="#38BDF8" strokeWidth="0.5" />
                            <circle cx="75" cy="42" r="8" fill="#0EA5E9" opacity="0.1" stroke="#38BDF8" strokeWidth="0.5" />
                          </g>
                        );
                      } else {
                        return (
                          <g>
                            <rect x="5" y="25" width="90" height="50" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                            <rect x="10" y="30" width="35" height="40" rx="4" fill="#991B1B" opacity="0.1" stroke="#DC2626" strokeWidth="0.5" />
                            <rect x="55" y="30" width="35" height="40" rx="4" fill="#991B1B" opacity="0.1" stroke="#DC2626" strokeWidth="0.5" />
                          </g>
                        );
                      }
                    })()}
                    
                    <circle 
                      cx={selectedIncident.defect_location_x * 100} 
                      cy={selectedIncident.defect_location_y * 100} 
                      r="4.5" 
                      fill="#EF4444" 
                      stroke="#FFFFFF" 
                      strokeWidth="0.8" 
                      className="animate-pulse"
                    />
                  </svg>
                  <div className="absolute bottom-1 right-2 bg-slate-950/80 text-[7px] text-[#22D3EE] font-mono px-1 py-0.5 rounded">
                    X: {selectedIncident.defect_location_x} | Y: {selectedIncident.defect_location_y}
                  </div>
                </div>
              </div>
            )}

            {/* Status Update & Severity controls */}
            <div className="flex flex-col gap-2 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">resolution tracking</span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Review Status:</span>
                <select 
                  value={selectedIncident.status}
                  onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                  className="h-8 bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/20 transition-all"
                >
                  <option value="Open">Open</option>
                  <option value="Acknowledged">Acknowledged</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Audit Pipeline Timeline */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">incident timeline</span>
              <div className="flex flex-col gap-3 pl-3 border-l-2 border-slate-800 text-[11px] text-slate-400">
                <div className="relative">
                  <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-[#0EA5E9]"></div>
                  <p className="font-bold text-slate-200">Incident Logged & Dispatched</p>
                  <p className="text-[10px] text-slate-500">{new Date(selectedIncident.created_at).toLocaleTimeString()}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                  <p className="font-bold text-slate-200">Transactional Email Delivered</p>
                  <p className="text-[10px] text-slate-500">Martin & Shahroz notified</p>
                </div>
                <div className="relative">
                  <div className={`absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full ${selectedIncident.status !== 'Open' ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                  <p className="font-bold text-slate-200">Acknowledged status check</p>
                  <p className="text-[10px] text-slate-500">Status marked: {selectedIncident.status}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Drawer Footer Buttons (Repositioned Export Panel at the bottom!) */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex-shrink-0 flex flex-col gap-3">
            
            {/* Export & Actions Box (Locked to bottom, tooltip triggers only on the ? circle) */}
            <div className="flex flex-col gap-2 bg-[#1E3A5F]/20 p-3 rounded-xl border border-[#22D3EE]/15" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] text-[#22D3EE] font-bold uppercase tracking-wider pl-0.5">Export & Share Audit</span>
              <div className="grid grid-cols-3 gap-2">
                
                {/* Download PDF */}
                <div className="relative">
                  <button 
                    onClick={() => handleDownloadReport(selectedIncident)}
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white py-2 rounded-lg text-[9px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Download PDF
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 group flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTooltip(openTooltip === 'download' ? null : 'download');
                      }}
                      className="w-3.5 h-3.5 bg-slate-800 hover:bg-slate-700 text-[8px] text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                    >
                      ?
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded-lg shadow-xl transition-all duration-200 z-50 leading-normal pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 ${
                      openTooltip === 'download' 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-1'
                    }`}>
                      Generates and downloads a formatted PDF document containing full audit details and narrative.
                    </div>
                  </div>
                </div>

                {/* Print */}
                <div className="relative">
                  <button 
                    onClick={() => handlePrintReport(selectedIncident)}
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white py-2 rounded-lg text-[9px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Print
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 group flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTooltip(openTooltip === 'print' ? null : 'print');
                      }}
                      className="w-3.5 h-3.5 bg-slate-800 hover:bg-slate-700 text-[8px] text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                    >
                      ?
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded-lg shadow-xl transition-all duration-200 z-50 leading-normal pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 ${
                      openTooltip === 'print' 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-1'
                    }`}>
                      Opens print preview to print or save a PDF copy of this audit.
                    </div>
                  </div>
                </div>

                {/* Resend Email */}
                <div className="relative">
                  <button 
                    onClick={() => handleResendSupplierEmail(selectedIncident)}
                    className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-[#22D3EE] border border-[#22D3EE]/25 py-2 rounded-lg text-[9px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Resend Email
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 group flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTooltip(openTooltip === 'resend' ? null : 'resend');
                      }}
                      className="w-3.5 h-3.5 bg-slate-800 hover:bg-slate-700 text-[8px] text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                    >
                      ?
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded-lg shadow-xl transition-all duration-200 z-50 leading-normal pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 ${
                      openTooltip === 'resend' 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-1'
                    }`}>
                      Resends transactional report email to the supplier QM team.
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <button 
              onClick={() => setSelectedIncident(null)}
              className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-bold py-2.5 rounded-xl text-xs hover:text-white transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* OVERLAY PANEL 2: EMAIL LOG INSPECTOR */}
      {selectedEmailLog && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[600px] text-left">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Email Transaction Inspector</h3>
                <span className="text-[10px] text-slate-500 font-mono">Log ID: {selectedEmailLog.id}</span>
              </div>
              <button onClick={() => setSelectedEmailLog(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 bg-slate-950/50 border-b border-slate-850 flex flex-col gap-1.5 text-xs text-slate-300 font-mono">
              <div><span className="text-[#22D3EE] font-bold">To:</span> {selectedEmailLog.to_emails}</div>
              <div><span className="text-[#22D3EE] font-bold">CC:</span> {selectedEmailLog.cc_emails}</div>
              <div><span className="text-[#22D3EE] font-bold">Subject:</span> {selectedEmailLog.subject}</div>
              <div><span className="text-slate-500 font-bold">Sent Stamp:</span> {new Date(selectedEmailLog.sent_at).toLocaleString()}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/40 text-xs">
              <div 
                className="prose prose-invert max-w-none bg-slate-950 p-5 rounded-2xl border border-slate-850 text-slate-300 font-sans"
                dangerouslySetInnerHTML={{ __html: selectedEmailLog.body }}
              />
            </div>
            <div className="bg-slate-950 px-5 py-3 border-t border-slate-850 flex justify-end">
              <button onClick={() => setSelectedEmailLog(null)} className="bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl">Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY PANEL 3: DAILY SHIFT WALKTHROUGH DETAILS (Donna's Review Panel) */}
      {selectedShiftReport && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[700px] text-left">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Shift Summary Walkthrough Details</h3>
                <span className="text-[10px] text-slate-500 font-mono">Report Date: {selectedShiftReport.date}</span>
              </div>
              <button onClick={() => setSelectedShiftReport(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 bg-slate-950/50 border-b border-slate-850 flex flex-col gap-1 text-xs text-slate-300">
              <div>Rep: <span className="font-bold text-white">{users.find(u => u.id === selectedShiftReport.rep_id)?.name}</span></div>
              <div>Plant Location: <span className="font-bold text-white">GM Oshawa Plant</span></div>
              <div>Time Compiled: <span className="font-mono text-[10px] text-slate-400">{new Date(selectedShiftReport.sent_at || selectedShiftReport.created_at || new Date()).toLocaleString()}</span></div>
            </div>

            {/* Displaying checked areas in detail cards */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-slate-900/40">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Walked Area Audits</span>
              <div className="grid grid-cols-2 gap-3">
                {selectedShiftReport.areas_walked.map((area, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">{area.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                        area.status === 'issues' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {area.status === 'issues' ? 'Defects Found' : 'No Issues'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {area.notes || 'Rep walked area and confirmed no active part issues.'}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bonus tasks details */}
              {selectedShiftReport.bonus_tasks && selectedShiftReport.bonus_tasks.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-slate-850">
                  <span className="text-[10px] text-[#22D3EE] font-bold uppercase tracking-wider">Requested Sorts & Audits</span>
                  {selectedShiftReport.bonus_tasks.map((task, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{task.task}</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">{task.notes || 'Audit check completed.'}</p>
                      </div>
                      <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
                        Completed
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export & Actions Box for Shift Walkthrough */}
            <div className="mx-5 my-3 flex flex-col gap-2 bg-[#1E3A5F]/20 p-3 rounded-xl border border-[#22D3EE]/15 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] text-[#22D3EE] font-bold uppercase tracking-wider pl-0.5">Export & Share Walkthrough Summary</span>
              <div className="grid grid-cols-2 gap-2">
                {/* Download PDF */}
                <div className="relative">
                  <button 
                    onClick={() => handleDownloadShiftReport(selectedShiftReport)}
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white py-2 rounded-lg text-[9px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Download PDF
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 group flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTooltip(openTooltip === 'shift-pdf' ? null : 'shift-pdf');
                      }}
                      className="w-3.5 h-3.5 bg-slate-800 hover:bg-slate-700 text-[8px] text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                    >
                      ?
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded-lg shadow-xl transition-all duration-200 z-50 leading-normal pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 ${
                      openTooltip === 'shift-pdf' 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-1'
                    }`}>
                      Generates and downloads a formatted PDF document containing walked area logs and task audits.
                    </div>
                  </div>
                </div>

                {/* Print */}
                <div className="relative">
                  <button 
                    onClick={() => handlePrintShiftReport(selectedShiftReport)}
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white py-2 rounded-lg text-[9px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Print Report
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 group flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTooltip(openTooltip === 'shift-print' ? null : 'shift-print');
                      }}
                      className="w-3.5 h-3.5 bg-slate-800 hover:bg-slate-700 text-[8px] text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                    >
                      ?
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded-lg shadow-xl transition-all duration-200 z-50 leading-normal pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 ${
                      openTooltip === 'shift-print' 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-1'
                    }`}>
                      Opens print preview to print or save a PDF copy of this shift walkthrough.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 px-5 py-3 border-t border-slate-850 flex justify-end">
              <button onClick={() => setSelectedShiftReport(null)} className="bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl">Close Walkthrough</button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY PANEL 3.5: DEFECT REWORK LOG DETAILS (Rework Inspector Modal) */}
      {selectedReworkLog && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[600px] text-left">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Defect Rework Log Details</h3>
                <span className="text-[10px] text-slate-500 font-mono">Log ID: {selectedReworkLog.id}</span>
              </div>
              <button onClick={() => setSelectedReworkLog(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto bg-slate-900/40 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Field Representative</span>
                  <span className="text-xs font-bold text-white mt-1 block">
                    {users.find(u => u.id === selectedReworkLog.rep_id)?.name || 'Clarence Kuiken'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Date Logged</span>
                  <span className="text-xs font-bold text-white mt-1 block">
                    {new Date(selectedReworkLog.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Part Affected</span>
                  <span className="text-xs font-extrabold text-[#22D3EE] mt-1 block">
                    PN {selectedReworkLog.part_id}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Supplier Partner</span>
                  <span className="text-xs font-extrabold text-[#22D3EE] mt-1 block uppercase">
                    {selectedReworkLog.supplier_id}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 bg-emerald-500/5 border-emerald-500/10">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Pieces Reworked</span>
                  <span className="text-sm font-extrabold text-emerald-400 mt-1 block">
                    {selectedReworkLog.qty} pcs
                  </span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 bg-sky-500/5 border-sky-500/10">
                  <span className="text-[9px] text-sky-400 font-bold uppercase tracking-wider block">Labor Hours Spent</span>
                  <span className="text-sm font-extrabold text-sky-400 mt-1 block">
                    {Math.round(selectedReworkLog.time_spent_minutes / 60 * 10) / 10} hrs
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Remarks & Narrative</span>
                <p className="text-xs text-slate-355 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedReworkLog.notes || 'No comments recorded for this rework event.'}
                </p>
              </div>
            </div>

            {/* Export & Actions Box for Rework Entry */}
            <div className="mx-5 my-2 flex flex-col gap-2 bg-[#1E3A5F]/20 p-3 rounded-xl border border-[#22D3EE]/15 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] text-[#22D3EE] font-bold uppercase tracking-wider pl-0.5">Export & Share Rework Record</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <button 
                    onClick={() => handleDownloadReworkReport(selectedReworkLog)}
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white py-2 rounded-lg text-[9px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Download PDF
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 group flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTooltip(openTooltip === 'rework-pdf' ? null : 'rework-pdf');
                      }}
                      className="w-3.5 h-3.5 bg-slate-800 hover:bg-slate-700 text-[8px] text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                    >
                      ?
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded-lg shadow-xl transition-all duration-200 z-50 leading-normal pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 ${
                      openTooltip === 'rework-pdf' 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-1'
                    }`}>
                      Downloads a formatted PDF document containing full rework audit details and narrative.
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => handlePrintReworkReport(selectedReworkLog)}
                    className="w-full bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white py-2 rounded-lg text-[9px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Print Report
                  </button>
                  <div className="absolute -top-1.5 -right-1.5 group flex items-center justify-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTooltip(openTooltip === 'rework-print' ? null : 'rework-print');
                      }}
                      className="w-3.5 h-3.5 bg-slate-800 hover:bg-slate-700 text-[8px] text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                    >
                      ?
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2 bg-slate-950 border border-slate-800 text-[9px] text-slate-300 rounded-lg shadow-xl transition-all duration-200 z-50 leading-normal pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 ${
                      openTooltip === 'rework-print' 
                        ? 'opacity-100 scale-100 translate-y-0' 
                        : 'opacity-0 scale-95 translate-y-1'
                    }`}>
                      Opens print preview to print or save a PDF copy of this rework log.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 px-5 py-3 border-t border-slate-850 flex justify-end">
              <button onClick={() => setSelectedReworkLog(null)} className="bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs py-2 px-4 rounded-xl">Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ASSIGN REP DISPATCH MODAL ( Donna requested for daily assignment ) */}
      {showAssignRepModal && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleAssignRepSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-left">
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Assign Rep Dispatch</h3>
              <button type="button" onClick={() => setShowAssignRepModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase pl-0.5">Select Field Representative</label>
                <select 
                  value={assignRepName}
                  onChange={(e) => setAssignRepName(e.target.value)}
                  className="h-10 w-full bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/20 transition-all"
                >
                  <option value="Clarence Kuiken">Clarence Kuiken</option>
                  <option value="Donna Cabral">Donna Cabral (Lead)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase pl-0.5">Assign Plant Location</label>
                <select 
                  value={assignPlant}
                  onChange={(e) => setAssignPlant(e.target.value)}
                  className="h-10 w-full bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-xl px-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]/20 transition-all"
                >
                  <option value="gm_oshawa">GM Oshawa Plant</option>
                  <option value="magna_autosystems">Magna AutoSystems Belleville</option>
                  <option value="hutchinson">Hutchinson Mississauga</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950 px-5 py-3 border-t border-slate-850 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowAssignRepModal(false)} 
                className="h-10 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="h-10 px-4 bg-[#0EA5E9] hover:bg-[#0284c7] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#0EA5E9]/10"
              >
                Assign Dispatch
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECEIPT LIGHTBOX MODAL */}
      {selectedReceiptPhoto && (
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in duration-200" 
          onClick={() => setSelectedReceiptPhoto(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-left relative" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Receipt Verification Lightbox</span>
                </h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Scanned attachment verification for reimbursement approval</p>
              </div>
              <button 
                onClick={() => setSelectedReceiptPhoto(null)} 
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Image Body */}
            <div className="p-6 flex items-center justify-center bg-slate-950/40 border-b border-slate-850">
              <div className="max-h-[60vh] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900 flex items-center justify-center">
                <img 
                  src={selectedReceiptPhoto} 
                  alt="Receipt Scan Preview" 
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3.5 bg-slate-950/80 flex justify-between items-center gap-2">
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">IDS Pulse AI Verified</span>
              <button 
                type="button" 
                onClick={() => setSelectedReceiptPhoto(null)}
                className="h-9 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Viewport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. VISUAL CALENDAR PICKER MODAL */}
      {showCalendarModal && (
        <div 
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-in fade-in duration-200" 
          onClick={() => setShowCalendarModal(false)}
        >
          <div 
            className="calendar-modal-container bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col text-left" 
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="calendar-modal-header bg-slate-950 px-5 py-4 border-b border-slate-850 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Select Calendar Date</h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Filter CRM logs to a specific day</p>
              </div>
              <button 
                onClick={() => setShowCalendarModal(false)} 
                className="text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close calendar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Controls (Month Selector) */}
            <div className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-850 calendar-controls-strip">
                <button 
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white cursor-pointer font-bold text-xs"
                  aria-label="Previous month"
                >
                  &larr;
                </button>
                <span className="text-xs font-extrabold text-white uppercase tracking-wide calendar-month-year-label">
                  {monthNames[calendarMonthIndex]} {calendarYear}
                </span>
                <button 
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-white cursor-pointer font-bold text-xs"
                  aria-label="Next month"
                >
                  &rarr;
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Weekday Headers */}
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <span key={day} className="text-[9px] font-extrabold text-slate-500 uppercase py-1">{day}</span>
                ))}

                {/* Day cells grid */}
                {(() => {
                  const cells = [];
                  const startDayOffset = new Date(calendarYear, calendarMonthIndex, 1).getDay();
                  const totalDays = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();

                  // Render empty cells for start offset
                  for (let i = 0; i < startDayOffset; i++) {
                    cells.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                  }

                  // Render day buttons
                  for (let d = 1; d <= totalDays; d++) {
                    const dateStr = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr && !showAllDates;
                    const activity = getDateActivity(dateStr);
                    
                    cells.push(
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setShowAllDates(false);
                          setShowCalendarModal(false);
                        }}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 border text-[10px] font-bold relative transition-colors cursor-pointer calendar-day-btn ${
                          isSelected
                            ? 'bg-[#1E3A5F] border-[#22D3EE]/30 text-white font-extrabold shadow-md active-day'
                            : 'bg-slate-950 hover:bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200'
                        }`}
                        aria-label={`Select ${monthNames[calendarMonthIndex]} ${d}, ${calendarYear}`}
                      >
                        <span>{d}</span>
                        {/* Event Dot */}
                        {(activity.hasIncidents || activity.hasShifts || activity.hasRework) && (
                          <span className={`w-1 h-1 rounded-full ${
                            activity.hasIncidents ? 'bg-red-500' : activity.hasShifts ? 'bg-emerald-500' : 'bg-sky-500'
                          }`}></span>
                        )}
                      </button>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>

            {/* Quick Demo Date Presets & Cancel Action */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex flex-col gap-2 calendar-modal-footer">
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block">Demo Quick Pick:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('2026-05-28');
                    setShowAllDates(false);
                    setShowCalendarModal(false);
                  }}
                  className="h-8 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-[#22D3EE] hover:text-[#22D3EE] font-bold text-[9px] rounded-xl flex-1 cursor-pointer text-center transition-colors"
                >
                  May 28 (Incident Demo)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('2026-06-01');
                    setShowAllDates(false);
                    setShowCalendarModal(false);
                  }}
                  className="h-8 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-350 hover:text-white font-bold text-[9px] rounded-xl flex-1 cursor-pointer text-center transition-colors"
                >
                  June 1 (Today's Logs)
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="w-full h-8 mt-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] rounded-xl cursor-pointer text-center transition-colors"
              >
                Cancel / Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. INTERACTIVE USER GUIDE SLIDE-OUT DRAWER */}
      {showHelpDrawer && (
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs flex justify-end z-50 animate-in fade-in duration-200" onClick={() => setShowHelpDrawer(false)}>
          <div 
            className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full shadow-2xl p-5 flex flex-col overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4 flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Web Portal Guide</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Simple guidance for non-tech users</p>
              </div>
              <button onClick={() => setShowHelpDrawer(false)} className="text-slate-400 hover:text-white p-1 hover:bg-slate-855 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable middle text */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs text-slate-350 leading-relaxed min-h-0">
              
              <div className="bg-[#1E3A5F]/20 p-3.5 rounded-2xl border border-[#22D3EE]/15">
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wide mb-1 text-[#22D3EE]">📅 Using the Calendar</h4>
                <p className="text-[10px]">
                  Click on any day in the top date bar to filter the entire screen to that date. Days with activity show tiny colored dots:
                </p>
                <div className="mt-2 flex flex-col gap-1.5 text-[9px] text-slate-300">
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> <span>Red: Incident defects logged by reps</span></div>
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> <span>Green: Shift checklists walked by reps</span></div>
                  <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span> <span>Blue: Supplier parts rework logged</span></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-slate-850 pb-1">Tab-by-Tab Walkthrough</h4>
                
                <div>
                  <h5 className="font-bold text-white text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]"></span>
                    <span>1. Incident Defects Feed</span>
                  </h5>
                  <p className="text-[10px] mt-0.5 text-slate-400 pl-3">
                    Shows suspect materials logged by reps. Red Alert means outstanding. Clicking <strong>Inspect</strong> lets you download a PDF report or open a print-ready window to email Magna.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-white text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]"></span>
                    <span>2. Daily Tasks Planner</span>
                  </h5>
                  <p className="text-[10px] mt-0.5 text-slate-450 pl-3">
                    Check off daily tasks or dispatch them instantly to Clarence's phone. Tap any of the quick-action preset buttons at the bottom to dispatch a task in 1-click.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-white text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>3. Shift Summaries Log</span>
                  </h5>
                  <p className="text-[10px] mt-0.5 text-slate-400 pl-3">
                    Donna can review rep checklist logs card-by-card. Confirms walked assembly lines and operator touch points.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-white text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    <span>4. Timesheets & Mileage</span>
                  </h5>
                  <p className="text-[10px] mt-0.5 text-slate-400 pl-3">
                    Colleen's accountant portal. Calculates rep hours ($28/hr billing) and mileage reimbursement ($0.73/km) automatically. Click <strong>Export QuickBooks</strong> to generate a payroll importing spreadsheet.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-850 flex-shrink-0">
              <button 
                type="button"
                onClick={() => setShowHelpDrawer(false)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-350 hover:text-white font-bold py-2.5 rounded-xl text-xs text-center cursor-pointer transition-colors"
              >
                Close User Guide
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification Corner Stack */}
      <div className="absolute top-20 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className="pointer-events-auto bg-slate-900/95 border-2 border-slate-800 rounded-2xl p-4 shadow-2xl flex gap-3 items-start animate-in slide-in-from-right duration-300 relative overflow-hidden"
            style={{ borderColor: n.type === 'defect' ? '#ef4444' : (n.type === 'rework' || n.type === 'expense') ? '#10b981' : '#0ea5e9' }}
          >
            {/* Ambient indicator accent line on the side */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-1.5" 
              style={{ backgroundColor: n.type === 'defect' ? '#ef4444' : (n.type === 'rework' || n.type === 'expense') ? '#10b981' : '#0ea5e9' }}
            />
            <div className="flex-1 pl-1 text-left">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                {n.type === 'defect' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                {n.type === 'rework' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {n.type === 'shift' && <Activity className="w-3.5 h-3.5 text-cyan-400" />}
                {n.type === 'expense' && <DollarSign className="w-3.5 h-3.5 text-emerald-400" />}
                {n.title}
              </h4>
              <p className="text-[10px] text-slate-350 leading-relaxed mt-1 font-medium">{n.message}</p>
            </div>
            <button 
              onClick={() => setNotifications(prev => prev.filter(item => item.id !== n.id))}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold p-0.5 cursor-pointer focus:outline-none"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* QUICK ADD REPRESENTATIVE MODAL */}
      {showQuickAddRep && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 text-left shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-purple-400" /> Quick Add Representative
              </h4>
              <button onClick={() => setShowQuickAddRep(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <form onSubmit={handleQuickAddRepSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={quickRepName} 
                  onChange={(e) => setQuickRepName(e.target.value)} 
                  placeholder="e.g. Hugo Picon" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  value={quickRepEmail} 
                  onChange={(e) => setQuickRepEmail(e.target.value)} 
                  placeholder="e.g. hugo.p@integritydriven.com" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Phone Contact</label>
                <input 
                  type="text" 
                  value={quickRepPhone} 
                  onChange={(e) => setQuickRepPhone(e.target.value)} 
                  placeholder="e.g. +1 555-123-4567" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Payment Currency</label>
                <select 
                  value={quickRepPayCurrency} 
                  onChange={(e) => setQuickRepPayCurrency(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="CAD">CAD (C$)</option>
                  <option value="USD">USD (US$)</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowQuickAddRep(false)}
                  className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Rep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD CLIENT / SUPPLIER MODAL */}
      {showQuickAddClient && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 text-left shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-cyan-400" /> Quick Add Client / Supplier
              </h4>
              <button onClick={() => setShowQuickAddClient(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <form onSubmit={handleQuickAddClientSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Client Name</label>
                <input 
                  type="text" 
                  value={quickClientName} 
                  onChange={(e) => setQuickClientName(e.target.value)} 
                  placeholder="e.g. Brose Automotive" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Invoice Schedule</label>
                <select 
                  value={quickClientSchedule} 
                  onChange={(e) => setQuickClientSchedule(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowQuickAddClient(false)}
                  className="flex-1 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD PLANT / LOCATION MODAL */}
      {showQuickAddPlant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 text-left shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" /> Quick Add Plant Location
              </h4>
              <button onClick={() => setShowQuickAddPlant(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <form onSubmit={handleQuickAddPlantSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Plant Name</label>
                <input 
                  type="text" 
                  value={quickPlantName} 
                  onChange={(e) => setQuickPlantName(e.target.value)} 
                  placeholder="e.g. Magna Belleville" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Address / Details</label>
                <input 
                  type="text" 
                  value={quickPlantAddress} 
                  onChange={(e) => setQuickPlantAddress(e.target.value)} 
                  placeholder="e.g. 100 University Ave, Belleville, ON" 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Map to Client / Supplier</label>
                <select 
                  value={quickPlantSupplierId} 
                  onChange={(e) => setQuickPlantSupplierId(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Select Client...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowQuickAddPlant(false)}
                  className="flex-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Plant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
