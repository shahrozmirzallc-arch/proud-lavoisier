import type {
  DashboardCapabilities,
  DashboardFeedItem,
  DashboardFeedItemOfKind,
  DashboardSection,
} from "./types";

export interface DashboardSectionDefinition {
  id: DashboardSection;
  label: string;
  shortLabel: string;
}

export type ConfigurationAttentionItem =
  | DashboardFeedItemOfKind<"urgent_incident">
  | DashboardFeedItemOfKind<"daily_report">;

const CONFIGURATION_ATTENTION_ALLOWLIST = new Set(["client_contact_required"]);

const SECTION_DEFINITIONS: Readonly<Record<DashboardSection, DashboardSectionDefinition>> = {
  overview: { id: "overview", label: "Operational overview", shortLabel: "Overview" },
  quality: { id: "quality", label: "Quality source records", shortLabel: "Quality" },
  urgent: { id: "urgent", label: "Urgent Incidents", shortLabel: "Urgent" },
  daily: { id: "daily", label: "Daily reports", shortLabel: "Daily" },
  hours: { id: "hours", label: "Hours submissions", shortLabel: "Hours" },
  overtime: { id: "overtime", label: "Pending overtime review", shortLabel: "Client OT" },
  expenses: { id: "expenses", label: "Expense metadata", shortLabel: "Expenses" },
  configuration: {
    id: "configuration",
    label: "Configuration attention",
    shortLabel: "Attention",
  },
};

export function availableDashboardSections(
  capabilities: DashboardCapabilities,
): DashboardSectionDefinition[] {
  const sections = [SECTION_DEFINITIONS.overview];
  if (capabilities.qualitySources) sections.push(SECTION_DEFINITIONS.quality);
  if (capabilities.incidentCore) sections.push(SECTION_DEFINITIONS.urgent);
  if (capabilities.dailyReports) sections.push(SECTION_DEFINITIONS.daily);
  if (capabilities.hours) sections.push(SECTION_DEFINITIONS.hours);
  if (capabilities.clientOvertimeReview) sections.push(SECTION_DEFINITIONS.overtime);
  if (capabilities.expenses) sections.push(SECTION_DEFINITIONS.expenses);
  if (capabilities.configurationAttention) sections.push(SECTION_DEFINITIONS.configuration);
  return sections;
}

export function sectionForFeedItem(item: DashboardFeedItem): DashboardSection {
  switch (item.kind) {
    case "routine_inspection":
    case "rework":
      return "quality";
    case "urgent_incident":
      return "urgent";
    case "daily_report":
      return "daily";
    case "hours":
      return "hours";
    case "expense":
      return "expenses";
  }
}

export function feedItemIsVisible(
  item: DashboardFeedItem,
  capabilities: DashboardCapabilities,
): boolean {
  switch (sectionForFeedItem(item)) {
    case "quality":
      return capabilities.qualitySources;
    case "urgent":
      return capabilities.incidentCore;
    case "daily":
      return capabilities.dailyReports;
    case "hours":
      return capabilities.hours;
    case "expenses":
      return capabilities.expenses;
    case "overview":
    case "overtime":
    case "configuration":
      return false;
  }
}

export function canMountIncidentEvidence(
  capabilities: DashboardCapabilities,
  item: DashboardFeedItem,
): item is DashboardFeedItemOfKind<"urgent_incident"> {
  return (
    capabilities.incidentCore &&
    capabilities.incidentEvidence &&
    item.kind === "urgent_incident" &&
    item.details.evidenceAccessible
  );
}

export function shouldQueryClientOvertime(capabilities: DashboardCapabilities): boolean {
  return capabilities.clientOvertimeReview;
}

export function configurationAttentionItems(
  items: readonly DashboardFeedItem[],
): ConfigurationAttentionItem[] {
  return items.filter((item): item is ConfigurationAttentionItem => (
    (item.kind === "urgent_incident" || item.kind === "daily_report") &&
    item.details.adminAttention !== null &&
    CONFIGURATION_ATTENTION_ALLOWLIST.has(item.details.adminAttention)
  ));
}
