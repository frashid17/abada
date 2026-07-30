import { isFeatureEnabled } from "@/lib/feature-flags";

export type AnalyticsEvent =
  | "page_view"
  | "signup_started"
  | "onboarding_completed"
  | "document_drafted"
  | "document_submitted_for_review"
  | "payment_checkout_started"
  | "data_room_upload"
  | "admin_corpus_updated";

export type AnalyticsPayload = {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

/**
 * Privacy-first analytics abstraction.
 * Disabled by default (FEATURE_ANALYTICS=false). When enabled, posts to
 * ANALYTICS_WEBHOOK_URL if set; otherwise no-ops in production and logs in dev.
 */
export async function trackAnalytics(payload: AnalyticsPayload): Promise<void> {
  if (!isFeatureEnabled("analytics")) return;

  const body = {
    ...payload,
    ts: new Date().toISOString(),
    app: "abada",
  };

  const webhook = process.env.ANALYTICS_WEBHOOK_URL?.trim();
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error("[analytics] webhook failed", error);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", body);
  }
}
