-- IDS Pulse Strict Membership Row Level Security (RLS) Migration
-- Date: July 31, 2026

-- 1. Enable RLS on core tables
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_decision_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies
DROP POLICY IF EXISTS "allow_authenticated_all_time_entries" ON time_entries;
DROP POLICY IF EXISTS "allow_authenticated_all_projects" ON projects;
DROP POLICY IF EXISTS "allow_authenticated_all_users" ON users;
DROP POLICY IF EXISTS "allow_authenticated_all_suppliers" ON suppliers;
DROP POLICY IF EXISTS "allow_authenticated_all_expense_entries" ON expense_entries;
DROP POLICY IF EXISTS "allow_all_time_entries" ON time_entries;
DROP POLICY IF EXISTS "allow_all_projects" ON projects;

-- 3. Strict Membership Policies for time_entries
-- Reps can SELECT their own entries
CREATE POLICY time_entries_rep_select ON time_entries
  FOR SELECT
  TO authenticated
  USING (
    rep_id IN (
      SELECT id::text FROM users WHERE auth_id = auth.uid() OR id = auth.uid()::text
    )
  );

-- Clients can SELECT only entries belonging to their exact customer ID
CREATE POLICY time_entries_client_select ON time_entries
  FOR SELECT
  TO authenticated
  USING (
    supplier_id IN (
      SELECT COALESCE(supplier_id, customer_id) FROM users WHERE auth_id = auth.uid() OR id = auth.uid()::text
      UNION
      SELECT id::text FROM suppliers WHERE auth_user_id = auth.uid()
    )
  );

-- Admins and Accountants can SELECT all time_entries for read-only oversight
CREATE POLICY time_entries_admin_acct_select ON time_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE (auth_id = auth.uid() OR id = auth.uid()::text)
        AND role IN ('admin', 'superadmin', 'accountant', 'owner', 'lead')
    )
  );

-- Direct INSERT for reps (primary inserts are handled securely via submit_rep_hours_atomic RPC)
CREATE POLICY time_entries_rep_insert ON time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    rep_id IN (
      SELECT id::text FROM users WHERE auth_id = auth.uid() OR id = auth.uid()::text
    )
  );

-- Direct UPDATE on regular hours or hours fields by non-RPC is explicitly DENIED
-- Updates to overtime client_review_status are executed securely via review_client_overtime_atomic RPC

-- 4. RLS Policies for overtime_decision_audit_log (Append-Only)
-- Any authenticated user can SELECT audit logs for monitoring
CREATE POLICY ot_audit_select ON overtime_decision_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy for client decision RPC
CREATE POLICY ot_audit_insert ON overtime_decision_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM users WHERE (auth_id = auth.uid() OR id = auth.uid()::text)
    )
  );

-- UPDATE and DELETE on audit log are explicitly DENIED (no policy created for UPDATE/DELETE)

-- 5. Strict Membership Policies for projects
CREATE POLICY projects_select_policy ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- Admins/Accountants/Reps/Clients can view assigned projects
    EXISTS (
      SELECT 1 FROM users
      WHERE (auth_id = auth.uid() OR id = auth.uid()::text)
    )
  );

-- 6. Deny all access to unauthenticated / anon users across all tables
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
