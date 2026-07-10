import { describe, expect, it } from "vitest";
import { getTermSheetLearnDocument } from "@/lib/documents/learn/get-learn-document";
import { parseDocumentClauses } from "@/lib/documents/learn/parse-clauses";
import { renderLearnDocument } from "@/lib/documents/learn/render-learn-document";

describe("term sheet learn document", () => {
  it("renders numbered clauses in Spanish and English", () => {
    const es = renderLearnDocument("term_sheet", { company_name: "Acme" }, "es-CO");
    const en = renderLearnDocument("term_sheet", { company_name: "Acme" }, "en-US");

    const esClauses = parseDocumentClauses(es.body);
    const enClauses = parseDocumentClauses(en.body);

    expect(esClauses.some((clause) => clause.id === "preamble")).toBe(true);
    expect(esClauses.some((clause) => clause.id === "15")).toBe(true);
    expect(enClauses.some((clause) => clause.id === "1")).toBe(true);
    expect(es.body).toContain("HOJA DE TÉRMINOS");
    expect(en.body).toContain("TERM SHEET");
  });

  it("builds a learn payload with clause commentary keys", () => {
    const payload = getTermSheetLearnDocument("es-CO");
    expect(payload.documentType).toBe("term_sheet");
    expect(payload.hasDraftFlow).toBe(false);
    expect(payload.clauses.length).toBeGreaterThan(10);
  });
});
