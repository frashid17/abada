import type { DocumentLocale } from "@/lib/documents/document-locale";
import { INVESTMENT_DOCUMENT_CATALOG } from "@/lib/documents/catalog";
import type { FieldValues } from "@/lib/documents/intake/types";
import { renderDocument } from "@/lib/documents/render";
import { getDocumentFlowState } from "@/lib/documents/service";
import { parseDocumentClauses, type DocumentClause } from "@/lib/documents/learn/parse-clauses";
import {
  type LearnDocumentType,
  renderLearnDocument,
} from "@/lib/documents/learn/render-learn-document";

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

const TERM_SHEET_SAMPLE_FIELDS: FieldValues = {
  company_name: "[NAME]",
  closing_month: "Junio",
  closing_day: "18",
  closing_year: "2026",
  lead_investor_name: "[Inversionista líder]",
  target_closing_date: "[Mes] [Día], [Año]",
  investor_schedule:
    "Inversionista 1. [●]: [#] Acciones Preferentes, COP [$.000.000].\nInversionista 2. [●]: [#] Acciones Preferentes, COP [$.000.000].\nInversionista 3. [●]: [#] Acciones Preferentes, COP [$.000.000].",
  founder_names: "[NAME], [NAME] y [NAME]",
  max_investment_cop: "$.000.000",
  investor_ownership_pct: "[PERCENTAGE]",
  price_per_share_cop: "$.000.000",
  post_money_valuation_cop: "$.000.000",
  dividend_lockup_years: "[NUMBER]",
  liquidation_multiple: "[#]",
  liquidation_waiver_pct: "[PERCENTAGE]",
  common_votes_per_share: "[número]",
  protective_majority_pct: "[PERCENTAGE]",
  debt_threshold_cop: "$.000.000",
  board_supermajority_count: "cuatro",
  board_size: "cinco",
  ceo_comp_change_pct: "[PERCENTAGE]",
  executive_comp_threshold_cop: "$.000.000",
  non_compete_years: "dos",
  control_transfer_pct: "50",
  board_investor_seats: "[2/3]",
  board_founder_seats: "[3/2]",
  drag_along_threshold_pct: "51",
  liquidity_trigger_pct: "50% más 1",
  demand_sale_pct: "51",
  liquidity_irr_pct: "33",
  liquidity_multiple: "15",
  term_sheet_validity_months: "tres",
};

export type LearnDocumentPayload = {
  documentType: LearnDocumentType;
  step: number;
  totalSteps: number;
  clauses: DocumentClause[];
  fields: FieldValues;
  hasDraftFlow: boolean;
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
    hasDraftFlow: true,
  };
}

export function getTermSheetLearnDocument(
  locale: DocumentLocale = "es-CO",
): LearnDocumentPayload {
  const fields: FieldValues = { ...TERM_SHEET_SAMPLE_FIELDS };
  const rendered = renderLearnDocument("term_sheet", fields, locale);

  return {
    documentType: "term_sheet",
    step: 1,
    totalSteps: 1,
    clauses: parseDocumentClauses(rendered.body),
    fields,
    hasDraftFlow: false,
  };
}

export async function getLearnDocument(
  documentType: LearnDocumentType,
  locale: DocumentLocale = "es-CO",
): Promise<LearnDocumentPayload> {
  if (documentType === "term_sheet") {
    return getTermSheetLearnDocument(locale);
  }
  return getShareholdersLearnDocument(locale);
}
