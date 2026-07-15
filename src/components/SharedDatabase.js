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
    { id: 'rate_rogelio', rep_id: 'rep_rogelio', supplier_id: 'autokabel', plant_id: 'gm_slp', billing_rate: 28.00, pay_rate: 18.56 }
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
      id: 'magna', 
      name: 'Magna AutoSystems', 
      invoice_schedule: 'weekly',
      allotted_hours: 45,
      contacts: [
        { name: 'Shahroz Mirza', email: 'shahroz.m@magna.com', role: 'Quality Manager' },
        { name: 'Martin', email: 'martin.s@magna.com', role: 'Sequence Supervisor' }
      ],
      plants_served: ['gm_oshawa'] 
    },
    { 
      id: 'hutchinson', 
      name: 'Hutchinson Rubber', 
      invoice_schedule: 'monthly',
      allotted_hours: 30,
      contacts: [
        { name: 'Sarah Jenkins', email: 'sjenkins@hutchinson.ca', role: 'Supplier Quality Engineer' }
      ],
      plants_served: ['gm_oshawa'] 
    },
    {
      id: 'autokabel',
      name: 'Auto Kabel de Mexico S.A. de C.V',
      invoice_schedule: 'weekly',
      allotted_hours: 50,
      contacts: [
        { name: 'Juan Carlos', email: 'jc@autokabel.mx', role: 'Plant Quality Manager' }
      ],
      plants_served: ['mercedes_tuscaloosa', 'ford_dearborn', 'gm_slp']
    },
    {
      id: 'brose',
      name: 'Brose México S.A. de C.V.',
      invoice_schedule: 'weekly',
      allotted_hours: 40,
      contacts: [
        { name: 'Maria Gomez', email: 'mg@brose.mx', role: 'Supplier Quality Manager' }
      ],
      plants_served: ['gm_slp']
    },
    {
      id: 'borgwarner',
      name: 'BorgWarner PDS Irapuato',
      invoice_schedule: 'monthly',
      allotted_hours: 35,
      contacts: [
        { name: 'Alejandro', email: 'al@borgwarner.com', role: 'Supplier Quality Engineer' }
      ],
      plants_served: ['gm_slp']
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
    },
    {
      id: 'inc_8',
      rep_id: 'rep_hugo',
      plant_id: 'mercedes_tuscaloosa',
      supplier_id: 'autokabel',
      part_id: '86286761',
      area: 'Mercedes Assembly Line 4',
      description: 'Insulation gap discovered on primary battery cable sheath. Standard gauge wire exposed.',
      action_taken: 'Placed parts in containment bin, flagged Mercedes quality auditor, notified Auto Kabel supervisor.',
      supplier_contact: 'Juan Carlos',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Open',
      created_at: '2026-07-01T09:30:00Z',
      sent_at: '2026-07-01T09:35:00Z',
      concern_classification: 'PRR',
      defect_returned: 'N',
      sort_required: 'Y',
      rma_required: 'N',
      defect_location_x: 0.45,
      defect_location_y: 0.60,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_8', part_number: '86286761', description: 'Tail Light Assembly', supplier_id: 'autokabel', bin: 'BIN-AK-6761', qty: 1 }
      ]
    },
    {
      id: 'inc_9',
      rep_id: 'rep_nabil',
      plant_id: 'ford_dearborn',
      supplier_id: 'autokabel',
      part_id: '86291945',
      area: 'Harness Sequencing Bay',
      description: 'Bent electrical connector pins on wiring harnesses preventing positive locking.',
      action_taken: 'Initiated 100% sort of containment rack. Rejected 6 bad harnesses.',
      supplier_contact: 'Juan Carlos',
      photos: [],
      videos: [],
      audio_url: '',
      status: 'Closed',
      created_at: '2026-07-02T11:15:00Z',
      sent_at: '2026-07-02T11:20:00Z',
      concern_classification: 'QR',
      defect_returned: 'Y',
      sort_required: 'Y',
      rma_required: 'Y',
      defect_location_x: 0.55,
      defect_location_y: 0.40,
      part_view: 'top',
      parts_list: [
        { id: 'sp_seed_9', part_number: '86291945', description: 'Headlight Housing (Matt\'s Bin Sort)', supplier_id: 'autokabel', bin: 'BIN-AK-9145', qty: 6 }
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
        { name: 'Review Scrap Table', status: 'issues', contact: 'Martin', notes: 'Reworked tail light on scrap table.' }
      ],
      incidents_count: 1,
      bonus_tasks: [
        { task: 'Matt\'s bin check audit on PN 86291945', status: 'completed', notes: 'Checked bin audit request. No issues found.' }
      ],
      status: 'Sent',
      sent_at: '2026-05-28T17:30:00Z'
    },
    {
      id: 'sr_2',
      rep_id: 'rep_hugo',
      plant_id: 'mercedes_tuscaloosa',
      date: '2026-07-01',
      areas_walked: [
        { name: 'Mercedes Assembly Line 4', status: 'issues', contact: 'Juan Carlos', notes: 'Found battery cable insulation gap. See incident inc_8.' },
        { name: 'Parts sequencing area', status: 'no_issues', contact: 'Juan Carlos', notes: 'Checked wire racks. All tagged correctly.' }
      ],
      incidents_count: 1,
      bonus_tasks: [
        { task: 'Verify line stock tags', status: 'completed', notes: 'All tags current.' }
      ],
      status: 'Sent',
      sent_at: '2026-07-01T17:45:00Z'
    },
    {
      id: 'sr_3',
      rep_id: 'rep_nabil',
      plant_id: 'ford_dearborn',
      date: '2026-07-02',
      areas_walked: [
        { name: 'Harness Sequencing Bay', status: 'issues', contact: 'Juan Carlos', notes: 'Bent electrical connector pins. See incident inc_9.' },
        { name: 'Scrap table', status: 'no_issues', contact: 'Juan Carlos', notes: 'Scrap table verified clear.' }
      ],
      incidents_count: 1,
      bonus_tasks: [
        { task: 'Audit containment rack logs', status: 'completed', notes: 'Containment rack logs verified and matches DB counts.' }
      ],
      status: 'Sent',
      sent_at: '2026-07-02T16:50:00Z'
    },
    {
      id: 'sr_4',
      rep_id: 'rep_rogelio',
      plant_id: 'gm_slp',
      date: '2026-07-02',
      areas_walked: [
        { name: 'Engine Room Line', status: 'issues', contact: 'Juan Carlos', notes: 'Assisted in wiring harness sort. High density sorting completed.' },
        { name: 'Scrap table', status: 'no_issues', contact: 'Juan Carlos', notes: 'Scrap table verified.' }
      ],
      incidents_count: 0,
      bonus_tasks: [
        { task: 'Pre-check next shift parts', status: 'completed', notes: 'Next shift parts pre-checked.' }
      ],
      status: 'Sent',
      sent_at: '2026-07-02T18:15:00Z'
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
    },
    {
      id: 'rw_2',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      part_id: '86286761',
      qty: 12,
      time_spent_minutes: 60,
      notes: 'Sorted 12 light housings, verified gasket seal alignment.',
      created_at: '2026-07-02T10:00:00Z'
    },
    {
      id: 'rw_3',
      rep_id: 'rep_hugo',
      plant_id: 'mercedes_tuscaloosa',
      supplier_id: 'autokabel',
      part_id: '86286761',
      qty: 45,
      time_spent_minutes: 180,
      notes: 'Reworked copper connectors on 45 Auto Kabel harnesses to Mercedes specifications.',
      created_at: '2026-07-01T15:30:00Z'
    },
    {
      id: 'rw_4',
      rep_id: 'rep_rogelio',
      plant_id: 'gm_slp',
      supplier_id: 'brose',
      part_id: '86291945',
      qty: 90,
      time_spent_minutes: 240,
      notes: 'Full sort of Brose door regulator brackets. Identified 4 loose brackets.',
      created_at: '2026-07-02T14:00:00Z'
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
      notes: 'Standard day shift. Conducted area walks, sorted Matt\'s bin request, reworked one tail light.',
      invoiced: false,
      sent_to_payroll: false
    },
    {
      id: 'te_2',
      rep_id: '1',
      plant_id: 'gm_oshawa',
      supplier_id: 'magna',
      date: '2026-07-02',
      hours: 8.5,
      mileage_km: 45,
      notes: 'Regular audit on sequence racks. Checked bulb rattle issue.',
      invoiced: false,
      sent_to_payroll: false
    },
    {
      id: 'te_3',
      rep_id: 'rep_hugo',
      plant_id: 'mercedes_tuscaloosa',
      supplier_id: 'autokabel',
      date: '2026-07-01',
      hours: 10.0,
      mileage_km: 85,
      notes: 'Containment line sort for SWG insulation gaps. Required overtime support.',
      invoiced: false,
      sent_to_payroll: false
    },
    {
      id: 'te_4',
      rep_id: 'rep_hugo',
      plant_id: 'mercedes_tuscaloosa',
      supplier_id: 'autokabel',
      date: '2026-07-02',
      hours: 8.0,
      mileage_km: 85,
      notes: 'Inspected wire rack components at Mercedes assembly Line 4.',
      invoiced: false,
      sent_to_payroll: false
    },
    {
      id: 'te_5',
      rep_id: 'rep_nabil',
      plant_id: 'ford_dearborn',
      supplier_id: 'autokabel',
      date: '2026-07-02',
      hours: 8.0,
      mileage_km: 32,
      notes: 'Quality walk at Ford Dearborn plant. Verified tag compliance.',
      invoiced: false,
      sent_to_payroll: false
    },
    {
      id: 'te_6',
      rep_id: 'rep_nabil',
      plant_id: 'ford_dearborn',
      supplier_id: 'autokabel',
      date: '2026-07-03',
      hours: 9.5,
      mileage_km: 32,
      notes: 'Assisted in rework containment of tail light harness assemblies.',
      invoiced: false,
      sent_to_payroll: false
    },
    {
      id: 'te_7',
      rep_id: 'rep_rogelio',
      plant_id: 'gm_slp',
      supplier_id: 'autokabel',
      date: '2026-07-02',
      hours: 11.0,
      mileage_km: 60,
      notes: 'Supported GM SLP engine room wiring harness sort. High urgency shift.',
      invoiced: false,
      sent_to_payroll: false
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
    { id: 'dt_4', rep_id: '1', date: '2026-06-01', task: 'Review Scrap Table for bulb rattles', status: 'pending' },
    { id: 'dt_5', rep_id: '1', date: '2026-06-01', task: 'Submit end-of-shift walkthrough checklist', status: 'pending' }
  ],
  expenseEntries: [
    {
      id: 'exp_1',
      rep_id: '1',
      supplier_id: 'magna',
      date: '2026-06-03',
      category: 'Fuel',
      amount: 45.50,
      receipt_photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
      notes: 'Fuel fill-up for GM Oshawa site travel.',
      invoiced: false,
      sent_to_payroll: false,
      status: 'approved'
    },
    {
      id: 'exp_2',
      rep_id: 'rep_hugo',
      supplier_id: 'autokabel',
      date: '2026-07-02',
      category: 'Tolls',
      amount: 15.00,
      receipt_photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
      notes: 'Highway toll receipts for Tuscaloosa quality walk.',
      invoiced: false,
      sent_to_payroll: false,
      status: 'approved'
    },
    {
      id: 'exp_3',
      rep_id: 'rep_nabil',
      supplier_id: 'autokabel',
      date: '2026-07-03',
      category: 'Meals',
      amount: 28.50,
      receipt_photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
      notes: 'Overtime dinner support during containment sort.',
      invoiced: false,
      sent_to_payroll: false,
      status: 'pending'
    },
    {
      id: 'exp_4',
      rep_id: 'rep_rogelio',
      supplier_id: 'autokabel',
      date: '2026-07-02',
      category: 'Safety Gear',
      amount: 75.00,
      receipt_photo: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80',
      notes: 'Replacement steel-toe safety shoes for SLP floor audit.',
      invoiced: false,
      sent_to_payroll: false,
      status: 'approved'
    }
  ],
  projects: [
    { id: 'proj_1', project_number: 'PRJ-MAG-101', client_id: 'magna', description: 'Line Quality Audit', plant_id: 'gm_oshawa', rep_id: '1', start_date: '2023-10-12', currency: 'CAD', billing_rate: 85.00, pay_rate: 55.00, status: 'Active' },
    { id: 'proj_2', project_number: 'PRJ-TES-204', client_id: 'brose', description: 'Robotics Calibration', plant_id: 'gm_slp', rep_id: 'rep_rogelio', start_date: '2023-11-01', currency: 'USD', billing_rate: 120.00, pay_rate: 80.00, status: 'Active' },
    { id: 'proj_3', project_number: 'PRJ-FOR-092', client_id: 'autokabel', description: 'Safety Inspector', plant_id: 'ford_dearborn', rep_id: 'rep_nabil', start_date: '2023-09-28', currency: 'USD', billing_rate: 95.00, pay_rate: 65.00, status: 'Active' }
  ],
  systemLogs: [
    { id: 'log_seed_1', timestamp: new Date().toISOString(), category: 'system', action: 'initialize', details: 'Demo database initialized with integrity seeds.' }
  ],
  extraHoursRequests: [
    {
      id: 'ehr_1',
      rep_id: 'rep_hugo',
      supplier_id: 'autokabel',
      plant_id: 'mercedes_tuscaloosa',
      date: '2026-07-01',
      hours: 4.0,
      reason: 'Urgent sorting of tail light assemblies due to supplier defect leak',
      status: 'pending_customer',
      customer_comment: '',
      admin_comment: '',
      created_at: '2026-07-01T10:00:00Z',
      history: [
        { status: 'pending_customer', user: 'Hugo Picon', timestamp: '2026-07-01T10:00:00Z', comment: 'Initiated extra hours request.' }
      ]
    },
    {
      id: 'ehr_2',
      rep_id: 'rep_rogelio',
      supplier_id: 'autokabel',
      plant_id: 'gm_slp',
      date: '2026-06-30',
      hours: 2.5,
      reason: 'Line stoppage support at engine assembly area',
      status: 'pending_admin',
      customer_comment: 'Approved for production continuity.',
      admin_comment: '',
      created_at: '2026-06-30T14:30:00Z',
      history: [
        { status: 'pending_customer', user: 'Rogelio Velasco', timestamp: '2026-06-30T14:30:00Z', comment: 'Line stop support requested.' },
        { status: 'pending_admin', user: 'Juan Carlos (Auto Kabel)', timestamp: '2026-06-30T16:00:00Z', comment: 'Approved for production continuity.' }
      ]
    }
  ]
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

  // Sync to Supabase in background
  supabase.from(type).upsert(entity)
    .then(({ error }) => {
      if (error) {
        console.error(`[Supabase Push Error] table "${type}":`, error.message);
      }
    })
    .catch(err => console.error(`[Supabase Push Exception] table "${type}":`, err));

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
