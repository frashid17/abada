"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { homeForContext } from "@/lib/auth/routing";
import { getActiveSession } from "@/lib/auth/session";
import { INVESTMENT_DOCUMENT_CATALOG } from "@/lib/documents/catalog";
import { createFirmTenant } from "@/lib/firm/create-tenant";
import { redeemFirmInvitation } from "@/lib/firm/invitations";
import { resolveInviteForOnboarding } from "@/lib/firm/invite-lookup";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import type { UserContext } from "@/types/database";

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "23505" || Boolean(error.message?.toLowerCase().includes("duplicate"));
}

export async function getOnboardingRedirect(userId: string): Promise<string | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, context")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (profile?.onboarding_complete) {
    return homeForContext(profile.context);
  }

  const membership = await getFirmMembershipForUser(userId);
  if (membership) {
    await markOnboardingComplete(userId, "firm");
    return "/firma";
  }

  const autoRedirect = await tryAutoCompleteInviteOnboarding(userId);
  if (autoRedirect) return autoRedirect;

  // Platform admin is an ops overlay — only use it when there is no product workspace.
  if (await isPlatformAdmin(userId)) return "/admin";

  return null;
}

export async function markOnboardingComplete(
  clerkUserId: string,
  context: UserContext,
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null;
  const displayName =
    user.fullName ??
    ([user.firstName, user.lastName].filter(Boolean).join(" ") || null);

  const baseRow = {
    clerk_user_id: clerkUserId,
    context,
    display_name: displayName,
    avatar_url: user.imageUrl ?? null,
    onboarding_complete: true,
    updated_at: new Date().toISOString(),
  };

  let { error } = await supabase.from("profiles").upsert(
    { ...baseRow, email },
    { onConflict: "clerk_user_id" },
  );

  // Another founder profile may already own this email (re-signup). Clear it and retry.
  if (error && email && isUniqueViolation(error) && context === "founder") {
    await supabase
      .from("profiles")
      .update({ email: null, updated_at: new Date().toISOString() })
      .eq("context", "founder")
      .ilike("email", email)
      .neq("clerk_user_id", clerkUserId);

    ({ error } = await supabase.from("profiles").upsert(
      { ...baseRow, email },
      { onConflict: "clerk_user_id" },
    ));
  }

  // Last resort: complete onboarding without email so the user is not blocked.
  if (error) {
    const { error: fallbackError } = await supabase.from("profiles").upsert(baseRow, {
      onConflict: "clerk_user_id",
    });
    if (fallbackError) throw fallbackError;
  }

  const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const existingUnsafe = (user.unsafeMetadata ?? {}) as Record<string, unknown>;

  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { ...existingPublic, context },
    unsafeMetadata: { ...existingUnsafe, context },
  });
}

async function seedFounderChecklist(clerkUserId: string): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  const { data: existing, error } = await supabase
    .from("documents")
    .select("document_type")
    .eq("owner_sub", clerkUserId);

  if (error) throw error;

  const existingTypes = new Set((existing ?? []).map((row) => row.document_type));
  const missing = INVESTMENT_DOCUMENT_CATALOG.filter((def) => !existingTypes.has(def.type));
  if (missing.length === 0) return;

  const { error: insertError } = await supabase.from("documents").insert(
    missing.map((def) => ({
      owner_sub: clerkUserId,
      document_type: def.type,
      title: def.type,
      status: "not_started" as const,
    })),
  );
  if (insertError) throw insertError;
}

export async function completeFounderOnboarding(): Promise<
  { ok: true; redirect: string } | { ok: false; error: string }
> {
  try {
    const { userId } = await getActiveSession();
    if (!userId) return { ok: false, error: "unauthorized" };

    await markOnboardingComplete(userId, "founder");
    await seedFounderChecklist(userId);
    return { ok: true, redirect: "/fundador" };
  } catch (error) {
    console.error("[onboarding] founder failed", error);
    return {
      ok: false,
      error: error instanceof Error && error.message === "unauthorized" ? "unauthorized" : "generic",
    };
  }
}

export async function completeInvestorOnboarding(): Promise<
  { ok: true; redirect: string } | { ok: false; error: string }
> {
  try {
    const { userId } = await getActiveSession();
    if (!userId) return { ok: false, error: "unauthorized" };

    await markOnboardingComplete(userId, "investor");
    return { ok: true, redirect: "/inversionista" };
  } catch (error) {
    console.error("[onboarding] investor failed", error);
    return {
      ok: false,
      error: error instanceof Error && error.message === "unauthorized" ? "unauthorized" : "generic",
    };
  }
}

export async function completeCreateFirmOnboarding(input: {
  firmName: string;
}): Promise<{ ok: true; redirect: string } | { ok: false; error: string }> {
  try {
    const { userId } = await getActiveSession();
    if (!userId) return { ok: false, error: "unauthorized" };

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return { ok: false, error: "email_required" };

    const existing = await getFirmMembershipForUser(userId);
    if (existing) return { ok: true, redirect: "/firma" };

    await createFirmTenant({
      clerkUserId: userId,
      email,
      firmName: input.firmName,
      displayName: user?.fullName,
    });

    return { ok: true, redirect: "/firma" };
  } catch (error) {
    console.error("[onboarding] create firm failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "create_failed" };
  }
}

export async function completeJoinInviteOnboarding(input: {
  inviteToken: string;
}): Promise<{ ok: true; redirect: string } | { ok: false; error: string }> {
  try {
    const { userId } = await getActiveSession();
    if (!userId) return { ok: false, error: "unauthorized" };

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return { ok: false, error: "email_required" };

    await redeemFirmInvitation({
      token: input.inviteToken,
      clerkUserId: userId,
      email,
    });

    await markOnboardingComplete(userId, "firm");
    return { ok: true, redirect: "/firma" };
  } catch (error) {
    console.error("[onboarding] join invite failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "invite_failed" };
  }
}

export async function tryAutoCompleteInviteOnboarding(userId: string): Promise<string | null> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress;
  const inviteToken = user.unsafeMetadata?.inviteToken as string | undefined;

  if (!email) return null;

  const invitation = await resolveInviteForOnboarding({ inviteToken, email });
  if (!invitation) return null;

  try {
    await redeemFirmInvitation({ token: invitation.token, clerkUserId: userId, email });
    await markOnboardingComplete(userId, "firm");
    return "/firma";
  } catch {
    return null;
  }
}
