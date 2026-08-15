import { beforeAll, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { STAGING_ORIGIN } from "../src/security/environment";

vi.stubEnv("VITE_SUPABASE_URL", STAGING_ORIGIN);
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_unit_test_value_only");

type ViewerApi = typeof import("../src/data/viewerApi");
let api: ViewerApi;

const incidentId = "INC-0123456789abcdef0123456789abcdef";
const attachmentId = "22222222-2222-4222-8222-222222222222";
const groupId = "11111111-1111-4111-8111-111111111111";

const actorResponse = {
  status: "ok",
  record_kind: "mobile_dashboard_actor",
  server_timestamp: "2026-08-14T14:00:00.000Z",
  actor: { display_name: "Office Lead", role: "office", role_label: "IDS Office" },
  capabilities: {
    quality_sources: true,
    incident_core: true,
    incident_evidence: true,
    daily_reports: true,
    hours: true,
    client_overtime_review: false,
    expenses: false,
    finance_evidence: false,
    configuration_attention: true,
  },
};

const feedResponse = {
  status: "ok",
  record_kind: "mobile_dashboard_feed",
  server_timestamp: "2026-08-14T14:00:01.000Z",
  has_more: false,
  next_cursor: null,
  items: [],
};

const overtimeResponse = {
  status: "ok",
  record_kind: "client_overtime_review_feed",
  server_timestamp: "2026-08-14T14:00:02.000Z",
  has_more: false,
  next_cursor: null,
  items: [],
};

const snapshotResponse = {
  status: "ok",
  record_kind: "mobile_dashboard_snapshot",
  server_timestamp: actorResponse.server_timestamp,
  actor: actorResponse,
  feed: { ...feedResponse, server_timestamp: actorResponse.server_timestamp },
};

beforeAll(async () => {
  api = await import("../src/data/viewerApi");
});

describe("role-aware dashboard RPC boundaries", () => {
  it("loads actor and first feed page through one atomic snapshot RPC", async () => {
    const rpc = vi.fn(async () => ({ data: snapshotResponse, error: null }));
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchDashboardSnapshot(client)).resolves.toMatchObject({
      actor: { displayName: "Office Lead", role: "office" },
      feed: { items: [] },
    });
    expect(rpc).toHaveBeenCalledWith("get_mobile_dashboard_snapshot", {
      p_limit: 50,
      p_cursor: null,
      p_rep_id: null,
    });
  });

  it("keeps the feed-only RPC available for continuation pages", async () => {
    const rpc = vi.fn(async () => ({ data: feedResponse, error: null }));
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchDashboardFeed(client)).resolves.toMatchObject({ items: [] });
    expect(rpc).toHaveBeenCalledWith("get_mobile_dashboard_feed", {
      p_limit: 50,
      p_cursor: null,
      p_rep_id: null,
    });
  });

  it("maps a stable tuple cursor without storing it in browser state", async () => {
    const rpc = vi.fn(async () => ({ data: feedResponse, error: null }));
    const client = { rpc } as unknown as SupabaseClient;
    await api.fetchDashboardFeed(client, 25, {
      recordedAt: "2026-08-14T12:00:00.000Z",
      entityId: "record-25",
      kind: "urgent_incident",
    });
    expect(rpc).toHaveBeenCalledWith("get_mobile_dashboard_feed", {
      p_limit: 25,
      p_cursor: {
        recorded_at: "2026-08-14T12:00:00.000Z",
        entity_id: "record-25",
        kind: "urgent_incident",
      },
      p_rep_id: null,
    });
  });

  it("passes and verifies the exact server-side IDS Rep filter", async () => {
    const repId = "rep-clarence";
    const filteredFeed = {
      ...feedResponse,
      contract_version: 2,
      rep_filter: repId,
    };
    const filteredSnapshot = {
      ...snapshotResponse,
      contract_version: 2,
      rep_filter: repId,
      feed: { ...filteredFeed, server_timestamp: actorResponse.server_timestamp },
    };
    const rpc = vi.fn(async (name: string) => ({
      data: name === "get_mobile_dashboard_snapshot" ? filteredSnapshot : filteredFeed,
      error: null,
    }));
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchDashboardSnapshot(client, 50, null, repId)).resolves.toMatchObject({
      contractVersion: 2,
      repFilter: repId,
    });
    await expect(api.fetchDashboardFeed(client, 50, null, repId)).resolves.toMatchObject({
      contractVersion: 2,
      repFilter: repId,
    });
    expect(rpc).toHaveBeenNthCalledWith(1, "get_mobile_dashboard_snapshot", {
      p_limit: 50,
      p_cursor: null,
      p_rep_id: repId,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "get_mobile_dashboard_feed", {
      p_limit: 50,
      p_cursor: null,
      p_rep_id: repId,
    });
  });

  it("rejects malformed Rep filters before issuing an RPC", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchDashboardFeed(client, 50, null, " rep-clarence"))
      .rejects.toThrow(/author filter is invalid/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects an invalid local page size before issuing a query", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchDashboardFeed(client, 101)).rejects.toThrow(/between 1 and 100/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("loads the all-assignment Client queue through its dedicated RPC", async () => {
    const rpc = vi.fn(async () => ({ data: overtimeResponse, error: null }));
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchClientOvertimeReviewFeed(client)).resolves.toMatchObject({ items: [] });
    expect(rpc).toHaveBeenCalledWith("get_client_mobile_overtime_review_feed", {
      p_limit: 50,
      p_cursor: null,
    });
  });

  it("maps the exact Client OT continuation cursor", async () => {
    const rpc = vi.fn(async () => ({ data: overtimeResponse, error: null }));
    const client = { rpc } as unknown as SupabaseClient;
    await api.fetchClientOvertimeReviewFeed(client, 20, {
      submittedAt: "2026-08-14T13:00:00.000Z",
      overtimeEntryId: "ot-20",
    });
    expect(rpc).toHaveBeenCalledWith("get_client_mobile_overtime_review_feed", {
      p_limit: 20,
      p_cursor: {
        submitted_at: "2026-08-14T13:00:00.000Z",
        overtime_entry_id: "ot-20",
      },
    });
  });

  it("treats a PostgREST denial as an error even if data is present", async () => {
    const rpc = vi.fn(async () => ({
      data: snapshotResponse,
      error: { code: "42501", message: "Active dashboard account required." },
    }));
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchDashboardSnapshot(client)).rejects.toThrow(/not authorized/i);
  });
});

describe("incident evidence boundary", () => {
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
      access_scope: "ids_internal_full",
      groups: [],
      attachments: [],
    };
    const rpc = vi.fn(async () => ({ data: response, error: null }));
    const client = { rpc } as unknown as SupabaseClient;
    await expect(api.fetchIncidentEvidence(client, incidentId, "ids_internal")).resolves.toMatchObject({
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
