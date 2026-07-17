import { describe, expect, it } from "vitest";
import { isLegalSourceId, legalSourcePath, LEGAL_LIBRARY_BASE_PATH } from "@/lib/legal-corpus/routes";

describe("legal corpus routes", () => {
  it("recognizes ingested source ids", () => {
    expect(isLegalSourceId("ley-1258-2008")).toBe(true);
    expect(isLegalSourceId("not-a-law")).toBe(false);
  });

  it("builds founder library paths", () => {
    expect(LEGAL_LIBRARY_BASE_PATH).toBe("/fundador/leyes");
    expect(legalSourcePath("ley-1258-2008")).toBe("/fundador/leyes/ley-1258-2008");
  });
});
