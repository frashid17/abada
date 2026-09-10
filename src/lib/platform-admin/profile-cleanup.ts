import { clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";

export type ClerkKeyMode = "test" | "live" | "unknown";

export type OrphanRelatedCounts = {
  documents: number;
  memberships: number;
  reviews: number;
  dealParticipants: number;
  questionnaires: number;
};

export type OrphanProfileRow = {
  clerkUserId: string;
  email: string | null;
  displayName: string | null;
  context: string;
  updatedAt: string;
  related: OrphanRelatedCounts;
  removable: boolean;
  blockedReason: string | null;
};

export type OrphanCleanupPreview = {
  clerkMode: ClerkKeyMode;
  confirmPhrase: string;
  clerkUserCount: number;
  profileCount: number;
  orphans: OrphanProfileRow[];
  removableCount: number;
  blockedCount: number;
  warnings: string[];
};

export type OrphanCleanupResult = {
  deletedCount: number;
  deletedUserIds: string[];
  skipped: Array<{ clerkUserId: string; reason: string }>;
};

const CONFIRM_TEST = "CLEANUP-TEST";
const CONFIRM_LIVE = "CLEANUP-LIVE";

export function detectClerkKeyMode(): ClerkKeyMode {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (key.startsWith("pk_test_")) return "test";
  if (key.startsWith("pk_live_")) return "live";
  return "unknown";
}

export function confirmPhraseForMode(mode: ClerkKeyMode): string {
  if (mode === "live") return CONFIRM_LIVE;
  return CONFIRM_TEST;
}

function parseEnvProtectedSubs(): Set<string> {
  return new Set(
    (process.env.PLATFORM_ADMIN_SUBS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("user_")),
  );
}

async function listAllClerkUserIds(): Promise<Set<string>> {
  const clerk = await clerkClient();
  const ids = new Set<string>();
  let offset = 0;
  const limit = 100;

  for (;;) {
    const page = await clerk.users.getUserList({ limit, offset });
    for (const user of page.data) {
      ids.add(user.id);
    }
    if (page.data.length < limit) break;
    offset += limit;
    // Hard stop to avoid runaway loops on huge instances
    if (offset > 10_000) break;
  }

  return ids;
}

async function safeCount(
  run: () => PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  try {
    const { count, error } = await run();
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function countRelated(
  supabase: ReturnType<typeof createServiceRoleSupabaseClient>,
  clerkUserId: string,
): Promise<OrphanRelatedCounts> {
  const [documents, memberships, reviews, dealParticipants, questionnaires] = await Promise.all([
    safeCount(() =>
      supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("owner_sub", clerkUserId),
    ),
    safeCount(() =>
      supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("clerk_user_id", clerkUserId),
    ),
    safeCount(() =>
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("requester_sub", clerkUserId),
    ),
    safeCount(() =>
      supabase
        .from("deal_participants")
        .select("id", { count: "exact", head: true })
        .eq("participant_sub", clerkUserId),
    ),
    safeCount(() =>
      supabase
        .from("dd_questionnaires")
        .select("id", { count: "exact", head: true })
        .eq("owner_sub", clerkUserId),
    ),
  ]);

  return {
    documents,
    memberships,
    reviews,
    dealParticipants,
    questionnaires,
  };
}

function relatedTotal(related: OrphanRelatedCounts): number {
  return (
    related.documents +
    related.memberships +
    related.reviews +
    related.dealParticipants +
    related.questionnaires
  );
}

export async function previewOrphanedProfiles(): Promise<OrphanCleanupPreview> {
  const actorSub = await requirePlatformAdmin();
  const clerkMode = detectClerkKeyMode();
  const supabase = createServiceRoleSupabaseClient();
  const clerkUserIds = await listAllClerkUserIds();
  const protectedSubs = parseEnvProtectedSubs();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("clerk_user_id, email, display_name, context, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const warnings: string[] = [];
  if (clerkMode === "test") {
    warnings.push(
      "Clerk is using TEST keys (pk_test_). Cleanup only removes profiles missing from this test Clerk instance. Do not point localhost test keys at a production Supabase database.",
    );
  } else if (clerkMode === "live") {
    warnings.push(
      "Clerk is using LIVE keys (pk_live_). Cleanup removes profiles missing from production Clerk.",
    );
  } else {
    warnings.push(
      "Could not detect Clerk key mode from NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY. Cleanup is blocked until the key is set.",
    );
  }

  const orphans: OrphanProfileRow[] = [];
  for (const row of profiles ?? []) {
    if (clerkUserIds.has(row.clerk_user_id)) continue;

    const related = await countRelated(supabase, row.clerk_user_id);
    let removable = true;
    let blockedReason: string | null = null;

    if (row.clerk_user_id === actorSub) {
      removable = false;
      blockedReason = "current_admin";
    } else if (protectedSubs.has(row.clerk_user_id)) {
      removable = false;
      blockedReason = "env_admin";
    } else if (relatedTotal(related) > 0) {
      removable = false;
      blockedReason = "has_related_data";
    }

    orphans.push({
      clerkUserId: row.clerk_user_id,
      email: row.email,
      displayName: row.display_name,
      context: row.context,
      updatedAt: row.updated_at,
      related,
      removable,
      blockedReason,
    });
  }

  return {
    clerkMode,
    confirmPhrase: confirmPhraseForMode(clerkMode),
    clerkUserCount: clerkUserIds.size,
    profileCount: (profiles ?? []).length,
    orphans,
    removableCount: orphans.filter((o) => o.removable).length,
    blockedCount: orphans.filter((o) => !o.removable).length,
    warnings,
  };
}

export async function cleanupOrphanedProfiles(
  confirmPhrase: string,
): Promise<OrphanCleanupResult> {
  const actorSub = await requirePlatformAdmin();
  const clerkMode = detectClerkKeyMode();
  if (clerkMode === "unknown") {
    throw new Error("Clerk key mode unknown — set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  const expected = confirmPhraseForMode(clerkMode);
  if (confirmPhrase.trim() !== expected) {
    throw new Error(
      `Confirmation phrase must be exactly ${expected} for the current Clerk ${clerkMode} keys`,
    );
  }

  const preview = await previewOrphanedProfiles();
  const supabase = createServiceRoleSupabaseClient();
  const deletedUserIds: string[] = [];
  const skipped: OrphanCleanupResult["skipped"] = [];

  for (const orphan of preview.orphans) {
    if (!orphan.removable) {
      skipped.push({
        clerkUserId: orphan.clerkUserId,
        reason: orphan.blockedReason ?? "blocked",
      });
      continue;
    }

    // Re-check related data immediately before delete
    const related = await countRelated(supabase, orphan.clerkUserId);
    if (relatedTotal(related) > 0) {
      skipped.push({ clerkUserId: orphan.clerkUserId, reason: "has_related_data" });
      continue;
    }

    if (orphan.clerkUserId === actorSub) {
      skipped.push({ clerkUserId: orphan.clerkUserId, reason: "current_admin" });
      continue;
    }

    const { error: adminError } = await supabase
      .from("platform_admins")
      .delete()
      .eq("clerk_user_id", orphan.clerkUserId);
    if (adminError) throw adminError;

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("clerk_user_id", orphan.clerkUserId);
    if (profileError) throw profileError;

    deletedUserIds.push(orphan.clerkUserId);
  }

  await writeAuditLog({
    action: "platform.profiles.orphan_cleanup",
    actorSub,
    resourceType: "profiles",
    resourceId: "orphan_cleanup",
    metadata: {
      clerkMode,
      deletedCount: deletedUserIds.length,
      deletedUserIds,
      skipped,
    },
  });

  return {
    deletedCount: deletedUserIds.length,
    deletedUserIds,
    skipped,
  };
}
