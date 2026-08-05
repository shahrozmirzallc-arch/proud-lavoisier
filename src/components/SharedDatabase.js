import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_KEY = 'ids_pulse_db';
const DB_VERSION_KEY = 'ids_pulse_db_version';
const CURRENT_DB_VERSION = 'v3.3.0_gca_audit_reports';

const EMPTY_SCHEMA = {
  users: [],
  rates: [],
  plants: [],
  suppliers: [],
  parts: [],
  incidents: [],
  reworkLogs: [],
  timeEntries: [],
  expenseEntries: [],
  extraHoursRequests: [],
  systemLogs: [],
  projects: [],
  dailyTasks: [],
  shiftReports: [],
  assignments: [],
  payroll: [],
  repActivities: [],
  emailLogs: []
};

// Core Super-Admin Accounts required for 1-click authentication
const ESSENTIAL_ADMIN_USERS = [
  { id: '24', name: 'Donna Cabral', email: 'donna@goto-ids.com', username: 'donna', phone: '+1 (416) 555-0024', role: 'lead', title: 'Operations Lead Supervisor', pay_currency: 'CAD', avatar: 'DC' },
  { id: 'owner_1', name: 'Greg Phillippe', email: 'greg@goto-ids.com', username: 'greg', phone: '+1 (416) 555-0001', role: 'owner', title: 'Managing Director / Owner', pay_currency: 'CAD', avatar: 'GP' },
  { id: 'acct_1', name: 'Colleen Boyd', email: 'colleen@goto-ids.com', username: 'colleen', phone: '+1 (416) 555-0002', role: 'accountant', title: 'Financial Accountant / Controller', pay_currency: 'CAD', avatar: 'CB' },
  { id: 'admin_1', name: 'Shahroz Mirza', email: 'shahrozmirzallc@gmail.com', username: 'shahroz', password: 'Shahroz121$', phone: '+1 (416) 555-0000', role: 'super_admin', title: 'System Super Admin', pay_currency: 'CAD', avatar: 'SM' },
  { id: 'lead_diana', name: 'Diana Operations Lead', email: 'diana@goto-ids.com', username: 'diana', phone: '+1 (416) 555-0088', role: 'lead', title: 'Operations Lead Supervisor', pay_currency: 'CAD', avatar: 'DL' },
  { id: 'rep_clarence', name: 'Clarence Kuiken', email: 'clarence.k@goto-ids.com', username: 'clarence', phone: '+1 (416) 555-0099', role: 'rep', title: 'IDS Field Rep', pay_currency: 'CAD', avatar: 'CK' },
  { id: 'rep_test', name: 'Rep Test Inspector', email: 'rep_test@integritydriven.com', username: 'rep_test', password: 'password123', phone: '+1 (416) 555-0199', role: 'rep', title: 'IDS Field Rep', pay_currency: 'CAD', avatar: 'RT' }
];

const ESSENTIAL_SUPPLIERS = [];

// Initialize database in localStorage with automatic version cache invalidation
export function initializeDB() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return JSON.parse(JSON.stringify(EMPTY_SCHEMA));
  }

  const storedVersion = localStorage.getItem(DB_VERSION_KEY);
  if (storedVersion !== CURRENT_DB_VERSION) {
    console.log(`[IDS PULSE] Updating DB Schema version from ${storedVersion} to ${CURRENT_DB_VERSION}...`);
    localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
  }

  const existing = localStorage.getItem(STORAGE_KEY);
  let data;
  if (!existing) {
    data = JSON.parse(JSON.stringify(EMPTY_SCHEMA));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } else {
    try {
      data = JSON.parse(existing);
    } catch (e) {
      data = JSON.parse(JSON.stringify(EMPTY_SCHEMA));
    }
  }

  let updated = false;

  // Ensure collections exist as arrays
  const collections = Object.keys(EMPTY_SCHEMA);
  collections.forEach(col => {
    if (!data[col] || !Array.isArray(data[col])) {
      data[col] = [];
      updated = true;
    }
  });

  // Always preserve essential admin users so 1-click logins work
  if (!data.users || data.users.length === 0) {
    data.users = [...ESSENTIAL_ADMIN_USERS];
    updated = true;
  } else {
    // Ensure essential admins exist in users
    ESSENTIAL_ADMIN_USERS.forEach(adminUser => {
      if (!data.users.some(u => String(u.id) === String(adminUser.id) || u.email === adminUser.email)) {
        data.users.push(adminUser);
        updated = true;
      }
    });
  }

  // Seed Brand New Magna Powertrain International & Stellantis Master Datasets
  const brandNewSuppliers = [
    { id: 'sup_magna', name: 'Magna Powertrain International', code: 'MAGNA-PT', contact_person: 'Robert Sterling', contact_email: 'robert.sterling@magna.com', status: 'active', plants_served: ['plant_oakville'] },
    { id: 'sup_stellantis', name: 'Stellantis Powertrain Systems', code: 'STELLANTIS-PW', contact_person: 'Mark Vance', contact_email: 'mark.vance@stellantis.com', status: 'active', plants_served: ['plant_windsor'] },
    { id: 'sup_tesla', name: 'Tesla Giga Texas', code: 'TESLA-TX', contact_person: 'Elon Vance', contact_email: 'evance@tesla.com', status: 'active', plants_served: ['plant_spartanburg'] }
  ];
  const brandNewPlants = [
    { id: 'plant_oakville', name: 'Ford Oakville EV Complex', code: 'PLANT-OAK-90', location: 'Oakville, ON', supplier_id: 'sup_magna', supplier_ids: ['sup_magna'], status: 'active' },
    { id: 'plant_windsor', name: 'Windsor Assembly Plant', code: 'PLANT-202', location: 'Windsor, ON', supplier_id: 'sup_stellantis', supplier_ids: ['sup_stellantis'], status: 'active' }
  ];
  const brandNewProjects = [
    { id: 'proj_oakville_900', name: 'Ford F-150 Lightning E-Motor Stator Containment', code: 'PRJ-OAKVILLE-900', client_id: 'sup_magna', billing_customer_id: 'sup_magna', supplier_id: 'sup_magna', plant_id: 'plant_oakville', rep_id: 'rep_clarence', po_hours: 10.0, currency: 'CAD', status: 'active' },
    { id: 'proj_windsor_500', name: 'Stellantis Pacifica PHEV Battery Pack Isolation Project', code: 'PRJ-WINDSOR-500', client_id: 'sup_stellantis', billing_customer_id: 'sup_stellantis', supplier_id: 'sup_stellantis', plant_id: 'plant_windsor', rep_id: 'rep_test', po_hours: 8.0, currency: 'CAD', status: 'active' }
  ];
  const brandNewParts = [
    { id: 'part_7t4z7000', part_number: '7T4Z-7000-A', part_name: 'E-Motor Stator Core Assembly', project_id: 'proj_oakville_900', supplier_id: 'sup_magna', status: 'active' },
    { id: 'part_68493012', part_number: '68493012-AB', part_name: 'High Voltage Inter-Cell Busbar Connector', project_id: 'proj_windsor_500', supplier_id: 'sup_stellantis', status: 'active' },
    { id: 'part_86394644', part_number: '86394644', part_name: 'LH HD Up-Level Light Assembly', project_id: 'proj_oakville_900', supplier_id: 'sup_magna', status: 'active' }
  ];
  const brandNewAssignments = [
    { id: 'asgn_magna_clarence', organization_id: 'org_ids_pulse', project_id: 'proj_oakville_900', rep_id: 'rep_clarence', billing_customer_id: 'sup_magna', supplier_id: 'sup_magna', plant_id: 'plant_oakville', authorized_regular_hours: 10.0, status: 'active', effective_from: '2026-01-01T00:00:00Z' },
    { id: 'asgn_stellantis_clarence', organization_id: 'org_ids_pulse', project_id: 'proj_windsor_500', rep_id: 'rep_clarence', billing_customer_id: 'sup_stellantis', supplier_id: 'sup_stellantis', plant_id: 'plant_windsor', authorized_regular_hours: 8.0, status: 'active', effective_from: '2026-01-01T00:00:00Z' }
  ];
  const brandNewRateCards = [
    { id: 'rc_magna_clarence', assignment_id: 'asgn_magna_clarence', billing_rate: 110.00, billing_currency: 'CAD', currency: 'CAD', pay_rate: 52.00, pay_currency: 'CAD', effective_from: '2026-01-01T00:00:00Z' },
    { id: 'rc_stellantis_clarence', assignment_id: 'asgn_stellantis_clarence', billing_rate: 95.00, billing_currency: 'CAD', currency: 'CAD', pay_rate: 48.00, pay_currency: 'CAD', effective_from: '2026-01-01T00:00:00Z' }
  ];
  const brandNewContacts = [
    { id: 'c_magna_1', name: 'Robert Sterling', email: 'robert.sterling@magna.com', role: 'Primary Quality Director', organization_id: 'sup_magna', supplier_id: 'sup_magna', client_id: 'sup_magna', status: 'active' },
    { id: 'c_magna_2', name: 'Elena Rostova', email: 'elena.rostova@magna.com', role: 'Lead Engineering & Overtime Approver', organization_id: 'sup_magna', supplier_id: 'sup_magna', client_id: 'sup_magna', status: 'active' },
    { id: 'c_magna_3', name: 'Aaron Repar', email: 'aaron.repar@magna.com', role: 'Magna Part Handoff Receiver', organization_id: 'sup_magna', supplier_id: 'sup_magna', client_id: 'sup_magna', status: 'active' },
    { id: 'c_stellantis_1', name: 'Mark Vance', email: 'mark.vance@stellantis.com', role: 'Primary Quality Manager', organization_id: 'sup_stellantis', supplier_id: 'sup_stellantis', client_id: 'sup_stellantis', status: 'active' },
    { id: 'c_stellantis_2', name: 'Sandra Bullock', email: 'sandra.bullock@stellantis.com', role: 'Overtime Approver & Engineering Lead', organization_id: 'sup_stellantis', supplier_id: 'sup_stellantis', client_id: 'sup_stellantis', status: 'active' },
    { id: 'c_stellantis_3', name: 'David Miller', email: 'david.miller@stellantis.com', role: 'Plant Operations Supervisor', organization_id: 'sup_stellantis', supplier_id: 'sup_stellantis', client_id: 'sup_stellantis', status: 'active' },
    { id: 'c_tesla_1', name: 'Elon Vance', email: 'evance@tesla.com', role: 'Quality Director', organization_id: 'sup_tesla', supplier_id: 'sup_tesla', client_id: 'sup_tesla', status: 'active' }
  ];
  const brandNewCustomerUsers = [
    { id: 'user_cust_magna_robert', name: 'Robert Sterling (Primary Quality Director)', email: 'robert.sterling@magna.com', username: 'magna_client', password: 'password123', role: 'customer', supplier_id: 'sup_magna', customer_id: 'sup_magna', title: 'Magna Primary Quality Director' },
    { id: 'user_cust_stellantis_mark', name: 'Mark Vance (Primary Quality Mgr)', email: 'mark.vance@stellantis.com', username: 'stellantis_client', password: 'password123', role: 'customer', supplier_id: 'sup_stellantis', customer_id: 'sup_stellantis', title: 'Stellantis Primary Quality Manager' },
    { id: 'user_cust_tesla_elon', name: 'Elon Vance (Tesla Quality Director)', email: 'evance@tesla.com', username: 'tesla_elon', password: 'TeslaPassword2026!', role: 'customer', supplier_id: 'sup_tesla', customer_id: 'sup_tesla', client_id: 'sup_tesla', title: 'Tesla Quality Director' }
  ];

  const brandNewIncidents = [
    {
      id: 'INC-GCA-2026-001',
      title: '20 pt GCA call for LH HD up lvl light Pn 86394644',
      incident_category: '20 pt GCA Call',
      category: '20 pt GCA Call',
      part_id: '86394644',
      part_number: '86394644',
      parts_list: [
        { part_number: '86394644', description: 'LH HD Up-Level Light Assembly', qty: 1, bin: 'GCA-Audit-RedX' }
      ],
      rma_number: 'CK062026',
      supplier_id: 'sup_magna',
      client_id: 'sup_magna',
      customer_id: 'sup_magna',
      plant_id: 'plant_oakville',
      rep_id: 'rep_clarence',
      rep_name: 'Clarence Kuiken',
      date: '2026-06-20',
      created_at: '2026-06-20T15:39:22Z',
      status: 'Released',
      released_to_client: true,
      area: 'GM SAC / Red X Line (GCA Audit)',
      severity: 'Critical',
      action_taken: 'Issued RMA CK062026; handed suspect part to Aaron Repar for return to Magna facility. Conducted ABA swap test and water/bump test; Terry Jennings noted water in harness & flashover at pin 12 cavity.',
      description: '20 pt GCA Audit Call for LH HD up level light PN 86394644.\nPassed EOL and Care line, driven over bump track, delivered to GCA for audit where in-op failure was found by GCA Auditor Chad. Light lit up briefly and went out. Truck driven to Red X for thorough investigation instead of scrap table.\nABA swap test conducted with control light (bump track & water test passed). Suspect light re-installed (bump track & water test passed - unrepeatable in-plant failure).\nElectrical Engineer Terry Jennings identified water in harness cavity with flashover at Pin 12.\nRMA CK062026 issued by Clarence Kuiken to authorize part transport; suspect part handed to Aaron Repar for Magna engineering tear-down review.',
      contacts: [
        { name: 'Matt Dillon', email: 'Matt.Dillon@magna.com', role: 'Magna Quality' },
        { name: 'Aaron Repar', email: 'aaron.repar@magna.com', role: 'Magna Part Handoff Receiver' },
        { name: 'Terry Jennings', email: 'terry.jennings@gm.com', role: 'Electrical Engineer' },
        { name: 'Donna Cabral', email: 'donnacabral2@gmail.com', role: 'IDS Lead' },
        { name: 'Greg Phillippe', email: 'greg.phillippe@goto-ids.com', role: 'IDS Executive' }
      ]
    }
  ];

  brandNewSuppliers.forEach(s => {
    if (!data.suppliers.some(x => x.id === s.id)) { data.suppliers.push(s); updated = true; }
  });
  brandNewPlants.forEach(p => {
    if (!data.plants.some(x => x.id === p.id)) { data.plants.push(p); updated = true; }
  });
  brandNewProjects.forEach(p => {
    if (!data.projects.some(x => x.id === p.id)) { data.projects.push(p); updated = true; }
  });
  brandNewParts.forEach(p => {
    if (!data.parts.some(x => x.id === p.id)) { data.parts.push(p); updated = true; }
  });
  brandNewAssignments.forEach(a => {
    if (!data.assignments.some(x => x.id === a.id)) { data.assignments.push(a); updated = true; }
  });
  brandNewRateCards.forEach(rc => {
    if (!data.rates.some(x => x.id === rc.id || x.assignment_id === rc.assignment_id)) { data.rates.push(rc); updated = true; }
  });
  if (!data.contacts) data.contacts = [];
  brandNewContacts.forEach(c => {
    if (!data.contacts.some(x => x.id === c.id)) { data.contacts.push(c); updated = true; }
  });
  brandNewCustomerUsers.forEach(u => {
    if (!data.users.some(x => x.id === u.id || x.username === u.username)) { data.users.push(u); updated = true; }
  });
  if (!data.incidents) data.incidents = [];
  brandNewIncidents.forEach(inc => {
    if (!data.incidents.some(x => x.id === inc.id)) { data.incidents.push(inc); updated = true; }
  });

  // Ensure customer accounts exist for all suppliers so client portal logins work out of the box
  if (data.suppliers && Array.isArray(data.suppliers)) {
    data.suppliers.forEach(sup => {
      if (sup && sup.id) {
        const custUsername = sup.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (!data.users.some(u => u.role === 'customer' && (u.supplier_id === sup.id || u.username === custUsername))) {
          data.users.push({
            id: `user_cust_${sup.id}`,
            name: sup.contact_name || sup.contact_person || `${sup.name} Quality Manager`,
            email: sup.contact_email || `${custUsername}@client.com`,
            username: custUsername,
            password: 'password123',
            role: 'customer',
            supplier_id: sup.id,
            customer_id: sup.id,
            title: `${sup.name} Quality Partner`,
            created_at: new Date().toISOString()
          });
          updated = true;
        }
      }
    });
  }

  if (updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('ids_pulse_db_update'));
  }

  // Set up Offline Sync Listener
  if (typeof window !== 'undefined' && !window._offlineListenerAdded) {
    window.addEventListener('online', flushOfflineQueue);
    window._offlineListenerAdded = true;
  }

  // Trigger Supabase background sync ONCE on initial application load
  // Read real role from sessionStorage so admin/lead/accountant get rates synced
  if (!hasSyncedOnLoad && !isSyncing) {
    const storedRole = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ids_pulse_role')) || null;
    setTimeout(() => syncWithSupabase(false, storedRole), 100);
  }

  return data;
}

// 100% Purge / Reset DB to Completely Clean Production Slate (Local + Supabase Cloud)
export function resetDB() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
  
  // Clear any cached timesheet drafts
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('ids_pulse_integrity_weekly_timesheet_') || key.startsWith('ids_pulse_cer_weekly_grid_')) {
      localStorage.removeItem(key);
    }
  });

  const cleanData = JSON.parse(JSON.stringify(EMPTY_SCHEMA));
  cleanData.users = [...ESSENTIAL_ADMIN_USERS];
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
  window.dispatchEvent(new Event('ids_pulse_db_update'));

  // PURGE SUPABASE CLOUD TABLES (RPC + Scoped Delete Fallback)
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder')) {
    supabase.rpc('purge_demo_data').then(async ({ data, error }) => {
      if (error) {
        console.warn("[Supabase Purge RPC Error]:", error.message, "- running scoped table delete fallback...");
        let fallbackFailed = false;
        let lastFallbackError = error.message;
        const tables = ['suppliers', 'projects', 'rates', 'plants', 'time_entries', 'expense_entries', 'incidents', 'rework_logs', 'shift_reports', 'extra_hours_requests', 'daily_tasks', 'email_logs', 'system_logs', 'rep_activities'];
        for (const t of tables) {
          const { error: delErr } = await supabase.from(t).delete().neq('id', '0_impossible_id_preserve_all');
          if (delErr) {
            fallbackFailed = true;
            lastFallbackError = delErr.message;
            console.error(`[Supabase Purge Fallback Error] Table "${t}":`, delErr.message);
          }
        }
        const essentialIds = ['24', 'owner_1', 'acct_1', 'admin_1', 'lead_diana', 'rep_clarence'];
        const { error: userDelErr } = await supabase.from('users').delete().not('id', 'in', `(${essentialIds.map(i => `"${i}"`).join(',')})`);
        if (userDelErr) {
          fallbackFailed = true;
          lastFallbackError = userDelErr.message;
          console.error(`[Supabase Purge Fallback Error] Table "users":`, userDelErr.message);
        }

        if (fallbackFailed) {
          console.error("[Supabase Purge Failed Entirely]:", lastFallbackError);
          window.dispatchEvent(new CustomEvent('ids_pulse_toast', { detail: { message: `Cloud Purge Warning: ${lastFallbackError}`, type: 'error' } }));
        } else {
          window.dispatchEvent(new CustomEvent('ids_pulse_toast', { detail: { message: "Cloud database purged via fallback successfully.", type: 'info' } }));
        }
      } else {
        console.log("[Supabase Purge RPC Success]:", data);
        window.dispatchEvent(new CustomEvent('ids_pulse_toast', { detail: { message: "Supabase cloud database purged clean!", type: 'success' } }));
      }
      
      // Re-seed essential admin accounts to Supabase
      for (const admin of ESSENTIAL_ADMIN_USERS) {
        try {
          const { error: seedErr } = await supabase.from('users').upsert(admin);
          if (seedErr) console.error("Admin seed error:", seedErr.message);
        } catch (e) {
          console.error("Admin seed exception:", e);
        }
      }
    }).catch(err => {
      console.error("[Supabase Purge Execution Exception]:", err);
      window.dispatchEvent(new CustomEvent('ids_pulse_toast', { detail: { message: `Cloud Purge Exception: ${err.message}`, type: 'error' } }));
    });
  }

  return cleanData;
}

export function purgeDB() {
  return resetDB();
}

let isSyncing = false;
let hasSyncedOnLoad = false;

export function getSupabaseTableName(type) {
  if (type === 'shiftReports') return 'shift_reports';
  if (type === 'expenseEntries') return 'expense_entries';
  if (type === 'timeEntries') return 'time_entries';
  if (type === 'reworkLogs') return 'rework_logs';
  if (type === 'dailyTasks') return 'daily_tasks';
  if (type === 'emailLogs') return 'email_logs';
  if (type === 'systemLogs') return 'system_logs';
  if (type === 'extraHoursRequests') return 'extra_hours_requests';
  if (type === 'repActivities') return 'rep_activities';
  return type;
}

export function isFieldRep(user) {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  
  // Rule 8 Mandatory Distinction: NEVER treat Client Contacts / Customer Quality Managers as IDS Field Reps
  if (role === 'customer' || role === 'client' || !!user.customer_id) {
    return false;
  }

  // Exclude non-dispatch internal roles (accountants, executives, admins) unless explicitly flagged as rep
  if (role === 'accountant' || role === 'finance' || role === 'owner') {
    return false;
  }

  const title = String(user.title || '').toLowerCase();
  
  // Must be an IDS Field Inspector / Quality Liaison Rep / QRE
  return (
    role === 'rep' || 
    role === 'qre' || 
    role === 'inspector' || 
    role === 'quality_rep' || 
    title.includes('field rep') || 
    title.includes('quality inspector') || 
    title.includes('quality liaison') ||
    title.includes('field inspector')
  );
}

/**
 * Requirement 4: One canonical accounting eligibility check helper
 * Determines if a time entry is eligible to enter PO Telemetry, Weekly Timesheets, Payroll,
 * Invoices, QuickBooks CSVs, and Financial Totals.
 * 
 * Rules:
 * A. Regular allocated hours: hour_type = 'regular' (or default) AND status = 'recorded' (or legacy approved)
 * B. Approved overtime: hour_type = 'overtime' AND (status = 'client_approved' OR client_review_status = 'approved')
 */
export function isEntryAccountingEligible(entry) {
  if (!entry) return false;

  const hourType = (entry.hour_type || 'regular').toLowerCase();
  const status = (entry.status || '').toLowerCase();
  const clientReviewStatus = (entry.client_review_status || '').toLowerCase();

  // A. Regular allocated hours:
  const isRegularType = hourType === 'regular';
  const isRecordedOrLegacyApproved = 
    status === 'recorded' || 
    status === 'approved' || 
    (!status && (entry.invoiced || entry.source === 'legacy_session' || entry.source === 'admin_adjustment'));

  if (isRegularType && isRecordedOrLegacyApproved) {
    return true;
  }

  // B. Approved overtime:
  const isOvertimeType = hourType === 'overtime';
  const isClientApprovedOvertime = 
    status === 'client_approved' || 
    clientReviewStatus === 'approved';

  if (isOvertimeType && isClientApprovedOvertime) {
    return true;
  }

  return false;
}

export function isEntryApproved(entry) {
  return isEntryAccountingEligible(entry);
}

// Supabase Async Sync Engine with Role-Based Data Isolation
export async function syncWithSupabase(force = false, roleOverride = null, repIdOverride = null, customerIdOverride = null, sessionTokenOverride = null) {
  if (isSyncing) return;
  if (!force && hasSyncedOnLoad) return;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || String(supabaseUrl).includes('placeholder')) {
    console.log("[Supabase Sync] Cloud sync skipped (local-first mode active).");
    return;
  }

  isSyncing = true;
  const storedSessionRole = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ids_pulse_role')) || 'rep';
  const authRole = roleOverride || storedSessionRole;
  const role = roleOverride || storedSessionRole;
  const repId = repIdOverride || '';
  const customerId = customerIdOverride || '';
  const token = sessionTokenOverride || '';
  const isAdmin = ['admin', 'owner', 'accountant', 'lead', 'shahroz', 'super_admin']?.includes(authRole?.toLowerCase());

  const collections = [
    'users',
    'plants',
    'suppliers',
    'rates',
    'projects',
    'timeEntries',
    'expenseEntries',
    'extraHoursRequests',
    'systemLogs',
    'incidents',
    'reworkLogs',
    'dailyTasks',
    'emailLogs',
    'shiftReports',
    'repActivities',
    'parts'
  ];

  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const db = existingStr ? JSON.parse(existingStr) : JSON.parse(JSON.stringify(EMPTY_SCHEMA));
    let updated = false;

    // SECURITY GUARD: If active user is non-admin, purge rates
    if (!isAdmin) {
      if (db.rates && db.rates.length > 0) {
        db.rates = [];
        updated = true;
      }
    }

    for (const col of collections) {
      try {
        const targetTable = getSupabaseTableName(col);
        let data = [];
        let error = null;

        if (col === 'rates' && !isAdmin) {
          data = [];
        } else if (col === 'expenseEntries' && role === 'customer') {
          data = [];
        } else {
          let query = supabase.from(targetTable).select('*');
          if (!isAdmin) {
            if (role === 'customer' && customerId) {
              if (['incidents', 'time_entries', 'extra_hours_requests', 'projects', 'suppliers'].includes(targetTable)) {
                query = query.or(`supplier_id.eq.${customerId},supplier_id.ilike.%${customerId}%`);
              }
            } else if (role === 'rep' && repId) {
              if (['incidents', 'time_entries', 'shift_reports', 'extra_hours_requests', 'projects'].includes(targetTable)) {
                query = query.or(`rep_id.eq.${repId}`);
              }
            }
          }

          const res = await query;
          data = res.data || [];
          error = res.error;
        }

        if (error) {
          console.warn(`[Supabase Pull Info] table "${targetTable}":`, error.message);
          continue;
        }

        const cloudItems = data || [];

        // Cloud state is authoritative for scoped entities; merge local newly created items so they are never lost
        if (col === 'suppliers' || col === 'projects' || col === 'rates' || col === 'users' || col === 'plants' || col === 'systemLogs' || col === 'extraHoursRequests') {
          const localItems = db[col] || [];
          const mergedMap = new Map();
          cloudItems.forEach(item => { if (item && item.id) mergedMap.set(String(item.id), item); });
          localItems.forEach(item => { if (item && item.id && !mergedMap.has(String(item.id))) mergedMap.set(String(item.id), item); });

          const merged = Array.from(mergedMap.values());
          if (JSON.stringify(db[col] || []) !== JSON.stringify(merged)) {
            db[col] = merged;
            updated = true;
          }
          continue;
        }

        if (cloudItems.length === 0) {
          continue;
        }

        const cloudMap = new Map(cloudItems.map(item => [String(item.id), item]));
        const localItems = db[col] || [];
        const mergedMap = new Map();

        if (isAdmin) {
          for (const localItem of localItems) {
            if (localItem && localItem.id) {
              mergedMap.set(String(localItem.id), localItem);
            }
          }

          for (const cloudItem of cloudItems) {
            if (cloudItem && cloudItem.id) {
              mergedMap.set(String(cloudItem.id), cloudItem);
            }
          }

          const merged = Array.from(mergedMap.values());
          if (JSON.stringify(db[col] || []) !== JSON.stringify(merged)) {
            db[col] = merged;
            updated = true;
          }
        }
      } catch (colErr) {
        console.warn(`[Supabase Pull Exception] table "${col}":`, colErr);
      }
    }

    if (updated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      window.dispatchEvent(new Event('ids_pulse_db_update'));
    }
  } catch (err) {
    console.error("[Supabase Sync Error]:", err);
  } finally {
    isSyncing = false;
    hasSyncedOnLoad = true;
  }
}

let isFlushingOfflineQueue = false;

// Flush offline queue to Supabase when back online (Section 6 Strict Queue Classification)
export async function flushOfflineQueue() {
  if (isFlushingOfflineQueue) return;
  isFlushingOfflineQueue = true;

  try {
    const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
    if (queue.length === 0) return;

    const remainingQueue = [];
    const { syncQueuedIncidentRelease } = await import('../services/incidentWorkflowService');

    for (const item of queue) {
      const isIncidentRelease = item.queue_type === 'incident_release' || item.entity?.queue_type === 'incident_release';

      if (isIncidentRelease) {
        // Section 6: ONLY queue_type === 'incident_release' invokes release RPC replay!
        // syncQueuedIncidentRelease removes exact item from outbox on success.
        const result = await syncQueuedIncidentRelease(item);
        if (!result.success) {
          remainingQueue.push({
            ...item,
            retry_count: (item.retry_count || 0) + 1,
            last_error: result.message || 'Server release rejected',
            last_attempt: new Date().toISOString()
          });
        }
      } else {
        // Unrelated non-incident queue types use standard sync logic
        const targetTable = getSupabaseTableName(item.type);
        if (targetTable && targetTable !== 'incidents') {
          try {
            const { error } = await supabase.from(targetTable).upsert(item.entity);
            if (error) {
              console.error(`[Offline Sync Error] ${targetTable}:`, error.message);
              remainingQueue.push({
                ...item,
                retry_count: (item.retry_count || 0) + 1,
                last_error: error.message
              });
            }
          } catch (err) {
            console.error(`[Offline Sync Exception] ${item.type}:`, err);
            remainingQueue.push({
              ...item,
              retry_count: (item.retry_count || 0) + 1,
              last_error: err.message
            });
          }
        }
      }
    }

    // Retain failed items or items not processed by syncQueuedIncidentRelease
    localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(remainingQueue));
  } catch (globalErr) {
    console.error('[Offline Flush Exception]:', globalErr);
  } finally {
    isFlushingOfflineQueue = false;
  }
}

// Get the entire database
export function getDB() {
  return initializeDB();
}

// Save database
export function saveDB(data) {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('ids_pulse_db_update'));
  }
}

// Get entities helper
export function getEntities(type) {
  const db = getDB();
  let entities = db[type] || [];

  const role = (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ids_pulse_role') : null) || 'admin';
  const customerId = (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ids_pulse_customer_id') : null) || '';
  const repId = (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('ids_pulse_rep_id') : null) || '';

  const isAdmin = ['admin', 'owner', 'super_admin', 'accountant', 'lead', 'shahroz'].includes(role?.toLowerCase());

  if (!isAdmin) {
    if (type === 'rates') {
      return [];
    }

    if (type === 'projects') {
      return entities.map(p => {
        const { billing_rate, pay_rate, ...cleanProj } = p;
        return cleanProj;
      });
    }

    if (role === 'customer' && customerId) {
      if (type === 'timeEntries') {
        return entities.filter(t => t.supplier_id === customerId).map(t => {
          const { billing_rate, ...cleanTime } = t;
          return cleanTime;
        });
      }
      if (type === 'expenseEntries') {
        return [];
      }
      if (type === 'extraHoursRequests') {
        return entities.filter(e => e.supplier_id === customerId);
      }
      if (type === 'shiftReports') {
        const validPlants = (db.plants || []).filter(p => (p.supplier_ids || [])?.includes(customerId)).map(p => p.id);
        return entities.filter(r => 
          (r.status?.toLowerCase() === 'published') && 
          (r.supplier_id === customerId || r.customer_id === customerId || r.client_id === customerId || validPlants?.includes(r.plant_id))
        );
      }
      if (type === 'plants') {
        const supplier = (db.suppliers || []).find(s => s.id === customerId);
        const served = supplier?.plants_served || [];
        return entities.filter(p => p.supplier_id === customerId || (p.supplier_ids || [])?.includes(customerId) || served?.includes(p.id));
      }
      if (type === 'suppliers') {
        return entities.filter(s => s.id === customerId);
      }
      if (type === 'incidents') {
        return entities.filter(inc => {
          if (!inc) return false;
          const matchesCust = (inc.supplier_id === customerId || inc.customer_id === customerId || inc.client_id === customerId);
          const isReleased = (String(inc.status) === 'Released' || inc.released_to_client === true);
          return matchesCust && isReleased;
        });
      }
    }

    if (role === 'qre' || role === 'rep') {
      const targetRepId = repId || '1';
      if (type === 'timeEntries') {
        return entities.filter(t => t.rep_id === targetRepId).map(t => {
          const { billing_rate, ...cleanTime } = t;
          return cleanTime;
        });
      }
      if (type === 'expenseEntries') {
        return entities.filter(e => e.rep_id === targetRepId);
      }
      if (type === 'extraHoursRequests') {
        return entities.filter(e => e.rep_id === targetRepId);
      }
      if (type === 'shiftReports') {
        return entities.filter(r => r.rep_id === targetRepId);
      }
    }
  }

  return entities;
}

// Save entity helper
export function saveEntity(type, entity) {
  const db = getDB();
  if (!db[type]) db[type] = [];

  let normalizedEntity = { ...entity };

  if (type === 'shiftReports') {
    if (!normalizedEntity.supplier_id) {
      const projects = db.projects || [];
      const matchedProject = projects.find(p => 
        (p.plant_id === normalizedEntity.plant_id && (p.rep_id === normalizedEntity.rep_id || (p.assigned_reps || []).includes(normalizedEntity.rep_id))) ||
        p.rep_id === normalizedEntity.rep_id ||
        (p.assigned_reps || []).includes(normalizedEntity.rep_id)
      );
      if (matchedProject && matchedProject.supplier_id) {
        normalizedEntity.supplier_id = matchedProject.supplier_id;
        normalizedEntity.customer_id = matchedProject.supplier_id;
      }
    }
  }
  if (type === 'users') {
    if (entity.username === 'shahroz' || entity.id === 'admin_1' || entity.email === 'shahrozmirzallc@gmail.com') {
      normalizedEntity = {
        ...entity,
        id: 'admin_1',
        name: 'Shahroz Mirza',
        username: 'shahroz',
        email: 'shahrozmirzallc@gmail.com',
        password: 'Shahroz121$',
        role: 'super_admin',
        title: 'System Super Admin'
      };
    } else {
      const rawName = (entity.name || entity.username || entity.email || 'User').trim();
      const defaultUsername = entity.username 
        ? entity.username.toLowerCase().trim().replace(/\s+/g, '_')
        : (entity.name ? entity.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') : (entity.email ? entity.email.split('@')[0] : String(entity.id)));

      normalizedEntity = {
        role: 'rep',
        title: 'IDS Field Rep',
        ...entity,
        name: rawName,
        username: defaultUsername,
        password: entity.password || 'password123'
      };
    }
  }
  
  const index = db[type].findIndex(item => String(item.id) === String(normalizedEntity.id));
  if (index >= 0) {
    db[type][index] = { ...db[type][index], ...normalizedEntity };
  } else {
    db[type].push(normalizedEntity);
  }
  
  saveDB(db);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
    queue.push({ type, entity: normalizedEntity, timestamp: new Date().toISOString() });
    localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
  } else {
    const targetTable = getSupabaseTableName(type);
    if (type === 'systemLogs' || targetTable === 'system_logs') {
      Promise.resolve(supabase.from(targetTable).upsert(normalizedEntity)).catch(() => {});
      return normalizedEntity;
    }

    Promise.resolve(supabase.from(targetTable).upsert(normalizedEntity)).then((res) => {
      const error = res?.error;
      if (error) {
        console.error(`[Supabase Cloud Upsert Error] Table "${targetTable}":`, error.message);
        const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
        if (!queue.some(item => String(item.entity?.id) === String(normalizedEntity.id))) {
          queue.push({ type, entity: normalizedEntity, timestamp: new Date().toISOString(), lastError: error.message });
          localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
        }
        window.dispatchEvent(new CustomEvent('ids_pulse_toast', { detail: { message: `Cloud Write Warning on ${type}: ${error.message}`, type: 'warning' } }));
      }
    }).catch(err => {
      console.error(`[Supabase Cloud Upsert Exception] Table "${targetTable}":`, err);
      const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
      if (!queue.some(item => String(item.entity?.id) === String(normalizedEntity.id))) {
        queue.push({ type, entity: normalizedEntity, timestamp: new Date().toISOString(), lastError: err.message });
        localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
      }
    });
  }

  return normalizedEntity;
}

export function addUser(user) {
  const rawName = (user.name || user.username || user.email || 'User').trim();
  const defaultUsername = user.username 
    ? user.username.toLowerCase().trim().replace(/\s+/g, '_')
    : (user.name ? user.name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') : (user.email ? user.email.split('@')[0] : user.id));

  const newUser = {
    role: 'rep',
    title: 'IDS Field Rep',
    ...user,
    name: rawName,
    username: defaultUsername,
    password: user.password || 'password123',
    id: user.id || `usr_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    created_at: user.created_at || new Date().toISOString()
  };
  return saveEntity('users', newUser);
}

export function addIncident(incident) {
  const newIncident = {
    ...incident,
    id: incident.id || `inc_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    date: incident.date || new Date().toISOString().split('T')[0],
    status: incident.status || 'Open',
    created_at: incident.created_at || new Date().toISOString()
  };
  return saveEntity('incidents', newIncident);
}

export function addShiftReport(report) {
  const newReport = {
    ...report,
    id: report.id || `sr_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    date: report.date || new Date().toISOString().split('T')[0],
    status: report.status || 'published',
    created_at: report.created_at || new Date().toISOString()
  };
  return saveEntity('shiftReports', newReport);
}

export function addExpenseEntry(expense) {
  const newExp = {
    ...expense,
    id: expense.id || `exp_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    date: expense.date || new Date().toISOString().split('T')[0],
    created_at: expense.created_at || new Date().toISOString()
  };
  return saveEntity('expenseEntries', newExp);
}

export function addReworkLog(log) {
  const newLog = {
    ...log,
    id: log.id || `rw_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    date: log.date || new Date().toISOString().split('T')[0],
    created_at: log.created_at || new Date().toISOString()
  };
  return saveEntity('reworkLogs', newLog);
}

export function addDailyTask(task) {
  const newTask = {
    ...task,
    id: task.id || `task_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    created_at: task.created_at || new Date().toISOString()
  };
  return saveEntity('dailyTasks', newTask);
}

export function addEmailLog(log) {
  const newLog = {
    ...log,
    id: log.id || `email_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    sent_at: new Date().toISOString()
  };
  return saveEntity('emailLogs', newLog);
}

export function saveRate(rate) {
  const db = getDB();
  if (!db.rates) db.rates = [];

  let finalRate;
  const index = db.rates.findIndex(r => r.id === rate.id || (r.rep_id === rate.rep_id && r.supplier_id === rate.supplier_id && (r.plant_id === rate.plant_id || !rate.plant_id)));
  if (index >= 0) {
    db.rates[index] = { ...db.rates[index], ...rate };
    finalRate = db.rates[index];
  } else {
    const newRate = { id: `rate_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`, ...rate };
    db.rates.push(newRate);
    finalRate = newRate;
  }
  saveDB(db);

  Promise.resolve(supabase.from('rates').upsert(finalRate)).catch(err => console.warn("[Rates Upsert Warning]:", err));
  return finalRate;
}

export function deleteRate(rateId) {
  const db = getDB();
  if (!db.rates) return;
  db.rates = db.rates.filter(r => r.id !== rateId);
  saveDB(db);
  Promise.resolve(supabase.from('rates').delete().eq('id', rateId)).catch(err => console.warn("[Rates Delete Warning]:", err));
}

export function getExtraHoursRequests() {
  return getEntities('extraHoursRequests');
}

export function saveExtraHoursRequest(req) {
  return saveEntity('extraHoursRequests', req);
}

export function addExtraHoursRequest(req) {
  const newReq = {
    ...req,
    id: req.id || `ehr_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    status: req.status || 'pending_customer',
    created_at: new Date().toISOString(),
    history: req.history || [{ status: 'pending_customer', user: req.userName || 'Rep', timestamp: new Date().toISOString(), comment: 'Request submitted' }]
  };
  return saveEntity('extraHoursRequests', newReq);
}

export function updateExtraHoursRequestStatus(reqId, status, user, comment) {
  const reqs = getExtraHoursRequests();
  const req = reqs.find(r => r.id === reqId);
  if (req) {
    req.status = status;
    const historyEntry = { status, user, timestamp: new Date().toISOString(), comment };
    if (!req.history) req.history = [];
    req.history.push(historyEntry);
    
    if (status === 'approved' || status === 'rejected' || status === 'pending_admin') {
      const actionText = status === 'approved' ? 'Approved' : (status === 'rejected' ? 'Rejected' : 'Reviewed');
      const dbUsers = getEntities('users') || [];
      const ownerEmail = dbUsers.find(u => u.role === 'owner')?.email || 'management@goto-ids.com';
      const repEmail = dbUsers.find(u => u.id === req.rep_id || u.role === 'rep')?.email || 'operations@goto-ids.com';
      addEmailLog({
        incident_id: reqId,
        to_emails: ownerEmail,
        cc_emails: repEmail,
        subject: `[OVERTIME ${actionText?.toUpperCase()}] Request ${reqId} by Customer`,
        body: `<h3>OVERTIME REQUEST ${actionText?.toUpperCase()}</h3><p>Customer user <strong>${user}</strong> has ${actionText?.toLowerCase()} the overtime request.</p><p><strong>Comment:</strong> ${comment}</p>`
      });
    }
    return saveExtraHoursRequest(req);
  }
  return null;
}

export function logSystemEvent(category, action, details) {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    category,
    action,
    details
  };
  saveEntity('systemLogs', newLog);
  return newLog;
}

export function addProject(proj) {
  const newProj = {
    id: `proj_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    ...proj,
    status: proj.status || 'Active'
  };
  saveEntity('projects', newProj);
  return newProj;
}
