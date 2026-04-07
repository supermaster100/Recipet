import { defineConfig, devices } from "@playwright/test";
import { execSync } from "child_process";

let chromiumPath = "";
try {
  chromiumPath =
    execSync("which chromium-browser 2>/dev/null || which chromium 2>/dev/null || echo ''")
      .toString()
      .trim();
} catch {
  chromiumPath = "";
}

const devDomain = process.env.REPLIT_DEV_DOMAIN;
const baseURL = devDomain
  ? `https://${devDomain}`
  : "http://localhost:8081";

export default defineConfig({
  testDir: "./tests",
  timeout: 45000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL,
    headless: true,
    ignoreHTTPSErrors: true,
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    launchOptions: {
      executablePath: chromiumPath || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
  webServer: devDomain
    ? undefined
    : {
        command: "npx expo start --web --port 8081",
        url: "http://localhost:8081",
        reuseExistingServer: true,
        timeout: 120000,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
