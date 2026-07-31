-- IDS Pulse Rep Hours & Overtime Workflow Schema Migration
-- Date: July 31, 2026

-- Explicit DDL Column Additions for Database Schema Compatibility
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

-- Hours and Overtime Tracking Columns
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

-- Client Review Fields
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_review_status TEXT DEFAULT 'none';
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_reviewed_by TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_reviewed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS client_review_comment TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS synchronized_at TIMESTAMPTZ;

-- Review Notes & Reason (Compatibility)
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS review_reason TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS incident_id TEXT;
ALTER TABLE IF EXISTS time_entries ADD COLUMN IF NOT EXISTS inspection_id TEXT;

-- Performance and Query Indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_assignment_id ON time_entries(assignment_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_hour_type ON time_entries(hour_type);
CREATE INDEX IF NOT EXISTS idx_time_entries_client_review_status ON time_entries(client_review_status);
CREATE INDEX IF NOT EXISTS idx_time_entries_rep_date ON time_entries(rep_id, date);
CREATE INDEX IF NOT EXISTS idx_time_entries_rep_work_date ON time_entries(rep_id, work_date);

-- Unique Partial Index for Idempotency Enforcement
CREATE UNIQUE INDEX IF NOT EXISTS idx_time_entries_idempotency_key ON time_entries(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Append-Only Audit Event Log Table for Overtime Decisions
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

CREATE INDEX IF NOT EXISTS idx_ot_audit_entry_id ON overtime_decision_audit_log(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_ot_audit_customer_id ON overtime_decision_audit_log(customer_id);

-- 1. Atomic Supabase RPC Function for Server-Side Allocation Locking & Splitting
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
  v_project_plant_id TEXT := NULL;
  v_proj_rep_id TEXT := NULL;
  v_proj_rep_ids JSONB := NULL;
  v_used_regular NUMERIC := 0.0;
  v_remaining NUMERIC := NULL;
  v_reg_portion NUMERIC := 0.0;
  v_ot_portion NUMERIC := 0.0;
  v_submission_id TEXT;
  v_reg_idempotency_key TEXT;
  v_ot_idempotency_key TEXT;
  v_reg_entry_id TEXT := NULL;
  v_ot_entry_id TEXT := NULL;
  v_existing_reg RECORD;
  v_existing_ot RECORD;
  v_authenticated_uid UUID;
  v_authenticated_rep_id TEXT := NULL;
  v_user_role TEXT := NULL;
  v_effective_rep_id TEXT;
  v_effective_supplier_id TEXT;
  v_effective_plant_id TEXT;
BEGIN
  -- 1. Strict Authentication Check: auth.uid() MUST be present
  v_authenticated_uid := auth.uid();
  IF v_authenticated_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to submit rep hours';
  END IF;

  -- 2. Input Validation Checks
  IF p_hours IS NULL OR p_hours <= 0 OR p_hours > 24 THEN
    RAISE EXCEPTION 'Invalid hours: Hours must be greater than 0 and at most 24';
  END IF;

  IF p_work_date IS NULL OR trim(p_work_date) = '' THEN
    RAISE EXCEPTION 'Invalid work date: Work date is required';
  END IF;

  IF p_idempotency_key IS NULL OR trim(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'Invalid submission: Non-empty idempotency key is required';
  END IF;

  IF p_project_id IS NULL OR trim(p_project_id) = '' THEN
    RAISE EXCEPTION 'Invalid submission: Project / assignment ID is required';
  END IF;

  -- 3. Resolve authenticated identity and role (strictly from users table)
  SELECT u.id::text, u.role INTO v_authenticated_rep_id, v_user_role
  FROM users u
  WHERE u.id = v_authenticated_uid::text OR u.auth_id = v_authenticated_uid
  LIMIT 1;

  IF v_authenticated_rep_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authenticated user % is not registered in system', v_authenticated_uid;
  END IF;

  IF v_user_role IS NULL OR v_user_role NOT IN ('rep', 'inspector', 'qre', 'admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized: User role % is not permitted to submit rep hours', COALESCE(v_user_role, 'none');
  END IF;

  -- 4. Lock & Lookup Authoritative Assignment Hours and ownership from projects table
  SELECT po_hours, supplier_id, plant_id, rep_id, rep_ids
  INTO v_authorized_hours, v_project_supplier_id, v_project_plant_id, v_proj_rep_id, v_proj_rep_ids
  FROM projects 
  WHERE id = p_project_id OR CAST(id AS TEXT) = p_project_id 
  FOR UPDATE;

  IF v_project_supplier_id IS NULL THEN
    RAISE EXCEPTION 'Invalid submission: Project % not found', p_project_id;
  END IF;

  -- Server-side assignment membership verification (Admin cannot bypass assignment requirement to log hours)
  IF NOT (COALESCE(v_proj_rep_id, '') = v_authenticated_rep_id OR (v_proj_rep_ids IS NOT NULL AND v_proj_rep_ids @> jsonb_build_array(v_authenticated_rep_id))) THEN
    RAISE EXCEPTION 'Unauthorized: Rep % does not have an active assignment to project %', v_authenticated_rep_id, p_project_id;
  END IF;

  -- 5. Allocation Configuration Enforcement
  IF v_authorized_hours IS NULL OR v_authorized_hours <= 0 THEN
    RAISE EXCEPTION 'Authorized hours are not configured. Contact Admin.';
  END IF;

  v_effective_rep_id := v_authenticated_rep_id;
  v_effective_supplier_id := v_project_supplier_id;
  v_effective_plant_id := v_project_plant_id;

  -- 6. Idempotency Enforcement Check
  v_reg_idempotency_key := p_idempotency_key || '_reg';
  v_ot_idempotency_key := p_idempotency_key || '_ot';

  SELECT * INTO v_existing_reg FROM time_entries WHERE idempotency_key = v_reg_idempotency_key OR idempotency_key = p_idempotency_key LIMIT 1;
  SELECT * INTO v_existing_ot FROM time_entries WHERE idempotency_key = v_ot_idempotency_key LIMIT 1;

  IF v_existing_reg.id IS NOT NULL OR v_existing_ot.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'idempotent_retry', true,
      'submission_id', p_idempotency_key,
      'regular_hours', COALESCE(v_existing_reg.hours, 0.0),
      'overtime_hours', COALESCE(v_existing_ot.hours, 0.0),
      'regular_entry_id', v_existing_reg.id,
      'overtime_entry_id', v_existing_ot.id,
      'message', 'Existing submission returned (idempotent request)'
    );
  END IF;

  -- 7. Calculate already recorded regular hours for this assignment/project
  SELECT COALESCE(SUM(hours), 0.0) INTO v_used_regular
  FROM time_entries
  WHERE (project_id = p_project_id OR CAST(project_id AS TEXT) = p_project_id OR assignment_id = p_project_id)
    AND (hour_type = 'regular' OR status = 'recorded');

  -- 8. Atomic Allocation Portioning Calculation
  v_remaining := GREATEST(0.0, v_authorized_hours - v_used_regular);
  IF p_hours <= v_remaining THEN
    v_reg_portion := p_hours;
    v_ot_portion := 0.0;
  ELSE
    v_reg_portion := v_remaining;
    v_ot_portion := p_hours - v_reg_portion;
  END IF;

  v_submission_id := 'sub_' || replace(gen_random_uuid()::text, '-', '');

  -- 9. Insert Regular Hours Entry if v_reg_portion > 0
  IF v_reg_portion > 0 THEN
    v_reg_entry_id := 'te_reg_' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO time_entries (
      id, rep_id, supplier_id, plant_id, project_id, assignment_id, date, work_date,
      hours, reported_hours, regular_hours, overtime_hours, hour_type, status,
      approval_required, approval_source, authorized_hours_snapshot, remaining_hours_before,
      remaining_hours_after, linked_submission_id, idempotency_key, work_type, work_summary,
      notes, created_at, synchronized_at
    ) VALUES (
      v_reg_entry_id, v_effective_rep_id, v_effective_supplier_id, v_effective_plant_id,
      p_project_id, p_project_id, p_work_date::date, p_work_date::date,
      v_reg_portion, p_hours, v_reg_portion, 0.0, 'regular', 'recorded',
      false, 'authorized_assignment', v_authorized_hours, v_remaining,
      GREATEST(0.0, v_remaining - v_reg_portion),
      v_submission_id, v_reg_idempotency_key, p_work_type, p_work_summary, p_notes, NOW(), NOW()
    );
  END IF;

  -- 10. Insert Overtime Hours Entry if v_ot_portion > 0
  IF v_ot_portion > 0 THEN
    v_ot_entry_id := 'te_ot_' || replace(gen_random_uuid()::text, '-', '');
    INSERT INTO time_entries (
      id, rep_id, supplier_id, plant_id, project_id, assignment_id, date, work_date,
      hours, reported_hours, regular_hours, overtime_hours, hour_type, status,
      approval_required, approval_source, authorized_hours_snapshot, remaining_hours_before,
      remaining_hours_after, linked_submission_id, idempotency_key, client_review_status,
      work_type, work_summary, notes, created_at, synchronized_at
    ) VALUES (
      v_ot_entry_id, v_effective_rep_id, v_effective_supplier_id, v_effective_plant_id,
      p_project_id, p_project_id, p_work_date::date, p_work_date::date,
      v_ot_portion, p_hours, 0.0, v_ot_portion, 'overtime', 'client_pending',
      true, 'client_approval', v_authorized_hours, v_remaining, 0.0,
      v_submission_id, v_ot_idempotency_key, 'pending', p_work_type, p_work_summary,
      p_notes, NOW(), NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'idempotent_retry', false,
    'submission_id', v_submission_id,
    'reported_hours', p_hours,
    'regular_hours', v_reg_portion,
    'overtime_hours', v_ot_portion,
    'regular_entry_id', v_reg_entry_id,
    'overtime_entry_id', v_ot_entry_id,
    'authorized_hours', v_authorized_hours,
    'remaining_before', v_remaining,
    'message', CASE
      WHEN v_ot_portion > 0 THEN 'Hours portioned into ' || v_reg_portion || ' hrs regular (recorded) and ' || v_ot_portion || ' hrs overtime (client approval pending)'
      ELSE 'All ' || v_reg_portion || ' hrs recorded automatically as regular hours'
    END
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_rep_hours_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION submit_rep_hours_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;


-- 2. Atomic Supabase RPC Function for Server-Side Client Overtime Review & Authorization
CREATE OR REPLACE FUNCTION review_client_overtime_atomic(
  p_time_entry_id TEXT,
  p_action TEXT, -- 'approved', 'returned', 'rejected'
  p_comment TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_authenticated_uid UUID;
  v_authenticated_customer_id TEXT := NULL;
  v_user_role TEXT := NULL;
  v_entry RECORD;
  v_new_status TEXT;
  v_reviewer_name TEXT;
BEGIN
  -- 1. Authentication check: auth.uid() MUST be present
  v_authenticated_uid := auth.uid();
  IF v_authenticated_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to review overtime';
  END IF;

  -- 2. Validate Action
  IF p_action NOT IN ('approved', 'returned', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: Must be approved, returned, or rejected';
  END IF;

  -- Require comment for return and reject
  IF p_action IN ('returned', 'rejected') AND (p_comment IS NULL OR trim(p_comment) = '') THEN
    RAISE EXCEPTION 'A mandatory comment is required for return or rejection';
  END IF;

  -- 3. Resolve Customer ID and Role server-side (NO COALESCE fallback to 'client')
  SELECT 
    COALESCE(u.supplier_id, u.customer_id),
    u.role,
    COALESCE(u.name, u.username, 'Client Manager')
  INTO v_authenticated_customer_id, v_user_role, v_reviewer_name
  FROM users u
  WHERE u.id = v_authenticated_uid::text OR u.auth_id = v_authenticated_uid
  LIMIT 1;

  IF v_authenticated_customer_id IS NULL THEN
    SELECT id, 'client', COALESCE(name, 'Client Manager')
    INTO v_authenticated_customer_id, v_user_role, v_reviewer_name
    FROM suppliers
    WHERE auth_user_id = v_authenticated_uid
    LIMIT 1;
  END IF;

  -- Role Verification: MUST be verified Client role
  IF v_user_role IS NULL OR v_user_role NOT IN ('client', 'customer') THEN
    RAISE EXCEPTION 'Unauthorized: User role % is not a verified Client role', COALESCE(v_user_role, 'none');
  END IF;

  IF v_authenticated_customer_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No client customer association found for user';
  END IF;

  -- 4. Lock time entry
  SELECT * INTO v_entry FROM time_entries WHERE id = p_time_entry_id FOR UPDATE;
  IF v_entry.id IS NULL THEN
    RAISE EXCEPTION 'Time entry % not found', p_time_entry_id;
  END IF;

  -- Enforce entry is overtime
  IF COALESCE(v_entry.hour_type, 'regular') <> 'overtime' THEN
    RAISE EXCEPTION 'Time entry % is not an overtime entry', p_time_entry_id;
  END IF;

  -- Enforce Strict Customer Ownership Match (No Admin/Super-Admin Bypass)
  IF COALESCE(v_entry.supplier_id::text, '') <> COALESCE(v_authenticated_customer_id::text, '') THEN
    RAISE EXCEPTION 'Unauthorized: User customer % does not match entry customer %', v_authenticated_customer_id, v_entry.supplier_id;
  END IF;

  -- 5. State Machine & Resubmission Requirement Enforcement
  IF COALESCE(v_entry.status, '') NOT IN ('client_pending', 'pending') AND COALESCE(v_entry.client_review_status, '') NOT IN ('pending') THEN
    IF v_entry.status = 'client_returned' OR v_entry.client_review_status = 'returned' THEN
      RAISE EXCEPTION 'Invalid state: Returned overtime entry % must be resubmitted by the Rep before it can be reviewed again', p_time_entry_id;
    ELSE
      RAISE EXCEPTION 'Invalid state: Overtime entry % is in state % and cannot be reviewed', p_time_entry_id, v_entry.status;
    END IF;
  END IF;

  -- 6. Idempotency Check
  IF v_entry.client_review_status = p_action THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'idempotent_retry', true,
      'entry_id', v_entry.id,
      'client_review_status', v_entry.client_review_status,
      'message', 'Overtime review already set to ' || p_action
    );
  END IF;

  v_new_status := CASE p_action
    WHEN 'approved' THEN 'client_approved'
    WHEN 'returned' THEN 'client_returned'
    WHEN 'rejected' THEN 'client_rejected'
  END;

  -- 7. Update time entry
  UPDATE time_entries SET
    status = v_new_status,
    client_review_status = p_action,
    client_reviewed_by = v_reviewer_name,
    client_reviewed_at = NOW(),
    client_review_comment = trim(p_comment),
    review_notes = trim(p_comment),
    synchronized_at = NOW()
  WHERE id = p_time_entry_id;

  -- 8. Record Append-Only Audit Event
  INSERT INTO overtime_decision_audit_log (
    time_entry_id, actor_id, customer_id, old_status, new_status, action, comment, created_at
  ) VALUES (
    p_time_entry_id, v_authenticated_uid::text, v_authenticated_customer_id, v_entry.status, v_new_status, p_action, trim(p_comment), NOW()
  );

  RETURN jsonb_build_object(
    'status', 'success',
    'idempotent_retry', false,
    'entry_id', p_time_entry_id,
    'previous_status', v_entry.status,
    'new_status', v_new_status,
    'client_review_status', p_action,
    'reviewed_by', v_reviewer_name,
    'comment', trim(p_comment)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION review_client_overtime_atomic(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION review_client_overtime_atomic(TEXT, TEXT, TEXT) TO authenticated;
