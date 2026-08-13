import type { IncidentSummary } from "../types";

interface IncidentListProps {
  incidents: IncidentSummary[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (incidentId: string) => void;
}

const releaseFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function IncidentList({
  incidents,
  selectedId,
  loading,
  onSelect,
}: IncidentListProps) {
  return (
    <aside className="incident-rail" aria-labelledby="incident-list-title">
      <div className="rail-heading">
        <div>
          <p className="eyebrow">Immediate releases</p>
          <h2 id="incident-list-title">Incidents</h2>
        </div>
        <span className="count-badge" aria-label={`${incidents.length} incidents`}>
          {incidents.length}
        </span>
      </div>

      {loading && incidents.length === 0 ? (
        <div className="rail-state" role="status">Loading released incidents</div>
      ) : incidents.length === 0 ? (
        <div className="rail-state">
          <strong>No released incidents</strong>
          <span>Nothing is currently available to this authenticated account.</span>
        </div>
      ) : (
        <ol className="incident-list">
          {incidents.map((incident) => {
            const selected = incident.id === selectedId;
            return (
              <li key={incident.id}>
                <button
                  className={`incident-list-item${selected ? " is-selected" : ""}`}
                  type="button"
                  aria-current={selected ? "true" : undefined}
                  onClick={() => onSelect(incident.id)}
                >
                  <span className="incident-list-meta">
                    <span>{incident.id}</span>
                    <time dateTime={incident.releasedAt}>
                      {releaseFormatter.format(new Date(incident.releasedAt))}
                    </time>
                  </span>
                  <strong>{incident.defectType ?? "Quality incident"}</strong>
                  <span className="incident-list-description">{incident.description}</span>
                  <span className="incident-list-project">Project {incident.projectId}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
