import type {
  DashboardActor,
  DashboardFeedItem,
  DashboardSection,
  ClientOvertimeFeed,
} from "../types";
import {
  availableDashboardSections,
  sectionForFeedItem,
} from "../dashboardModel";

interface DashboardNavigationProps {
  actor: DashboardActor;
  activeSection: DashboardSection;
  feedItems: DashboardFeedItem[];
  overtime: ClientOvertimeFeed | null;
  onSelect: (section: DashboardSection) => void;
}

function sectionCount(
  section: DashboardSection,
  items: DashboardFeedItem[],
  overtime: ClientOvertimeFeed | null,
): number | null {
  if (section === "overview" || section === "configuration") return null;
  if (section === "overtime") return overtime?.items.length ?? 0;
  return items.filter((item) => sectionForFeedItem(item) === section).length;
}

export function DashboardNavigation({
  actor,
  activeSection,
  feedItems,
  overtime,
  onSelect,
}: DashboardNavigationProps) {
  const sections = availableDashboardSections(actor.capabilities);
  return (
    <aside className="dashboard-rail">
      <div className="actor-card">
        <span className="actor-monogram" aria-hidden="true">
          {actor.displayName.trim().slice(0, 1).toUpperCase()}
        </span>
        <div>
          <strong>{actor.displayName}</strong>
          <span>{actor.roleLabel}</span>
        </div>
      </div>
      <nav className="dashboard-nav" aria-label="Authorized dashboard sections">
        <p className="nav-label">Authorized workspace</p>
        {sections.map((section) => {
          const count = sectionCount(section.id, feedItems, overtime);
          return (
            <button
              className={activeSection === section.id ? "dashboard-nav-item is-active" : "dashboard-nav-item"}
              type="button"
              key={section.id}
              aria-current={activeSection === section.id ? "page" : undefined}
              onClick={() => onSelect(section.id)}
            >
              <span>{section.shortLabel}</span>
              {count !== null ? <span className="nav-count">{count}</span> : null}
            </button>
          );
        })}
      </nav>
      <div className="rail-boundary-note">
        <strong>Read-only by design</strong>
        <span>Sections come from server-issued capabilities. Each dataset is authorized again by Supabase.</span>
      </div>
    </aside>
  );
}
