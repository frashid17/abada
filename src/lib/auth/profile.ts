import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { UserContext } from "@/types/database";

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || Boolean(error.message?.toLowerCase().includes("duplicate"));
}

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

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const contextFromClerk =
    (user.publicMetadata?.context as UserContext | undefined) ??
    (user.unsafeMetadata?.context as UserContext | undefined) ??
    null;

  if (existing) {
    // Clerk is source of truth for workspace context when metadata is set.
    if (contextFromClerk && existing.context !== contextFromClerk) {
      const { data: synced, error } = await supabase
        .from("profiles")
        .update({
          context: contextFromClerk,
          updated_at: new Date().toISOString(),
        })
        .eq("clerk_user_id", userId)
        .select("*")
        .single();
      if (!error && synced) return synced;
    }
    return existing;
  }

  const context = contextFromClerk ?? "founder";
  const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;

  const baseRow = {
    clerk_user_id: userId,
    context,
    display_name: user.fullName,
    avatar_url: user.imageUrl,
    onboarding_complete: false,
  };

  let { data: created, error } = await supabase
    .from("profiles")
    .insert({ ...baseRow, email })
    .select("*")
    .single();

  if (error && email && isUniqueViolation(error) && context === "founder") {
    await supabase
      .from("profiles")
      .update({ email: null, updated_at: new Date().toISOString() })
      .eq("context", "founder")
      .ilike("email", email)
      .neq("clerk_user_id", userId);

    ({ data: created, error } = await supabase
      .from("profiles")
      .insert({ ...baseRow, email })
      .select("*")
      .single());
  }

  if (error && isUniqueViolation(error)) {
    ({ data: created, error } = await supabase
      .from("profiles")
      .insert(baseRow)
      .select("*")
      .single());
  }

  if (error) throw error;
  return created;
}
