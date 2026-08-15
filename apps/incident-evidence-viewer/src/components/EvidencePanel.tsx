import { useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchIncidentEvidence, requestAttachmentAccess } from "../data/viewerApi";
import type {
  AttachmentGrant,
  ClientEvidenceAttachment,
  ClientEvidenceGroup,
  EvidenceAudience,
  EvidenceAttachment,
  EvidenceGroup,
  EvidenceState,
  ViewerIncidentEvidence,
} from "../types";

interface EvidencePanelProps {
  client: SupabaseClient;
  incidentId: string;
  refreshRevision: number;
  audience: EvidenceAudience;
}

export interface ActivePreview {
  attachment: EvidenceAttachment | ClientEvidenceAttachment;
  objectUrl: string;
  expiresAt: string;
}

const stateCopy: Record<EvidenceState, { title: string; detail: string }> = {
  uploading: {
    title: "Evidence uploading",
    detail: "The Incident is released. Its media is continuing in the separate evidence lane.",
  },
  verified: {
    title: "Evidence verified",
    detail: "Private media is available through audited five-minute access grants.",
  },
  not_provided: {
    title: "No media provided",
    detail: "The Rep released this Incident without a media attachment.",
  },
  rejected: {
    title: "Evidence rejected",
    detail: "Submitted media did not pass server verification and cannot be opened.",
  },
  retiring: {
    title: "Evidence retiring",
    detail: "Private media cleanup is in progress. New access is unavailable.",
  },
  retired: {
    title: "Evidence retired",
    detail: "Private media has been removed under the evidence retention workflow.",
  },
};

const rolePriority: Record<EvidenceAttachment["role"], number> = {
  image_marked: 0,
  video_original: 1,
  image_original: 2,
  image_annotation: 3,
};

const roleLabels: Record<EvidenceAttachment["role"], string> = {
  image_marked: "Marked image",
  image_original: "Normalized original",
  image_annotation: "Drawing data",
  video_original: "Verified video",
};

function groupLabel(group: EvidenceGroup): string {
  if (group.title) return group.title;
  return group.kind === "image"
    ? `Photo ${group.displayOrder + 1}`
    : "Incident video";
}

function clientGroupLabel(group: ClientEvidenceGroup): string {
  if (group.title) return group.title;
  return group.kind === "marked_image"
    ? `Marked photo ${group.displayOrder + 1}`
    : `Submitted video ${group.displayOrder + 1}`;
}

function attachmentId(attachment: EvidenceAttachment | ClientEvidenceAttachment): string {
  return attachment.attachmentId;
}

function attachmentGroupId(attachment: EvidenceAttachment | ClientEvidenceAttachment): string {
  return "groupId" in attachment ? attachment.groupId : attachment.mediaGroupId;
}

function attachmentOrder(attachment: EvidenceAttachment | ClientEvidenceAttachment): number {
  return "displayOrder" in attachment ? attachment.displayOrder : attachment.sortOrder;
}

function attachmentLabel(attachment: EvidenceAttachment | ClientEvidenceAttachment): string {
  if ("kind" in attachment) {
    return attachment.kind === "marked_image" ? "Marked photo" : "Submitted video";
  }
  return roleLabels[attachment.role];
}

function attachmentIsImage(attachment: EvidenceAttachment | ClientEvidenceAttachment): boolean {
  return "kind" in attachment
    ? attachment.kind === "marked_image"
    : attachment.role === "image_original" || attachment.role === "image_marked";
}

function attachmentIsVideo(attachment: EvidenceAttachment | ClientEvidenceAttachment): boolean {
  return "kind" in attachment
    ? attachment.kind === "submitted_video"
    : attachment.role === "video_original";
}

async function fetchGrantedBlob(grant: AttachmentGrant): Promise<Blob> {
  const response = await fetch(grant.signedUrl, {
    method: "GET",
    cache: "no-store",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) {
    throw new Error("Authorized evidence could not be retrieved.");
  }
  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("Authorized evidence was empty.");
  }
  return blob;
}

function downloadName(attachment: EvidenceAttachment | ClientEvidenceAttachment): string {
  if (attachmentIsVideo(attachment)) return "submitted-incident-video.mp4";
  if (attachmentIsImage(attachment)) return "marked-incident-photo.jpg";
  return "incident-drawing-data.json";
}

export function EvidenceMediaPreview({
  preview,
  onClose,
}: {
  preview: ActivePreview;
  onClose: () => void;
}) {
  return (
    <div className="preview-panel" aria-live="polite">
      <div className="preview-heading">
        <div>
          <strong>{attachmentLabel(preview.attachment)}</strong>
          <span>Access closes at {new Date(preview.expiresAt).toLocaleTimeString()}</span>
        </div>
        <button className="button button-secondary button-compact" type="button" onClick={onClose}>
          Close preview
        </button>
      </div>
      {attachmentIsImage(preview.attachment) ? (
        <img
          className="evidence-image"
          src={preview.objectUrl}
          alt={`${attachmentLabel(preview.attachment)} for the released Incident`}
        />
      ) : attachmentIsVideo(preview.attachment) ? (
        <video className="evidence-video" src={preview.objectUrl} controls preload="metadata">
          This browser cannot play the verified Incident video.
        </video>
      ) : (
        <div className="annotation-preview">
          <p>Drawing data is available as the verified machine-readable annotation file.</p>
          <a href={preview.objectUrl} target="_blank" rel="noreferrer">
            Open drawing data before access expires
          </a>
        </div>
      )}
    </div>
  );
}

export function ClientEvidenceGroupCard({
  group,
  attachments,
  busyAction,
  onView,
  onDownload,
}: {
  group: ClientEvidenceGroup;
  attachments: ClientEvidenceAttachment[];
  busyAction: string | null;
  onView: (attachment: ClientEvidenceAttachment) => void;
  onDownload: (attachment: ClientEvidenceAttachment) => void;
}) {
  return (
    <article className="evidence-group">
      <div className="evidence-group-heading">
        <div>
          <span className="group-kind">
            {group.kind === "marked_image" ? "Marked photo" : "Submitted video"}
          </span>
          <h3>{clientGroupLabel(group)}</h3>
        </div>
      </div>
      <div className="client-evidence-facts">
        <span>Kind {group.kind === "marked_image" ? "Marked photo" : "Submitted video"}</span>
        <span>Display position {group.displayOrder + 1}</span>
        <span>Title {group.title ?? "Not provided"}</span>
        <span>
          Duration {group.durationMs === null ? "Not applicable" : `${group.durationMs} ms`}
        </span>
        <span>Note {group.note ?? "Not provided"}</span>
      </div>
      {attachments.length > 0 ? (
        <ul className="attachment-list">
          {attachments.map((attachment) => {
            const viewKey = `${attachment.attachmentId}:view`;
            const downloadKey = `${attachment.attachmentId}:download`;
            return (
              <li key={attachment.attachmentId}>
                <div className="attachment-copy">
                  <strong>{attachmentLabel(attachment)}</strong>
                  <span>
                    {attachmentLabel(attachment)} · display position {attachment.displayOrder + 1}
                  </span>
                </div>
                <div className="attachment-actions">
                  <button
                    className="button button-secondary button-compact"
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => onView(attachment)}
                  >
                    {busyAction === viewKey ? "Authorizing" : "View"}
                  </button>
                  <button
                    className="button button-quiet button-compact"
                    type="button"
                    disabled={busyAction !== null}
                    onClick={() => onDownload(attachment)}
                  >
                    {busyAction === downloadKey ? "Authorizing" : "Download"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="evidence-pending-copy">Verified attachments are not available yet.</p>
      )}
    </article>
  );
}

export function EvidencePanel({
  client,
  incidentId,
  refreshRevision,
  audience,
}: EvidencePanelProps) {
  const [evidence, setEvidence] = useState<ViewerIncidentEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [preview, setPreview] = useState<ActivePreview | null>(null);
  const expiryTimer = useRef<number | null>(null);
  const previewUrl = useRef<string | null>(null);
  const actionRequest = useRef(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    setActionError(null);
    setBusyAction(null);
    setEvidence(null);
    setPreview(null);
    if (previewUrl.current !== null) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    actionRequest.current += 1;
    void fetchIncidentEvidence(client, incidentId, audience)
      .then((result) => {
        if (current) setEvidence(result);
      })
      .catch((reason) => {
        if (current) {
          setError(reason instanceof Error ? reason.message : "Evidence could not be loaded.");
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
      actionRequest.current += 1;
      if (expiryTimer.current !== null) window.clearTimeout(expiryTimer.current);
      expiryTimer.current = null;
      if (previewUrl.current !== null) {
        URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = null;
      }
    };
  }, [audience, client, incidentId, refreshRevision]);

  const attachmentsByGroup = useMemo(() => {
    const result = new Map<string, Array<EvidenceAttachment | ClientEvidenceAttachment>>();
    for (const attachment of evidence?.attachments ?? []) {
      const groupId = attachmentGroupId(attachment);
      const existing = result.get(groupId) ?? [];
      existing.push(attachment);
      result.set(groupId, existing);
    }
    for (const attachments of result.values()) {
      attachments.sort((left, right) => {
        if ("kind" in left || "kind" in right) {
          return attachmentOrder(left) - attachmentOrder(right);
        }
        const priority = rolePriority[left.role] - rolePriority[right.role];
        return priority === 0 ? left.sortOrder - right.sortOrder : priority;
      });
    }
    return result;
  }, [evidence]);

  function clearPreview() {
    if (expiryTimer.current !== null) window.clearTimeout(expiryTimer.current);
    expiryTimer.current = null;
    if (previewUrl.current !== null) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    setPreview(null);
  }

  async function viewAttachment(attachment: EvidenceAttachment | ClientEvidenceAttachment) {
    const request = actionRequest.current + 1;
    actionRequest.current = request;
    const key = `${attachmentId(attachment)}:view`;
    setBusyAction(key);
    setActionError(null);
    try {
      const grant = await requestAttachmentAccess(
        client,
        incidentId,
        attachmentId(attachment),
        "view",
      );
      if (actionRequest.current !== request) return;
      const blob = await fetchGrantedBlob(grant);
      if (actionRequest.current !== request) return;
      const objectUrl = URL.createObjectURL(blob);
      clearPreview();
      previewUrl.current = objectUrl;
      setPreview({ attachment, objectUrl, expiresAt: grant.expiresAt });
      const remaining = Math.min(
        300000,
        Math.max(0, Date.parse(grant.expiresAt) - Date.now()),
      );
      expiryTimer.current = window.setTimeout(clearPreview, remaining);
    } catch {
      if (actionRequest.current !== request) return;
      setActionError("Evidence could not be opened through the authorized access window.");
    } finally {
      if (actionRequest.current === request) setBusyAction(null);
    }
  }

  async function downloadAttachment(attachment: EvidenceAttachment | ClientEvidenceAttachment) {
    const request = actionRequest.current + 1;
    actionRequest.current = request;
    const key = `${attachmentId(attachment)}:download`;
    setBusyAction(key);
    setActionError(null);
    try {
      const grant = await requestAttachmentAccess(
        client,
        incidentId,
        attachmentId(attachment),
        "download",
      );
      if (actionRequest.current !== request) return;
      const blob = await fetchGrantedBlob(grant);
      if (actionRequest.current !== request) return;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      try {
        anchor.href = objectUrl;
        anchor.download = downloadName(attachment);
        anchor.rel = "noreferrer";
        document.body.append(anchor);
        anchor.click();
      } finally {
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      }
    } catch {
      if (actionRequest.current !== request) return;
      setActionError("Evidence could not be downloaded through the authorized access window.");
    } finally {
      if (actionRequest.current === request) setBusyAction(null);
    }
  }

  if (loading) {
    return <section className="evidence-panel panel-state" aria-live="polite">Loading evidence status</section>;
  }
  if (error || !evidence) {
    return <section className="evidence-panel alert alert-error" role="alert">{error ?? "Evidence is unavailable."}</section>;
  }

  const copy = stateCopy[evidence.state];
  const stateDetail = evidence.accessScope === "external_client_released" && evidence.state === "verified"
    ? "Only IDS-submitted marked photos and submitted videos are available through audited five-minute access grants."
    : copy.detail;
  return (
    <section className="evidence-panel" aria-labelledby="evidence-title">
      <div className="section-heading evidence-heading">
        <div>
          <p className="eyebrow">
            {evidence.accessScope === "external_client_released"
              ? "Client-released evidence"
              : "Private IDS evidence"}
          </p>
          <h2 id="evidence-title">Media delivery</h2>
        </div>
        <span className={`state-badge state-${evidence.state}`}>{copy.title}</span>
      </div>
      <p className="section-intro">{stateDetail}</p>

      {actionError ? <div className="alert alert-error" role="alert">{actionError}</div> : null}

      {preview ? (
        <EvidenceMediaPreview
          preview={preview}
          onClose={clearPreview}
        />
      ) : null}

      {evidence.groups.length > 0 ? (
        <div className="evidence-groups">
          {evidence.groups.map((group) => {
            if ("groupId" in group) {
              const attachments = (attachmentsByGroup.get(group.groupId) ?? []).filter(
                (attachment): attachment is ClientEvidenceAttachment => "kind" in attachment,
              );
              return (
                <ClientEvidenceGroupCard
                  key={group.groupId}
                  group={group}
                  attachments={attachments}
                  busyAction={busyAction}
                  onView={(attachment) => void viewAttachment(attachment)}
                  onDownload={(attachment) => void downloadAttachment(attachment)}
                />
              );
            }
            const attachments = (attachmentsByGroup.get(group.mediaGroupId) ?? []).filter(
              (attachment): attachment is EvidenceAttachment => !("kind" in attachment),
            );
            return (
              <article className="evidence-group" key={group.mediaGroupId}>
                <div className="evidence-group-heading">
                  <div>
                    <span className="group-kind">
                      {group.kind === "image" ? "Photo" : "Video"}
                    </span>
                    <h3>{groupLabel(group)}</h3>
                  </div>
                </div>
                <div className="client-evidence-facts">
                  <span>Evidence group {group.mediaGroupId}</span>
                  <span>Kind {group.kind === "image" ? "Photo" : "Video"}</span>
                  <span>Display position {group.displayOrder + 1}</span>
                  <span>Title {group.title ?? "Not provided"}</span>
                  <span>
                    Duration {group.durationMs === null ? "Not applicable" : `${group.durationMs} ms`}
                  </span>
                  <span>Note {group.note ?? "Not provided"}</span>
                </div>
                {attachments.length > 0 ? (
                  <ul className="attachment-list">
                    {attachments.map((attachment) => {
                      const id = attachmentId(attachment);
                      const viewKey = `${id}:view`;
                      const downloadKey = `${id}:download`;
                      return (
                        <li key={id}>
                          <div className="attachment-copy">
                            <strong>{attachmentLabel(attachment)}</strong>
                            <span>
                              Evidence {attachment.attachmentId} · group {attachment.mediaGroupId} · {attachmentLabel(attachment)} · display position {attachment.sortOrder + 1} · access authorized
                            </span>
                          </div>
                          <div className="attachment-actions">
                            <button
                              className="button button-secondary button-compact"
                              type="button"
                              disabled={busyAction !== null}
                              onClick={() => void viewAttachment(attachment)}
                            >
                              {busyAction === viewKey ? "Authorizing" : "View"}
                            </button>
                            <button
                              className="button button-quiet button-compact"
                              type="button"
                              disabled={busyAction !== null}
                              onClick={() => void downloadAttachment(attachment)}
                            >
                              {busyAction === downloadKey ? "Authorizing" : "Download"}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="evidence-pending-copy">Verified attachments are not available yet.</p>
                )}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
