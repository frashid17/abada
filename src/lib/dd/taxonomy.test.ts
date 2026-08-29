import { describe, expect, it } from "vitest";
import {
  DD_DOCUMENT_CATEGORIES,
  DD_RISK_CATEGORIES,
  DD_RISK_LEVELS,
  isDdDocumentCategory,
  isDdRiskCategory,
  isDdRiskLevel,
  normalizeDdDocumentCategory,
} from "@/lib/dd/taxonomy";
import { buildAssessmentDraftFromFindings, renderDdReport } from "@/lib/dd/report";
import type { FindingRecord } from "@/lib/dd/findings";

describe("DD taxonomy", () => {
  it("defines RDI-aligned document categories", () => {
    expect(DD_DOCUMENT_CATEGORIES).toHaveLength(10);
    expect(isDdDocumentCategory("corporate_governance")).toBe(true);
    expect(isDdDocumentCategory("corporate")).toBe(true);
    expect(normalizeDdDocumentCategory("ip")).toBe("ip_technology");
    expect(isDdDocumentCategory("unknown")).toBe(false);
  });

  it("defines eight Colombian risk categories", () => {
    expect(DD_RISK_CATEGORIES).toHaveLength(8);
    expect(isDdRiskCategory("tributario")).toBe(true);
    expect(isDdRiskCategory("other")).toBe(false);
  });

  it("defines playbook risk levels including information required", () => {
    expect(DD_RISK_LEVELS).toEqual(["bajo", "medio", "alto", "info_requerida"]);
    expect(isDdRiskLevel("info_requerida")).toBe(true);
    expect(isDdRiskLevel("critico")).toBe(false);
  });
});

describe("DD report", () => {
  const sampleFindings: FindingRecord[] = [
    {
      id: "1",
      dealId: "d1",
      tenantId: "t1",
      riskCategory: "propiedad_intelectual",
      riskLevel: "alto",
      sourceDocumentId: null,
      sourcePage: null,
      description: "Falta cesión de PI de un contratista clave.",
      recommendedAction: "Obtener acuerdo de cesión firmado.",
      legalCitation: null,
      status: "active",
      sourceQuestionId: null,
      questionnaireId: null,
      createdAt: new Date().toISOString(),
    },
  ];

  it("renders bilingual report skeleton from findings", () => {
    const body = renderDdReport({
      companyName: "Acme",
      assessment: null,
      findings: sampleFindings,
    });
    expect(body).toContain("REPORTE BILINGÜE");
    expect(body).toContain("BILINGUAL DUE DILIGENCE");
    expect(body).toContain("Falta cesión de PI");
    expect(body).toContain("Matriz Consolidada de Remediación");
  });

  it("drafts an executive summary from findings", () => {
    const draft = buildAssessmentDraftFromFindings(sampleFindings, "es");
    expect(draft).toContain("Alto: 1");
    expect(draft).toContain("Falta cesión de PI");
  });
});
