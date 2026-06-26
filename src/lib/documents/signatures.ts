import type { DocumentLocale } from "@/lib/documents/document-locale";
import type { InvestmentDocumentType } from "@/lib/documents/catalog";
import type { FieldValues } from "@/lib/documents/intake/types";

export type PartySignature = {
  label: string;
  name: string;
  subtitle?: string;
};

function asString(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function buildPartySignatures(
  documentType: InvestmentDocumentType,
  fields: FieldValues,
  locale: DocumentLocale = "es-CO",
): PartySignature[] {
  const en = locale === "en-US";

  switch (documentType) {
    case "nda": {
      const mutual = fields.agreement_mode === "mutual";
      return [
        {
          label: en
            ? mutual
              ? "Party A"
              : "Disclosing Party"
            : mutual
              ? "Parte A"
              : "Parte Reveladora",
          name: asString(fields.company_name),
          subtitle: en ? "Company" : "Compañía",
        },
        {
          label: en
            ? mutual
              ? "Party B"
              : "Receiving Party"
            : mutual
              ? "Parte B"
              : "Parte Receptora",
          name: asString(fields.counterparty_name),
          subtitle: en ? "Counterparty" : "Contraparte",
        },
      ];
    }
    case "vesting":
      return [
        {
          label: en ? "For the Company" : "Por la Compañía",
          name: asString(fields.company_representative),
          subtitle: asString(fields.company_representative_title),
        },
        {
          label: en ? "Founder" : "El Fundador",
          name: asString(fields.founder_name),
          subtitle: asString(fields.founder_id),
        },
      ];
    case "ip":
      return [
        {
          label: en ? "Assignor" : "Cedente",
          name: asString(fields.assignor_name),
          subtitle: asString(fields.assignor_id),
        },
        {
          label: en ? "Assignee" : "Cesionaria",
          name: asString(fields.company_name),
          subtitle: en
            ? `Tax ID (NIT) ${asString(fields.company_id)}`
            : `NIT ${asString(fields.company_id)}`,
        },
      ];
    case "employment":
      return [
        {
          label: en ? "Employer" : "Empleador",
          name: asString(fields.company_name),
          subtitle: asString(fields.company_representative),
        },
        {
          label: en ? "Employee" : "Trabajador",
          name: asString(fields.employee_name),
          subtitle: asString(fields.employee_id),
        },
      ];
    case "shareholders":
      return [
        {
          label: en ? "The Company" : "La Compañía",
          name: asString(fields.company_name),
          subtitle: asString(fields.company_representative),
        },
        {
          label: en ? "Lead investor" : "Inversionista líder",
          name: asString(fields.lead_investor_name),
          subtitle: asString(fields.lead_investor_id),
        },
      ];
    default:
      return [];
  }
}

export type AttorneyAttestationCopy = {
  reviewedHeading: string;
  pendingHeading: string;
  pendingBody: string;
  attorneyTitle: string;
  dateLabel: string;
  watermarkReviewed: string;
  partiesHeading: string;
  signaturesHeading: string;
};

export function getAttestationCopy(locale: DocumentLocale): AttorneyAttestationCopy {
  if (locale === "en-US") {
    return {
      reviewedHeading: "Execution",
      pendingHeading: "Attorney review",
      pendingBody:
        "Pending review and signature by a named attorney at the firm before execution.",
      attorneyTitle: "Attorney",
      dateLabel: "Date",
      watermarkReviewed: "REVIEWED",
      partiesHeading: "Parties",
      signaturesHeading: "Signatures",
    };
  }

  return {
    reviewedHeading: "Ejecución",
    pendingHeading: "Revisión del abogado",
    pendingBody:
      "Pendiente de revisión y firma por un abogado nombrado de la firma antes de su ejecución.",
    attorneyTitle: "Abogado",
    dateLabel: "Fecha",
    watermarkReviewed: "REVISADO",
    partiesHeading: "Partes",
    signaturesHeading: "Firmas",
  };
}
