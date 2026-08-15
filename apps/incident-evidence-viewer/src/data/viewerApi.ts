import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { parseAttachmentGrant, parseIncidentEvidence } from "./contracts";
import {
  clientOvertimeCursorPayload,
  dashboardCursorPayload,
  parseClientOvertimeFeed,
  parseDashboardFeed,
  parseDashboardSnapshot,
  validateDashboardFeedForActor,
} from "./dashboardContracts";
import { readViewerEnvironment } from "../security/environment";
import type {
  AttachmentGrant,
  ClientOvertimeFeed,
  ClientOvertimeCursor,
  DashboardAtomicSnapshot,
  DashboardActor,
  DashboardCursor,
  DashboardFeedPage,
  EvidenceAudience,
  ViewerIncidentEvidence,
} from "../types";

const viewerEnvironment = readViewerEnvironment(import.meta.env);

const viewerFetch: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  headers.delete("x-client-info");
  return fetch(input, { ...init, headers });
};

export const viewerClient = createClient(
  viewerEnvironment.supabaseUrl,
  viewerEnvironment.publishableKey,
  {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
    global: { fetch: viewerFetch },
  },
);

function dataError(message: string): Error {
  return new Error(message);
}

function assertRepFilter(repFilter: string | null): void {
  if (
    repFilter !== null &&
    (repFilter.length < 1 ||
      repFilter.length > 200 ||
      repFilter !== repFilter.trim() ||
      /[\u0000-\u001F\u007F]/.test(repFilter))
  ) {
    throw dataError("The IDS author filter is invalid.");
  }
}

function dashboardRpcError(
  error: { code?: string; message?: string } | null,
  fallback: string,
): Error {
  if (error?.code === "42501") {
    return dataError("This authenticated account is not authorized for this dashboard view.");
  }
  if (error?.code === "22023") {
    return dataError("The dashboard paging request was rejected.");
  }
  return dataError(fallback);
}

export async function getAuthoritativeUser(client: SupabaseClient): Promise<User | null> {
  const { data, error } = await client.auth.getUser();
  if (error) {
    if (error.status === 401 || error.status === 403) return null;
    throw dataError("The secure identity service is unavailable.");
  }
  return data.user ?? null;
}

export async function signInWithPassword(
  client: SupabaseClient,
  email: string,
  password: string,
): Promise<User> {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw dataError("Email or password is incorrect.");
  const user = await getAuthoritativeUser(client);
  if (!user) {
    await client.auth.signOut({ scope: "local" });
    throw dataError("The authenticated identity could not be verified.");
  }
  return user;
}

export async function fetchDashboardFeed(
  client: SupabaseClient,
  limit = 50,
  cursor: DashboardCursor | null = null,
  repFilter: string | null = null,
  actor: DashboardActor | null = null,
): Promise<DashboardFeedPage> {
  assertRepFilter(repFilter);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw dataError("Dashboard page size must be between 1 and 100.");
  }
  const { data, error } = await client.rpc("get_mobile_dashboard_feed", {
    p_limit: limit,
    p_cursor: dashboardCursorPayload(cursor),
    p_rep_id: repFilter,
  });
  if (error) throw dashboardRpcError(error, "Dashboard records could not be loaded.");
  const page = parseDashboardFeed(data);
  if (page.repFilter !== repFilter) {
    throw dataError("Dashboard records did not preserve the selected IDS author filter.");
  }
  if (actor) validateDashboardFeedForActor(page, actor, repFilter);
  if (
    cursor &&
    page.nextCursor &&
    cursor.recordedAt === page.nextCursor.recordedAt &&
    cursor.entityId === page.nextCursor.entityId &&
    cursor.kind === page.nextCursor.kind
  ) {
    throw dataError("Dashboard pagination did not advance.");
  }
  return page;
}

export async function fetchDashboardSnapshot(
  client: SupabaseClient,
  limit = 50,
  cursor: DashboardCursor | null = null,
  repFilter: string | null = null,
): Promise<DashboardAtomicSnapshot> {
  assertRepFilter(repFilter);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw dataError("Dashboard page size must be between 1 and 100.");
  }
  const { data, error } = await client.rpc("get_mobile_dashboard_snapshot", {
    p_limit: limit,
    p_cursor: dashboardCursorPayload(cursor),
    p_rep_id: repFilter,
  });
  if (error) throw dashboardRpcError(error, "Dashboard snapshot could not be loaded.");
  const snapshot = parseDashboardSnapshot(data);
  if (snapshot.repFilter !== repFilter) {
    throw dataError("Dashboard snapshot did not preserve the selected IDS author filter.");
  }
  if (
    cursor &&
    snapshot.feed.nextCursor &&
    cursor.recordedAt === snapshot.feed.nextCursor.recordedAt &&
    cursor.entityId === snapshot.feed.nextCursor.entityId &&
    cursor.kind === snapshot.feed.nextCursor.kind
  ) {
    throw dataError("Dashboard pagination did not advance.");
  }
  return snapshot;
}

export async function fetchClientOvertimeReviewFeed(
  client: SupabaseClient,
  limit = 50,
  cursor: ClientOvertimeCursor | null = null,
): Promise<ClientOvertimeFeed> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw dataError("Client overtime page size must be between 1 and 100.");
  }
  const { data, error } = await client.rpc("get_client_mobile_overtime_review_feed", {
    p_limit: limit,
    p_cursor: clientOvertimeCursorPayload(cursor),
  });
  if (error) throw dashboardRpcError(error, "Pending overtime could not be loaded.");
  const page = parseClientOvertimeFeed(data);
  if (
    cursor &&
    page.nextCursor &&
    cursor.submittedAt === page.nextCursor.submittedAt &&
    cursor.overtimeEntryId === page.nextCursor.overtimeEntryId
  ) {
    throw dataError("Client overtime pagination did not advance.");
  }
  return page;
}

export async function fetchIncidentEvidence(
  client: SupabaseClient,
  incidentId: string,
  audience: EvidenceAudience,
): Promise<ViewerIncidentEvidence> {
  const { data, error } = await client.rpc("get_mobile_incident_evidence", {
    p_incident_id: incidentId,
  });
  if (error) throw dataError("Incident evidence could not be loaded.");
  return audience === "external_client"
    ? parseIncidentEvidence(data, incidentId, "external_client")
    : parseIncidentEvidence(data, incidentId, "ids_internal");
}

export async function requestAttachmentAccess(
  client: SupabaseClient,
  incidentId: string,
  attachmentId: string,
  action: "view" | "download",
  createRequestId: () => string = () => crypto.randomUUID(),
): Promise<AttachmentGrant> {
  const requestId = createRequestId();
  const { data, error } = await client.functions.invoke(
    "authorize-incident-evidence",
    {
      body: {
        attachment_id: attachmentId,
        action,
        request_id: requestId,
      },
    },
  );
  if (error) throw dataError("Private evidence access could not be authorized.");
  return parseAttachmentGrant(data, incidentId, attachmentId, action);
}

export function subscribeToIncidentDashboard(
  client: SupabaseClient,
  onSignal: () => void,
): RealtimeChannel {
  return client
    .channel(`incident-evidence-dashboard-${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "mobile_incident_dashboard_events",
      },
      () => onSignal(),
    )
    .subscribe();
}
