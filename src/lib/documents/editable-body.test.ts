import { describe, expect, it } from "vitest";
import { buildEditableDocumentBody } from "@/lib/documents/editable-body";
import { extractFieldKeysFromEditableBody, fieldMarker } from "@/lib/documents/render";

describe("editable document body", () => {
  it("marks intake fields and expands clause fragments for shareholders", async () => {
    const body = await buildEditableDocumentBody(
      "shareholders",
      {
        company_name: "Acme SAS",
        tag_along_enabled: "yes",
        anti_dilution: "broad_based",
        dispute_resolution: "arbitration",
        drag_along_threshold_pct: 75,
        qualified_majority_pct: 66,
      },
      "es-CO",
    );

    expect(body).not.toBeNull();
    expect(body!.bodyFieldKeys).toContain("company_name");
    expect(body!.bodyFieldKeys).not.toContain("tag_along_enabled");
    expect(body!.structureFields.some((f) => f.key === "tag_along_enabled")).toBe(true);

    const joined = body!.clauses.map((c) => `${c.heading ?? ""}\n${c.body}`).join("\n");
    expect(joined).toContain(fieldMarker("company_name"));
    expect(joined).not.toContain("{{tag_along_clause}}");
    expect(extractFieldKeysFromEditableBody(joined)).toContain("company_name");
  });
});
