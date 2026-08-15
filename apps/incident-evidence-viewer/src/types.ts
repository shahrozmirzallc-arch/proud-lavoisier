export type EvidenceState =
  | "uploading"
  | "verified"
  | "not_provided"
  | "rejected"
  | "retiring"
  | "retired";

export type EvidenceRole =
  | "image_original"
  | "image_annotation"
  | "image_marked"
  | "video_original";

export interface EvidenceGroup {
  mediaGroupId: string;
  kind: "image" | "video";
  displayOrder: number;
  title: string | null;
  note: string | null;
  durationMs: number | null;
}

export interface EvidenceAttachment {
  attachmentId: string;
  mediaGroupId: string;
  role: EvidenceRole;
  sortOrder: number;
  accessState: "private_incident_authorized";
}

export interface IncidentEvidence {
  accessScope: "ids_internal_full";
  incidentId: string;
  serverTimestamp: string;
  state: EvidenceState;
  groups: EvidenceGroup[];
  attachments: EvidenceAttachment[];
}

export type ClientEvidenceKind = "marked_image" | "submitted_video";

export interface ClientEvidenceGroup {
  groupId: string;
  kind: ClientEvidenceKind;
  displayOrder: number;
  title: string | null;
  note: string | null;
  durationMs: number | null;
}

export interface ClientEvidenceAttachment {
  attachmentId: string;
  groupId: string;
  kind: ClientEvidenceKind;
  displayOrder: number;
}

export interface ClientIncidentEvidence {
  accessScope: "external_client_released";
  incidentId: string;
  serverTimestamp: string;
  state: EvidenceState;
  groups: ClientEvidenceGroup[];
  attachments: ClientEvidenceAttachment[];
}

export type ViewerIncidentEvidence = IncidentEvidence | ClientIncidentEvidence;
export type EvidenceAudience = "ids_internal" | "external_client";

export interface AttachmentGrant {
  incidentId: string;
  attachmentId: string;
  action: "view" | "download";
  accessGrantId: string;
  signedUrl: string;
  serverTimestamp: string;
  expiresAt: string;
}

export interface DashboardCapabilities {
  qualitySources: boolean;
  incidentCore: boolean;
  incidentEvidence: boolean;
  dailyReports: boolean;
  hours: boolean;
  clientOvertimeReview: boolean;
  expenses: boolean;
  financeEvidence: boolean;
  configurationAttention: boolean;
}

export type DashboardRoleLabel =
  | "IDS Rep"
  | "IDS Office"
  | "IDS Office & Finance"
  | "IDS Finance"
  | "Client"
  | "Supplier"
  | "Mandatory IDS"
  | "Authenticated";

export interface DashboardActor {
  displayName: string;
  role: string;
  roleLabel: DashboardRoleLabel;
  capabilities: DashboardCapabilities;
  serverTimestamp: string;
}

export interface DashboardItemAuthor {
  id: string;
  displayName: string;
}

export type DashboardFeedKind =
  | "routine_inspection"
  | "rework"
  | "urgent_incident"
  | "daily_report"
  | "hours"
  | "expense";

export interface DashboardCursor {
  recordedAt: string;
  entityId: string;
  kind: DashboardFeedKind;
}

export interface DashboardFeedItemBase {
  kind: DashboardFeedKind;
  entityId: string;
  projectId: string;
  assignmentId: string | null;
  workDate: string;
  recordedAt: string;
  title: string;
  summary: string | null;
  state: string;
  /** Absent only on the frozen pre-author feed contract. */
  author?: DashboardItemAuthor;
}

export interface QualityDeliveryDetails {
  recordDelivery: string | null;
  dashboardDelivery: string | null;
  emailDelivery: string | null;
}

export interface LegacyQualitySourceDetails extends QualityDeliveryDetails {
  contractVersion: "legacy";
  partId: string | null;
  quantity: number | null;
  timeSpentMinutes: number | null;
}

export interface RoutineInspectionDetails extends QualityDeliveryDetails {
  contractVersion: "complete";
  partNumber: string;
  containerLabels: string[];
  traceability: string | null;
  quantityInspected: number;
  quantityPassed: number;
  quantityRejected: number;
  resultCode: "no_issue" | "defect_found" | "monitor" | "other";
  resultValue: string;
  notes: string | null;
}

export interface ReworkDetails extends QualityDeliveryDetails {
  contractVersion: "complete";
  partNumber: string | null;
  containerLabels: string[];
  quantityReworked: number | null;
  timeSpentMinutes: number;
  reworkTypeCode: "sort" | "repair" | "replace" | "other" | null;
  reworkTypeValue: string | null;
  reworkTypeOther: string | null;
  returnedToProduction: "yes" | "no" | "unknown" | null;
  workCompleted: string | null;
}

export type QualitySourceDetails =
  | LegacyQualitySourceDetails
  | RoutineInspectionDetails
  | ReworkDetails;

export interface UrgentLabelAvailability {
  status: "provided" | "unavailable";
  reason: string | null;
}

export interface UrgentIncidentDetails {
  contractVersion: "legacy" | "complete";
  incidentReference?: string;
  partNumber?: string | null;
  partLabels?: string[];
  containerLabels?: string[];
  /** Null only while reading the exact complete-v2 shape from before this field existed. */
  partLabelAvailability?: UrgentLabelAvailability | null;
  /** Null only while reading the exact complete-v2 shape from before this field existed. */
  containerLabelAvailability?: UrgentLabelAvailability | null;
  traceabilityStatus?: string | null;
  zeroTraceabilityConfirmed?: boolean;
  partId: string | null;
  defectType: string | null;
  issue?: string | null;
  areaCode?: string | null;
  areaValue?: string | null;
  area: string | null;
  quantity: number | null;
  immediateAction?: string | null;
  actionTaken: string | null;
  levelOfConcernCode?: string | null;
  levelOfConcernValue?: string | null;
  levelOfConcernOther?: string | null;
  levelOfConcern: string | null;
  returnToSupplier?: "yes" | "no" | "unknown" | null;
  sortRequested?: "yes" | "no" | "unknown" | null;
  rmaRequired?: "yes" | "no" | "unknown" | null;
  rmaNumber?: string | null;
  noMediaReason?: string | null;
  revisionNumber: number | null;
  revisionKind?: string | null;
  revisionLabel?: string | null;
  investigationStatus?: string | null;
  investigationStatusLabel?: string | null;
  releaseStatus: string | null;
  releasedToClient: boolean;
  recordDelivery: string | null;
  dashboardDelivery: string | null;
  externalDelivery: string | null;
  externalDeliveryMessage: string | null;
  adminAttention: string | null;
  adminApprovalRequired: false;
  mediaEvidenceStatus: string | null;
  evidenceAccessible: boolean;
}

export interface DailySourceActivity {
  recordKind: "routine_inspection" | "rework" | "urgent_incident";
  entityId: string;
  localRecordId: string | null;
  occurredAt: string;
  workDate: string;
  title: string | null;
  summary: string | null;
  referenceOnly: boolean;
  initialRevisionNumber: number | null;
  details?: RoutineInspectionDetails | ReworkDetails;
}

export interface DailyAreaWalk {
  areaId: string;
  areaName: string;
  status: "all_good" | "defect" | "not_visited";
  visited: boolean;
  spokeWith: string | null;
  floorNotes: string | null;
  notVisitedReason: string | null;
}

export interface DailyReportRevision {
  number: number;
  kind: "initial" | "amendment";
  parentReportId: string | null;
  reason: string | null;
  amendedAt: string | null;
}

export interface DailyHoursSummary {
  source: string;
  selection: string;
  workDate: string;
  entryCount: number;
  submissionCount: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  overtimePendingReviewHours: number;
}

export interface DailyReportDetails {
  contractVersion: "legacy" | "complete";
  areasWalkedCount: number;
  areaWalks?: DailyAreaWalk[];
  incidentsCount: number;
  sourceActivityIds: string[];
  sourceActivities: DailySourceActivity[];
  hoursSummary: DailyHoursSummary;
  expenseIncluded: false;
  recordDelivery: string | null;
  dashboardDelivery: string | null;
  externalDelivery: string | null;
  externalDeliveryMessage: string | null;
  adminAttention: string | null;
  adminApprovalRequired: false;
  finalComments?: string | null;
  outstandingIssue?: "yes" | "no" | "unknown";
  handoverNote?: string | null;
  revision?: DailyReportRevision;
  noIssues?: boolean;
}

export interface HoursDetails {
  entryCount: number;
  reportedHours: number;
  regularHours: number;
  overtimeHours: number;
  workType: string | null;
  workSummary: string | null;
  approvalState: string;
  clientReviewStatus: string;
  recordDelivery: string | null;
  financeVisibility: string | null;
  financialProcessingState: "not_evaluated_requires_ag_finance_workflow";
}

export interface ExpenseDetails {
  categoryCode: string;
  categoryValue: string;
  categoryOther: string | null;
  amount: number;
  currency: string;
  businessReason: string | null;
  mileageDistance: number | null;
  mileageUnit: string | null;
  attachmentCount: number;
  recordDelivery: string | null;
  financeVisibility: string | null;
}

export type DashboardFeedItem =
  | (DashboardFeedItemBase & {
      kind: "routine_inspection";
      details: LegacyQualitySourceDetails | RoutineInspectionDetails;
    })
  | (DashboardFeedItemBase & {
      kind: "rework";
      details: LegacyQualitySourceDetails | ReworkDetails;
    })
  | (DashboardFeedItemBase & {
      kind: "urgent_incident";
      details: UrgentIncidentDetails;
    })
  | (DashboardFeedItemBase & {
      kind: "daily_report";
      details: DailyReportDetails;
    })
  | (DashboardFeedItemBase & {
      kind: "hours";
      details: HoursDetails;
    })
  | (DashboardFeedItemBase & {
      kind: "expense";
      details: ExpenseDetails;
    });

export type DashboardFeedItemOfKind<Kind extends DashboardFeedKind> = Extract<
  DashboardFeedItem,
  { kind: Kind }
>;

export interface DashboardFeedPage {
  contractVersion: 1 | 2;
  repFilter: string | null;
  serverTimestamp: string;
  hasMore: boolean;
  nextCursor: DashboardCursor | null;
  items: DashboardFeedItem[];
}

export interface DashboardAtomicSnapshot {
  contractVersion: 1 | 2;
  repFilter: string | null;
  serverTimestamp: string;
  actor: DashboardActor;
  feed: DashboardFeedPage;
}

export interface ClientOvertimeItem {
  overtimeEntryId: string;
  entityId: string;
  assignmentId: string;
  projectId: string;
  workDate: string;
  overtimeHours: number;
  workType: string | null;
  workSummary: string | null;
  reviewState: "pending";
  submittedAt: string;
}

export interface ClientOvertimeCursor {
  submittedAt: string;
  overtimeEntryId: string;
}

export interface ClientOvertimeFeed {
  serverTimestamp: string;
  hasMore: boolean;
  nextCursor: ClientOvertimeCursor | null;
  items: ClientOvertimeItem[];
}

export type DashboardSection =
  | "overview"
  | "quality"
  | "urgent"
  | "daily"
  | "hours"
  | "overtime"
  | "expenses"
  | "configuration";
