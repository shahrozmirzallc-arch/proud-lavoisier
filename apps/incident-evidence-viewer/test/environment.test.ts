import { describe, expect, it } from "vitest";
import {
  readViewerEnvironment,
  STAGING_ORIGIN,
} from "../src/security/environment";

const validEnvironment = {
  MODE: "test",
  DEV: true,
  VITE_SUPABASE_URL: STAGING_ORIGIN,
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_unit_test_value_only",
};

describe("isolated staging environment", () => {
  it("accepts the exact staging origin and a publishable key", () => {
    expect(readViewerEnvironment(validEnvironment)).toEqual({
      supabaseUrl: STAGING_ORIGIN,
      publishableKey: validEnvironment.VITE_SUPABASE_PUBLISHABLE_KEY,
    });
  });

  it.each([
    { ...validEnvironment, VITE_SUPABASE_URL: "https://production-shaped-ref.supabase.co" },
    { ...validEnvironment, VITE_SUPABASE_URL: "https://unknownprojectref000.supabase.co" },
    { ...validEnvironment, VITE_SUPABASE_URL: "https://example.invalid" },
    { ...validEnvironment, VITE_SUPABASE_URL: STAGING_ORIGIN.replace("https:", "http:") },
    { ...validEnvironment, VITE_SUPABASE_URL: `${STAGING_ORIGIN}/` },
  ])("rejects production-shaped, arbitrary, insecure, and non-exact origins", (environment) => {
    expect(() => readViewerEnvironment(environment)).toThrow();
  });

  it.each([
    { ...validEnvironment, VITE_SUPABASE_SERVICE_ROLE_KEY: "forbidden" },
    { ...validEnvironment, SUPABASE_SECRET_KEY: "forbidden" },
    { ...validEnvironment, VITE_SUPABASE_ANON_KEY: "forbidden" },
    { ...validEnvironment, VITE_DEMO_MODE: "false" },
    { ...validEnvironment, VITE_FALLBACK_URL: "https://example.invalid" },
  ])("rejects privileged, legacy, unknown, and demo environment names", (environment) => {
    expect(() => readViewerEnvironment(environment)).toThrow();
  });

  it.each([
    "legacy-anon-value",
    "eyJheader.payload.signature",
    "sb_secret_not_for_a_browser",
    "sb_publishable_short",
  ])("rejects a non-publishable browser key", (key) => {
    expect(() => readViewerEnvironment({
      ...validEnvironment,
      VITE_SUPABASE_PUBLISHABLE_KEY: key,
    })).toThrow();
  });
});
