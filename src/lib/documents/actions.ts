"use server";

import { revalidatePath } from "next/cache";
import type { InvestmentDocumentType } from "@/lib/documents/catalog";
import type { FieldValues } from "@/lib/documents/intake/types";
import { getDocumentDisplayTitle } from "@/lib/documents/document-locale";
import { getDisclaimer } from "@/lib/ai/guardrails";
import {
  buildEditableDocumentBody,
  type EditableDocumentBody,
} from "@/lib/documents/editable-body";
import { wrapPreviewHtml, renderDocument } from "@/lib/documents/render";
import {
  flagDocumentForHelp,
  getDocumentFlowState,
  saveDocumentFields,
  submitDocumentForReview,
} from "@/lib/documents/service";

export type SaveFieldsResult =
  | { ok: true }
  | { ok: false; missing: string[]; error?: string };

export async function saveDocumentFieldsAction(
  documentType: InvestmentDocumentType,
  fields: FieldValues,
): Promise<SaveFieldsResult> {
  try {
    const result = await saveDocumentFields(documentType, fields, { status: "draft" });
    revalidatePath(`/fundador/documentos/${documentType}`);
    revalidatePath("/fundador");
    return result;
  } catch (error) {
    return { ok: false, missing: [], error: error instanceof Error ? error.message : "Save failed" };
  }
}

export async function flagDocumentForHelpAction(
  documentType: InvestmentDocumentType,
  message: string,
  flaggedField?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await flagDocumentForHelp(documentType, message, flaggedField);
    revalidatePath(`/fundador/documentos/${documentType}`);
    revalidatePath("/fundador");
    revalidatePath("/firma/cola");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Flag failed" };
  }
}

export async function getDocumentPreviewHtmlAction(
  documentType: InvestmentDocumentType,
  locale: "es-CO" | "en-US",
  fields?: FieldValues,
): Promise<{ html: string; missingFields: string[] } | { error: string }> {
  try {
    const resolvedFields =
      fields ?? (await getDocumentFlowState(documentType))?.fields;
    if (!resolvedFields) return { error: "Document not found" };

    const rendered = renderDocument(documentType, resolvedFields, locale);
    const disclaimer = getDisclaimer(locale, "document");
    const html = wrapPreviewHtml(
      rendered.body,
      getDocumentDisplayTitle(documentType, locale),
      disclaimer,
      locale,
    );
    return { html, missingFields: rendered.missingFields };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Preview failed" };
  }
}

export async function getEditableDocumentBodyAction(
  documentType: InvestmentDocumentType,
  fields: FieldValues,
  locale: "es-CO" | "en-US",
): Promise<EditableDocumentBody | { error: string }> {
  try {
    const body = buildEditableDocumentBody(documentType, fields, locale);
    if (!body) return { error: "Unsupported document type" };
    return body;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to build document body",
    };
  }
}

export async function submitDocumentForReviewAction(
  documentType: InvestmentDocumentType,
  message?: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await submitDocumentForReview(documentType, { message });
    revalidatePath(`/fundador/documentos/${documentType}`);
    revalidatePath("/fundador");
    revalidatePath("/firma/cola");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Review submission failed",
    };
  }
}
