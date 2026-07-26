-- Migration: 20260726_atomic_client_onboarding.sql
-- Description: Atomic server-side RPC function for onboarding client + contact + plant + project + rep assignment + rates + system audit log in a single transactional unit.

CREATE OR REPLACE FUNCTION public.onboard_client_project(
  p_supplier_id text DEFAULT NULL,
  p_supplier_name text DEFAULT NULL,
  p_contact_name text DEFAULT NULL,
  p_contact_email text DEFAULT NULL,
  p_contact_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_allotted_hours numeric DEFAULT 40,
  p_plant_id text DEFAULT NULL,
  p_plant_name text DEFAULT NULL,
  p_plant_city text DEFAULT NULL,
  p_plant_address text DEFAULT NULL,
  p_project_name text DEFAULT NULL,
  p_part_number text DEFAULT NULL,
  p_po_number text DEFAULT NULL,
  p_rep_id text DEFAULT NULL,
  p_billing_rate numeric DEFAULT NULL,
  p_pay_rate numeric DEFAULT NULL,
  p_currency text DEFAULT 'USD',
  p_start_date text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role text;
  v_project_id text;
  v_rate_id text;
  v_contact_user_id text;
  v_plants_array jsonb;
  v_actor text;
BEGIN
  -- 1. Verify Authorization from auth.jwt()
  v_user_role := COALESCE((auth.jwt() -> 'app_metadata' ->> 'role'), '');
  IF v_user_role NOT IN ('admin', 'shahroz', 'owner', 'accountant', 'lead', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized: Only Super Admin and authorized Staff roles can execute onboarding.';
  END IF;

  v_actor := COALESCE((auth.jwt() -> 'app_metadata' ->> 'username'), 'Super Admin');

  -- 2. Validate mandatory parameters
  IF p_supplier_name IS NULL OR TRIM(p_supplier_name) = '' THEN
    RAISE EXCEPTION 'Validation Error: Supplier name is required.';
  END IF;
  IF p_project_name IS NULL OR TRIM(p_project_name) = '' THEN
    RAISE EXCEPTION 'Validation Error: Project name is required.';
  END IF;
  IF p_billing_rate IS NULL OR p_billing_rate < 0 OR p_pay_rate IS NULL OR p_pay_rate < 0 THEN
    RAISE EXCEPTION 'Validation Error: Billing rate and Pay rate must be valid non-negative numbers.';
  END IF;

  -- 3. Prepare Canonical Supplier ID & Plant ID
  IF p_supplier_id IS NULL OR TRIM(p_supplier_id) = '' THEN
    p_supplier_id := 'sup_' || LOWER(REGEXP_REPLACE(p_supplier_name, '[^a-zA-Z0-9]', '_', 'g')) || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()));
  END IF;

  IF p_plant_id IS NULL OR TRIM(p_plant_id) = '' THEN
    p_plant_id := 'plt_' || LOWER(REGEXP_REPLACE(COALESCE(p_plant_name, 'plant_1'), '[^a-zA-Z0-9]', '_', 'g')) || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()));
  END IF;

  v_project_id := 'prj_' || LOWER(REGEXP_REPLACE(p_project_name, '[^a-zA-Z0-9]', '_', 'g')) || '_' || FLOOR(EXTRACT(EPOCH FROM NOW()));
  v_rate_id := 'rate_' || FLOOR(EXTRACT(EPOCH FROM NOW())) || '_' || FLOOR(RANDOM() * 1000);

  v_plants_array := jsonb_build_array(COALESCE(p_plant_name, p_plant_id));

  -- 4. Upsert Plant (Canonical Column Schema)
  INSERT INTO public.plants (id, name, city, address, timezone, oem_brand)
  VALUES (
    p_plant_id,
    COALESCE(p_plant_name, 'Windsor Plant 1'),
    COALESCE(p_plant_city, 'Windsor'),
    COALESCE(p_plant_address, p_address, 'Windsor, ON'),
    'EST',
    'Automotive'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    address = EXCLUDED.address;

  -- 5. Upsert Supplier (Canonical Column Schema: plants_served as JSONB array)
  INSERT INTO public.suppliers (
    id, name, contact_name, contact_email, phone, address,
    plants_served, allotted_hours, status, contacts, ot_rules
  )
  VALUES (
    p_supplier_id,
    p_supplier_name,
    p_contact_name,
    p_contact_email,
    p_contact_phone,
    p_address,
    v_plants_array,
    COALESCE(p_allotted_hours, 40),
    'active',
    jsonb_build_array(jsonb_build_object('name', p_contact_name, 'email', p_contact_email, 'phone', p_contact_phone)),
    jsonb_build_object('daily_threshold', 8, 'weekly_threshold', 40)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    contact_name = EXCLUDED.contact_name,
    contact_email = EXCLUDED.contact_email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    plants_served = EXCLUDED.plants_served,
    allotted_hours = EXCLUDED.allotted_hours,
    contacts = EXCLUDED.contacts;

  -- 6. Insert Contact User if contact_email provided
  IF p_contact_email IS NOT NULL AND TRIM(p_contact_email) <> '' THEN
    v_contact_user_id := 'cust_' || LOWER(REGEXP_REPLACE(SPLIT_PART(p_contact_email, '@', 1), '[^a-zA-Z0-9]', '_', 'g'));
    INSERT INTO public.users (
      id, username, passcode, role, name, email, company_affiliation, phone, status
    )
    VALUES (
      v_contact_user_id,
      p_contact_email,
      'auth_managed',
      'customer',
      COALESCE(p_contact_name, 'Customer Contact'),
      p_contact_email,
      p_supplier_id,
      p_contact_phone,
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      company_affiliation = EXCLUDED.company_affiliation;
  END IF;

  -- 7. Insert Project (Canonical Column Schema)
  INSERT INTO public.projects (
    id, name, supplier_id, plant_id, plants_served, currency, status,
    part_number, billing_rate, pay_rate, po_number, rep_id, start_date
  )
  VALUES (
    v_project_id,
    p_project_name,
    p_supplier_id,
    p_plant_id,
    v_plants_array,
    COALESCE(p_currency, 'USD'),
    'active',
    COALESCE(p_part_number, 'AT-4472'),
    p_billing_rate,
    p_pay_rate,
    COALESCE(p_po_number, 'PO-2026-ATLAS'),
    p_rep_id,
    COALESCE(p_start_date, TO_CHAR(NOW(), 'YYYY-MM-DD'))
  );

  -- 8. Insert Rates Entry (Canonical Rate Record)
  INSERT INTO public.rates (
    id, rep_id, supplier_id, plant_id, project_id, billing_rate, pay_rate
  )
  VALUES (
    v_rate_id,
    p_rep_id,
    p_supplier_id,
    p_plant_id,
    v_project_id,
    p_billing_rate,
    p_pay_rate
  );

  -- 9. Record System Audit Log Entry
  INSERT INTO public.system_logs (
    id, timestamp, category, action, details, user_id
  )
  VALUES (
    'log_' || FLOOR(EXTRACT(EPOCH FROM NOW())) || '_' || FLOOR(RANDOM() * 1000),
    NOW(),
    'onboarding',
    'atomic_client_project_onboarding',
    v_actor || ' onboarded client ' || p_supplier_name || ' with project ' || p_project_name || ' (Rep: ' || COALESCE(p_rep_id, 'Unassigned') || ', Billing: $' || p_billing_rate || '/hr, Pay: $' || p_pay_rate || '/hr).',
    v_actor
  );

  -- 10. Return complete JSON of created entities
  RETURN jsonb_build_object(
    'success', true,
    'supplier_id', p_supplier_id,
    'plant_id', p_plant_id,
    'project_id', v_project_id,
    'rate_id', v_rate_id,
    'supplier_name', p_supplier_name,
    'project_name', p_project_name,
    'rep_id', p_rep_id,
    'billing_rate', p_billing_rate,
    'pay_rate', p_pay_rate,
    'currency', COALESCE(p_currency, 'USD')
  );
END;
$$;
