import type {
  AttachmentGrant,
  ClientEvidenceAttachment,
  ClientEvidenceGroup,
  ClientIncidentEvidence,
  EvidenceAudience,
  EvidenceAttachment,
  EvidenceGroup,
  EvidenceRole,
  EvidenceState,
  IncidentEvidence,
  ViewerIncidentEvidence,
} from "../types";
import { STAGING_ORIGIN } from "../security/environment";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_PATH_PART =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const INCIDENT_ID_PATTERN = /^INC-[0-9a-f]{32}$/;
const SEALED_MEDIA_PATH_PATTERN =
  new RegExp(
    `^/storage/v1/object/sign/ids-pulse-incident-evidence/sealed/v1/${UUID_PATH_PART}/${UUID_PATH_PART}/[0-9a-f]{64}\\.(?:jpg|json|mp4)$`,
  );
const FORBIDDEN_TRANSPORT_KEYS = new Set([
  "bucket",
  "bucket_id",
  "detected_mime_type",
  "local_media_id",
  "object_name",
  "original_name",
  "path",
  "sealed_object_name",
  "verified_byte_size",
  "verified_duration_ms",
  "verified_height",
  "verified_sha256",
  "verified_width",
  "signed_url",
  "staging_object_name",
  "token",
  "url",
]);

const SCOPED_EVIDENCE_KEYS = new Set([
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
  "access_scope",
]);
const CLIENT_GROUP_KEYS = new Set([
  "group_id",
  "kind",
  "display_order",
  "title",
  "note",
  "duration_ms",
]);
const CLIENT_ATTACHMENT_KEYS = new Set([
  "attachment_id",
  "group_id",
  "kind",
  "display_order",
]);
const GROUP_KEYS = new Set([
  "media_group_id",
  "kind",
  "display_order",
  "title",
  "note",
  "duration_ms",
]);
const ATTACHMENT_KEYS = new Set([
  "attachment_id",
  "media_group_id",
  "role",
  "sort_order",
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
  return value === null ? null : boundedInteger(value, label, minimum, maximum);
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

function parseGroup(value: unknown): EvidenceGroup {
  if (!isRecord(value)) throw new Error("Evidence group is invalid.");
  assertExactKeys(value, GROUP_KEYS, "Evidence group");
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
    title: nullableString(value.title, "Evidence title", 120),
    note: nullableString(value.note, "Evidence note", 1000),
    durationMs,
  };
}

function parseAttachment(value: unknown): EvidenceAttachment {
  if (!isRecord(value)) throw new Error("Evidence attachment is invalid.");
  assertExactKeys(value, ATTACHMENT_KEYS, "Evidence attachment");
  const role = value.role;
  const roles: EvidenceRole[] = [
    "image_original",
    "image_annotation",
    "image_marked",
    "video_original",
  ];
  if (!roles.includes(role as EvidenceRole)) throw new Error("Evidence role is invalid.");
  if (value.access_state !== "private_incident_authorized") {
    throw new Error("Evidence access state is invalid.");
  }
  return {
    attachmentId: uuid(value.attachment_id, "Attachment ID"),
    mediaGroupId: uuid(value.media_group_id, "Media group ID"),
    role: role as EvidenceRole,
    sortOrder: boundedInteger(value.sort_order, "Attachment order", 0, 30),
    accessState: "private_incident_authorized",
  };
}

function parseClientGroup(value: unknown): ClientEvidenceGroup {
  if (!isRecord(value)) throw new Error("Client evidence group is invalid.");
  assertExactKeys(value, CLIENT_GROUP_KEYS, "Client evidence group");
  const kind = value.kind;
  if (kind !== "marked_image" && kind !== "submitted_video") {
    throw new Error("Client evidence kind is invalid.");
  }
  const durationMs = nullableInteger(value.duration_ms, "Client evidence duration", 1, 30000);
  if (
    (kind === "marked_image" && durationMs !== null) ||
    (kind === "submitted_video" && durationMs === null)
  ) {
    throw new Error("Client evidence duration is invalid.");
  }
  return {
    groupId: uuid(value.group_id, "Client evidence group ID"),
    kind,
    displayOrder: boundedInteger(value.display_order, "Client evidence order", 0, 10),
    title: nullableString(value.title, "Client evidence title", 120),
    note: nullableString(value.note, "Client evidence note", 1000),
    durationMs,
  };
}

function parseClientAttachment(value: unknown): ClientEvidenceAttachment {
  if (!isRecord(value)) throw new Error("Client evidence attachment is invalid.");
  assertExactKeys(value, CLIENT_ATTACHMENT_KEYS, "Client evidence attachment");
  const kind = value.kind;
  if (kind !== "marked_image" && kind !== "submitted_video") {
    throw new Error("Client evidence attachment kind is invalid.");
  }
  return {
    attachmentId: uuid(value.attachment_id, "Client evidence attachment ID"),
    groupId: uuid(value.group_id, "Client evidence attachment group ID"),
    kind,
    displayOrder: boundedInteger(
      value.display_order,
      "Client evidence attachment order",
      0,
      30,
    ),
  };
}

function evidenceState(value: unknown): EvidenceState {
  const mediaStates: Record<string, EvidenceState> = {
    uploading: "uploading",
    verified_private_storage: "verified",
    not_provided: "not_provided",
    rejected: "rejected",
    retiring: "retiring",
    retired: "retired",
  };
  const state = typeof value === "string" ? mediaStates[value] : undefined;
  if (!state) throw new Error("Incident evidence delivery state is invalid.");
  return state;
}

function parseClientIncidentEvidence(
  value: JsonRecord,
  expectedIncidentId: string,
): ClientIncidentEvidence {
  if (value.access_scope !== "external_client_released") {
    throw new Error("Client evidence did not use the released external scope.");
  }
  const state = evidenceState(value.media_delivery);
  if (!Array.isArray(value.groups) || !Array.isArray(value.attachments)) {
    throw new Error("Client evidence lists are invalid.");
  }
  if (value.groups.length > 11 || value.attachments.length > 11) {
    throw new Error("Client evidence cardinality is invalid.");
  }
  const groups = value.groups.map(parseClientGroup);
  const attachments = value.attachments.map(parseClientAttachment);
  const groupById = new Map(groups.map((group) => [group.groupId, group]));
  if (
    groupById.size !== groups.length ||
    new Set(groups.map((group) => group.displayOrder)).size !== groups.length ||
    new Set(attachments.map((attachment) => attachment.attachmentId)).size !== attachments.length ||
    new Set(attachments.map((attachment) => attachment.displayOrder)).size !== attachments.length ||
    attachments.some((attachment) => {
      const group = groupById.get(attachment.groupId);
      return !group || group.kind !== attachment.kind;
    })
  ) {
    throw new Error("Client evidence contains mismatched or duplicate items.");
  }
  if (
    (state === "verified" &&
      (groups.length < 1 ||
        attachments.length < 1 ||
        groups.some((group) => !attachments.some(
          (attachment) => attachment.groupId === group.groupId,
        )))) ||
    (state !== "verified" && (groups.length !== 0 || attachments.length !== 0))
  ) {
    throw new Error("Client evidence availability is inconsistent.");
  }
  return {
    accessScope: "external_client_released",
    incidentId: identifier(expectedIncidentId, "Evidence Incident ID"),
    serverTimestamp: timestamp(value.server_timestamp, "Evidence timestamp"),
    state,
    groups,
    attachments,
  };
}

export function parseIncidentEvidence(
  value: unknown,
  expectedIncidentId: string,
  audience: "external_client",
): ClientIncidentEvidence;
export function parseIncidentEvidence(
  value: unknown,
  expectedIncidentId: string,
  audience: "ids_internal",
): IncidentEvidence;
export function parseIncidentEvidence(
  value: unknown,
  expectedIncidentId: string,
  audience: EvidenceAudience,
): ViewerIncidentEvidence {
  assertNoTransportMaterial(value);
  if (!isRecord(value)) throw new Error("Incident evidence response is invalid.");
  assertExactKeys(value, SCOPED_EVIDENCE_KEYS, "Incident evidence");
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
  const canonicalIncidentId = identifier(value.incident_id, "Evidence Incident ID");
  if (!INCIDENT_ID_PATTERN.test(canonicalIncidentId)) {
    throw new Error("Evidence Incident ID is invalid.");
  }
  if (audience === "external_client") {
    return parseClientIncidentEvidence(value, expectedIncidentId);
  }
  if (value.access_scope !== "ids_internal_full") {
    throw new Error("Internal evidence response used the wrong audience scope.");
  }
  const state = evidenceState(value.media_delivery);
  if (!Array.isArray(value.groups) || !Array.isArray(value.attachments)) {
    throw new Error("Incident evidence delivery state is invalid.");
  }
  if (value.groups.length > 11 || value.attachments.length > 31) {
    throw new Error("Incident evidence cardinality is invalid.");
  }
  const groups = value.groups.map(parseGroup);
  const attachments = value.attachments.map(parseAttachment);
  const groupById = new Map(groups.map((group) => [group.mediaGroupId, group]));
  if (
    groupById.size !== groups.length ||
    new Set(groups.map((group) => group.displayOrder)).size !== groups.length ||
    new Set(attachments.map((attachment) => attachment.attachmentId)).size !== attachments.length ||
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
    accessScope: "ids_internal_full",
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
