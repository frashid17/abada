import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/**
 * Platform ops access: PLATFORM_ADMIN_SUBS (comma-separated Clerk user ids)
 * and/or rows in public.platform_admins. Clerk publicMetadata.platformAdmin=true
 * is also accepted.
 */
export async function isPlatformAdmin(userId?: string | null): Promise<boolean> {
  const sub = userId ?? (await auth()).userId;
  if (!sub) return false;

  const fromEnv = (process.env.PLATFORM_ADMIN_SUBS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (fromEnv.includes(sub)) return true;

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(sub);
    if (user.publicMetadata?.platformAdmin === true) return true;
  } catch {
    // ignore Clerk lookup failures
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data } = await supabase
      .from("platform_admins")
      .select("clerk_user_id")
      .eq("clerk_user_id", sub)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function requirePlatformAdmin(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (!(await isPlatformAdmin(userId))) throw new Error("Forbidden");
  return userId;
}
