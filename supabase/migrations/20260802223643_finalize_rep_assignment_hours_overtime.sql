-- IDS Pulse Final Rep Hours, Allocation, Financial Rates, Quality Revisions, and Client Overtime Migration
-- File: supabase/migrations/20260802223643_finalize_rep_assignment_hours_overtime.sql

BEGIN;

-- 1. Create/Normalize Authoritative Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
  id TEXT PRIMARY KEY DEFAULT ('asgn_' || replace(gen_random_uuid()::text, '-', '')),
  organization_id TEXT,
  project_id TEXT NOT NULL,
  rep_id TEXT NOT NULL,
  billing_customer_id TEXT NOT NULL,
  supplier_id TEXT,
  plant_id TEXT,
  authorized_regular_hours NUMERIC(10,2),
  status TEXT DEFAULT 'active',
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_rep_id ON public.assignments(rep_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project_id ON public.assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_billing_customer_id ON public.assignments(billing_customer_id);

-- Backfill unambiguous assignments from existing projects without fake prohibited defaults
INSERT INTO public.assignments (
  id, organization_id, project_id, rep_id, billing_customer_id, supplier_id, plant_id, authorized_regular_hours, status
)
SELECT 
  'asgn_' || replace(gen_random_uuid()::text, '-', ''),
  p.organization_id,
  p.id::text,
  p.rep_id::text,
  COALESCE(p.client_id, p.supplier_id)::text,
  p.supplier_id::text,
  p.plant_id::text,
  p.po_hours,
  'active'
FROM public.projects p
WHERE p.rep_id IS NOT NULL 
  AND (p.client_id IS NOT NULL OR p.supplier_id IS NOT NULL)
  AND NOT EXISTS (
    SELECT 1 FROM public.assignments a WHERE a.project_id = p.id::text AND a.rep_id = p.rep_id::text
  );

-- 2. Create Assignment Rate Cards Table (Section G & P0.13: Effective-Dated Rate Model without Fake Defaults)
CREATE TABLE IF NOT EXISTS public.assignment_rate_cards (
  id TEXT PRIMARY KEY DEFAULT ('rc_' || replace(gen_random_uuid()::text, '-', '')),
  assignment_id TEXT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  billing_rate NUMERIC(10,2),
  billing_currency TEXT,
  pay_rate NUMERIC(10,2),
  pay_currency TEXT,
  overtime_billing_rate NUMERIC(10,2),
  overtime_billing_multiplier NUMERIC(10,2),
  overtime_pay_rate NUMERIC(10,2),
  overtime_pay_multiplier NUMERIC(10,2),
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_cards_assignment_id ON public.assignment_rate_cards(assignment_id);

-- 3. Create Time Entry Financial Snapshots Table (Section G & P0.1: Protected Financial Snapshot Model)
CREATE TABLE IF NOT EXISTS public.time_entry_financials (
  id TEXT PRIMARY KEY DEFAULT ('tef_' || replace(gen_random_uuid()::text, '-', '')),
  time_entry_id TEXT NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  billable_hours NUMERIC(10,2) DEFAULT 0.00,
  payable_hours NUMERIC(10,2) DEFAULT 0.00,
  billing_rate_snapshot NUMERIC(10,2),
  billing_currency_snapshot TEXT,
  pay_rate_snapshot NUMERIC(10,2),
  pay_currency_snapshot TEXT,
  overtime_billing_rate_snapshot NUMERIC(10,2),
  overtime_pay_rate_snapshot NUMERIC(10,2),
  rate_card_id TEXT,
  rate_effective_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tef_time_entry_id ON public.time_entry_financials(time_entry_id);

-- 4. Create Overtime Audit Events Table (Tenant-Scoped Audit Trail)
CREATE TABLE IF NOT EXISTS public.overtime_audit_events (
  id TEXT PRIMARY KEY DEFAULT ('oae_' || replace(gen_random_uuid()::text, '-', '')),
  time_entry_id TEXT NOT NULL REFERENCES public.time_entries(id) ON DELETE CASCADE,
  billing_customer_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oae_customer_id ON public.overtime_audit_events(billing_customer_id);

-- 5. Incidents Quality & Financial Status Columns & Revisions Table (Part 8 & 12)
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'Preliminary Alert Sent';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS financial_status TEXT DEFAULT 'Hours Incomplete';
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS no_invoice_reason TEXT;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS current_revision INTEGER DEFAULT 1;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS archived_by TEXT;

CREATE TABLE IF NOT EXISTS public.incident_revisions (
  id TEXT PRIMARY KEY DEFAULT ('rev_' || replace(gen_random_uuid()::text, '-', '')),
  incident_id TEXT NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  revision_type TEXT NOT NULL,
  summary TEXT,
  payload JSONB,
  media_urls JSONB,
  published_by TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  recipient_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(incident_id, revision_number)
);

CREATE INDEX IF NOT EXISTS idx_revisions_incident_id ON public.incident_revisions(incident_id);

-- 6. Durable Notifications Table (Part 10)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || replace(gen_random_uuid()::text, '-', '')),
  idempotency_key TEXT UNIQUE,
  recipient_user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_id TEXT,
  entity_type TEXT,
  deep_link TEXT,
  read BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_delivery_status TEXT DEFAULT 'pending',
  mandatory_cc_snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON public.notifications(recipient_user_id);

-- 7. Drop Obsolete Stored Procedures
DROP FUNCTION IF EXISTS public.submit_rep_hours_atomic(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.submit_rep_hours_atomic(TEXT, TEXT, DATE, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.review_client_overtime_atomic(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.review_client_overtime_atomic(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.resubmit_returned_overtime_atomic(TEXT, TEXT, TEXT);

-- 8. Canonical Security Definer RPC: submit_rep_hours_atomic (P0.4 & P0.14)
CREATE OR REPLACE FUNCTION public.submit_rep_hours_atomic(
  p_idempotency_key TEXT,
  p_assignment_id TEXT,
  p_work_date DATE,
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
  v_auth_uid UUID;
  v_auth_user_id TEXT;
  v_user_role TEXT;
  v_assignment RECORD;
  v_rate_card RECORD;
  v_auth_hours NUMERIC(10,2);
  v_used_regular NUMERIC(10,2) := 0.00;
  v_remaining_alloc NUMERIC(10,2) := 0.00;
  v_reg_portion NUMERIC(10,2) := 0.00;
  v_ot_portion NUMERIC(10,2) := 0.00;
  v_submission_id TEXT;
  v_reg_entry_id TEXT;
  v_ot_entry_id TEXT;
  v_effective_billing_rate NUMERIC(10,2);
  v_effective_pay_rate NUMERIC(10,2);
  v_effective_billing_curr TEXT;
  v_effective_pay_curr TEXT;
  v_effective_ot_billing NUMERIC(10,2);
  v_effective_ot_pay NUMERIC(10,2);
  v_existing_sub_id TEXT;
BEGIN
  -- A. Authenticated Identity Check
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to submit hours';
  END IF;

  -- P0.4: Resolve internal user from public.users mapping auth.uid() -> auth_id -> id
  SELECT id, role INTO v_auth_user_id, v_user_role 
  FROM public.users 
  WHERE auth_id = v_auth_uid::text OR id = v_auth_uid::text 
  LIMIT 1;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authenticated user record not found in public.users';
  END IF;

  -- P0.4: Field-Rep Role Validation
  IF v_user_role IS NOT NULL AND v_user_role IN ('admin', 'owner', 'accountant', 'client', 'customer', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized: User role % is not permitted to submit Rep hours', v_user_role;
  END IF;

  IF p_hours IS NULL OR p_hours <= 0 OR p_hours > 24 THEN
    RAISE EXCEPTION 'Invalid hours: Hours reported must be greater than zero and at most 24';
  END IF;

  IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
    RAISE EXCEPTION 'Invalid submission: Idempotency key is required';
  END IF;

  -- P0.14: Idempotent Replay Check (Returns existing result deterministically)
  SELECT linked_submission_id, regular_hours, overtime_hours INTO v_existing_sub_id, v_reg_portion, v_ot_portion
  FROM public.time_entries
  WHERE idempotency_key LIKE (p_idempotency_key || '%')
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_existing_sub_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'idempotent_replay', true,
      'submission_id', v_existing_sub_id,
      'regular_hours', v_reg_portion,
      'overtime_hours', v_ot_portion
    );
  END IF;

  -- Exact Assignment Lookup with Real FOR UPDATE Row Lock & Effective Date Validation
  SELECT * INTO v_assignment 
  FROM public.assignments 
  WHERE id = p_assignment_id 
    AND rep_id = v_auth_user_id 
    AND status = 'active' 
    AND (effective_from IS NULL OR effective_from <= p_work_date)
    AND (effective_to IS NULL OR effective_to >= p_work_date)
  FOR UPDATE;

  IF v_assignment.id IS NULL THEN
    RAISE EXCEPTION 'Invalid submission: Active assignment % not found or not active on date % for Rep', p_assignment_id, p_work_date;
  END IF;

  v_auth_hours := v_assignment.authorized_regular_hours;

  -- Missing Allocation Handling
  IF v_auth_hours IS NULL OR v_auth_hours <= 0 THEN
    v_reg_entry_id := 'te_uncfg_' || replace(gen_random_uuid()::text, '-', '');
    
    INSERT INTO public.time_entries (
      id, idempotency_key, rep_id, supplier_id, plant_id, project_id, assignment_id,
      work_date, reported_hours, regular_hours, overtime_hours, hours, hour_type,
      status, approval_required, approval_source, synchronized_at, work_summary
    ) VALUES (
      v_reg_entry_id, p_idempotency_key || '_uncfg', v_auth_user_id, v_assignment.supplier_id,
      v_assignment.plant_id, v_assignment.project_id, v_assignment.id,
      p_work_date, p_hours, p_hours, 0.00, p_hours, 'regular',
      'needs_allocation_configuration', false, 'authorized_assignment', NOW(), p_work_summary
    );

    RETURN jsonb_build_object(
      'status', 'needs_allocation_configuration',
      'message', 'Hours saved. Authorized assignment hours must be configured before processing.',
      'time_entry_id', v_reg_entry_id
    );
  END IF;

  -- Cumulative Recorded Regular Hours
  SELECT COALESCE(SUM(hours), 0.00) INTO v_used_regular
  FROM public.time_entries
  WHERE assignment_id = v_assignment.id
    AND rep_id = v_auth_user_id
    AND (hour_type = 'regular' OR status = 'recorded')
    AND status NOT IN ('voided', 'rejected', 'needs_allocation_configuration', 'needs_configuration');

  v_remaining_alloc := GREATEST(0.00, v_auth_hours - v_used_regular);
  v_reg_portion := LEAST(p_hours, v_remaining_alloc);
  v_ot_portion := GREATEST(0.00, p_hours - v_reg_portion);
  v_submission_id := 'sub_' || replace(gen_random_uuid()::text, '-', '');

  -- Fetch Rate Card with Effective Dates
  SELECT * INTO v_rate_card 
  FROM public.assignment_rate_cards 
  WHERE assignment_id = v_assignment.id 
    AND (effective_from IS NULL OR effective_from <= p_work_date)
    AND (effective_to IS NULL OR effective_to >= p_work_date)
  ORDER BY effective_from DESC LIMIT 1;

  v_effective_billing_rate := v_rate_card.billing_rate;
  v_effective_billing_curr := v_rate_card.billing_currency;
  v_effective_pay_rate := v_rate_card.pay_rate;
  v_effective_pay_curr := v_rate_card.pay_currency;
  v_effective_ot_billing := COALESCE(v_rate_card.overtime_billing_rate, CASE WHEN v_rate_card.billing_rate IS NOT NULL AND v_rate_card.overtime_billing_multiplier IS NOT NULL THEN v_rate_card.billing_rate * v_rate_card.overtime_billing_multiplier ELSE NULL END);
  v_effective_ot_pay := COALESCE(v_rate_card.overtime_pay_rate, CASE WHEN v_rate_card.pay_rate IS NOT NULL AND v_rate_card.overtime_pay_multiplier IS NOT NULL THEN v_rate_card.pay_rate * v_rate_card.overtime_pay_multiplier ELSE NULL END);

  -- P0.13: Flag missing rate/currency configuration cleanly
  IF v_effective_billing_rate IS NULL OR v_effective_pay_rate IS NULL OR v_effective_billing_curr IS NULL OR v_effective_pay_curr IS NULL THEN
    v_reg_entry_id := 'te_norate_' || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO public.time_entries (
      id, idempotency_key, linked_submission_id, rep_id, supplier_id, plant_id, project_id, assignment_id,
      work_date, reported_hours, regular_hours, overtime_hours, hours, hour_type,
      status, approval_required, approval_source, synchronized_at, work_summary
    ) VALUES (
      v_reg_entry_id, p_idempotency_key || '_norate', v_submission_id, v_auth_user_id, v_assignment.supplier_id,
      v_assignment.plant_id, v_assignment.project_id, v_assignment.id,
      p_work_date, p_hours, p_hours, 0.00, p_hours, 'regular',
      'needs_rate_configuration', false, 'authorized_assignment', NOW(), p_work_summary
    );

    RETURN jsonb_build_object(
      'status', 'needs_rate_configuration',
      'message', 'Hours saved. Rate card rates and currencies must be explicitly configured before financial processing.',
      'time_entry_id', v_reg_entry_id
    );
  END IF;

  -- Regular Portion Insertion & Snapshot
  IF v_reg_portion > 0 THEN
    v_reg_entry_id := 'te_reg_' || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO public.time_entries (
      id, idempotency_key, linked_submission_id, rep_id, supplier_id, plant_id, project_id, assignment_id,
      work_date, reported_hours, regular_hours, overtime_hours, hours, hour_type,
      status, approval_required, approval_source, synchronized_at, work_summary
    ) VALUES (
      v_reg_entry_id, p_idempotency_key || '_reg', v_submission_id, v_auth_user_id, v_assignment.supplier_id,
      v_assignment.plant_id, v_assignment.project_id, v_assignment.id,
      p_work_date, p_hours, v_reg_portion, 0.00, v_reg_portion, 'regular',
      'recorded', false, 'authorized_assignment', NOW(), p_work_summary
    );

    INSERT INTO public.time_entry_financials (
      time_entry_id, billable_hours, payable_hours,
      billing_rate_snapshot, billing_currency_snapshot,
      pay_rate_snapshot, pay_currency_snapshot,
      rate_card_id, rate_effective_date
    ) VALUES (
      v_reg_entry_id, v_reg_portion, v_reg_portion,
      v_effective_billing_rate, v_effective_billing_curr,
      v_effective_pay_rate, v_effective_pay_curr,
      v_rate_card.id, NOW()
    );
  END IF;

  -- Overtime Portion Insertion & Snapshot
  IF v_ot_portion > 0 THEN
    v_ot_entry_id := 'te_ot_' || replace(gen_random_uuid()::text, '-', '');

    INSERT INTO public.time_entries (
      id, idempotency_key, linked_submission_id, rep_id, supplier_id, plant_id, project_id, assignment_id,
      work_date, reported_hours, regular_hours, overtime_hours, hours, hour_type,
      status, approval_required, approval_source, client_review_status, synchronized_at, work_summary
    ) VALUES (
      v_ot_entry_id, p_idempotency_key || '_ot', v_submission_id, v_auth_user_id, v_assignment.supplier_id,
      v_assignment.plant_id, v_assignment.project_id, v_assignment.id,
      p_work_date, p_hours, 0.00, v_ot_portion, v_ot_portion, 'overtime',
      'client_pending', true, 'client_approval', 'pending', NOW(), p_work_summary
    );

    INSERT INTO public.time_entry_financials (
      time_entry_id, billable_hours, payable_hours,
      billing_rate_snapshot, billing_currency_snapshot,
      pay_rate_snapshot, pay_currency_snapshot,
      overtime_billing_rate_snapshot, overtime_pay_rate_snapshot,
      rate_card_id, rate_effective_date
    ) VALUES (
      v_ot_entry_id, v_ot_portion, v_ot_portion,
      v_effective_billing_rate, v_effective_billing_curr,
      v_effective_pay_rate, v_effective_pay_curr,
      v_effective_ot_billing, v_effective_ot_pay,
      v_rate_card.id, NOW()
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'success',
    'submission_id', v_submission_id,
    'regular_hours', v_reg_portion,
    'overtime_hours', v_ot_portion
  );
END;
$$;

-- 9. Canonical Security Definer RPC: review_client_overtime_atomic (P0.4 & P0.5: Strict billing_customer_id Authorization)
CREATE OR REPLACE FUNCTION public.review_client_overtime_atomic(
  p_time_entry_id TEXT,
  p_action TEXT,
  p_comment TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_uid UUID;
  v_auth_user_id TEXT;
  v_user_role TEXT;
  v_user_customer_id TEXT;
  v_entry RECORD;
  v_assignment RECORD;
  v_norm_action TEXT;
  v_new_status TEXT;
  v_prev_status TEXT;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to review overtime';
  END IF;

  SELECT id, role, customer_id INTO v_auth_user_id, v_user_role, v_user_customer_id
  FROM public.users 
  WHERE auth_id = v_auth_uid::text OR id = v_auth_uid::text
  LIMIT 1;

  IF v_user_role NOT IN ('client', 'customer') THEN
    RAISE EXCEPTION 'Unauthorized: User role % cannot review client overtime', v_user_role;
  END IF;

  SELECT * INTO v_entry FROM public.time_entries WHERE id = p_time_entry_id FOR UPDATE;
  IF v_entry.id IS NULL THEN
    RAISE EXCEPTION 'Time entry % not found', p_time_entry_id;
  END IF;

  SELECT * INTO v_assignment FROM public.assignments WHERE id = v_entry.assignment_id;

  -- P0.4 & P0.5: Strict billing_customer_id authorization (NO supplier_id fallback)
  IF v_assignment.billing_customer_id <> v_user_customer_id THEN
    RAISE EXCEPTION 'Unauthorized: Access denied for customer % on time entry billing customer %', v_user_customer_id, v_assignment.billing_customer_id;
  END IF;

  v_norm_action := CASE 
    WHEN p_action IN ('approve', 'approved') THEN 'approved'
    WHEN p_action IN ('return', 'returned') THEN 'returned'
    WHEN p_action IN ('reject', 'rejected') THEN 'rejected'
    ELSE NULL
  END;

  IF v_norm_action IS NULL THEN
    RAISE EXCEPTION 'Invalid review action: %', p_action;
  END IF;

  IF v_norm_action IN ('returned', 'rejected') AND (p_comment IS NULL OR TRIM(p_comment) = '') THEN
    RAISE EXCEPTION 'A mandatory comment is required for return or rejection';
  END IF;

  v_prev_status := v_entry.status;
  v_new_status := CASE 
    WHEN v_norm_action = 'approved' THEN 'client_approved'
    WHEN v_norm_action = 'returned' THEN 'client_returned'
    WHEN v_norm_action = 'rejected' THEN 'client_rejected'
  END;

  UPDATE public.time_entries
  SET status = v_new_status,
      client_review_status = v_norm_action,
      client_reviewed_by = v_auth_user_id,
      client_reviewed_at = NOW(),
      client_review_comment = TRIM(p_comment)
  WHERE id = p_time_entry_id;

  INSERT INTO public.overtime_audit_events (
    time_entry_id, billing_customer_id, actor_id, actor_role, action, previous_status, new_status, comment
  ) VALUES (
    p_time_entry_id, v_assignment.billing_customer_id, v_auth_user_id, v_user_role, v_norm_action, v_prev_status, v_new_status, TRIM(p_comment)
  );

  RETURN jsonb_build_object('status', 'success', 'entry_id', p_time_entry_id, 'new_status', v_new_status);
END;
$$;

-- 10. Canonical Security Definer RPC: resubmit_returned_overtime_atomic
CREATE OR REPLACE FUNCTION public.resubmit_returned_overtime_atomic(
  p_time_entry_id TEXT,
  p_work_summary TEXT DEFAULT '',
  p_comment TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_auth_uid UUID;
  v_auth_user_id TEXT;
  v_user_role TEXT;
  v_entry RECORD;
  v_assignment RECORD;
  v_prev_status TEXT;
BEGIN
  v_auth_uid := auth.uid();
  IF v_auth_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;

  SELECT id, role INTO v_auth_user_id, v_user_role 
  FROM public.users 
  WHERE auth_id = v_auth_uid::text OR id = v_auth_uid::text
  LIMIT 1;

  SELECT * INTO v_entry FROM public.time_entries WHERE id = p_time_entry_id FOR UPDATE;
  IF v_entry.id IS NULL THEN
    RAISE EXCEPTION 'Time entry % not found', p_time_entry_id;
  END IF;

  IF v_entry.rep_id <> v_auth_user_id AND v_entry.rep_id <> v_auth_uid::text THEN
    RAISE EXCEPTION 'Unauthorized: Only original rep % can resubmit returned overtime', v_entry.rep_id;
  END IF;

  IF v_entry.status <> 'client_returned' THEN
    RAISE EXCEPTION 'Invalid state: Only returned overtime can be resubmitted';
  END IF;

  SELECT * INTO v_assignment FROM public.assignments WHERE id = v_entry.assignment_id;

  v_prev_status := v_entry.status;

  UPDATE public.time_entries
  SET status = 'client_pending',
      client_review_status = 'pending',
      work_summary = CASE WHEN TRIM(p_work_summary) <> '' THEN TRIM(p_work_summary) ELSE work_summary END
  WHERE id = p_time_entry_id;

  INSERT INTO public.overtime_audit_events (
    time_entry_id, billing_customer_id, actor_id, actor_role, action, previous_status, new_status, comment
  ) VALUES (
    p_time_entry_id, COALESCE(v_assignment.billing_customer_id, v_entry.supplier_id), v_auth_user_id, 'rep', 'resubmitted', v_prev_status, 'client_pending', TRIM(p_comment)
  );

  RETURN jsonb_build_object('status', 'success', 'entry_id', p_time_entry_id, 'new_status', 'client_pending');
END;
$$;

-- 11. Row Level Security & Access Control Policies (P0.1, P0.2, P0.3, Phase 5)
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entry_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Phase 5: Explicitly drop every obsolete INSERT/UPDATE/ALL policy on time_entries by exact policy name
DROP POLICY IF EXISTS time_entries_rep_insert ON public.time_entries;
DROP POLICY IF EXISTS time_entries_client_update ON public.time_entries;
DROP POLICY IF EXISTS time_entries_insert_policy ON public.time_entries;
DROP POLICY IF EXISTS time_entries_update_policy ON public.time_entries;
DROP POLICY IF EXISTS time_entries_all_policy ON public.time_entries;
DROP POLICY IF EXISTS deny_direct_rep_insert ON public.time_entries;
DROP POLICY IF EXISTS deny_direct_client_update ON public.time_entries;

CREATE POLICY deny_direct_rep_insert ON public.time_entries
FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY deny_direct_client_update ON public.time_entries
FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS assignments_rep_read ON public.assignments;
CREATE POLICY assignments_rep_read ON public.assignments
FOR SELECT TO authenticated USING (
  rep_id = auth.uid()::text OR 
  EXISTS (SELECT 1 FROM public.users u WHERE (u.auth_id = auth.uid()::text OR u.id = auth.uid()::text) AND u.id = rep_id) OR
  EXISTS (SELECT 1 FROM public.users u WHERE (u.auth_id = auth.uid()::text OR u.id = auth.uid()::text) AND u.role IN ('admin', 'owner', 'superadmin', 'accountant'))
);

-- P0.1: Strictly restrict financial snapshots to Accountant, Owner, and Super Admin ONLY
DROP POLICY IF EXISTS financials_read ON public.time_entry_financials;
CREATE POLICY financials_read ON public.time_entry_financials
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE (u.auth_id = auth.uid()::text OR u.id = auth.uid()::text) 
      AND u.role IN ('accountant', 'owner', 'superadmin')
  )
);

DROP POLICY IF EXISTS audit_events_read ON public.overtime_audit_events;
CREATE POLICY audit_events_read ON public.overtime_audit_events
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.users u WHERE (u.auth_id = auth.uid()::text OR u.id = auth.uid()::text) AND u.role IN ('admin', 'owner', 'superadmin', 'accountant')) OR
  EXISTS (SELECT 1 FROM public.users u WHERE (u.auth_id = auth.uid()::text OR u.id = auth.uid()::text) AND u.role IN ('client', 'customer') AND u.customer_id = billing_customer_id)
);

-- Phase 5: RLS policies for incident_revisions and notifications
DROP POLICY IF EXISTS incident_revisions_select ON public.incident_revisions;
CREATE POLICY incident_revisions_select ON public.incident_revisions
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.incidents i
    JOIN public.users u ON (u.auth_id = auth.uid()::text OR u.id = auth.uid()::text)
    WHERE i.id = incident_id AND (
      u.role IN ('admin', 'owner', 'superadmin', 'lead', 'accountant') OR
      (u.role IN ('client', 'customer') AND (i.client_id = u.customer_id OR i.billing_customer_id = u.customer_id)) OR
      (u.role = 'supplier' AND i.supplier_id = u.supplier_id) OR
      i.rep_id = u.id
    )
  )
);

DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
FOR SELECT TO authenticated USING (
  recipient_user_id = auth.uid()::text OR
  EXISTS (SELECT 1 FROM public.users u WHERE (u.auth_id = auth.uid()::text OR u.id = auth.uid()::text) AND u.id = recipient_user_id)
);

-- P0.3: Explicit Table Grants & Function Revokes
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.submit_rep_hours_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_client_overtime_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.resubmit_returned_overtime_atomic TO authenticated;

GRANT SELECT ON public.assignments TO authenticated;
GRANT SELECT ON public.assignment_rate_cards TO authenticated;
GRANT SELECT ON public.time_entries TO authenticated;
GRANT SELECT ON public.time_entry_financials TO authenticated;
GRANT SELECT ON public.overtime_audit_events TO authenticated;
GRANT SELECT ON public.incidents TO authenticated;
GRANT SELECT ON public.incident_revisions TO authenticated;
GRANT SELECT ON public.notifications TO authenticated;

COMMIT;
