import { describe, expect, it } from "vitest";
import {
  availableDashboardSections,
  canMountIncidentEvidence,
  configurationAttentionItems,
  feedItemIsVisible,
  shouldQueryClientOvertime,
} from "../src/dashboardModel";
import type {
  DashboardCapabilities,
  DashboardFeedItemOfKind,
} from "../src/types";

function capabilities(
  overrides: Partial<DashboardCapabilities> = {},
): DashboardCapabilities {
  return {
    qualitySources: false,
    incidentCore: false,
    incidentEvidence: false,
    dailyReports: false,
    hours: false,
    clientOvertimeReview: false,
    expenses: false,
    financeEvidence: false,
    configurationAttention: false,
    ...overrides,
  };
}

const urgentItem: DashboardFeedItemOfKind<"urgent_incident"> = {
  kind: "urgent_incident",
  entityId: "incident-1",
  projectId: "project-1",
  assignmentId: "assignment-1",
  workDate: "2026-08-14",
  recordedAt: "2026-08-14T14:00:00.000Z",
  title: "Urgent Incident",
  summary: null,
  state: "released",
  details: {
    contractVersion: "legacy",
    partId: null,
    defectType: null,
    area: null,
    quantity: null,
    actionTaken: null,
    levelOfConcern: null,
    revisionNumber: 1,
    releaseStatus: "released",
    releasedToClient: true,
    recordDelivery: "stored",
    dashboardDelivery: "available",
    externalDelivery: null,
    externalDeliveryMessage: null,
    adminAttention: null,
    adminApprovalRequired: false,
    mediaEvidenceStatus: "verified_private_storage",
    evidenceAccessible: true,
  },
};

describe("capability composition behavior", () => {
  it.each([
    {
      composition: "operations and configuration",
      caps: capabilities({
        qualitySources: true,
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        hours: true,
        configurationAttention: true,
      }),
      sections: ["overview", "quality", "urgent", "daily", "hours", "configuration"],
    },
    {
      composition: "external review without unified Hours",
      caps: capabilities({
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        clientOvertimeReview: true,
      }),
      sections: ["overview", "urgent", "daily", "overtime"],
    },
    {
      composition: "finance metadata",
      caps: capabilities({ hours: true, expenses: true, financeEvidence: true }),
      sections: ["overview", "hours", "expenses"],
    },
    {
      composition: "core and Daily without evidence",
      caps: capabilities({ incidentCore: true, dailyReports: true }),
      sections: ["overview", "urgent", "daily"],
    },
  ])("renders the exact $composition capabilities", ({ caps, sections }) => {
    expect(availableDashboardSections(caps).map((section) => section.id)).toEqual(sections);
  });

  it("queries the separate OT feed only when its exact capability is true", () => {
    expect(shouldQueryClientOvertime(capabilities({ clientOvertimeReview: true }))).toBe(true);
    expect(shouldQueryClientOvertime(capabilities({ hours: true }))).toBe(false);
  });

  it("requires core, actor evidence, and per-Incident evidence authorization", () => {
    const authorizedActor = capabilities({ incidentCore: true, incidentEvidence: true });
    expect(canMountIncidentEvidence(authorizedActor, urgentItem)).toBe(true);
    expect(canMountIncidentEvidence(authorizedActor, {
      ...urgentItem,
      details: { ...urgentItem.details, evidenceAccessible: false },
    })).toBe(false);
    expect(canMountIncidentEvidence(capabilities({ incidentEvidence: true }), urgentItem)).toBe(false);
  });

  it("shows only the positive configuration-attention allowlist in the view model", () => {
    const normal = {
      ...urgentItem,
      entityId: "incident-normal",
      details: { ...urgentItem.details, adminAttention: "none" },
    };
    const required = {
      ...urgentItem,
      entityId: "incident-contact-required",
      details: { ...urgentItem.details, adminAttention: "client_contact_required" },
    };
    const unknown = {
      ...urgentItem,
      entityId: "incident-future-state",
      details: { ...urgentItem.details, adminAttention: "future_safe_state" },
    };
    expect(configurationAttentionItems([normal, required, unknown])).toEqual([required]);
  });
});

describe("SQL-derived role capability fixtures", () => {
  it.each([
    {
      role: "IDS Rep",
      caps: capabilities({
        qualitySources: true,
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        hours: true,
      }),
      sections: ["overview", "quality", "urgent", "daily", "hours"],
      evidence: true,
      overtime: false,
    },
    {
      role: "IDS Admin / Lead",
      caps: capabilities({
        qualitySources: true,
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        hours: true,
        configurationAttention: true,
      }),
      sections: ["overview", "quality", "urgent", "daily", "hours", "configuration"],
      evidence: true,
      overtime: false,
    },
    {
      role: "Owner / Superadmin",
      caps: capabilities({
        qualitySources: true,
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        hours: true,
        expenses: true,
        financeEvidence: true,
        configurationAttention: true,
      }),
      sections: ["overview", "quality", "urgent", "daily", "hours", "expenses", "configuration"],
      evidence: true,
      overtime: false,
    },
    {
      role: "Accountant / Finance",
      caps: capabilities({ hours: true, expenses: true, financeEvidence: true }),
      sections: ["overview", "hours", "expenses"],
      evidence: false,
      overtime: false,
    },
    {
      role: "Accountant with mandatory core and Daily enabled",
      caps: capabilities({
        incidentCore: true,
        dailyReports: true,
        hours: true,
        expenses: true,
        financeEvidence: true,
      }),
      sections: ["overview", "urgent", "daily", "hours", "expenses"],
      evidence: false,
      overtime: false,
    },
    {
      role: "Client with authorized core, Daily, and Incident evidence membership",
      caps: capabilities({
        incidentCore: true,
        incidentEvidence: true,
        dailyReports: true,
        clientOvertimeReview: true,
      }),
      sections: ["overview", "urgent", "daily", "overtime"],
      evidence: true,
      overtime: true,
    },
    {
      role: "Supplier with core and Daily membership flags enabled",
      caps: capabilities({ incidentCore: true, dailyReports: true }),
      sections: ["overview", "urgent", "daily"],
      evidence: false,
      overtime: false,
    },
    {
      role: "Mandatory IDS with core and Daily roster flags enabled",
      caps: capabilities({ incidentCore: true, dailyReports: true }),
      sections: ["overview", "urgent", "daily"],
      evidence: false,
      overtime: false,
    },
  ])("matches SQL grants for $role", ({ caps, sections, evidence, overtime }) => {
    expect(availableDashboardSections(caps).map((section) => section.id)).toEqual(sections);
    expect(shouldQueryClientOvertime(caps)).toBe(overtime);
    expect(canMountIncidentEvidence(caps, urgentItem)).toBe(evidence);
    expect(feedItemIsVisible(urgentItem, caps)).toBe(caps.incidentCore);
  });

  it("keeps Client unified Hours false even while the separate OT queue is enabled", () => {
    const client = capabilities({
      incidentCore: true,
      dailyReports: true,
      clientOvertimeReview: true,
    });
    expect(client.hours).toBe(false);
    expect(availableDashboardSections(client).map((section) => section.id)).not.toContain("hours");
    expect(shouldQueryClientOvertime(client)).toBe(true);
  });

  it("keeps Supplier and non-Accountant mandatory access configurable but core-only for evidence", () => {
    for (const external of [
      capabilities({ incidentCore: true }),
      capabilities({ incidentCore: true, dailyReports: true }),
    ]) {
      expect(external.hours).toBe(false);
      expect(external.expenses).toBe(false);
      expect(external.financeEvidence).toBe(false);
      expect(external.incidentEvidence).toBe(false);
      expect(external.clientOvertimeReview).toBe(false);
      expect(canMountIncidentEvidence(external, urgentItem)).toBe(false);
    }
  });
});
