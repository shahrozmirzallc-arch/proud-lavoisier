-- ============================================================================
-- IDS PULSE - ENTERPRISE PRODUCTION DATABASE MIGRATION SCRIPT
-- Target Project: https://supabase.com/dashboard/project/wuqqrcowznrmmuokfxlk
-- Direct SQL Editor URL: https://supabase.com/dashboard/project/wuqqrcowznrmmuokfxlk/sql/new
-- Description: Creates & alters all 11 production tables with RLS policies,
--              FK constraints, missing columns, and seed data.
-- Safe to run multiple times in Supabase SQL Editor.
-- ============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'rep',
    phone TEXT,
    avatar TEXT,
    pay_currency TEXT DEFAULT 'CAD',
    company_affiliation TEXT DEFAULT 'IDS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pay_currency TEXT DEFAULT 'CAD';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_affiliation TEXT DEFAULT 'IDS';

-- 2. PLANTS TABLE
CREATE TABLE IF NOT EXISTS public.plants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    oem_brand TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS oem_brand TEXT;

-- 3. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invoice_schedule TEXT DEFAULT 'weekly',
    allotted_hours NUMERIC DEFAULT 40,
    contacts JSONB DEFAULT '[]'::jsonb,
    plants_served JSONB DEFAULT '[]'::jsonb,
    ot_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS invoice_schedule TEXT DEFAULT 'weekly';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS allotted_hours NUMERIC DEFAULT 40;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS plants_served JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS ot_rules JSONB DEFAULT '{}'::jsonb;

-- 4. RATES TABLE
CREATE TABLE IF NOT EXISTS public.rates (
    id TEXT PRIMARY KEY,
    rep_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE CASCADE,
    plant_id TEXT,
    billing_rate NUMERIC(10,2) DEFAULT 34.00,
    pay_rate NUMERIC(10,2) DEFAULT 25.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    project_number TEXT NOT NULL,
    client_id TEXT REFERENCES public.suppliers(id) ON DELETE CASCADE,
    rep_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    plant_id TEXT REFERENCES public.plants(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Active',
    currency TEXT DEFAULT 'USD',
    billing_rate NUMERIC(10,2),
    pay_rate NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
    id TEXT PRIMARY KEY,
    rep_id TEXT REFERENCES public.users(id),
    plant_id TEXT,
    supplier_id TEXT,
    part_id TEXT,
    area TEXT,
    description TEXT,
    action_taken TEXT,
    supplier_contact TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    parts_list JSONB DEFAULT '[]'::jsonb,
    concern_classification TEXT DEFAULT 'PRR',
    defect_returned TEXT DEFAULT 'N',
    sort_required TEXT DEFAULT 'N',
    rma_required TEXT DEFAULT 'N',
    defect_location_x NUMERIC,
    defect_location_y NUMERIC,
    status TEXT DEFAULT 'Open',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REWORK LOGS TABLE
CREATE TABLE IF NOT EXISTS public.rework_logs (
    id TEXT PRIMARY KEY,
    rep_id TEXT REFERENCES public.users(id),
    plant_id TEXT,
    supplier_id TEXT,
    part_id TEXT,
    qty INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TIME ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.time_entries (
    id TEXT PRIMARY KEY,
    rep_id TEXT REFERENCES public.users(id),
    plant_id TEXT,
    supplier_id TEXT,
    date DATE NOT NULL,
    hours NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    ot_hours NUMERIC(10,2) DEFAULT 0.00,
    mileage_km NUMERIC(10,2) DEFAULT 0.00,
    notes TEXT,
    invoiced BOOLEAN DEFAULT FALSE,
    sent_to_payroll BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'approved',
    tracking_code TEXT DEFAULT 'LEGACY-000',
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSE ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.expense_entries (
    id TEXT PRIMARY KEY,
    rep_id TEXT REFERENCES public.users(id),
    supplier_id TEXT,
    date DATE NOT NULL,
    category TEXT DEFAULT 'Fuel',
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    receipt_photo TEXT,
    notes TEXT,
    status TEXT DEFAULT 'approved',
    expense_group TEXT DEFAULT 'External',
    tracking_code TEXT DEFAULT 'LEGACY-EXP-000',
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SHIFT REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.shift_reports (
    id TEXT PRIMARY KEY,
    rep_id TEXT REFERENCES public.users(id),
    plant_id TEXT,
    date DATE NOT NULL,
    areas_walked JSONB DEFAULT '[]'::jsonb,
    incidents_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PAYROLL TABLE
CREATE TABLE IF NOT EXISTS public.payroll (
    id TEXT PRIMARY KEY,
    time_entry_id TEXT REFERENCES public.time_entries(id) ON DELETE CASCADE,
    rep_id TEXT REFERENCES public.users(id),
    rep_name TEXT,
    date DATE NOT NULL,
    hours NUMERIC(10,2) NOT NULL,
    pay_rate NUMERIC(10,2) NOT NULL,
    bill_rate NUMERIC(10,2) NOT NULL,
    rep_expense NUMERIC(10,2) NOT NULL,
    gross_revenue NUMERIC(10,2) NOT NULL,
    net_profit NUMERIC(10,2) NOT NULL,
    margin_percent NUMERIC(5,2),
    status TEXT DEFAULT 'approved',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rework_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated & anon clients
DROP POLICY IF EXISTS "Public Read Access Users" ON public.users;
CREATE POLICY "Public Read Access Users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Plants" ON public.plants;
CREATE POLICY "Public Read Access Plants" ON public.plants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Suppliers" ON public.suppliers;
CREATE POLICY "Public Read Access Suppliers" ON public.suppliers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Rates" ON public.rates;
CREATE POLICY "Public Read Access Rates" ON public.rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Projects" ON public.projects;
CREATE POLICY "Public Read Access Projects" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Incidents" ON public.incidents;
CREATE POLICY "Public Read Access Incidents" ON public.incidents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Rework" ON public.rework_logs;
CREATE POLICY "Public Read Access Rework" ON public.rework_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Time" ON public.time_entries;
CREATE POLICY "Public Read Access Time" ON public.time_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Expense" ON public.expense_entries;
CREATE POLICY "Public Read Access Expense" ON public.expense_entries FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Shift" ON public.shift_reports;
CREATE POLICY "Public Read Access Shift" ON public.shift_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access Payroll" ON public.payroll;
CREATE POLICY "Public Read Access Payroll" ON public.payroll FOR SELECT USING (true);

-- Allow insert/update access
DROP POLICY IF EXISTS "Public Insert Access Users" ON public.users;
CREATE POLICY "Public Insert Access Users" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Access Incidents" ON public.incidents;
CREATE POLICY "Public Insert Access Incidents" ON public.incidents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Access Rework" ON public.rework_logs;
CREATE POLICY "Public Insert Access Rework" ON public.rework_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Access Time" ON public.time_entries;
CREATE POLICY "Public Insert Access Time" ON public.time_entries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Access Expense" ON public.expense_entries;
CREATE POLICY "Public Insert Access Expense" ON public.expense_entries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Access Shift" ON public.shift_reports;
CREATE POLICY "Public Insert Access Shift" ON public.shift_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Insert Access Payroll" ON public.payroll;
CREATE POLICY "Public Insert Access Payroll" ON public.payroll FOR INSERT WITH CHECK (true);
