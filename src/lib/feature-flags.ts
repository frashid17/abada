/**
 * Environment-driven feature flags for MVP beta readiness.
 * Defaults are conservative; enable via env without code changes.
 */

export type FeatureFlag =
  | "aiDrafting"
  | "aiPaywall"
  | "paymentsCheckout"
  | "dataRoomUploads"
  | "adminPdfOcr"
  | "knowledgeHub"
  | "analytics"
  | "sentry";

function envFlag(name: string, defaultEnabled: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (raw === undefined || raw === "") return defaultEnabled;
  if (["0", "false", "off", "no"].includes(raw)) return false;
  if (["1", "true", "on", "yes"].includes(raw)) return true;
  return defaultEnabled;
}

const FLAGS: Record<FeatureFlag, () => boolean> = {
  aiDrafting: () => envFlag("FEATURE_AI_DRAFTING", true),
  /** Require mock/live payment before AI drafting. Default on for beta monetization. */
  aiPaywall: () => envFlag("FEATURE_AI_PAYWALL", true),
  paymentsCheckout: () => envFlag("FEATURE_PAYMENTS_CHECKOUT", true),
  dataRoomUploads: () => envFlag("FEATURE_DATA_ROOM_UPLOADS", true),
  adminPdfOcr: () => envFlag("FEATURE_ADMIN_PDF_OCR", true),
  knowledgeHub: () => envFlag("FEATURE_KNOWLEDGE_HUB", true),
  analytics: () => envFlag("FEATURE_ANALYTICS", false),
  sentry: () => Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()),
};

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FLAGS[flag]();
}

export function getFeatureFlags(): Record<FeatureFlag, boolean> {
  return {
    aiDrafting: isFeatureEnabled("aiDrafting"),
    aiPaywall: isFeatureEnabled("aiPaywall"),
    paymentsCheckout: isFeatureEnabled("paymentsCheckout"),
    dataRoomUploads: isFeatureEnabled("dataRoomUploads"),
    adminPdfOcr: isFeatureEnabled("adminPdfOcr"),
    knowledgeHub: isFeatureEnabled("knowledgeHub"),
    analytics: isFeatureEnabled("analytics"),
    sentry: isFeatureEnabled("sentry"),
  };
}
