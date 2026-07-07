import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

// Clean up test DB directory before starting the test server (only in the runner, not in worker threads)
if (!process.env.TEST_WORKER_INDEX && fs.existsSync("./.zettel-e2e-test-db")) {
  fs.rmSync("./.zettel-e2e-test-db", { recursive: true, force: true });
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5193",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5193",
    reuseExistingServer: false,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      MOCK_LLM: "true",
      NODE_ENV: "test",
      VITE_PORT: "5193",
      PORT: "5194",
      BETTER_AUTH_URL: "http://localhost:5194",
      BETTER_AUTH_LOG_LEVEL: "debug",
      ZETTEL_DIR: "./.zettel-e2e-test-db",
    },
  },
});
