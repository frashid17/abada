export const INVESTMENT_DOCUMENT_TYPES = [
  "nda",
  "vesting",
  "ip",
  "employment",
  "shareholders",
] as const;

export type InvestmentDocumentType = (typeof INVESTMENT_DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = [
  "not_started",
  "draft",
  "flagged",
  "in_review",
  "complete",
] as const;

export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export type InvestmentDocumentDefinition = {
  type: InvestmentDocumentType;
  step: number;
  messageKey: InvestmentDocumentType;
};

export const INVESTMENT_DOCUMENT_CATALOG: InvestmentDocumentDefinition[] = [
  { type: "nda", step: 1, messageKey: "nda" },
  { type: "vesting", step: 2, messageKey: "vesting" },
  { type: "ip", step: 3, messageKey: "ip" },
  { type: "employment", step: 4, messageKey: "employment" },
  { type: "shareholders", step: 5, messageKey: "shareholders" },
];

export function isInvestmentDocumentType(value: string): value is InvestmentDocumentType {
  return INVESTMENT_DOCUMENT_TYPES.includes(value as InvestmentDocumentType);
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return DOCUMENT_STATUSES.includes(value as DocumentStatus);
}
