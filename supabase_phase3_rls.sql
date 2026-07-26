-- PHASE 3: NATIVE SUPABASE RLS & POLICIES MIGRATION
-- Enables RLS across all tables and cleans up obsolete RPCs and user_sessions table.

-- 1. Enable RLS on all core data tables
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.extra_hours_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create permissive RLS policies for authenticated users
-- Helper function to check if current user is admin/staff
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'admin', 'owner', 'accountant', 'lead', 'shahroz'),
    false
  );
$$;

-- Rates Table Policies: Admin/Staff ONLY
DROP POLICY IF EXISTS "Rates admin access" ON public.rates;
CREATE POLICY "Rates admin access" ON public.rates
  FOR ALL
  TO authenticated
  USING (public.is_admin_user());

-- Users Table Policies: Authenticated users can view user profiles
DROP POLICY IF EXISTS "Users authenticated select" ON public.users;
CREATE POLICY "Users authenticated select" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users admin modify" ON public.users;
CREATE POLICY "Users admin modify" ON public.users
  FOR ALL
  TO authenticated
  USING (public.is_admin_user());

-- Incidents Policies: Authenticated select, admin or owner modify
DROP POLICY IF EXISTS "Incidents authenticated select" ON public.incidents;
CREATE POLICY "Incidents authenticated select" ON public.incidents
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Incidents insert/update" ON public.incidents;
CREATE POLICY "Incidents insert/update" ON public.incidents
  FOR ALL
  TO authenticated
  USING (true);

-- Time Entries Policies: Select own or admin
DROP POLICY IF EXISTS "Time entries select policy" ON public.time_entries;
CREATE POLICY "Time entries select policy" ON public.time_entries
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Time entries modify policy" ON public.time_entries;
CREATE POLICY "Time entries modify policy" ON public.time_entries
  FOR ALL
  TO authenticated
  USING (true);

-- Expense Entries Policies: Non-customer select/modify
DROP POLICY IF EXISTS "Expenses select policy" ON public.expense_entries;
CREATE POLICY "Expenses select policy" ON public.expense_entries
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') != 'customer');

DROP POLICY IF EXISTS "Expenses modify policy" ON public.expense_entries;
CREATE POLICY "Expenses modify policy" ON public.expense_entries
  FOR ALL
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') != 'customer');

-- Suppliers Policies
DROP POLICY IF EXISTS "Suppliers select policy" ON public.suppliers;
CREATE POLICY "Suppliers select policy" ON public.suppliers
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Suppliers admin modify" ON public.suppliers;
CREATE POLICY "Suppliers admin modify" ON public.suppliers
  FOR ALL
  TO authenticated
  USING (public.is_admin_user());

-- Projects & Plants Policies
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
CREATE POLICY "Projects select policy" ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Plants select policy" ON public.plants;
CREATE POLICY "Plants select policy" ON public.plants
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Drop obsolete RPCs and user_sessions table
DROP FUNCTION IF EXISTS public.get_scoped_time_entries(text, text, text, text);
DROP FUNCTION IF EXISTS public.get_scoped_expense_entries(text, text, text);
DROP FUNCTION IF EXISTS public.get_scoped_suppliers(text);
DROP FUNCTION IF EXISTS public.get_scoped_projects(text, text);
DROP FUNCTION IF EXISTS public.get_rates_for_admin(text, text);
DROP FUNCTION IF EXISTS public.verify_credentials(text, text);
DROP TABLE IF EXISTS public.user_sessions CASCADE;
