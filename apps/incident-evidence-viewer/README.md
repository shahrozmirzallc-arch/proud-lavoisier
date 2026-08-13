# IDS Pulse Incident Evidence Viewer

This is a deliberately isolated, staging-only viewer for released Urgent Incident records and their private Supabase Storage evidence. It does not modify or depend on the legacy IDS Pulse dashboard implementation.

## Security boundary

- The Supabase origin must be exactly `https://qatoyevwtjjtynisodyq.supabase.co`.
- Only a Supabase publishable key is accepted. Legacy anon, secret, and service-role variables fail closed.
- Supabase Auth `getUser()` is the authoritative identity check. The app does not read a role from browser storage or user metadata.
- `public.incidents` is queried with an explicit safe-column allowlist and relies on RLS for row authorization.
- Incident evidence metadata comes only from `get_mobile_incident_evidence`. The response validator rejects paths, bucket names, tokens, URLs, or unknown fields.
- View and download actions call `authorize-incident-evidence` with a fresh cryptographic request ID. A signed URL must use the staging HTTPS origin and expire in 300 seconds.
- Signed URLs are transient UI state only. They are cleared at expiry and are never written to browser storage.
- Realtime events are refetch signals only; event payloads are not rendered or retained.

Database policy remains authoritative for Client/Admin access and Accountant denial. The viewer does not reproduce role authorization in client code.

## Local setup

1. Copy `config/env/.env.example` to `config/env/.env.local`.
2. Replace the placeholder with the staging project publishable key.
3. Run `npm ci`.
4. Run `npm run dev`.

The package has its own dependency lock, Vite root, and `envDir`. Root `.env` and `.vercel` files are intentionally ignored.

## Verification

Run `npm test` for unit and static contract checks. Run `npm run build` with the two staging browser variables present in the process or isolated env directory.

`npm run test:e2e:staging` is a dormant connected scaffold. It refuses to contact Supabase unless `IDS_RUN_STAGING_E2E` exactly equals `explicitly-authorized-staging-only` and staging user credentials plus a publishable key are explicitly provided. An optional Incident ID exercises the path-free RPC; an optional attachment ID also exercises one audited five-minute view grant. Do not run this scaffold against production.
