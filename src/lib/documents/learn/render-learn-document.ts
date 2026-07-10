import type { DocumentLocale } from "@/lib/documents/document-locale";
import type { FieldValues } from "@/lib/documents/intake/types";
import { termSheetMasterTemplate } from "@/lib/documents/templates/term-sheet";
import { termSheetMasterTemplateEn } from "@/lib/documents/templates/term-sheet.en";

export type LearnDocumentType = "shareholders" | "term_sheet";

export type RenderResult = {
  body: string;
  missingFields: string[];
};

function asString(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function mergeTemplate(template: string, values: Record<string, string>): RenderResult {
  const missingFields: string[] = [];
  const body = template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (!value) {
      missingFields.push(key);
      return `[${key}]`;
    }
    return value;
  });
  return { body, missingFields };
}

function buildTermSheetValues(fields: FieldValues): Record<string, string> {
  return {
    company_name: asString(fields.company_name),
    closing_month: asString(fields.closing_month),
    closing_day: asString(fields.closing_day),
    closing_year: asString(fields.closing_year),
    lead_investor_name: asString(fields.lead_investor_name),
    target_closing_date: asString(fields.target_closing_date),
    investor_schedule: asString(fields.investor_schedule),
    founder_names: asString(fields.founder_names),
    max_investment_cop: asString(fields.max_investment_cop),
    investor_ownership_pct: asString(fields.investor_ownership_pct),
    price_per_share_cop: asString(fields.price_per_share_cop),
    post_money_valuation_cop: asString(fields.post_money_valuation_cop),
    dividend_lockup_years: asString(fields.dividend_lockup_years),
    liquidation_multiple: asString(fields.liquidation_multiple),
    liquidation_waiver_pct: asString(fields.liquidation_waiver_pct),
    common_votes_per_share: asString(fields.common_votes_per_share),
    protective_majority_pct: asString(fields.protective_majority_pct),
    debt_threshold_cop: asString(fields.debt_threshold_cop),
    board_supermajority_count: asString(fields.board_supermajority_count),
    board_size: asString(fields.board_size),
    ceo_comp_change_pct: asString(fields.ceo_comp_change_pct),
    executive_comp_threshold_cop: asString(fields.executive_comp_threshold_cop),
    non_compete_years: asString(fields.non_compete_years),
    control_transfer_pct: asString(fields.control_transfer_pct),
    board_investor_seats: asString(fields.board_investor_seats),
    board_founder_seats: asString(fields.board_founder_seats),
    drag_along_threshold_pct: asString(fields.drag_along_threshold_pct),
    liquidity_trigger_pct: asString(fields.liquidity_trigger_pct),
    demand_sale_pct: asString(fields.demand_sale_pct),
    liquidity_irr_pct: asString(fields.liquidity_irr_pct),
    liquidity_multiple: asString(fields.liquidity_multiple),
    term_sheet_validity_months: asString(fields.term_sheet_validity_months),
  };
}

export function renderLearnDocument(
  documentType: LearnDocumentType,
  fields: FieldValues,
  locale: DocumentLocale = "es-CO",
): RenderResult {
  if (documentType !== "term_sheet") {
    return { body: "", missingFields: ["unsupported_learn_document_type"] };
  }

  const template = locale === "en-US" ? termSheetMasterTemplateEn : termSheetMasterTemplate;
  return mergeTemplate(template, buildTermSheetValues(fields));
}
