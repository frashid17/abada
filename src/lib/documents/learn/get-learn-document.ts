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

const COMPANY_SAMPLE: FieldValues = {
  nombre_de_la_sociedad: "[Nombre de la Sociedad]",
  nit: "[NIT]",
  domicilio: "[Domicilio]",
  marca: "[Marca]",
  fecha: "[Fecha]",
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
    totalSteps: LEARN_ONLY_TOTAL,
    clauses: parseDocumentClauses(rendered.body),
    fields,
    hasDraftFlow: false,
  };
}

const LEARN_ONLY_TOTAL = 6;

function firmLearnPayload(
  documentType: Exclude<LearnDocumentType, "shareholders" | "term_sheet">,
  locale: DocumentLocale,
  step: number,
  hasDraftFlow: boolean,
  extraFields: FieldValues = {},
): LearnDocumentPayload {
  const fields: FieldValues = { ...COMPANY_SAMPLE, ...extraFields };
  const rendered = renderLearnDocument(documentType, fields, locale);
  return {
    documentType,
    step,
    totalSteps: LEARN_ONLY_TOTAL,
    clauses: parseDocumentClauses(rendered.body),
    fields,
    hasDraftFlow,
  };
}

export function getFoundersLearnDocument(
  locale: DocumentLocale = "es-CO",
): LearnDocumentPayload {
  return firmLearnPayload("founders", locale, 2, false);
}

export function getCorporateClientLearnDocument(
  locale: DocumentLocale = "es-CO",
): LearnDocumentPayload {
  return firmLearnPayload("corporate_client", locale, 5, false);
}

export function getTermsOfUseLearnDocument(
  locale: DocumentLocale = "es-CO",
): LearnDocumentPayload {
  return firmLearnPayload("terms_of_use", locale, 6, false);
}

/** Sample employment learn payload without loading saved draft state (unit tests). */
export function getEmploymentLearnDocumentSample(
  locale: DocumentLocale = "es-CO",
): LearnDocumentPayload {
  const catalogStep =
    INVESTMENT_DOCUMENT_CATALOG.find((item) => item.type === "employment")?.step ?? 4;
  const rendered = renderLearnDocument("employment", COMPANY_SAMPLE, locale);
  return {
    documentType: "employment",
    step: catalogStep,
    totalSteps: INVESTMENT_DOCUMENT_CATALOG.length,
    clauses: parseDocumentClauses(rendered.body),
    fields: { ...COMPANY_SAMPLE },
    hasDraftFlow: true,
  };
}

export async function getEmploymentLearnDocument(
  locale: DocumentLocale = "es-CO",
): Promise<LearnDocumentPayload> {
  const state = await getDocumentFlowState("employment");
  const sample = getEmploymentLearnDocumentSample(locale);
  const fields: FieldValues = {
    ...sample.fields,
    ...(state?.fields ?? {}),
  };
  const rendered = renderLearnDocument("employment", fields, locale);
  return {
    ...sample,
    clauses: parseDocumentClauses(rendered.body),
    fields,
  };
}

export async function getLearnDocument(
  documentType: LearnDocumentType,
  locale: DocumentLocale = "es-CO",
): Promise<LearnDocumentPayload> {
  if (documentType === "term_sheet") {
    return getTermSheetLearnDocument(locale);
  }
  if (documentType === "shareholders") {
    return getShareholdersLearnDocument(locale);
  }
  if (documentType === "employment") {
    return getEmploymentLearnDocument(locale);
  }
  if (documentType === "founders") {
    return getFoundersLearnDocument(locale);
  }
  if (documentType === "corporate_client") {
    return getCorporateClientLearnDocument(locale);
  }
  return getTermsOfUseLearnDocument(locale);
}
