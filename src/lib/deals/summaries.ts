import { DD_DOCUMENT_CATEGORIES } from "@/lib/dd/taxonomy";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type DealRoomSummary = {
  dealId: string;
  documentCount: number;
  categoriesCovered: number;
  totalCategories: number;
  findingCount: number;
  hasPublishedAssessment: boolean;
};

export async function getDealRoomSummaries(dealIds: string[]): Promise<Map<string, DealRoomSummary>> {
  const summaries = new Map<string, DealRoomSummary>();
  if (dealIds.length === 0) return summaries;

  const supabase = createServiceRoleSupabaseClient();
  const totalCategories = DD_DOCUMENT_CATEGORIES.length;

  const [{ data: documents }, { data: findings }, { data: assessments }] = await Promise.all([
    supabase.from("data_room_documents").select("deal_id, taxonomy_category").in("deal_id", dealIds),
    supabase.from("findings").select("deal_id").in("deal_id", dealIds),
    supabase.from("assessments").select("deal_id, published_at").in("deal_id", dealIds),
  ]);

  for (const dealId of dealIds) {
    summaries.set(dealId, {
      dealId,
      documentCount: 0,
      categoriesCovered: 0,
      totalCategories,
      findingCount: 0,
      hasPublishedAssessment: false,
    });
  }

  const categoriesByDeal = new Map<string, Set<string>>();
  for (const document of documents ?? []) {
    const summary = summaries.get(document.deal_id);
    if (!summary) continue;
    summary.documentCount += 1;
    const categories = categoriesByDeal.get(document.deal_id) ?? new Set<string>();
    categories.add(document.taxonomy_category);
    categoriesByDeal.set(document.deal_id, categories);
  }

  for (const [dealId, categories] of categoriesByDeal) {
    const summary = summaries.get(dealId);
    if (summary) summary.categoriesCovered = categories.size;
  }

  for (const finding of findings ?? []) {
    const summary = summaries.get(finding.deal_id);
    if (summary) summary.findingCount += 1;
  }

  for (const assessment of assessments ?? []) {
    const summary = summaries.get(assessment.deal_id);
    if (summary && assessment.published_at) {
      summary.hasPublishedAssessment = true;
    }
  }

  return summaries;
}

export async function getDealRoomSummary(dealId: string): Promise<DealRoomSummary> {
  const summaries = await getDealRoomSummaries([dealId]);
  return (
    summaries.get(dealId) ?? {
      dealId,
      documentCount: 0,
      categoriesCovered: 0,
      totalCategories: DD_DOCUMENT_CATEGORIES.length,
      findingCount: 0,
      hasPublishedAssessment: false,
    }
  );
}
