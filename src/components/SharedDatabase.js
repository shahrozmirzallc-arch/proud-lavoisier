// SharedDatabase.js
// Handles localStorage persistence and data synchronization.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_KEY = 'ids_pulse_db';

const SEED_DATA = {
  users: [
    { id: '1', name: 'Clarence Kuiken', email: 'clarence.k@integritydriven.com', role: 'rep', phone: '+1 905-914-2788', avatar: 'CK', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: '2', name: 'Donna Cabral', email: 'donna.c@integritydriven.com', role: 'lead', phone: '+1 905-555-0199', avatar: 'DC', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: '3', name: 'Greg Phillippe', email: 'greg.p@integritydriven.com', role: 'owner', phone: '+1 905-555-0100', avatar: 'GP', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: '4', name: 'Colleen Boyd', email: 'colleen.b@integritydriven.com', role: 'accountant', phone: '+1 905-555-0122', avatar: 'CB', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: 'user_diana', name: 'Diana', email: 'diana@integritydriven.com', role: 'owner', phone: '+1 555-555-0155', avatar: 'DI', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: 'rep_hugo', name: 'Hugo Picon', email: 'hugo.p@integritydriven.com', role: 'rep', phone: '+1 555-123-4567', avatar: 'HP', pay_currency: 'USD', company_affiliation: 'IDS' },
    { id: 'rep_nabil', name: 'Nabil Obad', email: 'nabil.o@integritydriven.com', role: 'rep', phone: '+1 555-987-6543', avatar: 'NO', pay_currency: 'USD', company_affiliation: 'IDS' },
    { id: 'rep_rogelio', name: 'Rogelio Velasco', email: 'rogelio.v@integritydriven.com', role: 'rep', phone: '+1 555-555-0987', avatar: 'RV', pay_currency: 'USD', company_affiliation: 'FQS' }
  ],
  rates: [
    { id: 'rate_1', rep_id: '1', supplier_id: 'magna', billing_rate: 28.00, pay_rate: 20.00 },
    { id: 'rate_2', rep_id: '1', supplier_id: 'hutchinson', billing_rate: 30.00, pay_rate: 22.00 },
    { id: 'rate_hugo', rep_id: 'rep_hugo', supplier_id: 'autokabel', plant_id: 'mercedes_tuscaloosa', billing_rate: 35.00, pay_rate: 25.00 },
    { id: 'rate_nabil', rep_id: 'rep_nabil', supplier_id: 'autokabel', plant_id: 'ford_dearborn', billing_rate: 35.00, pay_rate: 26.00 },
    { id: 'rate_rogelio', rep_id: 'rep_rogelio', supplier_id: 'autokabel', plant_id: 'gm_slp', billing_rate: 28.00, pay_rate: 18.56 },
    { id: 'rate_rogelio_brose', rep_id: 'rep_rogelio', supplier_id: 'brose', plant_id: 'gm_slp', billing_rate: 32.00, pay_rate: 20.00 },
    { id: 'rate_rogelio_borg', rep_id: 'rep_rogelio', supplier_id: 'borgwarner', plant_id: 'gm_slp', billing_rate: 38.00, pay_rate: 22.00 }
  ],
  plants: [
    { id: 'gm_oshawa', name: 'GM Oshawa Plant', address: '900 Park Rd S, Oshawa, ON', oem_brand: 'GM' },
    { id: 'magna_autosystems', name: 'Magna AutoSystems', address: 'Belleville, ON', oem_brand: 'Magna' },
    { id: 'hutchinson', name: 'Hutchinson Plant', address: 'Mississauga, ON', oem_brand: 'Hutchinson' },
    { id: 'mercedes_tuscaloosa', name: 'Mercedes Tuscaloosa Plant', address: 'Tuscaloosa, AL', oem_brand: 'Mercedes' },
    { id: 'ford_dearborn', name: 'Ford Dearborn Plant', address: 'Dearborn, MI', oem_brand: 'Ford' },
    { id: 'gm_slp', name: 'GM SLP Plant', address: 'San Luis Potosi, MX', oem_brand: 'GM' }
  ],
  suppliers: [
    { 
      id: 'magna', name: 'Magna AutoSystems', invoice_schedule: 'weekly', allotted_hours: 45,
      contacts: [{ name: 'Shahroz Mirza', email: 'shahroz.m@magna.com', role: 'Quality Manager' }, { name: 'Martin', email: 'martin.s@magna.com', role: 'Sequence Supervisor' }],
      plants_served: ['gm_oshawa'] 
    },
    { 
      id: 'hutchinson', name: 'Hutchinson Rubber', invoice_schedule: 'monthly', allotted_hours: 30,
      contacts: [{ name: 'Sarah Jenkins', email: 'sjenkins@hutchinson.ca', role: 'Supplier Quality Engineer' }],
      plants_served: ['gm_oshawa'] 
    },
    {
      id: 'autokabel', name: 'Auto Kabel de Mexico S.A. de C.V', invoice_schedule: 'weekly', allotted_hours: 50,
      contacts: [{ name: 'Juan Carlos', email: 'jc@autokabel.mx', role: 'Plant Quality Manager' }],
      plants_served: ['mercedes_tuscaloosa', 'ford_dearborn', 'gm_slp']
    },
    {
      id: 'brose', name: 'Brose México S.A. de C.V.', invoice_schedule: 'weekly', allotted_hours: 40,
      contacts: [{ name: 'Maria Gomez', email: 'mg@brose.mx', role: 'Supplier Quality Manager' }],
      plants_served: ['gm_slp']
    },
    {
      id: 'borgwarner', name: 'BorgWarner PDS Irapuato', invoice_schedule: 'monthly', allotted_hours: 35,
      contacts: [{ name: 'Alejandro', email: 'al@borgwarner.com', role: 'Supplier Quality Engineer' }],
      plants_served: ['gm_slp']
    }
  ],
  parts: [
    { id: '86286761', part_number: '86286761', supplier_id: 'magna', description: 'Tail Light Assembly' },
    { id: '86291945', part_number: '86291945', supplier_id: 'magna', description: 'Headlight Housing' },
    { id: 'AK-BAT-001', part_number: 'AK-BAT-001', supplier_id: 'autokabel', description: 'Primary Battery Cable Sheath' },
    { id: 'AK-HAR-294', part_number: 'AK-HAR-294', supplier_id: 'autokabel', description: 'Headlight Wiring Harness' },
    { id: 'BR-REG-502', part_number: 'BR-REG-502', supplier_id: 'brose', description: 'Door Regulator Bracket' },
    { id: 'BW-SOL-119', part_number: 'BW-SOL-119', supplier_id: 'borgwarner', description: 'Transmission Solenoid Valve' }
  ],
  incidents: [
    { id: 'inc_1', rep_id: '1', plant_id: 'gm_oshawa', supplier_id: 'magna', part_id: '86286761', area: 'Sequence Area', description: 'Spare bulb rattling inside housing.', action_taken: 'Removed bulb', supplier_contact: 'Martin', status: 'Closed', concern_classification: 'PRR', defect_location_x: 0.30, defect_location_y: 0.50, parts_list: [{ id: 'sp_1', part_number: '86286761', description: 'Tail Light', supplier_id: 'magna', qty: 1 }], photos: [] },
    { id: 'inc_8', rep_id: 'rep_hugo', plant_id: 'mercedes_tuscaloosa', supplier_id: 'autokabel', part_id: 'AK-BAT-001', area: 'Assembly Line 4', description: 'Insulation gap on primary battery cable sheath. Standard gauge wire exposed.', action_taken: 'Placed parts in containment bin, flagged Mercedes quality auditor.', supplier_contact: 'Juan Carlos', status: 'Open', concern_classification: 'PRR', defect_location_x: 0.45, defect_location_y: 0.60, parts_list: [{ id: 'sp_8', part_number: 'AK-BAT-001', description: 'Battery Cable', supplier_id: 'autokabel', qty: 1 }], photos: [] },
    { id: 'inc_9', rep_id: 'rep_nabil', plant_id: 'ford_dearborn', supplier_id: 'autokabel', part_id: 'AK-HAR-294', area: 'Harness Sequencing', description: 'Bent electrical connector pins on wiring harnesses preventing positive locking.', action_taken: 'Rejected 6 bad harnesses.', supplier_contact: 'Juan Carlos', status: 'Closed', concern_classification: 'QR', defect_location_x: 0.55, defect_location_y: 0.40, parts_list: [{ id: 'sp_9', part_number: 'AK-HAR-294', description: 'Wiring Harness', supplier_id: 'autokabel', qty: 6 }], photos: [] },
    { id: 'inc_10', rep_id: 'rep_rogelio', plant_id: 'gm_slp', supplier_id: 'brose', part_id: 'BR-REG-502', area: 'Body Shop Line 2', description: 'Mounting hole tolerance on door regulator bracket exceeded specification (+0.5mm).', action_taken: 'Contained 120 parts. Initiated 100% sort.', supplier_contact: 'Maria Gomez', status: 'Open', concern_classification: 'PRR', defect_location_x: 0.20, defect_location_y: 0.80, parts_list: [{ id: 'sp_10', part_number: 'BR-REG-502', description: 'Door Bracket', supplier_id: 'brose', qty: 14 }], photos: [] },
    { id: 'inc_11', rep_id: 'rep_rogelio', plant_id: 'gm_slp', supplier_id: 'borgwarner', part_id: 'BW-SOL-119', area: 'Powertrain Assembly', description: 'Solenoid valve failing air leak test during transmission mating process.', action_taken: 'Quarantined pallet. Replaced with certified stock.', supplier_contact: 'Alejandro', status: 'Open', concern_classification: 'PRR', defect_location_x: 0.70, defect_location_y: 0.30, parts_list: [{ id: 'sp_11', part_number: 'BW-SOL-119', description: 'Solenoid Valve', supplier_id: 'borgwarner', qty: 3 }], photos: [] }
  ],
  shiftReports: [
    { id: 'sr_1', rep_id: '1', plant_id: 'gm_oshawa', date: '2026-07-06', areas_walked: [{ name: 'Sequence area', status: 'issues' }], incidents_count: 1, status: 'Sent' },
    { id: 'sr_2', rep_id: 'rep_hugo', plant_id: 'mercedes_tuscaloosa', date: '2026-07-06', areas_walked: [{ name: 'Assembly Line 4', status: 'issues' }], incidents_count: 1, status: 'Sent' },
    { id: 'sr_3', rep_id: 'rep_rogelio', plant_id: 'gm_slp', date: '2026-07-06', areas_walked: [{ name: 'Body Shop', status: 'issues' }, { name: 'Powertrain', status: 'issues' }], incidents_count: 2, status: 'Sent' }
  ],
  reworkLogs: [
    { id: 'rw_1', rep_id: 'rep_hugo', plant_id: 'mercedes_tuscaloosa', supplier_id: 'autokabel', part_id: 'AK-BAT-001', qty: 45, time_spent_minutes: 180, notes: 'Reworked copper connectors.' },
    { id: 'rw_2', rep_id: 'rep_rogelio', plant_id: 'gm_slp', supplier_id: 'brose', part_id: 'BR-REG-502', qty: 120, time_spent_minutes: 240, notes: 'Full sort of door brackets.' },
    { id: 'rw_3', rep_id: 'rep_rogelio', plant_id: 'gm_slp', supplier_id: 'borgwarner', part_id: 'BW-SOL-119', qty: 50, time_spent_minutes: 120, notes: 'Air leak testing on quarantined pallet.' }
  ],
  timeEntries: [
    { id: 'te_1', rep_id: '1', plant_id: 'gm_oshawa', supplier_id: 'magna', date: '2026-07-06', hours: 8.5, mileage_km: 45, invoiced: false, sent_to_payroll: false },
    { id: 'te_2', rep_id: 'rep_hugo', plant_id: 'mercedes_tuscaloosa', supplier_id: 'autokabel', date: '2026-07-06', hours: 10.0, mileage_km: 85, invoiced: false, sent_to_payroll: false },
    { id: 'te_3', rep_id: 'rep_nabil', plant_id: 'ford_dearborn', supplier_id: 'autokabel', date: '2026-07-06', hours: 8.0, mileage_km: 32, invoiced: false, sent_to_payroll: false },
    { id: 'te_4', rep_id: 'rep_rogelio', plant_id: 'gm_slp', supplier_id: 'brose', date: '2026-07-06', hours: 6.0, mileage_km: 20, invoiced: false, sent_to_payroll: false },
    { id: 'te_5', rep_id: 'rep_rogelio', plant_id: 'gm_slp', supplier_id: 'borgwarner', date: '2026-07-06', hours: 4.5, mileage_km: 20, invoiced: false, sent_to_payroll: false },
    { id: 'te_6', rep_id: 'rep_rogelio', plant_id: 'gm_slp', supplier_id: 'brose', date: '2026-07-07', hours: 8.0, mileage_km: 40, invoiced: false, sent_to_payroll: false }
  ],
  expenseEntries: [
    { id: 'exp_1', rep_id: 'rep_rogelio', supplier_id: 'brose', date: '2026-07-06', category: 'Safety Gear', amount: 75.00, receipt_photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23', status: 'approved' },
    { id: 'exp_2', rep_id: 'rep_hugo', supplier_id: 'autokabel', date: '2026-07-06', category: 'Meals', amount: 28.50, receipt_photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23', status: 'pending' }
  ],
  emailLogs: [],
  dailyTasks: [
    { id: 'dt_1', rep_id: 'rep_rogelio', date: '2026-07-07', task: 'Follow up on BorgWarner solenoid leak testing', status: 'pending' },
    { id: 'dt_2', rep_id: 'rep_rogelio', date: '2026-07-07', task: 'Complete Brose door bracket 100% sort', status: 'pending' }
  ],
  projects: [
    { id: 'proj_1', project_number: 'PRJ-MAG-101', client_id: 'magna', rep_id: '1', plant_id: 'gm_oshawa', status: 'Active', currency: 'CAD' },
    { id: 'proj_2', project_number: 'PRJ-BRO-204', client_id: 'brose', rep_id: 'rep_rogelio', plant_id: 'gm_slp', status: 'Active', currency: 'USD' },
    { id: 'proj_3', project_number: 'PRJ-BOR-092', client_id: 'borgwarner', rep_id: 'rep_rogelio', plant_id: 'gm_slp', status: 'Active', currency: 'USD' }
  ],
  systemLogs: [],
  extraHoursRequests: []
};

// Initialize database in localStorage
export function initializeDB() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    setTimeout(() => syncWithSupabase(), 100);
    return SEED_DATA;
  }
  const data = JSON.parse(existing);
  let updated = false;

  // Fix migration missing collections
  const collections = ['users', 'rates', 'plants', 'suppliers', 'parts', 'incidents', 'reworkLogs', 'timeEntries', 'expenseEntries', 'extraHoursRequests', 'systemLogs', 'projects', 'dailyTasks', 'shiftReports', 'emailLogs'];
  collections.forEach(col => {
    if (!data[col]) {
      data[col] = SEED_DATA[col] || [];
      updated = true;
    }
  });

  SEED_DATA.users.forEach(seedUser => {
    const match = data.users.find(u => u.id === seedUser.id);
    if (!match) {
      data.users.push(seedUser);
      updated = true;
    } else {
      if (!match.pay_currency) {
        match.pay_currency = seedUser.pay_currency;
        updated = true;
      }
      if (!match.company_affiliation) {
        match.company_affiliation = seedUser.company_affiliation;
        updated = true;
      }
    }
  });

  SEED_DATA.plants.forEach(seedPlant => {
    if (!data.plants.find(p => p.id === seedPlant.id)) {
      data.plants.push(seedPlant);
      updated = true;
    }
  });

  SEED_DATA.suppliers.forEach(seedSup => {
    if (!data.suppliers.find(s => s.id === seedSup.id)) {
      data.suppliers.push(seedSup);
      updated = true;
    }
  });

  SEED_DATA.rates.forEach(seedRate => {
    if (!data.rates.find(r => r.id === seedRate.id)) {
      data.rates.push(seedRate);
      updated = true;
    }
  });

  if (updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('ids_pulse_db_update'));
  }

  // Set up Offline Sync Listener
  if (typeof window !== 'undefined') {
    window.addEventListener('online', flushOfflineQueue);
  }

  // Trigger Supabase background sync asynchronously
  setTimeout(() => syncWithSupabase(), 100);

  return data;
}

// Supabase Async Sync Engine
export async function syncWithSupabase() {
  console.log("Starting Supabase Sync...");
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
    'shiftReports'
  ];

  const db = getDB();
  let updated = false;

  for (const col of collections) {
    try {
      const { data, error } = await supabase.from(col).select('*');
      if (error) {
        console.error(`[Supabase Pull Error] table "${col}":`, error.message);
        continue;
      }

      if (!data || data.length === 0) {
        const localItems = db[col] || [];
        if (localItems.length > 0) {
          console.log(`[Supabase Seeding] table "${col}": uploading ${localItems.length} items...`);
          const { error: upsertError } = await supabase.from(col).upsert(localItems);
          if (upsertError) {
            console.error(`[Supabase Seed Error] table "${col}":`, upsertError.message);
          }
        }
      } else {
        db[col] = data;
        updated = true;
      }
    } catch (err) {
      console.error(`[Supabase Sync Exception] table "${col}":`, err);
    }
  }

  if (updated) {
    console.log("[Supabase Sync Success] Local cache refreshed with live cloud data.");
    saveDB(db);
  } else {
    console.log("[Supabase Sync Checked] Cache matches cloud.");
  }
}

// Flush Offline Queue
export async function flushOfflineQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
  if (queue.length === 0) return;
  
  console.log(`[Online Recovery] Flushing ${queue.length} items from offline queue...`);
  const failed = [];
  
  for (const item of queue) {
    try {
      const { error } = await supabase.from(item.type).upsert(item.entity);
      if (error) {
        console.error(`[Recovery Error] ${item.type}:`, error.message);
        failed.push(item);
      }
    } catch (err) {
       console.error(`[Recovery Exception] ${item.type}:`, err);
       failed.push(item);
    }
  }
  
  localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(failed));
  if (failed.length === 0) {
    console.log('[Online Recovery] Complete. Offline queue empty.');
  }
}

// Get the entire database
export function getDB() {
  const db = localStorage.getItem(STORAGE_KEY);
  if (!db) return initializeDB();
  return JSON.parse(db);
}

// Save database
export function saveDB(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // Dispatch a custom event to notify other components of database updates
  window.dispatchEvent(new Event('ids_pulse_db_update'));
}

// Get entities helper with role-based data sanitization
export function getEntities(type) {
  const db = getDB();
  let entities = db[type] || [];

  const isUnlocked = sessionStorage.getItem('ids_pulse_unlocked') === 'true';
  const role = sessionStorage.getItem('ids_pulse_role') || 'rep';
  const customerId = sessionStorage.getItem('ids_pulse_customer_id') || '';
  const repId = sessionStorage.getItem('ids_pulse_rep_id') || '';

  if (isUnlocked) {
    const isAdmin = ['admin', 'owner', 'accountant', 'lead', 'shahroz'].includes(role);

    if (!isAdmin) {
      if (type === 'rates') {
        return [];
      }
      
      if (type === 'users') {
        return entities.map(u => {
          const { pay_currency, ...cleanUser } = u;
          return cleanUser;
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
          const validPlants = (db.plants || []).filter(p => (p.supplier_ids || []).includes(customerId)).map(p => p.id);
          return entities.filter(r => validPlants.includes(r.plant_id) && r.status === 'published');
        }
        if (type === 'plants') {
          const supplier = (db.suppliers || []).find(s => s.id === customerId);
          const served = supplier?.plants_served || [];
          return entities.filter(p => served.includes(p.id));
        }
        if (type === 'suppliers') {
          return entities.filter(s => s.id === customerId);
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
  }

  return entities;
}

// Save entity helper
export function saveEntity(type, entity) {
  const db = getDB();
  if (!db[type]) db[type] = [];
  
  // Update or insert
  const index = db[type].findIndex(item => item.id === entity.id);
  if (index >= 0) {
    db[type][index] = { ...db[type][index], ...entity };
  } else {
    db[type].push(entity);
  }
  
  saveDB(db);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    // Save to offline queue
    const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
    queue.push({ type, entity, timestamp: new Date().toISOString() });
    localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
    console.log(`[Offline] Saved ${type} to offline queue.`);
  } else {
    // Sync to Supabase in background
    supabase.from(type).upsert(entity)
      .then(({ error }) => {
        if (error) {
          console.error(`[Supabase Push Error] table "${type}":`, error.message);
        }
      })
      .catch(err => {
        console.error(`[Supabase Push Exception] table "${type}":`, err);
        const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
        queue.push({ type, entity, timestamp: new Date().toISOString() });
        localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
      });
  }

  return entity;
}

// Add user
export function addUser(user) {
  const newUser = { ...user, id: user.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, created_at: new Date().toISOString() };
  return saveEntity('users', newUser);
}

// Add incident
export function addIncident(incident) {
  const newIncident = {
    ...incident,
    id: incident.id || `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: incident.status || 'Open',
    created_at: new Date().toISOString()
  };
  return saveEntity('incidents', newIncident);
}

// Add shift report
export function addShiftReport(report) {
  const newReport = {
    ...report,
    id: report.id || `sr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: report.status || 'Draft',
    created_at: new Date().toISOString()
  };
  return saveEntity('shiftReports', newReport);
}

// Add rework log
export function addReworkLog(log) {
  const newLog = {
    ...log,
    id: log.id || `rw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString()
  };
  return saveEntity('reworkLogs', newLog);
}

// Add time entry
export function addTimeEntry(entry) {
  const newEntry = {
    ...entry,
    id: entry.id || `te_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString()
  };
  return saveEntity('timeEntries', newEntry);
}

// Add email log
export function addEmailLog(log) {
  const newLog = {
    ...log,
    id: log.id || `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sent_at: new Date().toISOString(),
    delivery_status: log.delivery_status || 'delivered'
  };
  return saveEntity('emailLogs', newLog);
}

// Reset database to seed data
export function resetDB() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
  window.dispatchEvent(new Event('ids_pulse_db_update'));
  return SEED_DATA;
}

// Add a daily task
export function addDailyTask(task) {
  const newTask = {
    ...task,
    id: task.id || `dt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    status: task.status || 'pending'
  };
  return saveEntity('dailyTasks', newTask);
}

// Add expense entry
export function addExpenseEntry(entry) {
  const newEntry = {
    ...entry,
    id: entry.id || `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString()
  };
  return saveEntity('expenseEntries', newEntry);
}

// Get all rates
export function getRates() {
  const role = sessionStorage.getItem('ids_pulse_role');
  if (!['admin', 'accountant', 'lead', 'shahroz'].includes(role)) {
    return [];
  }
  const db = getDB();
  return db.rates || [];
}

// Save or update a rate
export function saveRate(rate) {
  const db = getDB();
  if (!db.rates) db.rates = [];
  
  let index = db.rates.findIndex(r => r.id === rate.id);
  if (index === -1) {
    index = db.rates.findIndex(r => r.rep_id === rate.rep_id && r.supplier_id === rate.supplier_id && r.plant_id === rate.plant_id);
  }
  let finalRate = rate;
  if (index >= 0) {
    db.rates[index] = { ...db.rates[index], ...rate };
    finalRate = db.rates[index];
  } else {
    const newRate = { id: `rate_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, ...rate };
    db.rates.push(newRate);
    finalRate = newRate;
  }
  saveDB(db);

  // Sync to Supabase in background
  supabase.from('rates').upsert(finalRate)
    .then(({ error }) => {
      if (error) console.error('[Supabase Push Error] table "rates":', error.message);
    })
    .catch(err => console.error('[Supabase Push Exception] table "rates":', err));

  return finalRate;
}

// Delete a rate
export function deleteRate(rateId) {
  const db = getDB();
  if (!db.rates) return;
  db.rates = db.rates.filter(r => r.id !== rateId);
  saveDB(db);

  // Sync delete to Supabase in background
  supabase.from('rates').delete().eq('id', rateId)
    .then(({ error }) => {
      if (error) console.error('[Supabase Delete Error] table "rates":', error.message);
    })
    .catch(err => console.error('[Supabase Delete Exception] table "rates":', err));
}


// Helper functions for extra hours requests
export function getExtraHoursRequests() {
  return getEntities('extraHoursRequests');
}

export function saveExtraHoursRequest(req) {
  return saveEntity('extraHoursRequests', req);
}

export function addExtraHoursRequest(req) {
  const newReq = {
    ...req,
    id: req.id || `ehr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
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
      addEmailLog({
        incident_id: reqId,
        to_emails: 'greg.p@integritydriven.com',
        cc_emails: 'rep_assigned@integritydriven.com', // Would look up Rep's email in real system
        subject: `[OVERTIME ${actionText.toUpperCase()}] Request ${reqId} by Customer`,
        body: `<h3>OVERTIME REQUEST ${actionText.toUpperCase()}</h3><p>Customer user <strong>${user}</strong> has ${actionText.toLowerCase()} the overtime request.</p><p><strong>Comment:</strong> ${comment}</p>`
      });
    }
    return saveExtraHoursRequest(req);
  }
  return null;
}

// Log a system event
export function logSystemEvent(category, action, details) {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    category,
    action,
    details
  };
  saveEntity('systemLogs', newLog);
  return newLog;
}

// Add new project
export function addProject(proj) {
  const newProj = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...proj,
    status: proj.status || 'Active'
  };
  saveEntity('projects', newProj);
  return newProj;
}
