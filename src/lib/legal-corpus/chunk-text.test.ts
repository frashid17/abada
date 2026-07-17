import { describe, expect, it } from "vitest";
import { chunkLegalText, normalizeLegalWhitespace } from "@/lib/legal-corpus/chunk-text";

describe("chunkLegalText", () => {
  it("splits on Spanish article headings", () => {
    const text = `
ARTÍCULO 1. Objeto. Esta ley regula las sociedades por acciones simplificadas en el territorio nacional colombiano.
ARTÍCULO 2. Ámbito de aplicación. Las disposiciones de esta ley aplican a todas las sociedades constituidas en Colombia.
`;
    const chunks = chunkLegalText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0]?.articleRef).toBe("Art. 1");
    expect(chunks[1]?.articleRef).toBe("Art. 2");
  });

  it("returns a preamble chunk for unstructured text", () => {
    const chunks = chunkLegalText("Texto corto sin artículos numerados pero con suficiente longitud para pasar el filtro mínimo de cuarenta caracteres.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]?.articleRef).toBe("preamble");
  });

  it("normalizes whitespace", () => {
    expect(normalizeLegalWhitespace("a  \n\n\n\nb")).toBe("a\n\nb");
  });
});
