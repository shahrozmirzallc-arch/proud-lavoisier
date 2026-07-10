const fs = require('fs');
const path = require('path');

// Parse SEED_DATA from SharedDatabase.js
const dbPath = path.join(__dirname, 'src', 'components', 'SharedDatabase.js');
if (!fs.existsSync(dbPath)) {
  console.error(`Error: SharedDatabase.js not found at: ${dbPath}`);
  process.exit(1);
}

const dbContent = fs.readFileSync(dbPath, 'utf8');
const startIdx = dbContent.indexOf('const SEED_DATA = {');
const endIdx = dbContent.indexOf('// Initialize database in localStorage');

if (startIdx === -1 || endIdx === -1) {
  console.error("Error: Could not locate SEED_DATA block in SharedDatabase.js");
  process.exit(1);
}

const seedCode = dbContent.substring(startIdx, endIdx);
const cleanCode = seedCode.replace('const SEED_DATA = {', 'SEED_DATA = {');

let SEED_DATA;
try {
  eval(cleanCode);
} catch (err) {
  console.error("Error evaluating SEED_DATA:", err.message);
  process.exit(1);
}

let sql = `-- ==========================================
-- IDS PULSE — SUPABASE DATABASE SETUP SCRIPT
-- ==========================================
-- Run this script in your Supabase SQL Editor to set up tables,
-- disable RLS for client sync, and populate the database with seed data.

-- 1. DROP EXISTING TABLES (IF ANY)
DROP TABLE IF EXISTS "extraHoursRequests" CASCADE;
DROP TABLE IF EXISTS "systemLogs" CASCADE;
DROP TABLE IF EXISTS "emailLogs" CASCADE;
DROP TABLE IF EXISTS "dailyTasks" CASCADE;
DROP TABLE IF EXISTS "reworkLogs" CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS "expenseEntries" CASCADE;
DROP TABLE IF EXISTS "timeEntries" CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS parts CASCADE;
DROP TABLE IF EXISTS rates CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS plants CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS "shiftReports" CASCADE;

-- 2. CREATE SCHEMAS & TABLES
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT,
  phone TEXT,
  avatar TEXT,
  pay_currency TEXT,
  company_affiliation TEXT
);

CREATE TABLE plants (
  id TEXT PRIMARY KEY,
  name TEXT,
  address TEXT,
  oem_brand TEXT
);

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT,
  invoice_schedule TEXT,
  allotted_hours INTEGER,
  contacts JSONB,
  plants_served JSONB
);

CREATE TABLE rates (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  supplier_id TEXT,
  plant_id TEXT,
  billing_rate NUMERIC,
  pay_rate NUMERIC
);

CREATE TABLE parts (
  id TEXT PRIMARY KEY,
  part_number TEXT,
  supplier_id TEXT,
  description TEXT
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  project_number TEXT,
  client_id TEXT,
  description TEXT,
  plant_id TEXT,
  rep_id TEXT,
  start_date TEXT,
  currency TEXT,
  billing_rate NUMERIC,
  pay_rate NUMERIC,
  status TEXT
);

CREATE TABLE "timeEntries" (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  plant_id TEXT,
  supplier_id TEXT,
  date TEXT,
  hours NUMERIC,
  mileage_km NUMERIC,
  notes TEXT,
  invoiced BOOLEAN,
  sent_to_payroll BOOLEAN
);

CREATE TABLE "expenseEntries" (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  supplier_id TEXT,
  date TEXT,
  category TEXT,
  amount NUMERIC,
  receipt_photo TEXT,
  notes TEXT,
  invoiced BOOLEAN,
  sent_to_payroll BOOLEAN,
  status TEXT
);

CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  plant_id TEXT,
  supplier_id TEXT,
  part_id TEXT,
  area TEXT,
  description TEXT,
  action_taken TEXT,
  supplier_contact TEXT,
  photos JSONB,
  videos JSONB,
  audio_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  concern_classification TEXT,
  defect_returned TEXT,
  sort_required TEXT,
  rma_required TEXT,
  defect_location_x NUMERIC,
  defect_location_y NUMERIC,
  part_view TEXT,
  parts_list JSONB
);

CREATE TABLE "reworkLogs" (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  plant_id TEXT,
  supplier_id TEXT,
  part_id TEXT,
  qty INTEGER,
  time_spent_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ
);

CREATE TABLE "dailyTasks" (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  date TEXT,
  task TEXT,
  status TEXT
);

CREATE TABLE "emailLogs" (
  id TEXT PRIMARY KEY,
  incident_id TEXT,
  to_emails TEXT,
  cc_emails TEXT,
  subject TEXT,
  body TEXT,
  sent_at TIMESTAMPTZ,
  delivery_status TEXT
);

CREATE TABLE "extraHoursRequests" (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  supplier_id TEXT,
  plant_id TEXT,
  date TEXT,
  hours NUMERIC,
  reason TEXT,
  status TEXT,
  customer_comment TEXT,
  admin_comment TEXT,
  created_at TIMESTAMPTZ,
  history JSONB
);

CREATE TABLE "systemLogs" (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ,
  category TEXT,
  action TEXT,
  details TEXT
);

CREATE TABLE "shiftReports" (
  id TEXT PRIMARY KEY,
  rep_id TEXT,
  plant_id TEXT,
  date TEXT,
  areas_walked JSONB,
  incidents_count INTEGER,
  bonus_tasks JSONB,
  status TEXT,
  sent_at TIMESTAMPTZ
);

-- 3. DISABLE ROW LEVEL SECURITY (RLS) FOR FULL SANDBOX SYNC
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE plants DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE parts DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE "timeEntries" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "expenseEntries" DISABLE ROW LEVEL SECURITY;
ALTER TABLE incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE "reworkLogs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "dailyTasks" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "emailLogs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "extraHoursRequests" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "systemLogs" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "shiftReports" DISABLE ROW LEVEL SECURITY;

-- 4. INSERT SEED DATA
`;

// Helper to escape single quotes in SQL strings
const esc = (val) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return val;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
};

const tables = [
  'users',
  'plants',
  'suppliers',
  'rates',
  'parts',
  'projects',
  'timeEntries',
  'expenseEntries',
  'incidents',
  'reworkLogs',
  'dailyTasks',
  'emailLogs',
  'extraHoursRequests',
  'systemLogs',
  'shiftReports'
];

tables.forEach(table => {
  const items = SEED_DATA[table];
  if (!items || items.length === 0) return;
  
  const columns = Object.keys(items[0]);
  sql += `\n-- Seeding ${table}\n`;
  
  items.forEach(item => {
    const vals = columns.map(col => esc(item[col]));
    sql += `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});\n`;
  });
});

fs.writeFileSync(path.join(__dirname, 'IDS_Pulse_Supabase_Setup.sql'), sql);
console.log("Successfully generated IDS_Pulse_Supabase_Setup.sql!");
