-- Migration: 20260726_strict_tenant_rls_isolation.sql
-- Description: Enforces 100% strict server-side RLS tenant isolation across all core tables.
-- Drops all legacy permissive USING(true) policies and locks SELECT, INSERT, UPDATE, DELETE to auth.jwt() claims.

-- 1. Ensure helper function for admin roles
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'shahroz', 'owner', 'accountant', 'lead', 'superadmin'),
    false
  );
$$;

-- 2. Drop all legacy permissive USING(true) policies across target tables
DROP POLICY IF EXISTS "Incidents insert/update" ON public.incidents;
DROP POLICY IF EXISTS "Incidents authenticated select" ON public.incidents;
DROP POLICY IF EXISTS "Pol_Sel_incidents" ON public.incidents;
DROP POLICY IF EXISTS "Pol_Sel_suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Time entries select policy" ON public.time_entries;
DROP POLICY IF EXISTS "Time entries modify policy" ON public.time_entries;
DROP POLICY IF EXISTS "Pol_Sel_time_entries" ON public.time_entries;
DROP POLICY IF EXISTS "Pol_Sel_shift_reports" ON public.shift_reports;
DROP POLICY IF EXISTS "Pol_Sel_extra_hours_requests" ON public.extra_hours_requests;
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
DROP POLICY IF EXISTS "Pol_Sel_projects" ON public.projects;
DROP POLICY IF EXISTS "Pol_Sel_expense_entries" ON public.expense_entries;

-- 3. Enable RLS on all public tables
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_hours_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;

-- 4. Re-create Strict Tenant-Isolated SELECT Policies

-- Incidents
DROP POLICY IF EXISTS "Strict_Tenant_Incidents_Select" ON public.incidents;
CREATE POLICY "Strict_Tenant_Incidents_Select" ON public.incidents
FOR SELECT TO authenticated
USING (
  public.is_admin_user() OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'customer' AND (
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) OR
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR
      LOWER(supplier_id) LIKE '%' || LOWER((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) || '%'
    )
  ) OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'rep' AND (
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'rep_id')::text)
    )
  )
);

-- Time Entries
DROP POLICY IF EXISTS "Strict_Tenant_TimeEntries_Select" ON public.time_entries;
CREATE POLICY "Strict_Tenant_TimeEntries_Select" ON public.time_entries
FOR SELECT TO authenticated
USING (
  public.is_admin_user() OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'customer' AND (
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) OR
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text)
    )
  ) OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'rep' AND (
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'rep_id')::text)
    )
  )
);

-- Shift Reports
DROP POLICY IF EXISTS "Strict_Tenant_ShiftReports_Select" ON public.shift_reports;
CREATE POLICY "Strict_Tenant_ShiftReports_Select" ON public.shift_reports
FOR SELECT TO authenticated
USING (
  public.is_admin_user() OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'rep' AND (
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'rep_id')::text)
    )
  ) OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'customer' AND EXISTS (
      SELECT 1 FROM public.suppliers s
      WHERE (s.id = ((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) OR s.id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text))
      AND ((s.plants_served::text) LIKE '%' || shift_reports.plant_id || '%' OR shift_reports.plant_id = s.id)
    )
  )
);

-- Extra Hours Requests
DROP POLICY IF EXISTS "Strict_Tenant_ExtraHours_Select" ON public.extra_hours_requests;
CREATE POLICY "Strict_Tenant_ExtraHours_Select" ON public.extra_hours_requests
FOR SELECT TO authenticated
USING (
  public.is_admin_user() OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'customer' AND (
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) OR
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text)
    )
  ) OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'rep' AND (
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'rep_id')::text)
    )
  )
);

-- Projects
DROP POLICY IF EXISTS "Strict_Tenant_Projects_Select" ON public.projects;
CREATE POLICY "Strict_Tenant_Projects_Select" ON public.projects
FOR SELECT TO authenticated
USING (
  public.is_admin_user() OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'customer' AND (
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) OR
      supplier_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text)
    )
  ) OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'rep' AND (
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR
      rep_id = ((auth.jwt() -> 'app_metadata' ->> 'rep_id')::text)
    )
  )
);

-- Suppliers
DROP POLICY IF EXISTS "Suppliers select policy" ON public.suppliers;
CREATE POLICY "Suppliers select policy" ON public.suppliers
FOR SELECT TO authenticated
USING (
  public.is_admin_user() OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'rep' AND (
      EXISTS (
        SELECT 1 FROM public.projects pr
        WHERE (pr.rep_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR pr.rep_id = ((auth.jwt() -> 'app_metadata' ->> 'rep_id')::text))
        AND pr.supplier_id = suppliers.id
      ) OR
      EXISTS (
        SELECT 1 FROM public.incidents inc
        WHERE (inc.rep_id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR inc.rep_id = ((auth.jwt() -> 'app_metadata' ->> 'rep_id')::text))
        AND inc.supplier_id = suppliers.id
      )
    )
  ) OR
  (
    ((auth.jwt() -> 'app_metadata' ->> 'role')::text) = 'customer' AND (
      id = ((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) OR
      id = ((auth.jwt() -> 'app_metadata' ->> 'username')::text) OR
      LOWER(id) LIKE '%' || LOWER((auth.jwt() -> 'app_metadata' ->> 'username')::text) || '%' OR
      LOWER((auth.jwt() -> 'app_metadata' ->> 'customer_id')::text) LIKE '%' || LOWER(id) || '%'
    )
  )
);
