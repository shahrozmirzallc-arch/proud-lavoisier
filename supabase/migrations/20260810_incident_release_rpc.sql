-- IDS Pulse: create the incident release function.
-- Paste this WHOLE file into the Supabase SQL editor and press Run.
--
-- This script proves itself. When it works the Results panel shows ONE ROW
-- at the bottom. If you see "Success. No rows returned" then the function
-- was NOT created and something above failed. Scroll up and read the error.

-- ============================================================================
-- IDS PULSE: STRICT AUTHORITATIVE INCIDENT RELEASE RPC FUNCTION
-- No hardcoded dummy fallbacks, session-first resolution, strict database-only routing
-- ============================================================================

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
    v_input_user_id TEXT;
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
    -- 1. Resolve User ID: Read session auth.uid() first, then payload identifiers
    v_input_user_id := COALESCE(
        auth.uid()::text,
        p_payload->>'rep_id',
        p_payload->>'user_id',
        p_payload->>'reporter_id'
    );

    IF v_input_user_id IS NULL OR TRIM(v_input_user_id) = '' THEN
        RAISE EXCEPTION 'Authentication Error: User identification is required to release an incident report.';
    END IF;

    -- 2. Validate user existence and status from public.users table (NO hardcoded fallback)
    SELECT id::text, name, role, COALESCE(is_deactivated, FALSE)
    INTO v_user_id, v_user_name, v_user_role, v_is_deactivated
    FROM public.users
    WHERE id = v_input_user_id OR auth_id::text = v_input_user_id OR username = v_input_user_id
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication Error: User record "%" does not exist in the database.', v_input_user_id;
    END IF;

    IF v_is_deactivated IS TRUE THEN
        RAISE EXCEPTION 'Security Refusal: Account for user "%" is deactivated.', v_user_name;
    END IF;

    IF v_user_role NOT IN ('rep', 'qre', 'quality_rep', 'admin', 'owner', 'super_admin') THEN
        RAISE EXCEPTION 'Authorization Error: User role "%" is not permitted to release incident reports.', v_user_role;
    END IF;

    -- 3. Resolve Project Assignment from payload (NO hardcoded fallback)
    v_selected_project_id := COALESCE(p_payload->>'assignment_id', p_payload->>'project_id');
    
    IF v_selected_project_id IS NULL OR TRIM(v_selected_project_id) = '' THEN
        RAISE EXCEPTION 'Validation Error: An authoritative project assignment ID is required to release an incident report.';
    END IF;

    -- 4. Query real public.projects record (derived routing ONLY from database)
    SELECT id, client_id, supplier_id, plant_id
    INTO v_project_id, v_client_id, v_supplier_id, v_plant_id
    FROM public.projects
    WHERE id = v_selected_project_id
    LIMIT 1;

    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Database Error: Selected project assignment "%" does not exist.', v_selected_project_id;
    END IF;

    IF v_client_id IS NULL OR TRIM(v_client_id) = '' THEN
        RAISE EXCEPTION 'Configuration Error: Selected project "%" has no valid client configuration.', v_project_id;
    END IF;

    IF v_supplier_id IS NULL OR TRIM(v_supplier_id) = '' THEN
        RAISE EXCEPTION 'Configuration Error: Selected project "%" has no valid supplier configuration.', v_project_id;
    END IF;

    -- 5. Validate Idempotency Key
    IF p_idempotency_key IS NULL OR TRIM(p_idempotency_key) = '' THEN
        RAISE EXCEPTION 'Validation Error: A unique idempotency key is required.';
    END IF;

    -- 6. Scoped Idempotency Check
    SELECT id, status, released_at INTO v_existing_inc
    FROM public.incidents
    WHERE idempotency_key = p_idempotency_key OR (p_payload->>'id' IS NOT NULL AND id = p_payload->>'id')
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

    -- 7. Generate Server-Side Authoritative Incident ID
    v_inc_id := COALESCE(p_payload->>'id', 'INC-' || TO_CHAR(v_server_now, 'YYYYMMDD-HH24MISS') || '-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    v_local_ref := COALESCE(p_payload->>'tracking_ref', p_payload->>'id', v_inc_id);

    -- 8. Insert Incident Record (Server-derived routing fields ONLY)
    INSERT INTO public.incidents (
        id,
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
        created_at
    ) VALUES (
        v_inc_id,
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
        COALESCE(p_payload->>'returned_to_supplier', 'Unknown'),
        COALESCE(p_payload->>'sort_requested', 'Unknown'),
        COALESCE(p_payload->>'rma_required', 'Unknown'),
        p_payload->>'rma_number',
        COALESCE(p_payload->>'level_of_concern', p_payload->>'concern_classification', 'PRR'),
        'released',
        TRUE,
        v_server_now,
        v_user_id,
        p_idempotency_key,
        v_local_ref,
        'Released',
        v_server_now
    );

    -- 9. Insert Authoritative System Audit Log
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

    -- 10. Return Authoritative Release Confirmation Object
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

-- Grant execution permission
GRANT EXECUTE ON FUNCTION public.release_incident_to_client(JSONB, TEXT) TO authenticated, anon, service_role;


-- ===========================================================================
-- SELF CHECK. This must return exactly one row.
-- If the Results panel is empty, the function was not created.
-- ===========================================================================
SELECT
    proname                AS function_name,
    pronargs               AS argument_count,
    prosecdef              AS is_security_definer,
    'CREATED OK'           AS result
FROM pg_proc
WHERE proname = 'release_incident_to_client';
