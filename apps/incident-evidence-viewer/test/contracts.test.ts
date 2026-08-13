import { describe, expect, it } from "vitest";
import {
  INCIDENT_SAFE_COLUMNS,
  INCIDENT_SELECT,
  parseAttachmentGrant,
  parseIncidentEvidence,
  parseIncidentRows,
} from "../src/data/contracts";
import { STAGING_ORIGIN } from "../src/security/environment";

const incidentId = "INC-0123456789abcdef0123456789abcdef";
const groupId = "11111111-1111-4111-8111-111111111111";
const attachmentId = "22222222-2222-4222-8222-222222222222";
const localMediaId = "33333333-3333-4333-8333-333333333333";

const incidentRow = {
  id: incidentId,
  project_id: "project-100",
  supplier_id: "supplier-10",
  plant_id: "plant-12",
  rep_name: "Quality Rep",
  part_id: "part-42",
  defect_type: "Connector damage",
  area: "Line 3",
  description: "Connector housing damage found during inspection.",
  action_taken: "Suspect material was contained.",
  returned_to_supplier_status: "no",
  sort_requested_status: "yes",
  rma_required_status: "unknown",
  rma_number: null,
  concern_classification: "PRR",
  level_of_concern: "High",
  level_of_concern_other: null,
  status: "Open",
  released_at: "2026-08-12T14:00:00.000Z",
  sent_at: "2026-08-12T14:00:00.000Z",
  created_at: "2026-08-12T13:59:58.000Z",
  updated_at: "2026-08-12T14:00:00.000Z",
};

const evidenceResponse = {
  status: "confirmed",
  entity_id: incidentId,
  server_timestamp: "2026-08-12T14:01:00.000Z",
  record_kind: "incident_evidence",
  incident_id: incidentId,
  media_delivery: "verified_private_storage",
  dashboard_delivery: "available",
  admin_approval_required: false,
  groups: [{
    media_group_id: groupId,
    kind: "image",
    display_order: 0,
    title: "Connector face",
    note: "Marked location is visible.",
    original_name: "connector.jpg",
  }],
  attachments: [{
    attachment_id: attachmentId,
    local_media_id: localMediaId,
    media_group_id: groupId,
    role: "image_marked",
    sort_order: 2,
    verified_sha256: "a".repeat(64),
    verified_byte_size: 2048,
    detected_mime_type: "image/jpeg",
    verified_width: 1200,
    verified_height: 900,
    access_state: "private_incident_authorized",
  }],
};

const grantResponse = {
  status: "authorized",
  entity_id: incidentId,
  server_timestamp: "2026-08-12T14:02:00.000Z",
  incident_id: incidentId,
  attachment_id: attachmentId,
  action: "view",
  access_grant_id: "44444444-4444-4444-8444-444444444444",
  signed_url: `${STAGING_ORIGIN}/storage/v1/object/sign/ids-pulse-incident-evidence/sealed/v1/${groupId}/${attachmentId}/${"b".repeat(64)}.jpg?token=temporary-token`,
  expires_in_seconds: 300,
  expires_at: "2026-08-12T14:07:00.000Z",
};

describe("released Incident feed contract", () => {
  it("freezes the conservative safe-column allowlist", () => {
    expect(INCIDENT_SELECT).toBe([
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
    ].join(","));
    expect(INCIDENT_SAFE_COLUMNS).not.toContain("photos");
    expect(INCIDENT_SAFE_COLUMNS).not.toContain("videos");
    expect(INCIDENT_SAFE_COLUMNS).not.toContain("media_manifest");
    expect(INCIDENT_SAFE_COLUMNS).not.toContain("delivery_envelope");
    expect(INCIDENT_SAFE_COLUMNS).not.toContain("context_snapshot");
  });

  it("parses only the exact selected row shape", () => {
    expect(parseIncidentRows([incidentRow])).toMatchObject([
      { id: incidentId, projectId: "project-100", description: incidentRow.description },
    ]);
    expect(() => parseIncidentRows([{ ...incidentRow, photos: [] }])).toThrow();
  });
});

describe("path-free evidence contract", () => {
  it("maps the private-storage delivery result to the verified viewer state", () => {
    const parsed = parseIncidentEvidence(evidenceResponse, incidentId);
    expect(parsed.state).toBe("verified");
    expect(parsed.attachments[0]?.role).toBe("image_marked");
  });

  it("rejects transport paths, URLs, tokens, or extra fields", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      object_name: "sealed/private.jpg",
    }, incidentId)).toThrow(/transport material/i);
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      attachments: [{ ...evidenceResponse.attachments[0], bucket_id: "private" }],
    }, incidentId)).toThrow(/transport material/i);
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      groups: [{ ...evidenceResponse.groups[0], note: "sealed/v1/private/object.jpg" }],
    }, incidentId)).toThrow(/transport material/i);
  });

  it("rejects accessible attachments before verification", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      media_delivery: "uploading",
    }, incidentId)).toThrow(/unverified/i);
  });

  it("rejects duplicate ordering and role/group mismatches", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      groups: [...evidenceResponse.groups, {
        ...evidenceResponse.groups[0],
        media_group_id: "66666666-6666-4666-8666-666666666666",
      }],
    }, incidentId)).toThrow(/duplicate/i);
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      groups: [{ ...evidenceResponse.groups[0], kind: "video", duration_ms: 1000 }],
    }, incidentId)).toThrow(/kind/i);
  });

  it("rejects approval gates and incident mismatches", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      admin_approval_required: true,
    }, incidentId)).toThrow();
    expect(() => parseIncidentEvidence(evidenceResponse, "INC-ffffffffffffffffffffffffffffffff"))
      .toThrow();
  });
});

describe("five-minute signed grant contract", () => {
  it("accepts an exact HTTPS staging-origin view grant", () => {
    expect(parseAttachmentGrant(grantResponse, incidentId, attachmentId, "view"))
      .toMatchObject({ incidentId, attachmentId, action: "view" });
  });

  it("rejects the production origin, wrong duration, and extra response fields", () => {
    expect(() => parseAttachmentGrant({
      ...grantResponse,
      signed_url: grantResponse.signed_url.replace(
        "qatoyevwtjjtynisodyq",
        "wuqqrcowznrmmuokfxlk",
      ),
    }, incidentId, attachmentId, "view")).toThrow();
    expect(() => parseAttachmentGrant({
      ...grantResponse,
      expires_in_seconds: 600,
    }, incidentId, attachmentId, "view")).toThrow();
    expect(() => parseAttachmentGrant({
      ...grantResponse,
      bucket_id: "ids-pulse-incident-evidence",
    }, incidentId, attachmentId, "view")).toThrow();
  });
});
