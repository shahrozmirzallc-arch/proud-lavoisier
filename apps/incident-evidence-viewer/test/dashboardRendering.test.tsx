import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DashboardView } from "../src/components/DashboardView";
import {
  ClientEvidenceGroupCard,
  EvidenceMediaPreview,
} from "../src/components/EvidencePanel";
import { RepFilter } from "../src/components/RepFilter";
import type {
  ClientEvidenceAttachment,
  ClientEvidenceGroup,
  DashboardActor,
  DashboardFeedItem,
  DashboardFeedItemOfKind,
  DashboardFeedPage,
  DashboardSection,
  EvidenceAttachment,
  ReworkDetails,
  RoutineInspectionDetails,
} from "../src/types";

vi.mock("../src/data/viewerApi", () => ({
  fetchIncidentEvidence: vi.fn(),
  requestAttachmentAccess: vi.fn(),
}));

const client = {} as SupabaseClient;
const author = { id: "rep-render-1", displayName: "Morgan Render Author" };
const routine: RoutineInspectionDetails = {
  contractVersion: "complete",
  partNumber: "ROUTINE-PART-901",
  containerLabels: ["BIN-ROUTINE-901", "CONTAINER-ROUTINE-902"],
  traceability: null,
  quantityInspected: 17,
  quantityPassed: 15,
  quantityRejected: 2,
  resultCode: "other",
  resultValue: "Surface blemish under review",
  notes: "Routine notes remain fully visible across multiple lines.",
  recordDelivery: "server_confirmed",
  dashboardDelivery: "available",
  emailDelivery: null,
};
const rework: ReworkDetails = {
  contractVersion: "complete",
  partNumber: "REWORK-PART-902",
  containerLabels: ["BIN-REWORK-903"],
  quantityReworked: 4,
  timeSpentMinutes: 73,
  reworkTypeCode: "other",
  reworkTypeValue: "Hand-finish connector seat",
  reworkTypeOther: "Hand-finish connector seat",
  returnedToProduction: "unknown",
  workCompleted: "Deburred each seat and held the lot for final disposition.",
  recordDelivery: "server_confirmed",
  dashboardDelivery: "available",
  emailDelivery: "queued",
};

const common = {
  projectId: "PROJECT-RENDER-100",
  assignmentId: null,
  workDate: "2026-08-14",
  recordedAt: "2026-08-14T15:30:00.000Z",
  title: "Full field rendering fixture",
  summary: null,
  state: "server_confirmed",
  author,
};

const items: DashboardFeedItem[] = [
  {
    ...common,
    kind: "routine_inspection",
    entityId: "ROUTINE-RENDER-1",
    details: routine,
  },
  {
    ...common,
    kind: "rework",
    entityId: "REWORK-RENDER-1",
    details: rework,
  },
  {
    ...common,
    kind: "rework",
    entityId: "REWORK-RENDER-HISTORICAL",
    title: "Historical mobile Rework with explicit nulls",
      details: {
        contractVersion: "complete",
        partNumber: null,
        containerLabels: [],
        quantityReworked: null,
      timeSpentMinutes: 47,
      reworkTypeCode: null,
      reworkTypeValue: null,
      reworkTypeOther: null,
      returnedToProduction: null,
      workCompleted: null,
      recordDelivery: "server_confirmed",
      dashboardDelivery: "available",
      emailDelivery: null,
    },
  },
  {
    ...common,
    kind: "urgent_incident",
    entityId: "INC-0123456789abcdef0123456789abcdef",
    summary: "Urgent summary visible in full.",
    details: {
      contractVersion: "complete",
      incidentReference: "CLIENT-INCIDENT-REFERENCE-903",
      partId: "PART-ID-903",
      partNumber: null,
      partLabels: ["PART-LABEL-903", "PART-LABEL-904"],
      containerLabels: ["CONTAINER-LABEL-903"],
      partLabelAvailability: { status: "provided", reason: null },
      containerLabelAvailability: { status: "provided", reason: null },
      traceabilityStatus: "provided",
      zeroTraceabilityConfirmed: false,
      defectType: "Connector housing fracture",
      issue: "Connector housing fractured at the locking tab.",
      areaCode: "other",
      areaValue: "Final inspection station",
      area: "Final inspection station",
      quantity: 6,
      immediateAction: "Stopped the line and contained every suspect container.",
      actionTaken: "Stopped the line and contained every suspect container.",
      levelOfConcernCode: "high",
      levelOfConcernValue: "high",
      levelOfConcernOther: null,
      levelOfConcern: "high",
      returnToSupplier: "unknown",
      sortRequested: "yes",
      rmaRequired: "yes",
      rmaNumber: "RMA-903",
      noMediaReason: null,
      revisionNumber: 2,
      revisionKind: "preliminary",
      revisionLabel: "Preliminary Revision 2",
      investigationStatus: "in_progress",
      investigationStatusLabel: "In progress",
      releaseStatus: "released",
      releasedToClient: true,
      recordDelivery: "server_confirmed",
      dashboardDelivery: "available",
      externalDelivery: "sent",
      externalDeliveryMessage: null,
      adminAttention: null,
      adminApprovalRequired: false,
      mediaEvidenceStatus: "verified_private_storage",
      evidenceAccessible: true,
    },
  },
  {
    ...common,
    kind: "daily_report",
    entityId: "DAILY-RENDER-1",
    summary: "Daily summary visible in full.",
    details: {
      contractVersion: "complete",
      areasWalkedCount: 2,
      areaWalks: [
        {
          areaId: "install_area",
          areaName: "Install Area",
          status: "defect",
          visited: true,
          spokeWith: "Taylor Floor Lead",
          floorNotes: "Containment remained posted at the station.",
          notVisitedReason: null,
        },
        {
          areaId: "heavy_repair",
          areaName: "Heavy Repair",
          status: "not_visited",
          visited: false,
          spokeWith: null,
          floorNotes: null,
          notVisitedReason: "Area was closed for scheduled maintenance.",
        },
      ],
      incidentsCount: 1,
      sourceActivityIds: ["ROUTINE-SOURCE-1", "REWORK-SOURCE-1", "URGENT-SOURCE-1"],
      sourceActivities: [
        {
          recordKind: "routine_inspection",
          entityId: "ROUTINE-SOURCE-1",
          localRecordId: null,
          occurredAt: "2026-08-14T10:00:00.000Z",
          workDate: "2026-08-14",
          title: "Attached Routine source",
          summary: "Routine source summary is visible.",
          referenceOnly: false,
          initialRevisionNumber: null,
          details: routine,
        },
        {
          recordKind: "rework",
          entityId: "REWORK-SOURCE-1",
          localRecordId: null,
          occurredAt: "2026-08-14T11:00:00.000Z",
          workDate: "2026-08-14",
          title: "Attached Rework source",
          summary: "Rework source summary is visible.",
          referenceOnly: false,
          initialRevisionNumber: null,
          details: rework,
        },
        {
          recordKind: "urgent_incident",
          entityId: "URGENT-SOURCE-1",
          localRecordId: null,
          occurredAt: "2026-08-14T12:00:00.000Z",
          workDate: "2026-08-14",
          title: "Released Urgent source",
          summary: null,
          referenceOnly: true,
          initialRevisionNumber: 1,
        },
      ],
      hoursSummary: {
        source: "server_time_entries_effective_projections",
        selection: "latest_logical_submission",
        workDate: "2026-08-14",
        entryCount: 3,
        submissionCount: 2,
        regularHours: 8,
        overtimeHours: 1.25,
        totalHours: 9.25,
        overtimePendingReviewHours: 1.25,
      },
      expenseIncluded: false,
      recordDelivery: "server_confirmed",
      dashboardDelivery: "available",
      externalDelivery: "sent",
      externalDeliveryMessage: null,
      adminAttention: null,
      adminApprovalRequired: false,
      finalComments: null,
      outstandingIssue: "yes",
      handoverNote: "Confirm disposition before the next shift starts.",
      revision: {
        number: 2,
        kind: "amendment",
        parentReportId: "DAILY-RENDER-V1",
        reason: "Corrected the handover details.",
        amendedAt: "2026-08-14T16:00:00.000Z",
      },
      noIssues: false,
    },
  },
  {
    ...common,
    kind: "hours",
    entityId: "HOURS-RENDER-1",
    summary: "Hours card summary remains visible.",
    details: {
      entryCount: 3,
      reportedHours: 9.25,
      regularHours: 8,
      overtimeHours: 1.25,
      workType: null,
      workSummary: null,
      approvalState: "client_pending",
      clientReviewStatus: "pending",
      recordDelivery: "server_confirmed",
      financeVisibility: "available",
      financialProcessingState: "not_evaluated_requires_ag_finance_workflow",
    },
  },
  {
    ...common,
    kind: "expense",
    entityId: "EXPENSE-RENDER-1",
    summary: "Expense summary remains visible.",
    details: {
      categoryCode: "other",
      categoryValue: "Secure parking",
      categoryOther: "Night shift lot",
      amount: 23.75,
      currency: "CAD",
      businessReason: null,
      mileageDistance: null,
      mileageUnit: null,
      attachmentCount: 2,
      recordDelivery: "server_confirmed",
      financeVisibility: "available",
    },
  },
];

const actor: DashboardActor = {
  displayName: "Admin Render Reviewer",
  role: "admin",
  roleLabel: "IDS Office & Finance",
  serverTimestamp: "2026-08-14T15:30:00.000Z",
  capabilities: {
    qualitySources: true,
    incidentCore: true,
    incidentEvidence: true,
    dailyReports: true,
    hours: true,
    clientOvertimeReview: false,
    expenses: true,
    financeEvidence: true,
    configurationAttention: false,
  },
};
const feed: DashboardFeedPage = {
  contractVersion: 2,
  repFilter: null,
  serverTimestamp: actor.serverTimestamp,
  hasMore: false,
  nextCursor: null,
  items,
};

function renderSection(
  section: DashboardSection,
  currentActor = actor,
  currentFeed = feed,
): string {
  return renderToStaticMarkup(
    <DashboardView
      client={client}
      actor={currentActor}
      section={section}
      feed={currentFeed}
      overtime={null}
      overtimeError={null}
      overtimeLoadMoreError={null}
      selectedUrgentId="INC-0123456789abcdef0123456789abcdef"
      evidenceRefreshRevision={0}
      loadingMore={false}
      loadingMoreOvertime={false}
      loadMoreError={null}
      onSelectUrgent={vi.fn()}
      onLoadMore={vi.fn()}
      onRetryOvertime={vi.fn()}
      onLoadMoreOvertime={vi.fn()}
    />,
  );
}

describe("complete field rendering", () => {
  it("renders every Routine/Rework BIN or container label and the explicit empty state", () => {
    const qualityHtml = renderSection("quality");
    const dailyHtml = renderSection("daily");
    for (const label of [
      "BIN-ROUTINE-901",
      "CONTAINER-ROUTINE-902",
      "BIN-REWORK-903",
    ]) {
      expect(qualityHtml).toContain(label);
      expect(dailyHtml).toContain(label);
    }
    const historical = qualityHtml.slice(
      qualityHtml.indexOf("Historical mobile Rework with explicit nulls"),
    );
    expect(historical).toContain(
      "<dt>BIN / container labels</dt><dd><span>None provided</span></dd>",
    );
  });

  it("renders every Routine and Rework business field, null, author, and delivery state", () => {
    const html = renderSection("quality");
    for (const expected of [
      "Morgan Render Author",
      "ROUTINE-PART-901",
      "BIN / container labels",
      "BIN-ROUTINE-901",
      "CONTAINER-ROUTINE-902",
      "Traceability",
      "Not provided",
      "Quantity inspected",
      "Quantity passed",
      "Quantity rejected",
      "Result code",
      "Surface blemish under review",
      "Routine notes remain fully visible across multiple lines.",
      "REWORK-PART-902",
      "BIN-REWORK-903",
      "Quantity reworked",
      "73 min",
      "Rework type code",
      "Hand-finish connector seat",
      "Custom rework type",
      "Returned to production",
      "Deburred each seat and held the lot for final disposition.",
      "Email delivery",
      "Historical mobile Rework with explicit nulls",
      "47 min",
    ]) expect(html).toContain(expected);
    const historical = html.slice(html.indexOf("Historical mobile Rework with explicit nulls"));
    expect(historical).toContain("<dt>Part number</dt><dd>Not provided</dd>");
    expect(historical).toContain("<dt>BIN / container labels</dt><dd><span>None provided</span></dd>");
    expect(historical).toContain("<dt>Rework type code</dt><dd>Not provided</dd>");
    expect(historical).toContain("<dt>Returned to production</dt><dd>Not provided</dd>");
    expect(historical).toContain("<strong>Work completed</strong><p>Not provided</p>");
  });

  it("renders every current client-safe Urgent field without mounting media during SSR", () => {
    const clientActor: DashboardActor = {
      ...actor,
      role: "client",
      roleLabel: "Client",
      capabilities: {
        qualitySources: false,
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        hours: false,
        clientOvertimeReview: true,
        expenses: false,
        financeEvidence: false,
        configurationAttention: false,
      },
    };
    const html = renderSection("urgent", clientActor);
    for (const expected of [
      "CLIENT-INCIDENT-REFERENCE-903",
      "PART-ID-903",
      "Part number",
      "Not provided",
      "Connector housing fracture",
      "Final inspection station",
      "Stopped the line and contained every suspect container.",
      "Released to Client",
      "Evidence authorized",
      "Loading evidence status",
      "PART-LABEL-903",
      "PART-LABEL-904",
      "CONTAINER-LABEL-903",
      "<dt>Part label availability</dt><dd>provided</dd>",
      "<dt>Part label unavailable reason</dt><dd>Not provided</dd>",
      "<dt>Container label availability</dt><dd>provided</dd>",
      "<dt>Container label unavailable reason</dt><dd>Not provided</dd>",
      "Traceability status",
      "Zero traceability confirmed",
      "Connector housing fractured at the locking tab.",
      "Issue",
      "Area code",
      "Resolved area value",
      "Quantity",
      "Immediate action",
      "Action taken",
      "Concern code",
      "Resolved concern value",
      "Custom concern value",
      "Return to supplier",
      "Supplier sort requested",
      "RMA required",
      "RMA-903",
      "Revision kind",
      "Preliminary Revision 2",
      "Investigation status",
      "Investigation status label",
      "in progress",
      "No-media reason",
      "Record delivery",
      "Dashboard",
      "External delivery",
      "Evidence status",
    ]) expect(html).toContain(expected);
    expect(html).not.toContain("image_original");
    expect(html).not.toContain("image_annotation");
    expect(html).not.toContain(">Admin attention<");
    expect(html).not.toContain(">External delivery message<");
    expect(html).not.toContain(author.id);
  });

  it("renders unavailable label statuses and their exact reasons", () => {
    const urgent = items.find(
      (item): item is DashboardFeedItemOfKind<"urgent_incident"> =>
        item.kind === "urgent_incident",
    )!;
    const unavailable: DashboardFeedItemOfKind<"urgent_incident"> = {
      ...urgent,
      entityId: "INC-11111111111111111111111111111111",
      details: {
        ...urgent.details,
        partLabels: [],
        containerLabels: [],
        partLabelAvailability: {
          status: "unavailable",
          reason: "Part label was unreadable at the station.",
        },
        containerLabelAvailability: {
          status: "unavailable",
          reason: "Container label was missing from the tote.",
        },
      },
    };
    const html = renderSection("urgent", actor, { ...feed, items: [unavailable] });
    for (const fragment of [
      "<dt>Part label values</dt><dd><span>None provided</span></dd>",
      "<dt>Container label values</dt><dd><span>None provided</span></dd>",
      "<dt>Part label availability</dt><dd>unavailable</dd>",
      "<dt>Part label unavailable reason</dt><dd>Part label was unreadable at the station.</dd>",
      "<dt>Container label availability</dt><dd>unavailable</dd>",
      "<dt>Container label unavailable reason</dt><dd>Container label was missing from the tote.</dd>",
    ]) expect(html).toContain(fragment);
  });

  it("renders every Daily area, source card, rate-free Hours value, and amendment field", () => {
    const html = renderSection("daily");
    for (const expected of [
      "Install Area",
      "Taylor Floor Lead",
      "Containment remained posted at the station.",
      "Heavy Repair",
      "Area was closed for scheduled maintenance.",
      "Final comments",
      "No issues reported",
      "Outstanding issue",
      "Confirm disposition before the next shift starts.",
      "ROUTINE-SOURCE-1",
      "REWORK-SOURCE-1",
      "URGENT-SOURCE-1",
      "Attached Routine source",
      "Attached Rework source",
      "Released Urgent source",
      "Released reference only",
      "server_time_entries_effective_projections",
      "9.25 h",
      "Expense included: No",
      "Revision number",
      "Revision kind",
      "DAILY-RENDER-V1",
      "Amended at",
      "Corrected the handover details.",
    ]) expect(html).toContain(expected);
    expect(html.toLowerCase()).not.toMatch(/billing rate|pay rate|hourly rate/);
    expect(html).not.toContain(">Admin attention<");
    expect(html).not.toContain(">External delivery message<");
    expect(html).not.toContain("Local record ID");
  });

  it("renders every rate-free Hours field and every authorized Expense metadata field", () => {
    const hoursHtml = renderSection("hours");
    for (const expected of [
      "9.25 h",
      "8 h",
      "1.25 h",
      "Work type",
      "Not provided",
      "client pending",
      "Financial processing",
      "not evaluated requires ag finance workflow",
      "Work summary",
    ]) expect(hoursHtml).toContain(expected);
    expect(hoursHtml.toLowerCase()).not.toMatch(/billing rate|pay rate|hourly rate/);

    const expenseHtml = renderSection("expenses");
    for (const expected of [
      "23.75",
      "CAD",
      "Secure parking",
      "Night shift lot",
      "Mileage distance",
      "Mileage unit",
      "Attachment count",
      "Business reason",
      "Not provided",
    ]) expect(expenseHtml).toContain(expected);
  });

  it("renders scoped placeholders for every nullable v2 business-field family", () => {
    const currentDaily = items.find(
      (item): item is DashboardFeedItemOfKind<"daily_report"> => item.kind === "daily_report",
    )!;
    const nullableItems: DashboardFeedItem[] = [
      {
        ...common,
        kind: "routine_inspection",
        entityId: "ROUTINE-NULL-1",
        details: {
          ...routine,
          traceability: null,
          notes: null,
          recordDelivery: null,
          dashboardDelivery: null,
          emailDelivery: null,
        },
      },
      {
        ...common,
        kind: "rework",
        entityId: "REWORK-NULL-1",
        details: {
          contractVersion: "complete",
          partNumber: null,
          containerLabels: [],
          quantityReworked: null,
          timeSpentMinutes: 47,
          reworkTypeCode: null,
          reworkTypeValue: null,
          reworkTypeOther: null,
          returnedToProduction: null,
          workCompleted: null,
          recordDelivery: null,
          dashboardDelivery: null,
          emailDelivery: null,
        },
      },
      {
        ...common,
        kind: "urgent_incident",
        entityId: "URGENT-NULL-1",
        details: {
          contractVersion: "complete",
          incidentReference: "CLIENT-URGENT-NULL-1",
          partId: null,
          partNumber: null,
          partLabels: [],
          containerLabels: [],
          traceabilityStatus: null,
          zeroTraceabilityConfirmed: false,
          defectType: null,
          issue: null,
          areaCode: null,
          areaValue: null,
          area: null,
          quantity: null,
          immediateAction: null,
          actionTaken: null,
          levelOfConcernCode: null,
          levelOfConcernValue: null,
          levelOfConcernOther: null,
          levelOfConcern: null,
          returnToSupplier: null,
          sortRequested: null,
          rmaRequired: null,
          rmaNumber: null,
          noMediaReason: null,
          revisionNumber: null,
          revisionKind: null,
          revisionLabel: null,
          investigationStatus: null,
          investigationStatusLabel: null,
          releaseStatus: "released",
          releasedToClient: true,
          recordDelivery: null,
          dashboardDelivery: null,
          externalDelivery: null,
          externalDeliveryMessage: null,
          adminAttention: null,
          adminApprovalRequired: false,
          mediaEvidenceStatus: null,
          evidenceAccessible: false,
        },
      },
      {
        ...currentDaily,
        entityId: "DAILY-NULL-1",
        details: {
          ...currentDaily.details,
          areaWalks: [{
            areaId: "install_area",
            areaName: "Install Area",
            status: "all_good",
            visited: true,
            spokeWith: "Floor lead",
            floorNotes: null,
            notVisitedReason: null,
          }],
          areasWalkedCount: 1,
          finalComments: null,
          outstandingIssue: "no",
          handoverNote: null,
          recordDelivery: null,
          dashboardDelivery: null,
          externalDelivery: null,
          revision: {
            number: 1,
            kind: "initial",
            parentReportId: null,
            reason: null,
            amendedAt: null,
          },
          noIssues: true,
        },
      },
      {
        ...common,
        kind: "hours",
        entityId: "HOURS-NULL-1",
        details: {
          entryCount: 1,
          reportedHours: 8,
          regularHours: 8,
          overtimeHours: 0,
          workType: null,
          workSummary: null,
          approvalState: "not_required",
          clientReviewStatus: "not_required",
          recordDelivery: null,
          financeVisibility: null,
          financialProcessingState: "not_evaluated_requires_ag_finance_workflow",
        },
      },
      {
        ...common,
        kind: "expense",
        entityId: "EXPENSE-NULL-1",
        details: {
          categoryCode: "parking",
          categoryValue: "Parking",
          categoryOther: null,
          amount: 10,
          currency: "CAD",
          businessReason: null,
          mileageDistance: null,
          mileageUnit: null,
          attachmentCount: 0,
          recordDelivery: null,
          financeVisibility: null,
        },
      },
    ];
    const nullableFeed: DashboardFeedPage = { ...feed, items: nullableItems };
    const qualityHtml = renderSection("quality", actor, nullableFeed);
    const urgentHtml = renderSection("urgent", actor, nullableFeed);
    const dailyHtml = renderSection("daily", actor, nullableFeed);
    const hoursHtml = renderSection("hours", actor, nullableFeed);
    const expenseHtml = renderSection("expenses", actor, nullableFeed);

    for (const fragment of [
      "<dt>Traceability</dt><dd>Not provided</dd>",
      "<strong>Inspection notes</strong><p>Not provided</p>",
      "<dt>Part number</dt><dd>Not provided</dd>",
      "<dt>BIN / container labels</dt><dd><span>None provided</span></dd>",
      "<dt>Quantity reworked</dt><dd>Not provided</dd>",
      "<dt>Resolved rework type</dt><dd>Not provided</dd>",
      "<dt>Custom rework type</dt><dd>Not provided</dd>",
      "<dt>Returned to production</dt><dd>Not provided</dd>",
      "<strong>Work completed</strong><p>Not provided</p>",
      "<dt>Email delivery</dt><dd>Not provided</dd>",
    ]) expect(qualityHtml).toContain(fragment);

    for (const fragment of [
      "<dt>Part</dt><dd>Not provided</dd>",
      "<dt>Part number</dt><dd>Not provided</dd>",
      "<dt>Part label values</dt><dd><span>None provided</span></dd>",
      "<dt>Container label values</dt><dd><span>None provided</span></dd>",
      "<dt>Part label availability</dt><dd>Legacy / Not provided</dd>",
      "<dt>Part label unavailable reason</dt><dd>Not provided</dd>",
      "<dt>Container label availability</dt><dd>Legacy / Not provided</dd>",
      "<dt>Container label unavailable reason</dt><dd>Not provided</dd>",
      "<dt>Custom concern value</dt><dd>Not provided</dd>",
      "<dt>RMA number</dt><dd>Not applicable</dd>",
      "<dt>Revision</dt><dd>Not provided</dd>",
      "<dt>Evidence status</dt><dd>Not provided</dd>",
      "<strong>Issue</strong><p>Not provided</p>",
      "<strong>Immediate action</strong><p>Not provided</p>",
      "<strong>No-media reason</strong><p>Not provided</p>",
      "<strong>Action taken</strong><p>Not provided</p>",
    ]) expect(urgentHtml).toContain(fragment);

    for (const fragment of [
      "<dt>Floor notes</dt><dd>Not provided</dd>",
      "<dt>Not visited reason</dt><dd>Not applicable</dd>",
      "<dt>Parent report</dt><dd>Not applicable</dd>",
      "<dt>Amended at</dt><dd>Not applicable</dd>",
      "<strong>Final comments</strong><p>Not provided</p>",
      "<strong>Handover note</strong><p>Not provided</p>",
      "<strong>Amendment reason</strong><p>Not provided</p>",
    ]) expect(dailyHtml).toContain(fragment);

    for (const fragment of [
      "<dt>Work type</dt><dd>Not provided</dd>",
      "<dt>Record delivery</dt><dd>Not provided</dd>",
      "<dt>Finance visibility</dt><dd>Not provided</dd>",
      "<strong>Work summary</strong><p>Not provided</p>",
    ]) expect(hoursHtml).toContain(fragment);

    for (const fragment of [
      "<dt>Custom category</dt><dd>Not provided</dd>",
      "<dt>Mileage distance</dt><dd>Not provided</dd>",
      "<dt>Mileage unit</dt><dd>Not provided</dd>",
      "<dt>Record delivery</dt><dd>Not provided</dd>",
      "<dt>Finance visibility</dt><dd>Not provided</dd>",
      "<strong>Business reason</strong><p>Not provided</p>",
    ]) expect(expenseHtml).toContain(fragment);
  });

  it("renders the backend-backed All and Specific Rep filter without a custom Other choice", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <RepFilter authors={[author]} value={author.id} disabled={false} onChange={onChange} />,
    );
    expect(html).toContain("Specific IDS Rep");
    expect(html).toContain("All IDS Reps");
    expect(html).toContain("Morgan Render Author");
    expect(html).toContain("authorized records already loaded under All");
    expect(html).not.toMatch(/>Other</i);
    expect(html).not.toContain(author.id);
    expect(html).toContain('value="rep-0"');
  });
});

describe("Client evidence presentation", () => {
  const groupId = "11111111-1111-4111-8111-111111111111";
  const attachmentId = "22222222-2222-4222-8222-222222222222";
  const group: ClientEvidenceGroup = {
    groupId,
    kind: "marked_image",
    displayOrder: 0,
    title: "Marked connector face",
    note: "Crack location outlined by IDS",
    durationMs: null,
  };
  const attachment: ClientEvidenceAttachment = {
    attachmentId,
    groupId,
    kind: "marked_image",
    displayOrder: 0,
  };
  const videoGroup: ClientEvidenceGroup = {
    ...group,
    groupId: "55555555-5555-4555-8555-555555555555",
    kind: "submitted_video",
    displayOrder: 2,
    title: "Submitted line-stop video",
    note: "Shows the full containment sequence",
    durationMs: 4200,
  };
  const videoAttachment: ClientEvidenceAttachment = {
    ...attachment,
    attachmentId: "66666666-6666-4666-8666-666666666666",
    groupId: videoGroup.groupId,
    kind: "submitted_video",
    displayOrder: 1,
  };
  const objectUrl = "blob:https://viewer.invalid/client-evidence-preview";
  const expiresAt = "2026-08-14T15:35:00.000Z";
  const storagePath = "ids-pulse-incident-evidence/sealed/v1/private-group/private-file.jpg";
  const objectName = "private-file.jpg";
  const storageToken = "temporary-token";
  const verifiedHash = "b".repeat(64);
  const signedStorageUrl = `https://qatoyevwtjjtynisodyq.supabase.co/storage/v1/object/sign/${storagePath}?token=${storageToken}`;

  it("shows simple marked-photo facts and controls without technical IDs", () => {
    const html = renderToStaticMarkup(
      <ClientEvidenceGroupCard
        group={group}
        attachments={[attachment]}
        busyAction={null}
        onView={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    for (const expected of [
      "Marked photo",
      "Marked connector face",
      "Crack location outlined by IDS",
      "Display position 1",
      "Not applicable",
      ">View<",
      ">Download<",
    ]) expect(html).toContain(expected);
    expect(html).not.toContain(groupId);
    expect(html).not.toContain(attachmentId);
  });

  it("shows every submitted-video fact and control without technical IDs", () => {
    const html = renderToStaticMarkup(
      <ClientEvidenceGroupCard
        group={videoGroup}
        attachments={[videoAttachment]}
        busyAction={null}
        onView={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    for (const expected of [
      "Submitted video",
      "Submitted line-stop video",
      "Shows the full containment sequence",
      "Display position 3",
      "4200 ms",
      "display position 2",
      ">View<",
      ">Download<",
    ]) expect(html).toContain(expected);
    expect(html).not.toContain(videoGroup.groupId);
    expect(html).not.toContain(videoAttachment.attachmentId);
  });

  it("renders explicit Client evidence placeholders for every nullable group fact", () => {
    const nullableGroup: ClientEvidenceGroup = {
      ...group,
      title: null,
      note: null,
      durationMs: null,
    };
    const html = renderToStaticMarkup(
      <ClientEvidenceGroupCard
        group={nullableGroup}
        attachments={[attachment]}
        busyAction={null}
        onView={vi.fn()}
        onDownload={vi.fn()}
      />,
    );
    for (const expected of [
      "Marked photo 1",
      "Title Not provided",
      "Note Not provided",
      "Duration Not applicable",
      "Display position 1",
    ]) {
      expect(html).toContain(expected);
    }
    expect(html).not.toContain(groupId);
    expect(html).not.toContain(attachmentId);
  });

  it("renders marked photos and submitted videos as consumable media", () => {
    const imageHtml = renderToStaticMarkup(
      <EvidenceMediaPreview
        preview={{ attachment, objectUrl, expiresAt }}
        onClose={vi.fn()}
      />,
    );
    expect(imageHtml).toContain("<img");
    expect(imageHtml).toContain("Marked photo");
    expect(imageHtml).not.toMatch(/>[^<]*temporary-token[^<]*</);

    const videoHtml = renderToStaticMarkup(
      <EvidenceMediaPreview
        preview={{ attachment: videoAttachment, objectUrl, expiresAt }}
        onClose={vi.fn()}
      />,
    );
    expect(videoHtml).toContain("<video");
    expect(videoHtml).toContain("controls");
    expect(videoHtml).toContain("Submitted video");
    for (const html of [imageHtml, videoHtml]) {
      expect(html).toContain(objectUrl);
      for (const forbidden of [
        groupId,
        attachmentId,
        author.id,
        signedStorageUrl,
        storagePath,
        objectName,
        storageToken,
        verifiedHash,
      ]) {
        expect(html).not.toContain(forbidden);
      }
      expect(html).not.toMatch(/group_id|attachment_id|author id|storage (?:url|path)|token|hash|object name/i);
    }
  });

  it("keeps the complete Client media surface free of identifiers and storage transport", () => {
    const clientActor: DashboardActor = {
      ...actor,
      role: "client",
      roleLabel: "Client",
      capabilities: {
        qualitySources: false,
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        hours: false,
        clientOvertimeReview: true,
        expenses: false,
        financeEvidence: false,
        configurationAttention: false,
      },
    };
    const html = [
      renderSection("urgent", clientActor),
      renderToStaticMarkup(
        <RepFilter
          authors={[author]}
          value={author.id}
          disabled={false}
          onChange={vi.fn()}
        />,
      ),
      renderToStaticMarkup(
        <ClientEvidenceGroupCard
          group={group}
          attachments={[attachment]}
          busyAction={null}
          onView={vi.fn()}
          onDownload={vi.fn()}
        />,
      ),
      renderToStaticMarkup(
        <ClientEvidenceGroupCard
          group={videoGroup}
          attachments={[videoAttachment]}
          busyAction={null}
          onView={vi.fn()}
          onDownload={vi.fn()}
        />,
      ),
      renderToStaticMarkup(
        <EvidenceMediaPreview
          preview={{ attachment, objectUrl, expiresAt }}
          onClose={vi.fn()}
        />,
      ),
      renderToStaticMarkup(
        <EvidenceMediaPreview
          preview={{ attachment: videoAttachment, objectUrl, expiresAt }}
          onClose={vi.fn()}
        />,
      ),
    ].join("");

    for (const expected of [
      "Morgan Render Author",
      "Marked photo",
      "Marked connector face",
      "Crack location outlined by IDS",
      "Submitted video",
      "Submitted line-stop video",
      "Shows the full containment sequence",
      "Display position 1",
      "Display position 3",
      "4200 ms",
      ">View<",
      ">Download<",
      "<img",
      "<video",
      "controls",
    ]) {
      expect(html).toContain(expected);
    }
    for (const forbidden of [
      groupId,
      attachmentId,
      videoGroup.groupId,
      videoAttachment.attachmentId,
      author.id,
      signedStorageUrl,
      storagePath,
      objectName,
      storageToken,
      verifiedHash,
    ]) {
      expect(html).not.toContain(forbidden);
    }
    expect(html).not.toMatch(/group_id|attachment_id|author id|storage (?:url|path)|token|hash|object name/i);
  });

  it("keeps internal original and annotation audit previews consumable through blob transport", () => {
    const internalOriginal: EvidenceAttachment = {
      attachmentId,
      mediaGroupId: groupId,
      role: "image_original",
      sortOrder: 0,
      accessState: "private_incident_authorized",
    };
    const internalAnnotation: EvidenceAttachment = {
      ...internalOriginal,
      attachmentId: videoAttachment.attachmentId,
      role: "image_annotation",
      sortOrder: 1,
    };
    const originalHtml = renderToStaticMarkup(
      <EvidenceMediaPreview
        preview={{ attachment: internalOriginal, objectUrl, expiresAt }}
        onClose={vi.fn()}
      />,
    );
    const annotationHtml = renderToStaticMarkup(
      <EvidenceMediaPreview
        preview={{ attachment: internalAnnotation, objectUrl, expiresAt }}
        onClose={vi.fn()}
      />,
    );
    expect(originalHtml).toContain("Normalized original");
    expect(originalHtml).toContain("<img");
    expect(annotationHtml).toContain("Drawing data");
    expect(annotationHtml).toContain(`href="${objectUrl}"`);
    expect(originalHtml + annotationHtml).not.toContain(signedStorageUrl);
  });
});
