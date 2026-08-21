import type { DocumentLocale } from "@/lib/documents/document-locale";
import type { InvestmentDocumentType } from "@/lib/documents/catalog";
import { getIntakeSchema } from "@/lib/documents/intake";
import type { FieldValues, IntakeField } from "@/lib/documents/intake/types";
import { parseDocumentClauses, type DocumentClause } from "@/lib/documents/learn/parse-clauses";
import {
  extractFieldKeysFromEditableBody,
  renderDocumentEditable,
} from "@/lib/documents/render";

export type EditableDocumentBody = {
  clauses: DocumentClause[];
  bodyFieldKeys: string[];
  structureFields: IntakeField[];
  missingFields: string[];
};

export function buildEditableDocumentBody(
  documentType: InvestmentDocumentType,
  fields: FieldValues,
  locale: DocumentLocale,
): EditableDocumentBody | null {
  const schema = getIntakeSchema(documentType);
  if (!schema) return null;

  const editableKeys = schema.fields.map((field) => field.key);
  const rendered = renderDocumentEditable(documentType, fields, editableKeys, locale);
  const bodyFieldKeys = extractFieldKeysFromEditableBody(rendered.body);
  const bodyKeySet = new Set(bodyFieldKeys);
  const structureFields = schema.fields.filter((field) => !bodyKeySet.has(field.key));

  return {
    clauses: parseDocumentClauses(rendered.body),
    bodyFieldKeys,
    structureFields,
    missingFields: rendered.missingFields,
  };
}
