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
  const bulk = await createPlatformInvitesAction({ emails: input.email, role: input.role });
  if (!bulk.ok) return bulk;
  const first = bulk.results[0];
  if (!first) return { ok: false, error: "invite_failed" };
  if (!first.ok) return { ok: false, error: first.error };
  return {
    ok: true,
    inviteUrl: first.inviteUrl,
    emailSent: first.emailSent,
    emailError: first.emailError,
  };
}

export type BulkInviteResultItem =
  | { email: string; ok: true; inviteUrl: string; emailSent: boolean; emailError?: string }
  | { email: string; ok: false; error: string };

function parseInviteEmails(raw: string): string[] {
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const part of raw.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    emails.push(email);
  }
  return emails;
}

export async function createPlatformInvitesAction(input: {
  emails: string;
  role: string;
}): Promise<
  | { ok: true; results: BulkInviteResultItem[] }
  | { ok: false; error: string }
> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };
    if (!(await isPlatformAdmin(userId))) return { ok: false, error: "forbidden" };

    const role = input.role as PlatformInviteRole;
    if (!ROLES.includes(role)) return { ok: false, error: "invalid_role" };

    const emails = parseInviteEmails(input.emails);
    if (emails.length === 0) return { ok: false, error: "invalid_email" };
    if (emails.length > 50) return { ok: false, error: "too_many" };

    const results: BulkInviteResultItem[] = [];
    for (const email of emails) {
      try {
        const result = await createPlatformInvitation({
          email,
          role,
          invitedBySub: userId,
        });
        results.push({
          email,
          ok: true,
          inviteUrl: result.inviteUrl,
          emailSent: result.emailSent,
          emailError: result.emailError,
        });
      } catch (error) {
        console.error("[platform-invite] create one failed", email, error);
        results.push({ email, ok: false, error: "invite_failed" });
      }
    }

    revalidatePath("/admin/invitaciones");
    revalidatePath("/admin/analytics");

    return { ok: true, results };
  } catch (error) {
    console.error("[platform-invite] bulk create failed", error);
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
