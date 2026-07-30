/**
 * Authenticated E2E placeholder.
 *
 * Enable with:
 *   CLERK_TESTING_TOKEN=... E2E_FOUNDER_USER=... npm run test:e2e -- e2e/authenticated.spec.ts
 *
 * Until Clerk testing tokens are configured, these tests stay skipped so CI remains green.
 * Docs: https://clerk.com/docs/testing/playwright
 */
import { test, expect } from "@playwright/test";

const enabled = Boolean(process.env.CLERK_TESTING_TOKEN && process.env.E2E_FOUNDER_STORAGE_STATE);

test.describe("authenticated flows", () => {
  test.skip(!enabled, "Set CLERK_TESTING_TOKEN + E2E_FOUNDER_STORAGE_STATE to enable");

  test.use({
    storageState: process.env.E2E_FOUNDER_STORAGE_STATE,
  });

  test("founder dashboard loads after auth", async ({ page }) => {
    await page.goto("/fundador");
    await expect(page).toHaveURL(/\/fundador/);
    await expect(page.locator("h1")).toBeVisible();
  });
});
