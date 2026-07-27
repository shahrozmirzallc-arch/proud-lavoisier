-- 20260727_purge_demo_data_rpc.sql
-- Defines purge_demo_data() RPC as a SECURITY DEFINER function to clean all demo/test rows across all tables in Supabase while preserving essential admin user accounts.

CREATE OR REPLACE FUNCTION purge_demo_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all non-essential rows across all operational tables
  DELETE FROM suppliers WHERE id IS NOT NULL;
  DELETE FROM projects WHERE id IS NOT NULL;
  DELETE FROM rates WHERE id IS NOT NULL;
  DELETE FROM plants WHERE id IS NOT NULL;
  DELETE FROM time_entries WHERE id IS NOT NULL;
  DELETE FROM expense_entries WHERE id IS NOT NULL;
  DELETE FROM incidents WHERE id IS NOT NULL;
  DELETE FROM rework_logs WHERE id IS NOT NULL;
  DELETE FROM shift_reports WHERE id IS NOT NULL;
  DELETE FROM extra_hours_requests WHERE id IS NOT NULL;
  DELETE FROM daily_tasks WHERE id IS NOT NULL;
  DELETE FROM email_logs WHERE id IS NOT NULL;
  DELETE FROM system_logs WHERE id IS NOT NULL;
  DELETE FROM rep_activities WHERE id IS NOT NULL;

  -- Delete non-essential users (preserving essential admins)
  DELETE FROM users WHERE id NOT IN ('24', 'owner_1', 'acct_1', 'admin_1', 'lead_diana', 'shahroz', 'admin');

  -- Re-seed essential admin accounts
  INSERT INTO users (id, name, email, username, role, title, pay_currency, avatar)
  VALUES 
    ('24', 'Donna Cabral', 'dcabral@integritydriven.com', 'donna', 'lead', 'Operations Lead Supervisor', 'CAD', 'DC'),
    ('owner_1', 'Greg Phillippe', 'gphillippe@integritydriven.com', 'greg', 'owner', 'Managing Director / Owner', 'CAD', 'GP'),
    ('acct_1', 'Colleen Boyd', 'cboyd@integritydriven.com', 'colleen', 'accountant', 'Financial Accountant / Controller', 'CAD', 'CB'),
    ('admin_1', 'Shahroz Mirza', 'smirza@integritydriven.com', 'shahroz', 'admin', 'System Super Admin', 'CAD', 'SM'),
    ('lead_diana', 'Diana Operations Lead', 'diana@goto-ids.com', 'diana', 'lead', 'Operations Lead Supervisor', 'CAD', 'DL')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    title = EXCLUDED.title,
    pay_currency = EXCLUDED.pay_currency,
    avatar = EXCLUDED.avatar;

  RETURN json_build_object('status', 'success', 'message', 'All non-essential rows purged from Supabase successfully.');
END;
$$;

-- Grant execution to anon, authenticated, and service_role
GRANT EXECUTE ON FUNCTION purge_demo_data() TO anon, authenticated, service_role;
