import { resolve } from "node:path";
import { defineConfig } from "@playwright/test";

// CI tests the built gallery at its Pages base path; locally the dev server needs no build.
const production = process.env.GALLERY_E2E_PRODUCTION === "1";
const baseURL = `http://127.0.0.1:8092${production ? (process.env.GALLERY_BASE_PATH ?? "/") : "/"}`;

export default defineConfig({
  testDir: ".",
  outputDir: "coverage/gallery-e2e",
  testMatch: "gallery.e2e.ts",
  fullyParallel: true,
  use: {
    baseURL,
    viewport: { width: 1600, height: 1000 },
    trace: "retain-on-failure",
  },
  webServer: {
    cwd: resolve(import.meta.dirname, ".."),
    env: { NO_UPDATE_CHECK: "1" },
    command: production
      ? "node build-scripts/gallery.mjs serve --port 8092"
      : "pnpm gallery --port 8092",
    url: production ? `${baseURL}preview.html` : baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
