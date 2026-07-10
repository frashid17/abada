import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { parseDocumentLocale, type DocumentLocale } from "@/lib/documents/document-locale";
import {
  formatLegalCorpusContext,
  searchLegalCorpusLocal,
  type LegalCorpusSearchHit,
} from "@/lib/legal-corpus";

export type KnowledgeSearchResult = {
  id: string;
  topicKey: string;
  title: string;
  content: string;
  rank: number;
};

/**
 * Tenant-scoped full-text search over firm_knowledge.
 * Vector similarity can be added when embeddings are populated (M1+).
 */
export async function searchFirmKnowledge(
  tenantId: string,
  query: string,
  limit = 8,
): Promise<KnowledgeSearchResult[]> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase.rpc("search_firm_knowledge", {
    p_tenant_id: tenantId,
    p_query: query,
    p_limit: limit,
  });

  if (error) throw error;

  return (data ?? []).map(
    (row: {
      id: string;
      topic_key: string;
      title: string;
      content: string;
      rank: number;
    }) => ({
      id: row.id,
      topicKey: row.topic_key,
      title: row.title,
      content: row.content,
      rank: row.rank,
    }),
  );
}

export function formatKnowledgeContext(results: KnowledgeSearchResult[]): string {
  if (results.length === 0) {
    return "No matching firm knowledge entries. Mark gaps as TODO(legal).";
  }

  return results
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title} (${r.topicKey})\n${r.content.slice(0, 1200)}`,
    )
    .join("\n\n---\n\n");
}

export type LegalCorpusSearchResult = LegalCorpusSearchHit;

/**
 * Platform legal corpus search. Uses Supabase FTS when available, else local chunk files.
 */
export async function searchLegalCorpus(
  query: string,
  locale: DocumentLocale,
  limit = 12,
): Promise<LegalCorpusSearchResult[]> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase.rpc("search_legal_corpus", {
      p_query: query,
      p_locale: locale,
      p_limit: limit,
    });

    if (!error && data && data.length > 0) {
      return data.map((row) => {
        const rowLocale = parseDocumentLocale(row.locale);
        return {
          sourceId: row.source_id,
          locale: rowLocale,
          articleRef: row.article_ref,
          heading: row.heading,
          content: row.content,
          citation: row.citation,
          title: row.title,
          translationStatus: rowLocale === "en-US" ? ("pending" as const) : ("official" as const),
          score: row.rank,
        };
      });
    }
  } catch {
    // Fall through to local file search (dev / pre-migration)
  }

  return searchLegalCorpusLocal(query, locale, limit);
}

export function formatLegalCorpusForPrompt(
  results: LegalCorpusSearchResult[],
  locale: DocumentLocale,
): string {
  return formatLegalCorpusContext(results, locale);
}
