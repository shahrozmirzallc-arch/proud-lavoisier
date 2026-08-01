const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wuqqrcowznrmmuokfxlk.supabase.co';
const supabaseAnonKey = 'sb_publishable_S7Qpf1lJ6OCYbYrE-_5iLQ_lN9iEdNe';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = ['users', 'suppliers', 'projects', 'time_entries', 'expense_entries', 'assignments', 'reps', 'overtime_decision_audit_log', 'rates', 'plants'];

(async () => {
  console.log('=====================================================');
  console.log('IDS PULSE DATABASE READ-ONLY SCHEMA INTROSPECTION');
  console.log('Target Project:', supabaseUrl);
  console.log('=====================================================\n');

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`Table '${table}': ERROR / NOT ACCESSIBLE OR NOT FOUND ->`, error.message);
      } else {
        const columns = data && data.length > 0 ? Object.keys(data[0]) : 'Accessible (0 rows currently inserted)';
        console.log(`Table '${table}': EXISTS (${Array.isArray(columns) ? columns.length : '0'} columns)`);
        if (Array.isArray(columns)) {
          console.log(`   Columns:`, columns.join(', '));
        }
      }
    } catch (e) {
      console.log(`Table '${table}': EXCEPTION ->`, e.message);
    }
  }
})();
