import { auth, clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function parseAdminAllowlist(): string[] {
  return (process.env.PLATFORM_ADMIN_SUBS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function primaryEmailFromClerkUser(user: {
  emailAddresses: Array<{ id: string; emailAddress: string }>;
  primaryEmailAddressId: string | null;
}): string | null {
  const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
  const email = primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress;
  return email ? normalizeEmail(email) : null;
}

/**
 * Platform ops access:
 * - PLATFORM_ADMIN_SUBS: comma-separated emails (preferred) or Clerk user ids
 * - Clerk publicMetadata.platformAdmin === true
 * - rows in public.platform_admins
 */
export async function isPlatformAdmin(userId?: string | null): Promise<boolean> {
  const sub = userId ?? (await auth()).userId;
  if (!sub) return false;

  const allowlist = parseAdminAllowlist();
  if (allowlist.includes(sub)) return true;

  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(sub);
    if (user.publicMetadata?.platformAdmin === true) return true;

    const email = primaryEmailFromClerkUser(user);
    if (email && allowlist.some((entry) => normalizeEmail(entry) === email)) {
      return true;
    }
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

/** Resolve a Clerk user id from an email address (exact match on primary/any email). */
export async function findClerkUserIdByEmail(email: string): Promise<{
  clerkUserId: string;
  email: string;
  displayName: string | null;
} | null> {
  const normalized = normalizeEmail(email);
  if (!normalized.includes("@")) return null;

  const clerk = await clerkClient();
  const result = await clerk.users.getUserList({
    emailAddress: [normalized],
    limit: 1,
  });
  const user = result.data[0];
  if (!user) return null;

  return {
    clerkUserId: user.id,
    email: primaryEmailFromClerkUser(user) ?? normalized,
    displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
  };
}
