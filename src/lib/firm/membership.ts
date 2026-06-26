import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type FirmMemberRole = "partner" | "associate" | "of_counsel" | "admin";

export type FirmMembership = {
  tenantId: string;
  tenantName: string;
  role: FirmMemberRole;
  clerkUserId: string;
};

export async function getFirmMembershipForUser(
  clerkUserId: string,
): Promise<FirmMembership | null> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("tenant_id, clerk_user_id, role")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", data.tenant_id)
    .maybeSingle();

  return {
    tenantId: data.tenant_id,
    tenantName: tenant?.name ?? "Firm",
    role: data.role as FirmMemberRole,
    clerkUserId: data.clerk_user_id,
  };
}

export async function requireFirmMembership(): Promise<FirmMembership> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) throw new Error("Firm membership required");

  return membership;
}

export function isFirmAdminRole(role: FirmMemberRole): boolean {
  return role === "admin" || role === "partner";
}
