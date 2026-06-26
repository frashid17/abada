import { describe, expect, it } from "vitest";
import { renderDocument } from "@/lib/documents/render";

describe("renderDocument", () => {
  it("renders NDA with mutual obligations", () => {
    const result = renderDocument("nda", {
      company_name: "Acme S.A.S.",
      company_id: "900111222-3",
      counterparty_name: "Fondo Alpha",
      counterparty_id: "800999888-7",
      purpose: "Evaluación de inversión semilla",
      term_years: 2,
      jurisdiction_city: "Bogotá D.C.",
      agreement_mode: "mutual",
    });

    expect(result.missingFields).toHaveLength(0);
    expect(result.body).toContain("Acme S.A.S.");
    expect(result.body).toContain("MUTUO");
    expect(result.body).toContain("Cada Parte se compromete");
  });

  it("renders NDA in English when locale is en-US", () => {
    const result = renderDocument(
      "nda",
      {
        company_name: "Acme S.A.S.",
        company_id: "900111222-3",
        counterparty_name: "Alpha Fund",
        counterparty_id: "800999888-7",
        purpose: "Seed round evaluation",
        term_years: 2,
        jurisdiction_city: "Bogotá D.C.",
        agreement_mode: "mutual",
      },
      "en-US",
    );

    expect(result.missingFields).toHaveLength(0);
    expect(result.body).toContain("NON-DISCLOSURE AGREEMENT");
    expect(result.body).toContain("Each Party agrees");
    expect(result.body).not.toContain("ACUERDO DE CONFIDENCIALIDAD");
  });

  it("renders vesting with acceleration clause", () => {
    const result = renderDocument("vesting", {
      company_name: "Acme S.A.S.",
      company_id: "900111222-3",
      founder_name: "María López",
      founder_id: "1010101010",
      founder_email: "maria@acme.com",
      shares_total: 50000,
      vesting_months: 48,
      cliff_months: 12,
      vesting_start_date: "2026-01-01",
      acceleration_type: "double_trigger",
      departure_treatment: "partial",
      company_representative: "Carlos Ruiz",
      company_representative_title: "CEO",
    });

    expect(result.missingFields).toHaveLength(0);
    expect(result.body).toContain("María López");
    expect(result.body).toContain("doble evento");
  });

  it("renders IP assignment with full scope", () => {
    const result = renderDocument("ip", {
      company_name: "Acme S.A.S.",
      company_id: "900111222-3",
      assignor_name: "Juan Pérez",
      assignor_id: "1010101010",
      assignor_email: "juan@acme.com",
      ip_description: "Código fuente de la plataforma",
      assignment_scope: "all_current_future",
      consideration: "Participación accionaria",
      effective_date: "2026-01-01",
      jurisdiction_city: "Bogotá D.C.",
    });

    expect(result.missingFields).toHaveLength(0);
    expect(result.body).toContain("Juan Pérez");
    expect(result.body).toContain("actuales y futuras");
  });

  it("renders employment with indefinite contract", () => {
    const result = renderDocument("employment", {
      company_name: "Acme S.A.S.",
      company_id: "900111222-3",
      employee_name: "Ana Gómez",
      employee_id: "2020202020",
      employee_email: "ana@acme.com",
      role_title: "CTO",
      start_date: "2026-02-01",
      salary_monthly_cop: 8000000,
      contract_type: "indefinite",
      non_compete: "none",
      jurisdiction_city: "Bogotá D.C.",
      company_representative: "Carlos Ruiz",
    });

    expect(result.missingFields).toHaveLength(0);
    expect(result.body).toContain("Ana Gómez");
    expect(result.body).toContain("término indefinido");
  });

  it("renders shareholders with drag-along and anti-dilution", () => {
    const result = renderDocument("shareholders", {
      company_name: "Acme S.A.S.",
      company_id: "900111222-3",
      lead_investor_name: "Fondo Alpha",
      lead_investor_id: "800999888-7",
      effective_date: "2026-03-01",
      drag_along_threshold_pct: 75,
      tag_along_enabled: "yes",
      anti_dilution: "broad_based",
      qualified_majority_pct: 66,
      dispute_resolution: "arbitration",
      jurisdiction_city: "Bogotá D.C.",
      company_representative: "Carlos Ruiz",
    });

    expect(result.missingFields).toHaveLength(0);
    expect(result.body).toContain("Fondo Alpha");
    expect(result.body).toContain("DRAG-ALONG");
    expect(result.body).toContain("broad-based");
  });
});
