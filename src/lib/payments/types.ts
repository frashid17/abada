/** Active payment provider for Colombia MVP. */
export type PaymentProviderName = "wompi";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export type CreatePaymentIntentInput = {
  amountCents: number;
  currency: string;
  payerSub: string;
  tenantId: string;
  description: string;
  metadata?: Record<string, string>;
};

export type PaymentIntentResult = {
  provider: PaymentProviderName;
  providerReference: string;
  checkoutUrl?: string;
  clientSecret?: string;
  status: PaymentStatus;
};

export type PaymentProvider = {
  name: PaymentProviderName;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  capturePayment?(providerReference: string): Promise<PaymentStatus>;
};

export type RevenueSplitLine = {
  party: string;
  amountCents: number;
  currency: string;
};

export type RecordPaymentInput = {
  tenantId: string;
  payerSub: string;
  providerReference: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  metadata?: Record<string, unknown>;
  revenueSplits?: RevenueSplitLine[];
};
