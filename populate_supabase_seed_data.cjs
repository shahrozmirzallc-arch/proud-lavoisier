const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const supabaseAnonKey = 'sb_publishable_S7Qpf1lJ6OCYbYrE-_5iLQ_lN9iEdNe';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SEED_DATA = {
  users: [
    { id: '1', name: 'Clarence Kuiken', email: 'clarence.k@integritydriven.com', role: 'rep', phone: '+1 905-914-2788', avatar: 'CK', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: '2', name: 'Donna Cabral', email: 'donna.c@integritydriven.com', role: 'lead', phone: '+1 905-555-0199', avatar: 'DC', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: '3', name: 'Greg Phillippe', email: 'greg.p@integritydriven.com', role: 'admin', phone: '+1 905-555-0100', avatar: 'GP', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: '4', name: 'Colleen Boyd', email: 'colleen.b@integritydriven.com', role: 'accountant', phone: '+1 905-555-0122', avatar: 'CB', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: 'shahroz_user', name: 'Shahroz Mirza', email: 'shahroz.m@integritydriven.com', role: 'super_admin', phone: '+1 905-555-0199', avatar: 'SM', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: 'user_diana', name: 'Diana', email: 'diana@integritydriven.com', role: 'customer', phone: '+1 555-555-0155', avatar: 'DI', pay_currency: 'CAD', company_affiliation: 'IDS' },
    { id: 'rep_hugo', name: 'Hugo Picon', email: 'hugo.p@integritydriven.com', role: 'rep', phone: '+1 555-123-4567', avatar: 'HP', pay_currency: 'USD', company_affiliation: 'IDS' },
    { id: 'rep_nabil', name: 'Nabil Obad', email: 'nabil.o@integritydriven.com', role: 'rep', phone: '+1 555-987-6543', avatar: 'NO', pay_currency: 'USD', company_affiliation: 'IDS' },
    { id: 'rep_rogelio', name: 'Rogelio Velasco', email: 'rogelio.v@integritydriven.com', role: 'rep', phone: '+1 555-555-0987', avatar: 'RV', pay_currency: 'USD', company_affiliation: 'FQS' }
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
      id: 'magna', name: 'Magna AutoSystems', invoice_schedule: 'weekly', allotted_hours: 45, ot_rules: { weekly_threshold: 40, daily_threshold: 8, saturday_multiplier: 1.5, sunday_multiplier: 2.0, holiday_multiplier: 2.0 },
      contacts: [{ name: 'Shahroz Mirza', email: 'shahroz.m@magna.com', role: 'Quality Manager' }, { name: 'Martin', email: 'martin.s@magna.com', role: 'Sequence Supervisor' }],
      plants_served: ['gm_oshawa'] 
    },
    { 
      id: 'hutchinson', name: 'Hutchinson Rubber', invoice_schedule: 'monthly', allotted_hours: 30, ot_rules: { weekly_threshold: 40, daily_threshold: 8, saturday_multiplier: 1.5, sunday_multiplier: 2.0, holiday_multiplier: 2.0 },
      contacts: [{ name: 'Sarah Jenkins', email: 'sjenkins@hutchinson.ca', role: 'Supplier Quality Engineer' }],
      plants_served: ['gm_oshawa']
    },
    {
      id: 'autokabel', name: 'Auto Kabel de Mexico', invoice_schedule: 'weekly', allotted_hours: 20, ot_rules: { weekly_threshold: 40, daily_threshold: 8, saturday_multiplier: 1.5, sunday_multiplier: 2.0, holiday_multiplier: 2.0 },
      contacts: [{ name: 'Juan Carlos', email: 'j.carlos@autokabel.com', role: 'Supplier Quality Director' }],
      plants_served: ['mercedes_tuscaloosa', 'ford_dearborn']
    }
  ]
};

(async () => {
  console.log('Populating Supabase seed data for:', supabaseUrl);
  for (const [table, rows] of Object.entries(SEED_DATA)) {
    try {
      const { data, error } = await supabase.from(table).upsert(rows);
      if (error) {
        console.log(`Failed to seed table '${table}':`, error.message);
      } else {
        console.log(`Successfully seeded table '${table}' (${rows.length} rows)`);
      }
    } catch (e) {
      console.log(`Exception seeding '${table}':`, e.message);
    }
  }
})();
