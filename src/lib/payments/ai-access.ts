import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { isFeatureEnabled } from "@/lib/feature-flags";

/** Cookie that unlocks AI drafting after mock (or real) payment. */
export const AI_ACCESS_COOKIE = "abada_ai_access";

/** Wompi-style centavos: COP $49.900 → 4_990_000. */
export const AI_DRAFTING_AMOUNT_CENTS = 4_990_000;
export const AI_DRAFTING_CURRENCY = "COP";
export const AI_DRAFTING_PRODUCT = "ai_drafting";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function signingSecret(): string {
  return (
    process.env.AI_ACCESS_COOKIE_SECRET?.trim() ||
    process.env.WOMPI_INTEGRITY_SECRET?.trim() ||
    process.env.ANTHROPIC_API_KEY?.trim() ||
    "abada-dev-ai-access-secret"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function createAiAccessToken(userId: string): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = `${userId}.${issuedAt}`;
  return `${payload}.${signPayload(payload)}`;
}

export function verifyAiAccessToken(token: string, userId: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sub, issuedAtRaw, signature] = parts;
  if (sub !== userId) return false;
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;

  const payload = `${sub}.${issuedAtRaw}`;
  const expected = signPayload(payload);
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setAiAccessCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(AI_ACCESS_COOKIE, createAiAccessToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function hasAiAccessCookie(userId: string): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(AI_ACCESS_COOKIE)?.value;
  if (!token) return false;
  return verifyAiAccessToken(token, userId);
}

/** Captured payment for AI drafting (mock or live), scoped to this payer. */
export async function hasCapturedAiPayment(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("payments")
      .select("id, metadata, status")
      .eq("payer_sub", userId)
      .eq("status", "captured")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("[ai-access] payment lookup failed", error);
      return false;
    }

    return (data ?? []).some((row) => {
      const meta = row.metadata as Record<string, unknown> | null;
      return meta?.product === AI_DRAFTING_PRODUCT;
    });
  } catch (error) {
    console.error("[ai-access] payment lookup error", error);
    return false;
  }
}

/**
 * Whether the user may call the AI gateway.
 * Paywall can be disabled via FEATURE_AI_PAYWALL=false for local/dev bypass.
 */
export async function userHasAiAccess(userId: string): Promise<boolean> {
  if (!isFeatureEnabled("aiPaywall")) return true;
  if (await hasAiAccessCookie(userId)) return true;
  return hasCapturedAiPayment(userId);
}

export function formatCopFromCents(amountCents: number, locale: "es-CO" | "en-US" = "es-CO"): string {
  const pesos = Math.round(amountCents / 100);
  const amount = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(pesos);
  return `COP $${amount}`;
}
