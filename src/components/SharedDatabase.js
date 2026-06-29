// SharedDatabase.js
// Handles localStorage persistence and data synchronization.

const STORAGE_KEY = 'ids_pulse_db';

const SEED_DATA = {
  users: [
    { id: '1', name: 'Clarence Kuiken', email: 'clarence.k@integritydriven.com', role: 'rep', phone: '+1 905-914-2788', avatar: 'CK' },
    { id: '2', name: 'Donna Cabral', email: 'donna.c@integritydriven.com', role: 'lead', phone: '+1 905-555-0199', avatar: 'DC' },
    { id: '3', name: 'Greg Phillippe', email: 'greg.p@integritydriven.com', role: 'owner', phone: '+1 905-555-0100', avatar: 'GP' },
    { id: '4', name: 'Colleen Boyd', email: 'colleen.b@integritydriven.com', role: 'accountant', phone: '+1 905-555-0122', avatar: 'CB' }
  ],
  plants: [
    { id: 'gm_oshawa', name: 'GM Oshawa Plant', address: '900 Park Rd S, Oshawa, ON', oem_brand: 'GM' },
    { id: 'magna_autosystems', name: 'Magna AutoSystems', address: 'Belleville, ON', oem_brand: 'Magna' },
    { id: 'hutchinson', name: 'Hutchinson Plant', address: 'Mississauga, ON', oem_brand: 'Hutchinson' }
  ],
  suppliers: [
    { 
      id: 'magna', 
      name: 'Magna AutoSystems', 
      contacts: [
        { name: 'Shahroz Mirza', email: 'shahroz.m@magna.com', role: 'Quality Manager' },
        { name: 'Martin', email: 'martin.s@magna.com', role: 'Sequence Supervisor' }
      ],
      plants_served: ['gm_oshawa'] 
    },
    { 
      id: 'hutchinson', 
      name: 'Hutchinson Rubber', 
      contacts: [
        { name: 'Sarah Jenkins', email: 'sjenkins@hutchinson.ca', role: 'Supplier Quality Engineer' }
      ],
      plants_served: ['gm_oshawa'] 
    }
  ],
  parts: [
    { id: '86286761', part_number: '86286761', supplier_id: 'magna', description: 'Tail Light Assembly' },
    { id: '86291945', part_number: '86291945', supplier_id: 'magna', description: 'Headlight Housing (Matt\'s Bin Sort)' },
    { id: '86201945', part_number: '86201945', supplier_id: 'magna', description: 'Headlight Housing - Alt' }
  ],
  incidents: [
    {
      id: 'inc_1',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86286761',
      area: 'Scrap table at Sequence Area',
      description: 'Light on scrap table at sequence area for rattle. Spare bulb in housing again. Removed bulb and returned light to sequence area. Bulb was removed before scrap tag was written up. Please ensure all base lights do not have spare bulbs in housing causing rattling sound.',
      action_taken: 'Removed bulb, returned light to sequence area',
      supplier_contact: 'Martin',
      photos: [
        { id: 'ph_1', url: 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80', type: 'Wide shot (box label visible)', annotations: [] },
        { id: 'ph_2', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80', type: 'Close-up of defect', annotations: [{ type: 'arrow', x: 240, y: 180, label: 'Loose bulb causing rattle' }] }
      ],
      videos: [],
      audio_url: '',
      status: 'Closed',
      created_at: '2026-05-28T08:30:00Z',
      sent_at: '2026-05-28T08:35:00Z',
      concern_classification: 'PRR',
      defect_returned: 'N',
      sort_required: 'N',
      rma_required: 'N',
      defect_location_x: 0.30,
      defect_location_y: 0.50,
      part_view: 'top',
      parts_list: [
        {
          id: 'sp_seed_1',
          part_number: '86286761',
          description: 'Tail Light Assembly',
          supplier_id: 'magna',
          bin: 'BIN-MAG-6761',
          qty: 1
        }
      ]
    },
    {
      id: 'inc_2',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86286761',
      area: 'Scrap table at Sequence Area',
      description: 'Loose spare bulb rattling inside bulb housing left side.',
      action_taken: 'Removed bulb, returned to sequence',
      supplier_contact: 'Martin',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Closed',
      created_at: '2026-05-28T09:12:00Z',
      sent_at: '2026-05-28T09:15:00Z',
      concern_classification: 'PRR',
      defect_returned: 'N',
      sort_required: 'N',
      rma_required: 'N',
      defect_location_x: 0.31,
      defect_location_y: 0.52,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_2', part_number: '86286761', description: 'Tail Light Assembly', supplier_id: 'magna', bin: 'BIN-MAG-6761', qty: 1 }
      ]
    },
    {
      id: 'inc_3',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86286761',
      area: 'Online assembly',
      description: 'Gasket seal misaligned, creating outer gap on right edge.',
      action_taken: 'Realigned gasket',
      supplier_contact: 'Martin',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Open',
      created_at: '2026-05-28T14:40:00Z',
      sent_at: '2026-05-28T14:45:00Z',
      concern_classification: 'PRR',
      defect_returned: 'N',
      sort_required: 'N',
      rma_required: 'N',
      defect_location_x: 0.50,
      defect_location_y: 0.74,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_3', part_number: '86286761', description: 'Tail Light Assembly', supplier_id: 'magna', bin: 'BIN-MAG-6761', qty: 1 }
      ]
    },
    {
      id: 'inc_4',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86286761',
      area: 'Scrap table',
      description: 'Tail light left side bulb housing rattling. Spare bulb loose inside.',
      action_taken: 'Cleared bulb',
      supplier_contact: 'Martin',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Closed',
      created_at: '2026-06-01T10:05:00Z',
      sent_at: '2026-06-01T10:10:00Z',
      concern_classification: 'PRR',
      defect_returned: 'N',
      sort_required: 'N',
      rma_required: 'N',
      defect_location_x: 0.29,
      defect_location_y: 0.49,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_4', part_number: '86286761', description: 'Tail Light Assembly', supplier_id: 'magna', bin: 'BIN-MAG-6761', qty: 1 }
      ]
    },
    {
      id: 'inc_5',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86286761',
      area: 'Heavy repair',
      description: 'Outer lens gasket loose causing moisture leakage risk.',
      action_taken: 'Realigned gasket',
      supplier_contact: 'Martin',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Open',
      created_at: '2026-06-01T11:30:00Z',
      sent_at: '2026-06-01T11:35:00Z',
      concern_classification: 'PRR',
      defect_returned: 'N',
      sort_required: 'N',
      rma_required: 'N',
      defect_location_x: 0.52,
      defect_location_y: 0.73,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_5', part_number: '86286761', description: 'Tail Light Assembly', supplier_id: 'magna', bin: 'BIN-MAG-6761', qty: 1 }
      ]
    },
    {
      id: 'inc_6',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86291945',
      area: 'Sequence Area',
      description: 'Low beam bulb housing loose in reflector casing.',
      action_taken: 'Adjusted reflector clips',
      supplier_contact: 'Martin',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Closed',
      created_at: '2026-06-01T13:40:00Z',
      sent_at: '2026-06-01T13:45:00Z',
      concern_classification: 'QR',
      defect_returned: 'Y',
      sort_required: 'Y',
      rma_required: 'Y',
      defect_location_x: 0.65,
      defect_location_y: 0.50,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_6', part_number: '86291945', description: 'Headlight Housing (Matt\'s Bin Sort)', supplier_id: 'magna', bin: 'BIN-MAG-9145', qty: 1 }
      ]
    },
    {
      id: 'inc_7',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86291945',
      area: 'Online assembly',
      description: 'Bulb connector pins bent preventing headlight harness snap.',
      action_taken: 'Returned to supplier',
      supplier_contact: 'Martin',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Open',
      created_at: '2026-06-01T14:15:00Z',
      sent_at: '2026-06-01T14:20:00Z',
      concern_classification: 'PRR',
      defect_returned: 'Y',
      sort_required: 'N',
      rma_required: 'N',
      defect_location_x: 0.64,
      defect_location_y: 0.48,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_7', part_number: '86291945', description: 'Headlight Housing (Matt\'s Bin Sort)', supplier_id: 'magna', bin: 'BIN-MAG-9145', qty: 1 }
      ]
    }
  ],
  shiftReports: [
    {
      id: 'sr_1',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      date: '2026-05-28',
      areas_walked: [
        { name: 'Online assembly', status: 'no_issues', contact: 'T/L and installers', notes: 'Checked with team leader and installers on line.' },
        { name: 'Sequence area', status: 'issues', contact: 'Martin', notes: 'Found rattling tail light. See incident inc_1.' },
        { name: 'Heavy repair', status: 'no_issues', contact: 'Martin', notes: 'Checked all heavy repair bays.' },
        { name: 'Scrap tables', status: 'issues', contact: 'Martin', notes: 'Reworked tail light on scrap table.' }
      ],
      incidents_count: 1,
      bonus_tasks: [
        { task: 'Matt\'s bin check audit on PN 86291945', status: 'completed', notes: 'Checked bin audit request. No issues found.' }
      ],
      status: 'Sent',
      sent_at: '2026-05-28T17:30:00Z'
    }
  ],
  reworkLogs: [
    {
      id: 'rw_1',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86286761',
      qty: 1,
      time_spent_minutes: 5,
      notes: 'Removed loose bulb from tail light housing to eliminate rattle.',
      created_at: '2026-05-28T08:31:00Z'
    }
  ],
  timeEntries: [
    {
      id: 'te_1',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      date: '2026-05-28',
      hours: 9,
      mileage_km: 45,
      notes: 'Standard day shift. Conducted area walks, sorted Matt\'s bin request, reworked one tail light.'
    }
  ],
  emailLogs: [
    {
      id: 'el_1',
      incident_id: 'inc_1',
      to_emails: 'martin.s@magna.com, shahroz.m@magna.com',
      cc_emails: 'donna.c@integritydriven.com, greg.p@integritydriven.com',
      subject: '[INCIDENT] PN 86286761 | Scrap table at Sequence Area | GM Oshawa Plant | 2026-05-28',
      body: `<h3>INCIDENT REPORT — IDS PULSE</h3>
<p><strong>Date:</strong> 2026-05-28<br>
<strong>Plant:</strong> GM Oshawa Plant<br>
<strong>Rep:</strong> Clarence Kuiken</p>
<hr/>
<p><strong>Part Number Affected:</strong> 86286761 (Tail Light Assembly)<br>
<strong>Supplier:</strong> Magna AutoSystems<br>
<strong>Area Found:</strong> Scrap table at Sequence Area</p>
<hr/>
<p><strong>Defect Description:</strong> Light on scrap table at sequence area for rattle. Spare bulb in housing again. Removed bulb and returned light to sequence area. Bulb was removed before scrap tag was written up. Please ensure all base lights do not have spare bulbs in housing causing rattling sound.</p>
<p><strong>Action Taken:</strong> Removed bulb, returned light to sequence area<br>
<strong>Supplier Contact:</strong> Martin</p>
<hr/>
<p><strong>Traceability / Magna Spec:</strong><br>
- Defect Returned to Supplier: N<br>
- Sort Required: N<br>
- RMA Required: N<br>
- Classification: PRR</p>
<p><strong>Photos Sent:</strong> 2 photos attached. Drawing annotations present on close-up shot.</p>`,
      sent_at: '2026-05-28T08:35:00Z',
      delivery_status: 'delivered'
    }
  ],
  dailyTasks: [
    { id: 'dt_1', rep_id: '1', date: '2026-05-28', task: 'Verify Magna tail light rattles on sequence line', status: 'completed' },
    { id: 'dt_2', rep_id: '1', date: '2026-05-28', task: "Conduct Matt's bin sorting audit request on PN 86291945", status: 'completed' },
    { id: 'dt_3', rep_id: '1', date: '2026-06-01', task: 'Verify sequence area scrap bins are empty and tagged', status: 'pending' },
    { id: 'dt_4', rep_id: '1', date: '2026-06-01', task: 'Inspect scrap tables for bulb rattles', status: 'pending' },
    { id: 'dt_5', rep_id: '1', date: '2026-06-01', task: 'Submit end-of-shift walkthrough checklist', status: 'pending' }
  ],
  expenseEntries: [
    {
      id: 'exp_1',
      rep_id: '1',
      date: '2026-06-03',
      category: 'Fuel',
      amount: 45.50,
      receipt_photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
      notes: 'Fuel fill-up for GM Oshawa site travel.'
    }
  ]
};

// Initialize database in localStorage
export function initializeDB() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
    return SEED_DATA;
  }
  return JSON.parse(existing);
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

// Get entities helper
export function getEntities(type) {
  const db = getDB();
  return db[type] || [];
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
  return entity;
}

// Add user
export function addUser(user) {
  const newUser = { id: `usr_${Date.now()}`, ...user, created_at: new Date().toISOString() };
  return saveEntity('users', newUser);
}

// Add incident
export function addIncident(incident) {
  const newIncident = {
    id: `inc_${Date.now()}`,
    status: 'Open',
    created_at: new Date().toISOString(),
    ...incident
  };
  return saveEntity('incidents', newIncident);
}

// Add shift report
export function addShiftReport(report) {
  const newReport = {
    id: `sr_${Date.now()}`,
    status: 'Draft',
    created_at: new Date().toISOString(),
    ...report
  };
  return saveEntity('shiftReports', newReport);
}

// Add rework log
export function addReworkLog(log) {
  const newLog = {
    id: `rw_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...log
  };
  return saveEntity('reworkLogs', newLog);
}

// Add time entry
export function addTimeEntry(entry) {
  const newEntry = {
    id: `te_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...entry
  };
  return saveEntity('timeEntries', newEntry);
}

// Add email log
export function addEmailLog(log) {
  const newLog = {
    id: `el_${Date.now()}`,
    sent_at: new Date().toISOString(),
    delivery_status: 'delivered',
    ...log
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
    id: `dt_${Date.now()}`,
    status: 'pending',
    ...task
  };
  return saveEntity('dailyTasks', newTask);
}

// Add expense entry
export function addExpenseEntry(entry) {
  const newEntry = {
    id: `exp_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...entry
  };
  return saveEntity('expenseEntries', newEntry);
}

