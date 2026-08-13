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
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
  });
});
