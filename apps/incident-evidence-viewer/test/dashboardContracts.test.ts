import { describe, expect, it } from "vitest";
import {
  clientOvertimeCursorPayload,
  dashboardCursorPayload,
  parseClientOvertimeFeed,
  parseDashboardActor,
  parseDashboardFeed,
  parseDashboardSnapshot,
  validateDashboardFeedForActor,
} from "../src/data/dashboardContracts";

const timestamp = "2026-08-14T15:30:00.000Z";

const actorResponse = {
  status: "ok",
  record_kind: "mobile_dashboard_actor",
  server_timestamp: timestamp,
  actor: { display_name: "Clarence", role: "office", role_label: "IDS Office" },
  capabilities: {
    quality_sources: true,
    incident_core: true,
    incident_evidence: true,
    daily_reports: true,
    hours: true,
    client_overtime_review: false,
    expenses: true,
    finance_evidence: false,
    configuration_attention: true,
  },
};

const common = {
  project_id: "project-1",
  assignment_id: "assignment-1",
  work_date: "2026-08-14",
  recorded_at: timestamp,
  title: "Authorized record",
  summary: null,
  state: "future_safe_state",
};

const qualityDetails = {
  part_id: "part-10",
  quantity: 12,
  time_spent_minutes: 35,
  record_delivery: "stored",
  dashboard_delivery: "available",
  email_delivery: null,
};

const urgentDetails = {
  part_id: "part-11",
  defect_type: "Connector damage",
  area: "Line 4",
  quantity: 2,
  action_taken: "Contained suspect material.",
  level_of_concern: "High",
  revision_number: 3,
  release_status: "released",
  released_to_client: true,
  record_delivery: "stored",
  dashboard_delivery: "available",
  external_delivery: "sent",
  external_delivery_message: null,
  admin_attention: "none",
  admin_approval_required: false,
  media_evidence_status: "verified_private_storage",
  evidence_accessible: true,
};

const dailyDetails = {
  areas_walked_count: 4,
  incidents_count: 1,
  source_activity_ids: ["routine-1", "incident-1"],
  source_activities: [
    {
      record_kind: "routine_inspection",
      entity_id: "routine-1",
      local_record_id: "local-routine-1",
      occurred_at: "2026-08-14T12:00:00.000Z",
      work_date: "2026-08-14",
      title: "Routine source",
      summary: "Checked 12 parts.",
      reference_only: false,
      initial_revision_number: null,
    },
    {
      record_kind: "urgent_incident",
      entity_id: "incident-1",
      local_record_id: "local-incident-1",
      occurred_at: "2026-08-14T13:00:00.000Z",
      work_date: "2026-08-14",
      title: null,
      summary: null,
      reference_only: true,
      initial_revision_number: 1,
    },
  ],
  hours_summary: {
    source: "mobile_hours",
    selection: "latest_logical_submission",
    work_date: "2026-08-14",
    entry_count: 2,
    submission_count: 1,
    regular_hours: 8,
    overtime_hours: 1.5,
    total_hours: 9.5,
    overtime_pending_review_hours: 1.5,
  },
  expense_included: false,
  record_delivery: "stored",
  dashboard_delivery: "available",
  external_delivery: "sent",
  external_delivery_message: null,
  admin_attention: null,
  admin_approval_required: false,
};

const hoursDetails = {
  entry_count: 2,
  reported_hours: 9.5,
  regular_hours: 8,
  overtime_hours: 1.5,
  work_type: "Inspection",
  work_summary: null,
  approval_state: "future_safe_state",
  client_review_status: "pending",
  record_delivery: "stored",
  finance_visibility: "available",
  financial_processing_state: "not_evaluated_requires_ag_finance_workflow",
};

const expenseDetails = {
  category_code: "other",
  category_value: "Parking at customer plant",
  category_other: "Secure lot",
  amount: 18.5,
  currency: "CAD",
  business_reason: "Customer visit",
  mileage_distance: null,
  mileage_unit: null,
  attachment_count: 1,
  record_delivery: "stored",
  finance_visibility: "available",
};

const items = [
  { ...common, kind: "routine_inspection", entity_id: "routine-1", details: qualityDetails },
  { ...common, kind: "rework", entity_id: "rework-1", details: qualityDetails },
  { ...common, kind: "urgent_incident", entity_id: "incident-1", details: urgentDetails },
  { ...common, kind: "daily_report", entity_id: "daily-1", details: dailyDetails },
  { ...common, kind: "hours", entity_id: "hours-1", details: hoursDetails },
  { ...common, kind: "expense", entity_id: "expense-1", details: expenseDetails },
];

const author = { id: "rep-clarence", display_name: "Clarence Field" };
const routineV2 = {
  part_number: "PN-ROUTINE-42",
  container_labels: ["BIN-ROUTINE-42", "CONTAINER-ROUTINE-43"],
  traceability: null,
  quantity_inspected: 12,
  quantity_passed: 11,
  quantity_rejected: 1,
  result_code: "defect_found",
  result_value: "defect_found",
  notes: "One connector was isolated.",
  record_delivery: "server_confirmed",
  dashboard_delivery: "available",
  email_delivery: "queued",
};
const reworkV2 = {
  part_number: "PN-REWORK-17",
  container_labels: [],
  quantity_reworked: 3,
  time_spent_minutes: 47,
  rework_type_code: "other",
  rework_type_value: "Deburr connector seat",
  rework_type_other: "Deburr connector seat",
  returned_to_production: "unknown",
  work_completed: "Removed burrs and held parts for disposition.",
  record_delivery: "server_confirmed",
  dashboard_delivery: "available",
  email_delivery: null,
};
const urgentV2 = {
  incident_reference: "incident-client-reference-42",
  part_id: "part-urgent-42",
  part_number: "PN-URGENT-42",
  part_labels: ["PART-LABEL-42", "PART-LABEL-43"],
  container_labels: ["CONTAINER-LABEL-42"],
  part_label_availability: { status: "provided", reason: null },
  container_label_availability: { status: "provided", reason: null },
  traceability_status: "provided",
  zero_traceability_confirmed: false,
  defect_type: "Connector damage",
  issue: "Connector damage found during final inspection.",
  area_code: "line",
  area_value: "Line 4",
  area: "Line 4",
  quantity: 2,
  immediate_action: "Contained suspect material.",
  action_taken: "Contained suspect material.",
  level_of_concern_code: "high",
  level_of_concern_value: "High",
  level_of_concern_other: null,
  level_of_concern: "High",
  return_to_supplier: "no",
  sort_requested: "yes",
  rma_required: "yes",
  rma_number: "RMA-URGENT-42",
  no_media_reason: null,
  release_status: "released",
  released_to_client: true,
  revision_number: 1,
  revision_kind: "preliminary",
  revision_label: "Preliminary Revision 1",
  investigation_status: "not_started",
  investigation_status_label: "Not started",
  record_delivery: "server_confirmed",
  dashboard_delivery: "available",
  external_delivery: "sent",
  media_evidence_status: "verified_private_storage",
  evidence_accessible: true,
};
const routineSourceV2 = {
  record_kind: "routine_inspection",
  entity_id: "routine-v2",
  occurred_at: "2026-08-14T12:00:00.000Z",
  work_date: "2026-08-14",
  title: "Routine source v2",
  summary: "Checked the complete sample.",
  reference_only: false,
  initial_revision_number: null,
  details: routineV2,
};
const reworkSourceV2 = {
  record_kind: "rework",
  entity_id: "rework-v2",
  occurred_at: "2026-08-14T12:30:00.000Z",
  work_date: "2026-08-14",
  title: "Rework source v2",
  summary: "Completed contained rework.",
  reference_only: false,
  initial_revision_number: null,
  details: reworkV2,
};
const urgentSourceV2 = {
  record_kind: "urgent_incident",
  entity_id: "incident-v2",
  occurred_at: "2026-08-14T13:00:00.000Z",
  work_date: "2026-08-14",
  title: "Released Urgent reference",
  summary: null,
  reference_only: true,
  initial_revision_number: 1,
  details: null,
};
const dailyV2 = {
  area_walks: [
    {
      area_id: "install_area",
      area_name: "Install Area",
      status: "defect",
      spoke_with: "Avery Supervisor",
      floor_notes: "Connector containment remained active.",
      not_visited_reason: null,
    },
    {
      area_id: "heavy_repair",
      area_name: "Heavy Repair",
      status: "not_visited",
      spoke_with: null,
      floor_notes: null,
      not_visited_reason: "Area closed for maintenance.",
    },
  ],
  final_comments: null,
  outstanding_issue: "yes",
  handover_note: "Confirm disposition on the isolated connector.",
  no_issues: false,
  source_activity_ids: ["routine-v2", "rework-v2", "incident-v2"],
  source_activities: [routineSourceV2, reworkSourceV2, urgentSourceV2],
  hours_summary: dailyDetails.hours_summary,
  expense_included: false,
  record_delivery: "server_confirmed",
  dashboard_delivery: "available",
  external_delivery: "sent",
  revision: {
    number: 2,
    kind: "amendment",
    parent_report_id: "daily-v1",
    amendment_reason: "Corrected the handover note.",
    amended_at: "2026-08-14T15:00:00.000Z",
  },
};
const v2Items = [
  { ...common, author, kind: "routine_inspection", entity_id: "routine-v2", details: routineV2 },
  { ...common, author, kind: "rework", entity_id: "rework-v2", details: reworkV2 },
  { ...common, author, kind: "urgent_incident", entity_id: "incident-v2", details: urgentV2 },
  { ...common, author, kind: "daily_report", entity_id: "daily-v2", details: dailyV2 },
  { ...common, author, kind: "hours", entity_id: "hours-v2", details: hoursDetails },
  { ...common, author, kind: "expense", entity_id: "expense-v2", details: expenseDetails },
];

function feed(overrides: Record<string, unknown> = {}) {
  return {
    status: "ok",
    record_kind: "mobile_dashboard_feed",
    server_timestamp: timestamp,
    has_more: false,
    next_cursor: null,
    items,
    ...overrides,
  };
}

function feedV2(overrides: Record<string, unknown> = {}) {
  return {
    status: "ok",
    record_kind: "mobile_dashboard_feed",
    server_timestamp: timestamp,
    contract_version: 2,
    rep_filter: null,
    has_more: false,
    next_cursor: null,
    items: v2Items,
    ...overrides,
  };
}

describe("dashboard actor contract", () => {
  it("maps only the exact identity and boolean capability keys", () => {
    expect(parseDashboardActor(actorResponse)).toMatchObject({
      displayName: "Clarence",
      roleLabel: "IDS Office",
      capabilities: { incidentEvidence: true, clientOvertimeReview: false },
    });
    expect(() => parseDashboardActor({ ...actorResponse, browser_role: "admin" })).toThrow(/shape/i);
    expect(() => parseDashboardActor({
      ...actorResponse,
      capabilities: { ...actorResponse.capabilities, expenses: "true" },
    })).toThrow(/capability/i);
    expect(() => parseDashboardActor({
      ...actorResponse,
      actor: { ...actorResponse.actor, role_label: "IDS Office Lead" },
    })).toThrow(/role label/i);
  });
});

describe("atomic dashboard snapshot contract", () => {
  const snapshot = {
    status: "ok",
    record_kind: "mobile_dashboard_snapshot",
    server_timestamp: timestamp,
    actor: actorResponse,
    feed: feed(),
  };

  it("parses complete nested actor and feed envelopes from one timestamp", () => {
    expect(parseDashboardSnapshot(snapshot)).toMatchObject({
      serverTimestamp: timestamp,
      actor: { displayName: "Clarence" },
      feed: { serverTimestamp: timestamp },
    });
  });

  it("rejects unknown outer keys and any cross-snapshot timestamp mismatch", () => {
    expect(() => parseDashboardSnapshot({ ...snapshot, browser_role: "admin" }))
      .toThrow(/shape/i);
    expect(() => parseDashboardSnapshot({
      ...snapshot,
      feed: { ...feed(), server_timestamp: "2026-08-14T15:30:01.000Z" },
    })).toThrow(/timestamps are inconsistent/i);
    expect(() => parseDashboardSnapshot({
      ...snapshot,
      actor: { ...actorResponse, server_timestamp: "2026-08-14T15:30:01.000Z" },
    })).toThrow(/timestamps are inconsistent/i);
  });
});

describe("mobile dashboard feed contract", () => {
  it("parses all six exhaustive branches and preserves unknown safe state strings", () => {
    const parsed = parseDashboardFeed(feed());
    expect(parsed.items.map((item) => item.kind)).toEqual([
      "routine_inspection",
      "rework",
      "urgent_incident",
      "daily_report",
      "hours",
      "expense",
    ]);
    expect(parsed.items[0]?.summary).toBeNull();
    expect(parsed.items[4]?.state).toBe("future_safe_state");
    expect(parsed.items[3]?.kind === "daily_report" && parsed.items[3].details.expenseIncluded)
      .toBe(false);
  });

  it("rejects a seventh kind and extra top-level or branch keys", () => {
    expect(() => parseDashboardFeed(feed({
      items: [{ ...common, kind: "configuration_attention", entity_id: "attention-1", details: {} }],
    }))).toThrow(/kind/i);
    expect(() => parseDashboardFeed({ ...feed(), page: {} })).toThrow(/shape/i);
    expect(() => parseDashboardFeed(feed({
      items: [{ ...items[2], details: { ...urgentDetails, raw_payload: {} } }],
    }))).toThrow(/shape/i);
  });

  it("rejects actual transport material even inside otherwise safe text fields", () => {
    expect(() => parseDashboardFeed(feed({
      items: [{
        ...items[2],
        details: {
          ...urgentDetails,
          external_delivery_message: "/storage/v1/object/sign/private?token=secret",
        },
      }],
    }))).toThrow(/transport material/i);
  });

  it("allows label business text containing token-like delimiters without weakening leak checks", () => {
    const tokenLikeLabel = "BIN-42?token=LOT-A&station=4";
    const parsed = parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[0],
        details: { ...routineV2, container_labels: [tokenLikeLabel] },
      }],
    }));
    expect(parsed.items[0]).toMatchObject({
      kind: "routine_inspection",
      details: { containerLabels: [tokenLikeLabel] },
    });

    for (const leakedValue of [
      "https://qatoyevwtjjtynisodyq.supabase.co/storage/v1/object/sign/private?token=secret",
      "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwcml2YXRlLXVzZXIifQ.c2lnbmF0dXJlLXZhbHVl",
    ]) {
      expect(() => parseDashboardFeed(feedV2({
        items: [{
          ...v2Items[0],
          details: { ...routineV2, container_labels: [leakedValue] },
        }],
      }))).toThrow(/transport material/i);
    }
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[0],
        details: { ...routineV2, access_token: "private-credential" },
      }],
    }))).toThrow(/transport material/i);
  });

  it("strictly validates Daily source projections and canonical Hours", () => {
    expect(() => parseDashboardFeed(feed({
      items: [{
        ...items[3],
        details: {
          ...dailyDetails,
          source_activities: [{
            ...dailyDetails.source_activities[1],
            summary: "Raw Incident narrative must not appear here",
          }],
        },
      }],
    }))).toThrow(/projection/i);
    expect(() => parseDashboardFeed(feed({
      items: [{
        ...items[3],
        details: {
          ...dailyDetails,
          hours_summary: { ...dailyDetails.hours_summary, expense_total: 18.5 },
        },
      }],
    }))).toThrow(/shape/i);
  });

  it("requires false approval and expense flags", () => {
    expect(() => parseDashboardFeed(feed({
      items: [{ ...items[2], details: { ...urgentDetails, admin_approval_required: true } }],
    }))).toThrow(/approval/i);
    expect(() => parseDashboardFeed(feed({
      items: [{ ...items[3], details: { ...dailyDetails, expense_included: true } }],
    }))).toThrow(/expense/i);
    expect(() => parseDashboardFeed(feed({
      items: [{
        ...items[2],
        details: { ...urgentDetails, evidence_accessible: false },
      }],
    }))).toThrow(/row authorization/i);
  });

  it("validates cursor consistency and exact tuple payloads", () => {
    const cursor = { recorded_at: timestamp, entity_id: "expense-1", kind: "expense" };
    expect(parseDashboardFeed(feed({ has_more: true, next_cursor: cursor }))).toMatchObject({
      hasMore: true,
      nextCursor: { recordedAt: timestamp, entityId: "expense-1", kind: "expense" },
    });
    expect(dashboardCursorPayload({
      recordedAt: timestamp,
      entityId: "expense-1",
      kind: "expense",
    })).toEqual(cursor);
    expect(() => parseDashboardFeed(feed({ has_more: true, next_cursor: null }))).toThrow(/pagination/i);
    expect(() => parseDashboardFeed(feed({
      has_more: true,
      next_cursor: { ...cursor, offset: 50 },
    }))).toThrow(/shape/i);
  });

  it("rejects rolled-over calendar dates", () => {
    expect(() => parseDashboardFeed(feed({
      items: [{ ...items[0], work_date: "2026-02-31" }],
    }))).toThrow(/work date/i);
  });
});

describe("complete Client/Admin dashboard v2 contract", () => {
  it("parses every exact six-kind field, author, Rep filter, and Daily composition", () => {
    const parsed = parseDashboardFeed(feedV2());
    expect(parsed).toMatchObject({ contractVersion: 2, repFilter: null });
    expect(parsed.items.every((item) => item.author?.displayName === "Clarence Field"))
      .toBe(true);
    expect(parsed.items[0]).toMatchObject({
      kind: "routine_inspection",
      details: {
        contractVersion: "complete",
        resultValue: "defect_found",
        containerLabels: ["BIN-ROUTINE-42", "CONTAINER-ROUTINE-43"],
        traceability: null,
      },
    });
    expect(parsed.items[1]).toMatchObject({
      kind: "rework",
      details: {
        contractVersion: "complete",
        containerLabels: [],
        reworkTypeOther: "Deburr connector seat",
        returnedToProduction: "unknown",
      },
    });
    expect(parsed.items[2]).toMatchObject({
      kind: "urgent_incident",
      details: {
        incidentReference: "incident-client-reference-42",
        partNumber: "PN-URGENT-42",
        partLabels: ["PART-LABEL-42", "PART-LABEL-43"],
        containerLabels: ["CONTAINER-LABEL-42"],
        partLabelAvailability: { status: "provided", reason: null },
        containerLabelAvailability: { status: "provided", reason: null },
        traceabilityStatus: "provided",
        zeroTraceabilityConfirmed: false,
        issue: "Connector damage found during final inspection.",
        areaCode: "line",
        areaValue: "Line 4",
        immediateAction: "Contained suspect material.",
        levelOfConcernCode: "high",
        levelOfConcernValue: "High",
        returnToSupplier: "no",
        sortRequested: "yes",
        rmaRequired: "yes",
        rmaNumber: "RMA-URGENT-42",
        revisionKind: "preliminary",
        investigationStatus: "not_started",
      },
    });
    expect(parsed.items[3]).toMatchObject({
      kind: "daily_report",
      details: {
        contractVersion: "complete",
        areasWalkedCount: 2,
        incidentsCount: 1,
        noIssues: false,
        revision: { number: 2, kind: "amendment" },
        sourceActivities: [
          { recordKind: "routine_inspection", localRecordId: null },
          { recordKind: "rework", localRecordId: null },
          { recordKind: "urgent_incident" },
        ],
      },
    });
    const daily = parsed.items[3];
    expect(daily.kind).toBe("daily_report");
    if (daily.kind !== "daily_report") throw new Error("Expected the Daily fixture");
    expect(Object.hasOwn(daily.details.sourceActivities[2], "details")).toBe(false);
  });

  it("requires exact v2 envelopes and does not accept mixed or partial item contracts", () => {
    expect(() => parseDashboardFeed({ ...feedV2(), contract_version: 1 })).toThrow(/version/i);
    expect(() => parseDashboardFeed(feedV2({ contract_version: 2, rep_scope: null })))
      .toThrow(/shape/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{ ...v2Items[0], author: undefined }],
    }))).toThrow(/author/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{ ...v2Items[0], details: qualityDetails }],
    }))).toThrow(/contract version/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[3],
        details: { ...dailyV2, area_walks: [{ ...dailyV2.area_walks[0], visited: true }] },
      }],
    }))).toThrow(/shape/i);
  });

  it("strictly validates paired Urgent label availability with one exact rollout shape", () => {
    const parsed = parseDashboardFeed(feedV2({ items: [v2Items[2]] }));
    expect(parsed.items[0]).toMatchObject({
      kind: "urgent_incident",
      details: {
        partLabelAvailability: { status: "provided", reason: null },
        containerLabelAvailability: { status: "provided", reason: null },
      },
    });

    const {
      part_label_availability: _partAvailabilityOmitted,
      container_label_availability: _containerAvailabilityOmitted,
      ...urgentBeforeAvailability
    } = urgentV2;
    const compatible = parseDashboardFeed(feedV2({
      items: [{ ...v2Items[2], details: urgentBeforeAvailability }],
    }));
    expect(compatible.items[0]).toMatchObject({
      kind: "urgent_incident",
      details: {
        partLabelAvailability: null,
        containerLabelAvailability: null,
      },
    });

    const unavailableReason = "Container label was unreadable at the station.";
    const unavailable = parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[2],
        details: {
          ...urgentV2,
          container_labels: [],
          container_label_availability: {
            status: "unavailable",
            reason: unavailableReason,
          },
        },
      }],
    }));
    expect(unavailable.items[0]).toMatchObject({
      details: {
        containerLabels: [],
        containerLabelAvailability: {
          status: "unavailable",
          reason: unavailableReason,
        },
      },
    });

    const { container_label_availability: _missingPair, ...partAvailabilityOnly } = urgentV2;
    expect(() => parseDashboardFeed(feedV2({
      items: [{ ...v2Items[2], details: partAvailabilityOnly }],
    }))).toThrow(/supplied together/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[2],
        details: {
          ...urgentV2,
          part_label_availability: {
            ...urgentV2.part_label_availability,
            source: "browser",
          },
        },
      }],
    }))).toThrow(/shape/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[2],
        details: {
          ...urgentV2,
          part_labels: [],
          part_label_availability: { status: "provided", reason: null },
        },
      }],
    }))).toThrow(/inconsistent/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[2],
        details: {
          ...urgentV2,
          part_label_availability: {
            status: "unavailable",
            reason: "Part label was unavailable at scan time.",
          },
        },
      }],
    }))).toThrow(/inconsistent/i);

    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[2],
        details: {
          ...urgentV2,
          part_label_availability: {
            status: "provided",
            reason: "A reason is forbidden when labels were provided.",
          },
        },
      }],
    }))).toThrow(/inconsistent/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[2],
        details: {
          ...urgentV2,
          part_label_availability: { status: "unknown", reason: null },
        },
      }],
    }))).toThrow(/status/i);

    for (const reason of [
      null,
      "Too short",
      "----------A1",
      `ABC${"x".repeat(498)}`,
      "Part label\nwas unavailable.",
      "Part label\u200B was unavailable.",
    ]) {
      expect(() => parseDashboardFeed(feedV2({
        items: [{
          ...v2Items[2],
          details: {
            ...urgentV2,
            part_labels: [],
            part_label_availability: { status: "unavailable", reason },
          },
        }],
      }))).toThrow(/availability|reason/i);
    }
  });

  it("strictly parses new label arrays and tolerates only the exact pre-label v2 shapes", () => {
    const parsed = parseDashboardFeed(feedV2({
      items: [v2Items[0], v2Items[1]],
    }));
    expect(parsed.items[0]).toMatchObject({
      kind: "routine_inspection",
      details: {
        containerLabels: ["BIN-ROUTINE-42", "CONTAINER-ROUTINE-43"],
      },
    });
    expect(parsed.items[1]).toMatchObject({
      kind: "rework",
      details: { containerLabels: [] },
    });

    const { container_labels: _routineOmitted, ...routineWithoutContainerLabels } = routineV2;
    const { container_labels: _reworkOmitted, ...reworkWithoutContainerLabels } = reworkV2;
    const compatible = parseDashboardFeed(feedV2({
      items: [
        { ...v2Items[0], details: routineWithoutContainerLabels },
        { ...v2Items[1], details: reworkWithoutContainerLabels },
        {
          ...v2Items[3],
          details: {
            ...dailyV2,
            source_activities: [
              { ...routineSourceV2, details: routineWithoutContainerLabels },
              { ...reworkSourceV2, details: reworkWithoutContainerLabels },
              urgentSourceV2,
            ],
          },
        },
      ],
    }));
    expect(compatible.items[0]).toMatchObject({ details: { containerLabels: [] } });
    expect(compatible.items[1]).toMatchObject({ details: { containerLabels: [] } });
    expect(compatible.items[2]).toMatchObject({
      kind: "daily_report",
      details: {
        sourceActivities: [
          { details: { containerLabels: [] } },
          { details: { containerLabels: [] } },
          { recordKind: "urgent_incident" },
        ],
      },
    });
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[1],
        details: { ...reworkV2, container_labels: ["BIN-OK", 42] },
      }],
    }))).toThrow(/BIN \/ container label/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[0],
        details: { ...routineWithoutContainerLabels, unexpected_field: "rejected" },
      }],
    }))).toThrow(/shape/i);
  });

  it("enforces shared label bounds while allowing visible scanner separator tokens", () => {
    const visibleSeparators = "BIN-42<GS>LOT-7<RS>SHIFT-A<EOT>";
    const parsed = parseDashboardFeed(feedV2({
      items: [
        {
          ...v2Items[0],
          details: { ...routineV2, container_labels: [visibleSeparators] },
        },
        {
          ...v2Items[2],
          details: {
            ...urgentV2,
            part_labels: [visibleSeparators],
            container_labels: [visibleSeparators],
          },
        },
      ],
    }));
    expect(parsed.items[0]).toMatchObject({
      details: { containerLabels: [visibleSeparators] },
    });
    expect(parsed.items[1]).toMatchObject({
      details: {
        partLabels: [visibleSeparators],
        containerLabels: [visibleSeparators],
      },
    });

    const invalidRoutineLabels = [
      Array.from({ length: 51 }, (_, index) => `BIN-${index}`),
      ["X".repeat(257)],
      ["BIN-42\u001DLOT-7"],
      ["BIN-42\nLOT-7"],
      ["BIN-42\u200BLOT-7"],
    ];
    for (const containerLabels of invalidRoutineLabels) {
      expect(() => parseDashboardFeed(feedV2({
        items: [{
          ...v2Items[0],
          details: { ...routineV2, container_labels: containerLabels },
        }],
      }))).toThrow(/BIN \/ container label/i);
    }

    for (const [field, labels] of [
      ["part_labels", Array.from({ length: 51 }, (_, index) => `PART-${index}`)],
      ["container_labels", ["X".repeat(257)]],
      ["part_labels", ["PART-42\u001ELOT-7"]],
    ] as const) {
      expect(() => parseDashboardFeed(feedV2({
        items: [{
          ...v2Items[2],
          details: { ...urgentV2, [field]: labels },
        }],
      }))).toThrow(/Urgent (?:part|container) label/i);
    }
  });

  it("preserves every exact Rework key when historical mobile fields are null", () => {
    const parsed = parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[1],
        details: {
          ...reworkV2,
          part_number: null,
          quantity_reworked: null,
          rework_type_code: null,
          rework_type_value: null,
          rework_type_other: null,
          returned_to_production: null,
          work_completed: null,
        },
      }],
    }));
    expect(parsed.items[0]).toMatchObject({
      kind: "rework",
      details: {
        partNumber: null,
        quantityReworked: null,
        timeSpentMinutes: 47,
        reworkTypeCode: null,
        reworkTypeValue: null,
        reworkTypeOther: null,
        returnedToProduction: null,
        workCompleted: null,
      },
    });
  });

  it("does not invent a missing historical Rework Other value", () => {
    const parsed = parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[1],
        details: {
          ...reworkV2,
          rework_type_value: null,
          rework_type_other: null,
        },
      }],
    }));
    expect(parsed.items[0]).toMatchObject({
      kind: "rework",
      details: {
        reworkTypeCode: "other",
        reworkTypeValue: null,
        reworkTypeOther: null,
      },
    });
  });

  it("rejects rate/pay fields and incomplete or different-day Daily source cards", () => {
    expect(() => parseDashboardFeed(feedV2({
      items: [{ ...v2Items[4], details: { ...hoursDetails, billing_rate: 125 } }],
    }))).toThrow(/transport material|shape/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[3],
        details: {
          ...dailyV2,
          source_activities: [
            { ...routineSourceV2, work_date: "2026-08-13" },
            reworkSourceV2,
            urgentSourceV2,
          ],
        },
      }],
    }))).toThrow(/different work date/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[3],
        details: {
          ...dailyV2,
          source_activities: [{ ...routineSourceV2, details: null }],
          source_activity_ids: ["routine-v2"],
        },
      }],
    }))).toThrow(/details/i);
    expect(() => parseDashboardFeed(feedV2({
      items: [{
        ...v2Items[3],
        details: {
          ...dailyV2,
          source_activity_ids: ["local-composition-id", "rework-v2", "incident-v2"],
        },
      }],
    }))).toThrow(/safe source cards/i);
  });

  it("validates snapshot Rep-filter echoes, authors, and Client role boundaries", () => {
    const filteredFeed = feedV2({
      rep_filter: author.id,
      items: v2Items.filter((item) => item.kind === "urgent_incident" || item.kind === "daily_report"),
    });
    const clientActor = {
      ...actorResponse,
      actor: { display_name: "Client Reviewer", role: "client", role_label: "Client" },
      capabilities: {
        ...actorResponse.capabilities,
        quality_sources: false,
        hours: false,
        client_overtime_review: true,
        expenses: false,
        finance_evidence: false,
        configuration_attention: false,
      },
    };
    const snapshot = {
      status: "ok",
      record_kind: "mobile_dashboard_snapshot",
      server_timestamp: timestamp,
      contract_version: 2,
      rep_filter: author.id,
      actor: clientActor,
      feed: filteredFeed,
    };
    expect(parseDashboardSnapshot(snapshot)).toMatchObject({
      contractVersion: 2,
      repFilter: author.id,
    });
    expect(() => parseDashboardSnapshot({ ...snapshot, rep_filter: "rep-other" }))
      .toThrow(/metadata is inconsistent/i);
    const parsedClient = parseDashboardSnapshot(snapshot);
    expect(() => validateDashboardFeedForActor(parsedClient.feed, parsedClient.actor, "rep-other"))
      .toThrow(/selected IDS author/i);
    expect(() => parseDashboardSnapshot({
      ...snapshot,
      feed: feedV2({ rep_filter: author.id, items: [v2Items[5]] }),
    })).toThrow(/outside actor capabilities/i);
  });
});

describe("Client overtime review contract", () => {
  const response = {
    status: "ok",
    record_kind: "client_overtime_review_feed",
    server_timestamp: timestamp,
    has_more: false,
    next_cursor: null,
    items: [{
      overtime_entry_id: "ot-1",
      entity_id: "hours-1",
      assignment_id: "assignment-1",
      project_id: "project-1",
      work_date: "2026-08-14",
      overtime_hours: 1.5,
      work_type: null,
      work_summary: "Containment overtime",
      review_state: "pending",
      submitted_at: timestamp,
    }],
  };

  it("accepts the exact pending-only all-assignment projection", () => {
    expect(parseClientOvertimeFeed(response)).toMatchObject({
      items: [{ overtimeEntryId: "ot-1", reviewState: "pending" }],
    });
  });

  it("validates the exact exclusive overtime tuple cursor", () => {
    const cursor = { submitted_at: timestamp, overtime_entry_id: "ot-1" };
    expect(parseClientOvertimeFeed({
      ...response,
      has_more: true,
      next_cursor: cursor,
    })).toMatchObject({
      hasMore: true,
      nextCursor: { submittedAt: timestamp, overtimeEntryId: "ot-1" },
    });
    expect(clientOvertimeCursorPayload({
      submittedAt: timestamp,
      overtimeEntryId: "ot-1",
    })).toEqual(cursor);
    expect(() => parseClientOvertimeFeed({
      ...response,
      has_more: true,
      next_cursor: null,
    })).toThrow(/pagination/i);
    expect(() => parseClientOvertimeFeed({
      ...response,
      has_more: true,
      next_cursor: { ...cursor, assignment_id: "private" },
    })).toThrow(/shape/i);
  });

  it("rejects non-pending, extra private, and embedded error shapes", () => {
    expect(() => parseClientOvertimeFeed({
      ...response,
      items: [{ ...response.items[0], review_state: "approved" }],
    })).toThrow(/review state/i);
    expect(() => parseClientOvertimeFeed({
      ...response,
      items: [{ ...response.items[0], rep_name: "Private Rep" }],
    })).toThrow(/shape/i);
    expect(() => parseClientOvertimeFeed({
      status: "error",
      record_kind: "client_overtime_review_feed",
      server_timestamp: timestamp,
      has_more: false,
      next_cursor: null,
      items: [],
    })).toThrow(/not confirmed/i);
  });
});
