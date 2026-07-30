/**
 * Next.js instrumentation hook.
 * Keep Sentry off the critical path in local `next dev` unless SENTRY_DEV=true —
 * importing @sentry/nextjs here forces a heavy Turbopack compile on every cold start.
 */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  const enableInDev = process.env.SENTRY_DEV === "true";
  if (!dsn) return;
  if (process.env.NODE_ENV !== "production" && !enableInDev) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export async function onRequestError(
  ...args: Parameters<
    typeof import("@sentry/nextjs").captureRequestError
  >
): Promise<void> {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  const enableInDev = process.env.SENTRY_DEV === "true";
  if (!dsn) return;
  if (process.env.NODE_ENV !== "production" && !enableInDev) return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
