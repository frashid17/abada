import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { homeForContext } from "@/lib/auth/routing";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import type { UserContext } from "@/types/database";

/**
 * Resolve the product workspace home for a signed-in user.
 * Profile/Clerk workspace context is the source of truth.
 * Firm membership is only a fallback when context is missing.
 */
export async function resolveWorkspaceHome(userId: string): Promise<string> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("context")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profile?.context) {
    return homeForContext(profile.context as UserContext);
  }

  const membership = await getFirmMembershipForUser(userId);
  if (membership) return "/firma";

  return "/fundador";
}

export async function resolveWorkspaceContext(
  userId: string,
): Promise<UserContext> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("context")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (
    profile?.context === "founder" ||
    profile?.context === "investor" ||
    profile?.context === "firm"
  ) {
    return profile.context;
  }

  const membership = await getFirmMembershipForUser(userId);
  if (membership) return "firm";

  return "founder";
}
