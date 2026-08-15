# IDS Pulse Mobile Operations Dashboard

This package is a deliberately isolated, staging-only, read-only IDS Pulse dashboard. It presents the mobile operating record authorized for the signed-in user while preserving the existing private Urgent Incident evidence flow. It does not modify or depend on the legacy IDS Pulse portal implementation.

## Authorization boundary

- The Supabase origin must be exactly `https://qatoyevwtjjtynisodyq.supabase.co`.
- Only a Supabase publishable key is accepted. Legacy anon, secret, and service-role variables fail closed.
- Supabase Auth `getUser()` is the authoritative identity check. The app does not read a role from browser storage, session claims, or user metadata.
- `get_mobile_dashboard_snapshot(p_limit, p_cursor)` returns the complete actor and first RLS-authorized feed page from one database statement snapshot. Its nested actor/feed envelopes and all three server timestamps are validated exactly.
- `get_mobile_dashboard_feed(p_limit, p_cursor)` is used only for continuation pages. The validator accepts exactly six record kinds and rejects unknown fields.
- `get_client_mobile_overtime_review_feed(p_limit, p_cursor)` is called only when the actor contract grants `client_overtime_review`. The RPC still independently authorizes the billing Client account and paginates across every authorized assignment.
- PostgREST errors are transport/authorization failures, never success payloads. An authorized empty `items` array is rendered as an empty state.

The dashboard does not issue direct table reads. The server RPCs remain authoritative for row visibility and data minimization.

## Contract rollout order

Deploy this viewer before applying the database migration that adds `container_labels` to the complete v2 Routine Inspection and Rework projections and paired label-availability objects to the complete v2 Urgent projection. During that rollout only, each validator accepts its new exact shape or one exact prior shape. Missing Quality label arrays map to an empty display list because the old projection supplied no label data. Missing Urgent availability objects map to `null` and render as legacy/not provided; no unavailable reason is inferred. If new keys are present, malformed values still fail closed, and every unrelated extra key remains rejected.

Database-first rollout is not compatible with the previous viewer because its exact-key validators do not recognize these fields. After the compatible viewer is live, apply the database migration; do not reverse this order.

## Capability sections

The server can independently enable:

- Quality sources: sanitized Routine Inspection and Rework records.
- Urgent core: released Incident core data, with no Admin approval gate.
- Daily: Daily reports, sanitized source activity projections, and their canonical Hours summaries. Expense data is explicitly excluded.
- Hours: grouped logical Hours submissions and safe workflow states, without rates or pay.
- Client OT: the separate pending overtime review queue across all authorized assignments.
- Expenses: safe Finance metadata, amounts, mileage, and attachment counts only. Files, paths, URLs, rates, and pay data are not returned or rendered.
- Configuration attention: an exact positive allowlist shows only loaded Urgent and Daily records with `client_contact_required`; `none` and unknown states are not treated as queue items. Dashboard v1 intentionally has no separate configuration-attention reader or seventh feed kind.

Supplier and mandatory IDS users can receive Urgent core without evidence. The evidence UI mounts only when both `incident_evidence` is true for the actor and `evidence_accessible` is true for the selected Incident. A core-only user therefore never calls an evidence RPC.

## Private Incident evidence

- Evidence metadata comes only from `get_mobile_incident_evidence`. The response validator rejects paths, bucket names, tokens, URLs, and unknown fields.
- View and download actions call `authorize-incident-evidence` with a fresh cryptographic request ID.
- A signed URL must use the staging HTTPS origin and expire in exactly 300 seconds.
- Signed URLs are transient component state. They are cleared at expiry and are never written to browser storage.
- Realtime Incident events are refetch signals only; event payloads are not rendered or retained.

## Pagination and freshness

The first feed request sends `p_limit: 50` and `p_cursor: null`. “Load more” sends the server-provided stable descending tuple cursor `{ recorded_at, entity_id, kind }`. The Client OT queue independently uses `{ submitted_at, overtime_entry_id }`. Both continuations are exclusive. The UI labels record times, the most recent server snapshot time, loading, retry, authorized-empty, and end-of-feed states separately. Loaded counts never claim to be totals when more pages exist.

The combined actor/feed response is committed as one snapshot bound to the authoritative Auth user ID. A refresh or account-ID change invalidates the complete prior snapshot before any new role or data can render, preventing mixed-privilege transitions. Every Supabase Auth state signal synchronously invalidates the identity, rendered snapshot, and in-flight request generations before a deferred `getUser()` recheck begins.

## Local setup

1. Copy `config/env/.env.example` to `config/env/.env.local`.
2. Replace the placeholder with the staging project publishable key.
3. Run `npm ci`.
4. Run `npm run dev`.

The package has its own dependency lock, Vite root, and `envDir`. Root `.env` and `.vercel` files are intentionally ignored.

## Verification

Run `npm test` for response-contract, role-matrix, API-call, evidence, environment, and static-boundary checks. Run `npm run build` with the two staging browser variables present in the process or isolated environment directory.

`npm run test:e2e:staging` remains a dormant connected scaffold for the evidence flow. It refuses to contact Supabase unless `IDS_RUN_STAGING_E2E` exactly equals `explicitly-authorized-staging-only` and staging user credentials plus a publishable key are explicitly provided. Do not run this scaffold against production.
