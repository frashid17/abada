import { describe, expect, it } from "vitest";
import { buildDdAiSessionContext } from "@/lib/dd/ai-session-context";

describe("buildDdAiSessionContext", () => {
  it("includes deal, documents, and findings without exceeding the chat cap", () => {
    const context = buildDdAiSessionContext({
      dealName: "Acme Round",
      dealStatus: "active",
      documents: [
        { title: "Bylaws", category: "corporate", versionNumber: 1 },
        { title: "Cap table", category: "capitalization", versionNumber: 2 },
      ],
      findings: [
        {
          riskCategory: "corporativo_registral",
          riskLevel: "alto",
          description: "Missing board minutes for 2024.",
          recommendedAction: "Request signed minutes.",
        },
      ],
      assessmentSummary: "Early draft — corporate gaps.",
      assessmentPublished: false,
    });

    expect(context).toContain("Acme Round");
    expect(context).toContain("Bylaws");
    expect(context).toContain("Missing board minutes");
    expect(context.length).toBeLessThanOrEqual(3900);
  });
});
