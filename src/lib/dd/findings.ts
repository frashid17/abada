import { auth } from "@clerk/nextjs/server";
import { assertDealReadAccess, assertFirmDealAccess } from "@/lib/data-room/access";
import { isDdRiskCategory, isDdRiskLevel, type DdRiskCategory, type DdRiskLevel } from "@/lib/dd/taxonomy";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type FindingRecord = {
  id: string;
  dealId: string;
  tenantId: string;
  riskCategory: DdRiskCategory;
  riskLevel: DdRiskLevel;
  sourceDocumentId: string | null;
  sourcePage: number | null;
  description: string;
  recommendedAction: string | null;
  legalCitation: string | null;
  createdAt: string;
};

function mapFinding(row: {
  id: string;
  deal_id: string;
  tenant_id: string;
  risk_category: string;
  risk_level: string;
  source_document_id: string | null;
  source_page: number | null;
  description: string;
  recommended_action: string | null;
  legal_citation: string | null;
  created_at: string;
}): FindingRecord {
  return {
    id: row.id,
    dealId: row.deal_id,
    tenantId: row.tenant_id,
    riskCategory: row.risk_category as DdRiskCategory,
    riskLevel: row.risk_level as DdRiskLevel,
    sourceDocumentId: row.source_document_id,
    sourcePage: row.source_page,
    description: row.description,
    recommendedAction: row.recommended_action,
    legalCitation: row.legal_citation,
    createdAt: row.created_at,
  };
}

export async function listDealFindings(dealId: string): Promise<FindingRecord[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await assertDealReadAccess(dealId, userId);

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("findings")
    .select(
      "id, deal_id, tenant_id, risk_category, risk_level, source_document_id, source_page, description, recommended_action, legal_citation, created_at",
    )
    .eq("deal_id", dealId)
    .order("risk_level", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapFinding);
}

export async function createFinding(input: {
  dealId: string;
  riskCategory: string;
  riskLevel: string;
  description: string;
  sourceDocumentId?: string;
  sourcePage?: number;
  recommendedAction?: string;
  legalCitation?: string;
}): Promise<FindingRecord> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!isDdRiskCategory(input.riskCategory) || !isDdRiskLevel(input.riskLevel)) {
    throw new Error("Invalid risk category or level");
  }

  const tenantId = await assertFirmDealAccess(input.dealId);
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("findings")
    .insert({
      deal_id: input.dealId,
      tenant_id: tenantId,
      risk_category: input.riskCategory,
      risk_level: input.riskLevel,
      description: input.description,
      source_document_id: input.sourceDocumentId ?? null,
      source_page: input.sourcePage ?? null,
      recommended_action: input.recommendedAction ?? null,
      legal_citation: input.legalCitation ?? null,
    })
    .select(
      "id, deal_id, tenant_id, risk_category, risk_level, source_document_id, source_page, description, recommended_action, legal_citation, created_at",
    )
    .single();

  if (error) throw error;

  await createServiceRoleSupabaseClient().from("audit_logs").insert({
    tenant_id: tenantId,
    actor_sub: userId,
    action: "dd.finding.create",
    resource_type: "finding",
    resource_id: data.id,
    metadata: { dealId: input.dealId, riskCategory: input.riskCategory },
  });

  return mapFinding(data);
}

export async function listFindingsByCategory(
  dealId: string,
): Promise<Record<string, FindingRecord[]>> {
  const findings = await listDealFindings(dealId);
  return findings.reduce<Record<string, FindingRecord[]>>((acc, finding) => {
    const key = finding.riskCategory;
    acc[key] = acc[key] ?? [];
    acc[key].push(finding);
    return acc;
  }, {});
}
