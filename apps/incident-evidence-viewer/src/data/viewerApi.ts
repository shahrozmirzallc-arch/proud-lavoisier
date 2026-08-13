import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { parseAttachmentGrant, parseIncidentEvidence, parseIncidentRows, INCIDENT_SELECT } from "./contracts";
import { readViewerEnvironment } from "../security/environment";
import type { AttachmentGrant, IncidentEvidence, IncidentSummary } from "../types";

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

export async function fetchReleasedIncidents(
  client: SupabaseClient,
): Promise<IncidentSummary[]> {
  const { data, error } = await client
    .from("incidents")
    .select(INCIDENT_SELECT)
    .not("incident_client_reference", "is", null)
    .eq("released_to_client", true)
    .eq("dashboard_delivery_state", "available")
    .order("released_at", { ascending: false })
    .limit(100);
  if (error) throw dataError("Released incidents could not be loaded.");
  return parseIncidentRows(data);
}

export async function fetchIncidentEvidence(
  client: SupabaseClient,
  incidentId: string,
): Promise<IncidentEvidence> {
  const { data, error } = await client.rpc("get_mobile_incident_evidence", {
    p_incident_id: incidentId,
  });
  if (error) throw dataError("Incident evidence could not be loaded.");
  return parseIncidentEvidence(data, incidentId);
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
