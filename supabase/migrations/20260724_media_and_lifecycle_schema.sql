-- ============================================================================
-- IDS PULSE - MEDIA & QUALITY INCIDENT LIFECYCLE MIGRATION
-- Target Project: https://supabase.com/dashboard/project/wuqqrcowznrmmuokfxlk
-- Description: Creates 7 media & publication tables with Multi-Tenant RLS Policies
-- ============================================================================

-- 1. MEDIA ASSETS TABLE
CREATE TABLE IF NOT EXISTS public.media_assets (
    id TEXT PRIMARY KEY,
    incident_id TEXT REFERENCES public.incidents(id) ON DELETE CASCADE,
    expense_id TEXT REFERENCES public.expense_entries(id) ON DELETE CASCADE,
    rep_id TEXT REFERENCES public.users(id) NOT NULL,
    provider_public_id TEXT NOT NULL,
    provider_asset_version TEXT,
    resource_type TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video' | 'raw'
    detected_format TEXT,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    duration_seconds NUMERIC(10,2),
    page_count INTEGER,
    upload_status TEXT NOT NULL DEFAULT 'waiting_internet', -- 'waiting_internet' | 'waiting_wifi' | 'uploading' | 'processing' | 'verified_by_ids' | 'needs_attention'
    malware_scan_status TEXT DEFAULT 'clean', -- 'pending' | 'clean' | 'quarantined'
    review_status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEDIA VARIANTS TABLE (Sanitized Previews & Derivatives)
CREATE TABLE IF NOT EXISTS public.media_variants (
    id TEXT PRIMARY KEY,
    asset_id TEXT REFERENCES public.media_assets(id) ON DELETE CASCADE NOT NULL,
    variant_type TEXT NOT NULL, -- 'sanitized_photo_1600' | 'receipt_preview_2000' | 'video_review_720p' | 'audio_mono_aac' | 'pdf_preview_1200'
    secure_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    width INTEGER,
    height INTEGER,
    exif_stripped BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEDIA ANNOTATIONS TABLE (Non-destructive JSON Layers)
CREATE TABLE IF NOT EXISTS public.media_annotations (
    id TEXT PRIMARY KEY,
    asset_id TEXT REFERENCES public.media_assets(id) ON DELETE CASCADE NOT NULL,
    vector_layers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEDIA UPLOAD SESSIONS TABLE (Server-Signed Short-Lived Parameters)
CREATE TABLE IF NOT EXISTS public.media_upload_sessions (
    id TEXT PRIMARY KEY,
    rep_id TEXT REFERENCES public.users(id) NOT NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    signed_upload_params JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MEDIA PUBLICATIONS TABLE (Frozen Customer Release Bundles)
CREATE TABLE IF NOT EXISTS public.media_publications (
    id TEXT PRIMARY KEY,
    incident_id TEXT REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    sanitized_bundle_json JSONB NOT NULL,
    published_by TEXT REFERENCES public.users(id) NOT NULL,
    publication_status TEXT DEFAULT 'published', -- 'published' | 'revoked'
    published_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. MEDIA RETENTION POLICIES TABLE
CREATE TABLE IF NOT EXISTS public.media_retention_policies (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES public.suppliers(id),
    retention_years INTEGER DEFAULT 7,
    legal_hold_active BOOLEAN DEFAULT FALSE,
    local_master_cleanup_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MEDIA AUDIT EVENTS TABLE (Append-Only Immutable Audit Log)
CREATE TABLE IF NOT EXISTS public.media_audit_events (
    id TEXT PRIMARY KEY,
    asset_id TEXT,
    incident_id TEXT,
    actor_id TEXT REFERENCES public.users(id) NOT NULL,
    action_type TEXT NOT NULL, -- 'raw_master_view' | 'lead_approval' | 'customer_publication' | 'legal_hold_toggle' | 'media_revocation'
    mfa_verified BOOLEAN DEFAULT FALSE,
    details_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STRICT MULTI-TENANT RLS POLICIES FOR MEDIA & LIFECYCLE TABLES
-- ============================================================================
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_upload_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_audit_events ENABLE ROW LEVEL SECURITY;

-- 1. MEDIA ASSETS RLS (No Receipt Access for Customers/Leads, No Cross-Rep Evidence Access)
DROP POLICY IF EXISTS "Media Asset Select RLS" ON public.media_assets;
CREATE POLICY "Media Asset Select RLS" ON public.media_assets
FOR SELECT USING (
    (auth.role() = 'service_role') OR
    (rep_id = auth.uid()::text) OR
    (expense_id IS NULL AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin', 'lead')
    )) OR
    (expense_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.id = auth.uid()::text AND u.role IN ('admin', 'super_admin', 'accountant')
    ))
);

DROP POLICY IF EXISTS "Media Asset Insert RLS" ON public.media_assets;
CREATE POLICY "Media Asset Insert RLS" ON public.media_assets
FOR INSERT WITH CHECK (
    (auth.role() = 'service_role') OR
    (rep_id = auth.uid()::text)
);

-- 2. MEDIA PUBLICATIONS RLS (Customer Portal Access to Published Bundles Only)
DROP POLICY IF EXISTS "Customer Publication Read RLS" ON public.media_publications;
CREATE POLICY "Customer Publication Read RLS" ON public.media_publications
FOR SELECT USING (
    (publication_status = 'published') AND (
        (auth.role() = 'service_role') OR
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.incidents inc ON inc.id = media_publications.incident_id
            WHERE u.id = auth.uid()::text AND (
                u.role IN ('admin', 'super_admin', 'lead') OR 
                (u.role = 'customer' AND inc.supplier_id = u.company_affiliation)
            )
        )
    )
);

-- 3. MEDIA UPLOAD SESSIONS RLS (Rep Only Upload Reservations)
DROP POLICY IF EXISTS "Upload Session RLS" ON public.media_upload_sessions;
CREATE POLICY "Upload Session RLS" ON public.media_upload_sessions
FOR ALL USING (
    (auth.role() = 'service_role') OR (rep_id = auth.uid()::text)
);

-- 4. MEDIA AUDIT EVENTS RLS (Immutable Append Only)
DROP POLICY IF EXISTS "Audit Event Insert RLS" ON public.media_audit_events;
CREATE POLICY "Audit Event Insert RLS" ON public.media_audit_events
FOR INSERT WITH CHECK (
    (auth.role() = 'service_role') OR (actor_id = auth.uid()::text)
);
