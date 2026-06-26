import type { DocumentLocale } from "@/lib/documents/document-locale";
import type { InvestmentDocumentType } from "@/lib/documents/catalog";
import type { FieldValues } from "@/lib/documents/intake/types";
import {
  employmentFixedTerm,
  employmentIndefinite,
  employmentMasterTemplate,
  employmentNonCompeteCompensated,
  employmentNonCompeteNone,
} from "@/lib/documents/templates/employment";
import {
  employmentFixedTermEn,
  employmentIndefiniteEn,
  employmentMasterTemplateEn,
  employmentNonCompeteCompensatedEn,
  employmentNonCompeteNoneEn,
} from "@/lib/documents/templates/employment.en";
import {
  ipMasterTemplate,
  ipScopeAll,
  ipScopeSpecified,
} from "@/lib/documents/templates/ip";
import {
  ipMasterTemplateEn,
  ipScopeAllEn,
  ipScopeSpecifiedEn,
} from "@/lib/documents/templates/ip.en";
import {
  ndaMasterTemplate,
  ndaMutualObligations,
  ndaUnilateralObligations,
} from "@/lib/documents/templates/nda";
import {
  ndaMasterTemplateEn,
  ndaMutualObligationsEn,
  ndaUnilateralObligationsEn,
} from "@/lib/documents/templates/nda.en";
import {
  shareholdersAntiDilutionBroad,
  shareholdersAntiDilutionNone,
  shareholdersDisputeArbitration,
  shareholdersDisputeCourts,
  shareholdersMasterTemplate,
  shareholdersTagAlongNo,
  shareholdersTagAlongYes,
} from "@/lib/documents/templates/shareholders";
import {
  shareholdersAntiDilutionBroadEn,
  shareholdersAntiDilutionNoneEn,
  shareholdersDisputeArbitrationEn,
  shareholdersDisputeCourtsEn,
  shareholdersMasterTemplateEn,
  shareholdersTagAlongNoEn,
  shareholdersTagAlongYesEn,
} from "@/lib/documents/templates/shareholders.en";
import {
  vestingAccelerationDouble,
  vestingAccelerationNone,
  vestingAccelerationSingle,
  vestingDepartureForfeit,
  vestingDepartureNegotiable,
  vestingDeparturePartial,
  vestingMasterTemplate,
} from "@/lib/documents/templates/vesting";
import {
  vestingAccelerationDoubleEn,
  vestingAccelerationNoneEn,
  vestingAccelerationSingleEn,
  vestingDepartureForfeitEn,
  vestingDepartureNegotiableEn,
  vestingDeparturePartialEn,
  vestingMasterTemplateEn,
} from "@/lib/documents/templates/vesting.en";

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

function buildNdaValues(fields: FieldValues, locale: DocumentLocale): Record<string, string> {
  const mutual = fields.agreement_mode === "mutual";
  if (locale === "en-US") {
    return {
      company_name: asString(fields.company_name),
      company_id: asString(fields.company_id),
      counterparty_name: asString(fields.counterparty_name),
      counterparty_id: asString(fields.counterparty_id),
      purpose: asString(fields.purpose),
      term_years: asString(fields.term_years),
      jurisdiction_city: asString(fields.jurisdiction_city),
      agreement_mode_label: mutual ? "MUTUAL" : "UNILATERAL",
      party_a_label: mutual ? "Party A" : "Disclosing Party",
      party_b_label: mutual ? "Party B" : "Receiving Party",
      confidentiality_obligations: mutual ? ndaMutualObligationsEn : ndaUnilateralObligationsEn,
    };
  }
  return {
    company_name: asString(fields.company_name),
    company_id: asString(fields.company_id),
    counterparty_name: asString(fields.counterparty_name),
    counterparty_id: asString(fields.counterparty_id),
    purpose: asString(fields.purpose),
    term_years: asString(fields.term_years),
    jurisdiction_city: asString(fields.jurisdiction_city),
    agreement_mode_label: mutual ? "MUTUO" : "UNILATERAL",
    party_a_label: mutual ? "Parte A" : "Parte Reveladora",
    party_b_label: mutual ? "Parte B" : "Parte Receptora",
    confidentiality_obligations: mutual ? ndaMutualObligations : ndaUnilateralObligations,
  };
}

function buildVestingValues(fields: FieldValues, locale: DocumentLocale): Record<string, string> {
  const en = locale === "en-US";
  const accelerationMap = en
    ? {
        none: vestingAccelerationNoneEn,
        single_trigger: vestingAccelerationSingleEn,
        double_trigger: vestingAccelerationDoubleEn,
      }
    : {
        none: vestingAccelerationNone,
        single_trigger: vestingAccelerationSingle,
        double_trigger: vestingAccelerationDouble,
      };

  const departureMap = en
    ? {
        forfeit: vestingDepartureForfeitEn,
        partial: vestingDeparturePartialEn,
        negotiable: vestingDepartureNegotiableEn,
      }
    : {
        forfeit: vestingDepartureForfeit,
        partial: vestingDeparturePartial,
        negotiable: vestingDepartureNegotiable,
      };

  const accelerationKey = asString(fields.acceleration_type) as keyof typeof accelerationMap;
  const departureKey = asString(fields.departure_treatment) as keyof typeof departureMap;
  const additionalTerms = asString(fields.additional_terms).trim();
  const goodLeaver = asString(fields.good_leaver_definition).trim();

  return {
    company_name: asString(fields.company_name),
    company_id: asString(fields.company_id),
    founder_name: asString(fields.founder_name),
    founder_id: asString(fields.founder_id),
    founder_email: asString(fields.founder_email),
    shares_total: asString(fields.shares_total),
    vesting_months: asString(fields.vesting_months),
    cliff_months: asString(fields.cliff_months),
    vesting_start_date: asString(fields.vesting_start_date),
    company_representative: asString(fields.company_representative),
    company_representative_title: asString(fields.company_representative_title),
    acceleration_clause: accelerationMap[accelerationKey] ?? accelerationMap.none,
    departure_clause: departureMap[departureKey] ?? departureMap.forfeit,
    good_leaver_clause:
      goodLeaver ||
      (en
        ? "Founder shall be deemed a Good Leaver upon mutual separation, duly certified serious incapacity, or death, as defined in the shareholders agreement."
        : "Se considerará Buen Salidor al Fundador que se separe por mutuo acuerdo, incapacidad grave debidamente acreditada, o fallecimiento, conforme defina el acuerdo de accionistas."),
    additional_terms_block: additionalTerms
      ? additionalTerms
      : en
        ? "No additional provisions apply."
        : "No aplican disposiciones adicionales.",
  };
}

function buildIpValues(fields: FieldValues, locale: DocumentLocale): Record<string, string> {
  const scopeAll = fields.assignment_scope === "all_current_future";
  if (locale === "en-US") {
    return {
      company_name: asString(fields.company_name),
      company_id: asString(fields.company_id),
      assignor_name: asString(fields.assignor_name),
      assignor_id: asString(fields.assignor_id),
      assignor_email: asString(fields.assignor_email),
      ip_description: asString(fields.ip_description),
      consideration: asString(fields.consideration),
      effective_date: asString(fields.effective_date),
      jurisdiction_city: asString(fields.jurisdiction_city),
      scope_clause: scopeAll ? ipScopeAllEn : ipScopeSpecifiedEn,
    };
  }
  return {
    company_name: asString(fields.company_name),
    company_id: asString(fields.company_id),
    assignor_name: asString(fields.assignor_name),
    assignor_id: asString(fields.assignor_id),
    assignor_email: asString(fields.assignor_email),
    ip_description: asString(fields.ip_description),
    consideration: asString(fields.consideration),
    effective_date: asString(fields.effective_date),
    jurisdiction_city: asString(fields.jurisdiction_city),
    scope_clause: scopeAll ? ipScopeAll : ipScopeSpecified,
  };
}

function buildEmploymentValues(fields: FieldValues, locale: DocumentLocale): Record<string, string> {
  const isFixed = fields.contract_type === "fixed_term";
  const termMonths = asString(fields.term_months) || "12";
  if (locale === "en-US") {
    const nonCompete =
      fields.non_compete === "with_compensation"
        ? employmentNonCompeteCompensatedEn
        : employmentNonCompeteNoneEn;
    return {
      company_name: asString(fields.company_name),
      company_id: asString(fields.company_id),
      employee_name: asString(fields.employee_name),
      employee_id: asString(fields.employee_id),
      employee_email: asString(fields.employee_email),
      role_title: asString(fields.role_title),
      start_date: asString(fields.start_date),
      salary_monthly_cop: asString(fields.salary_monthly_cop),
      jurisdiction_city: asString(fields.jurisdiction_city),
      company_representative: asString(fields.company_representative),
      contract_clause: isFixed ? employmentFixedTermEn(termMonths) : employmentIndefiniteEn,
      non_compete_clause: nonCompete,
    };
  }
  const nonCompete =
    fields.non_compete === "with_compensation"
      ? employmentNonCompeteCompensated
      : employmentNonCompeteNone;
  return {
    company_name: asString(fields.company_name),
    company_id: asString(fields.company_id),
    employee_name: asString(fields.employee_name),
    employee_id: asString(fields.employee_id),
    employee_email: asString(fields.employee_email),
    role_title: asString(fields.role_title),
    start_date: asString(fields.start_date),
    salary_monthly_cop: asString(fields.salary_monthly_cop),
    jurisdiction_city: asString(fields.jurisdiction_city),
    company_representative: asString(fields.company_representative),
    contract_clause: isFixed ? employmentFixedTerm(termMonths) : employmentIndefinite,
    non_compete_clause: nonCompete,
  };
}

function buildShareholdersValues(fields: FieldValues, locale: DocumentLocale): Record<string, string> {
  if (locale === "en-US") {
    const tagAlong =
      fields.tag_along_enabled === "yes" ? shareholdersTagAlongYesEn : shareholdersTagAlongNoEn;
    const antiDilution =
      fields.anti_dilution === "broad_based"
        ? shareholdersAntiDilutionBroadEn
        : shareholdersAntiDilutionNoneEn;
    const dispute =
      fields.dispute_resolution === "courts"
        ? shareholdersDisputeCourtsEn
        : shareholdersDisputeArbitrationEn;
    return {
      company_name: asString(fields.company_name),
      company_id: asString(fields.company_id),
      lead_investor_name: asString(fields.lead_investor_name),
      lead_investor_id: asString(fields.lead_investor_id),
      effective_date: asString(fields.effective_date),
      drag_along_threshold_pct: asString(fields.drag_along_threshold_pct),
      qualified_majority_pct: asString(fields.qualified_majority_pct),
      jurisdiction_city: asString(fields.jurisdiction_city),
      company_representative: asString(fields.company_representative),
      tag_along_clause: tagAlong,
      anti_dilution_clause: antiDilution,
      dispute_resolution_clause: dispute,
    };
  }
  const tagAlong =
    fields.tag_along_enabled === "yes" ? shareholdersTagAlongYes : shareholdersTagAlongNo;
  const antiDilution =
    fields.anti_dilution === "broad_based"
      ? shareholdersAntiDilutionBroad
      : shareholdersAntiDilutionNone;
  const dispute =
    fields.dispute_resolution === "courts"
      ? shareholdersDisputeCourts
      : shareholdersDisputeArbitration;
  return {
    company_name: asString(fields.company_name),
    company_id: asString(fields.company_id),
    lead_investor_name: asString(fields.lead_investor_name),
    lead_investor_id: asString(fields.lead_investor_id),
    effective_date: asString(fields.effective_date),
    drag_along_threshold_pct: asString(fields.drag_along_threshold_pct),
    qualified_majority_pct: asString(fields.qualified_majority_pct),
    jurisdiction_city: asString(fields.jurisdiction_city),
    company_representative: asString(fields.company_representative),
    tag_along_clause: tagAlong,
    anti_dilution_clause: antiDilution,
    dispute_resolution_clause: dispute,
  };
}

export function renderDocument(
  documentType: InvestmentDocumentType,
  fields: FieldValues,
  locale: DocumentLocale = "es-CO",
): RenderResult {
  const en = locale === "en-US";
  switch (documentType) {
    case "nda":
      return mergeTemplate(
        en ? ndaMasterTemplateEn : ndaMasterTemplate,
        buildNdaValues(fields, locale),
      );
    case "vesting":
      return mergeTemplate(
        en ? vestingMasterTemplateEn : vestingMasterTemplate,
        buildVestingValues(fields, locale),
      );
    case "ip":
      return mergeTemplate(en ? ipMasterTemplateEn : ipMasterTemplate, buildIpValues(fields, locale));
    case "employment":
      return mergeTemplate(
        en ? employmentMasterTemplateEn : employmentMasterTemplate,
        buildEmploymentValues(fields, locale),
      );
    case "shareholders":
      return mergeTemplate(
        en ? shareholdersMasterTemplateEn : shareholdersMasterTemplate,
        buildShareholdersValues(fields, locale),
      );
    default:
      return { body: "", missingFields: ["unsupported_document_type"] };
  }
}

export function wrapPreviewHtml(
  body: string,
  title: string,
  disclaimer: string,
  locale: DocumentLocale = "es-CO",
): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.65; color: #111827; background: #f8fafc; }
    .doc { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,.06); }
    pre { white-space: pre-wrap; word-wrap: break-word; font-size: 0.92rem; font-family: inherit; margin: 0; }
    .disclaimer { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #6b7280; }
  </style>
</head>
<body>
  <div class="doc">
    <pre>${escaped}</pre>
    <p class="disclaimer">${disclaimer}</p>
  </div>
</body>
</html>`;
}
