/** Colombian DD document taxonomy (RDI upload slots) and risk categories (findings). */

/** Primary upload categories aligned to the firm Info Request (RDI) §§3–11. */
export const DD_DOCUMENT_CATEGORIES = [
  "corporate_governance",
  "founders_shareholders",
  "ip_technology",
  "equity_compensation",
  "labor_talent",
  "commercial_customers",
  "privacy_consumer",
  "financing_related",
  "disputes_compliance",
  "other",
] as const;

export type DdDocumentCategory = (typeof DD_DOCUMENT_CATEGORIES)[number];

/** Pre-RDI category keys still accepted on existing uploads. */
export const LEGACY_DD_CATEGORY_ALIASES: Record<string, DdDocumentCategory> = {
  corporate: "corporate_governance",
  financial: "financing_related",
  tax: "financing_related",
  labor: "labor_talent",
  contracts: "commercial_customers",
  ip: "ip_technology",
  litigation: "disputes_compliance",
  regulatory: "disputes_compliance",
};

export const DD_RISK_CATEGORIES = [
  "corporativo_registral",
  "laboral",
  "tributario",
  "contractual",
  "propiedad_intelectual",
  "litigios",
  "regulatorio",
  "datos_privacidad",
] as const;

export type DdRiskCategory = (typeof DD_RISK_CATEGORIES)[number];

/** Playbook traffic light: High / Medium / Low / Information required. */
export const DD_RISK_LEVELS = ["bajo", "medio", "alto", "info_requerida"] as const;

export type DdRiskLevel = (typeof DD_RISK_LEVELS)[number];

export function normalizeDdDocumentCategory(value: string): DdDocumentCategory | null {
  if (DD_DOCUMENT_CATEGORIES.includes(value as DdDocumentCategory)) {
    return value as DdDocumentCategory;
  }
  return LEGACY_DD_CATEGORY_ALIASES[value] ?? null;
}

export function isDdDocumentCategory(value: string): value is DdDocumentCategory {
  return normalizeDdDocumentCategory(value) !== null;
}

export function isDdRiskCategory(value: string): value is DdRiskCategory {
  return DD_RISK_CATEGORIES.includes(value as DdRiskCategory);
}

export function isDdRiskLevel(value: string): value is DdRiskLevel {
  return DD_RISK_LEVELS.includes(value as DdRiskLevel);
}
