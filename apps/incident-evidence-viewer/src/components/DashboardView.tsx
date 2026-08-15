import type { ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canMountIncidentEvidence,
  configurationAttentionItems,
  feedItemIsVisible,
  sectionForFeedItem,
} from "../dashboardModel";
import type {
  ClientOvertimeFeed,
  DashboardActor,
  DashboardFeedItem,
  DashboardFeedItemOfKind,
  DashboardFeedPage,
  DashboardSection,
  LegacyQualitySourceDetails,
  ReworkDetails,
  RoutineInspectionDetails,
} from "../types";
import { EvidencePanel } from "./EvidencePanel";

interface DashboardViewProps {
  client: SupabaseClient;
  actor: DashboardActor;
  section: DashboardSection;
  feed: DashboardFeedPage;
  overtime: ClientOvertimeFeed | null;
  overtimeError: string | null;
  overtimeLoadMoreError: string | null;
  selectedUrgentId: string | null;
  evidenceRefreshRevision: number;
  loadingMore: boolean;
  loadingMoreOvertime: boolean;
  loadMoreError: string | null;
  onSelectUrgent: (entityId: string) => void;
  onLoadMore: () => void;
  onRetryOvertime: () => void;
  onLoadMoreOvertime: () => void;
}

type UrgentItem = DashboardFeedItemOfKind<"urgent_incident">;
type DailyItem = DashboardFeedItemOfKind<"daily_report">;

const KIND_LABELS: Readonly<Record<DashboardFeedItem["kind"], string>> = {
  routine_inspection: "Routine inspection",
  rework: "Rework",
  urgent_incident: "Urgent Incident",
  daily_report: "Daily report",
  hours: "Hours",
  expense: "Expense",
};
const INTERNAL_EVIDENCE_ROLE_LABELS = new Set<DashboardActor["roleLabel"]>([
  "IDS Rep",
  "IDS Office",
  "IDS Office & Finance",
]);

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});
const workDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeZone: "UTC",
});
const numberFormatter = new Intl.NumberFormat();
const hoursFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function formatWorkDate(value: string): string {
  return workDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatNumber(value: number | null, suffix = ""): string {
  return value === null ? "Not provided" : `${numberFormatter.format(value)}${suffix}`;
}

function formatHours(value: number): string {
  return `${hoursFormatter.format(value)} h`;
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${hoursFormatter.format(amount)}`;
  }
}

function display(value: string | null): string {
  return value ?? "Not provided";
}

function stateLabel(value: string | null): string {
  return value === null ? "Not provided" : value.replaceAll("_", " ");
}

function businessState(value: string | null): string {
  return value === null ? "Not provided" : stateLabel(value);
}

function RecordHeader({ item }: { item: DashboardFeedItem }) {
  return (
    <header className="record-card-header">
      <div>
        <span className="record-kind">{KIND_LABELS[item.kind]}</span>
        <h3>{item.title}</h3>
      </div>
      <span className="status-chip">{stateLabel(item.state)}</span>
    </header>
  );
}

function RecordContext({ item }: { item: DashboardFeedItem }) {
  return (
    <div className="record-context">
      <span>Record {item.entityId}</span>
      <span>Project {item.projectId}</span>
      <span>Assignment {item.assignmentId ?? "Not assigned"}</span>
      <span>Work date {formatWorkDate(item.workDate)}</span>
      <time dateTime={item.recordedAt}>Recorded {formatDateTime(item.recordedAt)}</time>
      {item.author ? <span>IDS author {item.author.displayName}</span> : null}
    </div>
  );
}

function DetailGrid({ rows }: { rows: Array<{ label: string; value: ReactNode }> }) {
  return (
    <dl className="dashboard-detail-grid">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ValueList({ values }: { values: string[] }) {
  return values.length > 0 ? (
    <ol className="field-value-list">
      {values.map((value, index) => <li key={`${index}:${value}`}>{value}</li>)}
    </ol>
  ) : <span>None provided</span>;
}

function NarrativeField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="narrative-block">
      <strong>{label}</strong>
      <p>{value ?? "Not provided"}</p>
    </div>
  );
}

function EmptySection({ noun, hasMore }: { noun: string; hasMore: boolean }) {
  return (
    <div className="dashboard-empty" aria-live="polite">
      <strong>No {noun} in the loaded records</strong>
      <span>
        {hasMore
          ? "More authorized records are available. Load the next page to continue checking."
          : "The server returned no authorized records for this section."}
      </span>
    </div>
  );
}

function FeedFooter({
  feed,
  loading,
  error,
  onLoadMore,
}: {
  feed: DashboardFeedPage;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
}) {
  return (
    <footer className="feed-footer">
      <span>
        Snapshot from <time dateTime={feed.serverTimestamp}>{formatDateTime(feed.serverTimestamp)}</time>
      </span>
      {error ? <span className="inline-error" role="alert">{error}</span> : null}
      {feed.hasMore ? (
        <button className="button button-secondary" type="button" disabled={loading} onClick={onLoadMore}>
          {loading ? "Loading next page" : error ? "Retry next page" : "Load more records"}
        </button>
      ) : (
        <span className="feed-end">End of authorized feed</span>
      )}
    </footer>
  );
}

function SectionHeading({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="dashboard-section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{detail}</p>
    </div>
  );
}

function Overview({ actor, feed }: { actor: DashboardActor; feed: DashboardFeedPage }) {
  const visible = feed.items.filter((item) => feedItemIsVisible(item, actor.capabilities));
  const metrics = [
    actor.capabilities.qualitySources
      ? { label: "Quality sources", value: visible.filter((item) => sectionForFeedItem(item) === "quality").length }
      : null,
    actor.capabilities.incidentCore
      ? { label: "Urgent Incidents", value: visible.filter((item) => item.kind === "urgent_incident").length }
      : null,
    actor.capabilities.dailyReports
      ? { label: "Daily reports", value: visible.filter((item) => item.kind === "daily_report").length }
      : null,
    actor.capabilities.hours
      ? { label: "Hours submissions", value: visible.filter((item) => item.kind === "hours").length }
      : null,
    actor.capabilities.expenses
      ? { label: "Expense records", value: visible.filter((item) => item.kind === "expense").length }
      : null,
  ].filter((metric): metric is { label: string; value: number } => metric !== null);

  return (
    <>
      <section className="overview-hero">
        <div>
          <p className="eyebrow eyebrow-light">IDS Pulse · read-only operations</p>
          <h1>Good day, {actor.displayName}</h1>
          <p>
            Your workspace is assembled from live server capabilities for <strong>{actor.roleLabel}</strong>.
            Counts below describe records loaded in this browser, not unqueried pages.
          </p>
        </div>
        <div className="snapshot-stamp">
          <span>Server snapshot</span>
          <time dateTime={feed.serverTimestamp}>{formatDateTime(feed.serverTimestamp)}</time>
        </div>
      </section>
      <section className="metric-grid" aria-label="Loaded authorized record counts">
        {metrics.length > 0 ? metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <small>loaded</small>
          </article>
        )) : (
          <div className="dashboard-empty">
            <strong>No operational feed sections enabled</strong>
            <span>This account is authenticated, but the server did not grant a record capability.</span>
          </div>
        )}
      </section>
      <section className="boundary-panel">
        <div>
          <span className="boundary-index">01</span>
          <div><strong>Identity</strong><span>Verified with Supabase Auth getUser.</span></div>
        </div>
        <div>
          <span className="boundary-index">02</span>
          <div><strong>Capabilities</strong><span>Used to render sections, never to replace server authorization.</span></div>
        </div>
        <div>
          <span className="boundary-index">03</span>
          <div><strong>Records</strong><span>Returned by SECURITY INVOKER RPCs under database policy.</span></div>
        </div>
      </section>
    </>
  );
}

function DeliveryFields({
  details,
}: {
  details: LegacyQualitySourceDetails | RoutineInspectionDetails | ReworkDetails;
}) {
  return (
    <DetailGrid rows={[
      { label: "Record delivery", value: stateLabel(details.recordDelivery) },
      { label: "Dashboard delivery", value: stateLabel(details.dashboardDelivery) },
      { label: "Email delivery", value: stateLabel(details.emailDelivery) },
    ]} />
  );
}

function QualityDetails({
  kind,
  details,
}: {
  kind: "routine_inspection" | "rework";
  details: LegacyQualitySourceDetails | RoutineInspectionDetails | ReworkDetails;
}) {
  if (details.contractVersion === "legacy") {
    return (
      <>
        <DetailGrid rows={[
          { label: "Part", value: display(details.partId) },
          { label: "Quantity", value: formatNumber(details.quantity) },
          { label: "Time spent", value: formatNumber(details.timeSpentMinutes, " min") },
        ]} />
        <DeliveryFields details={details} />
        <div className="contract-note">
          <strong>Legacy source projection</strong>
          <span>The server did not provide the complete form-field contract for this record.</span>
        </div>
      </>
    );
  }
  if (kind === "routine_inspection" && "quantityInspected" in details) {
    return (
      <>
        <DetailGrid rows={[
          { label: "Part number", value: details.partNumber },
          {
            label: "BIN / container labels",
            value: <ValueList values={details.containerLabels} />,
          },
          { label: "Traceability", value: display(details.traceability) },
          { label: "Quantity inspected", value: formatNumber(details.quantityInspected) },
          { label: "Quantity passed", value: formatNumber(details.quantityPassed) },
          { label: "Quantity rejected", value: formatNumber(details.quantityRejected) },
          { label: "Result code", value: stateLabel(details.resultCode) },
          { label: "Resolved result", value: details.resultValue },
        ]} />
        <NarrativeField label="Inspection notes" value={details.notes} />
        <DeliveryFields details={details} />
      </>
    );
  }
  if (kind === "rework" && "reworkTypeCode" in details) {
    return (
      <>
        <DetailGrid rows={[
          { label: "Part number", value: display(details.partNumber) },
          {
            label: "BIN / container labels",
            value: <ValueList values={details.containerLabels} />,
          },
          { label: "Quantity reworked", value: formatNumber(details.quantityReworked) },
          { label: "Time spent", value: formatNumber(details.timeSpentMinutes, " min") },
          { label: "Rework type code", value: businessState(details.reworkTypeCode) },
          { label: "Resolved rework type", value: display(details.reworkTypeValue) },
          { label: "Custom rework type", value: display(details.reworkTypeOther) },
          {
            label: "Returned to production",
            value: businessState(details.returnedToProduction),
          },
        ]} />
        <NarrativeField label="Work completed" value={details.workCompleted} />
        <DeliveryFields details={details} />
      </>
    );
  }
  return <div className="alert alert-error" role="alert">Quality details do not match their record kind.</div>;
}

function QualityRecords({ items, hasMore }: { items: DashboardFeedItem[]; hasMore: boolean }) {
  const quality = items.filter(
    (item): item is DashboardFeedItemOfKind<"routine_inspection" | "rework"> =>
      item.kind === "routine_inspection" || item.kind === "rework",
  );
  return quality.length > 0 ? (
    <div className="record-stack">
      {quality.map((item) => (
        <article className="record-card" key={`${item.kind}:${item.entityId}`}>
          <RecordHeader item={item} />
          <RecordContext item={item} />
          <NarrativeField label="Summary" value={item.summary} />
          <QualityDetails kind={item.kind} details={item.details} />
        </article>
      ))}
    </div>
  ) : <EmptySection noun="Quality source records" hasMore={hasMore} />;
}

function UrgentRecords({
  client,
  actor,
  items,
  hasMore,
  selectedId,
  evidenceRefreshRevision,
  onSelect,
}: {
  client: SupabaseClient;
  actor: DashboardActor;
  items: DashboardFeedItem[];
  hasMore: boolean;
  selectedId: string | null;
  evidenceRefreshRevision: number;
  onSelect: (entityId: string) => void;
}) {
  const incidents = items.filter((item): item is UrgentItem => item.kind === "urgent_incident");
  if (incidents.length === 0) return <EmptySection noun="Urgent Incidents" hasMore={hasMore} />;
  const selected = incidents.find((item) => item.entityId === selectedId) ?? incidents[0]!;
  const evidenceAllowed = canMountIncidentEvidence(actor.capabilities, selected);
  return (
    <div className="urgent-layout">
      <div className="urgent-index" aria-label="Loaded Urgent Incidents">
        {incidents.map((incident) => (
          <button
            className={incident.entityId === selected.entityId ? "urgent-index-item is-active" : "urgent-index-item"}
            type="button"
            key={incident.entityId}
            onClick={() => onSelect(incident.entityId)}
          >
            <span>{incident.title}</span>
            <small>{formatWorkDate(incident.workDate)} · {stateLabel(incident.state)}</small>
          </button>
        ))}
      </div>
      <div className="urgent-detail">
        <article className="record-card record-card-featured">
          <RecordHeader item={selected} />
          <RecordContext item={selected} />
          <NarrativeField label="Incident summary" value={selected.summary} />
          <DetailGrid rows={[
            ...(selected.details.contractVersion === "complete" ? [
              {
                label: "Incident reference",
                value: selected.details.incidentReference ?? "Not provided",
              },
              { label: "Part number", value: display(selected.details.partNumber ?? null) },
              {
                label: "Part label values",
                value: <ValueList values={selected.details.partLabels ?? []} />,
              },
              {
                label: "Container label values",
                value: <ValueList values={selected.details.containerLabels ?? []} />,
              },
              {
                label: "Part label availability",
                value: selected.details.partLabelAvailability
                  ? stateLabel(selected.details.partLabelAvailability.status)
                  : "Legacy / Not provided",
              },
              {
                label: "Part label unavailable reason",
                value: display(selected.details.partLabelAvailability?.reason ?? null),
              },
              {
                label: "Container label availability",
                value: selected.details.containerLabelAvailability
                  ? stateLabel(selected.details.containerLabelAvailability.status)
                  : "Legacy / Not provided",
              },
              {
                label: "Container label unavailable reason",
                value: display(selected.details.containerLabelAvailability?.reason ?? null),
              },
              {
                label: "Traceability status",
                value: businessState(selected.details.traceabilityStatus ?? null),
              },
              {
                label: "Zero traceability confirmed",
                value: selected.details.zeroTraceabilityConfirmed ? "Yes" : "No",
              },
              {
                label: "Area code",
                value: businessState(selected.details.areaCode ?? null),
              },
              {
                label: "Resolved area value",
                value: display(selected.details.areaValue ?? null),
              },
              {
                label: "Concern code",
                value: businessState(selected.details.levelOfConcernCode ?? null),
              },
              {
                label: "Resolved concern value",
                value: display(selected.details.levelOfConcernValue ?? null),
              },
              {
                label: "Custom concern value",
                value: display(selected.details.levelOfConcernOther ?? null),
              },
              {
                label: "Return to supplier",
                value: businessState(selected.details.returnToSupplier ?? null),
              },
              {
                label: "Supplier sort requested",
                value: businessState(selected.details.sortRequested ?? null),
              },
              {
                label: "RMA required",
                value: businessState(selected.details.rmaRequired ?? null),
              },
              {
                label: "RMA number",
                value: selected.details.rmaNumber ?? "Not applicable",
              },
              {
                label: "Revision kind",
                value: businessState(selected.details.revisionKind ?? null),
              },
              {
                label: "Revision label",
                value: display(selected.details.revisionLabel ?? null),
              },
              {
                label: "Investigation status",
                value: businessState(selected.details.investigationStatus ?? null),
              },
              {
                label: "Investigation status label",
                value: display(selected.details.investigationStatusLabel ?? null),
              },
            ] : []),
            { label: "Part", value: display(selected.details.partId) },
            { label: "Defect", value: display(selected.details.defectType) },
            { label: "Area", value: display(selected.details.area) },
            { label: "Quantity", value: formatNumber(selected.details.quantity) },
            { label: "Concern", value: display(selected.details.levelOfConcern) },
            { label: "Revision", value: formatNumber(selected.details.revisionNumber) },
            { label: "Release", value: stateLabel(selected.details.releaseStatus) },
            { label: "Released to Client", value: selected.details.releasedToClient ? "Yes" : "No" },
            { label: "Record delivery", value: stateLabel(selected.details.recordDelivery) },
            { label: "Dashboard", value: stateLabel(selected.details.dashboardDelivery) },
            { label: "External delivery", value: stateLabel(selected.details.externalDelivery) },
            ...(selected.details.contractVersion === "legacy" ? [{
              label: "Admin attention",
              value: stateLabel(selected.details.adminAttention),
            }] : []),
            { label: "Evidence status", value: stateLabel(selected.details.mediaEvidenceStatus) },
            {
              label: "Evidence authorized",
              value: selected.details.evidenceAccessible ? "Yes" : "No",
            },
          ]} />
          {selected.details.contractVersion === "complete" ? (
            <>
              <NarrativeField label="Issue" value={selected.details.issue ?? null} />
              <NarrativeField
                label="Immediate action"
                value={selected.details.immediateAction ?? null}
              />
              <NarrativeField
                label="No-media reason"
                value={selected.details.noMediaReason ?? null}
              />
            </>
          ) : null}
          <NarrativeField label="Action taken" value={selected.details.actionTaken} />
          {selected.details.contractVersion === "legacy" ? (
            <>
              <NarrativeField
                label="External delivery message"
                value={selected.details.externalDeliveryMessage}
              />
              <div className="approval-fact">
                <strong>No Admin approval gate</strong>
                <span>Admin approval required: {selected.details.adminApprovalRequired ? "Yes" : "No"}. Urgent records are delivered immediately under server policy.</span>
              </div>
            </>
          ) : null}
        </article>
        {evidenceAllowed ? (
          <EvidencePanel
            client={client}
            incidentId={selected.entityId}
            refreshRevision={evidenceRefreshRevision}
            audience={INTERNAL_EVIDENCE_ROLE_LABELS.has(actor.roleLabel)
              ? "ids_internal"
              : "external_client"}
          />
        ) : (
          <section className="evidence-boundary-card">
            <strong>Core record only</strong>
            <span>
              {actor.capabilities.incidentEvidence
                ? "The server did not authorize evidence for this Incident. No evidence request was made."
                : "Private evidence actions are not enabled for this account. No evidence request was made."}
            </span>
          </section>
        )}
      </div>
    </div>
  );
}

function DailySourceCard({ source }: { source: DailyItem["details"]["sourceActivities"][number] }) {
  const urgent = source.recordKind === "urgent_incident";
  return (
    <article className="daily-source-card">
      <div className="subsection-heading">
        <div>
          <span>{urgent ? "Released Urgent reference" : "Attached Quality record"}</span>
          <strong>{source.title ?? "Not provided"}</strong>
        </div>
        <span className="status-chip">{KIND_LABELS[source.recordKind]}</span>
      </div>
      <DetailGrid rows={[
        { label: "Entity ID", value: source.entityId },
        ...(source.localRecordId === null ? [] : [{
          label: "Local record ID",
          value: source.localRecordId,
        }]),
        { label: "Occurred", value: formatDateTime(source.occurredAt) },
        { label: "Work date", value: formatWorkDate(source.workDate) },
        { label: "Reference only", value: source.referenceOnly ? "Yes" : "No" },
        {
          label: "Initial revision",
          value: source.initialRevisionNumber ?? "Not applicable",
        },
      ]} />
      <NarrativeField label="Source summary" value={source.summary} />
      {source.details ? (
        <QualityDetails
          kind={source.recordKind as "routine_inspection" | "rework"}
          details={source.details}
        />
      ) : urgent ? (
        <div className="contract-note">
          <strong>Released reference only</strong>
          <span>The Daily snapshot does not duplicate the Urgent Incident narrative or evidence.</span>
        </div>
      ) : (
        <div className="contract-note">
          <strong>Legacy source projection</strong>
          <span>The server did not provide the complete nested Quality form fields.</span>
        </div>
      )}
    </article>
  );
}

function CompleteDailyRecords({ items, hasMore }: { items: DashboardFeedItem[]; hasMore: boolean }) {
  const reports = items.filter((item): item is DailyItem => item.kind === "daily_report");
  return reports.length > 0 ? (
    <div className="record-stack">
      {reports.map((item) => {
        const hours = item.details.hoursSummary;
        return (
          <article className="record-card" key={item.entityId}>
            <RecordHeader item={item} />
            <RecordContext item={item} />
            <NarrativeField label="Summary" value={item.summary} />
            <div className="daily-summary-strip">
              <div><strong>{item.details.areasWalkedCount}</strong><span>area walks</span></div>
              <div><strong>{item.details.incidentsCount}</strong><span>released Urgent refs</span></div>
              <div><strong>{item.details.sourceActivities.length}</strong><span>source snapshots</span></div>
            </div>

            {item.details.contractVersion === "complete" ? (
              <>
                <section className="daily-composition-section">
                  <div className="subsection-heading">
                    <div><span>Walk-by-walk record</span><strong>Every reported area</strong></div>
                  </div>
                  <div className="daily-area-grid">
                    {(item.details.areaWalks ?? []).map((walk) => (
                      <article className="daily-area-card" key={walk.areaId}>
                        <div className="subsection-heading">
                          <div><span>Area {walk.areaId}</span><strong>{walk.areaName}</strong></div>
                          <span className="status-chip">{stateLabel(walk.status)}</span>
                        </div>
                        <DetailGrid rows={[
                          { label: "Visited", value: walk.visited ? "Yes" : "No" },
                          { label: "Spoke with", value: display(walk.spokeWith) },
                          { label: "Floor notes", value: display(walk.floorNotes) },
                          {
                            label: "Not visited reason",
                            value: walk.notVisitedReason ?? "Not applicable",
                          },
                        ]} />
                      </article>
                    ))}
                  </div>
                </section>
                <DetailGrid rows={[
                  {
                    label: "No issues reported",
                    value: item.details.noIssues ? "Yes" : "No",
                  },
                  {
                    label: "Outstanding issue",
                    value: stateLabel(item.details.outstandingIssue ?? null),
                  },
                  {
                    label: "Revision number",
                    value: item.details.revision?.number ?? "Not provided",
                  },
                  {
                    label: "Revision kind",
                    value: stateLabel(item.details.revision?.kind ?? null),
                  },
                  {
                    label: "Parent report",
                    value: item.details.revision?.parentReportId ?? "Not applicable",
                  },
                  {
                    label: "Amended at",
                    value: item.details.revision?.amendedAt
                      ? formatDateTime(item.details.revision.amendedAt)
                      : "Not applicable",
                  },
                ]} />
                <NarrativeField label="Final comments" value={item.details.finalComments ?? null} />
                <NarrativeField label="Handover note" value={item.details.handoverNote ?? null} />
                <NarrativeField label="Amendment reason" value={item.details.revision?.reason ?? null} />
              </>
            ) : (
              <div className="contract-note">
                <strong>Legacy Daily projection</strong>
                <span>The server did not provide area-walk, narrative, or revision fields for this row.</span>
              </div>
            )}

            <section className="hours-summary-card">
              <div className="subsection-heading">
                <div><span>Rate-free Hours rollup</span><strong>{hours.source}</strong></div>
                <span className="status-chip">{hours.selection}</span>
              </div>
              <DetailGrid rows={[
                { label: "Work date", value: formatWorkDate(hours.workDate) },
                { label: "Entries", value: hours.entryCount },
                { label: "Submissions", value: hours.submissionCount },
                { label: "Regular", value: formatHours(hours.regularHours) },
                { label: "Overtime", value: formatHours(hours.overtimeHours) },
                { label: "Total", value: formatHours(hours.totalHours) },
                { label: "OT pending review", value: formatHours(hours.overtimePendingReviewHours) },
              ]} />
            </section>
            <section className="source-snapshot">
              <div className="subsection-heading">
                <div><span>Immutable composition order</span><strong>All attached source cards</strong></div>
              </div>
              <div className="source-id-list">
                <strong>Source activity IDs</strong>
                {item.details.sourceActivityIds.length > 0 ? (
                  <ol>
                    {item.details.sourceActivityIds.map((id) => <li key={id}>{id}</li>)}
                  </ol>
                ) : <span>None</span>}
              </div>
              {item.details.sourceActivities.length > 0 ? (
                <div className="daily-source-stack">
                  {item.details.sourceActivities.map((source) => (
                    <DailySourceCard
                      key={`${source.recordKind}:${source.entityId}`}
                      source={source}
                    />
                  ))}
                </div>
              ) : <p>No source activities were included.</p>}
            </section>
            <DetailGrid rows={[
              { label: "Record delivery", value: stateLabel(item.details.recordDelivery) },
              { label: "Dashboard delivery", value: stateLabel(item.details.dashboardDelivery) },
              { label: "External delivery", value: stateLabel(item.details.externalDelivery) },
              ...(item.details.contractVersion === "legacy" ? [{
                label: "Admin attention",
                value: stateLabel(item.details.adminAttention),
              }] : []),
            ]} />
            {item.details.contractVersion === "legacy" ? (
              <NarrativeField
                label="External delivery message"
                value={item.details.externalDeliveryMessage}
              />
            ) : null}
            <div className="exclusion-note">
              <strong>Expense included: {item.details.expenseIncluded ? "Yes" : "No"}</strong>
              <span>Daily reports never include expense data or attachments.</span>
            </div>
            {item.details.contractVersion === "legacy" ? (
              <div className="approval-fact">
                <strong>Admin approval required: {item.details.adminApprovalRequired ? "Yes" : "No"}</strong>
                <span>Daily delivery does not wait for Admin approval.</span>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  ) : <EmptySection noun="Daily reports" hasMore={hasMore} />;
}

function HoursRecords({ items, hasMore }: { items: DashboardFeedItem[]; hasMore: boolean }) {
  const records = items.filter((item): item is DashboardFeedItemOfKind<"hours"> => item.kind === "hours");
  return records.length > 0 ? (
    <div className="record-stack">
      {records.map((item) => (
        <article className="record-card" key={item.entityId}>
          <RecordHeader item={item} />
          <RecordContext item={item} />
          <NarrativeField label="Summary" value={item.summary} />
          <div className="hours-total"><strong>{formatHours(item.details.reportedHours)}</strong><span>reported total</span></div>
          <DetailGrid rows={[
            { label: "Entries", value: item.details.entryCount },
            { label: "Regular", value: formatHours(item.details.regularHours) },
            { label: "Overtime", value: formatHours(item.details.overtimeHours) },
            { label: "Work type", value: display(item.details.workType) },
            { label: "Approval", value: stateLabel(item.details.approvalState) },
            { label: "Client review", value: stateLabel(item.details.clientReviewStatus) },
            { label: "Finance visibility", value: stateLabel(item.details.financeVisibility) },
            { label: "Record delivery", value: stateLabel(item.details.recordDelivery) },
            {
              label: "Financial processing",
              value: stateLabel(item.details.financialProcessingState),
            },
          ]} />
          <NarrativeField label="Work summary" value={item.details.workSummary} />
          <p className="processing-disclaimer">Financial processing is not evaluated in this mobile dashboard; use the authorized AG Finance workflow.</p>
        </article>
      ))}
    </div>
  ) : <EmptySection noun="Hours submissions" hasMore={hasMore} />;
}

function OvertimeRecords({
  overtime,
  error,
  loadMoreError,
  loadingMore,
  onRetry,
  onLoadMore,
}: {
  overtime: ClientOvertimeFeed | null;
  error: string | null;
  loadMoreError: string | null;
  loadingMore: boolean;
  onRetry: () => void;
  onLoadMore: () => void;
}) {
  if (error) {
    return <div className="alert alert-error workspace-alert" role="alert"><span>{error}</span><button className="button button-secondary button-compact" type="button" onClick={onRetry}>Try again</button></div>;
  }
  if (!overtime) return <div className="dashboard-empty"><strong>Loading pending overtime</strong><span>The authorized Client queue is being requested.</span></div>;
  if (overtime.items.length === 0) return <div className="dashboard-empty"><strong>No overtime pending review</strong><span>The server returned an empty authorized Client queue.</span></div>;
  return (
    <>
      <div className="record-stack">
        {overtime.items.map((item) => (
          <article className="record-card overtime-card" key={item.overtimeEntryId}>
            <div className="record-card-header">
              <div><span className="record-kind">Client overtime review</span><h3>{formatHours(item.overtimeHours)} pending</h3></div>
              <span className="status-chip">Pending</span>
            </div>
            <DetailGrid rows={[
              { label: "Project", value: item.projectId },
              { label: "Assignment", value: item.assignmentId },
              { label: "Work date", value: formatWorkDate(item.workDate) },
              { label: "Work type", value: display(item.workType) },
              { label: "Submitted", value: formatDateTime(item.submittedAt) },
            ]} />
            <NarrativeField label="Work summary" value={item.workSummary} />
          </article>
        ))}
      </div>
      <footer className="feed-footer">
        <span>Client queue snapshot: <time dateTime={overtime.serverTimestamp}>{formatDateTime(overtime.serverTimestamp)}</time>. Loaded rows span all assignments authorized for this Client account.</span>
        {loadMoreError ? <span className="inline-error" role="alert">{loadMoreError}</span> : null}
        {overtime.hasMore ? (
          <button className="button button-secondary" type="button" disabled={loadingMore} onClick={onLoadMore}>
            {loadingMore ? "Loading next OT page" : loadMoreError ? "Retry next OT page" : "Load more overtime"}
          </button>
        ) : <span className="feed-end">End of authorized OT queue</span>}
      </footer>
    </>
  );
}

function ExpenseRecords({ items, hasMore }: { items: DashboardFeedItem[]; hasMore: boolean }) {
  const records = items.filter((item): item is DashboardFeedItemOfKind<"expense"> => item.kind === "expense");
  return records.length > 0 ? (
    <div className="record-stack">
      {records.map((item) => (
        <article className="record-card" key={item.entityId}>
          <RecordHeader item={item} />
          <RecordContext item={item} />
          <NarrativeField label="Summary" value={item.summary} />
          <div className="expense-amount"><strong>{formatMoney(item.details.amount, item.details.currency)}</strong><span>{item.details.categoryValue}</span></div>
          <DetailGrid rows={[
            { label: "Amount", value: item.details.amount },
            { label: "Currency", value: item.details.currency },
            { label: "Category code", value: item.details.categoryCode },
            { label: "Category value", value: item.details.categoryValue },
            { label: "Custom category", value: display(item.details.categoryOther) },
            { label: "Mileage distance", value: item.details.mileageDistance ?? "Not provided" },
            { label: "Mileage unit", value: display(item.details.mileageUnit) },
            { label: "Attachment count", value: item.details.attachmentCount },
            { label: "Finance visibility", value: stateLabel(item.details.financeVisibility) },
            { label: "Record delivery", value: stateLabel(item.details.recordDelivery) },
          ]} />
          <NarrativeField label="Business reason" value={item.details.businessReason} />
          <div className="exclusion-note"><strong>Metadata only</strong><span>Attachment count is visible; files, paths, URLs, rates, and pay data are never returned here.</span></div>
        </article>
      ))}
    </div>
  ) : <EmptySection noun="Expense records" hasMore={hasMore} />;
}

function ConfigurationAttention({ items, hasMore }: { items: DashboardFeedItem[]; hasMore: boolean }) {
  const attention = configurationAttentionItems(items);
  return (
    <>
      <div className="configuration-notice">
        <strong>Capability enabled · record signals only</strong>
        <span>Dashboard v1 has no separate configuration reader. This queue shows only loaded Urgent and Daily records that require Client contact; normal and unknown states are omitted.</span>
      </div>
      {attention.length > 0 ? (
        <div className="record-stack">
          {attention.map((item) => (
            <article className="attention-card" key={`${item.kind}:${item.entityId}`}>
              <div><span>{KIND_LABELS[item.kind]}</span><strong>{item.title}</strong></div>
              <span className="status-chip">{stateLabel(item.details.adminAttention)}</span>
              <small>Recorded {formatDateTime(item.recordedAt)} · Project {item.projectId}</small>
            </article>
          ))}
        </div>
      ) : <EmptySection noun="Admin-attention signals" hasMore={hasMore} />}
    </>
  );
}

export function DashboardView(props: DashboardViewProps) {
  const feedFooter = props.section === "overtime" ? null : (
    <FeedFooter
      feed={props.feed}
      loading={props.loadingMore}
      error={props.loadMoreError}
      onLoadMore={props.onLoadMore}
    />
  );
  let content: ReactNode;
  switch (props.section) {
    case "overview":
      content = <><Overview actor={props.actor} feed={props.feed} />{feedFooter}</>;
      break;
    case "quality":
      content = <><SectionHeading eyebrow="Quality sources" title="Inspection and rework" detail="Sanitized source records returned for this account. Delivery states remain server-owned." /><QualityRecords items={props.feed.items} hasMore={props.feed.hasMore} />{feedFooter}</>;
      break;
    case "urgent":
      content = <><SectionHeading eyebrow="Urgent core" title="Immediate Incident delivery" detail="Core Incident records do not wait for Admin approval. Evidence mounts only when both the account and the selected Incident are authorized." /><UrgentRecords client={props.client} actor={props.actor} items={props.feed.items} hasMore={props.feed.hasMore} selectedId={props.selectedUrgentId} evidenceRefreshRevision={props.evidenceRefreshRevision} onSelect={props.onSelectUrgent} />{feedFooter}</>;
      break;
    case "daily":
      content = <><SectionHeading eyebrow="Daily reports" title="Daily operating record" detail="Each Daily includes every safe attached source card, the rate-free Hours rollup, and an explicit Expense exclusion." /><CompleteDailyRecords items={props.feed.items} hasMore={props.feed.hasMore} />{feedFooter}</>;
      break;
    case "hours":
      content = <><SectionHeading eyebrow="Hours" title="Logical Hours submissions" detail="One card represents one grouped mobile submission. Client review is shown without rates, pay, or employee directories." /><HoursRecords items={props.feed.items} hasMore={props.feed.hasMore} />{feedFooter}</>;
      break;
    case "overtime":
      content = <><SectionHeading eyebrow="Client review" title="Pending overtime" detail="This paginated server-authorized queue spans every assignment available to the signed-in billing Client account." /><OvertimeRecords overtime={props.overtime} error={props.overtimeError} loadMoreError={props.overtimeLoadMoreError} loadingMore={props.loadingMoreOvertime} onRetry={props.onRetryOvertime} onLoadMore={props.onLoadMoreOvertime} /></>;
      break;
    case "expenses":
      content = <><SectionHeading eyebrow="Finance" title="Expense metadata" detail="Amounts, category context, mileage, and attachment counts are visible. Raw files and private transport material stay outside this dashboard." /><ExpenseRecords items={props.feed.items} hasMore={props.feed.hasMore} />{feedFooter}</>;
      break;
    case "configuration":
      content = <><SectionHeading eyebrow="Office attention" title="Configuration signals" detail="A focused view of safe attention states already present on loaded operating records." /><ConfigurationAttention items={props.feed.items} hasMore={props.feed.hasMore} />{feedFooter}</>;
      break;
  }
  return <main className="dashboard-main">{content}</main>;
}
