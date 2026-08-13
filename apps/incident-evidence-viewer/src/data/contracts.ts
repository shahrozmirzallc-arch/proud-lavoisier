import type {
  AttachmentGrant,
  EvidenceAttachment,
  EvidenceGroup,
  EvidenceRole,
  EvidenceState,
  IncidentEvidence,
  IncidentSummary,
} from "../types";
import { STAGING_ORIGIN } from "../security/environment";

export const INCIDENT_SAFE_COLUMNS = [
  "id",
  "project_id",
  "supplier_id",
  "plant_id",
  "rep_name",
  "part_id",
  "defect_type",
  "area",
  "description",
  "action_taken",
  "returned_to_supplier_status",
  "sort_requested_status",
  "rma_required_status",
  "rma_number",
  "concern_classification",
  "level_of_concern",
  "level_of_concern_other",
  "status",
  "released_at",
  "sent_at",
  "created_at",
  "updated_at",
] as const;

export const INCIDENT_SELECT = INCIDENT_SAFE_COLUMNS.join(",");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_PATH_PART =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const INCIDENT_ID_PATTERN = /^INC-[0-9a-f]{32}$/;
const SEALED_MEDIA_PATH_PATTERN =
  new RegExp(
    `^/storage/v1/object/sign/ids-pulse-incident-evidence/sealed/v1/${UUID_PATH_PART}/${UUID_PATH_PART}/[0-9a-f]{64}\\.(?:jpg|json|mp4)$`,
  );
const FORBIDDEN_TRANSPORT_KEYS = new Set([
  "bucket",
  "bucket_id",
  "object_name",
  "path",
  "sealed_object_name",
  "signed_url",
  "staging_object_name",
  "token",
  "url",
]);

const INCIDENT_KEYS = new Set<string>(INCIDENT_SAFE_COLUMNS);
const EVIDENCE_KEYS = new Set([
  "status",
  "entity_id",
  "server_timestamp",
  "record_kind",
  "incident_id",
  "media_delivery",
  "dashboard_delivery",
  "admin_approval_required",
  "groups",
  "attachments",
]);
const GROUP_KEYS = new Set([
  "media_group_id",
  "kind",
  "display_order",
  "title",
  "note",
  "original_name",
  "duration_ms",
]);
const GROUP_REQUIRED_KEYS = new Set([
  "media_group_id",
  "kind",
  "display_order",
  "original_name",
]);
const ATTACHMENT_KEYS = new Set([
  "attachment_id",
  "local_media_id",
  "media_group_id",
  "role",
  "sort_order",
  "verified_sha256",
  "verified_byte_size",
  "detected_mime_type",
  "verified_width",
  "verified_height",
  "verified_duration_ms",
  "access_state",
]);
const ATTACHMENT_REQUIRED_KEYS = new Set([
  "attachment_id",
  "local_media_id",
  "media_group_id",
  "role",
  "sort_order",
  "verified_sha256",
  "verified_byte_size",
  "detected_mime_type",
  "access_state",
]);
const GRANT_KEYS = new Set([
  "status",
  "entity_id",
  "server_timestamp",
  "incident_id",
  "attachment_id",
  "action",
  "access_grant_id",
  "signed_url",
  "expires_in_seconds",
  "expires_at",
]);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertExactKeys(value: JsonRecord, keys: Set<string>, label: string): void {
  const actual = Object.keys(value);
  if (actual.length !== keys.size || actual.some((key) => !keys.has(key))) {
    throw new Error(`${label} returned an unexpected data shape.`);
  }
}

function assertAllowedKeys(
  value: JsonRecord,
  allowed: Set<string>,
  required: Set<string>,
  label: string,
): void {
  const actual = Object.keys(value);
  if (
    actual.some((key) => !allowed.has(key)) ||
    [...required].some((key) => !Object.hasOwn(value, key))
  ) {
    throw new Error(`${label} returned an unexpected data shape.`);
  }
}

function assertNoTransportMaterial(value: unknown): void {
  if (
    typeof value === "string" &&
    /(?:https?:\/\/|(?:^|\/)(?:sealed|staging)\/v1\/|ids-pulse-incident-evidence)/i.test(value)
  ) {
    throw new Error("Incident evidence exposed private transport material.");
  }
  if (Array.isArray(value)) {
    for (const item of value) assertNoTransportMaterial(item);
    return;
  }
  if (!isRecord(value)) return;
  for (const [key, item] of Object.entries(value)) {
    if (
      FORBIDDEN_TRANSPORT_KEYS.has(key.toLowerCase()) ||
      /(?:^|_)(?:download|signed)?_?url$/i.test(key) ||
      /storage_object/i.test(key)
    ) {
      throw new Error("Incident evidence exposed private transport material.");
    }
    assertNoTransportMaterial(item);
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

function originalFileName(value: unknown): string {
  const result = requiredString(value, "Original name", 180);
  if (result !== result.trim() || /[/\\]/.test(result) || /^\.+$/.test(result)) {
    throw new Error("Original name is invalid.");
  }
  return result;
}

function timestamp(value: unknown, label: string): string {
  const result = requiredString(value, label, 64);
  if (!Number.isFinite(Date.parse(result))) throw new Error(`${label} is invalid.`);
  return result;
}

function boundedInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw new Error(`${label} is invalid.`);
  }
  return Number(value);
}

function nullableInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): number | null {
  return value === null || value === undefined
    ? null
    : boundedInteger(value, label, minimum, maximum);
}

function identifier(value: unknown, label: string): string {
  const result = requiredString(value, label, 160);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(result)) {
    throw new Error(`${label} is invalid.`);
  }
  return result;
}

function uuid(value: unknown, label: string): string {
  const result = requiredString(value, label, 36).toLowerCase();
  if (!UUID_PATTERN.test(result)) throw new Error(`${label} is invalid.`);
  return result;
}

function parseTriState(value: unknown, label: string): "yes" | "no" | "unknown" {
  if (value !== "yes" && value !== "no" && value !== "unknown") {
    throw new Error(`${label} is invalid.`);
  }
  return value;
}

export function parseIncidentRows(value: unknown): IncidentSummary[] {
  if (!Array.isArray(value) || value.length > 200) {
    throw new Error("Incident feed returned an unexpected data shape.");
  }
  return value.map((raw): IncidentSummary => {
    if (!isRecord(raw)) throw new Error("Incident feed returned an invalid row.");
    assertExactKeys(raw, INCIDENT_KEYS, "Incident feed");
    const id = identifier(raw.id, "Incident ID");
    if (!INCIDENT_ID_PATTERN.test(id)) throw new Error("Incident ID is invalid.");
    return {
      id,
      projectId: identifier(raw.project_id, "Project ID"),
      supplierId: raw.supplier_id === null
        ? null
        : identifier(raw.supplier_id, "Supplier ID"),
      plantId: raw.plant_id === null ? null : identifier(raw.plant_id, "Plant ID"),
      repName: requiredString(raw.rep_name, "Rep name", 200),
      partId: raw.part_id === null ? null : identifier(raw.part_id, "Part ID"),
      defectType: nullableString(raw.defect_type, "Defect type", 240),
      area: nullableString(raw.area, "Area", 240),
      description: requiredString(raw.description, "Description", 12000),
      actionTaken: nullableString(raw.action_taken, "Action taken", 12000),
      returnedToSupplierStatus: parseTriState(
        raw.returned_to_supplier_status,
        "Return status",
      ),
      sortRequestedStatus: parseTriState(raw.sort_requested_status, "Sort status"),
      rmaRequiredStatus: parseTriState(raw.rma_required_status, "RMA status"),
      rmaNumber: nullableString(raw.rma_number, "RMA number", 160),
      concernClassification: nullableString(
        raw.concern_classification,
        "Concern classification",
        160,
      ),
      levelOfConcern: nullableString(raw.level_of_concern, "Concern level", 160),
      levelOfConcernOther: nullableString(
        raw.level_of_concern_other,
        "Custom concern level",
        240,
      ),
      status: requiredString(raw.status, "Incident status", 100),
      releasedAt: timestamp(raw.released_at, "Release timestamp"),
      sentAt: raw.sent_at === null ? null : timestamp(raw.sent_at, "Sent timestamp"),
      createdAt: timestamp(raw.created_at, "Created timestamp"),
      updatedAt: timestamp(raw.updated_at, "Updated timestamp"),
    };
  });
}

function parseGroup(value: unknown): EvidenceGroup {
  if (!isRecord(value)) throw new Error("Evidence group is invalid.");
  assertAllowedKeys(value, GROUP_KEYS, GROUP_REQUIRED_KEYS, "Evidence group");
  const kind = value.kind;
  if (kind !== "image" && kind !== "video") throw new Error("Evidence kind is invalid.");
  const durationMs = nullableInteger(value.duration_ms, "Evidence duration", 1, 30000);
  if ((kind === "image" && durationMs !== null) || (kind === "video" && durationMs === null)) {
    throw new Error("Evidence group duration is invalid.");
  }
  return {
    mediaGroupId: uuid(value.media_group_id, "Media group ID"),
    kind,
    displayOrder: boundedInteger(value.display_order, "Display order", 0, 10),
    title: value.title === undefined
      ? null
      : nullableString(value.title, "Evidence title", 120),
    note: value.note === undefined ? null : nullableString(value.note, "Evidence note", 1000),
    originalName: originalFileName(value.original_name),
    durationMs,
  };
}

function parseAttachment(value: unknown): EvidenceAttachment {
  if (!isRecord(value)) throw new Error("Evidence attachment is invalid.");
  assertAllowedKeys(
    value,
    ATTACHMENT_KEYS,
    ATTACHMENT_REQUIRED_KEYS,
    "Evidence attachment",
  );
  const role = value.role;
  const roles: EvidenceRole[] = [
    "image_original",
    "image_annotation",
    "image_marked",
    "video_original",
  ];
  if (!roles.includes(role as EvidenceRole)) throw new Error("Evidence role is invalid.");
  const mime = value.detected_mime_type;
  if (mime !== "image/jpeg" && mime !== "application/json" && mime !== "video/mp4") {
    throw new Error("Evidence MIME type is invalid.");
  }
  const expectedMime: Record<EvidenceRole, typeof mime> = {
    image_original: "image/jpeg",
    image_annotation: "application/json",
    image_marked: "image/jpeg",
    video_original: "video/mp4",
  };
  if (expectedMime[role as EvidenceRole] !== mime) {
    throw new Error("Evidence role and MIME type do not match.");
  }
  const width = nullableInteger(value.verified_width, "Verified width", 1, 2400);
  const height = nullableInteger(value.verified_height, "Verified height", 1, 2400);
  const duration = nullableInteger(value.verified_duration_ms, "Verified duration", 1, 30000);
  if (mime === "application/json" && (width !== null || height !== null || duration !== null)) {
    throw new Error("Evidence dimensions or duration are invalid.");
  }
  if (mime === "image/jpeg" && (width === null || height === null || duration !== null)) {
    throw new Error("Evidence dimensions or duration are invalid.");
  }
  if (
    mime === "video/mp4" &&
    (
      width === null ||
      height === null ||
      duration === null ||
      width > 1280 ||
      height > 1280 ||
      Math.min(width, height) > 720
    )
  ) {
    throw new Error("Evidence dimensions or duration are invalid.");
  }
  const digest = requiredString(value.verified_sha256, "Verified digest", 64);
  if (!SHA256_PATTERN.test(digest)) throw new Error("Verified digest is invalid.");
  if (value.access_state !== "private_incident_authorized") {
    throw new Error("Evidence access state is invalid.");
  }
  const verifiedByteSize = boundedInteger(
    value.verified_byte_size,
    "Verified byte size",
    1,
    26214400,
  );
  const maximumBytes = mime === "application/json"
    ? 262144
    : mime === "image/jpeg"
    ? 10485760
    : 26214400;
  if (verifiedByteSize > maximumBytes) {
    throw new Error("Verified byte size is invalid for the evidence type.");
  }
  return {
    attachmentId: uuid(value.attachment_id, "Attachment ID"),
    localMediaId: uuid(value.local_media_id, "Local media ID"),
    mediaGroupId: uuid(value.media_group_id, "Media group ID"),
    role: role as EvidenceRole,
    sortOrder: boundedInteger(value.sort_order, "Attachment order", 0, 30),
    verifiedSha256: digest,
    verifiedByteSize,
    detectedMimeType: mime,
    verifiedWidth: width,
    verifiedHeight: height,
    verifiedDurationMs: duration,
    accessState: "private_incident_authorized",
  };
}

export function parseIncidentEvidence(value: unknown, expectedIncidentId: string): IncidentEvidence {
  assertNoTransportMaterial(value);
  if (!isRecord(value)) throw new Error("Incident evidence response is invalid.");
  assertExactKeys(value, EVIDENCE_KEYS, "Incident evidence");
  if (
    value.status !== "confirmed" ||
    value.record_kind !== "incident_evidence" ||
    value.dashboard_delivery !== "available" ||
    value.admin_approval_required !== false ||
    value.incident_id !== expectedIncidentId ||
    value.entity_id !== expectedIncidentId
  ) {
    throw new Error("Incident evidence response is not released for this incident.");
  }
  const mediaStates: Record<string, EvidenceState> = {
    uploading: "uploading",
    verified_private_storage: "verified",
    not_provided: "not_provided",
    rejected: "rejected",
    retiring: "retiring",
    retired: "retired",
  };
  const state = typeof value.media_delivery === "string"
    ? mediaStates[value.media_delivery]
    : undefined;
  if (!state || !Array.isArray(value.groups) || !Array.isArray(value.attachments)) {
    throw new Error("Incident evidence delivery state is invalid.");
  }
  if (value.groups.length > 11 || value.attachments.length > 31) {
    throw new Error("Incident evidence cardinality is invalid.");
  }
  const groups = value.groups.map(parseGroup);
  const attachments = value.attachments.map(parseAttachment);
  const canonicalIncidentId = identifier(value.incident_id, "Evidence Incident ID");
  if (!INCIDENT_ID_PATTERN.test(canonicalIncidentId)) {
    throw new Error("Evidence Incident ID is invalid.");
  }
  const groupById = new Map(groups.map((group) => [group.mediaGroupId, group]));
  if (
    groupById.size !== groups.length ||
    new Set(groups.map((group) => group.displayOrder)).size !== groups.length ||
    new Set(attachments.map((attachment) => attachment.attachmentId)).size !== attachments.length ||
    new Set(attachments.map((attachment) => attachment.localMediaId)).size !== attachments.length ||
    new Set(attachments.map((attachment) => attachment.sortOrder)).size !== attachments.length ||
    new Set(attachments.map(
      (attachment) => `${attachment.mediaGroupId}:${attachment.role}`,
    )).size !== attachments.length
  ) {
    throw new Error("Incident evidence contains duplicate identities or ordering.");
  }
  if (attachments.some((attachment) => !groupById.has(attachment.mediaGroupId))) {
    throw new Error("Evidence attachment is not bound to a returned group.");
  }
  if (attachments.some((attachment) => {
    const group = groupById.get(attachment.mediaGroupId);
    return group?.kind === "video"
      ? attachment.role !== "video_original"
      : attachment.role === "video_original";
  })) {
    throw new Error("Evidence attachment kind does not match its group.");
  }
  if (state === "verified" && (groups.length < 1 || attachments.length < 1)) {
    throw new Error("Verified evidence is incomplete.");
  }
  if (
    state === "verified" &&
    groups.some((group) => !attachments.some(
      (attachment) => attachment.mediaGroupId === group.mediaGroupId,
    ))
  ) {
    throw new Error("Verified evidence group has no attachment.");
  }
  if (state !== "verified" && attachments.length !== 0) {
    throw new Error("Unverified evidence returned accessible attachments.");
  }
  return {
    incidentId: canonicalIncidentId,
    serverTimestamp: timestamp(value.server_timestamp, "Evidence timestamp"),
    state,
    groups,
    attachments,
  };
}

export function parseAttachmentGrant(
  value: unknown,
  expectedIncidentId: string,
  expectedAttachmentId: string,
  expectedAction: "view" | "download",
): AttachmentGrant {
  if (!isRecord(value)) throw new Error("Attachment authorization response is invalid.");
  assertExactKeys(value, GRANT_KEYS, "Attachment authorization");
  const attachmentId = uuid(value.attachment_id, "Attachment ID");
  const accessGrantId = uuid(value.access_grant_id, "Access grant ID");
  const incidentId = identifier(value.incident_id, "Authorized Incident ID");
  if (!INCIDENT_ID_PATTERN.test(incidentId)) {
    throw new Error("Authorized Incident ID is invalid.");
  }
  if (
    value.status !== "authorized" ||
    value.entity_id !== expectedIncidentId ||
    value.incident_id !== expectedIncidentId ||
    attachmentId !== expectedAttachmentId.toLowerCase() ||
    value.action !== expectedAction ||
    value.expires_in_seconds !== 300
  ) {
    throw new Error("Attachment authorization response does not match the request.");
  }
  const serverTimestamp = timestamp(value.server_timestamp, "Authorization timestamp");
  const expiresAt = timestamp(value.expires_at, "Authorization expiry");
  const duration = Date.parse(expiresAt) - Date.parse(serverTimestamp);
  if (duration < 299000 || duration > 301000) {
    throw new Error("Attachment authorization expiry is invalid.");
  }
  const rawUrl = requiredString(value.signed_url, "Signed media URL", 12000);
  let signedUrl: URL;
  try {
    signedUrl = new URL(rawUrl);
  } catch {
    throw new Error("Signed media URL is invalid.");
  }
  const queryKeys = [...signedUrl.searchParams.keys()];
  const expectedQueryKeys = expectedAction === "download"
    ? new Set(["token", "download"])
    : new Set(["token"]);
  if (
    signedUrl.protocol !== "https:" ||
    signedUrl.origin !== STAGING_ORIGIN ||
    signedUrl.username !== "" ||
    signedUrl.password !== "" ||
    signedUrl.hash !== "" ||
    !SEALED_MEDIA_PATH_PATTERN.test(signedUrl.pathname) ||
    queryKeys.length !== expectedQueryKeys.size ||
    queryKeys.some((key) => !expectedQueryKeys.has(key)) ||
    !signedUrl.searchParams.get("token")
  ) {
    throw new Error("Signed media URL escaped the staging sealed-object boundary.");
  }
  if (
    expectedAction === "download" &&
    !/^incident-evidence-[0-9a-f]{32}\.(?:jpg|json|mp4)$/.test(
      signedUrl.searchParams.get("download") ?? "",
    )
  ) {
    throw new Error("Signed media download filename is invalid.");
  }
  return {
    incidentId,
    attachmentId,
    action: expectedAction,
    accessGrantId,
    signedUrl: signedUrl.toString(),
    serverTimestamp,
    expiresAt,
  };
}
