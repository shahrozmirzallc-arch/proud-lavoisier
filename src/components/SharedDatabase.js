// SharedDatabase.js
// Handles localStorage persistence and data synchronization.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_KEY = 'ids_pulse_db';
const DB_VERSION_KEY = 'ids_pulse_db_version';
const CURRENT_DB_VERSION = 'v2.1.0_clean_test_purge';

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

// Initialize database in localStorage with automatic version cache invalidation
export function initializeDB() {
  const storedVersion = localStorage.getItem(DB_VERSION_KEY);
  if (storedVersion !== CURRENT_DB_VERSION) {
    console.log(`[IDS PULSE] Updating DB Schema version from ${storedVersion} to ${CURRENT_DB_VERSION}...`);
    localStorage.removeItem(STORAGE_KEY);
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

  // Fix migration missing collections
  const collections = Object.keys(EMPTY_SCHEMA);
  let updated = false;
  collections.forEach(col => {
    if (!data[col] || !Array.isArray(data[col])) {
      data[col] = [];
      updated = true;
    }
  });

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
  if (!hasSyncedOnLoad && !isSyncing) {
    setTimeout(() => syncWithSupabase(), 100);
  }

  return data;
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
  const role = (user.role || '').toLowerCase();
  const title = (user.title || '').toLowerCase();
  return role === 'rep' || role === 'qre' || title.includes('rep') || title.includes('quality') || title.includes('inspector') || title.includes('engineer');
}

// Supabase Async Sync Engine with Role-Based Data Isolation
export async function syncWithSupabase(force = false, roleOverride = null, repIdOverride = null, customerIdOverride = null) {
  if (isSyncing) return;
  if (!force && hasSyncedOnLoad) return;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL' || String(supabaseUrl).includes('placeholder')) {
    console.log("[Supabase Sync] Cloud sync skipped (local-first mode active).");
    return;
  }

  isSyncing = true;
  console.log("Starting Supabase Sync with Role Isolation...");
  const role = roleOverride || sessionStorage.getItem('ids_pulse_role') || 'rep';
  const repId = repIdOverride || sessionStorage.getItem('ids_pulse_rep_id') || '1';
  const customerId = customerIdOverride || sessionStorage.getItem('ids_pulse_customer_id') || '';
  const isAdmin = ['admin', 'owner', 'accountant', 'lead', 'shahroz']?.includes(role?.toLowerCase());

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

    // SECURITY GUARD: If active user is non-admin, immediately purge rates array from localStorage
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

        // SERVER-SIDE ROLE ISOLATION READ QUERIES
        if (col === 'rates') {
          if (!isAdmin) {
            // Non-admins get 0 rates at API level
            data = [];
          } else {
            const { data: ratesData, error: ratesErr } = await supabase.rpc('get_rates_for_admin', { p_role: role });
            data = ratesData;
            error = ratesErr;
          }
        } else if (col === 'timeEntries') {
          const { data: teData, error: teErr } = await supabase.rpc('get_scoped_time_entries', { 
            p_role: role, 
            p_rep_id: repId, 
            p_customer_id: customerId 
          });
          data = teData;
          error = teErr;
        } else if (col === 'expenseEntries') {
          if (role === 'customer') {
            // Customers get 0 expense entries at API level
            data = [];
          } else {
            const { data: expData, error: expErr } = await supabase.rpc('get_scoped_expense_entries', { 
              p_role: role, 
              p_rep_id: repId 
            });
            data = expData;
            error = expErr;
          }
        } else if (col === 'suppliers' && role === 'customer' && customerId) {
          const { data: suppData, error: suppErr } = await supabase.from('suppliers').select('*').eq('id', customerId);
          data = suppData;
          error = suppErr;
        } else {
          const { data: defaultData, error: defaultErr } = await supabase.from(targetTable).select('*');
          data = defaultData;
          error = defaultErr;
        }

        if (col === 'users') {
          data = (data || []).map(u => {
            if (!isAdmin) {
              const { password_hash, hourly_rate, billing_rate, pay_currency, ...safeUser } = u;
              return { ...safeUser, passcode: 'auth_managed' };
            }
            return { ...u, passcode: 'auth_managed' };
          });
        }

        if (error) {
          console.warn(`[Supabase Pull Info] table "${targetTable}":`, error.message);
          continue;
        }

        const cloudItems = data || [];

        // Cloud state is 100% authoritative for suppliers and rates; never push local cache defaults back to cloud
        if (col === 'suppliers' || col === 'rates') {
          if (JSON.stringify(db[col] || []) !== JSON.stringify(cloudItems)) {
            db[col] = cloudItems;
            updated = true;
          }
          continue;
        }

        // If cloud table is empty or filtered out for role, clear local storage cache for this collection
        if (cloudItems.length === 0) {
          if (db[col] && db[col].length > 0) {
            db[col] = [];
            updated = true;
          }
          continue;
        }

        const cloudMap = new Map(cloudItems.map(item => [item.id, item]));
        const localItems = db[col] || [];
        const mergedMap = new Map();

        // For non-admin, do not push local items up if not in cloud
        if (isAdmin) {
          for (const localItem of localItems) {
            mergedMap.set(localItem.id, localItem);
            if (localItem && localItem.id && !cloudMap.has(localItem.id)) {
              await supabase.from(targetTable).upsert(localItem);
            }
          }
        }

        // Overlay cloud items over local items
        for (const cloudItem of cloudItems) {
          if (cloudItem && cloudItem.id) {
            const existingLocal = mergedMap.get(cloudItem.id);
            mergedMap.set(cloudItem.id, existingLocal ? { ...existingLocal, ...cloudItem } : cloudItem);
          }
        }

        const finalCollection = Array.from(mergedMap.values());
        if (JSON.stringify(db[col]) !== JSON.stringify(finalCollection)) {
          db[col] = finalCollection;
          updated = true;
        }
      } catch (err) {
        console.warn(`[Supabase Sync Info] table "${col}":`, err.message || err);
      }
    }

    if (updated) {
      console.log("[Supabase Sync Success] Local cache refreshed with live cloud data.");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      window.dispatchEvent(new Event('ids_pulse_db_update'));
    } else {
      console.log("[Supabase Sync Checked] Cache matches cloud.");
    }
  } finally {
    isSyncing = false;
    hasSyncedOnLoad = true;
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

// Get the entire database with auto-migration of seed data
export function getDB() {
  return initializeDB();
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
    const isAdmin = ['admin', 'owner', 'accountant', 'lead', 'shahroz']?.includes(role);

    if (!isAdmin) {
      if (type === 'rates') {
        return [];
      }
      
      if (type === 'users') {
        return entities.map(u => {
          const { pay_currency, passcode, password_hash, hourly_rate, billing_rate, ...cleanUser } = u;
          return { ...cleanUser, passcode: 'auth_managed' };
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
          return entities.filter(r => validPlants?.includes(r.plant_id) && r.status === 'published');
        }
        if (type === 'plants') {
          const supplier = (db.suppliers || []).find(s => s.id === customerId);
          const served = supplier?.plants_served || [];
          return entities.filter(p => served?.includes(p.id));
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
    const targetTable = getSupabaseTableName(type);
    supabase.from(targetTable).upsert(entity)
      .then(({ error }) => {
        if (error) {
          console.error(`[Supabase Push Error] table "${targetTable}":`, error.message);
          const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
          queue.push({ type, entity, timestamp: new Date().toISOString() });
          localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
          window.dispatchEvent(new CustomEvent('ids_pulse_sync_error', { detail: { table: targetTable, message: error.message } }));
        }
      })
      .catch(err => {
        console.error(`[Supabase Push Exception] table "${type}":`, err);
        const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
        queue.push({ type, entity, timestamp: new Date().toISOString() });
        localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
        window.dispatchEvent(new CustomEvent('ids_pulse_sync_error', { detail: { table: type, message: err.message || String(err) } }));
      });
  }

  return entity;
}

// Add user
export function addUser(user) {
  const newUser = { ...user, id: user.id || `usr_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`, created_at: new Date().toISOString() };
  return saveEntity('users', newUser);
}

// Add incident
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

// Add shift report
export function addShiftReport(report) {
  const newReport = {
    ...report,
    id: report.id || `sr_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    date: report.date || new Date().toISOString().split('T')[0],
    status: report.status || 'Draft',
    created_at: report.created_at || new Date().toISOString()
  };
  return saveEntity('shiftReports', newReport);
}

// Add rework log
export function addReworkLog(log) {
  const newLog = {
    ...log,
    id: log.id || `rw_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    date: log.date || new Date().toISOString().split('T')[0],
    created_at: log.created_at || new Date().toISOString()
  };
  return saveEntity('reworkLogs', newLog);
}

// Add time entry with automated Rep Payroll ledger synchronization
export function addTimeEntry(entry) {
  const newEntry = {
    ...entry,
    id: entry.id || `te_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    created_at: new Date().toISOString()
  };

  const saved = saveEntity('timeEntries', newEntry);

  // Auto-sync Rep Payroll Ledger
  try {
    const dbUsers = getEntities('users') || [];
    const dbRates = getEntities('rates') || [];
    const rep = dbUsers.find(u => u.id === newEntry.rep_id);
    const rate = dbRates.find(r => r.rep_id === newEntry.rep_id && (r.supplier_id === newEntry.supplier_id || !r.supplier_id));

    const billRate = rate ? parseFloat(rate.billing_rate) : 34.00;
    const payRate = rate ? parseFloat(rate.pay_rate) : 25.00;
    const hrs = parseFloat(newEntry.hours || 0);

    const grossRevenue = hrs * billRate;
    const repExpense = hrs * payRate;
    const netProfit = grossRevenue - repExpense;

    const payrollRecord = {
      id: `pr_${newEntry.id}`,
      time_entry_id: newEntry.id,
      rep_id: newEntry.rep_id,
      rep_name: rep ? rep.name : (newEntry.rep_name || 'Unknown Rep'),
      date: newEntry.date || new Date().toISOString().split('T')[0],
      hours: hrs,
      pay_rate: payRate,
      bill_rate: billRate,
      rep_expense: repExpense,
      gross_revenue: grossRevenue,
      net_profit: netProfit,
      margin_percent: grossRevenue > 0 ? ((netProfit / grossRevenue) * 100).toFixed(1) : '0.0',
      status: newEntry.status || 'approved',
      created_at: new Date().toISOString()
    };

    saveEntity('payroll', payrollRecord);
  } catch (err) {
    console.warn("Could not auto-sync payroll record:", err);
  }

  return saved;
}

// Add email log
export function addEmailLog(log) {
  const newLog = {
    ...log,
    id: log.id || `el_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    sent_at: new Date().toISOString(),
    delivery_status: log.delivery_status || 'delivered'
  };
  return saveEntity('emailLogs', newLog);
}

// Reset database to empty collections and sync from Supabase
export function resetDB() {
  const emptyData = JSON.parse(JSON.stringify(EMPTY_SCHEMA));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyData));
  window.dispatchEvent(new Event('ids_pulse_db_update'));
  setTimeout(() => syncWithSupabase(), 100);
  return emptyData;
}

// Add a daily task
export function addDailyTask(task) {
  const newTask = {
    ...task,
    id: task.id || `dt_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    status: task.status || 'pending'
  };
  return saveEntity('dailyTasks', newTask);
}

// Add expense entry
export function addExpenseEntry(entry) {
  const newEntry = {
    ...entry,
    id: entry.id || `exp_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    created_at: new Date().toISOString()
  };
  return saveEntity('expenseEntries', newEntry);
}

// Get all rates
export function getRates() {
  const role = sessionStorage.getItem('ids_pulse_role');
  if (!['admin', 'accountant', 'lead', 'shahroz']?.includes(role)) {
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
    const newRate = { id: `rate_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`, ...rate };
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
      addEmailLog({
        incident_id: reqId,
        to_emails: 'greg.p@integritydriven.com',
        cc_emails: 'rep_assigned@integritydriven.com', // Would look up Rep's email in real system
        subject: `[OVERTIME ${actionText?.toUpperCase()}] Request ${reqId} by Customer`,
        body: `<h3>OVERTIME REQUEST ${actionText?.toUpperCase()}</h3><p>Customer user <strong>${user}</strong> has ${actionText?.toLowerCase()} the overtime request.</p><p><strong>Comment:</strong> ${comment}</p>`
      });
    }
    return saveExtraHoursRequest(req);
  }
  return null;
}

// Log a system event
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

// Add new project
export function addProject(proj) {
  const newProj = {
    id: `proj_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    ...proj,
    status: proj.status || 'Active'
  };
  saveEntity('projects', newProj);
  return newProj;
}
