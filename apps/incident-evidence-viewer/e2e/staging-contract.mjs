import { createClient } from "@supabase/supabase-js";

const STAGING_ORIGIN = "https://qatoyevwtjjtynisodyq.supabase.co";
const REQUIRED_GATE = "explicitly-authorized-staging-only";
const INCIDENT_SELECT = [
  "id",
  "project_id",
  "supplier_id",
  "plant_id",
  "rep_name",
  "part_id",
  "defect_type",
  "area",
  "description",
  "action_taken",
  "returned_to_supplier_status",
  "sort_requested_status",
  "rma_required_status",
  "rma_number",
  "concern_classification",
  "level_of_concern",
  "level_of_concern_other",
  "status",
  "released_at",
  "sent_at",
  "created_at",
  "updated_at",
].join(",");

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

    const { data: incidents, error: feedError } = await client
      .from("incidents")
      .select(INCIDENT_SELECT)
      .not("incident_client_reference", "is", null)
      .eq("released_to_client", true)
      .eq("dashboard_delivery_state", "available")
      .order("released_at", { ascending: false })
      .limit(5);
    if (feedError || !Array.isArray(incidents)) fail("Released Incident feed contract failed.");

    const incidentId = process.env.IDS_STAGING_INCIDENT_ID;
    if (incidentId) {
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

    process.stdout.write(`Staging viewer contract passed for ${incidents.length} authorized rows.\n`);
  } finally {
    await client.auth.signOut({ scope: "local" });
  }
}

run().catch(() => {
  process.stderr.write("Staging viewer E2E failed without exposing remote details.\n");
  process.exitCode = 1;
});
