import type { InvestmentDocumentType } from "@/lib/documents/catalog";

export type IntakeFieldType = "text" | "email" | "number" | "date" | "select" | "textarea";

export type IntakeFieldOption = {
  value: string;
  labelKey: string;
};

export type IntakeField = {
  key: string;
  type: IntakeFieldType;
  labelKey: string;
  required?: boolean;
  options?: IntakeFieldOption[];
  step: number;
  placeholderKey?: string;
  helpKey?: string;
};

export type IntakeSchema = {
  documentType: InvestmentDocumentType;
  steps: number;
  fields: IntakeField[];
};

export type FieldValues = Record<string, string | number | boolean>;
