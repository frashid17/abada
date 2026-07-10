import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { DocumentLocale } from "@/lib/documents/document-locale";

export type LegalSourceType =
  | "constitution"
  | "code"
  | "statute"
  | "decree"
  | "circular"
  | "decision";

export type TranslationStatus = "official" | "pending" | "reviewed";

export type LegalSourceManifestEntry = {
  id: string;
  corpusId: string | null;
  sourceType: LegalSourceType;
  pdfFilename: string;
  citation: { es: string; en: string };
  title: { es: string; en: string };
  description: { es: string; en: string };
};

export type LegalSourceManifest = {
  version: string;
  jurisdiction: string;
  officialLocale: DocumentLocale;
  sources: LegalSourceManifestEntry[];
};

export type LegalSourceChunk = {
  sourceId: string;
  locale: DocumentLocale;
  chunkIndex: number;
  articleRef: string;
  heading: string;
  content: string;
  translationStatus: TranslationStatus;
  officialLocale?: DocumentLocale;
  translationNote?: string;
};

export type LegalSourceChunkFile = {
  sourceId: string;
  locale: DocumentLocale;
  extractedAt: string;
  chunkCount: number;
  chunks: LegalSourceChunk[];
};

const DATA_ROOT = path.join(process.cwd(), "data", "legal-sources");

export function loadLegalSourceManifest(): LegalSourceManifest {
  const raw = readFileSync(path.join(DATA_ROOT, "manifest.json"), "utf8");
  return JSON.parse(raw) as LegalSourceManifest;
}

export function getLegalSourceFromManifest(sourceId: string): LegalSourceManifestEntry | null {
  const manifest = loadLegalSourceManifest();
  return manifest.sources.find((s) => s.id === sourceId) ?? null;
}

export function listLegalSources(): LegalSourceManifestEntry[] {
  return loadLegalSourceManifest().sources;
}

export function loadLegalSourceChunks(
  sourceId: string,
  locale: DocumentLocale,
): LegalSourceChunkFile | null {
  const filePath = path.join(DATA_ROOT, "chunks", sourceId, `${locale}.json`);
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, "utf8");
  return JSON.parse(raw) as LegalSourceChunkFile;
}

export type LegalCorpusSearchHit = {
  sourceId: string;
  locale: DocumentLocale;
  articleRef: string;
  heading: string;
  content: string;
  citation: string;
  title: string;
  translationStatus: TranslationStatus;
  score: number;
};

function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

/**
 * File-based corpus search for dev / pre-DB-ingest. Uses simple term overlap scoring.
 */
export function searchLegalCorpusLocal(
  query: string,
  locale: DocumentLocale,
  limit = 12,
): LegalCorpusSearchHit[] {
  const manifest = loadLegalSourceManifest();
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return [];

  const hits: LegalCorpusSearchHit[] = [];

  for (const source of manifest.sources) {
    const chunkFile = loadLegalSourceChunks(source.id, locale);
    if (!chunkFile) continue;

    const citation = locale === "en-US" ? source.citation.en : source.citation.es;
    const title = locale === "en-US" ? source.title.en : source.title.es;

    for (const chunk of chunkFile.chunks) {
      const haystack = `${chunk.articleRef} ${chunk.heading} ${chunk.content}`.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        if (haystack.includes(token)) score += 1;
      }
      if (score === 0) continue;

      hits.push({
        sourceId: source.id,
        locale,
        articleRef: chunk.articleRef,
        heading: chunk.heading,
        content: chunk.content,
        citation,
        title,
        translationStatus: chunk.translationStatus,
        score,
      });
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function formatLegalCorpusContext(
  hits: LegalCorpusSearchHit[],
  locale: DocumentLocale,
): string {
  if (hits.length === 0) {
    return "No matching legal corpus entries. Mark gaps as TODO(legal).";
  }

  return hits
    .map((hit, i) => {
      const pending =
        hit.translationStatus === "pending" && locale === "en-US"
          ? " [English translation pending legal review — authoritative text in Spanish]"
          : "";
      return `[${i + 1}] ${hit.citation} · ${hit.articleRef}${pending}\n${hit.heading}\n${hit.content.slice(0, 1000)}`;
    })
    .join("\n\n---\n\n");
}

export function summarizeLegalCorpusInventory(): string {
  const manifest = loadLegalSourceManifest();
  const lines = manifest.sources.map((s) => {
    const esChunks = loadLegalSourceChunks(s.id, "es-CO");
    const count = esChunks?.chunkCount ?? 0;
    return `- ${s.citation.es} (${s.id}): ${count} chunks`;
  });
  return `Colombian legal corpus (${manifest.sources.length} sources):\n${lines.join("\n")}`;
}
