import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { trackAnalytics } from "@/lib/analytics";
import { writeAuditLog } from "@/lib/audit";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { getPrimaryFirmTenantId } from "@/lib/firm/tenant";
import {
  AI_DRAFTING_AMOUNT_CENTS,
  AI_DRAFTING_CURRENCY,
  AI_DRAFTING_PRODUCT,
  formatCopFromCents,
  setAiAccessCookie,
  userHasAiAccess,
} from "@/lib/payments/ai-access";
import { recordPayment } from "@/lib/payments";
import {
  isValidCardNumber,
  mockCheckoutBodySchema,
  mockProcessingDelayMs,
  sanitizeCardNumber,
  sanitizePhone,
} from "@/lib/payments/mock-checkout";
import { calculateRevenueSplits } from "@/lib/payments/wompi-utils";
import { enforceRateLimit, RATE_LIMITS, rateLimitResponseBody } from "@/lib/rate-limit";

/**
 * Mock Colombia checkout for AI drafting access.
 * Accepts card or mobile money (Nequi / Daviplata), always captures on valid input,
 * sets an httpOnly entitlement cookie, and optionally records a `payments` row.
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isFeatureEnabled("aiDrafting")) {
    return NextResponse.json({ error: "AI drafting is temporarily disabled" }, { status: 503 });
  }

  if (!isFeatureEnabled("aiPaywall")) {
    await setAiAccessCookie(userId);
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      amountFormatted: formatCopFromCents(AI_DRAFTING_AMOUNT_CENTS),
    });
  }

  const rate = await enforceRateLimit({
    subjectSub: userId,
    actionKey: "payment.mock_checkout",
    rules: RATE_LIMITS.paymentCheckout,
  });
  if (!rate.allowed) {
    return NextResponse.json(rateLimitResponseBody(rate), { status: 429 });
  }

  if (await userHasAiAccess(userId)) {
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      amountFormatted: formatCopFromCents(AI_DRAFTING_AMOUNT_CENTS),
    });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const method = raw.method;
  const normalized =
    method === "card"
      ? {
          method: "card" as const,
          cardholderName: String(raw.cardholderName ?? ""),
          cardNumber: sanitizeCardNumber(String(raw.cardNumber ?? "")),
          expiry: String(raw.expiry ?? "").trim(),
          cvc: String(raw.cvc ?? "").replace(/\D/g, ""),
        }
      : {
          method: method as "nequi" | "daviplata",
          phone: sanitizePhone(String(raw.phone ?? "")),
        };

  const parsed = mockCheckoutBodySchema.safeParse(normalized);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment details" }, { status: 400 });
  }

  const body = parsed.data;
  if (body.method === "card" && !isValidCardNumber(body.cardNumber)) {
    return NextResponse.json({ error: "Invalid card number" }, { status: 400 });
  }

  // Simulate PSP latency so checkout feels real.
  await new Promise((resolve) => setTimeout(resolve, mockProcessingDelayMs()));

  const reference = `mock_ai_${userId.slice(0, 8)}_${Date.now()}`;
  const tenantId = await getPrimaryFirmTenantId();
  let paymentId: string | null = null;

  if (tenantId) {
    try {
      paymentId = await recordPayment({
        tenantId,
        payerSub: userId,
        provider: "mock",
        providerReference: reference,
        amountCents: AI_DRAFTING_AMOUNT_CENTS,
        currency: AI_DRAFTING_CURRENCY,
        status: "captured",
        metadata: {
          product: AI_DRAFTING_PRODUCT,
          method: body.method,
          mock: true,
          description: "AI drafting access",
        },
        revenueSplits: calculateRevenueSplits(
          AI_DRAFTING_AMOUNT_CENTS,
          AI_DRAFTING_CURRENCY,
          tenantId,
        ),
      });
    } catch (error) {
      // Cookie entitlement still unlocks AI when DB is unavailable / migration pending.
      console.error("[payments/mock-checkout] recordPayment failed", error);
    }
  }

  await setAiAccessCookie(userId);

  await writeAuditLog({
    action: "payment.mock_checkout_captured",
    actorSub: userId,
    tenantId: tenantId ?? undefined,
    resourceType: "payment",
    resourceId: paymentId ?? reference,
    metadata: {
      amountCents: AI_DRAFTING_AMOUNT_CENTS,
      currency: AI_DRAFTING_CURRENCY,
      method: body.method,
      product: AI_DRAFTING_PRODUCT,
      mock: true,
    },
    request,
  });

  await trackAnalytics({
    event: "payment_checkout_started",
    properties: {
      amountCents: AI_DRAFTING_AMOUNT_CENTS,
      currency: AI_DRAFTING_CURRENCY,
      method: body.method,
      mock: true,
      product: AI_DRAFTING_PRODUCT,
    },
  });

  return NextResponse.json({
    ok: true,
    alreadyPaid: false,
    reference,
    paymentId,
    amountCents: AI_DRAFTING_AMOUNT_CENTS,
    currency: AI_DRAFTING_CURRENCY,
    amountFormatted: formatCopFromCents(AI_DRAFTING_AMOUNT_CENTS),
  });
}
