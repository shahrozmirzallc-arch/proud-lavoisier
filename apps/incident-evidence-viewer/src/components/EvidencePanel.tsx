import { useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchIncidentEvidence, requestAttachmentAccess } from "../data/viewerApi";
import type {
  AttachmentGrant,
  EvidenceAttachment,
  EvidenceGroup,
  EvidenceState,
  IncidentEvidence,
} from "../types";

interface EvidencePanelProps {
  client: SupabaseClient;
  incidentId: string;
  refreshRevision: number;
}

interface ActivePreview {
  attachment: EvidenceAttachment;
  grant: AttachmentGrant;
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

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1048576) return `${(byteSize / 1024).toFixed(1)} KB`;
  return `${(byteSize / 1048576).toFixed(1)} MB`;
}

function groupLabel(group: EvidenceGroup): string {
  if (group.title) return group.title;
  return group.kind === "image"
    ? `Photo ${group.displayOrder + 1}`
    : "Incident video";
}

export function EvidencePanel({ client, incidentId, refreshRevision }: EvidencePanelProps) {
  const [evidence, setEvidence] = useState<IncidentEvidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [preview, setPreview] = useState<ActivePreview | null>(null);
  const expiryTimer = useRef<number | null>(null);
  const actionRequest = useRef(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError(null);
    setActionError(null);
    setBusyAction(null);
    setEvidence(null);
    setPreview(null);
    actionRequest.current += 1;
    void fetchIncidentEvidence(client, incidentId)
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
      if (expiryTimer.current !== null) window.clearTimeout(expiryTimer.current);
    };
  }, [client, incidentId, refreshRevision]);

  const attachmentsByGroup = useMemo(() => {
    const result = new Map<string, EvidenceAttachment[]>();
    for (const attachment of evidence?.attachments ?? []) {
      const existing = result.get(attachment.mediaGroupId) ?? [];
      existing.push(attachment);
      result.set(attachment.mediaGroupId, existing);
    }
    for (const attachments of result.values()) {
      attachments.sort((left, right) => {
        const priority = rolePriority[left.role] - rolePriority[right.role];
        return priority === 0 ? left.sortOrder - right.sortOrder : priority;
      });
    }
    return result;
  }, [evidence]);

  function clearPreview() {
    if (expiryTimer.current !== null) window.clearTimeout(expiryTimer.current);
    expiryTimer.current = null;
    setPreview(null);
  }

  async function viewAttachment(attachment: EvidenceAttachment) {
    const request = actionRequest.current + 1;
    actionRequest.current = request;
    const key = `${attachment.attachmentId}:view`;
    setBusyAction(key);
    setActionError(null);
    try {
      const grant = await requestAttachmentAccess(
        client,
        incidentId,
        attachment.attachmentId,
        "view",
      );
      if (actionRequest.current !== request) return;
      clearPreview();
      setPreview({ attachment, grant });
      const remaining = Math.min(
        300000,
        Math.max(0, Date.parse(grant.expiresAt) - Date.now()),
      );
      expiryTimer.current = window.setTimeout(clearPreview, remaining);
    } catch (reason) {
      if (actionRequest.current !== request) return;
      setActionError(
        reason instanceof Error ? reason.message : "Evidence access could not be authorized.",
      );
    } finally {
      if (actionRequest.current === request) setBusyAction(null);
    }
  }

  async function downloadAttachment(attachment: EvidenceAttachment) {
    const request = actionRequest.current + 1;
    actionRequest.current = request;
    const key = `${attachment.attachmentId}:download`;
    setBusyAction(key);
    setActionError(null);
    try {
      const grant = await requestAttachmentAccess(
        client,
        incidentId,
        attachment.attachmentId,
        "download",
      );
      if (actionRequest.current !== request) return;
      const anchor = document.createElement("a");
      anchor.href = grant.signedUrl;
      anchor.rel = "noreferrer";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } catch (reason) {
      if (actionRequest.current !== request) return;
      setActionError(
        reason instanceof Error ? reason.message : "Evidence download could not be authorized.",
      );
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
  return (
    <section className="evidence-panel" aria-labelledby="evidence-title">
      <div className="section-heading evidence-heading">
        <div>
          <p className="eyebrow">Private evidence</p>
          <h2 id="evidence-title">Media delivery</h2>
        </div>
        <span className={`state-badge state-${evidence.state}`}>{copy.title}</span>
      </div>
      <p className="section-intro">{copy.detail}</p>

      {actionError ? <div className="alert alert-error" role="alert">{actionError}</div> : null}

      {preview ? (
        <div className="preview-panel" aria-live="polite">
          <div className="preview-heading">
            <div>
              <strong>{roleLabels[preview.attachment.role]}</strong>
              <span>Access closes at {new Date(preview.grant.expiresAt).toLocaleTimeString()}</span>
            </div>
            <button className="button button-secondary button-compact" type="button" onClick={clearPreview}>
              Close preview
            </button>
          </div>
          {preview.attachment.detectedMimeType === "image/jpeg" ? (
            <img
              className="evidence-image"
              src={preview.grant.signedUrl}
              alt={`${roleLabels[preview.attachment.role]} for Incident ${incidentId}`}
            />
          ) : preview.attachment.detectedMimeType === "video/mp4" ? (
            <video className="evidence-video" src={preview.grant.signedUrl} controls preload="metadata">
              This browser cannot play the verified Incident video.
            </video>
          ) : (
            <div className="annotation-preview">
              <p>Drawing data is available as the verified machine-readable annotation file.</p>
              <a href={preview.grant.signedUrl} target="_blank" rel="noreferrer">
                Open drawing data before access expires
              </a>
            </div>
          )}
        </div>
      ) : null}

      {evidence.groups.length > 0 ? (
        <div className="evidence-groups">
          {evidence.groups.map((group) => {
            const attachments = attachmentsByGroup.get(group.mediaGroupId) ?? [];
            return (
              <article className="evidence-group" key={group.mediaGroupId}>
                <div className="evidence-group-heading">
                  <div>
                    <span className="group-kind">{group.kind === "image" ? "Photo" : "Video"}</span>
                    <h3>{groupLabel(group)}</h3>
                  </div>
                  <span>{group.originalName}</span>
                </div>
                {group.note ? <p className="evidence-note">{group.note}</p> : null}
                {attachments.length > 0 ? (
                  <ul className="attachment-list">
                    {attachments.map((attachment) => {
                      const viewKey = `${attachment.attachmentId}:view`;
                      const downloadKey = `${attachment.attachmentId}:download`;
                      return (
                        <li key={attachment.attachmentId}>
                          <div className="attachment-copy">
                            <strong>{roleLabels[attachment.role]}</strong>
                            <span>
                              {formatBytes(attachment.verifiedByteSize)} · {attachment.detectedMimeType}
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
