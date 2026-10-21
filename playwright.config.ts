import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.browser.ts",
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "./browser-results/results.json" }]],
  outputDir: "./browser-results",
  projects: [
    { name: "chromium-desktop", use: { viewport: { width: 1280, height: 800 } } },
    { name: "chromium-mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
