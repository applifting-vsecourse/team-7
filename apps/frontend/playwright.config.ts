import { defineConfig, devices } from "@playwright/test";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    [process.env.CI ? "github" : "list"],
    ["html", { outputFolder: `${root}/playwright-report`, open: "never" }],
  ],
  outputDir: `${root}/test-results`,
  use: {
    baseURL: "http://localhost:3050",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Local runs use the already-running app. CI starts the builds produced by
  // the preceding pipeline steps and never reuses an unexpected server.
  webServer: process.env.CI
    ? [
        {
          command: "node --env-file=.env dist/main.js",
          cwd: `${root}/apps/backend`,
          url: "http://localhost:4050/api/docs-json",
          timeout: 60_000,
          reuseExistingServer: false,
        },
        {
          command:
            "pnpm frontend start --host localhost --port 3050 --strictPort",
          cwd: root,
          url: "http://localhost:3050",
          timeout: 60_000,
          reuseExistingServer: false,
        },
      ]
    : undefined,
});
