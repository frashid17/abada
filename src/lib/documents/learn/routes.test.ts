import { describe, expect, it } from "vitest";
import {
  templatesPath,
  learnSlugToType,
  learnTypeToSlug,
} from "@/lib/documents/learn/routes";

describe("learn document routes", () => {
  it("maps slugs to document types", () => {
    expect(learnSlugToType("term-sheet")).toBe("term_sheet");
    expect(learnSlugToType("shareholders")).toBe("shareholders");
    expect(learnSlugToType("founders")).toBe("founders");
    expect(learnSlugToType("corporate-client")).toBe("corporate_client");
    expect(learnSlugToType("ip-assignment")).toBe("ip_assignment");
    expect(learnSlugToType("equity-compensation")).toBe("equity_compensation");
    expect(learnSlugToType("invalid")).toBeNull();
  });

  it("builds template paths", () => {
    expect(learnTypeToSlug("term_sheet")).toBe("term-sheet");
    expect(templatesPath("shareholders")).toBe("/fundador/documentos/shareholders");
    expect(templatesPath("employment")).toBe("/fundador/documentos/employment");
    expect(templatesPath("terms_of_use")).toBe("/fundador/documentos/guia/terms-of-use");
    expect(templatesPath("ip_assignment")).toBe("/fundador/documentos/guia/ip-assignment");
    expect(templatesPath("equity_compensation")).toBe(
      "/fundador/documentos/guia/equity-compensation",
    );
  });
});
