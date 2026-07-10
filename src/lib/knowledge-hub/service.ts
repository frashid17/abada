import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getPrimaryFirmTenantId } from "@/lib/firm/tenant";
import { KNOWLEDGE_HUB_ARTICLE_SEEDS } from "@/lib/knowledge-hub/seed-articles";

export type KnowledgeHubArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  publishedAt: string | null;
};

function mapArticle(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  published_at: string | null;
}): KnowledgeHubArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    publishedAt: row.published_at,
  };
}

export async function listPublishedKnowledgeArticles(): Promise<KnowledgeHubArticle[]> {
  const tenantId = await getPrimaryFirmTenantId();
  if (!tenantId) {
    return KNOWLEDGE_HUB_ARTICLE_SEEDS.map((article, index) => ({
      id: `seed-${index}`,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      publishedAt: new Date().toISOString(),
    }));
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("knowledge_hub_articles")
    .select("id, slug, title, excerpt, body, published_at")
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .order("published_at", { ascending: true });

  if (error) throw error;

  if (!data?.length) {
    return KNOWLEDGE_HUB_ARTICLE_SEEDS.map((article, index) => ({
      id: `seed-${index}`,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      body: article.body,
      publishedAt: new Date().toISOString(),
    }));
  }

  return data.map(mapArticle);
}

export async function getPublishedKnowledgeArticle(
  slug: string,
): Promise<KnowledgeHubArticle | null> {
  const articles = await listPublishedKnowledgeArticles();
  return articles.find((article) => article.slug === slug) ?? null;
}
