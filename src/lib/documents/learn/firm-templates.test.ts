import { describe, expect, it } from "vitest";
import {
  getEmploymentLearnDocumentSample,
  getFoundersLearnDocument,
} from "@/lib/documents/learn/get-learn-document";
import { parseDocumentClauses } from "@/lib/documents/learn/parse-clauses";
import { renderLearnDocument } from "@/lib/documents/learn/render-learn-document";
import { learnSlugToType, LEARN_DOCUMENT_TYPES } from "@/lib/documents/learn/routes";

describe("firm learn templates", () => {
  it("registers new slugs", () => {
    expect(learnSlugToType("founders")).toBe("founders");
    expect(learnSlugToType("employment")).toBe("employment");
    expect(learnSlugToType("corporate-client")).toBe("corporate_client");
    expect(learnSlugToType("terms-of-use")).toBe("terms_of_use");
    expect(LEARN_DOCUMENT_TYPES).toContain("founders");
  });

  it.each([
    ["founders", "1", "Antecedentes"],
    ["employment", "1", "Cargo"],
    ["corporate_client", "1", "Objeto"],
    ["terms_of_use", "1", "Definiciones"],
  ] as const)("parses %s into numbered clauses", (type, clauseId, headingPart) => {
    const rendered = renderLearnDocument(type, {}, "es-CO");
    const clauses = parseDocumentClauses(rendered.body);
    expect(clauses.some((clause) => clause.id === "preamble")).toBe(true);
    const section = clauses.find((clause) => clause.id === clauseId);
    expect(section?.heading ?? "").toContain(headingPart);
    expect(clauses.length).toBeGreaterThan(5);
  });

  it("builds learn payloads for firm docs", () => {
    const founders = getFoundersLearnDocument("es-CO");
    expect(founders.hasDraftFlow).toBe(false);
    expect(founders.clauses.length).toBeGreaterThan(10);

    const employment = getEmploymentLearnDocumentSample("es-CO");
    expect(employment.hasDraftFlow).toBe(true);
    expect(employment.clauses.some((clause) => clause.id === "9")).toBe(true);
  });

  it("maps highlight callout clause ids to real sections", () => {
    const callouts = {
      founders: ["5", "6", "13"],
      employment: ["8", "9", "14"],
      corporate_client: ["6", "8", "11"],
      terms_of_use: ["2", "5", "11"],
    } as const;

    for (const [type, ids] of Object.entries(callouts)) {
      const clauses = parseDocumentClauses(
        renderLearnDocument(type as keyof typeof callouts, {}, "es-CO").body,
      );
      for (const id of ids) {
        expect(clauses.some((clause) => clause.id === id), `${type} clause ${id}`).toBe(true);
      }
    }
  });
});
