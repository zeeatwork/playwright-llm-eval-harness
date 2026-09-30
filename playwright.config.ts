import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const realModel = process.env.LLM_PROVIDER === "anthropic";

export default defineConfig({
  timeout: realModel ? 90_000 : 15_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0, // LLM non-determinism is measured, not retried away
  workers: realModel ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }], ["json", { outputFile: "eval-results/results.json" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "api", testDir: "tests/api" },
    { name: "security", testDir: "tests/security" },
    { name: "eval", testDir: "tests/eval" },
    { name: "e2e", testDir: "tests/e2e", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run app",
    url: `http://localhost:${PORT}/api/health`,
    // Never reuse a server during defect runs: the running one may have different DEFECTS.
    reuseExistingServer: !process.env.CI && !process.env.DEFECTS,
    env: { ...process.env, PORT: String(PORT) } as Record<string, string>,
  },
});
