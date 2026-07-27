import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const STORAGE_KEY = 'ids_pulse_db';
const DB_VERSION_KEY = 'ids_pulse_db_version';
const CURRENT_DB_VERSION = 'v3.0.0_100pct_clean_production';

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
  { id: '24', name: 'Donna Cabral', email: 'dcabral@integritydriven.com', username: 'donna', phone: '+1 (416) 555-0024', role: 'lead', title: 'Operations Lead Supervisor', pay_currency: 'CAD', avatar: 'DC' },
  { id: 'owner_1', name: 'Greg Phillippe', email: 'gphillippe@integritydriven.com', username: 'greg', phone: '+1 (416) 555-0001', role: 'owner', title: 'Managing Director / Owner', pay_currency: 'CAD', avatar: 'GP' },
  { id: 'acct_1', name: 'Colleen Boyd', email: 'cboyd@integritydriven.com', username: 'colleen', phone: '+1 (416) 555-0002', role: 'accountant', title: 'Financial Accountant / Controller', pay_currency: 'CAD', avatar: 'CB' },
  { id: 'admin_1', name: 'Shahroz Mirza', email: 'smirza@integritydriven.com', username: 'shahroz', phone: '+1 (416) 555-0000', role: 'admin', title: 'System Super Admin', pay_currency: 'CAD', avatar: 'SM' },
  { id: 'lead_diana', name: 'Diana Operations Lead', email: 'diana@goto-ids.com', username: 'diana', phone: '+1 (416) 555-0088', role: 'lead', title: 'Operations Lead Supervisor', pay_currency: 'CAD', avatar: 'DL' },
  { id: 'rep_clarence', name: 'Clarence Kuiken', email: 'ckuiken@integritydriven.com', username: 'clarence', phone: '+1 (416) 555-0099', role: 'rep', title: 'Quality Inspector', pay_currency: 'CAD', avatar: 'CK' }
];

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
        const essentialIds = ['24', 'owner_1', 'acct_1', 'admin_1', 'lead_diana'];
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
        await supabase.from('users').upsert(admin).catch(e => console.error("Admin seed error:", e));
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
  const role = (user.role || '').toLowerCase();
  const title = (user.title || '').toLowerCase();
  return role === 'rep' || role === 'qre' || title.includes('rep') || title.includes('quality') || title.includes('inspector') || title.includes('engineer');
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
  const authRole = roleOverride || 'rep';
  const role = roleOverride || 'rep';
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
        if (col === 'suppliers' || col === 'rates' || col === 'users' || col === 'plants' || col === 'systemLogs' || col === 'extraHoursRequests') {
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

// Flush offline queue to Supabase when back online
export async function flushOfflineQueue() {
  const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
  if (queue.length === 0) return;

  const failedQueue = [];
  for (const item of queue) {
    const targetTable = getSupabaseTableName(item.type);
    try {
      const { error } = await supabase.from(targetTable).upsert(item.entity);
      if (error) {
        console.error(`[Offline Sync Error] ${targetTable}:`, error.message);
        failedQueue.push(item);
      }
    } catch (err) {
      console.error(`[Offline Sync Exception] ${item.type}:`, err);
      failedQueue.push(item);
    }
  }

  localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(failedQueue));
}

// Get the entire database
export function getDB() {
  return initializeDB();
}

// Save database
export function saveDB(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('ids_pulse_db_update'));
}

// Get entities helper
export function getEntities(type) {
  const db = getDB();
  let entities = db[type] || [];

  const role = sessionStorage.getItem('ids_pulse_role') || 'admin';
  const customerId = sessionStorage.getItem('ids_pulse_customer_id') || '';
  const repId = sessionStorage.getItem('ids_pulse_rep_id') || '';

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

  return entities;
}

// Save entity helper
export function saveEntity(type, entity) {
  const db = getDB();
  if (!db[type]) db[type] = [];
  
  const index = db[type].findIndex(item => String(item.id) === String(entity.id));
  if (index >= 0) {
    db[type][index] = { ...db[type][index], ...entity };
  } else {
    db[type].push(entity);
  }
  
  saveDB(db);

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
    queue.push({ type, entity, timestamp: new Date().toISOString() });
    localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
  } else {
    const targetTable = getSupabaseTableName(type);
    if (type === 'systemLogs' || targetTable === 'system_logs') {
      supabase.from(targetTable).upsert(entity).catch(() => {});
      return entity;
    }

    supabase.from(targetTable).upsert(entity).then(({ error }) => {
      if (error) {
        console.error(`[Supabase Cloud Upsert Error] Table "${targetTable}":`, error.message);
        const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
        if (!queue.some(item => String(item.entity?.id) === String(entity.id))) {
          queue.push({ type, entity, timestamp: new Date().toISOString(), lastError: error.message });
          localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
        }
        window.dispatchEvent(new CustomEvent('ids_pulse_toast', { detail: { message: `Cloud Write Warning on ${type}: ${error.message}`, type: 'warning' } }));
      }
    }).catch(err => {
      console.error(`[Supabase Cloud Upsert Exception] Table "${targetTable}":`, err);
      const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
      if (!queue.some(item => String(item.entity?.id) === String(entity.id))) {
        queue.push({ type, entity, timestamp: new Date().toISOString(), lastError: err.message });
        localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
      }
    });
  }

  return entity;
}

export function addUser(user) {
  const newUser = { ...user, id: user.id || `usr_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`, created_at: new Date().toISOString() };
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

  supabase.from('rates').upsert(finalRate).catch(() => {});
  return finalRate;
}

export function deleteRate(rateId) {
  const db = getDB();
  if (!db.rates) return;
  db.rates = db.rates.filter(r => r.id !== rateId);
  saveDB(db);
  supabase.from('rates').delete().eq('id', rateId).catch(() => {});
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
      addEmailLog({
        incident_id: reqId,
        to_emails: 'greg.p@integritydriven.com',
        cc_emails: 'rep_assigned@integritydriven.com',
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
