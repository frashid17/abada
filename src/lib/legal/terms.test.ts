import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { CURRENT_TERMS_VERSION, getTermsHtml } from "@/lib/legal/terms";

describe("platform terms content", () => {
  it("exposes a dated version string", () => {
    expect(CURRENT_TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ships bilingual HTML bodies", () => {
    for (const locale of ["es-CO", "en-US"] as const) {
      const html = getTermsHtml(locale);
      expect(html.length).toBeGreaterThan(1000);
      expect(html).toMatch(/Abada/i);
      expect(html.toLowerCase()).toMatch(/balam/);
    }
  });

  it("keeps content files on disk", () => {
    const dir = path.join(process.cwd(), "content/legal");
    expect(existsSync(path.join(dir, "terms-es-CO.html"))).toBe(true);
    expect(existsSync(path.join(dir, "terms-en-US.html"))).toBe(true);
    const es = readFileSync(path.join(dir, "terms-es-CO.html"), "utf8");
    expect(es).toContain("Ley 1581");
  });
});
