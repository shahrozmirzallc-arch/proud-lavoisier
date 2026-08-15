import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appRoot = resolve(import.meta.dirname, "..");
const sourceRoot = join(appRoot, "src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("static fail-closed boundary", () => {
  it("does not store roles or signed URLs in browser storage", () => {
    const source = sourceFiles(sourceRoot).map(read).join("\n");
    expect(source).not.toMatch(/localStorage|sessionStorage/);
    expect(source).not.toContain("dangerouslySetInnerHTML");
    expect(source).not.toMatch(/\.select\(\s*["']\*["']/);
  });

  it("keeps raw Storage APIs and private attachment tables out of the viewer", () => {
    const apiSource = read(join(sourceRoot, "data", "viewerApi.ts"));
    expect(apiSource).not.toContain("storage.from");
    expect(apiSource).not.toContain("mobile_incident_attachments");
    expect(apiSource).not.toContain("mobile_incident_evidence_slots");
    expect(apiSource).toContain("get_mobile_incident_evidence");
    expect(apiSource).toContain("authorize-incident-evidence");
    expect(apiSource).toContain("get_mobile_dashboard_snapshot");
    expect(apiSource).toContain("get_mobile_dashboard_feed");
    expect(apiSource).toContain("get_client_mobile_overtime_review_feed");
    expect(apiSource).not.toContain('rpc("get_mobile_dashboard_actor"');
    expect(apiSource).not.toMatch(/\.from\(\s*["']incidents["']/);
    expect(apiSource).not.toContain("x-ids-pulse-client");
    expect(apiSource).not.toMatch(/global:\s*\{\s*headers:/);
    expect(apiSource).toContain('headers.delete("x-client-info")');
    expect(apiSource).toContain("global: { fetch: viewerFetch }");
  });

  it("uses the authoritative Auth user endpoint and no client-side role claims", () => {
    const apiSource = read(join(sourceRoot, "data", "viewerApi.ts"));
    const source = sourceFiles(sourceRoot).map(read).join("\n");
    expect(apiSource).toContain("client.auth.getUser()");
    expect(apiSource).not.toContain("getSession(");
    expect(source).not.toMatch(/user_metadata|app_metadata/);
  });

  it("keeps role rendering capability-based and evidence double-gated", () => {
    const appSource = read(join(sourceRoot, "App.tsx"));
    const modelSource = read(join(sourceRoot, "dashboardModel.ts"));
    const viewSource = read(join(sourceRoot, "components", "DashboardView.tsx"));
    expect(appSource).toContain("fetchDashboardSnapshot");
    expect(appSource).toContain("shouldQueryClientOvertime");
    expect(appSource).not.toMatch(/role\s*===|roleLabel\s*===/);
    const overtimeGuard = appSource.indexOf(
      "if (!shouldQueryClientOvertime(currentActor.capabilities))",
    );
    const overtimeCall = appSource.indexOf(
      "const nextOvertime = await fetchClientOvertimeReviewFeed(",
      overtimeGuard,
    );
    expect(overtimeGuard).toBeGreaterThanOrEqual(0);
    expect(overtimeCall).toBeGreaterThan(overtimeGuard);
    expect(modelSource).toContain("capabilities.incidentCore");
    expect(modelSource).toContain("capabilities.incidentEvidence");
    expect(modelSource).toContain("item.details.evidenceAccessible");
    expect(viewSource).toContain("canMountIncidentEvidence");
    expect(viewSource).toContain("configurationAttentionItems(items)");
    expect(viewSource).not.toContain("item.details.adminAttention !== null");
    expect(viewSource).not.toMatch(/receipt_(?:url|path)|storage_path|object_name/);
  });

  it("keeps external evidence audience-scoped, media-capable, and metadata-minimal", () => {
    const contractsSource = read(join(sourceRoot, "data", "contracts.ts"));
    const viewSource = read(join(sourceRoot, "components", "DashboardView.tsx"));
    const evidenceSource = read(join(sourceRoot, "components", "EvidencePanel.tsx"));
    expect(contractsSource).toContain('value.access_scope !== "external_client_released"');
    expect(contractsSource).toContain('value.access_scope !== "ids_internal_full"');
    expect(contractsSource).toContain('kind !== "marked_image" && kind !== "submitted_video"');
    expect(viewSource).toContain('"IDS Rep"');
    expect(viewSource).toContain('"IDS Office"');
    expect(viewSource).toContain('"IDS Office & Finance"');
    expect(viewSource).toContain('? "ids_internal"');
    expect(viewSource).toContain(': "external_client"');
    expect(viewSource).not.toContain("author.id");
    expect(evidenceSource).toContain('<img');
    expect(evidenceSource).toContain('<video');
    expect(evidenceSource).toContain("fetch(grant.signedUrl");
    expect(evidenceSource).toContain("URL.createObjectURL(blob)");
    expect(evidenceSource).toContain("URL.revokeObjectURL");
    expect(evidenceSource).toContain("src={preview.objectUrl}");
    expect(evidenceSource).not.toContain("src={preview.grant.signedUrl}");
    expect(evidenceSource).not.toContain("href={preview.grant.signedUrl}");
    expect(evidenceSource).not.toContain("setPreview({ attachment, grant })");
    expect(evidenceSource).toContain('"Marked photo"');
    expect(evidenceSource).toContain('"Submitted video"');
    expect(evidenceSource).not.toMatch(
      /localMediaId|originalName|verifiedSha256|verifiedByteSize|detectedMimeType|sealedObjectName/,
    );
    expect(evidenceSource).not.toMatch(/console\.(?:log|info|debug|warn|error)/);
  });

  it("does not truncate authorized text or ship emoji decoration", () => {
    const source = sourceFiles(sourceRoot).map(read).join("\n");
    const styles = read(join(sourceRoot, "styles.css"));
    expect(styles).not.toMatch(/text-overflow\s*:/i);
    expect(styles).not.toMatch(/(?:-webkit-)?line-clamp\s*:/i);
    expect(styles).not.toMatch(/white-space\s*:\s*nowrap/i);
    expect(styles).toMatch(/\.urgent-index-item span\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(styles).toMatch(/\.urgent-index-item small\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(source).not.toContain("Not supplied");
    expect(source).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("commits actor and feed atomically to the authoritative user ID", () => {
    const appSource = read(join(sourceRoot, "App.tsx"));
    expect(appSource).toContain("interface DashboardSnapshot");
    expect(appSource).toContain("userId: string");
    expect(appSource).toContain("serverTimestamp: nextSnapshot.serverTimestamp");
    expect(appSource).toContain("snapshot?.userId === identity.user.id");
    expect(appSource).toContain("[authenticatedUserId, loadDashboard, refreshDashboard]");
    expect(appSource).toContain("fetchDashboardSnapshot(");
    expect(appSource).not.toContain("Promise.all([");
    expect(appSource).not.toContain("setActor(");
    expect(appSource).not.toContain("setFeed(");
  });

  it("contains valid UTF-8 typography without mojibake", () => {
    const source = sourceFiles(sourceRoot).map(read).join("\n");
    const viewSource = read(join(sourceRoot, "components", "DashboardView.tsx"));
    expect(source).not.toMatch(/Â|�/);
    expect(viewSource).toContain(" · ");
  });

  it("freezes the six-kind feed and stable tuple pagination", () => {
    const contractsSource = read(join(sourceRoot, "data", "dashboardContracts.ts"));
    const apiSource = read(join(sourceRoot, "data", "viewerApi.ts"));
    expect(contractsSource).toContain('"routine_inspection"');
    expect(contractsSource).toContain('"rework"');
    expect(contractsSource).toContain('"urgent_incident"');
    expect(contractsSource).toContain('"daily_report"');
    expect(contractsSource).toContain('"hours"');
    expect(contractsSource).toContain('"expense"');
    expect(contractsSource).toContain("const FEED_KINDS");
    expect(apiSource).toContain("p_cursor: dashboardCursorPayload(cursor)");
    expect(apiSource).toContain("p_cursor: clientOvertimeCursorPayload(cursor)");
    expect(apiSource).not.toContain("p_before");
  });

  it("pins the v2 author and server-side Rep filter contract", () => {
    const contractsSource = read(join(sourceRoot, "data", "dashboardContracts.ts"));
    const apiSource = read(join(sourceRoot, "data", "viewerApi.ts"));
    const appSource = read(join(sourceRoot, "App.tsx"));
    const filterSource = read(join(sourceRoot, "components", "RepFilter.tsx"));
    expect(contractsSource).toContain('"contract_version"');
    expect(contractsSource).toContain('"rep_filter"');
    expect(contractsSource).toContain('const AUTHOR_KEYS = new Set(["id", "display_name"])');
    expect(contractsSource).toContain("validateDashboardFeedForActor(feed, actor, repFilter)");
    expect(apiSource).toContain("p_rep_id: repFilter");
    expect(appSource).toContain("<RepFilter");
    expect(appSource).toContain('activeSection !== "overtime"');
    expect(appSource).toContain("selectedRepRef.current");
    expect(appSource).toContain("Show all IDS Reps");
    expect(appSource).toContain("loadDashboard(identity.user.id, null)");
    expect(appSource).toContain("page.contractVersion !== currentSnapshot.contractVersion");
    expect(filterSource).toContain('value={`rep-${index}`}');
    expect(filterSource).not.toContain("<option value={author.id}");
  });

  it("keeps production and privileged-server literals out of browser source", () => {
    const source = sourceFiles(sourceRoot).map(read).join("\n");
    const productionReference = ["wuqqrcowz", "nrmmuokfxlk"].join("");
    expect(source).not.toContain(productionReference);
    expect(source).not.toMatch(/service[_-]?role/i);
  });

  it("keeps configuration isolated and has no deployment command", () => {
    const viteConfig = read(join(appRoot, "vite.config.ts"));
    const packageJson = JSON.parse(read(join(appRoot, "package.json"))) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(viteConfig).toContain('resolve(appDirectory, "config/env")');
    expect(viteConfig).toContain('"VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG"');
    expect(viteConfig).toContain("delete environment[name]");
    expect(Object.keys(packageJson.scripts).some((name) => /deploy|publish/i.test(name))).toBe(false);
    for (const version of [
      ...Object.values(packageJson.dependencies),
      ...Object.values(packageJson.devDependencies),
    ]) {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });

  it("ships a restrictive CSP with staging-only remote origins", () => {
    const html = read(join(appRoot, "index.html"));
    expect(html).toContain("Content-Security-Policy");
    expect(html).toContain("https://qatoyevwtjjtynisodyq.supabase.co");
    expect(html).toContain("wss://qatoyevwtjjtynisodyq.supabase.co");
    expect(html).toContain("img-src 'self' data: blob:");
    expect(html).toContain("media-src 'self' blob:");
    expect(html).not.toContain("img-src 'self' data: https://");
    expect(html).not.toContain("media-src 'self' https://");
    expect(html).not.toContain("wuqqrcowznrmmuokfxlk");
  });

  it("deploys only the isolated Vite dist with defensive response headers", () => {
    const config = JSON.parse(read(join(appRoot, "vercel.json"))) as {
      framework: string;
      installCommand: string;
      buildCommand: string;
      outputDirectory: string;
      headers: Array<{
        source: string;
        headers: Array<{ key: string; value: string }>;
      }>;
    };
    expect(config).toMatchObject({
      framework: "vite",
      installCommand: "npm ci",
      buildCommand: "npm run build",
      outputDirectory: "dist",
    });
    const headers = Object.fromEntries(
      config.headers.flatMap((route) => route.headers.map((header) => [header.key, header.value])),
    );
    expect(headers["Content-Security-Policy"]).toContain(
      "https://qatoyevwtjjtynisodyq.supabase.co",
    );
    expect(headers["Content-Security-Policy"]).toContain("img-src 'self' data: blob:");
    expect(headers["Content-Security-Policy"]).toContain("media-src 'self' blob:");
    expect(headers["Content-Security-Policy"]).not.toContain(
      "img-src 'self' data: https://",
    );
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
  });

  it("keeps the dormant connected scaffold on RPCs with no direct table reads", () => {
    const scaffold = read(join(appRoot, "e2e", "staging-contract.mjs"));
    expect(scaffold).toContain("get_mobile_dashboard_snapshot");
    expect(scaffold).not.toContain('rpc(\n      "get_mobile_dashboard_actor"');
    expect(scaffold).toContain("get_client_mobile_overtime_review_feed");
    expect(scaffold).not.toMatch(/\.from\(/);
    expect(scaffold).not.toContain("storage.from");
  });
});
