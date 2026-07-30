import { NextResponse } from "next/server";
import { getFeatureFlags } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for Vercel, uptime monitors, and load balancers.
 * Does not expose secrets — only coarse dependency presence.
 */
export async function GET() {
  const flags = getFeatureFlags();
  const checks = {
    clerk: Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
    supabase: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    sentry: flags.sentry,
  };

  const ready = checks.clerk && checks.supabase;

  return NextResponse.json(
    {
      status: ready ? "ok" : "degraded",
      ready,
      checks,
      flags,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
