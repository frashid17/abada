import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { homeForContext } from "@/lib/auth/routing";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { UserContext } from "@/types/database";

export async function requireFirmPageAccess(redirectPath = "/firma"): Promise<{
  userId: string;
  tenantId: string;
  role: string;
  tenantName: string;
}> {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/iniciar-sesion?redirect_url=${encodeURIComponent(redirectPath)}`);
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("context")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  // Workspace access (Clerk/profile) wins over leftover firm memberships.
  if (
    profile?.context === "founder" ||
    profile?.context === "investor"
  ) {
    redirect(homeForContext(profile.context as UserContext));
  }

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) {
    redirect("/invitacion-firma?error=membership_required");
  }

  return {
    userId,
    tenantId: membership.tenantId,
    role: membership.role,
    tenantName: membership.tenantName,
  };
}
