import { clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type UserLabel = {
  sub: string;
  displayName: string;
  email: string | null;
};

/**
 * Resolve Clerk user ids to human-readable labels from profiles,
 * falling back to the Clerk API when no profile row exists.
 */
export async function resolveUserLabels(
  clerkUserIds: Array<string | null | undefined>,
): Promise<Map<string, UserLabel>> {
  const unique = [...new Set(clerkUserIds.filter((id): id is string => Boolean(id)))];
  const map = new Map<string, UserLabel>();

  if (unique.length === 0) return map;

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("clerk_user_id, display_name, email")
      .in("clerk_user_id", unique);

    for (const row of data ?? []) {
      const displayName =
        row.display_name?.trim() ||
        row.email?.trim() ||
        shortenUserId(row.clerk_user_id);
      map.set(row.clerk_user_id, {
        sub: row.clerk_user_id,
        displayName,
        email: row.email,
      });
    }
  } catch {
    // fall through to Clerk / shortened ids
  }

  const missing = unique.filter((id) => !map.has(id));
  if (missing.length > 0) {
    try {
      const clerk = await clerkClient();
      await Promise.all(
        missing.map(async (id) => {
          try {
            const user = await clerk.users.getUser(id);
            const displayName =
              user.fullName?.trim() ||
              [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
              user.username?.trim() ||
              user.primaryEmailAddress?.emailAddress ||
              shortenUserId(id);
            const email = user.primaryEmailAddress?.emailAddress ?? null;
            map.set(id, { sub: id, displayName, email });
          } catch {
            map.set(id, { sub: id, displayName: shortenUserId(id), email: null });
          }
        }),
      );
    } catch {
      for (const id of missing) {
        if (!map.has(id)) {
          map.set(id, { sub: id, displayName: shortenUserId(id), email: null });
        }
      }
    }
  }

  for (const id of unique) {
    if (!map.has(id)) {
      map.set(id, { sub: id, displayName: shortenUserId(id), email: null });
    }
  }

  return map;
}

export function formatUserLabel(label: UserLabel | undefined, fallback = "—"): string {
  if (!label) return fallback;
  if (label.email && label.displayName !== label.email) {
    return `${label.displayName} (${label.email})`;
  }
  return label.email ?? label.displayName;
}

function shortenUserId(id: string): string {
  if (id.startsWith("user_") && id.length > 16) {
    return `${id.slice(0, 10)}…${id.slice(-4)}`;
  }
  return id;
}
