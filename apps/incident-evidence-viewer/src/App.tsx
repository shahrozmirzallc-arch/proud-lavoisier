import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { DashboardNavigation } from "./components/DashboardNavigation";
import { DashboardView } from "./components/DashboardView";
import { RepFilter } from "./components/RepFilter";
import { SignIn } from "./components/SignIn";
import { availableDashboardSections, shouldQueryClientOvertime } from "./dashboardModel";
import {
  fetchClientOvertimeReviewFeed,
  fetchDashboardFeed,
  fetchDashboardSnapshot,
  getAuthoritativeUser,
  signInWithPassword,
  subscribeToIncidentDashboard,
  viewerClient,
} from "./data/viewerApi";
import { invalidateSessionBeforeRecheck } from "./security/sessionBoundary";
import type {
  ClientOvertimeFeed,
  DashboardActor,
  DashboardFeedPage,
  DashboardItemAuthor,
  DashboardSection,
} from "./types";

type IdentityState =
  | { phase: "checking"; user: null }
  | { phase: "signed_out"; user: null }
  | { phase: "signed_in"; user: User };

interface DashboardSnapshot {
  userId: string;
  contractVersion: 1 | 2;
  repFilter: string | null;
  serverTimestamp: string;
  actor: DashboardActor;
  feed: DashboardFeedPage;
}

const PAGE_SIZE = 50;

function messageFrom(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

function mergeAuthors(
  current: DashboardItemAuthor[],
  feed: DashboardFeedPage,
): DashboardItemAuthor[] {
  const byId = new Map(current.map((author) => [author.id, author]));
  for (const item of feed.items) {
    if (item.author) byId.set(item.author.id, item.author);
  }
  return [...byId.values()].sort((left, right) => (
    left.displayName.localeCompare(right.displayName) || left.id.localeCompare(right.id)
  ));
}

export default function App() {
  const [identity, setIdentity] = useState<IdentityState>({ phase: "checking", user: null });
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [overtime, setOvertime] = useState<ClientOvertimeFeed | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [selectedUrgentId, setSelectedUrgentId] = useState<string | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [knownAuthors, setKnownAuthors] = useState<DashboardItemAuthor[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreOvertime, setLoadingMoreOvertime] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [overtimeError, setOvertimeError] = useState<string | null>(null);
  const [overtimeLoadMoreError, setOvertimeLoadMoreError] = useState<string | null>(null);
  const [evidenceRefreshRevision, setEvidenceRefreshRevision] = useState(0);
  const identityRequest = useRef(0);
  const dashboardRequest = useRef(0);
  const pageRequest = useRef(0);
  const overtimeRequest = useRef(0);
  const selectedRepRef = useRef<string | null>(null);

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
      invalidateSessionBeforeRecheck({
        generations: [
          identityRequest,
          dashboardRequest,
          pageRequest,
          overtimeRequest,
        ],
        clearIdentity: () => setIdentity({ phase: "checking", user: null }),
        clearAuthorizedView: () => {
          setSnapshot(null);
          setOvertime(null);
          setActiveSection("overview");
          setSelectedUrgentId(null);
          setSelectedRepId(null);
          selectedRepRef.current = null;
          setKnownAuthors([]);
          setLoadingDashboard(false);
          setLoadingMore(false);
          setLoadingMoreOvertime(false);
          setDashboardError(null);
          setLoadMoreError(null);
          setOvertimeError(null);
          setOvertimeLoadMoreError(null);
        },
        scheduleAuthoritativeRecheck: () => {
          window.setTimeout(() => void verifyIdentity(), 0);
        },
      });
    });
    return () => data.subscription.unsubscribe();
  }, [verifyIdentity]);

  const loadOvertime = useCallback(async (
    currentActor: DashboardActor,
    dashboardGeneration: number,
  ) => {
    if (!shouldQueryClientOvertime(currentActor.capabilities)) {
      overtimeRequest.current += 1;
      setOvertime(null);
      setOvertimeError(null);
      setOvertimeLoadMoreError(null);
      return;
    }
    const request = overtimeRequest.current + 1;
    overtimeRequest.current = request;
    setOvertime(null);
    setOvertimeError(null);
    setOvertimeLoadMoreError(null);
    try {
      const nextOvertime = await fetchClientOvertimeReviewFeed(
        viewerClient,
        PAGE_SIZE,
        null,
      );
      if (
        overtimeRequest.current === request &&
        dashboardRequest.current === dashboardGeneration
      ) {
        setOvertime(nextOvertime);
      }
    } catch (reason) {
      if (
        overtimeRequest.current === request &&
        dashboardRequest.current === dashboardGeneration
      ) {
        setOvertime(null);
        setOvertimeError(messageFrom(reason, "Pending overtime could not be loaded."));
      }
    }
  }, []);

  const loadDashboard = useCallback(async (userId: string, repFilter: string | null) => {
    const request = dashboardRequest.current + 1;
    dashboardRequest.current = request;
    pageRequest.current += 1;
    overtimeRequest.current += 1;

    // Never render a new actor against a feed authorized for an earlier snapshot.
    setSnapshot(null);
    setOvertime(null);
    setSelectedUrgentId(null);
    setLoadingDashboard(true);
    setLoadingMore(false);
    setLoadingMoreOvertime(false);
    setDashboardError(null);
    setLoadMoreError(null);
    setOvertimeError(null);
    setOvertimeLoadMoreError(null);

    try {
      const nextSnapshot = await fetchDashboardSnapshot(
        viewerClient,
        PAGE_SIZE,
        null,
        repFilter,
      );
      if (dashboardRequest.current !== request) return;
      const { actor: nextActor, feed: nextFeed } = nextSnapshot;

      // The combined RPC and this commit preserve one database/Auth snapshot.
      setSnapshot({
        userId,
        contractVersion: nextSnapshot.contractVersion,
        repFilter: nextSnapshot.repFilter,
        serverTimestamp: nextSnapshot.serverTimestamp,
        actor: nextActor,
        feed: nextFeed,
      });
      setKnownAuthors((current) => mergeAuthors(current, nextFeed));
      setActiveSection((current) => (
        availableDashboardSections(nextActor.capabilities).some(
          (section) => section.id === current,
        ) ? current : "overview"
      ));
      setSelectedUrgentId(
        nextFeed.items.find((item) => item.kind === "urgent_incident")?.entityId ?? null,
      );
      void loadOvertime(nextActor, request);
    } catch (reason) {
      if (dashboardRequest.current === request) {
        setDashboardError(messageFrom(reason, "The authorized dashboard could not be loaded."));
      }
    } finally {
      if (dashboardRequest.current === request) setLoadingDashboard(false);
    }
  }, [loadOvertime]);

  const refreshDashboard = useCallback((userId: string, repFilter: string | null) => {
    setEvidenceRefreshRevision((current) => current + 1);
    return loadDashboard(userId, repFilter);
  }, [loadDashboard]);

  const loadMore = useCallback(async (currentSnapshot: DashboardSnapshot) => {
    const { feed, userId } = currentSnapshot;
    if (!feed.hasMore || !feed.nextCursor || loadingMore) return;
    const request = pageRequest.current + 1;
    const dashboardGeneration = dashboardRequest.current;
    pageRequest.current = request;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchDashboardFeed(
        viewerClient,
        PAGE_SIZE,
        feed.nextCursor,
        currentSnapshot.repFilter,
        currentSnapshot.actor,
      );
      if (page.contractVersion !== currentSnapshot.contractVersion) {
        throw new Error("The next dashboard page changed contract version.");
      }
      if (
        pageRequest.current !== request ||
        dashboardRequest.current !== dashboardGeneration
      ) return;
      setSnapshot((current) => {
        if (!current || current.userId !== userId) return current;
        const known = new Set(current.feed.items.map(
          (item) => `${item.kind}:${item.entityId}`,
        ));
        const additions = page.items.filter(
          (item) => !known.has(`${item.kind}:${item.entityId}`),
        );
        return {
          ...current,
          feed: {
            contractVersion: page.contractVersion,
            repFilter: page.repFilter,
            serverTimestamp: page.serverTimestamp,
            hasMore: page.hasMore,
            nextCursor: page.nextCursor,
            items: [...current.feed.items, ...additions],
          },
        };
      });
      setSelectedUrgentId((current) => current ?? (
        page.items.find((item) => item.kind === "urgent_incident")?.entityId ?? null
      ));
      setKnownAuthors((current) => mergeAuthors(current, page));
    } catch (reason) {
      if (
        pageRequest.current === request &&
        dashboardRequest.current === dashboardGeneration
      ) {
        setLoadMoreError(messageFrom(reason, "The next authorized page could not be loaded."));
      }
    } finally {
      if (pageRequest.current === request) setLoadingMore(false);
    }
  }, [loadingMore]);

  const loadMoreOvertimePage = useCallback(async (
    currentOvertime: ClientOvertimeFeed,
    currentSnapshot: DashboardSnapshot,
  ) => {
    if (
      !shouldQueryClientOvertime(currentSnapshot.actor.capabilities) ||
      !currentOvertime.hasMore ||
      !currentOvertime.nextCursor ||
      loadingMoreOvertime
    ) return;
    const request = overtimeRequest.current + 1;
    const dashboardGeneration = dashboardRequest.current;
    overtimeRequest.current = request;
    setLoadingMoreOvertime(true);
    setOvertimeLoadMoreError(null);
    try {
      const page = await fetchClientOvertimeReviewFeed(
        viewerClient,
        PAGE_SIZE,
        currentOvertime.nextCursor,
      );
      if (
        overtimeRequest.current !== request ||
        dashboardRequest.current !== dashboardGeneration
      ) return;
      setOvertime((current) => {
        if (!current) return null;
        const known = new Set(current.items.map((item) => item.overtimeEntryId));
        return {
          serverTimestamp: page.serverTimestamp,
          hasMore: page.hasMore,
          nextCursor: page.nextCursor,
          items: [
            ...current.items,
            ...page.items.filter((item) => !known.has(item.overtimeEntryId)),
          ],
        };
      });
    } catch (reason) {
      if (
        overtimeRequest.current === request &&
        dashboardRequest.current === dashboardGeneration
      ) {
        setOvertimeLoadMoreError(messageFrom(reason, "The next overtime page could not be loaded."));
      }
    } finally {
      if (overtimeRequest.current === request) setLoadingMoreOvertime(false);
    }
  }, [loadingMoreOvertime]);

  const authenticatedUserId = identity.phase === "signed_in" ? identity.user.id : null;

  useEffect(() => {
    dashboardRequest.current += 1;
    pageRequest.current += 1;
    overtimeRequest.current += 1;
    setSnapshot(null);
    setOvertime(null);
    setDashboardError(null);
    setLoadMoreError(null);
    setOvertimeError(null);
    setOvertimeLoadMoreError(null);
    setSelectedUrgentId(null);
    setSelectedRepId(null);
    selectedRepRef.current = null;
    setKnownAuthors([]);
    setActiveSection("overview");

    if (!authenticatedUserId) return;
    void loadDashboard(authenticatedUserId, null);
    const channel = subscribeToIncidentDashboard(viewerClient, () => {
      void refreshDashboard(authenticatedUserId, selectedRepRef.current);
    });
    return () => {
      dashboardRequest.current += 1;
      pageRequest.current += 1;
      overtimeRequest.current += 1;
      void viewerClient.removeChannel(channel);
    };
  }, [authenticatedUserId, loadDashboard, refreshDashboard]);

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

  // This render-time key prevents even a one-frame account-switch leak before effects run.
  const currentSnapshot = snapshot?.userId === identity.user.id ? snapshot : null;
  const actor = currentSnapshot?.actor ?? null;
  const feed = currentSnapshot?.feed ?? null;

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
            <strong>Mobile Operations</strong>
            <span>Staging · read-only</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="button button-header"
            type="button"
            disabled={loadingDashboard}
            onClick={() => void refreshDashboard(identity.user.id, selectedRepId)}
          >
            {loadingDashboard ? "Refreshing" : "Refresh"}
          </button>
          <div className="identity-copy">
            <span>{actor?.roleLabel ?? "Verified Supabase Auth identity"}</span>
            <strong>{identity.user.email ?? "Verified account"}</strong>
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

      {!actor || !feed || !currentSnapshot ? (
        <main className="dashboard-gate" aria-live="polite">
          {dashboardError ? (
            <div className="gate-card">
              <p className="eyebrow">Server authorization</p>
              <h1>Dashboard access unavailable</h1>
              <p>{dashboardError}</p>
              <div className="gate-actions">
                <button className="button button-primary" type="button" onClick={() => void loadDashboard(identity.user.id, selectedRepId)}>Try again</button>
                {selectedRepId !== null ? (
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => {
                      setSelectedRepId(null);
                      selectedRepRef.current = null;
                      void loadDashboard(identity.user.id, null);
                    }}
                  >
                    Show all IDS Reps
                  </button>
                ) : null}
                <button className="button button-secondary" type="button" onClick={() => void viewerClient.auth.signOut({ scope: "local" })}>Use another account</button>
              </div>
            </div>
          ) : (
            <div className="gate-card">
              <p className="eyebrow">Server authorization</p>
              <h1>Building your workspace</h1>
              <p>Loading one atomic actor-and-record snapshot for this verified account.</p>
            </div>
          )}
        </main>
      ) : (
        <div className="dashboard-workspace">
          <DashboardNavigation
            actor={actor}
            activeSection={activeSection}
            feedItems={feed.items}
            overtime={overtime}
            onSelect={setActiveSection}
          />
          <div className="dashboard-content">
            {currentSnapshot.contractVersion === 2 && activeSection !== "overtime" ? (
              <RepFilter
                authors={knownAuthors}
                value={selectedRepId}
                disabled={loadingDashboard}
                onChange={(nextRepId) => {
                  setSelectedRepId(nextRepId);
                  selectedRepRef.current = nextRepId;
                  void loadDashboard(identity.user.id, nextRepId);
                }}
              />
            ) : null}
            <DashboardView
              client={viewerClient}
              actor={actor}
              section={activeSection}
              feed={feed}
              overtime={overtime}
              overtimeError={overtimeError}
              overtimeLoadMoreError={overtimeLoadMoreError}
              selectedUrgentId={selectedUrgentId}
              evidenceRefreshRevision={evidenceRefreshRevision}
              loadingMore={loadingMore}
              loadingMoreOvertime={loadingMoreOvertime}
              loadMoreError={loadMoreError}
              onSelectUrgent={setSelectedUrgentId}
              onLoadMore={() => void loadMore(currentSnapshot)}
              onRetryOvertime={() => void loadOvertime(actor, dashboardRequest.current)}
              onLoadMoreOvertime={() => {
                if (overtime) void loadMoreOvertimePage(overtime, currentSnapshot);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
