import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type RateWindow = "hour" | "day" | "month";

export type RateLimitRule = {
  window: RateWindow;
  limit: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** First rule that was exceeded, if any. */
  exceeded?: { window: RateWindow; limit: number; count: number };
};

const WINDOW_MS: Record<RateWindow, number> = {
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

function windowStart(window: RateWindow, now: Date): Date {
  const ms = WINDOW_MS[window];
  return new Date(Math.floor(now.getTime() / ms) * ms);
}

/**
 * Atomically increment counters for every rule window and report whether any
 * limit is exceeded. Fails open on infrastructure errors so an outage in the
 * counter store cannot take user-facing endpoints down with it.
 */
export async function enforceRateLimit(options: {
  subjectSub: string;
  actionKey: string;
  rules: RateLimitRule[];
  tenantId?: string | null;
}): Promise<RateLimitResult> {
  const supabase = createServiceRoleSupabaseClient();
  const now = new Date();

  for (const rule of options.rules) {
    const start = windowStart(rule.window, now);
    try {
      const { data, error } = await supabase.rpc("increment_rate_limit", {
        p_subject_sub: options.subjectSub,
        p_action_key: `${options.actionKey}:${rule.window}`,
        p_window_start: start.toISOString(),
        p_tenant_id: options.tenantId ?? undefined,
      });

      if (error) throw error;

      const count = typeof data === "number" ? data : 0;
      if (count > rule.limit) {
        return {
          allowed: false,
          exceeded: { window: rule.window, limit: rule.limit, count },
        };
      }
    } catch (error) {
      console.error(`[rate-limit] ${options.actionKey}:${rule.window}`, error);
    }
  }

  return { allowed: true };
}

/** Standard limits per platform policy (per user). */
export const RATE_LIMITS = {
  aiChat: [
    { window: "hour", limit: 40 },
    { window: "day", limit: 200 },
  ],
  documentDownload: [
    { window: "hour", limit: 20 },
    { window: "day", limit: 60 },
    { window: "month", limit: 400 },
  ],
  dataRoomDownload: [
    { window: "hour", limit: 60 },
    { window: "day", limit: 300 },
    { window: "month", limit: 2000 },
  ],
  paymentCheckout: [
    { window: "hour", limit: 10 },
    { window: "day", limit: 30 },
  ],
} satisfies Record<string, RateLimitRule[]>;

export function rateLimitResponseBody(result: RateLimitResult): {
  error: string;
  window?: RateWindow;
} {
  return {
    error: "Rate limit exceeded. Try again later.",
    window: result.exceeded?.window,
  };
}
