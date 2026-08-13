import type { SupabaseClient } from "@supabase/supabase-js";
import type { IncidentSummary } from "../types";
import { EvidencePanel } from "./EvidencePanel";

interface IncidentDetailProps {
  client: SupabaseClient;
  incident: IncidentSummary;
  evidenceRefreshRevision: number;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function displayValue(value: string | null): string {
  return value?.trim() ? value : "Not provided";
}

function concernLevel(incident: IncidentSummary): string {
  if (incident.levelOfConcern?.trim().toLowerCase() === "other") {
    return displayValue(incident.levelOfConcernOther);
  }
  return displayValue(incident.levelOfConcern);
}

function triStateLabel(value: "yes" | "no" | "unknown"): string {
  if (value === "yes") return "Yes";
  if (value === "no") return "No";
  return "Not confirmed";
}

export function IncidentDetail({
  client,
  incident,
  evidenceRefreshRevision,
}: IncidentDetailProps) {
  return (
    <article className="incident-detail">
      <header className="incident-header">
        <div>
          <p className="eyebrow">Released Incident</p>
          <h1>{incident.defectType ?? "Quality incident"}</h1>
          <p className="incident-reference">{incident.id}</p>
        </div>
        <div className="release-marker">
          <span>Released to dashboard</span>
          <time dateTime={incident.releasedAt}>
            {dateFormatter.format(new Date(incident.releasedAt))}
          </time>
        </div>
      </header>

      <section className="detail-panel" aria-labelledby="incident-summary-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Incident core</p>
            <h2 id="incident-summary-title">What the Rep reported</h2>
          </div>
          <span className="status-chip">{incident.status}</span>
        </div>

        <dl className="detail-grid detail-grid-primary">
          <div>
            <dt>Project</dt>
            <dd>{incident.projectId}</dd>
          </div>
          <div>
            <dt>Rep</dt>
            <dd>{incident.repName}</dd>
          </div>
          <div>
            <dt>Plant</dt>
            <dd>{displayValue(incident.plantId)}</dd>
          </div>
          <div>
            <dt>Supplier</dt>
            <dd>{displayValue(incident.supplierId)}</dd>
          </div>
          <div>
            <dt>Part</dt>
            <dd>{displayValue(incident.partId)}</dd>
          </div>
          <div>
            <dt>Area</dt>
            <dd>{displayValue(incident.area)}</dd>
          </div>
        </dl>

        <div className="narrative-grid">
          <div>
            <h3>Description</h3>
            <p>{incident.description}</p>
          </div>
          <div>
            <h3>Immediate action</h3>
            <p>{displayValue(incident.actionTaken)}</p>
          </div>
        </div>

        <dl className="detail-grid action-grid">
          <div>
            <dt>Concern classification</dt>
            <dd>{displayValue(incident.concernClassification)}</dd>
          </div>
          <div>
            <dt>Level of concern</dt>
            <dd>{concernLevel(incident)}</dd>
          </div>
          <div>
            <dt>Returned to supplier</dt>
            <dd>{triStateLabel(incident.returnedToSupplierStatus)}</dd>
          </div>
          <div>
            <dt>Sort requested</dt>
            <dd>{triStateLabel(incident.sortRequestedStatus)}</dd>
          </div>
          <div>
            <dt>RMA required</dt>
            <dd>{triStateLabel(incident.rmaRequiredStatus)}</dd>
          </div>
          <div>
            <dt>RMA number</dt>
            <dd>{displayValue(incident.rmaNumber)}</dd>
          </div>
        </dl>
      </section>

      <EvidencePanel
        client={client}
        incidentId={incident.id}
        refreshRevision={evidenceRefreshRevision}
      />
    </article>
  );
}
