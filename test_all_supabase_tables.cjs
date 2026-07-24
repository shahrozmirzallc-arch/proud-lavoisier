const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const supabaseAnonKey = 'sb_publishable_S7Qpf1lJ6OCYbYrE-_5iLQ_lN9iEdNe';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = ['users', 'incidents', 'rework_logs', 'time_entries', 'expense_entries', 'shift_reports', 'projects', 'rates', 'suppliers', 'plants', 'payroll'];

(async () => {
  console.log('Auditing Supabase tables for project:', supabaseUrl);
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}': ERROR/NOT CREATED ->`, error.message);
      } else {
        console.log(`Table '${table}': OK -> (${data.length} rows)`);
      }
    } catch (e) {
      console.log(`Table '${table}': EXCEPTION ->`, e.message);
    }
  }
})();
