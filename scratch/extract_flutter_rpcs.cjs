// scratch/extract_flutter_rpcs.cjs
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = 'C:\\Users\\Sharoz\\Documents\\New project\\ids_pulse_flutter\\supabase\\migrations';
const files = fs.readdirSync(MIGRATIONS_DIR);

console.log('Available migration files:', files);

const rpcs = [
  'get_rep_mobile_bootstrap',
  'submit_rep_quality_record_atomic',
  'submit_rep_mobile_daily_report_atomic',
  'submit_rep_mobile_urgent_incident_atomic'
];

for (const file of files) {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  for (const rpc of rpcs) {
    if (content.includes(rpc)) {
      console.log(`[FOUND] RPC "${rpc}" in file "${file}"`);
    }
  }
}
