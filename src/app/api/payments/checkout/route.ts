import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getPaymentProvider, recordPayment } from "@/lib/payments";

const bodySchema = z.object({
  amountCents: z.number().int().positive().max(500_000_000),
  currency: z.string().default("COP"),
  tenantId: z.string().uuid(),
  description: z.string().min(1).max(200),
  redirectUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
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
