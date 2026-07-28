-- IDS Pulse Authoritative Database Schema Reconciliation & RLS Policy Migration
-- Date: July 28, 2026
-- Targets: All database drift and missing schema columns identified in IDS_PULSE_FULL_BUTTON_AUDIT_2026-07-28.md

-- 1. Daily Tasks: Add missing date column
ALTER TABLE IF EXISTS daily_tasks ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- 2. Shift Reports: Add missing approved_for_billing and bonus_tasks columns
ALTER TABLE IF EXISTS shift_reports ADD COLUMN IF NOT EXISTS approved_for_billing BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS shift_reports ADD COLUMN IF NOT EXISTS bonus_tasks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS shift_reports ADD COLUMN IF NOT EXISTS work_session_id TEXT;

-- 3. Users: Add missing rep_no column
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS rep_no TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT FALSE;

-- 4. Rates: Add missing currency column
ALTER TABLE IF EXISTS rates ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD';

-- 5. Projects: Add missing client_id column
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS client_id TEXT;

-- 6. Plants: Add missing supplier_ids array column
ALTER TABLE IF EXISTS plants ADD COLUMN IF NOT EXISTS supplier_ids JSONB DEFAULT '[]'::jsonb;

-- 7. Incidents: Add missing action_taken column
ALTER TABLE IF EXISTS incidents ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE IF EXISTS incidents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE IF EXISTS incidents ADD COLUMN IF NOT EXISTS revision_history JSONB DEFAULT '[]'::jsonb;

-- 8. Rework Logs: Add missing date column
ALTER TABLE IF EXISTS rework_logs ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;

-- 9. Extra Hours Requests: Add missing user_name and userName mapping columns
ALTER TABLE IF EXISTS extra_hours_requests ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE IF EXISTS extra_hours_requests ADD COLUMN IF NOT EXISTS "userName" TEXT;

-- 10. Time Entries: Add missing sent_to_payroll_at column
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS sent_to_payroll_at TIMESTAMPTZ;

-- 11. Work Sessions Table
CREATE TABLE IF NOT EXISTS work_sessions (
    id TEXT PRIMARY KEY,
    rep_id TEXT NOT NULL,
    project_id TEXT,
    plant_id TEXT,
    client_id TEXT,
    clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clock_out_at TIMESTAMPTZ,
    duration_hours NUMERIC(6,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Weekly Timesheets Table (snake_case database table matching weeklyTimesheets)
CREATE TABLE IF NOT EXISTS weekly_timesheets (
    id TEXT PRIMARY KEY,
    person_name TEXT NOT NULL,
    week_start_date DATE NOT NULL,
    grid_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    signed_by TEXT,
    signed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Enable Row Level Security (RLS) on key tables
ALTER TABLE IF EXISTS time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS weekly_timesheets ENABLE ROW LEVEL SECURITY;

-- 14. Add permissive authenticated policy for prototype tenants & roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_authenticated_all_time_entries') THEN
        CREATE POLICY allow_authenticated_all_time_entries ON time_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_authenticated_all_expense_entries') THEN
        CREATE POLICY allow_authenticated_all_expense_entries ON expense_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_authenticated_all_shift_reports') THEN
        CREATE POLICY allow_authenticated_all_shift_reports ON shift_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_authenticated_all_incidents') THEN
        CREATE POLICY allow_authenticated_all_incidents ON incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_authenticated_all_work_sessions') THEN
        CREATE POLICY allow_authenticated_all_work_sessions ON work_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'allow_authenticated_all_weekly_timesheets') THEN
        CREATE POLICY allow_authenticated_all_weekly_timesheets ON weekly_timesheets FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
