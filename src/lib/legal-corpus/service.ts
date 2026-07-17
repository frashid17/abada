import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { getLocale } from "next-intl/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { DocumentLocale } from "@/lib/documents/document-locale";
import { parseDocumentLocale } from "@/lib/documents/document-locale";
import {
  listLegalSources,
  getLegalSourceFromManifest,
  loadLegalSourceChunks,
  type LegalSourceType,
  type LegalSourceChunk,
  type TranslationStatus,
} from "@/lib/legal-corpus";

const DATA_ROOT = path.join(process.cwd(), "data", "legal-sources");

export type LegalSourceSummary = {
  id: string;
  sourceType: LegalSourceType;
  citation: string;
  title: string;
  description: string;
  chunkCount: number;
};

export type LegalSourceDetail = LegalSourceSummary & {
  locale: DocumentLocale;
  officialLocale: DocumentLocale;
  chunks: LegalSourceChunk[];
};

function localizeSource(
  source: NonNullable<ReturnType<typeof getLegalSourceFromManifest>>,
  locale: DocumentLocale,
  chunkCount: number,
): LegalSourceSummary {
  return {
    id: source.id,
    sourceType: source.sourceType,
    citation: locale === "en-US" ? source.citation.en : source.citation.es,
    title: locale === "en-US" ? source.title.en : source.title.es,
    description: locale === "en-US" ? source.description.en : source.description.es,
    chunkCount,
  };
}

function chunkCountFromIndex(sourceId: string): number {
  const indexPath = path.join(DATA_ROOT, "index.json");
  if (!existsSync(indexPath)) return 0;
  const index = JSON.parse(readFileSync(indexPath, "utf8")) as {
    sources: Array<{ sourceId: string; chunkCount: number }>;
  };
  return index.sources.find((s) => s.sourceId === sourceId)?.chunkCount ?? 0;
}

async function chunkCountFromDb(sourceId: string, locale: DocumentLocale): Promise<number | null> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { count, error } = await supabase
      .from("legal_source_chunks")
      .select("id", { count: "exact", head: true })
      .eq("source_id", sourceId)
      .eq("locale", locale);

    // Empty tables (migration applied, corpus not loaded) must fall through to local files.
    if (error || count === null || count === 0) return null;
    return count;
  } catch {
    return null;
  }
}

async function listFromDb(locale: DocumentLocale): Promise<LegalSourceSummary[] | null> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("legal_sources")
      .select(
        "id, source_type, citation_es, citation_en, title_es, title_en, description_es, description_en, chunk_count, founder_visible",
      )
      .eq("founder_visible", true)
      .order("citation_es");

    if (error || !data?.length) return null;

    return data.map((row) => ({
      id: row.id,
      sourceType: row.source_type as LegalSourceType,
      citation: locale === "en-US" ? row.citation_en : row.citation_es,
      title: locale === "en-US" ? row.title_en : row.title_es,
      description:
        locale === "en-US" ? (row.description_en ?? "") : (row.description_es ?? ""),
      chunkCount: row.chunk_count,
    }));
  } catch {
    return null;
  }
}

export async function listLegalSourcesForLocale(
  locale?: DocumentLocale,
): Promise<LegalSourceSummary[]> {
  const resolvedLocale = locale ?? parseDocumentLocale(await getLocale());

  const fromDb = await listFromDb(resolvedLocale);
  if (fromDb?.length) return fromDb;

  return listLegalSources().map((source) => {
    const chunks = loadLegalSourceChunks(source.id, resolvedLocale);
    return localizeSource(source, resolvedLocale, chunks?.chunkCount ?? 0);
  });
}

export async function getLegalSourceMetadata(
  sourceId: string,
  locale?: DocumentLocale,
): Promise<LegalSourceSummary | null> {
  const resolvedLocale = locale ?? parseDocumentLocale(await getLocale());
  const manifestEntry = getLegalSourceFromManifest(sourceId);
  if (!manifestEntry) return null;

  const dbCount = await chunkCountFromDb(sourceId, resolvedLocale);
  const indexCount = chunkCountFromIndex(sourceId);
  const fileCount = loadLegalSourceChunks(sourceId, resolvedLocale)?.chunkCount ?? 0;
  const chunkCount = dbCount ?? (indexCount > 0 ? indexCount : fileCount);

  if (chunkCount === 0) return null;

  return localizeSource(manifestEntry, resolvedLocale, chunkCount);
}

export async function getLegalSourceDetail(
  sourceId: string,
  locale?: DocumentLocale,
): Promise<LegalSourceDetail | null> {
  const resolvedLocale = locale ?? parseDocumentLocale(await getLocale());
  const manifestEntry = getLegalSourceFromManifest(sourceId);
  if (!manifestEntry) return null;

  const dbCount = await chunkCountFromDb(sourceId, resolvedLocale);
  const fileChunks = loadLegalSourceChunks(sourceId, resolvedLocale);

  let chunks: LegalSourceChunk[] = fileChunks?.chunks ?? [];

  if (chunks.length === 0) {
    try {
      const supabase = createServiceRoleSupabaseClient();
      const { data, error } = await supabase
        .from("legal_source_chunks")
        .select("source_id, locale, chunk_index, article_ref, heading, content, translation_status")
        .eq("source_id", sourceId)
        .eq("locale", resolvedLocale)
        .order("chunk_index");

      if (!error && data?.length) {
        chunks = data.map((row) => ({
          sourceId: row.source_id,
          locale: row.locale as DocumentLocale,
          chunkIndex: row.chunk_index,
          articleRef: row.article_ref,
          heading: row.heading,
          content: row.content,
          translationStatus: row.translation_status as TranslationStatus,
        }));
      }
    } catch {
      // fall through
    }
  }

  const chunkCount =
    dbCount ??
    fileChunks?.chunkCount ??
    (chunks.length > 0 ? chunks.length : chunkCountFromIndex(sourceId));
  if (chunkCount === 0 && chunks.length === 0) return null;

  return {
    ...localizeSource(manifestEntry, resolvedLocale, chunkCount),
    locale: resolvedLocale,
    officialLocale: "es-CO",
    chunks,
  };
}

export function filterLegalChunks(
  chunks: LegalSourceChunk[],
  query: string,
): LegalSourceChunk[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

  if (tokens.length === 0) return chunks;

  return chunks.filter((chunk) => {
    const haystack = `${chunk.articleRef} ${chunk.heading} ${chunk.content}`.toLowerCase();
    return tokens.some((token) => haystack.includes(token));
  });
}
