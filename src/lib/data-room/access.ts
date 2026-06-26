import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { DealParticipantRole } from "@/lib/deals/types";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { resolveFirmReviewTenantScope } from "@/lib/firm/tenant";

export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function assertDealParticipant(
  dealId: string,
  userSub: string,
  allowedRoles?: DealParticipantRole[],
): Promise<{ role: DealParticipantRole; tenantId: string }> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: participant, error } = await supabase
    .from("deal_participants")
    .select("role")
    .eq("deal_id", dealId)
    .eq("participant_sub", userSub)
    .maybeSingle();

  if (error) throw error;
  if (!participant) throw new Error("Forbidden");

  const role = participant.role as DealParticipantRole;
  if (allowedRoles && !allowedRoles.includes(role)) {
    throw new Error("Forbidden");
  }

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("tenant_id")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError) throw dealError;
  if (!deal?.tenant_id) throw new Error("Deal not found");

  return { role, tenantId: deal.tenant_id };
}

export async function assertFirmDealAccess(dealId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) throw new Error("Forbidden");

  const { visibleTenantIds } = await resolveFirmReviewTenantScope(userId);

  const supabase = createServiceRoleSupabaseClient();
  const { data: deal, error } = await supabase
    .from("deals")
    .select("tenant_id")
    .eq("id", dealId)
    .in("tenant_id", visibleTenantIds)
    .maybeSingle();

  if (error) throw error;
  if (!deal) throw new Error("Deal not found");

  return deal.tenant_id;
}

export async function assertDealReadAccess(dealId: string, userId: string): Promise<void> {
  try {
    await assertFirmDealAccess(dealId);
  } catch {
    await assertDealParticipant(dealId, userId);
  }
}
