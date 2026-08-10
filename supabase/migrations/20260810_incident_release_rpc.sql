-- ============================================================================
-- IDS PULSE: EXTRACTED INCIDENT RELEASE FUNCTION & RLS POLICIES FOR SUPABASE
-- Execute in Supabase SQL Editor: https://supabase.com/dashboard/project/wuqqrcowznrmmuokfxlk/sql
-- ============================================================================

-- 1. Create or Replace release_incident_to_client RPC
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
    v_user_id := COALESCE(p_payload->>'rep_id', p_payload->>'user_id', p_payload->>'reporter_id', auth.uid()::text);
    
    IF v_user_id IS NULL OR TRIM(v_user_id) = '' THEN
        v_user_id := 'rep_clarence';
    END IF;

    SELECT id::text, name, role, COALESCE(is_deactivated, FALSE)
    INTO v_user_id, v_user_name, v_user_role, v_is_deactivated
    FROM public.users
    WHERE id = v_user_id OR auth_id = v_user_id OR username = v_user_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := COALESCE(p_payload->>'rep_id', 'rep_clarence');
        v_user_name := COALESCE(p_payload->>'rep_name', 'Clarence Kuiken');
        v_user_role := 'rep';
        v_is_deactivated := FALSE;
    END IF;

    v_selected_project_id := COALESCE(p_payload->>'assignment_id', p_payload->>'project_id', p_payload->>'supplier_id');
    
    SELECT id, client_id, supplier_id, plant_id
    INTO v_project_id, v_client_id, v_supplier_id, v_plant_id
    FROM public.projects
    WHERE id = v_selected_project_id
       OR supplier_id = v_selected_project_id
       OR client_id = v_selected_project_id
    LIMIT 1;

    v_project_id := COALESCE(v_project_id, v_selected_project_id, 'proj_magna_1');
    v_client_id  := COALESCE(v_client_id, p_payload->>'client_id', p_payload->>'supplier_id', 'sup_magna');
    v_supplier_id:= COALESCE(v_supplier_id, p_payload->>'supplier_id', 'sup_magna');
    v_plant_id   := COALESCE(v_plant_id, p_payload->>'plant_id', 'plant_oakville');

    IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
        p_idempotency_key := 'ik_' || FLOOR(EXTRACT(EPOCH FROM v_server_now)) || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
    END IF;

    SELECT id, status, released_at INTO v_existing_inc
    FROM public.incidents
    WHERE idempotency_key = p_idempotency_key OR id = (p_payload->>'id')
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

    v_inc_id := COALESCE(p_payload->>'id', 'INC-' || TO_CHAR(v_server_now, 'YYYYMMDD-HH24MISS') || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    v_local_ref := COALESCE(p_payload->>'tracking_ref', p_payload->>'id', v_inc_id);

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
        COALESCE(p_payload->>'level_of_concern', p_payload->>'concern_classification', 'Major'),
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

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.release_incident_to_client(JSONB, TEXT) TO anon, authenticated, service_role;

-- 2. Add permissive RLS policies for incidents, time_entries, and expense_entries tables
DROP POLICY IF EXISTS "tmp_app_select_incidents" ON public.incidents;
CREATE POLICY "tmp_app_select_incidents" ON public.incidents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tmp_app_insert_incidents" ON public.incidents;
CREATE POLICY "tmp_app_insert_incidents" ON public.incidents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tmp_app_update_incidents" ON public.incidents;
CREATE POLICY "tmp_app_update_incidents" ON public.incidents FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tmp_app_select_time_entries" ON public.time_entries;
CREATE POLICY "tmp_app_select_time_entries" ON public.time_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tmp_app_insert_time_entries" ON public.time_entries;
CREATE POLICY "tmp_app_insert_time_entries" ON public.time_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tmp_app_update_time_entries" ON public.time_entries;
CREATE POLICY "tmp_app_update_time_entries" ON public.time_entries FOR UPDATE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tmp_app_select_expense_entries" ON public.expense_entries;
CREATE POLICY "tmp_app_select_expense_entries" ON public.expense_entries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tmp_app_insert_expense_entries" ON public.expense_entries;
CREATE POLICY "tmp_app_insert_expense_entries" ON public.expense_entries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tmp_app_update_expense_entries" ON public.expense_entries;
CREATE POLICY "tmp_app_update_expense_entries" ON public.expense_entries FOR UPDATE TO anon, authenticated USING (true);
