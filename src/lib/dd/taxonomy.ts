/** Colombian DD document taxonomy (upload slots) and risk categories (findings). */

export const DD_DOCUMENT_CATEGORIES = [
  "corporate",
  "financial",
  "tax",
  "labor",
  "contracts",
  "ip",
  "litigation",
  "regulatory",
  "other",
] as const;

export type DdDocumentCategory = (typeof DD_DOCUMENT_CATEGORIES)[number];

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

export const DD_RISK_LEVELS = ["bajo", "medio", "alto"] as const;

export type DdRiskLevel = (typeof DD_RISK_LEVELS)[number];

export function isDdDocumentCategory(value: string): value is DdDocumentCategory {
  return DD_DOCUMENT_CATEGORIES.includes(value as DdDocumentCategory);
}

export function isDdRiskCategory(value: string): value is DdRiskCategory {
  return DD_RISK_CATEGORIES.includes(value as DdRiskCategory);
}

export function isDdRiskLevel(value: string): value is DdRiskLevel {
  return DD_RISK_LEVELS.includes(value as DdRiskLevel);
}
