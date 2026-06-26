import type { InvestmentDocumentType } from "@/lib/documents/catalog";
import type { FieldValues } from "@/lib/documents/intake/types";
import { requireFirmMembership } from "@/lib/firm/membership";
import { getPrimaryFirmTenantId, resolveFirmReviewTenantScope } from "@/lib/firm/tenant";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type ReviewStatus = "queued" | "in_progress" | "completed" | "cancelled";

export type ReviewMarkup = {
  notes?: string;
  flaggedSections?: string[];
  attorneyName?: string;
  signedAt?: string;
};

export type ReviewQueueItem = {
  id: string;
  documentId: string;
  documentType: InvestmentDocumentType;
  documentTitle: string;
  requesterSub: string;
  status: ReviewStatus;
  helpMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewDetail = ReviewQueueItem & {
  markup: ReviewMarkup;
  executiveSummary: string | null;
  fields: FieldValues;
};

function parseFieldValue(raw: unknown): string | number | boolean {
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
    return raw;
  }
  if (raw && typeof raw === "object" && "value" in raw) {
    const value = (raw as { value: unknown }).value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
  }
  return "";
}

export async function resolveDefaultFirmTenantId(): Promise<string | null> {
  return getPrimaryFirmTenantId();
}

export async function getCompletedReviewForDocument(documentId: string): Promise<{
  attorneyName: string;
  signedAt: string;
} | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("markup, status, updated_at")
    .eq("document_id", documentId)
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const markup = (data.markup ?? {}) as ReviewMarkup;
  if (!markup.attorneyName) return null;

  return {
    attorneyName: markup.attorneyName,
    signedAt: markup.signedAt ?? data.updated_at,
  };
}

export async function enqueueDocumentReview(params: {
  documentId: string;
  requesterSub: string;
  tenantId: string;
  helpMessage?: string;
}): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: existing } = await supabase
    .from("reviews")
    .select("id, status")
    .eq("document_id", params.documentId)
    .in("status", ["queued", "in_progress"])
    .maybeSingle();

  if (existing) {
    await supabase
      .from("reviews")
      .update({
        tenant_id: params.tenantId,
        markup: { notes: params.helpMessage ?? "" },
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  const { error } = await supabase.from("reviews").insert({
    tenant_id: params.tenantId,
    document_id: params.documentId,
    requester_sub: params.requesterSub,
    status: "queued",
    markup: { notes: params.helpMessage ?? "" },
  });

  if (error) throw error;
}

export async function listFirmReviews(): Promise<ReviewQueueItem[]> {
  const membership = await requireFirmMembership();
  const { visibleTenantIds } = await resolveFirmReviewTenantScope(membership.clerkUserId);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      document_id,
      requester_sub,
      status,
      markup,
      created_at,
      updated_at,
      documents (
        document_type,
        title
      )
    `,
    )
    .in("tenant_id", visibleTenantIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const doc = row.documents as { document_type: string; title: string } | null;
    const markup = (row.markup ?? {}) as ReviewMarkup;
    return {
      id: row.id,
      documentId: row.document_id,
      documentType: (doc?.document_type ?? "nda") as InvestmentDocumentType,
      documentTitle: doc?.title ?? doc?.document_type ?? "document",
      requesterSub: row.requester_sub,
      status: row.status as ReviewStatus,
      helpMessage: markup.notes ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function getFirmReview(reviewId: string): Promise<ReviewDetail | null> {
  const membership = await requireFirmMembership();
  const { visibleTenantIds } = await resolveFirmReviewTenantScope(membership.clerkUserId);
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      id,
      document_id,
      requester_sub,
      status,
      markup,
      executive_summary,
      created_at,
      updated_at,
      tenant_id,
      documents (
        document_type,
        title
      )
    `,
    )
    .eq("id", reviewId)
    .in("tenant_id", visibleTenantIds)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const doc = data.documents as { document_type: string; title: string } | null;
  const { data: fieldRows } = await supabase
    .from("document_field_values")
    .select("field_key, field_value")
    .eq("document_id", data.document_id);

  const fields: FieldValues = {};
  for (const row of fieldRows ?? []) {
    if (row.field_key.startsWith("_")) continue;
    fields[row.field_key] = parseFieldValue(row.field_value);
  }

  const markup = (data.markup ?? {}) as ReviewMarkup;

  return {
    id: data.id,
    documentId: data.document_id,
    documentType: (doc?.document_type ?? "nda") as InvestmentDocumentType,
    documentTitle: doc?.title ?? doc?.document_type ?? "document",
    requesterSub: data.requester_sub,
    status: data.status as ReviewStatus,
    helpMessage: markup.notes ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    markup,
    executiveSummary: data.executive_summary,
    fields,
  };
}

export async function updateFirmReview(
  reviewId: string,
  input: {
    status?: ReviewStatus;
    markup?: ReviewMarkup;
    executiveSummary?: string | null;
    reviewerSub?: string;
    reviewerName?: string;
  },
): Promise<void> {
  const membership = await requireFirmMembership();
  const { visibleTenantIds } = await resolveFirmReviewTenantScope(membership.clerkUserId);
  const supabase = createServiceRoleSupabaseClient();

  const { data: existing, error: loadError } = await supabase
    .from("reviews")
    .select("id, document_id, tenant_id")
    .eq("id", reviewId)
    .in("tenant_id", visibleTenantIds)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!existing) throw new Error("Review not found");

  let markup = input.markup;
  if (input.status === "completed" && input.reviewerName) {
    markup = {
      ...(markup ?? {}),
      attorneyName: input.reviewerName,
      signedAt: new Date().toISOString(),
    };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      ...(input.status ? { status: input.status } : {}),
      ...(markup ? { markup } : {}),
      ...(input.executiveSummary !== undefined
        ? { executive_summary: input.executiveSummary }
        : {}),
      ...(input.reviewerSub ? { assigned_clerk_user_id: input.reviewerSub } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .in("tenant_id", visibleTenantIds);

  if (error) throw error;

  if (input.status === "completed") {
    if (existing.document_id) {
      await supabase
        .from("documents")
        .update({ status: "complete", updated_at: new Date().toISOString() })
        .eq("id", existing.document_id);
    }
  } else if (input.status === "in_progress") {
    if (existing.document_id) {
      await supabase
        .from("documents")
        .update({ status: "in_review", updated_at: new Date().toISOString() })
        .eq("id", existing.document_id);
    }
  }
}
