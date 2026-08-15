import { describe, expect, it } from "vitest";
import {
  parseAttachmentGrant,
  parseIncidentEvidence,
} from "../src/data/contracts";
import { STAGING_ORIGIN } from "../src/security/environment";

const incidentId = "INC-0123456789abcdef0123456789abcdef";
const groupId = "11111111-1111-4111-8111-111111111111";
const attachmentId = "22222222-2222-4222-8222-222222222222";

const evidenceResponse = {
  status: "confirmed",
  entity_id: incidentId,
  server_timestamp: "2026-08-12T14:01:00.000Z",
  record_kind: "incident_evidence",
  incident_id: incidentId,
  media_delivery: "verified_private_storage",
  dashboard_delivery: "available",
  admin_approval_required: false,
  access_scope: "ids_internal_full",
  groups: [{
    media_group_id: groupId,
    kind: "image",
    display_order: 0,
    title: "Connector face",
    note: "Marked location is visible.",
    duration_ms: null,
  }],
  attachments: [{
    attachment_id: attachmentId,
    media_group_id: groupId,
    role: "image_marked",
    sort_order: 2,
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

const clientEvidenceResponse = {
  status: "confirmed",
  entity_id: incidentId,
  server_timestamp: "2026-08-12T14:01:00.000Z",
  record_kind: "incident_evidence",
  incident_id: incidentId,
  media_delivery: "verified_private_storage",
  dashboard_delivery: "available",
  admin_approval_required: false,
  access_scope: "external_client_released",
  groups: [
    {
      group_id: groupId,
      kind: "marked_image",
      display_order: 0,
      title: "Marked connector location",
      note: null,
      duration_ms: null,
    },
    {
      group_id: "66666666-6666-4666-8666-666666666666",
      kind: "submitted_video",
      display_order: 1,
      title: null,
      note: "Containment walkaround",
      duration_ms: 4200,
    },
  ],
  attachments: [
    {
      attachment_id: attachmentId,
      group_id: groupId,
      kind: "marked_image",
      display_order: 0,
    },
    {
      attachment_id: "77777777-7777-4777-8777-777777777777",
      group_id: "66666666-6666-4666-8666-666666666666",
      kind: "submitted_video",
      display_order: 1,
    },
  ],
};

describe("path-free evidence contract", () => {
  it("maps the private-storage delivery result to the verified viewer state", () => {
    const parsed = parseIncidentEvidence(evidenceResponse, incidentId, "ids_internal");
    expect(parsed.state).toBe("verified");
    expect(parsed.attachments[0]?.role).toBe("image_marked");
  });

  it("rejects transport paths, URLs, tokens, or extra fields", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      object_name: "sealed/private.jpg",
    }, incidentId, "ids_internal")).toThrow(/transport material/i);
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      attachments: [{ ...evidenceResponse.attachments[0], bucket_id: "private" }],
    }, incidentId, "ids_internal")).toThrow(/transport material/i);
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      groups: [{ ...evidenceResponse.groups[0], note: "sealed/v1/private/object.jpg" }],
    }, incidentId, "ids_internal")).toThrow(/transport material/i);
  });

  it("rejects accessible attachments before verification", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      media_delivery: "uploading",
    }, incidentId, "ids_internal")).toThrow(/unverified/i);
  });

  it("rejects duplicate ordering and role/group mismatches", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      groups: [...evidenceResponse.groups, {
        ...evidenceResponse.groups[0],
        media_group_id: "66666666-6666-4666-8666-666666666666",
      }],
    }, incidentId, "ids_internal")).toThrow(/duplicate/i);
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      groups: [{ ...evidenceResponse.groups[0], kind: "video", duration_ms: 1000 }],
    }, incidentId, "ids_internal")).toThrow(/kind/i);
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      groups: [{ ...evidenceResponse.groups[0], duration_ms: undefined }],
    }, incidentId, "ids_internal")).toThrow(/duration/i);
  });

  it("rejects approval gates and incident mismatches", () => {
    expect(() => parseIncidentEvidence({
      ...evidenceResponse,
      admin_approval_required: true,
    }, incidentId, "ids_internal")).toThrow();
    expect(() => parseIncidentEvidence(
      evidenceResponse,
      "INC-ffffffffffffffffffffffffffffffff",
      "ids_internal",
    ))
      .toThrow();
  });
});

describe("audience-discriminated Client evidence contract", () => {
  it("retains only marked-photo and submitted-video opaque Client fields", () => {
    const parsed = parseIncidentEvidence(
      clientEvidenceResponse,
      incidentId,
      "external_client",
    );
    expect(parsed).toEqual({
      accessScope: "external_client_released",
      incidentId,
      serverTimestamp: "2026-08-12T14:01:00.000Z",
      state: "verified",
      groups: [
        {
          groupId,
          kind: "marked_image",
          displayOrder: 0,
          title: "Marked connector location",
          note: null,
          durationMs: null,
        },
        {
          groupId: "66666666-6666-4666-8666-666666666666",
          kind: "submitted_video",
          displayOrder: 1,
          title: null,
          note: "Containment walkaround",
          durationMs: 4200,
        },
      ],
      attachments: [
        { attachmentId, groupId, kind: "marked_image", displayOrder: 0 },
        {
          attachmentId: "77777777-7777-4777-8777-777777777777",
          groupId: "66666666-6666-4666-8666-666666666666",
          kind: "submitted_video",
          displayOrder: 1,
        },
      ],
    });
    expect(JSON.stringify(parsed)).not.toMatch(
      /original|annotation|localMedia|sha|byte|width|height|bucket|path|token/i,
    );
  });

  it("fails closed on legacy internal scope, originals, annotation data, or metadata", () => {
    expect(() => parseIncidentEvidence(evidenceResponse, incidentId, "external_client"))
      .toThrow(/external scope/i);
    for (const unsafe of [
      {
        ...clientEvidenceResponse,
        attachments: [{ ...clientEvidenceResponse.attachments[0], kind: "image_original" }],
      },
      {
        ...clientEvidenceResponse,
        groups: [{ ...clientEvidenceResponse.groups[0], original_name: "connector.jpg" }],
      },
      {
        ...clientEvidenceResponse,
        attachments: [{ ...clientEvidenceResponse.attachments[0], verified_sha256: "a".repeat(64) }],
      },
      {
        ...clientEvidenceResponse,
        groups: [{ ...clientEvidenceResponse.groups[0], annotation_json: "{}" }],
      },
    ]) {
      expect(() => parseIncidentEvidence(unsafe, incidentId, "external_client")).toThrow();
    }
  });

  it("does not expose Client group metadata before marked media is verified", () => {
    expect(() => parseIncidentEvidence({
      ...clientEvidenceResponse,
      media_delivery: "uploading",
      attachments: [],
    }, incidentId, "external_client")).toThrow(/availability/i);
    expect(parseIncidentEvidence({
      ...clientEvidenceResponse,
      media_delivery: "uploading",
      groups: [],
      attachments: [],
    }, incidentId, "external_client")).toMatchObject({
      accessScope: "external_client_released",
      state: "uploading",
      groups: [],
      attachments: [],
    });
  });

  it("keeps internal original and annotation roles without private attachment metadata", () => {
    const allInternalRoles = {
      ...evidenceResponse,
      attachments: [
        evidenceResponse.attachments[0],
        {
          ...evidenceResponse.attachments[0],
          attachment_id: "33333333-3333-4333-8333-333333333333",
          role: "image_original",
          sort_order: 0,
        },
        {
          ...evidenceResponse.attachments[0],
          attachment_id: "55555555-5555-4555-8555-555555555555",
          role: "image_annotation",
          sort_order: 1,
        },
      ],
    };
    const parsed = parseIncidentEvidence(allInternalRoles, incidentId, "ids_internal");
    expect(parsed.accessScope).toBe("ids_internal_full");
    expect(parsed.attachments.map((item) => item.role)).toEqual([
      "image_marked",
      "image_original",
      "image_annotation",
    ]);
    expect(parsed.attachments.every(
      (item) => item.accessState === "private_incident_authorized",
    )).toBe(true);
    for (const privateField of [
      { local_media_id: "33333333-3333-4333-8333-333333333333" },
      { verified_sha256: "a".repeat(64) },
      { verified_byte_size: 2048 },
      { detected_mime_type: "image/jpeg" },
    ]) {
      expect(() => parseIncidentEvidence({
        ...evidenceResponse,
        attachments: [{ ...evidenceResponse.attachments[0], ...privateField }],
      }, incidentId, "ids_internal")).toThrow(/transport material/i);
    }
    expect(() => parseIncidentEvidence(
      clientEvidenceResponse,
      incidentId,
      "ids_internal",
    )).toThrow(/wrong audience scope/i);
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
