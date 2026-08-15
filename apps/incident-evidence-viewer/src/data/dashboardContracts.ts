import type {
  ClientOvertimeFeed,
  ClientOvertimeCursor,
  ClientOvertimeItem,
  DailyHoursSummary,
  DailyAreaWalk,
  DailyReportDetails,
  DailyReportRevision,
  DailySourceActivity,
  DashboardActor,
  DashboardAtomicSnapshot,
  DashboardCapabilities,
  DashboardCursor,
  DashboardFeedItem,
  DashboardFeedKind,
  DashboardFeedPage,
  DashboardItemAuthor,
  DashboardRoleLabel,
  ExpenseDetails,
  HoursDetails,
  LegacyQualitySourceDetails,
  ReworkDetails,
  RoutineInspectionDetails,
  UrgentIncidentDetails,
  UrgentLabelAvailability,
} from "../types";

type JsonRecord = Record<string, unknown>;

const ACTOR_RESPONSE_KEYS = new Set([
  "status",
  "record_kind",
  "server_timestamp",
  "actor",
  "capabilities",
]);
const LEGACY_SNAPSHOT_RESPONSE_KEYS = new Set([
  "status",
  "record_kind",
  "server_timestamp",
  "actor",
  "feed",
]);
const SNAPSHOT_RESPONSE_KEYS = new Set([
  ...LEGACY_SNAPSHOT_RESPONSE_KEYS,
  "contract_version",
  "rep_filter",
]);
const ACTOR_KEYS = new Set(["display_name", "role", "role_label"]);
const ROLE_LABELS: readonly DashboardRoleLabel[] = [
  "IDS Rep",
  "IDS Office",
  "IDS Office & Finance",
  "IDS Finance",
  "Client",
  "Supplier",
  "Mandatory IDS",
  "Authenticated",
];
const CAPABILITY_KEYS = new Set([
  "quality_sources",
  "incident_core",
  "incident_evidence",
  "daily_reports",
  "hours",
  "client_overtime_review",
  "expenses",
  "finance_evidence",
  "configuration_attention",
]);
const LEGACY_FEED_RESPONSE_KEYS = new Set([
  "status",
  "record_kind",
  "server_timestamp",
  "has_more",
  "next_cursor",
  "items",
]);
const FEED_RESPONSE_KEYS = new Set([
  ...LEGACY_FEED_RESPONSE_KEYS,
  "contract_version",
  "rep_filter",
]);
const CURSOR_KEYS = new Set(["recorded_at", "entity_id", "kind"]);
const FEED_ITEM_KEYS = new Set([
  "kind",
  "entity_id",
  "project_id",
  "assignment_id",
  "work_date",
  "recorded_at",
  "title",
  "summary",
  "state",
  "details",
]);
const FEED_ITEM_WITH_AUTHOR_KEYS = new Set([...FEED_ITEM_KEYS, "author"]);
const AUTHOR_KEYS = new Set(["id", "display_name"]);
const LEGACY_QUALITY_DETAILS_KEYS = new Set([
  "part_id",
  "quantity",
  "time_spent_minutes",
  "record_delivery",
  "dashboard_delivery",
  "email_delivery",
]);
const ROUTINE_DETAILS_KEYS = new Set([
  "part_number",
  "container_labels",
  "traceability",
  "quantity_inspected",
  "quantity_passed",
  "quantity_rejected",
  "result_code",
  "result_value",
  "notes",
  "record_delivery",
  "dashboard_delivery",
  "email_delivery",
]);
const REWORK_DETAILS_KEYS = new Set([
  "part_number",
  "container_labels",
  "quantity_reworked",
  "time_spent_minutes",
  "rework_type_code",
  "rework_type_value",
  "rework_type_other",
  "returned_to_production",
  "work_completed",
  "record_delivery",
  "dashboard_delivery",
  "email_delivery",
]);
const ROUTINE_DETAILS_KEYS_BEFORE_CONTAINER_LABELS = new Set(
  [...ROUTINE_DETAILS_KEYS].filter((key) => key !== "container_labels"),
);
const REWORK_DETAILS_KEYS_BEFORE_CONTAINER_LABELS = new Set(
  [...REWORK_DETAILS_KEYS].filter((key) => key !== "container_labels"),
);
const URGENT_DETAILS_KEYS = new Set([
  "part_id",
  "defect_type",
  "area",
  "quantity",
  "action_taken",
  "level_of_concern",
  "revision_number",
  "release_status",
  "released_to_client",
  "record_delivery",
  "dashboard_delivery",
  "external_delivery",
  "external_delivery_message",
  "admin_attention",
  "admin_approval_required",
  "media_evidence_status",
  "evidence_accessible",
]);
const COMPLETE_URGENT_DETAILS_KEYS = new Set([
  "incident_reference",
  "part_id",
  "part_number",
  "part_labels",
  "container_labels",
  "part_label_availability",
  "container_label_availability",
  "traceability_status",
  "zero_traceability_confirmed",
  "defect_type",
  "issue",
  "area_code",
  "area_value",
  "area",
  "quantity",
  "immediate_action",
  "action_taken",
  "level_of_concern_code",
  "level_of_concern_value",
  "level_of_concern_other",
  "level_of_concern",
  "return_to_supplier",
  "sort_requested",
  "rma_required",
  "rma_number",
  "no_media_reason",
  "release_status",
  "released_to_client",
  "revision_number",
  "revision_kind",
  "revision_label",
  "investigation_status",
  "investigation_status_label",
  "record_delivery",
  "dashboard_delivery",
  "external_delivery",
  "media_evidence_status",
  "evidence_accessible",
]);
const COMPLETE_URGENT_DETAILS_KEYS_BEFORE_LABEL_AVAILABILITY = new Set(
  [...COMPLETE_URGENT_DETAILS_KEYS].filter(
    (key) => key !== "part_label_availability" && key !== "container_label_availability",
  ),
);
const URGENT_LABEL_AVAILABILITY_KEYS = new Set(["status", "reason"]);
const DAILY_DETAILS_KEYS = new Set([
  "areas_walked_count",
  "incidents_count",
  "source_activity_ids",
  "source_activities",
  "hours_summary",
  "expense_included",
  "record_delivery",
  "dashboard_delivery",
  "external_delivery",
  "external_delivery_message",
  "admin_attention",
  "admin_approval_required",
]);
const COMPLETE_DAILY_DETAILS_KEYS = new Set([
  "area_walks",
  "final_comments",
  "outstanding_issue",
  "handover_note",
  "no_issues",
  "source_activity_ids",
  "source_activities",
  "hours_summary",
  "expense_included",
  "record_delivery",
  "dashboard_delivery",
  "external_delivery",
  "revision",
]);
const DAILY_AREA_WALK_KEYS = new Set([
  "area_id",
  "area_name",
  "status",
  "spoke_with",
  "floor_notes",
  "not_visited_reason",
]);
const DAILY_REVISION_KEYS = new Set([
  "number",
  "kind",
  "parent_report_id",
  "amendment_reason",
  "amended_at",
]);
const DAILY_HOURS_KEYS = new Set([
  "source",
  "selection",
  "work_date",
  "entry_count",
  "submission_count",
  "regular_hours",
  "overtime_hours",
  "total_hours",
  "overtime_pending_review_hours",
]);
const DAILY_SOURCE_ACTIVITY_KEYS = new Set([
  "record_kind",
  "entity_id",
  "local_record_id",
  "occurred_at",
  "work_date",
  "title",
  "summary",
  "reference_only",
  "initial_revision_number",
]);
const COMPLETE_DAILY_SOURCE_ACTIVITY_KEYS = new Set([
  "record_kind",
  "entity_id",
  "occurred_at",
  "work_date",
  "title",
  "summary",
  "reference_only",
  "initial_revision_number",
  "details",
]);
const HOURS_DETAILS_KEYS = new Set([
  "entry_count",
  "reported_hours",
  "regular_hours",
  "overtime_hours",
  "work_type",
  "work_summary",
  "approval_state",
  "client_review_status",
  "record_delivery",
  "finance_visibility",
  "financial_processing_state",
]);
const EXPENSE_DETAILS_KEYS = new Set([
  "category_code",
  "category_value",
  "category_other",
  "amount",
  "currency",
  "business_reason",
  "mileage_distance",
  "mileage_unit",
  "attachment_count",
  "record_delivery",
  "finance_visibility",
]);
const OVERTIME_RESPONSE_KEYS = new Set([
  "status",
  "record_kind",
  "server_timestamp",
  "has_more",
  "next_cursor",
  "items",
]);
const OVERTIME_CURSOR_KEYS = new Set(["submitted_at", "overtime_entry_id"]);
const OVERTIME_ITEM_KEYS = new Set([
  "overtime_entry_id",
  "entity_id",
  "assignment_id",
  "project_id",
  "work_date",
  "overtime_hours",
  "work_type",
  "work_summary",
  "review_state",
  "submitted_at",
]);
const FEED_KINDS: readonly DashboardFeedKind[] = [
  "routine_inspection",
  "rework",
  "urgent_incident",
  "daily_report",
  "hours",
  "expense",
];
const DAILY_SOURCE_KINDS = new Set([
  "routine_inspection",
  "rework",
  "urgent_incident",
]);
const FORBIDDEN_DATA_KEYS = new Set([
  "bucket",
  "bucket_id",
  "object_name",
  "path",
  "receipt_photo",
  "receipt_url",
  "signed_url",
  "storage_path",
  "token",
  "url",
  "billing_rate",
  "pay_rate",
  "hourly_rate",
  "rate",
  "salary",
  "wage",
  "gross_revenue",
  "net_profit",
  "margin_percent",
  "payroll",
]);
const PRIVATE_TRANSPORT_KEY_PATTERN =
  /(?:^|_)(?:access|refresh|api)?_?(?:token|secret|key)$|^(?:authorization|cookie|set_cookie)$/i;
const TECHNICAL_METADATA_KEY_PATTERN =
  /^(?:local_media_id|verified_sha256|verified_byte_size|detected_mime_type|verified_width|verified_height|verified_duration_ms|access_grant_id)$/i;
const ABSOLUTE_TRANSPORT_URL_PATTERN = /\b(?:https?|wss?):\/\/[^\s]+/i;
const PRIVATE_STORAGE_PATH_PATTERN =
  /(?:\/storage\/v1\/|(?:^|[\\/])(?:sealed|staging)[\\/]v1[\\/])/i;
const CREDENTIAL_TOKEN_PATTERN =
  /\b(?:eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}|sb_(?:secret|publishable)_[A-Za-z0-9_-]{16,})\b/;
const HIDDEN_OR_NONPRINTABLE_PATTERN = /[\p{C}\p{Zl}\p{Zp}]/u;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value: JsonRecord, keys: Set<string>, label: string): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.size || actual.some((key) => !keys.has(key))) {
    throw new Error(`${label} returned an unexpected data shape.`);
  }
}

function hasExactKeys(value: JsonRecord, keys: Set<string>): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.size && actual.every((key) => keys.has(key));
}

function assertNoPrivateTransportMaterial(value: unknown): void {
  if (
    typeof value === "string" &&
    (ABSOLUTE_TRANSPORT_URL_PATTERN.test(value) ||
      PRIVATE_STORAGE_PATH_PATTERN.test(value) ||
      CREDENTIAL_TOKEN_PATTERN.test(value))
  ) {
    throw new Error("Dashboard data exposed private transport material.");
  }
  if (Array.isArray(value)) {
    for (const item of value) assertNoPrivateTransportMaterial(item);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, item] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (
      FORBIDDEN_DATA_KEYS.has(normalizedKey) ||
      /(?:^|_)(?:signed|download|receipt|media)?_?url$/i.test(normalizedKey) ||
      /(?:^|_)(?:storage|object)_?(?:path|name)$/i.test(normalizedKey) ||
      PRIVATE_TRANSPORT_KEY_PATTERN.test(normalizedKey) ||
      TECHNICAL_METADATA_KEY_PATTERN.test(normalizedKey)
    ) {
      throw new Error("Dashboard data exposed private transport material.");
    }
    assertNoPrivateTransportMaterial(item);
  }
}

function requiredString(value: unknown, label: string, maximum = 4000): string {
  if (
    typeof value !== "string" ||
    value.trim().length < 1 ||
    value.length > maximum ||
    /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function nullableString(value: unknown, label: string, maximum = 4000): string | null {
  return value === null ? null : requiredString(value, label, maximum);
}

function stringArray(
  value: unknown,
  label: string,
  maximumItems = 100,
  maximumItemLength = 1000,
): string[] {
  if (!Array.isArray(value) || value.length > maximumItems) {
    throw new Error(`${label} is invalid.`);
  }
  return value.map((item) => {
    const parsed = requiredString(item, label, maximumItemLength);
    if (HIDDEN_OR_NONPRINTABLE_PATTERN.test(parsed)) {
      throw new Error(`${label} is invalid.`);
    }
    return parsed;
  });
}

function requiredPrintableReason(value: unknown, label: string): string {
  const reason = requiredString(value, label, 500);
  if (
    reason.length < 10 ||
    HIDDEN_OR_NONPRINTABLE_PATTERN.test(reason) ||
    (reason.match(/[\p{L}\p{N}]/gu) ?? []).length < 3
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return reason;
}

function parseUrgentLabelAvailability(
  value: unknown,
  labels: string[],
  label: string,
): UrgentLabelAvailability {
  if (!isRecord(value)) throw new Error(`${label} is invalid.`);
  assertExactKeys(value, URGENT_LABEL_AVAILABILITY_KEYS, label);
  if (value.status !== "provided" && value.status !== "unavailable") {
    throw new Error(`${label} status is invalid.`);
  }
  const reason = value.reason === null
    ? null
    : requiredPrintableReason(value.reason, `${label} reason`);
  if (
    (value.status === "provided" && (labels.length === 0 || reason !== null)) ||
    (value.status === "unavailable" && (labels.length !== 0 || reason === null))
  ) {
    throw new Error(`${label} is inconsistent with its label values.`);
  }
  return { status: value.status, reason };
}

function nullableTriState(
  value: unknown,
  label: string,
): "yes" | "no" | "unknown" | null {
  const result = nullableString(value, label, 20);
  if (result !== null && !new Set(["yes", "no", "unknown"]).has(result)) {
    throw new Error(`${label} is invalid.`);
  }
  return result as "yes" | "no" | "unknown" | null;
}

function timestamp(value: unknown, label: string): string {
  const result = requiredString(value, label, 64);
  if (!Number.isFinite(Date.parse(result)) || !/[zZ]|[+-]\d\d:\d\d$/.test(result)) {
    throw new Error(`${label} is invalid.`);
  }
  return result;
}

function workDate(value: unknown, label: string): string {
  const result = requiredString(value, label, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result);
  if (!match) throw new Error(`${label} is invalid.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    throw new Error(`${label} is invalid.`);
  }
  return result;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new Error(`${label} is invalid.`);
  return value;
}

function exactFalse(value: unknown, label: string): false {
  if (value !== false) throw new Error(`${label} is invalid.`);
  return false;
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

function nullableNumber(value: unknown, label: string): number | null {
  return value === null ? null : finiteNumber(value, label);
}

function nullableInteger(value: unknown, label: string): number | null {
  return value === null ? null : integer(value, label);
}

function nonnegativeInteger(value: unknown, label: string): number {
  const result = integer(value, label);
  if (result < 0) throw new Error(`${label} is invalid.`);
  return result;
}

function positiveInteger(value: unknown, label: string): number {
  const result = integer(value, label);
  if (result < 1) throw new Error(`${label} is invalid.`);
  return result;
}

function parseAuthor(value: unknown): DashboardItemAuthor {
  if (!isRecord(value)) throw new Error("Dashboard item author is invalid.");
  assertExactKeys(value, AUTHOR_KEYS, "Dashboard item author");
  return {
    id: requiredString(value.id, "Dashboard item author ID", 200),
    displayName: requiredString(value.display_name, "Dashboard item author name", 200),
  };
}

function parseCapabilities(value: unknown): DashboardCapabilities {
  if (!isRecord(value)) throw new Error("Dashboard capabilities are invalid.");
  assertExactKeys(value, CAPABILITY_KEYS, "Dashboard capabilities");
  return {
    qualitySources: boolean(value.quality_sources, "Quality sources capability"),
    incidentCore: boolean(value.incident_core, "Incident core capability"),
    incidentEvidence: boolean(value.incident_evidence, "Incident evidence capability"),
    dailyReports: boolean(value.daily_reports, "Daily reports capability"),
    hours: boolean(value.hours, "Hours capability"),
    clientOvertimeReview: boolean(
      value.client_overtime_review,
      "Client overtime capability",
    ),
    expenses: boolean(value.expenses, "Expenses capability"),
    financeEvidence: boolean(value.finance_evidence, "Finance evidence capability"),
    configurationAttention: boolean(
      value.configuration_attention,
      "Configuration attention capability",
    ),
  };
}

export function parseDashboardActor(value: unknown): DashboardActor {
  assertNoPrivateTransportMaterial(value);
  if (!isRecord(value)) throw new Error("Dashboard actor response is invalid.");
  assertExactKeys(value, ACTOR_RESPONSE_KEYS, "Dashboard actor");
  if (value.status !== "ok" || value.record_kind !== "mobile_dashboard_actor") {
    throw new Error("Dashboard actor response is not confirmed.");
  }
  if (!isRecord(value.actor)) throw new Error("Dashboard actor identity is invalid.");
  assertExactKeys(value.actor, ACTOR_KEYS, "Dashboard actor identity");
  const roleLabel = requiredString(value.actor.role_label, "Actor role label", 160);
  if (!ROLE_LABELS.includes(roleLabel as DashboardRoleLabel)) {
    throw new Error("Actor role label is invalid.");
  }
  const capabilities = parseCapabilities(value.capabilities);
  if (
    roleLabel === "Client" &&
    (capabilities.qualitySources ||
      capabilities.hours ||
      capabilities.expenses ||
      capabilities.financeEvidence ||
      capabilities.configurationAttention)
  ) {
    throw new Error("Client actor capabilities exceed the external viewer boundary.");
  }
  if (
    new Set(["Supplier", "Mandatory IDS", "Authenticated", "IDS Finance"]).has(roleLabel) &&
    capabilities.incidentEvidence
  ) {
    throw new Error("Actor evidence capability exceeds its role boundary.");
  }
  return {
    displayName: requiredString(value.actor.display_name, "Actor display name", 200),
    role: requiredString(value.actor.role, "Actor role", 100),
    roleLabel: roleLabel as DashboardRoleLabel,
    capabilities,
    serverTimestamp: timestamp(value.server_timestamp, "Actor server timestamp"),
  };
}

export function parseDashboardSnapshot(value: unknown): DashboardAtomicSnapshot {
  assertNoPrivateTransportMaterial(value);
  if (!isRecord(value)) throw new Error("Dashboard snapshot response is invalid.");
  const contractVersion = Object.hasOwn(value, "contract_version") ? 2 : 1;
  assertExactKeys(
    value,
    contractVersion === 2 ? SNAPSHOT_RESPONSE_KEYS : LEGACY_SNAPSHOT_RESPONSE_KEYS,
    "Dashboard snapshot",
  );
  if (contractVersion === 2 && value.contract_version !== 2) {
    throw new Error("Dashboard snapshot contract version is invalid.");
  }
  if (value.status !== "ok" || value.record_kind !== "mobile_dashboard_snapshot") {
    throw new Error("Dashboard snapshot response is not confirmed.");
  }
  const serverTimestamp = timestamp(value.server_timestamp, "Dashboard snapshot timestamp");
  const repFilter = contractVersion === 2
    ? nullableString(value.rep_filter, "Dashboard snapshot Rep filter", 200)
    : null;
  const actor = parseDashboardActor(value.actor);
  const feed = parseDashboardFeed(value.feed);
  if (
    actor.serverTimestamp !== serverTimestamp ||
    feed.serverTimestamp !== serverTimestamp
  ) {
    throw new Error("Dashboard snapshot timestamps are inconsistent.");
  }
  if (feed.contractVersion !== contractVersion || feed.repFilter !== repFilter) {
    throw new Error("Dashboard snapshot contract metadata is inconsistent.");
  }
  validateDashboardFeedForActor(feed, actor, repFilter);
  return { contractVersion, repFilter, serverTimestamp, actor, feed };
}

function parseCursor(value: unknown): DashboardCursor | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error("Dashboard cursor is invalid.");
  assertExactKeys(value, CURSOR_KEYS, "Dashboard cursor");
  if (!FEED_KINDS.includes(value.kind as DashboardFeedKind)) {
    throw new Error("Dashboard cursor kind is invalid.");
  }
  return {
    recordedAt: timestamp(value.recorded_at, "Dashboard cursor timestamp"),
    entityId: requiredString(value.entity_id, "Dashboard cursor entity ID", 200),
    kind: value.kind as DashboardFeedKind,
  };
}

function parseLegacyQualityDetails(value: JsonRecord): LegacyQualitySourceDetails {
  assertExactKeys(value, LEGACY_QUALITY_DETAILS_KEYS, "Legacy quality source details");
  return {
    contractVersion: "legacy",
    partId: nullableString(value.part_id, "Quality part ID", 300),
    quantity: nullableInteger(value.quantity, "Quality quantity"),
    timeSpentMinutes: nullableInteger(value.time_spent_minutes, "Quality time spent"),
    recordDelivery: nullableString(value.record_delivery, "Quality record delivery", 160),
    dashboardDelivery: nullableString(
      value.dashboard_delivery,
      "Quality dashboard delivery",
      160,
    ),
    emailDelivery: nullableString(value.email_delivery, "Quality email delivery", 160),
  };
}

function parseRoutineDetails(value: JsonRecord): RoutineInspectionDetails {
  const hasContainerLabels = Object.hasOwn(value, "container_labels");
  assertExactKeys(
    value,
    hasContainerLabels
      ? ROUTINE_DETAILS_KEYS
      : ROUTINE_DETAILS_KEYS_BEFORE_CONTAINER_LABELS,
    "Routine inspection details",
  );
  const quantityInspected = positiveInteger(
    value.quantity_inspected,
    "Routine quantity inspected",
  );
  const quantityPassed = nonnegativeInteger(value.quantity_passed, "Routine quantity passed");
  const quantityRejected = nonnegativeInteger(
    value.quantity_rejected,
    "Routine quantity rejected",
  );
  if (quantityPassed + quantityRejected !== quantityInspected) {
    throw new Error("Routine inspection quantities are inconsistent.");
  }
  const resultCode = requiredString(value.result_code, "Routine result code", 80);
  if (!new Set(["no_issue", "defect_found", "monitor", "other"]).has(resultCode)) {
    throw new Error("Routine result code is invalid.");
  }
  const resultValue = requiredString(value.result_value, "Routine resolved result", 800);
  if (resultCode === "other" && resultValue.trim().toLowerCase() === "other") {
    throw new Error("Routine Other result is missing its actual value.");
  }
  return {
    contractVersion: "complete",
    partNumber: requiredString(value.part_number, "Routine part number", 300),
    // The empty array represents an old v2 projection that supplied no label field;
    // it does not infer that the source record itself had no labels.
    containerLabels: hasContainerLabels
      ? stringArray(
          value.container_labels,
          "Routine BIN / container label",
          50,
          256,
        )
      : [],
    traceability: nullableString(value.traceability, "Routine traceability", 1000),
    quantityInspected,
    quantityPassed,
    quantityRejected,
    resultCode: resultCode as RoutineInspectionDetails["resultCode"],
    resultValue,
    notes: nullableString(value.notes, "Routine notes", 12000),
    recordDelivery: nullableString(value.record_delivery, "Routine record delivery", 160),
    dashboardDelivery: nullableString(value.dashboard_delivery, "Routine dashboard delivery", 160),
    emailDelivery: nullableString(value.email_delivery, "Routine email delivery", 160),
  };
}

function parseReworkDetails(value: JsonRecord): ReworkDetails {
  const hasContainerLabels = Object.hasOwn(value, "container_labels");
  assertExactKeys(
    value,
    hasContainerLabels
      ? REWORK_DETAILS_KEYS
      : REWORK_DETAILS_KEYS_BEFORE_CONTAINER_LABELS,
    "Rework details",
  );
  const reworkTypeCode = nullableString(value.rework_type_code, "Rework type code", 80);
  if (
    reworkTypeCode !== null &&
    !new Set(["sort", "repair", "replace", "other"]).has(reworkTypeCode)
  ) {
    throw new Error("Rework type code is invalid.");
  }
  const reworkTypeValue = nullableString(
    value.rework_type_value,
    "Rework resolved type",
    800,
  );
  const reworkTypeOther = nullableString(
    value.rework_type_other,
    "Rework custom type",
    800,
  );
  if (
    (reworkTypeCode === "other" &&
      ((reworkTypeValue !== null && reworkTypeValue.trim().toLowerCase() === "other") ||
        (reworkTypeOther !== null && reworkTypeOther.trim().toLowerCase() === "other") ||
        (reworkTypeValue !== null &&
          reworkTypeOther !== null &&
          reworkTypeValue !== reworkTypeOther))) ||
    (reworkTypeCode !== "other" && reworkTypeOther !== null)
  ) {
    throw new Error("Rework Other type is inconsistent.");
  }
  const returnedToProduction = nullableString(
    value.returned_to_production,
    "Rework return-to-production state",
    20,
  );
  if (
    returnedToProduction !== null &&
    !new Set(["yes", "no", "unknown"]).has(returnedToProduction)
  ) {
    throw new Error("Rework return-to-production state is invalid.");
  }
  const quantityReworked = nullableInteger(value.quantity_reworked, "Rework quantity");
  if (quantityReworked !== null && quantityReworked < 1) {
    throw new Error("Rework quantity is invalid.");
  }
  return {
    contractVersion: "complete",
    partNumber: nullableString(value.part_number, "Rework part number", 300),
    // See Routine above: absence is rollout compatibility, not invented evidence.
    containerLabels: hasContainerLabels
      ? stringArray(
          value.container_labels,
          "Rework BIN / container label",
          50,
          256,
        )
      : [],
    quantityReworked,
    timeSpentMinutes: positiveInteger(value.time_spent_minutes, "Rework time spent"),
    reworkTypeCode: reworkTypeCode as ReworkDetails["reworkTypeCode"],
    reworkTypeValue,
    reworkTypeOther,
    returnedToProduction: returnedToProduction as ReworkDetails["returnedToProduction"],
    workCompleted: nullableString(value.work_completed, "Rework work completed", 12000),
    recordDelivery: nullableString(value.record_delivery, "Rework record delivery", 160),
    dashboardDelivery: nullableString(value.dashboard_delivery, "Rework dashboard delivery", 160),
    emailDelivery: nullableString(value.email_delivery, "Rework email delivery", 160),
  };
}

function parseQualityDetails(
  value: unknown,
  kind: "routine_inspection",
): LegacyQualitySourceDetails | RoutineInspectionDetails;
function parseQualityDetails(
  value: unknown,
  kind: "rework",
): LegacyQualitySourceDetails | ReworkDetails;
function parseQualityDetails(
  value: unknown,
  kind: "routine_inspection" | "rework",
): LegacyQualitySourceDetails | RoutineInspectionDetails | ReworkDetails {
  if (!isRecord(value)) throw new Error("Quality source details are invalid.");
  if (hasExactKeys(value, LEGACY_QUALITY_DETAILS_KEYS)) {
    return parseLegacyQualityDetails(value);
  }
  return kind === "routine_inspection"
    ? parseRoutineDetails(value)
    : parseReworkDetails(value);
}

function parseUrgentDetails(value: unknown): UrgentIncidentDetails {
  if (!isRecord(value)) throw new Error("Urgent Incident details are invalid.");
  const complete = Object.hasOwn(value, "incident_reference");
  const hasPartLabelAvailability = Object.hasOwn(value, "part_label_availability");
  const hasContainerLabelAvailability = Object.hasOwn(
    value,
    "container_label_availability",
  );
  if (complete && hasPartLabelAvailability !== hasContainerLabelAvailability) {
    throw new Error("Urgent label availability fields must be supplied together.");
  }
  const hasLabelAvailability = hasPartLabelAvailability && hasContainerLabelAvailability;
  assertExactKeys(
    value,
    complete
      ? hasLabelAvailability
        ? COMPLETE_URGENT_DETAILS_KEYS
        : COMPLETE_URGENT_DETAILS_KEYS_BEFORE_LABEL_AVAILABILITY
      : URGENT_DETAILS_KEYS,
    "Urgent Incident details",
  );
  const mediaEvidenceStatus = nullableString(
    value.media_evidence_status,
    "Urgent media evidence status",
    160,
  );
  const evidenceAccessible = boolean(value.evidence_accessible, "Urgent evidence access");
  if (!evidenceAccessible && mediaEvidenceStatus !== null) {
    throw new Error("Urgent evidence status escaped its row authorization.");
  }
  const area = nullableString(value.area, "Urgent area", 800);
  const actionTaken = nullableString(value.action_taken, "Urgent action taken", 12000);
  const levelOfConcern = nullableString(
    value.level_of_concern,
    "Urgent concern level",
    800,
  );
  const completeFields = complete
    ? (() => {
        const partLabels = stringArray(value.part_labels, "Urgent part label", 50, 256);
        const containerLabels = stringArray(
          value.container_labels,
          "Urgent container label",
          50,
          256,
        );
        const partLabelAvailability = hasLabelAvailability
          ? parseUrgentLabelAvailability(
              value.part_label_availability,
              partLabels,
              "Urgent part-label availability",
            )
          : null;
        const containerLabelAvailability = hasLabelAvailability
          ? parseUrgentLabelAvailability(
              value.container_label_availability,
              containerLabels,
              "Urgent container-label availability",
            )
          : null;
        const traceabilityStatus = nullableString(
          value.traceability_status,
          "Urgent traceability status",
          80,
        );
        if (
          traceabilityStatus !== null &&
          !new Set([
            "provided",
            "partial",
            "not_provided",
            "unavailable",
            "unavailable_confirmed",
          ]).has(traceabilityStatus)
        ) {
          throw new Error("Urgent traceability status is invalid.");
        }
        const areaCode = nullableString(value.area_code, "Urgent area code", 80);
        if (
          areaCode !== null &&
          !new Set(["line", "sequence", "repair", "scrap", "other"]).has(areaCode)
        ) {
          throw new Error("Urgent area code is invalid.");
        }
        const areaValue = nullableString(value.area_value, "Urgent resolved area", 800);
        if (areaValue !== area) {
          throw new Error("Urgent area values are inconsistent.");
        }
        const immediateAction = nullableString(
          value.immediate_action,
          "Urgent immediate action",
          12000,
        );
        if (immediateAction !== actionTaken) {
          throw new Error("Urgent action values are inconsistent.");
        }
        const levelOfConcernValue = nullableString(
          value.level_of_concern_value,
          "Urgent resolved concern level",
          800,
        );
        if (levelOfConcernValue !== levelOfConcern) {
          throw new Error("Urgent concern values are inconsistent.");
        }
        const returnToSupplier = nullableTriState(
          value.return_to_supplier,
          "Urgent return-to-supplier state",
        );
        const sortRequested = nullableTriState(
          value.sort_requested,
          "Urgent supplier-sort state",
        );
        const rmaRequired = nullableTriState(value.rma_required, "Urgent RMA state");
        const rmaNumber = nullableString(value.rma_number, "Urgent RMA number", 300);
        if (
          (rmaRequired === "yes" && rmaNumber === null) ||
          (rmaRequired !== "yes" && rmaNumber !== null)
        ) {
          throw new Error("Urgent RMA fields are inconsistent.");
        }
        return {
          incidentReference: requiredString(
            value.incident_reference,
            "Urgent Incident reference",
            200,
          ),
          partNumber: nullableString(value.part_number, "Urgent part number", 1000),
          partLabels,
          containerLabels,
          partLabelAvailability,
          containerLabelAvailability,
          traceabilityStatus,
          zeroTraceabilityConfirmed: boolean(
            value.zero_traceability_confirmed,
            "Urgent zero-traceability confirmation",
          ),
          issue: nullableString(value.issue, "Urgent issue", 12000),
          areaCode,
          areaValue,
          immediateAction,
          levelOfConcernCode: nullableString(
            value.level_of_concern_code,
            "Urgent concern code",
            160,
          ),
          levelOfConcernValue,
          levelOfConcernOther: nullableString(
            value.level_of_concern_other,
            "Urgent custom concern level",
            800,
          ),
          returnToSupplier,
          sortRequested,
          rmaRequired,
          rmaNumber,
          noMediaReason: nullableString(
            value.no_media_reason,
            "Urgent no-media reason",
            4000,
          ),
          revisionKind: nullableString(value.revision_kind, "Urgent revision kind", 160),
          revisionLabel: nullableString(value.revision_label, "Urgent revision label", 300),
          investigationStatus: nullableString(
            value.investigation_status,
            "Urgent investigation status",
            160,
          ),
          investigationStatusLabel: nullableString(
            value.investigation_status_label,
            "Urgent investigation status label",
            300,
          ),
        };
      })()
    : {};
  return {
    contractVersion: complete ? "complete" : "legacy",
    ...completeFields,
    partId: nullableString(value.part_id, "Urgent part ID", 300),
    defectType: nullableString(value.defect_type, "Urgent defect type", 800),
    area,
    quantity: nullableInteger(value.quantity, "Urgent quantity"),
    actionTaken,
    levelOfConcern,
    revisionNumber: nullableInteger(value.revision_number, "Urgent revision number"),
    releaseStatus: nullableString(value.release_status, "Urgent release status", 160),
    releasedToClient: boolean(value.released_to_client, "Urgent client release state"),
    recordDelivery: nullableString(value.record_delivery, "Urgent record delivery", 160),
    dashboardDelivery: nullableString(
      value.dashboard_delivery,
      "Urgent dashboard delivery",
      160,
    ),
    externalDelivery: nullableString(value.external_delivery, "Urgent external delivery", 160),
    externalDeliveryMessage: complete
      ? null
      : nullableString(
          value.external_delivery_message,
          "Urgent external delivery message",
          4000,
        ),
    adminAttention: complete
      ? null
      : nullableString(value.admin_attention, "Urgent admin attention", 160),
    adminApprovalRequired: complete
      ? false
      : exactFalse(value.admin_approval_required, "Urgent admin approval requirement"),
    mediaEvidenceStatus,
    evidenceAccessible,
  };
}

function parseDailySourceActivity(value: unknown): DailySourceActivity {
  if (!isRecord(value)) throw new Error("Daily source activity is invalid.");
  const complete = Object.hasOwn(value, "details");
  assertExactKeys(
    value,
    complete ? COMPLETE_DAILY_SOURCE_ACTIVITY_KEYS : DAILY_SOURCE_ACTIVITY_KEYS,
    "Daily source activity",
  );
  if (!DAILY_SOURCE_KINDS.has(String(value.record_kind))) {
    throw new Error("Daily source activity kind is invalid.");
  }
  const recordKind = value.record_kind as DailySourceActivity["recordKind"];
  const referenceOnly = boolean(value.reference_only, "Daily source reference state");
  const summary = nullableString(value.summary, "Daily source summary", 12000);
  const revision = nullableInteger(
    value.initial_revision_number,
    "Daily source initial revision",
  );
  if (recordKind === "urgent_incident") {
    if (
      !referenceOnly ||
      summary !== null ||
      (complete && value.details !== null) ||
      revision === null ||
      revision < 1
    ) {
      throw new Error("Daily Urgent source projection is invalid.");
    }
  } else if (referenceOnly || revision !== null) {
    throw new Error("Daily Quality source projection is invalid.");
  }
  const result: DailySourceActivity = {
    recordKind,
    entityId: requiredString(value.entity_id, "Daily source entity ID", 200),
    localRecordId: complete
      ? null
      : requiredString(value.local_record_id, "Daily source local record ID", 200),
    occurredAt: timestamp(value.occurred_at, "Daily source occurred timestamp"),
    workDate: workDate(value.work_date, "Daily source work date"),
    title: nullableString(value.title, "Daily source title", 300),
    summary,
    referenceOnly,
    initialRevisionNumber: revision,
  };
  if (complete && recordKind !== "urgent_incident") {
    const details = recordKind === "routine_inspection"
      ? parseQualityDetails(value.details, "routine_inspection")
      : parseQualityDetails(value.details, "rework");
    if (details.contractVersion !== "complete") {
      throw new Error("Daily Quality source details are incomplete.");
    }
    result.details = details;
  }
  return result;
}

function parseDailyAreaWalk(value: unknown): DailyAreaWalk {
  if (!isRecord(value)) throw new Error("Daily area walk is invalid.");
  assertExactKeys(value, DAILY_AREA_WALK_KEYS, "Daily area walk");
  const status = requiredString(value.status, "Daily area status", 40);
  if (!new Set(["all_good", "defect", "not_visited"]).has(status)) {
    throw new Error("Daily area status is invalid.");
  }
  const visited = status !== "not_visited";
  const spokeWith = nullableString(value.spoke_with, "Daily area spoke-with", 1000);
  const floorNotes = nullableString(value.floor_notes, "Daily area floor notes", 12000);
  const notVisitedReason = nullableString(
    value.not_visited_reason,
    "Daily area not-visited reason",
    4000,
  );
  if (status === "not_visited") {
    if (spokeWith !== null || notVisitedReason === null) {
      throw new Error("Daily not-visited area is inconsistent.");
    }
  } else if (spokeWith === null || notVisitedReason !== null) {
    throw new Error("Daily visited area is inconsistent.");
  }
  if (status === "defect" && floorNotes === null) {
    throw new Error("Daily defect area requires floor notes.");
  }
  return {
    areaId: requiredString(value.area_id, "Daily area ID", 160),
    areaName: requiredString(value.area_name, "Daily area name", 300),
    status: status as DailyAreaWalk["status"],
    visited,
    spokeWith,
    floorNotes,
    notVisitedReason,
  };
}

function parseDailyRevision(value: unknown): DailyReportRevision {
  if (!isRecord(value)) throw new Error("Daily revision is invalid.");
  assertExactKeys(value, DAILY_REVISION_KEYS, "Daily revision");
  const number = positiveInteger(value.number, "Daily revision number");
  const kind = requiredString(value.kind, "Daily revision kind", 40);
  if (kind !== "initial" && kind !== "amendment") {
    throw new Error("Daily revision kind is invalid.");
  }
  const parentReportId = nullableString(
    value.parent_report_id,
    "Daily parent report ID",
    200,
  );
  const reason = nullableString(value.amendment_reason, "Daily amendment reason", 4000);
  const amendedAt = value.amended_at === null
    ? null
    : timestamp(value.amended_at, "Daily amended timestamp");
  if (
    (kind === "initial" &&
      (number !== 1 || parentReportId !== null || reason !== null || amendedAt !== null)) ||
    (kind === "amendment" &&
      (number < 2 || parentReportId === null || reason === null || amendedAt === null))
  ) {
    throw new Error("Daily revision fields are inconsistent.");
  }
  return {
    number,
    kind,
    parentReportId,
    reason,
    amendedAt,
  };
}

function parseDailyHoursSummary(value: unknown): DailyHoursSummary {
  if (!isRecord(value)) throw new Error("Daily Hours summary is invalid.");
  assertExactKeys(value, DAILY_HOURS_KEYS, "Daily Hours summary");
  return {
    source: requiredString(value.source, "Daily Hours source", 160),
    selection: requiredString(value.selection, "Daily Hours selection", 160),
    workDate: workDate(value.work_date, "Daily Hours work date"),
    entryCount: integer(value.entry_count, "Daily Hours entry count"),
    submissionCount: integer(value.submission_count, "Daily Hours submission count"),
    regularHours: finiteNumber(value.regular_hours, "Daily regular hours"),
    overtimeHours: finiteNumber(value.overtime_hours, "Daily overtime hours"),
    totalHours: finiteNumber(value.total_hours, "Daily total hours"),
    overtimePendingReviewHours: finiteNumber(
      value.overtime_pending_review_hours,
      "Daily overtime pending review hours",
    ),
  };
}

function parseDailyDetails(value: unknown): DailyReportDetails {
  if (!isRecord(value)) throw new Error("Daily report details are invalid.");
  const complete = Object.hasOwn(value, "area_walks");
  assertExactKeys(
    value,
    complete ? COMPLETE_DAILY_DETAILS_KEYS : DAILY_DETAILS_KEYS,
    "Daily report details",
  );
  if (!Array.isArray(value.source_activity_ids)) {
    throw new Error("Daily source activity IDs are invalid.");
  }
  if (!Array.isArray(value.source_activities)) {
    throw new Error("Daily source activities are invalid.");
  }
  const sourceActivityIds = value.source_activity_ids.map((item) =>
    requiredString(item, "Daily source activity ID", 200),
  );
  const sourceActivities = value.source_activities.map(parseDailySourceActivity);
  if (new Set(sourceActivityIds).size !== sourceActivityIds.length) {
    throw new Error("Daily source activity IDs contain duplicates.");
  }
  if (new Set(sourceActivities.map((item) => item.entityId)).size !== sourceActivities.length) {
    throw new Error("Daily source activities contain duplicates.");
  }
  if (
    sourceActivityIds.length !== sourceActivities.length ||
    sourceActivityIds.some((id, index) => id !== sourceActivities[index]?.entityId)
  ) {
    throw new Error("Daily source activity IDs do not match the safe source cards.");
  }
  const parsedAreaWalks = complete
    ? (() => {
        if (!Array.isArray(value.area_walks)) throw new Error("Daily area walks are invalid.");
        return value.area_walks.map(parseDailyAreaWalk);
      })()
    : null;
  const areasWalkedCount = complete
    ? parsedAreaWalks!.length
    : nonnegativeInteger(value.areas_walked_count, "Daily areas-walked count");
  const incidentsCount = complete
    ? sourceActivities.filter((source) => source.recordKind === "urgent_incident").length
    : nonnegativeInteger(value.incidents_count, "Daily Incident count");
  const result: DailyReportDetails = {
    contractVersion: complete ? "complete" : "legacy",
    areasWalkedCount,
    incidentsCount,
    sourceActivityIds,
    sourceActivities,
    hoursSummary: parseDailyHoursSummary(value.hours_summary),
    expenseIncluded: exactFalse(value.expense_included, "Daily expense inclusion"),
    recordDelivery: nullableString(value.record_delivery, "Daily record delivery", 160),
    dashboardDelivery: nullableString(
      value.dashboard_delivery,
      "Daily dashboard delivery",
      160,
    ),
    externalDelivery: nullableString(value.external_delivery, "Daily external delivery", 160),
    externalDeliveryMessage: complete
      ? null
      : nullableString(
          value.external_delivery_message,
          "Daily external delivery message",
          4000,
        ),
    adminAttention: complete
      ? null
      : nullableString(value.admin_attention, "Daily admin attention", 160),
    adminApprovalRequired: complete
      ? false
      : exactFalse(value.admin_approval_required, "Daily admin approval requirement"),
  };
  if (complete) {
    const areaWalks = parsedAreaWalks!;
    if (new Set(areaWalks.map((walk) => walk.areaId)).size !== areaWalks.length) {
      throw new Error("Daily area walks contain duplicates.");
    }
    if (
      sourceActivities.some(
        (source) => source.recordKind !== "urgent_incident" && !source.details,
      )
    ) {
      throw new Error("Complete Daily source cards are missing Quality details.");
    }
    const outstandingIssue = requiredString(
      value.outstanding_issue,
      "Daily outstanding-issue state",
      40,
    );
    if (!new Set(["yes", "no", "unknown"]).has(outstandingIssue)) {
      throw new Error("Daily outstanding-issue state is invalid.");
    }
    const handoverNote = nullableString(value.handover_note, "Daily handover note", 12000);
    if (
      (outstandingIssue === "no" && handoverNote !== null) ||
      (outstandingIssue !== "no" && handoverNote === null)
    ) {
      throw new Error("Daily handover fields are inconsistent.");
    }
    result.areaWalks = areaWalks;
    result.finalComments = nullableString(
      value.final_comments,
      "Daily final comments",
      12000,
    );
    result.outstandingIssue = outstandingIssue as DailyReportDetails["outstandingIssue"];
    result.handoverNote = handoverNote;
    result.revision = parseDailyRevision(value.revision);
    result.noIssues = boolean(value.no_issues, "Daily no-issues state");
  }
  return result;
}

function parseHoursDetails(value: unknown): HoursDetails {
  if (!isRecord(value)) throw new Error("Hours details are invalid.");
  assertExactKeys(value, HOURS_DETAILS_KEYS, "Hours details");
  if (value.financial_processing_state !== "not_evaluated_requires_ag_finance_workflow") {
    throw new Error("Hours financial-processing state is invalid.");
  }
  return {
    entryCount: integer(value.entry_count, "Hours entry count"),
    reportedHours: finiteNumber(value.reported_hours, "Reported hours"),
    regularHours: finiteNumber(value.regular_hours, "Regular hours"),
    overtimeHours: finiteNumber(value.overtime_hours, "Overtime hours"),
    workType: nullableString(value.work_type, "Hours work type", 240),
    workSummary: nullableString(value.work_summary, "Hours work summary", 4000),
    approvalState: requiredString(value.approval_state, "Hours approval state", 160),
    clientReviewStatus: requiredString(
      value.client_review_status,
      "Hours client-review status",
      160,
    ),
    recordDelivery: nullableString(value.record_delivery, "Hours record delivery", 160),
    financeVisibility: nullableString(
      value.finance_visibility,
      "Hours finance visibility",
      160,
    ),
    financialProcessingState: "not_evaluated_requires_ag_finance_workflow",
  };
}

function parseExpenseDetails(value: unknown): ExpenseDetails {
  if (!isRecord(value)) throw new Error("Expense details are invalid.");
  assertExactKeys(value, EXPENSE_DETAILS_KEYS, "Expense details");
  return {
    categoryCode: requiredString(value.category_code, "Expense category code", 160),
    categoryValue: requiredString(value.category_value, "Expense category value", 400),
    categoryOther: nullableString(value.category_other, "Expense other category", 800),
    amount: finiteNumber(value.amount, "Expense amount"),
    currency: requiredString(value.currency, "Expense currency", 16),
    businessReason: nullableString(value.business_reason, "Expense business reason", 4000),
    mileageDistance: nullableNumber(value.mileage_distance, "Expense mileage distance"),
    mileageUnit: nullableString(value.mileage_unit, "Expense mileage unit", 40),
    attachmentCount: integer(value.attachment_count, "Expense attachment count"),
    recordDelivery: nullableString(value.record_delivery, "Expense record delivery", 160),
    financeVisibility: nullableString(
      value.finance_visibility,
      "Expense finance visibility",
      160,
    ),
  };
}

function parseFeedItem(value: unknown, contractVersion: 1 | 2): DashboardFeedItem {
  if (!isRecord(value)) throw new Error("Dashboard feed item is invalid.");
  assertExactKeys(
    value,
    contractVersion === 2 ? FEED_ITEM_WITH_AUTHOR_KEYS : FEED_ITEM_KEYS,
    "Dashboard feed item",
  );
  if (!FEED_KINDS.includes(value.kind as DashboardFeedKind)) {
    throw new Error("Dashboard feed kind is invalid.");
  }
  const kind = value.kind as DashboardFeedKind;
  const common = {
    entityId: requiredString(value.entity_id, "Dashboard entity ID", 200),
    projectId: requiredString(value.project_id, "Dashboard project ID", 200),
    assignmentId: nullableString(value.assignment_id, "Dashboard assignment ID", 200),
    workDate: workDate(value.work_date, "Dashboard work date"),
    recordedAt: timestamp(value.recorded_at, "Dashboard recorded timestamp"),
    title: requiredString(value.title, "Dashboard title", 300),
    summary: nullableString(value.summary, "Dashboard summary", 12000),
    state: requiredString(value.state, "Dashboard state", 160),
    ...(contractVersion === 2 ? { author: parseAuthor(value.author) } : {}),
  };
  let item: DashboardFeedItem;
  switch (kind) {
    case "routine_inspection":
      item = { ...common, kind, details: parseQualityDetails(value.details, kind) };
      break;
    case "rework":
      item = { ...common, kind, details: parseQualityDetails(value.details, kind) };
      break;
    case "urgent_incident":
      item = { ...common, kind, details: parseUrgentDetails(value.details) };
      break;
    case "daily_report":
      item = { ...common, kind, details: parseDailyDetails(value.details) };
      break;
    case "hours":
      item = { ...common, kind, details: parseHoursDetails(value.details) };
      break;
    case "expense":
      item = { ...common, kind, details: parseExpenseDetails(value.details) };
      break;
  }
  if (
    (item.kind === "routine_inspection" || item.kind === "rework") &&
    (item.details.contractVersion === "complete") !== (contractVersion === 2)
  ) {
    throw new Error("Quality details do not match the feed contract version.");
  }
  if (
    (item.kind === "urgent_incident" || item.kind === "daily_report") &&
    (item.details.contractVersion === "complete") !== (contractVersion === 2)
  ) {
    throw new Error("Dashboard details do not match the feed contract version.");
  }
  if (item.kind === "daily_report") {
    if (
      item.details.hoursSummary.workDate !== item.workDate ||
      item.details.sourceActivities.some((source) => source.workDate !== item.workDate)
    ) {
      throw new Error("Daily composition contains a different work date.");
    }
  }
  return item;
}

export function parseDashboardFeed(value: unknown): DashboardFeedPage {
  assertNoPrivateTransportMaterial(value);
  if (!isRecord(value)) throw new Error("Dashboard feed response is invalid.");
  const contractVersion = Object.hasOwn(value, "contract_version") ? 2 : 1;
  assertExactKeys(
    value,
    contractVersion === 2 ? FEED_RESPONSE_KEYS : LEGACY_FEED_RESPONSE_KEYS,
    "Dashboard feed",
  );
  if (contractVersion === 2 && value.contract_version !== 2) {
    throw new Error("Dashboard feed contract version is invalid.");
  }
  if (value.status !== "ok" || value.record_kind !== "mobile_dashboard_feed") {
    throw new Error("Dashboard feed response is not confirmed.");
  }
  if (!Array.isArray(value.items) || value.items.length > 100) {
    throw new Error("Dashboard feed items are invalid.");
  }
  const hasMore = boolean(value.has_more, "Dashboard has-more state");
  const nextCursor = parseCursor(value.next_cursor);
  if (hasMore !== (nextCursor !== null)) {
    throw new Error("Dashboard pagination state is inconsistent.");
  }
  const repFilter = contractVersion === 2
    ? nullableString(value.rep_filter, "Dashboard Rep filter", 200)
    : null;
  const items = value.items.map((item) => parseFeedItem(item, contractVersion));
  const identities = new Set(items.map((item) => `${item.kind}:${item.entityId}`));
  if (identities.size !== items.length) {
    throw new Error("Dashboard feed contains duplicate item identities.");
  }
  if (hasMore) {
    const last = items.at(-1);
    if (
      !last ||
      !nextCursor ||
      nextCursor.recordedAt !== last.recordedAt ||
      nextCursor.entityId !== last.entityId ||
      nextCursor.kind !== last.kind
    ) {
      throw new Error("Dashboard continuation cursor does not match the final item.");
    }
  }
  return {
    contractVersion,
    repFilter,
    serverTimestamp: timestamp(value.server_timestamp, "Dashboard server timestamp"),
    hasMore,
    nextCursor,
    items,
  };
}

export function validateDashboardFeedForActor(
  feed: DashboardFeedPage,
  actor: DashboardActor,
  selectedAuthorId: string | null = null,
): DashboardFeedPage {
  for (const item of feed.items) {
    const capabilityAllows = switchCapability(item.kind, actor.capabilities);
    if (!capabilityAllows) {
      throw new Error("Dashboard feed returned a record outside actor capabilities.");
    }
    if (selectedAuthorId !== null) {
      if (!item.author || item.author.id !== selectedAuthorId) {
        throw new Error("Dashboard feed returned a record outside the selected IDS author.");
      }
    }
    if (actor.roleLabel === "Client") {
      if (item.kind === "urgent_incident") {
        if (
          !item.details.releasedToClient ||
          item.details.externalDeliveryMessage !== null ||
          item.details.adminAttention !== null
        ) {
          throw new Error("Client Urgent projection exposed an internal or unreleased field.");
        }
      }
      if (
        item.kind === "daily_report" &&
        (item.details.externalDeliveryMessage !== null || item.details.adminAttention !== null)
      ) {
        throw new Error("Client Daily projection exposed an internal field.");
      }
    }
  }
  return feed;
}

function switchCapability(
  kind: DashboardFeedKind,
  capabilities: DashboardCapabilities,
): boolean {
  switch (kind) {
    case "routine_inspection":
    case "rework":
      return capabilities.qualitySources;
    case "urgent_incident":
      return capabilities.incidentCore;
    case "daily_report":
      return capabilities.dailyReports;
    case "hours":
      return capabilities.hours;
    case "expense":
      return capabilities.expenses;
  }
}

function parseOvertimeItem(value: unknown): ClientOvertimeItem {
  if (!isRecord(value)) throw new Error("Client overtime item is invalid.");
  assertExactKeys(value, OVERTIME_ITEM_KEYS, "Client overtime item");
  if (value.review_state !== "pending") {
    throw new Error("Client overtime review state is invalid.");
  }
  return {
    overtimeEntryId: requiredString(value.overtime_entry_id, "Overtime entry ID", 200),
    entityId: requiredString(value.entity_id, "Overtime entity ID", 200),
    assignmentId: requiredString(value.assignment_id, "Overtime assignment ID", 200),
    projectId: requiredString(value.project_id, "Overtime project ID", 200),
    workDate: workDate(value.work_date, "Overtime work date"),
    overtimeHours: finiteNumber(value.overtime_hours, "Overtime hours"),
    workType: nullableString(value.work_type, "Overtime work type", 240),
    workSummary: nullableString(value.work_summary, "Overtime work summary", 4000),
    reviewState: "pending",
    submittedAt: timestamp(value.submitted_at, "Overtime submitted timestamp"),
  };
}

function parseOvertimeCursor(value: unknown): ClientOvertimeCursor | null {
  if (value === null) return null;
  if (!isRecord(value)) throw new Error("Client overtime cursor is invalid.");
  assertExactKeys(value, OVERTIME_CURSOR_KEYS, "Client overtime cursor");
  return {
    submittedAt: timestamp(value.submitted_at, "Overtime cursor timestamp"),
    overtimeEntryId: requiredString(
      value.overtime_entry_id,
      "Overtime cursor entry ID",
      200,
    ),
  };
}

export function parseClientOvertimeFeed(value: unknown): ClientOvertimeFeed {
  assertNoPrivateTransportMaterial(value);
  if (!isRecord(value)) throw new Error("Client overtime response is invalid.");
  assertExactKeys(value, OVERTIME_RESPONSE_KEYS, "Client overtime feed");
  if (value.status !== "ok" || value.record_kind !== "client_overtime_review_feed") {
    throw new Error("Client overtime response is not confirmed.");
  }
  if (!Array.isArray(value.items) || value.items.length > 100) {
    throw new Error("Client overtime items are invalid.");
  }
  const hasMore = boolean(value.has_more, "Client overtime has-more state");
  const nextCursor = parseOvertimeCursor(value.next_cursor);
  if (hasMore !== (nextCursor !== null)) {
    throw new Error("Client overtime pagination state is inconsistent.");
  }
  const items = value.items.map(parseOvertimeItem);
  if (new Set(items.map((item) => item.overtimeEntryId)).size !== items.length) {
    throw new Error("Client overtime feed contains duplicate entries.");
  }
  if (hasMore) {
    const last = items.at(-1);
    if (
      !last ||
      !nextCursor ||
      nextCursor.submittedAt !== last.submittedAt ||
      nextCursor.overtimeEntryId !== last.overtimeEntryId
    ) {
      throw new Error("Client overtime cursor does not match the final item.");
    }
  }
  return {
    serverTimestamp: timestamp(value.server_timestamp, "Overtime server timestamp"),
    hasMore,
    nextCursor,
    items,
  };
}

export function dashboardCursorPayload(cursor: DashboardCursor | null): {
  recorded_at: string;
  entity_id: string;
  kind: DashboardFeedKind;
} | null {
  return cursor === null
    ? null
    : { recorded_at: cursor.recordedAt, entity_id: cursor.entityId, kind: cursor.kind };
}

export function clientOvertimeCursorPayload(cursor: ClientOvertimeCursor | null): {
  submitted_at: string;
  overtime_entry_id: string;
} | null {
  return cursor === null
    ? null
    : { submitted_at: cursor.submittedAt, overtime_entry_id: cursor.overtimeEntryId };
}
