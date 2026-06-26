import { auth } from "@clerk/nextjs/server";
import { deleteDeal } from "@/lib/deals/service";
import { assertFirmDealAccess } from "@/lib/data-room/access";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { resolveFirmReviewTenantScope } from "@/lib/firm/tenant";
import type { DealRecord } from "@/lib/deals/types";

function mapDeal(row: {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  created_at: string;
}): DealRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function listFirmDeals(): Promise<DealRecord[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) throw new Error("Forbidden");

  const { visibleTenantIds } = await resolveFirmReviewTenantScope(userId);

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, tenant_id, name, status, created_at")
    .in("tenant_id", visibleTenantIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapDeal);
}

export async function getFirmDeal(dealId: string): Promise<DealRecord | null> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) throw new Error("Forbidden");

  const { visibleTenantIds } = await resolveFirmReviewTenantScope(userId);

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, tenant_id, name, status, created_at")
    .eq("id", dealId)
    .in("tenant_id", visibleTenantIds)
    .maybeSingle();

  if (error) throw error;
  return data ? mapDeal(data) : null;
}

export async function deleteFirmDeal(dealId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) throw new Error("Forbidden");

  const tenantId = await assertFirmDealAccess(dealId);
  await deleteDeal(dealId);

  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_sub: userId,
    action: "dd.room.delete",
    resource_type: "deal",
    resource_id: dealId,
    metadata: {},
  });
}
