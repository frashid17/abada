import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient, createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import {
  type DocumentStatus,
  type InvestmentDocumentType,
  isInvestmentDocumentType,
} from "@/lib/documents/catalog";
import { getIntakeSchema, isFlowDocumentType } from "@/lib/documents/intake";
import {
  enqueueDocumentReview,
  getCompletedReviewForDocument,
  resolveDefaultFirmTenantId,
  type ReviewMarkup,
} from "@/lib/firm/reviews";
import { getPrimaryFirmTenantId } from "@/lib/firm/tenant";
import type { FieldValues, IntakeField } from "@/lib/documents/intake/types";
import { createDocumentFingerprint } from "@/lib/documents/fingerprint";
import { buildDocumentPdf } from "@/lib/documents/pdf";
import { renderDocument } from "@/lib/documents/render";
import { buildPartySignatures } from "@/lib/documents/signatures";
import { getFirmName } from "@/lib/brand";
import { getDisclaimer } from "@/lib/ai/guardrails";
import { getDocumentDisplayTitle, type DocumentLocale } from "@/lib/documents/document-locale";

export type DocumentRecord = {
  id: string;
  documentType: InvestmentDocumentType;
  title: string;
  status: DocumentStatus;
  tenantId: string | null;
};

export type DocumentReviewSummary =
  | { phase: "none" }
  | { phase: "pending"; submittedAt: string; note: string | null }
  | {
      phase: "completed";
      submittedAt: string;
      reviewedAt: string;
      attorneyName: string;
      note: string | null;
    };

export type DocumentFlowState = {
  document: DocumentRecord;
  fields: FieldValues;
  helpMessage: string | null;
  reviewSummary: DocumentReviewSummary;
};

async function getOwnerSub(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

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

export async function getDocumentByType(
  documentType: InvestmentDocumentType,
): Promise<DocumentRecord | null> {
  const ownerSub = await getOwnerSub();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, document_type, title, status, tenant_id")
    .eq("owner_sub", ownerSub)
    .eq("document_type", documentType)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    documentType: data.document_type as InvestmentDocumentType,
    title: data.title,
    status: data.status as DocumentStatus,
    tenantId: data.tenant_id,
  };
}

export async function getDocumentFlowState(
  documentType: InvestmentDocumentType,
): Promise<DocumentFlowState | null> {
  const document = await getDocumentByType(documentType);
  if (!document) return null;

  const supabase = await createServerSupabaseClient();
  const { data: fieldRows, error } = await supabase
    .from("document_field_values")
    .select("field_key, field_value")
    .eq("document_id", document.id);

  if (error) throw error;

  const fields: FieldValues = {};
  for (const row of fieldRows ?? []) {
    fields[row.field_key] = parseFieldValue(row.field_value);
  }

  const helpMessage =
    typeof fields._help_message === "string" ? fields._help_message : null;
  if (fields._help_message) delete fields._help_message;

  const reviewSummary = await getDocumentReviewSummary(document.id);

  return { document, fields, helpMessage, reviewSummary };
}

export async function getDocumentReviewSummary(
  documentId: string,
): Promise<DocumentReviewSummary> {
  const ownerSub = await getOwnerSub();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("reviews")
    .select("status, markup, created_at, updated_at")
    .eq("document_id", documentId)
    .eq("requester_sub", ownerSub)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { phase: "none" };

  const markup = (data.markup ?? {}) as ReviewMarkup;
  const note = markup.notes?.trim() || null;

  if (data.status === "completed" && markup.attorneyName) {
    return {
      phase: "completed",
      submittedAt: data.created_at,
      reviewedAt: markup.signedAt ?? data.updated_at,
      attorneyName: markup.attorneyName,
      note,
    };
  }

  if (data.status === "queued" || data.status === "in_progress") {
    return {
      phase: "pending",
      submittedAt: data.created_at,
      note,
    };
  }

  return { phase: "none" };
}

function validateRequiredFields(
  fields: FieldValues,
  intakeFields: IntakeField[],
): string[] {
  const missing: string[] = [];
  for (const field of intakeFields) {
    if (!field.required) continue;
    const value = fields[field.key];
    if (value === undefined || value === "" || value === null) {
      missing.push(field.key);
    }
  }
  return missing;
}

export async function saveDocumentFields(
  documentType: InvestmentDocumentType,
  fields: FieldValues,
  options?: { status?: DocumentStatus },
): Promise<{ ok: true } | { ok: false; missing: string[] }> {
  const schema = getIntakeSchema(documentType);
  if (!schema) throw new Error("Unsupported document type");

  const missing = validateRequiredFields(fields, schema.fields);
  const document = await getDocumentByType(documentType);
  if (!document) throw new Error("Document not found");

  const ownerSub = await getOwnerSub();
  const supabase = await createServerSupabaseClient();

  const rows = Object.entries(fields)
    .filter(([key]) => !key.startsWith("_"))
    .map(([field_key, value]) => ({
      document_id: document.id,
      field_key,
      field_value: value as unknown as Record<string, never>,
    }));

  if (rows.length > 0) {
    const { error: upsertError } = await supabase.from("document_field_values").upsert(rows, {
      onConflict: "document_id,field_key",
    });
    if (upsertError) throw upsertError;
  }

  const nextStatus =
    options?.status ??
    (document.status === "not_started" ? "draft" : document.status);

  const { error: updateError } = await supabase
    .from("documents")
    .update({
      status: nextStatus,
      title: documentType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", document.id)
    .eq("owner_sub", ownerSub);

  if (updateError) throw updateError;

  if (missing.length > 0 && options?.status !== "draft") {
    return { ok: false, missing };
  }

  return { ok: true };
}

export async function flagDocumentForHelp(
  documentType: InvestmentDocumentType,
  message: string,
  flaggedField?: string,
): Promise<void> {
  const document = await getDocumentByType(documentType);
  if (!document) throw new Error("Document not found");

  const ownerSub = await getOwnerSub();
  const supabase = await createServerSupabaseClient();

  const helpRows = [
    {
      document_id: document.id,
      field_key: "_help_message",
      field_value: message as unknown as Record<string, never>,
    },
  ];

  if (flaggedField) {
    helpRows.push({
      document_id: document.id,
      field_key: "_flagged_field",
      field_value: flaggedField as unknown as Record<string, never>,
    });
  }

  const { error: fieldError } = await supabase.from("document_field_values").upsert(helpRows, {
    onConflict: "document_id,field_key",
  });
  if (fieldError) throw fieldError;

  const tenantId = await getPrimaryFirmTenantId();
  if (!tenantId) throw new Error("Firm tenant not configured");

  const { error: statusError } = await supabase
    .from("documents")
    .update({
      status: "flagged",
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", document.id)
    .eq("owner_sub", ownerSub);

  if (statusError) throw statusError;

  await supabase.from("intake_submissions").insert({
    document_id: document.id,
    owner_sub: ownerSub,
    tenant_id: tenantId,
    payload: {
      type: "help_request",
      message,
      flaggedField: flaggedField ?? null,
    },
  });

  if (tenantId) {
    await enqueueDocumentReview({
      documentId: document.id,
      requesterSub: ownerSub,
      tenantId,
      helpMessage: message,
    });
  }
}

export async function renderOwnedDocument(
  documentType: InvestmentDocumentType,
): Promise<{ body: string; missingFields: string[]; documentId: string }> {
  const state = await getDocumentFlowState(documentType);
  if (!state) throw new Error("Document not found");

  const rendered = renderDocument(documentType, state.fields);
  return { ...rendered, documentId: state.document.id };
}

export async function createFingerprintedVersion(
  documentType: InvestmentDocumentType,
  sessionId?: string,
  locale: "es-CO" | "en-US" = "es-CO",
): Promise<{ fingerprint: string; version: number; pdf: Uint8Array }> {
  const ownerSub = await getOwnerSub();
  const state = await getDocumentFlowState(documentType);
  if (!state) throw new Error("Document not found");

  const schema = getIntakeSchema(documentType);
  if (!schema) throw new Error("Unsupported document type");

  const missing = validateRequiredFields(state.fields, schema.fields);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  const rendered = renderDocument(documentType, state.fields, locale);
  const fingerprint = createDocumentFingerprint({
    content: rendered.body,
    ownerSub,
    documentId: state.document.id,
    sessionId,
    tenantId: state.document.tenantId,
  });

  const supabase = await createServerSupabaseClient();

  const { data: latest } = await supabase
    .from("document_versions")
    .select("version_number")
    .eq("document_id", state.document.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = (latest?.version_number ?? 0) + 1;

  const attorneyReview = await getCompletedReviewForDocument(state.document.id);

  const pdf = await buildDocumentPdf({
    title: getDocumentDisplayTitle(documentType, locale),
    body: rendered.body,
    fingerprint,
    version,
    disclaimer: getDisclaimer(locale, "document"),
    locale,
    firmName: getFirmName(),
    partySignatures: buildPartySignatures(documentType, state.fields, locale),
    attorneySignature: attorneyReview
      ? { name: attorneyReview.attorneyName, signedAt: attorneyReview.signedAt }
      : undefined,
  });

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: state.document.id,
    version_number: version,
    fingerprint,
    storage_path: null,
    created_by_sub: ownerSub,
  });

  if (versionError) throw versionError;

  const { error: statusError } = await supabase
    .from("documents")
    .update({
      status: attorneyReview ? "complete" : state.document.status === "not_started" ? "draft" : state.document.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", state.document.id)
    .eq("owner_sub", ownerSub);

  if (statusError) throw statusError;

  try {
    const audit = createServiceRoleSupabaseClient();
    await audit.from("audit_logs").insert({
      actor_sub: ownerSub,
      action: "document.download",
      resource_type: "document",
      resource_id: state.document.id,
      tenant_id: state.document.tenantId,
      metadata: {
        documentType,
        fingerprint,
        version,
        format: "pdf",
        locale,
        attorneySigned: Boolean(attorneyReview),
      },
    });
  } catch {
    // Audit is best-effort until insert policy is added
  }

  return { fingerprint, version, pdf };
}

export async function submitDocumentForReview(
  documentType: InvestmentDocumentType,
  options?: { message?: string },
): Promise<void> {
  const document = await getDocumentByType(documentType);
  if (!document) throw new Error("Document not found");

  if (document.status === "in_review" || document.status === "complete") {
    throw new Error("Document already submitted for review");
  }

  const schema = getIntakeSchema(documentType);
  if (!schema) throw new Error("Unsupported document type");

  const state = await getDocumentFlowState(documentType);
  if (!state) throw new Error("Document not found");

  const missing = validateRequiredFields(state.fields, schema.fields);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(", ")}`);
  }

  const ownerSub = await getOwnerSub();
  const supabase = await createServerSupabaseClient();
  const tenantId = await getPrimaryFirmTenantId();
  if (!tenantId) throw new Error("Firm tenant not configured");

  const message = options?.message?.trim() ?? state.helpMessage ?? "";

  if (message) {
    const { error: fieldError } = await supabase.from("document_field_values").upsert(
      {
        document_id: document.id,
        field_key: "_help_message",
        field_value: message as unknown as Record<string, never>,
      },
      { onConflict: "document_id,field_key" },
    );
    if (fieldError) throw fieldError;
  }

  const { error: statusError } = await supabase
    .from("documents")
    .update({
      status: "in_review",
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", document.id)
    .eq("owner_sub", ownerSub);

  if (statusError) throw statusError;

  await supabase.from("intake_submissions").insert({
    document_id: document.id,
    owner_sub: ownerSub,
    tenant_id: tenantId,
    payload: {
      type: "review_request",
      message: message || null,
    },
  });

  await enqueueDocumentReview({
    documentId: document.id,
    requesterSub: ownerSub,
    tenantId,
    helpMessage: message || undefined,
  });
}

export function assertFlowDocumentType(
  value: string,
): asserts value is import("@/lib/documents/intake").FlowDocumentType {
  if (!isInvestmentDocumentType(value) || !isFlowDocumentType(value)) {
    throw new Error("Invalid flow document type");
  }
}
