"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { homeForContext } from "@/lib/auth/routing";
import { markOnboardingComplete } from "@/lib/onboarding/actions";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import {
  createPlatformInvitation,
  redeemPlatformInvitation,
  type PlatformInviteRole,
} from "@/lib/platform-admin/invitations";

const ROLES: PlatformInviteRole[] = ["founder", "investor", "firm"];

export async function createPlatformInviteAction(input: {
  email: string;
  role: string;
}): Promise<
  | { ok: true; inviteUrl: string; emailSent: boolean; emailError?: string }
  | { ok: false; error: string }
> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };
    if (!(await isPlatformAdmin(userId))) return { ok: false, error: "forbidden" };

    const role = input.role as PlatformInviteRole;
    if (!ROLES.includes(role)) return { ok: false, error: "invalid_role" };

    const result = await createPlatformInvitation({
      email: input.email,
      role,
      invitedBySub: userId,
    });

    revalidatePath("/admin/invitaciones");
    revalidatePath("/admin/analytics");

    return {
      ok: true,
      inviteUrl: result.inviteUrl,
      emailSent: result.emailSent,
      emailError: result.emailError,
    };
  } catch (error) {
    console.error("[platform-invite] create failed", error);
    return { ok: false, error: "invite_failed" };
  }
}

export async function redeemPlatformInviteAction(
  token: string,
): Promise<{ ok: true; redirect: string } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return { ok: false, error: "email_required" };

    const invitation = await redeemPlatformInvitation({
      token,
      clerkUserId: userId,
      email,
    });

    if (invitation.role === "firm") {
      // Firm still needs org/tenant setup via onboarding.
      return { ok: true, redirect: "/onboarding" };
    }

    await markOnboardingComplete(userId, invitation.role);
    return { ok: true, redirect: homeForContext(invitation.role) };
  } catch (error) {
    console.error("[platform-invite] redeem failed", error);
    return { ok: false, error: "redeem_failed" };
  }
}
