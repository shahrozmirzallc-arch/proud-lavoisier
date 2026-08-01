-- IDS Pulse Phase 1 Security Remediation Migration
-- Target: Supabase Project wuqqrcowznrmmuokfxlk
-- Date: August 01, 2026

-- ====================================================
-- 1. LOCK DOWN SENSITIVE RPC FUNCTIONS (REVOKE FROM ANON)
-- ====================================================

-- Revoke execution of purge_demo_data() from unauthenticated anon and PUBLIC
REVOKE EXECUTE ON FUNCTION purge_demo_data() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION purge_demo_data() TO service_role;

-- ====================================================
-- 2. REVOKE ALL ANON ACCESS ON PUBLIC SCHEMA TABLES
-- ====================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- ====================================================
-- 3. SCHEMA COLUMNS AND MISSING TABLES
-- ====================================================

ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS customer_id TEXT;

ALTER TABLE IF EXISTS suppliers ADD COLUMN IF NOT EXISTS auth_user_id UUID;

ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS rep_id TEXT;
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS rep_ids JSONB;
ALTER TABLE IF EXISTS projects ADD COLUMN IF NOT EXISTS po_hours NUMERIC;

ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS assignment_id TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS work_date DATE;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT 'Routine inspection';
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS work_summary TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'rep_reported';
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS reported_hours NUMERIC;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS regular_hours NUMERIC;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS hour_type TEXT DEFAULT 'regular';
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'recorded';
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS approval_source TEXT DEFAULT 'authorized_assignment';
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS authorized_hours_snapshot NUMERIC;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS remaining_hours_before NUMERIC;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS remaining_hours_after NUMERIC;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS linked_submission_id TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_review_status TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_reviewed_by TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_reviewed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_review_comment TEXT;

-- Create overtime_decision_audit_log table if not exists
CREATE TABLE IF NOT EXISTS overtime_decision_audit_log (
  id TEXT PRIMARY KEY DEFAULT ('ot_audit_' || replace(gen_random_uuid()::text, '-', '')),
  time_entry_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  action TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- 4. ATOMIC RPC FUNCTIONS (SECURITY DEFINER)
-- ====================================================

-- 4a. submit_rep_hours_atomic
CREATE OR REPLACE FUNCTION submit_rep_hours_atomic(
  p_idempotency_key TEXT,
  p_rep_id TEXT,
  p_supplier_id TEXT,
  p_plant_id TEXT,
  p_project_id TEXT,
  p_work_date TEXT,
  p_hours NUMERIC,
  p_work_type TEXT DEFAULT 'Routine inspection',
  p_work_summary TEXT DEFAULT '',
  p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_authorized_hours NUMERIC := NULL;
  v_project_supplier_id TEXT := NULL;
  v_existing_recorded_hours NUMERIC := 0;
  v_remaining_hours NUMERIC := 0;
  v_regular_hours NUMERIC := 0;
  v_overtime_hours NUMERIC := 0;
  v_regular_entry_id TEXT := NULL;
  v_overtime_entry_id TEXT := NULL;
  v_existing_entry_id TEXT := NULL;
  v_submission_group_id TEXT := NULL;
  v_parsed_date DATE;
BEGIN
  IF p_hours IS NULL OR p_hours <= 0 THEN
    RAISE EXCEPTION 'Submitted hours must be a positive number greater than 0';
  END IF;

  BEGIN
    v_parsed_date := p_work_date::DATE;
  EXCEPTION WHEN OTHERS THEN
    v_parsed_date := CURRENT_DATE;
  END BEGIN;

  IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
    SELECT id INTO v_existing_entry_id
    FROM time_entries
    WHERE idempotency_key = p_idempotency_key
    LIMIT 1;

    IF v_existing_entry_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'status', 'success',
        'idempotent', true,
        'message', 'Hours already submitted with this idempotency key',
        'entry_id', v_existing_entry_id
      );
    END IF;
  END IF;

  IF p_project_id IS NOT NULL AND p_project_id <> '' THEN
    SELECT po_hours, supplier_id INTO v_authorized_hours, v_project_supplier_id
    FROM projects
    WHERE id = p_project_id OR name = p_project_id;
  END IF;

  IF v_authorized_hours IS NULL OR v_authorized_hours <= 0 THEN
    v_authorized_hours := 40.0;
  END IF;

  SELECT COALESCE(SUM(COALESCE(regular_hours, hours, 0)), 0) INTO v_existing_recorded_hours
  FROM time_entries
  WHERE (project_id = p_project_id OR (p_project_id IS NULL AND plant_id = p_plant_id))
    AND status IN ('recorded', 'approved', 'submitted');

  v_remaining_hours := GREATEST(0, v_authorized_hours - v_existing_recorded_hours);

  IF v_remaining_hours >= p_hours THEN
    v_regular_hours := p_hours;
    v_overtime_hours := 0;
  ELSE
    v_regular_hours := v_remaining_hours;
    v_overtime_hours := p_hours - v_remaining_hours;
  END IF;

  v_submission_group_id := 'sub_' || replace(gen_random_uuid()::text, '-', '');

  IF v_regular_hours > 0 THEN
    v_regular_entry_id := 'te_reg_' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO time_entries (
      id, rep_id, supplier_id, plant_id, project_id, date, work_date,
      hours, reported_hours, regular_hours, overtime_hours, hour_type,
      status, approval_required, approval_source, authorized_hours_snapshot,
      remaining_hours_before, remaining_hours_after, work_type, work_summary,
      notes, source, submitted_at, linked_submission_id, idempotency_key, client_review_status
    ) VALUES (
      v_regular_entry_id, p_rep_id, COALESCE(p_supplier_id, v_project_supplier_id), p_plant_id, p_project_id, p_work_date, v_parsed_date,
      v_regular_hours, p_hours, v_regular_hours, 0, 'regular',
      'recorded', false, 'authorized_assignment', v_authorized_hours,
      v_remaining_hours, GREATEST(0, v_remaining_hours - v_regular_hours), p_work_type, p_work_summary,
      p_notes, 'rep_reported', NOW(), v_submission_group_id, p_idempotency_key, 'none'
    );
  END IF;

  IF v_overtime_hours > 0 THEN
    v_overtime_entry_id := 'te_ot_' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO time_entries (
      id, rep_id, supplier_id, plant_id, project_id, date, work_date,
      hours, reported_hours, regular_hours, overtime_hours, hour_type,
      status, approval_required, approval_source, authorized_hours_snapshot,
      remaining_hours_before, remaining_hours_after, work_type, work_summary,
      notes, source, submitted_at, linked_submission_id, idempotency_key, client_review_status
    ) VALUES (
      v_overtime_entry_id, p_rep_id, COALESCE(p_supplier_id, v_project_supplier_id), p_plant_id, p_project_id, p_work_date, v_parsed_date,
      v_overtime_hours, p_hours, 0, v_overtime_hours, 'overtime',
      'pending_client_approval', true, 'exceeds_po_allocation', v_authorized_hours,
      v_remaining_hours, 0, p_work_type, p_work_summary,
      p_notes, 'rep_reported', NOW(), v_submission_group_id, CASE WHEN p_idempotency_key IS NOT NULL THEN p_idempotency_key || '_ot' ELSE NULL END, 'pending_review'
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'idempotent', false,
    'submission_group_id', v_submission_group_id,
    'regular_entry_id', v_regular_entry_id,
    'overtime_entry_id', v_overtime_entry_id,
    'regular_hours', v_regular_hours,
    'overtime_hours', v_overtime_hours,
    'authorized_hours_snapshot', v_authorized_hours,
    'remaining_hours_after', GREATEST(0, v_remaining_hours - v_regular_hours)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION submit_rep_hours_atomic TO authenticated, service_role;

-- 4b. review_client_overtime_atomic
CREATE OR REPLACE FUNCTION review_client_overtime_atomic(
  p_time_entry_id TEXT,
  p_decision TEXT,
  p_actor_id TEXT,
  p_comment TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_entry RECORD;
  v_user RECORD;
  v_old_status TEXT;
  v_new_status TEXT;
BEGIN
  IF p_decision NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid decision. Must be approve or reject.';
  END IF;

  SELECT * INTO v_entry FROM time_entries WHERE id = p_time_entry_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Time entry % not found.', p_time_entry_id;
  END IF;

  SELECT * INTO v_user FROM users WHERE id = p_actor_id OR auth_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Actor % not authorized.', p_actor_id;
  END IF;

  v_old_status := COALESCE(v_entry.client_review_status, 'pending_review');

  IF p_decision = 'approve' THEN
    v_new_status := 'approved';
    UPDATE time_entries
    SET client_review_status = 'approved',
        status = 'approved',
        client_reviewed_by = p_actor_id,
        client_reviewed_at = NOW(),
        client_review_comment = p_comment,
        review_notes = p_comment,
        reviewed_by = p_actor_id,
        reviewed_at = NOW()
    WHERE id = p_time_entry_id;
  ELSE
    v_new_status := 'rejected';
    UPDATE time_entries
    SET client_review_status = 'rejected',
        status = 'rejected',
        client_reviewed_by = p_actor_id,
        client_reviewed_at = NOW(),
        client_review_comment = p_comment,
        review_notes = p_comment,
        reviewed_by = p_actor_id,
        reviewed_at = NOW()
    WHERE id = p_time_entry_id;
  END IF;

  INSERT INTO overtime_decision_audit_log (
    time_entry_id, actor_id, customer_id, old_status, new_status, action, comment
  ) VALUES (
    p_time_entry_id, p_actor_id, COALESCE(v_entry.supplier_id, 'unknown'), v_old_status, v_new_status, p_decision, p_comment
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'time_entry_id', p_time_entry_id,
    'decision', p_decision,
    'new_status', v_new_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION review_client_overtime_atomic TO authenticated, service_role;

-- ====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================

ALTER TABLE IF EXISTS time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS overtime_decision_audit_log ENABLE ROW LEVEL SECURITY;

-- Drop permissive policies
DROP POLICY IF EXISTS "allow_authenticated_all_time_entries" ON time_entries;
DROP POLICY IF EXISTS "allow_authenticated_all_projects" ON projects;
DROP POLICY IF EXISTS "allow_authenticated_all_users" ON users;
DROP POLICY IF EXISTS "allow_authenticated_all_suppliers" ON suppliers;
DROP POLICY IF EXISTS "allow_authenticated_all_expense_entries" ON expense_entries;
DROP POLICY IF EXISTS "allow_all_time_entries" ON time_entries;
DROP POLICY IF EXISTS "allow_all_projects" ON projects;
DROP POLICY IF EXISTS "time_entries_rep_select" ON time_entries;
DROP POLICY IF EXISTS "time_entries_client_select" ON time_entries;
DROP POLICY IF EXISTS "time_entries_admin_acct_select" ON time_entries;
DROP POLICY IF EXISTS "time_entries_rep_insert" ON time_entries;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;

-- Authenticated Users & Reps Policies
CREATE POLICY users_select_policy ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY users_self_update ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid()::text OR auth_id = auth.uid())
  WITH CHECK (id = auth.uid()::text OR auth_id = auth.uid());

CREATE POLICY time_entries_rep_select ON time_entries
  FOR SELECT TO authenticated
  USING (
    rep_id IN (SELECT id::text FROM users WHERE auth_id = auth.uid() OR id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE (auth_id = auth.uid() OR id = auth.uid()::text) AND role IN ('admin', 'superadmin', 'accountant', 'owner', 'lead'))
  );

CREATE POLICY time_entries_client_select ON time_entries
  FOR SELECT TO authenticated
  USING (
    supplier_id IN (
      SELECT COALESCE(supplier_id, customer_id) FROM users WHERE auth_id = auth.uid() OR id = auth.uid()::text
    )
    OR EXISTS (SELECT 1 FROM users WHERE (auth_id = auth.uid() OR id = auth.uid()::text) AND role IN ('admin', 'superadmin', 'accountant', 'owner', 'lead'))
  );

CREATE POLICY time_entries_rep_insert ON time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    rep_id IN (SELECT id::text FROM users WHERE auth_id = auth.uid() OR id = auth.uid()::text)
    OR EXISTS (SELECT 1 FROM users WHERE (auth_id = auth.uid() OR id = auth.uid()::text) AND role IN ('admin', 'superadmin', 'accountant', 'owner', 'lead'))
  );

CREATE POLICY projects_select_policy ON projects
  FOR SELECT TO authenticated USING (true);
