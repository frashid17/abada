import type { DocumentLocale } from "@/lib/documents/document-locale";
import { INVESTMENT_DOCUMENT_CATALOG } from "@/lib/documents/catalog";
import type { FieldValues } from "@/lib/documents/intake/types";
import { renderDocument } from "@/lib/documents/render";
import { getDocumentFlowState } from "@/lib/documents/service";
import { parseDocumentClauses, type DocumentClause } from "@/lib/documents/learn/parse-clauses";

const SHAREHOLDERS_SAMPLE_FIELDS: FieldValues = {
  company_name: "[Compañía]",
  company_id: "900.000.000",
  lead_investor_name: "[Inversionista líder]",
  lead_investor_id: "NIT pendiente",
  effective_date: "[Fecha]",
  drag_along_threshold_pct: 75,
  tag_along_enabled: "yes",
  anti_dilution: "broad_based",
  qualified_majority_pct: 66,
  dispute_resolution: "arbitration",
  jurisdiction_city: "Bogotá",
  company_representative: "[Representante legal]",
};

export type LearnDocumentPayload = {
  documentType: "shareholders";
  step: number;
  totalSteps: number;
  clauses: DocumentClause[];
  fields: FieldValues;
};

export async function getShareholdersLearnDocument(
  locale: DocumentLocale = "es-CO",
): Promise<LearnDocumentPayload> {
  const state = await getDocumentFlowState("shareholders");
  const fields: FieldValues = {
    ...SHAREHOLDERS_SAMPLE_FIELDS,
    ...(state?.fields ?? {}),
  };

  const rendered = renderDocument("shareholders", fields, locale);
  const step =
    INVESTMENT_DOCUMENT_CATALOG.find((item) => item.type === "shareholders")?.step ?? 5;

  return {
    documentType: "shareholders",
    step,
    totalSteps: INVESTMENT_DOCUMENT_CATALOG.length,
    clauses: parseDocumentClauses(rendered.body),
    fields,
  };
}
