import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import {
  assertNoForbiddenEnvironmentNames,
  readViewerEnvironment,
} from "./src/security/environment";

const appDirectory = fileURLToPath(new URL(".", import.meta.url));
const isolatedEnvDirectory = resolve(appDirectory, "config/env");
const vercelBuildOnlyPublicVariables = [
  "VITE_VERCEL_OBSERVABILITY_CLIENT_CONFIG",
] as const;

function removeUnusedVercelPublicVariables(environment: NodeJS.ProcessEnv): void {
  if (environment.VERCEL !== "1") {
    return;
  }
  for (const name of vercelBuildOnlyPublicVariables) {
    delete environment[name];
  }
}

export default defineConfig(({ command, mode }) => {
  removeUnusedVercelPublicVariables(process.env);
  const fileEnvironment = loadEnv(mode, isolatedEnvDirectory, "");
  const processEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined),
  );
  const isUnitTestTransform = command === "serve" && process.env.VITEST === "true";
  if (!isUnitTestTransform) {
    assertNoForbiddenEnvironmentNames(processEnvironment);
    readViewerEnvironment({ ...processEnvironment, ...fileEnvironment });
  }

  return {
    root: appDirectory,
    envDir: isolatedEnvDirectory,
    plugins: [react()],
    server: {
      fs: { strict: true },
      host: "127.0.0.1",
    },
    preview: { host: "127.0.0.1" },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      sourcemap: false,
    },
  };
});
