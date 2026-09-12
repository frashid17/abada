"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { homeForContext } from "@/lib/auth/routing";
import { isUserContext } from "@/lib/auth/user-context";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import {
  applyPreferredWorkspaceContext,
  markOnboardingComplete,
} from "@/lib/onboarding/actions";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { UserContext } from "@/types/database";

export type UpdateOwnContextResult =
  | { ok: true; redirect: string }
  | { ok: false; error: "unauthorized" | "invalid" | "firm_setup_required" | "generic" };

/**
 * Self-serve workspace context switch (founder / investor / firm).
 * Firm requires an existing membership; otherwise the UI should offer create/join.
 */
export async function updateOwnWorkspaceContextAction(
  context: string,
): Promise<UpdateOwnContextResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };
    if (!isUserContext(context)) return { ok: false, error: "invalid" };

    if (context === "firm") {
      const membership = await getFirmMembershipForUser(userId);
      if (!membership) {
        return { ok: false, error: "firm_setup_required" };
      }
      await markOnboardingComplete(userId, "firm");
      await writeAuditLog({
        action: "account.workspace_context_updated",
        actorSub: userId,
        resourceType: "profile",
        resourceId: userId,
        metadata: { context, via: "self_serve" },
      });
      revalidatePath("/", "layout");
      return { ok: true, redirect: "/firma" };
    }

    const redirect = await applyPreferredWorkspaceContext(userId, context);
    await writeAuditLog({
      action: "account.workspace_context_updated",
      actorSub: userId,
      resourceType: "profile",
      resourceId: userId,
      metadata: { context, via: "self_serve" },
    });
    revalidatePath("/", "layout");
    return { ok: true, redirect: redirect ?? homeForContext(context) };
  } catch (error) {
    console.error("[account] updateOwnWorkspaceContext failed", error);
    return { ok: false, error: "generic" };
  }
}

/** Mirror Clerk profile fields into `profiles` after a client-side name update. */
export async function syncOwnProfileAction(): Promise<
  { ok: true } | { ok: false; error: "unauthorized" | "generic" }
> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    const context =
      (user.publicMetadata?.context as UserContext | undefined) ??
      (user.unsafeMetadata?.context as UserContext | undefined) ??
      "founder";

    const supabase = createServiceRoleSupabaseClient();
    const displayName =
      user.fullName ??
      ([user.firstName, user.lastName].filter(Boolean).join(" ") || null);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        avatar_url: user.imageUrl ?? null,
        email: user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null,
        context,
        updated_at: new Date().toISOString(),
      })
      .eq("clerk_user_id", userId);

    if (error) throw error;

    revalidatePath("/cuenta");
    return { ok: true };
  } catch (error) {
    console.error("[account] syncOwnProfile failed", error);
    return { ok: false, error: "generic" };
  }
}
