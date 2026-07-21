-- ==========================================
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

-- Seeding users
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('1', 'Clarence Kuiken', 'clarence.k@integritydriven.com', 'rep', '+1 905-914-2788', 'CK', 'CAD', 'IDS');
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('2', 'Donna Cabral', 'donna.c@integritydriven.com', 'lead', '+1 905-555-0199', 'DC', 'CAD', 'IDS');
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('3', 'Greg Phillippe', 'greg.p@integritydriven.com', 'owner', '+1 905-555-0100', 'GP', 'CAD', 'IDS');
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('4', 'Colleen Boyd', 'colleen.b@integritydriven.com', 'accountant', '+1 905-555-0122', 'CB', 'CAD', 'IDS');
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('user_diana', 'Diana', 'diana@integritydriven.com', 'owner', '+1 555-555-0155', 'DI', 'CAD', 'IDS');
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('rep_hugo', 'Hugo Picon', 'hugo.p@integritydriven.com', 'rep', '+1 555-123-4567', 'HP', 'USD', 'IDS');
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('rep_nabil', 'Nabil Obad', 'nabil.o@integritydriven.com', 'rep', '+1 555-987-6543', 'NO', 'USD', 'IDS');
INSERT INTO "users" ("id", "name", "email", "role", "phone", "avatar", "pay_currency", "company_affiliation") VALUES ('rep_rogelio', 'Rogelio Velasco', 'rogelio.v@integritydriven.com', 'rep', '+1 555-555-0987', 'RV', 'USD', 'FQS');

-- Seeding plants
INSERT INTO "plants" ("id", "name", "address", "oem_brand") VALUES ('gm_oshawa', 'GM Oshawa Plant', '900 Park Rd S, Oshawa, ON', 'GM');
INSERT INTO "plants" ("id", "name", "address", "oem_brand") VALUES ('magna_autosystems', 'Magna AutoSystems', 'Belleville, ON', 'Magna');
INSERT INTO "plants" ("id", "name", "address", "oem_brand") VALUES ('hutchinson', 'Hutchinson Plant', 'Mississauga, ON', 'Hutchinson');
INSERT INTO "plants" ("id", "name", "address", "oem_brand") VALUES ('mercedes_tuscaloosa', 'Mercedes Tuscaloosa Plant', 'Tuscaloosa, AL', 'Mercedes');
INSERT INTO "plants" ("id", "name", "address", "oem_brand") VALUES ('ford_dearborn', 'Ford Dearborn Plant', 'Dearborn, MI', 'Ford');
INSERT INTO "plants" ("id", "name", "address", "oem_brand") VALUES ('gm_slp', 'GM SLP Plant', 'San Luis Potosi, MX', 'GM');

-- Seeding suppliers
INSERT INTO "suppliers" ("id", "name", "invoice_schedule", "allotted_hours", "contacts", "plants_served") VALUES ('magna', 'Magna AutoSystems', 'weekly', 45, '[{"name":"Shahroz Mirza","email":"shahroz.m@magna.com","role":"Quality Manager"},{"name":"Martin","email":"martin.s@magna.com","role":"Sequence Supervisor"}]', '["gm_oshawa"]');
INSERT INTO "suppliers" ("id", "name", "invoice_schedule", "allotted_hours", "contacts", "plants_served") VALUES ('hutchinson', 'Hutchinson Rubber', 'monthly', 30, '[{"name":"Sarah Jenkins","email":"sjenkins@hutchinson.ca","role":"Supplier Quality Engineer"}]', '["gm_oshawa"]');
INSERT INTO "suppliers" ("id", "name", "invoice_schedule", "allotted_hours", "contacts", "plants_served") VALUES ('autokabel', 'Auto Kabel de Mexico S.A. de C.V', 'weekly', 50, '[{"name":"Juan Carlos","email":"jc@autokabel.mx","role":"Plant Quality Manager"}]', '["mercedes_tuscaloosa","ford_dearborn","gm_slp"]');
INSERT INTO "suppliers" ("id", "name", "invoice_schedule", "allotted_hours", "contacts", "plants_served") VALUES ('brose', 'Brose México S.A. de C.V.', 'weekly', 40, '[{"name":"Maria Gomez","email":"mg@brose.mx","role":"Supplier Quality Manager"}]', '["gm_slp"]');
INSERT INTO "suppliers" ("id", "name", "invoice_schedule", "allotted_hours", "contacts", "plants_served") VALUES ('borgwarner', 'BorgWarner PDS Irapuato', 'monthly', 35, '[{"name":"Alejandro","email":"al@borgwarner.com","role":"Supplier Quality Engineer"}]', '["gm_slp"]');

-- Seeding rates
INSERT INTO "rates" ("id", "rep_id", "supplier_id", "billing_rate", "pay_rate") VALUES ('rate_1', '1', 'magna', 28, 20);
INSERT INTO "rates" ("id", "rep_id", "supplier_id", "billing_rate", "pay_rate") VALUES ('rate_2', '1', 'hutchinson', 30, 22);
INSERT INTO "rates" ("id", "rep_id", "supplier_id", "billing_rate", "pay_rate") VALUES ('rate_hugo', 'rep_hugo', 'autokabel', 35, 25);
INSERT INTO "rates" ("id", "rep_id", "supplier_id", "billing_rate", "pay_rate") VALUES ('rate_nabil', 'rep_nabil', 'autokabel', 35, 26);
INSERT INTO "rates" ("id", "rep_id", "supplier_id", "billing_rate", "pay_rate") VALUES ('rate_rogelio', 'rep_rogelio', 'autokabel', 28, 18.56);

-- Seeding parts
INSERT INTO "parts" ("id", "part_number", "supplier_id", "description") VALUES ('86286761', '86286761', 'magna', 'Tail Light Assembly');
INSERT INTO "parts" ("id", "part_number", "supplier_id", "description") VALUES ('86291945', '86291945', 'magna', 'Headlight Housing (Matt''s Bin Sort)');
INSERT INTO "parts" ("id", "part_number", "supplier_id", "description") VALUES ('86201945', '86201945', 'magna', 'Headlight Housing - Alt');

-- Seeding projects
INSERT INTO "projects" ("id", "project_number", "client_id", "description", "plant_id", "rep_id", "start_date", "currency", "billing_rate", "pay_rate", "status") VALUES ('proj_1', 'PRJ-MAG-101', 'magna', 'Line Quality Audit', 'gm_oshawa', '1', '2023-10-12', 'CAD', 85, 55, 'Active');
INSERT INTO "projects" ("id", "project_number", "client_id", "description", "plant_id", "rep_id", "start_date", "currency", "billing_rate", "pay_rate", "status") VALUES ('proj_2', 'PRJ-TES-204', 'brose', 'Robotics Calibration', 'gm_slp', 'rep_rogelio', '2023-11-01', 'USD', 120, 80, 'Active');
INSERT INTO "projects" ("id", "project_number", "client_id", "description", "plant_id", "rep_id", "start_date", "currency", "billing_rate", "pay_rate", "status") VALUES ('proj_3', 'PRJ-FOR-092', 'autokabel', 'Safety Inspector', 'ford_dearborn', 'rep_nabil', '2023-09-28', 'USD', 95, 65, 'Active');

-- Seeding timeEntries
INSERT INTO "timeEntries" ("id", "rep_id", "plant_id", "supplier_id", "date", "hours", "mileage_km", "notes", "invoiced", "sent_to_payroll") VALUES ('te_1', '1', 'gm_oshawa', 'magna', '2026-05-28', 9, 45, 'Standard day shift. Conducted area walks, sorted Matt''s bin request, reworked one tail light.', FALSE, FALSE);
INSERT INTO "timeEntries" ("id", "rep_id", "plant_id", "supplier_id", "date", "hours", "mileage_km", "notes", "invoiced", "sent_to_payroll") VALUES ('te_2', '1', 'gm_oshawa', 'magna', '2026-07-02', 8.5, 45, 'Regular audit on sequence racks. Checked bulb rattle issue.', FALSE, FALSE);
INSERT INTO "timeEntries" ("id", "rep_id", "plant_id", "supplier_id", "date", "hours", "mileage_km", "notes", "invoiced", "sent_to_payroll") VALUES ('te_3', 'rep_hugo', 'mercedes_tuscaloosa', 'autokabel', '2026-07-01', 10, 85, 'Containment line sort for SWG insulation gaps. Required overtime support.', FALSE, FALSE);
INSERT INTO "timeEntries" ("id", "rep_id", "plant_id", "supplier_id", "date", "hours", "mileage_km", "notes", "invoiced", "sent_to_payroll") VALUES ('te_4', 'rep_hugo', 'mercedes_tuscaloosa', 'autokabel', '2026-07-02', 8, 85, 'Inspected wire rack components at Mercedes assembly Line 4.', FALSE, FALSE);
INSERT INTO "timeEntries" ("id", "rep_id", "plant_id", "supplier_id", "date", "hours", "mileage_km", "notes", "invoiced", "sent_to_payroll") VALUES ('te_5', 'rep_nabil', 'ford_dearborn', 'autokabel', '2026-07-02', 8, 32, 'Quality walk at Ford Dearborn plant. Verified tag compliance.', FALSE, FALSE);
INSERT INTO "timeEntries" ("id", "rep_id", "plant_id", "supplier_id", "date", "hours", "mileage_km", "notes", "invoiced", "sent_to_payroll") VALUES ('te_6', 'rep_nabil', 'ford_dearborn', 'autokabel', '2026-07-03', 9.5, 32, 'Assisted in rework containment of tail light harness assemblies.', FALSE, FALSE);
INSERT INTO "timeEntries" ("id", "rep_id", "plant_id", "supplier_id", "date", "hours", "mileage_km", "notes", "invoiced", "sent_to_payroll") VALUES ('te_7', 'rep_rogelio', 'gm_slp', 'autokabel', '2026-07-02', 11, 60, 'Supported GM SLP engine room wiring harness sort. High urgency shift.', FALSE, FALSE);

-- Seeding expenseEntries
INSERT INTO "expenseEntries" ("id", "rep_id", "supplier_id", "date", "category", "amount", "receipt_photo", "notes", "invoiced", "sent_to_payroll", "status") VALUES ('exp_1', '1', 'magna', '2026-06-03', 'Fuel', 45.5, 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80', 'Fuel fill-up for GM Oshawa site travel.', FALSE, FALSE, 'approved');
INSERT INTO "expenseEntries" ("id", "rep_id", "supplier_id", "date", "category", "amount", "receipt_photo", "notes", "invoiced", "sent_to_payroll", "status") VALUES ('exp_2', 'rep_hugo', 'autokabel', '2026-07-02', 'Tolls', 15, 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80', 'Highway toll receipts for Tuscaloosa quality walk.', FALSE, FALSE, 'approved');
INSERT INTO "expenseEntries" ("id", "rep_id", "supplier_id", "date", "category", "amount", "receipt_photo", "notes", "invoiced", "sent_to_payroll", "status") VALUES ('exp_3', 'rep_nabil', 'autokabel', '2026-07-03', 'Meals', 28.5, 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80', 'Overtime dinner support during containment sort.', FALSE, FALSE, 'pending');
INSERT INTO "expenseEntries" ("id", "rep_id", "supplier_id", "date", "category", "amount", "receipt_photo", "notes", "invoiced", "sent_to_payroll", "status") VALUES ('exp_4', 'rep_rogelio', 'autokabel', '2026-07-02', 'Safety Gear', 75, 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=800&q=80', 'Replacement steel-toe safety shoes for SLP floor audit.', FALSE, FALSE, 'approved');

-- Seeding incidents
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_1', '1', 'gm_oshawa', 'magna', '86286761', 'Scrap table at Sequence Area', 'Light on scrap table at sequence area for rattle. Spare bulb in housing again. Removed bulb and returned light to sequence area. Bulb was removed before scrap tag was written up. Please ensure all base lights do not have spare bulbs in housing causing rattling sound.', 'Removed bulb, returned light to sequence area', 'Martin', '[{"id":"ph_1","url":"https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=800&q=80","type":"Wide shot (box label visible)","annotations":[]},{"id":"ph_2","url":"https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80","type":"Close-up of defect","annotations":[{"type":"arrow","x":240,"y":180,"label":"Loose bulb causing rattle"}]}]', '[]', '', 'Closed', '2026-05-28T08:30:00Z', '2026-05-28T08:35:00Z', 'PRR', 'N', 'N', 'N', 0.3, 0.5, 'top', '[{"id":"sp_seed_1","part_number":"86286761","description":"Tail Light Assembly","supplier_id":"magna","bin":"BIN-MAG-6761","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_2', '1', 'gm_oshawa', 'magna', '86286761', 'Scrap table at Sequence Area', 'Loose spare bulb rattling inside bulb housing left side.', 'Removed bulb, returned to sequence', 'Martin', '[]', '[]', '', 'Closed', '2026-05-28T09:12:00Z', '2026-05-28T09:15:00Z', 'PRR', 'N', 'N', 'N', 0.31, 0.52, 'top', '[{"id":"sp_seed_2","part_number":"86286761","description":"Tail Light Assembly","supplier_id":"magna","bin":"BIN-MAG-6761","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_3', '1', 'gm_oshawa', 'magna', '86286761', 'Online assembly', 'Gasket seal misaligned, creating outer gap on right edge.', 'Realigned gasket', 'Martin', '[]', '[]', '', 'Open', '2026-05-28T14:40:00Z', '2026-05-28T14:45:00Z', 'PRR', 'N', 'N', 'N', 0.5, 0.74, 'top', '[{"id":"sp_seed_3","part_number":"86286761","description":"Tail Light Assembly","supplier_id":"magna","bin":"BIN-MAG-6761","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_4', '1', 'gm_oshawa', 'magna', '86286761', 'Scrap table', 'Tail light left side bulb housing rattling. Spare bulb loose inside.', 'Cleared bulb', 'Martin', '[]', '[]', '', 'Closed', '2026-06-01T10:05:00Z', '2026-06-01T10:10:00Z', 'PRR', 'N', 'N', 'N', 0.29, 0.49, 'top', '[{"id":"sp_seed_4","part_number":"86286761","description":"Tail Light Assembly","supplier_id":"magna","bin":"BIN-MAG-6761","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_5', '1', 'gm_oshawa', 'magna', '86286761', 'Heavy repair', 'Outer lens gasket loose causing moisture leakage risk.', 'Realigned gasket', 'Martin', '[]', '[]', '', 'Open', '2026-06-01T11:30:00Z', '2026-06-01T11:35:00Z', 'PRR', 'N', 'N', 'N', 0.52, 0.73, 'top', '[{"id":"sp_seed_5","part_number":"86286761","description":"Tail Light Assembly","supplier_id":"magna","bin":"BIN-MAG-6761","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_6', '1', 'gm_oshawa', 'magna', '86291945', 'Sequence Area', 'Low beam bulb housing loose in reflector casing.', 'Adjusted reflector clips', 'Martin', '[]', '[]', '', 'Closed', '2026-06-01T13:40:00Z', '2026-06-01T13:45:00Z', 'QR', 'Y', 'Y', 'Y', 0.65, 0.5, 'top', '[{"id":"sp_seed_6","part_number":"86291945","description":"Headlight Housing (Matt''s Bin Sort)","supplier_id":"magna","bin":"BIN-MAG-9145","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_7', '1', 'gm_oshawa', 'magna', '86291945', 'Online assembly', 'Bulb connector pins bent preventing headlight harness snap.', 'Returned to supplier', 'Martin', '[]', '[]', '', 'Open', '2026-06-01T14:15:00Z', '2026-06-01T14:20:00Z', 'PRR', 'Y', 'N', 'N', 0.64, 0.48, 'top', '[{"id":"sp_seed_7","part_number":"86291945","description":"Headlight Housing (Matt''s Bin Sort)","supplier_id":"magna","bin":"BIN-MAG-9145","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_8', 'rep_hugo', 'mercedes_tuscaloosa', 'autokabel', '86286761', 'Mercedes Assembly Line 4', 'Insulation gap discovered on primary battery cable sheath. Standard gauge wire exposed.', 'Placed parts in containment bin, flagged Mercedes quality auditor, notified Auto Kabel supervisor.', 'Juan Carlos', '[]', '[]', '', 'Open', '2026-07-01T09:30:00Z', '2026-07-01T09:35:00Z', 'PRR', 'N', 'Y', 'N', 0.45, 0.6, 'top', '[{"id":"sp_seed_8","part_number":"86286761","description":"Tail Light Assembly","supplier_id":"autokabel","bin":"BIN-AK-6761","qty":1}]');
INSERT INTO "incidents" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "area", "description", "action_taken", "supplier_contact", "photos", "videos", "audio_url", "status", "created_at", "sent_at", "concern_classification", "defect_returned", "sort_required", "rma_required", "defect_location_x", "defect_location_y", "part_view", "parts_list") VALUES ('inc_9', 'rep_nabil', 'ford_dearborn', 'autokabel', '86291945', 'Harness Sequencing Bay', 'Bent electrical connector pins on wiring harnesses preventing positive locking.', 'Initiated 100% sort of containment rack. Rejected 6 bad harnesses.', 'Juan Carlos', '[]', '[]', '', 'Closed', '2026-07-02T11:15:00Z', '2026-07-02T11:20:00Z', 'QR', 'Y', 'Y', 'Y', 0.55, 0.4, 'top', '[{"id":"sp_seed_9","part_number":"86291945","description":"Headlight Housing (Matt''s Bin Sort)","supplier_id":"autokabel","bin":"BIN-AK-9145","qty":6}]');

-- Seeding reworkLogs
INSERT INTO "reworkLogs" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "qty", "time_spent_minutes", "notes", "created_at") VALUES ('rw_1', '1', 'gm_oshawa', 'magna', '86286761', 1, 5, 'Removed loose bulb from tail light housing to eliminate rattle.', '2026-05-28T08:31:00Z');
INSERT INTO "reworkLogs" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "qty", "time_spent_minutes", "notes", "created_at") VALUES ('rw_2', '1', 'gm_oshawa', 'magna', '86286761', 12, 60, 'Sorted 12 light housings, verified gasket seal alignment.', '2026-07-02T10:00:00Z');
INSERT INTO "reworkLogs" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "qty", "time_spent_minutes", "notes", "created_at") VALUES ('rw_3', 'rep_hugo', 'mercedes_tuscaloosa', 'autokabel', '86286761', 45, 180, 'Reworked copper connectors on 45 Auto Kabel harnesses to Mercedes specifications.', '2026-07-01T15:30:00Z');
INSERT INTO "reworkLogs" ("id", "rep_id", "plant_id", "supplier_id", "part_id", "qty", "time_spent_minutes", "notes", "created_at") VALUES ('rw_4', 'rep_rogelio', 'gm_slp', 'brose', '86291945', 90, 240, 'Full sort of Brose door regulator brackets. Identified 4 loose brackets.', '2026-07-02T14:00:00Z');

-- Seeding dailyTasks
INSERT INTO "dailyTasks" ("id", "rep_id", "date", "task", "status") VALUES ('dt_1', '1', '2026-05-28', 'Verify Magna tail light rattles on sequence line', 'completed');
INSERT INTO "dailyTasks" ("id", "rep_id", "date", "task", "status") VALUES ('dt_2', '1', '2026-05-28', 'Conduct Matt''s bin sorting audit request on PN 86291945', 'completed');
INSERT INTO "dailyTasks" ("id", "rep_id", "date", "task", "status") VALUES ('dt_3', '1', '2026-06-01', 'Verify sequence area scrap bins are empty and tagged', 'pending');
INSERT INTO "dailyTasks" ("id", "rep_id", "date", "task", "status") VALUES ('dt_4', '1', '2026-06-01', 'Review Scrap Table for bulb rattles', 'pending');
INSERT INTO "dailyTasks" ("id", "rep_id", "date", "task", "status") VALUES ('dt_5', '1', '2026-06-01', 'Submit end-of-shift walkthrough checklist', 'pending');

-- Seeding emailLogs
INSERT INTO "emailLogs" ("id", "incident_id", "to_emails", "cc_emails", "subject", "body", "sent_at", "delivery_status") VALUES ('el_1', 'inc_1', 'martin.s@magna.com, shahroz.m@magna.com', 'donna.c@integritydriven.com, greg.p@integritydriven.com', '[INCIDENT] PN 86286761 | Scrap table at Sequence Area | GM Oshawa Plant | 2026-05-28', '<h3>INCIDENT REPORT — IDS PULSE</h3>
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
<p><strong>Photos Sent:</strong> 2 photos attached. Drawing annotations present on close-up shot.</p>', '2026-05-28T08:35:00Z', 'delivered');

-- Seeding extraHoursRequests
INSERT INTO "extraHoursRequests" ("id", "rep_id", "supplier_id", "plant_id", "date", "hours", "reason", "status", "customer_comment", "admin_comment", "created_at", "history") VALUES ('ehr_1', 'rep_hugo', 'autokabel', 'mercedes_tuscaloosa', '2026-07-01', 4, 'Urgent sorting of tail light assemblies due to supplier defect leak', 'pending_customer', '', '', '2026-07-01T10:00:00Z', '[{"status":"pending_customer","user":"Hugo Picon","timestamp":"2026-07-01T10:00:00Z","comment":"Initiated extra hours request."}]');
INSERT INTO "extraHoursRequests" ("id", "rep_id", "supplier_id", "plant_id", "date", "hours", "reason", "status", "customer_comment", "admin_comment", "created_at", "history") VALUES ('ehr_2', 'rep_rogelio', 'autokabel', 'gm_slp', '2026-06-30', 2.5, 'Line stoppage support at engine assembly area', 'pending_admin', 'Approved for production continuity.', '', '2026-06-30T14:30:00Z', '[{"status":"pending_customer","user":"Rogelio Velasco","timestamp":"2026-06-30T14:30:00Z","comment":"Line stop support requested."},{"status":"pending_admin","user":"Juan Carlos (Auto Kabel)","timestamp":"2026-06-30T16:00:00Z","comment":"Approved for production continuity."}]');

-- Seeding systemLogs
INSERT INTO "systemLogs" ("id", "timestamp", "category", "action", "details") VALUES ('log_seed_1', '2026-07-10T16:47:36.341Z', 'system', 'initialize', 'Demo database initialized with integrity seeds.');

-- Seeding shiftReports
INSERT INTO "shiftReports" ("id", "rep_id", "plant_id", "date", "areas_walked", "incidents_count", "bonus_tasks", "status", "sent_at") VALUES ('sr_1', '1', 'gm_oshawa', '2026-05-28', '[{"name":"Online assembly","status":"no_issues","contact":"T/L and installers","notes":"Checked with team leader and installers on line."},{"name":"Sequence area","status":"issues","contact":"Martin","notes":"Found rattling tail light. See incident inc_1."},{"name":"Heavy repair","status":"no_issues","contact":"Martin","notes":"Checked all heavy repair bays."},{"name":"Review Scrap Table","status":"issues","contact":"Martin","notes":"Reworked tail light on scrap table."}]', 1, '[{"task":"Matt''s bin check audit on PN 86291945","status":"completed","notes":"Checked bin audit request. No issues found."}]', 'Sent', '2026-05-28T17:30:00Z');
INSERT INTO "shiftReports" ("id", "rep_id", "plant_id", "date", "areas_walked", "incidents_count", "bonus_tasks", "status", "sent_at") VALUES ('sr_2', 'rep_hugo', 'mercedes_tuscaloosa', '2026-07-01', '[{"name":"Mercedes Assembly Line 4","status":"issues","contact":"Juan Carlos","notes":"Found battery cable insulation gap. See incident inc_8."},{"name":"Parts sequencing area","status":"no_issues","contact":"Juan Carlos","notes":"Checked wire racks. All tagged correctly."}]', 1, '[{"task":"Verify line stock tags","status":"completed","notes":"All tags current."}]', 'Sent', '2026-07-01T17:45:00Z');
INSERT INTO "shiftReports" ("id", "rep_id", "plant_id", "date", "areas_walked", "incidents_count", "bonus_tasks", "status", "sent_at") VALUES ('sr_3', 'rep_nabil', 'ford_dearborn', '2026-07-02', '[{"name":"Harness Sequencing Bay","status":"issues","contact":"Juan Carlos","notes":"Bent electrical connector pins. See incident inc_9."},{"name":"Scrap table","status":"no_issues","contact":"Juan Carlos","notes":"Scrap table verified clear."}]', 1, '[{"task":"Audit containment rack logs","status":"completed","notes":"Containment rack logs verified and matches DB counts."}]', 'Sent', '2026-07-02T16:50:00Z');
INSERT INTO "shiftReports" ("id", "rep_id", "plant_id", "date", "areas_walked", "incidents_count", "bonus_tasks", "status", "sent_at") VALUES ('sr_4', 'rep_rogelio', 'gm_slp', '2026-07-02', '[{"name":"Engine Room Line","status":"issues","contact":"Juan Carlos","notes":"Assisted in wiring harness sort. High density sorting completed."},{"name":"Scrap table","status":"no_issues","contact":"Juan Carlos","notes":"Scrap table verified."}]', 0, '[{"task":"Pre-check next shift parts","status":"completed","notes":"Next shift parts pre-checked."}]', 'Sent', '2026-07-02T18:15:00Z');
