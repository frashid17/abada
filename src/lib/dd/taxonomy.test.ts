import { describe, expect, it } from "vitest";
import {
  DD_DOCUMENT_CATEGORIES,
  DD_RISK_CATEGORIES,
  DD_RISK_LEVELS,
  isDdDocumentCategory,
  isDdRiskCategory,
  isDdRiskLevel,
} from "@/lib/dd/taxonomy";

describe("DD taxonomy", () => {
  it("defines nine document categories", () => {
    expect(DD_DOCUMENT_CATEGORIES).toHaveLength(9);
    expect(isDdDocumentCategory("corporate")).toBe(true);
    expect(isDdDocumentCategory("unknown")).toBe(false);
  });

  it("defines eight Colombian risk categories", () => {
    expect(DD_RISK_CATEGORIES).toHaveLength(8);
    expect(isDdRiskCategory("tributario")).toBe(true);
    expect(isDdRiskCategory("other")).toBe(false);
  });

  it("defines three risk levels", () => {
    expect(DD_RISK_LEVELS).toEqual(["bajo", "medio", "alto"]);
    expect(isDdRiskLevel("alto")).toBe(true);
    expect(isDdRiskLevel("critico")).toBe(false);
  });
});
