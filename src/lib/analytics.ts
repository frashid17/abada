import { isFeatureEnabled } from "@/lib/feature-flags";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

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
  actorSub?: string | null;
  tenantId?: string | null;
};

/**
 * Privacy-first analytics abstraction.
 * When FEATURE_ANALYTICS is enabled: persists to analytics_events and optionally
 * posts to ANALYTICS_WEBHOOK_URL. When disabled, no-ops (dev still logs).
 */
export async function trackAnalytics(payload: AnalyticsPayload): Promise<void> {
  if (!isFeatureEnabled("analytics")) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[analytics:disabled]", payload);
    }
    return;
  }

  const body = {
    ...payload,
    ts: new Date().toISOString(),
    app: "abada",
  };

  try {
    const supabase = createServiceRoleSupabaseClient();
    await supabase.from("analytics_events").insert({
      event: payload.event,
      actor_sub: payload.actorSub ?? null,
      tenant_id: payload.tenantId ?? null,
      properties: payload.properties ?? {},
    });
  } catch (error) {
    console.error("[analytics] persist failed", error);
  }

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
