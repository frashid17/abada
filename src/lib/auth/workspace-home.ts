import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { homeForContext } from "@/lib/auth/routing";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import type { UserContext } from "@/types/database";

/**
 * Resolve the product workspace home for a signed-in user.
 * Firm membership wins over stale Clerk/profile founder context.
 */
export async function resolveWorkspaceHome(userId: string): Promise<string> {
  const membership = await getFirmMembershipForUser(userId);
  if (membership) return "/firma";

  const supabase = createServiceRoleSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("context")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profile?.context) {
    return homeForContext(profile.context as UserContext);
  }

  return "/fundador";
}

export async function resolveWorkspaceContext(
  userId: string,
): Promise<UserContext> {
  const membership = await getFirmMembershipForUser(userId);
  if (membership) return "firm";

  const supabase = createServiceRoleSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("context")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profile?.context === "investor" || profile?.context === "firm") {
    return profile.context;
  }

  return "founder";
}
