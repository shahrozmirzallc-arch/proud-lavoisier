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

export interface IncidentSummary {
  id: string;
  projectId: string;
  supplierId: string | null;
  plantId: string | null;
  repName: string;
  partId: string | null;
  defectType: string | null;
  area: string | null;
  description: string;
  actionTaken: string | null;
  returnedToSupplierStatus: "yes" | "no" | "unknown";
  sortRequestedStatus: "yes" | "no" | "unknown";
  rmaRequiredStatus: "yes" | "no" | "unknown";
  rmaNumber: string | null;
  concernClassification: string | null;
  levelOfConcern: string | null;
  levelOfConcernOther: string | null;
  status: string;
  releasedAt: string;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceGroup {
  mediaGroupId: string;
  kind: "image" | "video";
  displayOrder: number;
  title: string | null;
  note: string | null;
  originalName: string;
  durationMs: number | null;
}

export interface EvidenceAttachment {
  attachmentId: string;
  localMediaId: string;
  mediaGroupId: string;
  role: EvidenceRole;
  sortOrder: number;
  verifiedSha256: string;
  verifiedByteSize: number;
  detectedMimeType: "image/jpeg" | "application/json" | "video/mp4";
  verifiedWidth: number | null;
  verifiedHeight: number | null;
  verifiedDurationMs: number | null;
  accessState: "private_incident_authorized";
}

export interface IncidentEvidence {
  incidentId: string;
  serverTimestamp: string;
  state: EvidenceState;
  groups: EvidenceGroup[];
  attachments: EvidenceAttachment[];
}

export interface AttachmentGrant {
  incidentId: string;
  attachmentId: string;
  action: "view" | "download";
  accessGrantId: string;
  signedUrl: string;
  serverTimestamp: string;
  expiresAt: string;
}
