import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

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
