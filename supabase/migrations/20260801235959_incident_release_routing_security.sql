-- IDS Pulse Authoritative Incident Release, Routing & RLS Migration
-- Target: Real repository schema alignment, exact JSONB membership, canonical client_id, strict RLS isolation
-- Schema: public.users (client_id), public.projects (client_id, supplier_id, plant_id, rep_id, rep_ids), public.incidents, public.system_logs

-- 1. Add missing schema columns (Additive schema update)
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS client_id TEXT;

ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS assignment_id TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS customer_id TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS plant_id TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS rep_id TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS rep_name TEXT;

ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS media_evidence_status TEXT DEFAULT 'not_provided';
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS media_unavailable_reason TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS media_unavailable_note TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS traceability_status TEXT DEFAULT 'not_provided';
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS traceability_unavailable_reason TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS traceability_unavailable_note TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS parts_list JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS tote_bin_labels JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS defect_type TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS action_taken TEXT;

ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS supplier_contact_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS supplier_contacts_snapshot JSONB DEFAULT '[]'::jsonb;

ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS returned_to_supplier BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS sort_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS rma_required BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS rma_number TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS concern_classification TEXT;

ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS release_status TEXT DEFAULT 'draft';
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS released_to_client BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS released_by TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS release_requested_by TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
ALTER TABLE IF EXISTS public.incidents ADD COLUMN IF NOT EXISTS local_tracking_ref TEXT;

-- 2. Unique Constraint & Indexes for Idempotency and RLS Predicates (Section 4 - Visible Constraint Error)
ALTER TABLE IF EXISTS public.incidents DROP CONSTRAINT IF EXISTS incidents_idempotency_key_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'incidents_scoped_idempotency_key'
    ) THEN
        ALTER TABLE public.incidents ADD CONSTRAINT incidents_scoped_idempotency_key UNIQUE (rep_id, project_id, idempotency_key);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_incidents_client_released ON public.incidents(client_id, released_to_client, status);
CREATE INDEX IF NOT EXISTS idx_incidents_rep_id ON public.incidents(rep_id);
CREATE INDEX IF NOT EXISTS idx_incidents_project_id ON public.incidents(project_id);

-- 3. Explicitly Purge Permissive RLS Policies on Incidents
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_authenticated_all_incidents" ON public.incidents;
DROP POLICY IF EXISTS "allow_all_incidents" ON public.incidents;
DROP POLICY IF EXISTS "Incidents insert/update" ON public.incidents;
DROP POLICY IF EXISTS "Incidents authenticated select" ON public.incidents;
DROP POLICY IF EXISTS "Pol_Sel_incidents" ON public.incidents;
DROP POLICY IF EXISTS "Strict_Tenant_Incidents_Select" ON public.incidents;
DROP POLICY IF EXISTS "incidents_rep_select_policy" ON public.incidents;
DROP POLICY IF EXISTS "incidents_rep_insert_policy" ON public.incidents;
DROP POLICY IF EXISTS "incidents_admin_lead_policy" ON public.incidents;
DROP POLICY IF EXISTS "incidents_superadmin_policy" ON public.incidents;
DROP POLICY IF EXISTS "incidents_customer_select_policy" ON public.incidents;
DROP POLICY IF EXISTS "incidents_admin_policy" ON public.incidents;
DROP POLICY IF EXISTS "incidents_lead_select_policy" ON public.incidents;

-- 4. Create Strict Tenant Row-Level Security Policies (Section 3)

-- Reps: Read own incidents
CREATE POLICY "incidents_rep_select_policy" ON public.incidents
    FOR SELECT TO authenticated
    USING (
        rep_id = (SELECT id::text FROM public.users WHERE (auth_id = auth.uid() OR id = auth.uid()::text) AND COALESCE(is_deactivated, FALSE) IS NOT TRUE)
    );

-- Reps: Direct draft insert policy with strict project membership and field validation
CREATE POLICY "incidents_rep_insert_policy" ON public.incidents
    FOR INSERT TO authenticated
    WITH CHECK (
        rep_id = (SELECT id::text FROM public.users WHERE (auth_id = auth.uid() OR id = auth.uid()::text) AND COALESCE(is_deactivated, FALSE) IS NOT TRUE)
        AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = incidents.project_id
            AND (
                p.rep_id = (SELECT id::text FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid()::text)
                OR (p.rep_ids IS NOT NULL AND jsonb_typeof(p.rep_ids) = 'array' AND p.rep_ids @> jsonb_build_array((SELECT id::text FROM public.users WHERE auth_id = auth.uid() OR id = auth.uid()::text)))
            )
            AND p.client_id = incidents.client_id
            AND p.supplier_id = incidents.supplier_id
            AND p.plant_id = incidents.plant_id
            AND (p.status IS NULL OR p.status = 'active')
        )
    );

-- Customer Users: ONLY incidents where incidents.client_id matches authenticated users.client_id AND released_to_client = TRUE AND status = 'Released'
-- Zero supplier_id, company_affiliation, or name matching!
CREATE POLICY "incidents_customer_select_policy" ON public.incidents
    FOR SELECT TO authenticated
    USING (
        client_id = (
            SELECT u.client_id FROM public.users u
            WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()::text)
            AND u.role = 'customer'
            AND u.client_id IS NOT NULL
            AND COALESCE(u.is_deactivated, FALSE) IS NOT TRUE
        )
        AND released_to_client = TRUE
        AND status = 'Released'
    );

-- Owners / Admins: IDS-wide operational oversight with BOTH USING and WITH CHECK
CREATE POLICY "incidents_admin_policy" ON public.incidents
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()::text)
            AND u.role IN ('admin', 'owner')
            AND COALESCE(u.is_deactivated, FALSE) IS NOT TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()::text)
            AND u.role IN ('admin', 'owner')
            AND COALESCE(u.is_deactivated, FALSE) IS NOT TRUE
        )
    );

-- Quality Leads: Only assigned Customer/project incidents
CREATE POLICY "incidents_lead_select_policy" ON public.incidents
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.projects p ON p.client_id = u.client_id
            WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()::text)
            AND u.role = 'lead'
            AND p.id = incidents.project_id
            AND COALESCE(u.is_deactivated, FALSE) IS NOT TRUE
        )
    );

-- Super Admin: Global audited access with BOTH USING and WITH CHECK
CREATE POLICY "incidents_superadmin_policy" ON public.incidents
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()::text)
            AND u.role IN ('shahroz', 'superadmin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE (u.auth_id = auth.uid() OR u.id = auth.uid()::text)
            AND u.role IN ('shahroz', 'superadmin', 'super_admin')
        )
    );

-- 5. Create Secure Server-Side Release Operation RPC (Fully Schema-Qualified)
CREATE OR REPLACE FUNCTION public.release_incident_to_client(
    p_payload JSONB,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id TEXT;
    v_user_name TEXT;
    v_user_role TEXT;
    v_is_deactivated BOOLEAN;
    v_selected_project_id TEXT;
    v_client_id TEXT;
    v_supplier_id TEXT;
    v_plant_id TEXT;
    v_project_id TEXT;
    v_inc_id TEXT;
    v_server_now TIMESTAMPTZ := NOW();
    v_existing_inc RECORD;
    v_local_ref TEXT;
BEGIN
    -- 1. Require auth.uid() & resolve application user from public.users
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required to release incident reports.';
    END IF;

    SELECT id::text, name, role, COALESCE(is_deactivated, FALSE)
    INTO v_user_id, v_user_name, v_user_role, v_is_deactivated
    FROM public.users
    WHERE auth_id = auth.uid() OR id = auth.uid()::text
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication error: Application user record not found.';
    END IF;

    IF v_is_deactivated IS TRUE THEN
        RAISE EXCEPTION 'Account is deactivated. Cannot perform release operation.';
    END IF;

    IF v_user_role NOT IN ('rep', 'qre', 'quality_rep') THEN
        RAISE EXCEPTION 'Unauthorized: Only Quality Liaison Representatives can execute incident release.';
    END IF;

    -- 2. Validate selected project/assignment ID
    v_selected_project_id := COALESCE(p_payload->>'assignment_id', p_payload->>'project_id');
    IF v_selected_project_id IS NULL OR TRIM(v_selected_project_id) = '' THEN
        RAISE EXCEPTION 'An authoritative project assignment is required to release an incident report.';
    END IF;

    -- 3. Query real public.projects table to prove Rep ownership and derive routing (Section 1 & 2)
    -- Reads ONLY projects.client_id. Exact JSONB array membership check for rep_ids.
    SELECT id, client_id, supplier_id, plant_id
    INTO v_project_id, v_client_id, v_supplier_id, v_plant_id
    FROM public.projects
    WHERE id = v_selected_project_id
    AND (
        rep_id = v_user_id
        OR (rep_ids IS NOT NULL AND jsonb_typeof(rep_ids) = 'array' AND rep_ids @> jsonb_build_array(v_user_id))
    )
    AND (status IS NULL OR status = 'active')
    LIMIT 1;

    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Selected project assignment is invalid or does not belong to the authenticated user.';
    END IF;

    IF v_client_id IS NULL OR TRIM(v_client_id) = '' THEN
        RAISE EXCEPTION 'Configuration Error: Selected project has no valid client configuration.';
    END IF;

    IF v_supplier_id IS NULL OR TRIM(v_supplier_id) = '' THEN
        RAISE EXCEPTION 'Configuration Error: Selected project has no valid supplier configuration.';
    END IF;

    -- 4. Require non-empty idempotency key & check scoped idempotency (Section 4)
    IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'Validation Error: A unique idempotency key is required.';
    END IF;

    SELECT id, status, released_at INTO v_existing_inc
    FROM public.incidents
    WHERE rep_id = v_user_id
    AND project_id = v_project_id
    AND idempotency_key = p_idempotency_key
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'already_released', true,
            'incident', jsonb_build_object(
                'id', v_existing_inc.id,
                'status', v_existing_inc.status,
                'released_to_client', true,
                'released_at', v_existing_inc.released_at,
                'released_by', v_user_id,
                'client_id', v_client_id,
                'project_id', v_project_id,
                'assignment_id', v_project_id,
                'supplier_id', v_supplier_id,
                'plant_id', v_plant_id
            )
        );
    END IF;

    -- 5. Generate server-side authoritative incident ID
    v_inc_id := 'INC-' || TO_CHAR(v_server_now, 'YYYYMMDD-HH24MISS') || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4);
    v_local_ref := COALESCE(p_payload->>'tracking_ref', p_payload->>'id', v_inc_id);

    -- 6. Insert Incident Record (Server-derived routing fields ONLY)
    INSERT INTO public.incidents (
        id,
        assignment_id,
        project_id,
        client_id,
        customer_id,
        supplier_id,
        plant_id,
        rep_id,
        rep_name,
        media_evidence_status,
        media_unavailable_reason,
        media_unavailable_note,
        photos,
        videos,
        traceability_status,
        traceability_unavailable_reason,
        traceability_unavailable_note,
        parts_list,
        tote_bin_labels,
        defect_type,
        area,
        description,
        action_taken,
        supplier_contact_ids,
        supplier_contacts_snapshot,
        returned_to_supplier,
        sort_requested,
        rma_required,
        rma_number,
        concern_classification,
        release_status,
        released_to_client,
        released_at,
        released_by,
        idempotency_key,
        local_tracking_ref,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_inc_id,
        v_project_id,
        v_project_id,
        v_client_id,
        v_client_id,
        v_supplier_id,
        v_plant_id,
        v_user_id,
        v_user_name,
        COALESCE(p_payload->>'media_evidence_status', 'not_provided'),
        p_payload->>'media_unavailable_reason',
        p_payload->>'media_unavailable_note',
        COALESCE(p_payload->'photos', '[]'::jsonb),
        COALESCE(p_payload->'videos', '[]'::jsonb),
        COALESCE(p_payload->>'traceability_status', 'not_provided'),
        p_payload->>'traceability_unavailable_reason',
        p_payload->>'traceability_unavailable_note',
        COALESCE(p_payload->'parts_list', '[]'::jsonb),
        COALESCE(p_payload->'tote_bin_labels', '[]'::jsonb),
        p_payload->>'defect_type',
        p_payload->>'area',
        p_payload->>'description',
        p_payload->>'action_taken',
        COALESCE(p_payload->'supplier_contact_ids', '[]'::jsonb),
        COALESCE(p_payload->'supplier_contacts_snapshot', '[]'::jsonb),
        COALESCE((p_payload->>'returned_to_supplier')::boolean, false),
        COALESCE((p_payload->>'sort_requested')::boolean, false),
        COALESCE((p_payload->>'rma_required')::boolean, false),
        p_payload->>'rma_number',
        p_payload->>'concern_classification',
        'released',
        TRUE,
        v_server_now,
        v_user_id,
        p_idempotency_key,
        v_local_ref,
        'Released',
        v_server_now,
        v_server_now
    );

    -- 7. Insert Authoritative System Log in public.system_logs
    INSERT INTO public.system_logs (
        id,
        event_type,
        category,
        message,
        user_id,
        user_name,
        user_role,
        created_at,
        details
    ) VALUES (
        'log_' || FLOOR(EXTRACT(EPOCH FROM v_server_now)) || '_' || FLOOR(RANDOM() * 1000),
        'incident_released',
        'security',
        'Incident ' || v_inc_id || ' authoritatively released to Client Dashboard.',
        v_user_id,
        v_user_name,
        v_user_role,
        v_server_now,
        jsonb_build_object(
            'incident_id', v_inc_id,
            'client_id', v_client_id,
            'project_id', v_project_id,
            'idempotency_key', p_idempotency_key
        )
    );

    -- 8. Return Authoritative Release Confirmation Object (Section 5)
    RETURN jsonb_build_object(
        'success', true,
        'release_status', 'released',
        'status', 'Released',
        'incident', jsonb_build_object(
            'id', v_inc_id,
            'status', 'Released',
            'released_to_client', true,
            'released_at', v_server_now,
            'released_by', v_user_id,
            'client_id', v_client_id,
            'project_id', v_project_id,
            'assignment_id', v_project_id,
            'supplier_id', v_supplier_id,
            'plant_id', v_plant_id
        )
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_incident_to_client(JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.release_incident_to_client(JSONB, TEXT) TO authenticated;
