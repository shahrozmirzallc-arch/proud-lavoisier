import { beforeAll, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { INCIDENT_SELECT } from "../src/data/contracts";
import { STAGING_ORIGIN } from "../src/security/environment";

vi.stubEnv("VITE_SUPABASE_URL", STAGING_ORIGIN);
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_unit_test_value_only");

type ViewerApi = typeof import("../src/data/viewerApi");
let api: ViewerApi;

const incidentId = "INC-0123456789abcdef0123456789abcdef";
const attachmentId = "22222222-2222-4222-8222-222222222222";
const groupId = "11111111-1111-4111-8111-111111111111";

const incidentRow = {
  id: incidentId,
  project_id: "project-100",
  supplier_id: null,
  plant_id: null,
  rep_name: "Quality Rep",
  part_id: null,
  defect_type: null,
  area: null,
  description: "Released Incident description",
  action_taken: null,
  returned_to_supplier_status: "unknown",
  sort_requested_status: "unknown",
  rma_required_status: "unknown",
  rma_number: null,
  concern_classification: null,
  level_of_concern: null,
  level_of_concern_other: null,
  status: "Open",
  released_at: "2026-08-12T14:00:00.000Z",
  sent_at: null,
  created_at: "2026-08-12T13:59:59.000Z",
  updated_at: "2026-08-12T14:00:00.000Z",
};

beforeAll(async () => {
  api = await import("../src/data/viewerApi");
});

describe("viewer data boundaries", () => {
  it("uses the exact released/available feed predicates and no tenant filter", async () => {
    const calls: unknown[][] = [];
    const builder = {
      select: vi.fn((...args: unknown[]) => { calls.push(["select", ...args]); return builder; }),
      not: vi.fn((...args: unknown[]) => { calls.push(["not", ...args]); return builder; }),
      eq: vi.fn((...args: unknown[]) => { calls.push(["eq", ...args]); return builder; }),
      order: vi.fn((...args: unknown[]) => { calls.push(["order", ...args]); return builder; }),
      limit: vi.fn(async (...args: unknown[]) => {
        calls.push(["limit", ...args]);
        return { data: [incidentRow], error: null };
      }),
    };
    const client = {
      from: vi.fn((table: string) => {
        calls.push(["from", table]);
        return builder;
      }),
    } as unknown as SupabaseClient;

    await expect(api.fetchReleasedIncidents(client)).resolves.toHaveLength(1);
    expect(calls).toEqual([
      ["from", "incidents"],
      ["select", INCIDENT_SELECT],
      ["not", "incident_client_reference", "is", null],
      ["eq", "released_to_client", true],
      ["eq", "dashboard_delivery_state", "available"],
      ["order", "released_at", { ascending: false }],
      ["limit", 100],
    ]);
    expect(calls.flat()).not.toContain("client_id");
  });

  it("calls only the path-free evidence RPC for attachment metadata", async () => {
    const response = {
      status: "confirmed",
      entity_id: incidentId,
      server_timestamp: "2026-08-12T14:01:00.000Z",
      record_kind: "incident_evidence",
      incident_id: incidentId,
      media_delivery: "not_provided",
      dashboard_delivery: "available",
      admin_approval_required: false,
      groups: [],
      attachments: [],
    };
    const rpc = vi.fn(async () => ({ data: response, error: null }));
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchIncidentEvidence(client, incidentId)).resolves.toMatchObject({
      incidentId,
      state: "not_provided",
    });
    expect(rpc).toHaveBeenCalledWith("get_mobile_incident_evidence", {
      p_incident_id: incidentId,
    });
  });

  it("sends a fresh caller request ID to the Edge authorizer", async () => {
    const requestId = "55555555-5555-4555-8555-555555555555";
    const grant = {
      status: "authorized",
      entity_id: incidentId,
      server_timestamp: "2026-08-12T14:02:00.000Z",
      incident_id: incidentId,
      attachment_id: attachmentId,
      action: "download",
      access_grant_id: "44444444-4444-4444-8444-444444444444",
      signed_url: `${STAGING_ORIGIN}/storage/v1/object/sign/ids-pulse-incident-evidence/sealed/v1/${groupId}/${attachmentId}/${"b".repeat(64)}.jpg?token=temporary-token&download=incident-evidence-${attachmentId.replaceAll("-", "")}.jpg`,
      expires_in_seconds: 300,
      expires_at: "2026-08-12T14:07:00.000Z",
    };
    const invoke = vi.fn(async () => ({ data: grant, error: null }));
    const client = { functions: { invoke } } as unknown as SupabaseClient;
    await api.requestAttachmentAccess(
      client,
      incidentId,
      attachmentId,
      "download",
      () => requestId,
    );
    expect(invoke).toHaveBeenCalledWith("authorize-incident-evidence", {
      body: { attachment_id: attachmentId, action: "download", request_id: requestId },
    });
  });

  it("treats Realtime rows as refetch-only signals", () => {
    let handler: () => void = () => {
      throw new Error("Realtime signal handler was not registered.");
    };
    const onSignal = vi.fn();
    const channel = {
      on: vi.fn((_type, _filter, callback: () => void) => {
        handler = callback;
        return channel;
      }),
      subscribe: vi.fn(() => channel),
    };
    const client = { channel: vi.fn(() => channel) } as unknown as SupabaseClient;
    api.subscribeToIncidentDashboard(client, onSignal);
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mobile_incident_dashboard_events",
      },
      expect.any(Function),
    );
    handler();
    expect(onSignal).toHaveBeenCalledTimes(1);
  });
});
