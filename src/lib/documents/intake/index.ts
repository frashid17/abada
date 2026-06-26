import type { InvestmentDocumentType } from "@/lib/documents/catalog";
import { employmentIntakeSchema } from "@/lib/documents/intake/employment";
import { ipIntakeSchema } from "@/lib/documents/intake/ip";
import { ndaIntakeSchema } from "@/lib/documents/intake/nda";
import { shareholdersIntakeSchema } from "@/lib/documents/intake/shareholders";
import { vestingIntakeSchema } from "@/lib/documents/intake/vesting";
import type { IntakeSchema } from "@/lib/documents/intake/types";

export const FLOW_DOCUMENT_TYPES = [
  "nda",
  "vesting",
  "ip",
  "employment",
  "shareholders",
] as const;
export type FlowDocumentType = (typeof FLOW_DOCUMENT_TYPES)[number];

const schemas: Partial<Record<InvestmentDocumentType, IntakeSchema>> = {
  nda: ndaIntakeSchema,
  vesting: vestingIntakeSchema,
  ip: ipIntakeSchema,
  employment: employmentIntakeSchema,
  shareholders: shareholdersIntakeSchema,
};

export function getIntakeSchema(documentType: InvestmentDocumentType): IntakeSchema | null {
  return schemas[documentType] ?? null;
}

export function isFlowDocumentType(
  documentType: InvestmentDocumentType,
): documentType is FlowDocumentType {
  return FLOW_DOCUMENT_TYPES.includes(documentType as FlowDocumentType);
}
