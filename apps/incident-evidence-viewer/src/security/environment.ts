export const STAGING_PROJECT_REF = "qatoyevwtjjtynisodyq";
export const STAGING_ORIGIN = `https://${STAGING_PROJECT_REF}.supabase.co`;

const PUBLISHABLE_KEY_PATTERN = /^sb_publishable_[A-Za-z0-9_-]{16,}$/;
const DEMO_NAME_PATTERN = /(?:^|_)demo(?:_|$)/i;
const ALLOWED_SUPABASE_NAMES = new Set([
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
]);

export interface ViewerEnvironment {
  supabaseUrl: typeof STAGING_ORIGIN;
  publishableKey: string;
}

function presentEntries(environment: Record<string, unknown>) {
  return Object.entries(environment).filter(([, value]) => value !== undefined);
}

export function assertNoForbiddenEnvironmentNames(
  environment: Record<string, unknown>,
): void {
  for (const [name] of presentEntries(environment)) {
    if (DEMO_NAME_PATTERN.test(name)) {
      throw new Error("Demo mode is forbidden in the Incident Evidence Viewer.");
    }
    if (/supabase/i.test(name) && !ALLOWED_SUPABASE_NAMES.has(name)) {
      throw new Error("Only the isolated Supabase viewer variables are allowed.");
    }
    if (name.startsWith("VITE_") && !ALLOWED_SUPABASE_NAMES.has(name)) {
      throw new Error("Unexpected public browser environment variables are forbidden.");
    }
  }
}

export function readViewerEnvironment(
  environment: Record<string, unknown>,
): ViewerEnvironment {
  assertNoForbiddenEnvironmentNames(environment);

  const rawUrl = environment.VITE_SUPABASE_URL;
  const rawKey = environment.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (typeof rawUrl !== "string" || rawUrl !== STAGING_ORIGIN) {
    throw new Error("The Incident Evidence Viewer is locked to IDS staging.");
  }
  if (typeof rawKey !== "string" || !PUBLISHABLE_KEY_PATTERN.test(rawKey)) {
    throw new Error("A staging publishable key is required.");
  }

  return {
    supabaseUrl: STAGING_ORIGIN,
    publishableKey: rawKey,
  };
}
