import { describe, expect, it } from "vitest";
import { buildReviewDraftPdf } from "@/lib/documents/prototype/review-pdf";

describe("buildReviewDraftPdf", () => {
  it("generates a valid PDF buffer", async () => {
    const pdf = await buildReviewDraftPdf({
      locale: "es-CO",
      brandName: "Abada",
      firmName: "Balam Legal",
      company: {
        nombre: "Acme Colombia",
        nit: "900.482.117-3",
        domicilio: "Bogotá",
        ciudad: "Bogotá D.C.",
        negocio: "pagos",
        fecha: "2026-09-01",
        repLegal: "Mariana Restrepo",
        repCargo: "Gerente general",
      },
      decisions: {},
    });

    expect(pdf.byteLength).toBeGreaterThan(800);
    expect(Buffer.from(pdf).subarray(0, 4).toString()).toBe("%PDF");
  });
});
