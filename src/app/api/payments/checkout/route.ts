import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaymentProvider, recordPayment } from "@/lib/payments";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { getPrimaryFirmTenantId } from "@/lib/firm/tenant";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { enforceRateLimit, RATE_LIMITS, rateLimitResponseBody } from "@/lib/rate-limit";

const bodySchema = z.object({
  amountCents: z.number().int().positive().max(500_000_000),
  currency: z.string().default("COP"),
  tenantId: z.string().uuid(),
  description: z.string().min(1).max(200),
  redirectUrl: z.string().url().optional(),
});

/**
 * The client-supplied tenantId is only accepted when the caller has a real
 * relationship with that tenant: firm membership, a review they requested,
 * or it is the platform's primary firm (founders paying for firm services).
 */
async function isTenantAuthorizedForPayer(
  tenantId: string,
  userId: string,
): Promise<boolean> {
  const membership = await getFirmMembershipForUser(userId);
  if (membership?.tenantId === tenantId) return true;

  const primaryFirm = await getPrimaryFirmTenantId();
  if (primaryFirm === tenantId) return true;

  const supabase = createServiceRoleSupabaseClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("requester_sub", userId)
    .limit(1)
    .maybeSingle();

  return Boolean(review);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await enforceRateLimit({
    subjectSub: userId,
    actionKey: "payment.checkout",
    rules: RATE_LIMITS.paymentCheckout,
  });
  if (!rate.allowed) {
    return NextResponse.json(rateLimitResponseBody(rate), { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!(await isTenantAuthorizedForPayer(body.tenantId, userId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.WOMPI_PRIVATE_KEY || !process.env.WOMPI_PUBLIC_KEY) {
    return NextResponse.json(
      { error: "Wompi is not configured (missing API keys)" },
      { status: 503 },
    );
  }

  try {
    const provider = getPaymentProvider();
    const intent = await provider.createPaymentIntent({
      amountCents: body.amountCents,
      currency: body.currency,
      payerSub: userId,
      tenantId: body.tenantId,
      description: body.description,
      metadata: body.redirectUrl ? { redirectUrl: body.redirectUrl } : undefined,
    });

    await recordPayment({
      tenantId: body.tenantId,
      payerSub: userId,
      providerReference: intent.providerReference,
      amountCents: body.amountCents,
      currency: body.currency,
      status: "pending",
      metadata: {
        description: body.description,
        checkoutUrl: intent.checkoutUrl,
      },
    });

    await writeAuditLog({
      action: "payment.checkout_created",
      actorSub: userId,
      tenantId: body.tenantId,
      resourceType: "payment",
      resourceId: intent.providerReference,
      metadata: { amountCents: body.amountCents, currency: body.currency },
      request,
    });

    if (!intent.checkoutUrl) {
      return NextResponse.json({ error: "Could not create checkout session" }, { status: 502 });
    }

    return NextResponse.json({
      checkoutUrl: intent.checkoutUrl,
      reference: intent.providerReference,
    });
  } catch (error) {
    console.error("[payments/checkout]", error);
    return NextResponse.json({ error: "Payment checkout failed" }, { status: 500 });
  }
}
