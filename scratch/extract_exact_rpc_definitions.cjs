// scratch/extract_exact_rpc_definitions.cjs
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = 'C:\\Users\\Sharoz\\Documents\\New project\\ids_pulse_flutter\\supabase\\migrations';

const targetFunctions = [
  'get_rep_mobile_bootstrap_v2',
  'submit_rep_quality_record_atomic',
  'submit_rep_mobile_daily_report_atomic',
  'submit_rep_mobile_urgent_incident_atomic'
];

const files = fs.readdirSync(MIGRATIONS_DIR);

for (const file of files) {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  for (const fn of targetFunctions) {
    if (content.includes(`create or replace function public.${fn}`) || content.includes(`create or replace function private.${fn}`) || content.includes(`create function public.${fn}`)) {
      console.log(`[FOUND FUNCTION] ${fn} in ${file}`);
    }
  }
}
