import { auth } from "@clerk/nextjs/server";
import { assertDealReadAccess, assertFirmDealAccess } from "@/lib/data-room/access";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type AssessmentRecord = {
  id: string;
  dealId: string;
  tenantId: string;
  summary: string | null;
  publishedAt: string | null;
  createdAt: string;
};

function mapAssessment(row: {
  id: string;
  deal_id: string;
  tenant_id: string;
  summary: string | null;
  published_at: string | null;
  created_at: string;
}): AssessmentRecord {
  return {
    id: row.id,
    dealId: row.deal_id,
    tenantId: row.tenant_id,
    summary: row.summary,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export async function getDealAssessment(dealId: string): Promise<AssessmentRecord | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await assertDealReadAccess(dealId, userId);

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("id, deal_id, tenant_id, summary, published_at, created_at")
    .eq("deal_id", dealId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapAssessment(data) : null;
}

export async function getPublishedDealAssessment(dealId: string): Promise<AssessmentRecord | null> {
  const assessment = await getDealAssessment(dealId);
  if (!assessment?.publishedAt) return null;
  return assessment;
}

export async function upsertDealAssessment(input: {
  dealId: string;
  summary: string;
  publish?: boolean;
}): Promise<AssessmentRecord> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const tenantId = await assertFirmDealAccess(input.dealId);
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("assessments")
    .upsert(
      {
        deal_id: input.dealId,
        tenant_id: tenantId,
        summary: input.summary,
        published_at: input.publish ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "deal_id" },
    )
    .select("id, deal_id, tenant_id, summary, published_at, created_at")
    .single();

  if (error) throw error;
  return mapAssessment(data);
}
