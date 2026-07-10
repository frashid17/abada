import { test, expect } from "@playwright/test";

/**
 * Public smoke suite — no auth required.
 * Authenticated flows (founder documents, firm review, DD rooms) need Clerk
 * testing tokens; see https://clerk.com/docs/testing/playwright — TODO(M7+).
 */

test("landing page renders with brand and CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/./);
  await expect(page.locator("header")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
});

test("knowledge hub lists published articles", async ({ page }) => {
  await page.goto("/conocimiento");
  await expect(page.locator("h1")).toBeVisible();
  const articleLinks = page.locator('a[href^="/conocimiento/"]');
  await expect(articleLinks.first()).toBeVisible();
});

test("knowledge article page renders body", async ({ page }) => {
  await page.goto("/conocimiento");
  const firstArticle = page.locator('a[href^="/conocimiento/"]').first();
  await firstArticle.click();
  await expect(page).toHaveURL(/\/conocimiento\/.+/);
  await expect(page.locator("h1")).toBeVisible();
});

test("protected founder area redirects logged-out visitors", async ({ page }) => {
  await page.goto("/fundador");
  await page.waitForURL(/iniciar-sesion|sign-in/);
  expect(page.url()).toMatch(/iniciar-sesion|sign-in/);
});

test("protected templates page redirects logged-out visitors", async ({ page }) => {
  await page.goto("/fundador/plantillas/term-sheet");
  await page.waitForURL(/iniciar-sesion|sign-in/);
  expect(page.url()).toMatch(/iniciar-sesion|sign-in/);
});

test("api routes reject unauthenticated requests", async ({ request }) => {
  const aiResponse = await request.post("/api/ai/chat", {
    data: { message: "hola" },
  });
  expect(aiResponse.status()).toBe(401);

  const paymentResponse = await request.post("/api/payments/checkout", {
    data: {},
  });
  expect(paymentResponse.status()).toBe(401);
});

test("theme toggle and locale selector are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header button").first()).toBeVisible();
});
