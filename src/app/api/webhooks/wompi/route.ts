import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { recordPayment, captureRecordedPayment } from "@/lib/payments";
import { calculateRevenueSplits, mapWompiTransactionStatus } from "@/lib/payments/wompi-utils";

type WompiWebhookEvent = {
  event?: string;
  data?: {
    transaction?: {
      reference?: string;
      status?: string;
      amount_in_cents?: number;
      currency?: string;
      customer_email?: string;
    };
  };
  signature?: {
    checksum?: string;
    properties?: string[];
  };
};

function verifyWompiChecksum(event: WompiWebhookEvent): boolean {
  const secret = process.env.WOMPI_EVENTS_SECRET;
  const checksum = event.signature?.checksum;
  const properties = event.signature?.properties;

  if (!secret || !checksum || !properties?.length) return false;

  const values = properties.map((path) => {
    const keys = path.split(".").slice(1);
    let current: unknown = event.data;
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return "";
      }
    }
    return String(current ?? "");
  });

  const payload = values.join("") + secret;
  const digest = createHash("sha256").update(payload).digest("hex").toUpperCase();
  return digest === checksum.toUpperCase();
}

export async function POST(request: Request) {
  if (!process.env.WOMPI_EVENTS_SECRET) {
    return new Response("Wompi events secret not configured", { status: 500 });
  }

  let event: WompiWebhookEvent;
  try {
    event = (await request.json()) as WompiWebhookEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!verifyWompiChecksum(event)) {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.event !== "transaction.updated") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const transaction = event.data?.transaction;
  const reference = transaction?.reference;
  const amountCents = transaction?.amount_in_cents;
  const currency = transaction?.currency ?? "COP";
  const status = transaction?.status;

  if (!reference || !amountCents || !status) {
    return new Response("Missing transaction fields", { status: 400 });
  }

  const mappedStatus = mapWompiTransactionStatus(status);
  if (mappedStatus !== "captured") {
    return NextResponse.json({ ok: true, status: mappedStatus });
  }

  const tenantId = process.env.DEFAULT_FIRM_TENANT_ID;
  if (!tenantId) {
    console.error("[webhooks/wompi] DEFAULT_FIRM_TENANT_ID missing for revenue split");
    return new Response("Tenant routing not configured", { status: 500 });
  }

  try {
    const splits = calculateRevenueSplits(amountCents, currency, tenantId);
    const captured = await captureRecordedPayment({
      providerReference: reference,
      status: "captured",
      revenueSplits: splits,
    });

    if (!captured) {
      await recordPayment({
        tenantId,
        payerSub: "wompi-webhook",
        providerReference: reference,
        amountCents,
        currency,
        status: "captured",
        metadata: { wompiStatus: status, customerEmail: transaction.customer_email },
        revenueSplits: splits,
      });
    }
  } catch (error) {
    console.error("[webhooks/wompi]", error);
    return new Response("Failed to record payment", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
