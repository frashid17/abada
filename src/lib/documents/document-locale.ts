import type { InvestmentDocumentType } from "@/lib/documents/catalog";

export type DocumentLocale = "es-CO" | "en-US";

export function parseDocumentLocale(value: string | null | undefined): DocumentLocale {
  return value === "en-US" ? "en-US" : "es-CO";
}

const DOCUMENT_TITLES: Record<DocumentLocale, Record<InvestmentDocumentType, string>> = {
  "es-CO": {
    nda: "Acuerdo de confidencialidad",
    vesting: "Acuerdo de vesting de fundador",
    ip: "Cesión de propiedad intelectual",
    employment: "Contrato de trabajo",
    shareholders: "Acuerdo de accionistas",
  },
  "en-US": {
    nda: "Non-Disclosure Agreement",
    vesting: "Founder Vesting Agreement",
    ip: "Intellectual Property Assignment",
    employment: "Employment Agreement",
    shareholders: "Shareholders Agreement",
  },
};

export function getDocumentDisplayTitle(
  documentType: InvestmentDocumentType,
  locale: DocumentLocale,
): string {
  return DOCUMENT_TITLES[locale][documentType];
}

/** Remove inline execution/signature blocks — PDF renders signatures separately. */
export function stripExecutionBlock(body: string, locale: DocumentLocale): string {
  const patterns =
    locale === "en-US"
      ? [
          /\n\d+\.\s*SIGNATURES[\s\S]*$/i,
          /\nIN WITNESS WHEREOF[\s\S]*$/i,
          /\n_{5,}[\s\S]*$/,
        ]
      : [
          /\n\d+\.\s*FIRMAS[\s\S]*$/i,
          /\nEn constancia,[\s\S]*$/i,
          /\n_{5,}[\s\S]*$/,
        ];

  let result = body;
  for (const pattern of patterns) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}
