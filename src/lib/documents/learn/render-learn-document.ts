import type { DocumentLocale } from "@/lib/documents/document-locale";
import type { FieldValues } from "@/lib/documents/intake/types";
import { corporateClientMasterTemplate } from "@/lib/documents/templates/corporate-client";
import { corporateClientMasterTemplateEn } from "@/lib/documents/templates/corporate-client.en";
import { employmentLearnMasterTemplate } from "@/lib/documents/templates/employment-learn";
import { employmentLearnMasterTemplateEn } from "@/lib/documents/templates/employment-learn.en";
import { foundersMasterTemplate } from "@/lib/documents/templates/founders";
import { foundersMasterTemplateEn } from "@/lib/documents/templates/founders.en";
import { termSheetMasterTemplate } from "@/lib/documents/templates/term-sheet";
import { termSheetMasterTemplateEn } from "@/lib/documents/templates/term-sheet.en";
import { equityCompensationMasterTemplate } from "@/lib/documents/templates/equity-compensation";
import { equityCompensationMasterTemplateEn } from "@/lib/documents/templates/equity-compensation.en";
import { ipAssignmentMasterTemplate } from "@/lib/documents/templates/ip-assignment";
import { ipAssignmentMasterTemplateEn } from "@/lib/documents/templates/ip-assignment.en";
import { termsOfUseMasterTemplate } from "@/lib/documents/templates/terms-of-use";
import { termsOfUseMasterTemplateEn } from "@/lib/documents/templates/terms-of-use.en";

export type LearnDocumentType =
  | "shareholders"
  | "term_sheet"
  | "founders"
  | "employment"
  | "corporate_client"
  | "terms_of_use"
  | "ip_assignment"
  | "equity_compensation";

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

/** Fill every `{{placeholder}}` from fields when present; leave others as bracket labels. */
function valuesFromFields(template: string, fields: FieldValues): Record<string, string> {
  const values: Record<string, string> = {};
  for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
    const key = match[1]!;
    const raw = fields[key];
    values[key] = asString(raw);
  }
  return values;
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

function pickTemplate(
  locale: DocumentLocale,
  es: string,
  en: string,
): string {
  return locale === "en-US" ? en : es;
}

export function renderLearnDocument(
  documentType: LearnDocumentType,
  fields: FieldValues,
  locale: DocumentLocale = "es-CO",
): RenderResult {
  if (documentType === "term_sheet") {
    const template = pickTemplate(locale, termSheetMasterTemplate, termSheetMasterTemplateEn);
    return mergeTemplate(template, buildTermSheetValues(fields));
  }

  if (documentType === "founders") {
    const template = pickTemplate(locale, foundersMasterTemplate, foundersMasterTemplateEn);
    return mergeTemplate(template, valuesFromFields(template, fields));
  }

  if (documentType === "employment") {
    const template = pickTemplate(
      locale,
      employmentLearnMasterTemplate,
      employmentLearnMasterTemplateEn,
    );
    return mergeTemplate(template, valuesFromFields(template, fields));
  }

  if (documentType === "corporate_client") {
    const template = pickTemplate(
      locale,
      corporateClientMasterTemplate,
      corporateClientMasterTemplateEn,
    );
    return mergeTemplate(template, valuesFromFields(template, fields));
  }

  if (documentType === "terms_of_use") {
    const template = pickTemplate(locale, termsOfUseMasterTemplate, termsOfUseMasterTemplateEn);
    return mergeTemplate(template, valuesFromFields(template, fields));
  }

  if (documentType === "ip_assignment") {
    const template = pickTemplate(
      locale,
      ipAssignmentMasterTemplate,
      ipAssignmentMasterTemplateEn,
    );
    return mergeTemplate(template, valuesFromFields(template, fields));
  }

  if (documentType === "equity_compensation") {
    const template = pickTemplate(
      locale,
      equityCompensationMasterTemplate,
      equityCompensationMasterTemplateEn,
    );
    return mergeTemplate(template, valuesFromFields(template, fields));
  }

  // shareholders remains on renderDocument via getLearnDocument
  return { body: "", missingFields: ["unsupported_learn_document_type"] };
}
