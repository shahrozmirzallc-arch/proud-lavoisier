// SharedDatabase.js
// Handles localStorage persistence and data synchronization.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL || 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1cXFyY293em5ybW11b2tmeGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NjA4NDQsImV4cCI6MjA5OTEzNjg0NH0.PHh-oLwXbPXkUxqwzBoyLceYD1HPelsoszy-f43Y-4I';

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

  let updated = false;

  // Auto-seed baseline data if collections are empty
  if (!data.users || data.users.length === 0) {
    data.users = [
      { id: '1', name: 'Clarence Kuiken', email: 'ckuiken@integritydriven.com', phone: '+1 (416) 555-0144', role: 'rep', title: 'Lead Senior Quality Inspector', pay_currency: 'CAD', avatar: 'CK' },
      { id: '2', name: 'Hugo Ramos', email: 'hramos@integritydriven.com', phone: '+1 (416) 555-0288', role: 'qre', title: 'Quality Resident Engineer', pay_currency: 'USD', avatar: 'HR' },
      { id: '3', name: 'Nabil El-Sabagh', email: 'nel-sabagh@integritydriven.com', phone: '+1 (416) 555-0811', role: 'qre', title: 'Quality Resident Engineer', pay_currency: 'USD', avatar: 'NE' },
      { id: '4', name: 'Rogelio Gutierrez', email: 'rgutierrez@integritydriven.com', phone: '+1 (416) 555-0377', role: 'qre', title: 'Quality Resident Engineer', pay_currency: 'USD', avatar: 'RG' },
      { id: '24', name: 'Donna Cabral', email: 'dcabral@integritydriven.com', phone: '+1 (416) 555-0024', role: 'lead', title: 'Operations Lead Supervisor', pay_currency: 'CAD', avatar: 'DC' },
      { id: 'owner_1', name: 'Greg Phillippe', email: 'gphillippe@integritydriven.com', phone: '+1 (416) 555-0001', role: 'owner', title: 'Managing Director / Owner', pay_currency: 'CAD', avatar: 'GP' },
      { id: 'acct_1', name: 'Colleen Boyd', email: 'cboyd@integritydriven.com', phone: '+1 (416) 555-0002', role: 'accountant', title: 'Financial Accountant / Controller', pay_currency: 'CAD', avatar: 'CB' },
      { id: 'admin_1', name: 'Shahroz Mirza', email: 'smirza@integritydriven.com', phone: '+1 (416) 555-0000', role: 'admin', title: 'System Super Admin', pay_currency: 'CAD', avatar: 'SM' }
    ];
    updated = true;
  }

  if (!data.suppliers || data.suppliers.length === 0) {
    data.suppliers = [
      { id: 'autokabel', name: 'AutoKabel North America', allotted_hours: 40, invoice_schedule: 'weekly', contacts: [{ name: 'Juan Carlos', email: 'jc@autokabel.mx' }], plants_served: ['autokabel_windsor', 'autokabel_dearborn'] },
      { id: 'magna', name: 'Magna International', allotted_hours: 80, invoice_schedule: 'weekly', contacts: [{ name: 'Dave Smith', email: 'dave.smith@magna.com' }], plants_served: ['magna_brampton', 'gm_oshawa'] },
      { id: 'brose', name: 'Brose North America', allotted_hours: 50, invoice_schedule: 'bi-weekly', contacts: [{ name: 'Marcus Brose', email: 'm.brose@brose.com' }], plants_served: ['brose_mexico'] },
      { id: 'lear', name: 'Lear Corporation', allotted_hours: 30, invoice_schedule: 'on-demand', contacts: [{ name: 'Sarah Miller', email: 'smiller@lear.com' }], plants_served: ['lear_tuscaloosa'] }
    ];
    updated = true;
  }

  if (!data.plants || data.plants.length === 0) {
    data.plants = [
      { id: 'gm_oshawa', name: 'GM Oshawa Staging Facility', oem_brand: 'GM', supplier_id: 'magna', address: 'Oshawa, ON (Plant 4)' },
      { id: 'autokabel_windsor', name: 'AutoKabel Windsor Facility', oem_brand: 'Ford', supplier_id: 'autokabel', address: 'Windsor, ON' },
      { id: 'magna_brampton', name: 'Magna Brampton Stamping', oem_brand: 'Stellantis', supplier_id: 'magna', address: 'Brampton, ON' },
      { id: 'brose_mexico', name: 'Brose Queretaro Plant', oem_brand: 'BMW', supplier_id: 'brose', address: 'Queretaro, MX' },
      { id: 'lear_tuscaloosa', name: 'Lear Tuscaloosa Plant', oem_brand: 'Mercedes-Benz', supplier_id: 'lear', address: 'Tuscaloosa, AL' }
    ];
    updated = true;
  }

  if (!data.rates || data.rates.length === 0) {
    data.rates = [
      { id: 'rate_1', rep_id: '1', supplier_id: 'magna', plant_id: 'gm_oshawa', pay_rate: 25.00, billing_rate: 35.00, currency: 'CAD' },
      { id: 'rate_2', rep_id: '2', supplier_id: 'autokabel', plant_id: 'autokabel_windsor', pay_rate: 28.00, billing_rate: 42.00, currency: 'USD' },
      { id: 'rate_3', rep_id: '3', supplier_id: 'brose', plant_id: 'brose_mexico', pay_rate: 26.00, billing_rate: 38.00, currency: 'USD' },
      { id: 'rate_4', rep_id: '4', supplier_id: 'lear', plant_id: 'lear_tuscaloosa', pay_rate: 27.00, billing_rate: 40.00, currency: 'USD' }
    ];
    updated = true;
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

        // NATIVE RLS SERVER-SIDE READ QUERIES WITH IDENTITY SCOPING
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
          const { data: defaultData, error: defaultErr } = await query;
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

          if (role === 'customer') {
            const custId = (customerId || '').toLowerCase();
            data = data.filter(u => {
              const uId = (u.id || '').toLowerCase();
              const uName = (u.username || '').toLowerCase();
              return custId && (uId === custId || uName === custId || uId.includes(custId) || uName.includes(custId));
            });
          } else if (role === 'rep') {
            const rId = (repId || '').toLowerCase();
            data = data.filter(u => {
              const uId = (u.id || '').toLowerCase();
              const uName = (u.username || '').toLowerCase();
              return uId === rId || uName === rId;
            });
          }
        }

        if (col === 'suppliers') {
          if (role === 'customer') {
            const custId = customerId || '';
            data = (data || []).filter(s => {
              const sId = (s.id || '').toLowerCase();
              const cId = custId.toLowerCase();
              return sId === cId || sId.includes(cId) || cId.includes(sId);
            });
          } else if (role === 'rep') {
            const projs = getEntities('projects') || [];
            const incs = getEntities('incidents') || [];
            const rId = (repId || '').toLowerCase();
            const repProjs = projs.filter(pr => (pr.rep_id || '').toLowerCase() === rId);
            const repIncs = incs.filter(inc => (inc.rep_id || '').toLowerCase() === rId);
            const assignedClientIds = new Set([
              ...repProjs.map(pr => (pr.supplier_id || pr.client_id || '').toLowerCase()),
              ...repIncs.map(inc => (inc.supplier_id || inc.client_id || '').toLowerCase())
            ].filter(Boolean));

            data = (data || []).filter(s => {
              const sId = (s.id || '').toLowerCase();
              const sName = (s.name || '').toLowerCase();
              return assignedClientIds.has(sId) || Array.from(assignedClientIds).some(cid => cid && (sId.includes(cid) || sName.includes(cid)));
            });
          }
        }

        if (col === 'plants') {
          if (role === 'customer') {
            const custId = (customerId || '').toLowerCase();
            const supps = getEntities('suppliers') || [];
            const mySupp = supps.find(s => (s.id || '').toLowerCase() === custId || (s.name || '').toLowerCase().includes(custId));
            const servedPlants = mySupp && Array.isArray(mySupp.plants_served) ? mySupp.plants_served.map(p => (p || '').toLowerCase()) : [];
            data = (data || []).filter(p => {
              const pName = (p.name || '').toLowerCase();
              const pId = (p.id || '').toLowerCase();
              return servedPlants.some(sp => pName.includes(sp) || sp.includes(pName) || pId.includes(sp));
            });
          } else if (role === 'rep') {
            const projs = getEntities('projects') || [];
            const repProjs = projs.filter(pr => pr.rep_id === repId);
            const plantIds = repProjs.map(pr => (pr.plant_id || '').toLowerCase());
            data = (data || []).filter(p => plantIds.includes((p.id || '').toLowerCase()) || plantIds.includes((p.name || '').toLowerCase()));
          }
        }

        if (col === 'systemLogs') {
          if (!isAdmin) {
            data = [];
          }
        }

        if (col === 'projects') {
          data = (data || []).map(p => {
            if (!isAdmin) {
              const { billing_rate, pay_rate, ...cleanProj } = p;
              return cleanProj;
            }
            return p;
          });
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

// Flush Offline Queue & Outboxes (P0-3 Offline Recovery)
export async function flushOfflineQueue() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;

  const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
  const outboxV2 = JSON.parse(localStorage.getItem('ids_pulse_sqlite_outbox_v2') || '[]');
  
  const allOfflineItems = [...queue, ...outboxV2];
  if (allOfflineItems.length === 0) return;

  console.log(`[Online Recovery] Flushing ${allOfflineItems.length} items from durable outboxes...`);
  const failedQueue = [];
  const failedV2 = [];

  for (const item of queue) {
    try {
      const tableName = getSupabaseTableName(item.type || 'incidents');
      const payload = item.entity || item;
      const { error } = await supabase.from(tableName).upsert(payload);
      if (error) {
        console.error(`[Recovery Error] ${tableName}:`, error.message);
        failedQueue.push(item);
      }
    } catch (err) {
      console.error(`[Recovery Exception] ${item.type}:`, err);
      failedQueue.push(item);
    }
  }

  for (const item of outboxV2) {
    try {
      const tableName = getSupabaseTableName(item.type || 'incidents');
      const payload = item.entity || item;
      const { error } = await supabase.from(tableName).upsert(payload);
      if (error) {
        console.error(`[Recovery V2 Error] ${tableName}:`, error.message);
        failedV2.push(item);
      }
    } catch (err) {
      console.error(`[Recovery V2 Exception] ${item.type}:`, err);
      failedV2.push(item);
    }
  }

  localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(failedQueue));
  localStorage.setItem('ids_pulse_sqlite_outbox_v2', JSON.stringify(failedV2));

  if (failedQueue.length === 0 && failedV2.length === 0) {
    console.log('[Online Recovery] Complete. All offline outboxes cleared.');
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
    const authRole = sessionStorage.getItem('ids_pulse_authenticated_role') || role;
    const isAdmin = ['admin', 'owner', 'accountant', 'lead', 'shahroz']?.includes(authRole);

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

    // Gracefully handle system_logs / telemetry telemetry without queue pollution
    if (type === 'systemLogs' || targetTable === 'system_logs') {
      Promise.resolve(supabase.from(targetTable).upsert(entity)).catch(() => {});
      return entity;
    }

    Promise.resolve(supabase.from(targetTable).upsert(entity))
      .then(({ error }) => {
        if (error) {
          console.warn(`[Supabase Push Info] table "${targetTable}":`, error.message);
          const queue = JSON.parse(localStorage.getItem('ids_pulse_offline_queue') || '[]');
          queue.push({ type, entity, timestamp: new Date().toISOString() });
          localStorage.setItem('ids_pulse_offline_queue', JSON.stringify(queue));
          window.dispatchEvent(new CustomEvent('ids_pulse_sync_error', { detail: { table: targetTable, message: error.message } }));
        }
      })
      .catch(err => {
        console.warn(`[Supabase Push Exception] table "${type}":`, err);
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
  const dbRates = getEntities('rates') || [];
  const rateMatch = dbRates.find(r => r && (r.supplier_id === entry.supplier_id || r.client_id === entry.supplier_id) && (r.rep_id === entry.rep_id || !r.rep_id) && (!entry.plant_id || r.plant_id === entry.plant_id))
    || dbRates.find(r => r && (r.supplier_id === entry.supplier_id || r.client_id === entry.supplier_id));

  const billRate = (entry.billing_rate !== undefined && entry.billing_rate !== null)
    ? parseFloat(entry.billing_rate)
    : (rateMatch && rateMatch.billing_rate ? parseFloat(rateMatch.billing_rate) : 0.00);

  const payRate = (entry.pay_rate !== undefined && entry.pay_rate !== null)
    ? parseFloat(entry.pay_rate)
    : (rateMatch && rateMatch.pay_rate ? parseFloat(rateMatch.pay_rate) : 0.00);

  const newEntry = {
    ...entry,
    id: entry.id || `te_${Date.now()}_${Math.random().toString(36)?.substring(2, 7)}`,
    billing_rate: billRate,
    pay_rate: payRate,
    created_at: entry.created_at || new Date().toISOString()
  };

  const saved = saveEntity('timeEntries', newEntry);

  // Auto-sync Rep Payroll Ledger using the authoritative rate snapshot
  try {
    const dbUsers = getEntities('users') || [];
    const rep = dbUsers.find(u => u.id === newEntry.rep_id);
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
      gross_revenue: grossRevenue,
      rep_expense: repExpense,
      net_profit: netProfit,
      created_at: new Date().toISOString()
    };
    saveEntity('payrollLedger', payrollRecord);
  } catch (err) {
    console.warn("Payroll ledger auto-sync info:", err.message);
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
