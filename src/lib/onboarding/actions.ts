"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { homeForContext } from "@/lib/auth/routing";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { createFirmTenant } from "@/lib/firm/create-tenant";
import { redeemFirmInvitation } from "@/lib/firm/invitations";
import { resolveInviteForOnboarding } from "@/lib/firm/invite-lookup";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import type { UserContext } from "@/types/database";

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

  return null;
}

export async function markOnboardingComplete(
  clerkUserId: string,
  context: UserContext,
): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("profiles").upsert(
    {
      clerk_user_id: clerkUserId,
      context,
      onboarding_complete: true,
    },
    { onConflict: "clerk_user_id" },
  );

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { context },
    unsafeMetadata: { context },
  });
}

export async function completeFounderOnboarding(): Promise<
  { ok: true; redirect: string } | { ok: false; error: string }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "unauthorized" };

  await markOnboardingComplete(userId, "founder");
  return { ok: true, redirect: "/fundador" };
}

export async function completeInvestorOnboarding(): Promise<
  { ok: true; redirect: string } | { ok: false; error: string }
> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "unauthorized" };

  await markOnboardingComplete(userId, "investor");
  return { ok: true, redirect: "/inversionista" };
}

export async function completeCreateFirmOnboarding(input: {
  firmName: string;
}): Promise<{ ok: true; redirect: string } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
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
    return { ok: false, error: error instanceof Error ? error.message : "create_failed" };
  }
}

export async function completeJoinInviteOnboarding(input: {
  inviteToken: string;
}): Promise<{ ok: true; redirect: string } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
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
