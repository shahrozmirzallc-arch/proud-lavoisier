import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { IncidentDetail } from "./components/IncidentDetail";
import { IncidentList } from "./components/IncidentList";
import { SignIn } from "./components/SignIn";
import {
  fetchReleasedIncidents,
  getAuthoritativeUser,
  signInWithPassword,
  subscribeToIncidentDashboard,
  viewerClient,
} from "./data/viewerApi";
import type { IncidentSummary } from "./types";

type IdentityState =
  | { phase: "checking"; user: null }
  | { phase: "signed_out"; user: null }
  | { phase: "signed_in"; user: User };

export default function App() {
  const [identity, setIdentity] = useState<IdentityState>({ phase: "checking", user: null });
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [evidenceRefreshRevision, setEvidenceRefreshRevision] = useState(0);
  const feedRequest = useRef(0);
  const identityRequest = useRef(0);

  const verifyIdentity = useCallback(async () => {
    const request = identityRequest.current + 1;
    identityRequest.current = request;
    try {
      const user = await getAuthoritativeUser(viewerClient);
      if (identityRequest.current !== request) return;
      setIdentity(user
        ? { phase: "signed_in", user }
        : { phase: "signed_out", user: null });
    } catch {
      if (identityRequest.current === request) {
        setIdentity({ phase: "signed_out", user: null });
      }
    }
  }, []);

  useEffect(() => {
    void verifyIdentity();
    const { data } = viewerClient.auth.onAuthStateChange(() => {
      window.setTimeout(() => void verifyIdentity(), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [verifyIdentity]);

  const refreshFeed = useCallback(async () => {
    const request = feedRequest.current + 1;
    feedRequest.current = request;
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const nextIncidents = await fetchReleasedIncidents(viewerClient);
      if (feedRequest.current !== request) return;
      setIncidents(nextIncidents);
      setSelectedId((current) => {
        if (current && nextIncidents.some((incident) => incident.id === current)) return current;
        return nextIncidents[0]?.id ?? null;
      });
    } catch (reason) {
      if (feedRequest.current === request) {
        setFeedError(
          reason instanceof Error ? reason.message : "Released incidents could not be loaded.",
        );
      }
    } finally {
      if (feedRequest.current === request) setLoadingFeed(false);
    }
  }, []);

  const refreshDashboard = useCallback(() => {
    setEvidenceRefreshRevision((current) => current + 1);
    return refreshFeed();
  }, [refreshFeed]);

  useEffect(() => {
    if (identity.phase !== "signed_in") {
      feedRequest.current += 1;
      setIncidents([]);
      setSelectedId(null);
      setFeedError(null);
      return;
    }
    void refreshFeed();
    const channel = subscribeToIncidentDashboard(viewerClient, () => {
      void refreshDashboard();
    });
    return () => {
      void viewerClient.removeChannel(channel);
    };
  }, [identity.phase, refreshDashboard, refreshFeed]);

  if (identity.phase === "checking") {
    return (
      <main className="boot-state" aria-live="polite">
        <div className="wordmark" aria-label="IDS Pulse">
          <span className="wordmark-ids">IDS</span>
          <span className="wordmark-pulse">PULSE</span>
        </div>
        <p>Verifying secure access</p>
      </main>
    );
  }

  if (identity.phase === "signed_out") {
    return (
      <SignIn
        onSubmit={async (email, password) => {
          const user = await signInWithPassword(viewerClient, email, password);
          setIdentity({ phase: "signed_in", user });
        }}
      />
    );
  }

  const selectedIncident = incidents.find((incident) => incident.id === selectedId) ?? null;
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="wordmark wordmark-light" aria-label="IDS Pulse">
            <span className="wordmark-ids">IDS</span>
            <span className="wordmark-pulse">PULSE</span>
          </div>
          <span className="header-divider" aria-hidden="true" />
          <div>
            <strong>Incident Evidence</strong>
            <span>Staging workspace</span>
          </div>
        </div>
        <div className="header-actions">
          <div className="identity-copy">
            <span>Verified Supabase Auth identity</span>
            <strong>{identity.user.email ?? identity.user.id}</strong>
          </div>
          <button
            className="button button-header"
            type="button"
            onClick={() => void viewerClient.auth.signOut({ scope: "local" })}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="workspace">
        <IncidentList
          incidents={incidents}
          selectedId={selectedId}
          loading={loadingFeed}
          onSelect={setSelectedId}
        />
        <main className="workspace-main">
          <div className="workspace-toolbar">
            <div aria-live="polite">
              {loadingFeed ? "Refreshing released incidents" : "Released Incident feed is current"}
            </div>
            <button
              className="button button-secondary button-compact"
              type="button"
              disabled={loadingFeed}
              onClick={() => void refreshDashboard()}
            >
              Refresh
            </button>
          </div>
          {feedError ? (
            <div className="alert alert-error workspace-alert" role="alert">
              <span>{feedError}</span>
              <button
                className="button button-secondary button-compact"
                type="button"
                onClick={() => void refreshDashboard()}
              >
                Try again
              </button>
            </div>
          ) : null}
          {selectedIncident ? (
            <IncidentDetail
              client={viewerClient}
              incident={selectedIncident}
              evidenceRefreshRevision={evidenceRefreshRevision}
            />
          ) : (
            <section className="empty-detail" aria-live="polite">
              <p className="eyebrow">Incident evidence</p>
              <h1>No Incident selected</h1>
              <p>
                A released Incident will appear here only when database policy authorizes this
                authenticated account.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
