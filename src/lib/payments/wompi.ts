import type {
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  PaymentStatus,
} from "./types";
import { getWompiApiBaseUrl } from "./wompi-utils";

type WompiPaymentLinkResponse = {
  data?: {
    id?: string;
  };
};

export const wompiProvider: PaymentProvider = {
  name: "wompi",

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
    const reference = `abada_${input.tenantId.slice(0, 8)}_${Date.now()}`;
    const privateKey = process.env.WOMPI_PRIVATE_KEY;
    const publicKey = process.env.WOMPI_PUBLIC_KEY;

    if (!privateKey || !publicKey) {
      return {
        provider: "wompi",
        providerReference: reference,
        status: "pending",
        checkoutUrl: undefined,
      };
    }

    const baseUrl = getWompiApiBaseUrl();
    const response = await fetch(`${baseUrl}/v1/payment_links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${privateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: input.description.slice(0, 120),
        description: input.description,
        single_use: true,
        collect_shipping: false,
        amount_in_cents: input.amountCents,
        currency: input.currency,
        reference,
        redirect_url: input.metadata?.redirectUrl,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Wompi payment link failed: ${response.status} ${body}`);
    }

    const payload = (await response.json()) as WompiPaymentLinkResponse;
    const linkId = payload.data?.id;
    const checkoutUrl = linkId ? `https://checkout.wompi.co/l/${linkId}` : undefined;

    return {
      provider: "wompi",
      providerReference: reference,
      checkoutUrl,
      status: "pending",
    };
  },

  async capturePayment(providerReference: string): Promise<PaymentStatus> {
    const privateKey = process.env.WOMPI_PRIVATE_KEY;
    if (!privateKey) return "pending";

    const baseUrl = getWompiApiBaseUrl();
    const response = await fetch(
      `${baseUrl}/v1/transactions?reference=${encodeURIComponent(providerReference)}`,
      {
        headers: { Authorization: `Bearer ${privateKey}` },
      },
    );

    if (!response.ok) return "pending";

    const payload = (await response.json()) as {
      data?: Array<{ status?: string }>;
    };
    const status = payload.data?.[0]?.status?.toUpperCase();
    if (status === "APPROVED") return "captured";
    if (status && ["DECLINED", "ERROR", "VOIDED"].includes(status)) return "failed";
    return "pending";
  },
};
