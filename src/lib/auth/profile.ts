import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { UserContext } from "@/types/database";

export async function getOrCreateProfile() {
  const session = await auth();
  const userId = session.userId;
  if (!userId) return null;

  const supabase = createServiceRoleSupabaseClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) return existing;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const context =
    (user.publicMetadata?.context as UserContext | undefined) ??
    (user.unsafeMetadata?.context as UserContext | undefined) ??
    "founder";

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      clerk_user_id: userId,
      context,
      display_name: user.fullName,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      avatar_url: user.imageUrl,
      onboarding_complete: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return created;
}
