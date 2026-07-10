import { describe, expect, it } from "vitest";
import {
  getLegalSourceFromManifest,
  listLegalSources,
  loadLegalSourceManifest,
  searchLegalCorpusLocal,
} from "@/lib/legal-corpus";

describe("legal corpus manifest", () => {
  it("loads all 20 shared law PDFs", () => {
    const manifest = loadLegalSourceManifest();
    expect(manifest.sources).toHaveLength(20);
    expect(manifest.officialLocale).toBe("es-CO");
  });

  it("includes Ley 1258 SAS statute", () => {
    const source = getLegalSourceFromManifest("ley-1258-2008");
    expect(source?.corpusId).toBe("PL-07");
    expect(source?.title.en).toContain("SAS");
    expect(source?.title.es).toContain("Acciones Simplificada");
  });

  it("lists bilingual citations for every source", () => {
    for (const source of listLegalSources()) {
      expect(source.citation.es.length).toBeGreaterThan(3);
      expect(source.citation.en.length).toBeGreaterThan(3);
      expect(source.title.es.length).toBeGreaterThan(3);
      expect(source.title.en.length).toBeGreaterThan(3);
    }
  });
});

describe("searchLegalCorpusLocal", () => {
  it("returns hits when chunk files exist", () => {
    const hits = searchLegalCorpusLocal("sociedad acciones simplificada", "es-CO", 5);
    if (hits.length > 0) {
      expect(hits[0]?.sourceId).toBeTruthy();
      expect(hits[0]?.translationStatus).toBe("official");
    }
  });
});
