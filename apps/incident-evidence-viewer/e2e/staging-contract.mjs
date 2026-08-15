import { createClient } from "@supabase/supabase-js";

const STAGING_ORIGIN = "https://qatoyevwtjjtynisodyq.supabase.co";
const REQUIRED_GATE = "explicitly-authorized-staging-only";
const FEED_KINDS = new Set([
  "routine_inspection",
  "rework",
  "urgent_incident",
  "daily_report",
  "hours",
  "expense",
]);

function fail(message) {
  throw new Error(message);
}

function assertNoPrivilegedNames() {
  for (const name of Object.keys(process.env)) {
    if (/(?:^|_)(?:service_?role|secret_?key)(?:_|$)/i.test(name)) {
      fail("Privileged environment names are forbidden for the staging viewer E2E.");
    }
  }
}

function hasTransportMaterial(value) {
  if (Array.isArray(value)) return value.some(hasTransportMaterial);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, item]) => {
    const normalized = key.toLowerCase();
    return [
      "bucket",
      "bucket_id",
      "object_name",
      "path",
      "sealed_object_name",
      "signed_url",
      "staging_object_name",
      "token",
      "url",
    ].includes(normalized) || /storage_object/i.test(normalized) || hasTransportMaterial(item);
  });
}

async function run() {
  if (process.env.IDS_RUN_STAGING_E2E !== REQUIRED_GATE) {
    fail("Refusing to contact staging without the explicit IDS staging E2E gate.");
  }
  assertNoPrivilegedNames();
  const publishableKey = process.env.IDS_STAGING_PUBLISHABLE_KEY ?? "";
  const email = process.env.IDS_STAGING_EMAIL ?? "";
  const password = process.env.IDS_STAGING_PASSWORD ?? "";
  if (!/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(publishableKey) || !email || !password) {
    fail("Staging publishable key and user credentials are required.");
  }

  const client = createClient(STAGING_ORIGIN, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  try {
    const { error: signInError } = await client.auth.signInWithPassword({ email, password });
    if (signInError) fail("Staging authentication failed.");
    const { data: identity, error: identityError } = await client.auth.getUser();
    if (identityError || !identity.user) fail("Authoritative staging identity validation failed.");

    const { data: dashboard, error: dashboardError } = await client.rpc(
      "get_mobile_dashboard_snapshot",
      { p_limit: 50, p_cursor: null },
    );
    if (
      dashboardError ||
      !dashboard ||
      dashboard.status !== "ok" ||
      dashboard.record_kind !== "mobile_dashboard_snapshot" ||
      !dashboard.actor ||
      !dashboard.feed ||
      dashboard.server_timestamp !== dashboard.actor.server_timestamp ||
      dashboard.server_timestamp !== dashboard.feed.server_timestamp ||
      hasTransportMaterial(dashboard)
    ) {
      fail("Atomic mobile dashboard snapshot contract failed.");
    }
    const actor = dashboard.actor;
    const feed = dashboard.feed;
    if (
      actor.status !== "ok" ||
      actor.record_kind !== "mobile_dashboard_actor" ||
      !actor.capabilities ||
      hasTransportMaterial(actor)
    ) {
      fail("Mobile dashboard actor contract failed.");
    }

    if (
      !feed ||
      feed.status !== "ok" ||
      feed.record_kind !== "mobile_dashboard_feed" ||
      !Array.isArray(feed.items) ||
      feed.items.some((item) => !item || !FEED_KINDS.has(item.kind)) ||
      hasTransportMaterial(feed)
    ) {
      fail("Mobile dashboard feed contract failed.");
    }

    if (actor.capabilities.client_overtime_review === true) {
      const { data: overtime, error: overtimeError } = await client.rpc(
        "get_client_mobile_overtime_review_feed",
        { p_limit: 50, p_cursor: null },
      );
      if (
        overtimeError ||
        !overtime ||
        overtime.status !== "ok" ||
        overtime.record_kind !== "client_overtime_review_feed" ||
        typeof overtime.has_more !== "boolean" ||
        (overtime.has_more !== (overtime.next_cursor !== null)) ||
        !Array.isArray(overtime.items) ||
        hasTransportMaterial(overtime)
      ) {
        fail("Client overtime review feed contract failed.");
      }
    }

    const incidentId = process.env.IDS_STAGING_INCIDENT_ID;
    if (incidentId) {
      const incident = feed.items.find(
        (item) => item.kind === "urgent_incident" && item.entity_id === incidentId,
      );
      if (
        actor.capabilities.incident_evidence !== true ||
        !incident ||
        incident.details?.evidence_accessible !== true
      ) {
        fail("The optional Incident is not evidence-authorized in the loaded dashboard page.");
      }
      const { data: evidence, error: evidenceError } = await client.rpc(
        "get_mobile_incident_evidence",
        { p_incident_id: incidentId },
      );
      if (evidenceError || hasTransportMaterial(evidence)) {
        fail("Path-free Incident evidence contract failed.");
      }
    }

    const attachmentId = process.env.IDS_STAGING_ATTACHMENT_ID;
    if (attachmentId) {
      if (!incidentId) fail("An Incident ID is required with an attachment ID.");
      const { data: grant, error: grantError } = await client.functions.invoke(
        "authorize-incident-evidence",
        {
          body: {
            attachment_id: attachmentId,
            action: "view",
            request_id: crypto.randomUUID(),
          },
        },
      );
      const signedUrl = grant && typeof grant === "object" ? grant.signed_url : null;
      if (
        grantError ||
        grant?.expires_in_seconds !== 300 ||
        typeof signedUrl !== "string" ||
        new URL(signedUrl).origin !== STAGING_ORIGIN
      ) {
        fail("Five-minute staging attachment grant contract failed.");
      }
    }

    process.stdout.write(`Staging viewer contract passed for ${feed.items.length} authorized rows.\n`);
  } finally {
    await client.auth.signOut({ scope: "local" });
  }
}

run().catch(() => {
  process.stderr.write("Staging viewer E2E failed without exposing remote details.\n");
  process.exitCode = 1;
});
