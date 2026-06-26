import { getFirmName } from "@/lib/brand";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

type TenantMembershipStats = {
  tenantId: string;
  name: string;
  memberCount: number;
};

async function loadTenantMembershipStats(): Promise<TenantMembershipStats[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: rows, error } = await supabase
    .from("memberships")
    .select("tenant_id, tenants:tenant_id(id, name)");

  if (error) throw error;

  const counts = new Map<string, TenantMembershipStats>();
  for (const row of (rows ?? []) as Array<{
    tenant_id: string;
    tenants: { id: string; name: string } | null;
  }>) {
    const existing = counts.get(row.tenant_id);
    if (existing) {
      existing.memberCount += 1;
      continue;
    }
    counts.set(row.tenant_id, {
      tenantId: row.tenant_id,
      name: row.tenants?.name ?? "",
      memberCount: 1,
    });
  }

  return Array.from(counts.values()).sort((a, b) => b.memberCount - a.memberCount);
}

/**
 * Canonical firm tenant for founder review routing and firm queue visibility.
 * Prefers the tenant with firm memberships over a stale DEFAULT_FIRM_TENANT_ID.
 */
export async function getPrimaryFirmTenantId(): Promise<string | null> {
  const firmName = getFirmName();
  const explicit = process.env.DEFAULT_FIRM_TENANT_ID?.trim() || null;
  const stats = await loadTenantMembershipStats();

  if (stats.length === 0) {
    if (explicit) return explicit;

    const supabase = createServiceRoleSupabaseClient();
    const { data: byName } = await supabase
      .from("tenants")
      .select("id")
      .eq("name", firmName)
      .maybeSingle();
    return byName?.id ?? null;
  }

  if (explicit && stats.some((tenant) => tenant.tenantId === explicit)) {
    return explicit;
  }

  const namedTenant = stats.find((tenant) => tenant.name === firmName);
  if (namedTenant) return namedTenant.tenantId;

  return stats[0]?.tenantId ?? null;
}

export async function getFirmTenantIdsForUser(clerkUserId: string): Promise<string[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("clerk_user_id", clerkUserId);

  if (error) throw error;

  const tenantIds = [...new Set((data ?? []).map((row) => row.tenant_id))];
  const primary = await getPrimaryFirmTenantId();
  if (primary && !tenantIds.includes(primary)) {
    tenantIds.push(primary);
  }
  return tenantIds;
}

/** Move orphaned queue items onto the canonical firm tenant (single-firm MVP). */
export async function repairReviewTenantRouting(primaryTenantId: string): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();

  await supabase
    .from("reviews")
    .update({ tenant_id: primaryTenantId, updated_at: new Date().toISOString() })
    .in("status", ["queued", "in_progress"])
    .neq("tenant_id", primaryTenantId);

  await supabase
    .from("documents")
    .update({ tenant_id: primaryTenantId, updated_at: new Date().toISOString() })
    .in("status", ["in_review", "flagged"])
    .neq("tenant_id", primaryTenantId);
}

export async function resolveFirmReviewTenantScope(clerkUserId: string): Promise<{
  primaryTenantId: string;
  visibleTenantIds: string[];
}> {
  const [primaryTenantId, visibleTenantIds] = await Promise.all([
    getPrimaryFirmTenantId(),
    getFirmTenantIdsForUser(clerkUserId),
  ]);

  if (!primaryTenantId) {
    throw new Error("Firm tenant not configured");
  }

  const merged = [...new Set([primaryTenantId, ...visibleTenantIds])];
  await repairReviewTenantRouting(primaryTenantId);

  return { primaryTenantId, visibleTenantIds: merged };
}
