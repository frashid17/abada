import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getFeatureFlags, isFeatureEnabled } from "@/lib/feature-flags";

describe("feature flags", () => {
  const keys = [
    "FEATURE_AI_DRAFTING",
    "FEATURE_AI_PAYWALL",
    "FEATURE_PAYMENTS_CHECKOUT",
    "FEATURE_ANALYTICS",
    "NEXT_PUBLIC_SENTRY_DSN",
  ] as const;
  const previous: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of keys) {
      previous[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });

  it("defaults drafting and paywall on, analytics off", () => {
    delete process.env.FEATURE_AI_DRAFTING;
    delete process.env.FEATURE_AI_PAYWALL;
    delete process.env.FEATURE_ANALYTICS;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    expect(isFeatureEnabled("aiDrafting")).toBe(true);
    expect(isFeatureEnabled("aiPaywall")).toBe(true);
    expect(isFeatureEnabled("analytics")).toBe(false);
    expect(isFeatureEnabled("sentry")).toBe(false);
  });

  it("honors explicit off switches", () => {
    process.env.FEATURE_AI_DRAFTING = "false";
    process.env.FEATURE_AI_PAYWALL = "0";
    process.env.FEATURE_PAYMENTS_CHECKOUT = "0";
    expect(isFeatureEnabled("aiDrafting")).toBe(false);
    expect(isFeatureEnabled("aiPaywall")).toBe(false);
    expect(isFeatureEnabled("paymentsCheckout")).toBe(false);
  });

  it("enables sentry when DSN is present", () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://example.ingest.sentry.io/1";
    expect(isFeatureEnabled("sentry")).toBe(true);
    expect(getFeatureFlags().sentry).toBe(true);
  });
});
