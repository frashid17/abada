import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { PaymentProvider, RecordPaymentInput, RevenueSplitLine, PaymentStatus } from "./types";
import { wompiProvider } from "./wompi";

/**
 * Colombia MVP uses Wompi only. Stripe is not available for Colombian merchants;
 * a Stripe adapter may be added later for cross-border cases — not wired today.
 */
export function getPaymentProvider(): PaymentProvider {
  return wompiProvider;
}

export async function recordPayment(input: RecordPaymentInput): Promise<string> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      tenant_id: input.tenantId,
      payer_sub: input.payerSub,
      provider: "wompi",
      provider_reference: input.providerReference,
      amount_cents: input.amountCents,
      currency: input.currency,
      status: input.status,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.revenueSplits?.length) {
    const { error: splitError } = await supabase.from("revenue_splits").insert(
      input.revenueSplits.map((split) => ({
        payment_id: payment.id,
        tenant_id: input.tenantId,
        party: split.party,
        amount_cents: split.amountCents,
        currency: split.currency,
      })),
    );
    if (splitError) throw splitError;
  }

  return payment.id;
}

export async function captureRecordedPayment(input: {
  providerReference: string;
  status: PaymentStatus;
  revenueSplits?: RevenueSplitLine[];
}): Promise<string | null> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: existing, error: findError } = await supabase
    .from("payments")
    .select("id, tenant_id")
    .eq("provider_reference", input.providerReference)
    .maybeSingle();

  if (findError) throw findError;
  if (!existing) return null;

  const { error: updateError } = await supabase
    .from("payments")
    .update({ status: input.status })
    .eq("id", existing.id);

  if (updateError) throw updateError;

  if (input.revenueSplits?.length) {
    const { error: splitError } = await supabase.from("revenue_splits").insert(
      input.revenueSplits.map((split) => ({
        payment_id: existing.id,
        tenant_id: existing.tenant_id,
        party: split.party,
        amount_cents: split.amountCents,
        currency: split.currency,
      })),
    );
    if (splitError) throw splitError;
  }

  return existing.id;
}
