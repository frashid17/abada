import { describe, expect, it } from "vitest";
import { stripExecutionBlock } from "@/lib/documents/document-locale";

describe("stripExecutionBlock", () => {
  it("removes Spanish execution block", () => {
    const body = "Cláusula final.\n\nEn constancia, se firma...\n\n____\nFirma";
    expect(stripExecutionBlock(body, "es-CO")).toBe("Cláusula final.");
  });

  it("removes English signatures section", () => {
    const body = "Final clause.\n\n9. SIGNATURES\n\nIN WITNESS WHEREOF...";
    expect(stripExecutionBlock(body, "en-US")).toBe("Final clause.");
  });
});
