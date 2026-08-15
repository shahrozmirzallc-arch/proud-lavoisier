import { describe, expect, it } from "vitest";
import { invalidateSessionBeforeRecheck } from "../src/security/sessionBoundary";

describe("Supabase Auth session replacement boundary", () => {
  it("invalidates requests and clears identity/data before scheduling getUser", () => {
    const identityGeneration = { current: 4 };
    const dashboardGeneration = { current: 7 };
    const pageGeneration = { current: 2 };
    const overtimeGeneration = { current: 9 };
    const state = {
      identity: "signed_in",
      snapshot: "higher-privilege-snapshot",
      overtime: "client-queue",
    };
    const order: string[] = [];

    invalidateSessionBeforeRecheck({
      generations: [
        identityGeneration,
        dashboardGeneration,
        pageGeneration,
        overtimeGeneration,
      ],
      clearIdentity: () => {
        order.push("identity-cleared");
        state.identity = "checking";
      },
      clearAuthorizedView: () => {
        order.push("view-cleared");
        state.snapshot = "";
        state.overtime = "";
      },
      scheduleAuthoritativeRecheck: () => {
        order.push("getUser-scheduled");
        expect(state).toEqual({ identity: "checking", snapshot: "", overtime: "" });
        expect([
          identityGeneration.current,
          dashboardGeneration.current,
          pageGeneration.current,
          overtimeGeneration.current,
        ]).toEqual([5, 8, 3, 10]);
      },
    });

    expect(order).toEqual(["identity-cleared", "view-cleared", "getUser-scheduled"]);
  });
});
