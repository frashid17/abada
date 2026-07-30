/**
 * Client instrumentation runs before hydration.
 * Skip Sentry in local `next dev` (unless NEXT_PUBLIC_SENTRY_DEV=true) so Turbopack
 * does not compile the SDK on every cold start.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const enableInDev = process.env.NEXT_PUBLIC_SENTRY_DEV === "true";
const enabled =
  Boolean(dsn) && (process.env.NODE_ENV === "production" || enableInDev);

if (enabled) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      enabled: true,
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
      sendDefaultPii: false,
    });
  });
}

export function onRouterTransitionStart(
  url: string,
  navigationType: "push" | "replace" | "traverse",
): void {
  if (!enabled) return;
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.captureRouterTransitionStart(url, navigationType);
  });
}
