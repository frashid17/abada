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
    expect(learnSlugToType("invalid")).toBeNull();
  });

  it("builds template paths", () => {
    expect(learnTypeToSlug("term_sheet")).toBe("term-sheet");
    expect(templatesPath("shareholders")).toBe("/fundador/plantillas/shareholders");
    expect(templatesPath("terms_of_use")).toBe("/fundador/plantillas/terms-of-use");
  });
});