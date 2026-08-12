import type { AssessmentRecord } from "@/lib/dd/assessments";
import type { FindingRecord } from "@/lib/dd/findings";
import type { DocumentLocale } from "@/lib/documents/document-locale";

export type DdReportInput = {
  companyName: string;
  preparedFor?: string;
  transaction?: string;
  assessment: AssessmentRecord | null;
  findings: FindingRecord[];
  locale?: DocumentLocale | "bilingual";
};

const RISK_LABEL: Record<string, { es: string; en: string }> = {
  bajo: { es: "Bajo", en: "Low" },
  medio: { es: "Medio", en: "Medium" },
  alto: { es: "Alto", en: "High" },
  info_requerida: { es: "Información requerida", en: "Information required" },
};

function riskLabel(level: string, lang: "es" | "en"): string {
  return RISK_LABEL[level]?.[lang] ?? level;
}

function sectionPair(esTitle: string, enTitle: string, esBody: string, enBody: string): string {
  return [
    `${esTitle} / ${enTitle}`,
    "",
    "Español",
    esBody.trim(),
    "",
    "English",
    enBody.trim(),
    "",
  ].join("\n");
}

/**
 * Render a bilingual DD findings report skeleton from live deal data.
 * Sample findings in the firm DOCX are not copied — only structure + live rows.
 */
export function renderDdReport(input: DdReportInput): string {
  const company = input.companyName || "[NOMBRE DE LA SOCIEDAD]";
  const preparedFor = input.preparedFor || "[INVERSIONISTA / JUNTA / FUNDADORES]";
  const transaction = input.transaction || "[INVERSIÓN / ADQUISICIÓN / OTRA]";
  const date = new Date().toISOString().slice(0, 10);
  const summary =
    input.assessment?.summary?.trim() ||
    "TODO(legal): completar resumen ejecutivo tras revisión de la firma.";

  const findingsEs =
    input.findings.length === 0
      ? "Sin hallazgos registrados aún."
      : input.findings
          .map((f, i) => {
            const action = f.recommendedAction ? `\n   Acción: ${f.recommendedAction}` : "";
            const cite = f.legalCitation ? `\n   Cita: ${f.legalCitation}` : "";
            return `${i + 1}. [${riskLabel(f.riskLevel, "es")}] ${f.riskCategory}\n   ${f.description}${action}${cite}`;
          })
          .join("\n\n");

  const findingsEn =
    input.findings.length === 0
      ? "No findings recorded yet."
      : input.findings
          .map((f, i) => {
            const action = f.recommendedAction ? `\n   Action: ${f.recommendedAction}` : "";
            const cite = f.legalCitation ? `\n   Citation: ${f.legalCitation}` : "";
            return `${i + 1}. [${riskLabel(f.riskLevel, "en")}] ${f.riskCategory}\n   ${f.description}${action}${cite}`;
          })
          .join("\n\n");

  const matrixEs =
    input.findings.length === 0
      ? "Sin filas de remediación."
      : [
          "Hallazgo | Nivel | Acción recomendada",
          ...input.findings.map(
            (f) =>
              `${f.description.slice(0, 80).replace(/\n/g, " ")} | ${riskLabel(f.riskLevel, "es")} | ${f.recommendedAction ?? "—"}`,
          ),
        ].join("\n");

  const matrixEn =
    input.findings.length === 0
      ? "No remediation rows."
      : [
          "Finding | Level | Recommended action",
          ...input.findings.map(
            (f) =>
              `${f.description.slice(0, 80).replace(/\n/g, " ")} | ${riskLabel(f.riskLevel, "en")} | ${f.recommendedAction ?? "—"}`,
          ),
        ].join("\n");

  const header = [
    "REPORTE BILINGÜE DE HALLAZGOS DE DEBIDA DILIGENCIA",
    "BILINGUAL DUE DILIGENCE FINDINGS REPORT",
    "",
    `Sociedad / Company: ${company} S.A.S.`,
    `Fecha / Date: ${date}`,
    `Preparado para / Prepared for: ${preparedFor}`,
    `Transacción / Transaction: ${transaction}`,
    "",
    "Aviso / Disclaimer: Este reporte no constituye una opinión legal definitiva y no sustituye la revisión de un abogado nombrado de la firma. This report is not a definitive legal opinion and does not replace review by a named firm attorney.",
    "",
  ].join("\n");

  const scope = sectionPair(
    "1. Alcance, Base de Revisión y Limitaciones",
    "1. Scope, Review Basis, and Limitations",
    "Este reporte resume hallazgos identificados con base en el Requerimiento de Información (RDI) y los documentos cargados en la sala de datos. Los hallazgos se presentan como riesgos documentales, corporativos, contractuales, laborales, tecnológicos y comerciales.",
    "This report summarizes findings identified based on the Information Request (RFI) and documents uploaded to the data room. Findings are presented as documentary, corporate, contractual, employment, technology, and commercial risks.",
  );

  const exec = sectionPair(
    "2. Resumen Ejecutivo",
    "2. Executive Summary",
    summary,
    summary,
  );

  const byDoc = sectionPair(
    "3. Hallazgos por Documento / Categoría",
    "3. Findings by Document / Category",
    findingsEs,
    findingsEn,
  );

  const matrix = sectionPair(
    "4. Matriz Consolidada de Remediación",
    "4. Consolidated Remediation Matrix",
    matrixEs,
    matrixEn,
  );

  const conditions = sectionPair(
    "5. Condiciones Recomendadas",
    "5. Recommended Conditions",
    "Completar remediaciones de nivel Alto antes del cierre. Documentar evidencia operativa de vesting, cadena de PI y aprobaciones societarias. Obtener información faltante marcada como Información requerida.",
    "Complete High-level remediations before closing. Document operative evidence of vesting, IP chain of title, and corporate approvals. Obtain missing information tagged as Information required.",
  );

  const conclusion = sectionPair(
    "6. Conclusión",
    "6. Conclusion",
    "La evaluación permanece sujeta a la publicación formal de la firma y a la revisión de un abogado nombrado. Los hallazgos pueden actualizarse si llega documentación adicional a la sala.",
    "The assessment remains subject to formal firm publication and review by a named attorney. Findings may be updated if additional documentation arrives in the room.",
  );

  return [header, scope, exec, byDoc, matrix, conditions, conclusion].join("\n");
}

export function buildAssessmentDraftFromFindings(findings: FindingRecord[], locale: "es" | "en" = "es"): string {
  if (findings.length === 0) {
    return locale === "es"
      ? "Sin hallazgos registrados. Completar revisión según el playbook de DD."
      : "No findings recorded. Complete review per the DD playbook.";
  }

  const alto = findings.filter((f) => f.riskLevel === "alto").length;
  const medio = findings.filter((f) => f.riskLevel === "medio").length;
  const bajo = findings.filter((f) => f.riskLevel === "bajo").length;
  const info = findings.filter((f) => f.riskLevel === "info_requerida").length;

  if (locale === "en") {
    return [
      `Executive summary draft from ${findings.length} finding(s).`,
      `Risk mix — High: ${alto}, Medium: ${medio}, Low: ${bajo}, Information required: ${info}.`,
      "",
      ...findings.slice(0, 8).map((f, i) => `${i + 1}. [${riskLabel(f.riskLevel, "en")}] ${f.description}`),
      findings.length > 8 ? `…and ${findings.length - 8} more.` : "",
      "",
      "TODO(legal): firm attorney to refine before publish.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Borrador de resumen ejecutivo a partir de ${findings.length} hallazgo(s).`,
    `Mezcla de riesgo — Alto: ${alto}, Medio: ${medio}, Bajo: ${bajo}, Información requerida: ${info}.`,
    "",
    ...findings.slice(0, 8).map((f, i) => `${i + 1}. [${riskLabel(f.riskLevel, "es")}] ${f.description}`),
    findings.length > 8 ? `…y ${findings.length - 8} más.` : "",
    "",
    "TODO(legal): el abogado nombrado de la firma debe refinar antes de publicar.",
  ]
    .filter(Boolean)
    .join("\n");
}
