"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  createFirmInvitation,
  redeemFirmInvitation,
  updateFirmMemberRole,
} from "@/lib/firm/invitations";
import { getFirmMembershipForUser, isFirmAdminRole } from "@/lib/firm/membership";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { updateFirmReview, type ReviewStatus } from "@/lib/firm/reviews";

export async function updateFirmReviewAction(
  reviewId: string,
  input: {
    status: ReviewStatus;
    notes: string;
    executiveSummary: string | null;
  },
): Promise<{ ok: true } | { ok: false; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const user = await currentUser();
    const reviewerName =
      user?.fullName ??
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ??
      user?.primaryEmailAddress?.emailAddress ??
      "Attorney";

    await updateFirmReview(reviewId, {
      status: input.status,
      markup: { notes: input.notes },
      executiveSummary: input.executiveSummary,
      reviewerSub: input.status === "in_progress" || input.status === "completed" ? userId : undefined,
      reviewerName: input.status === "completed" ? reviewerName : undefined,
    });
    revalidatePath(`/firma/cola/${reviewId}`);
    revalidatePath("/firma/cola");
    return { ok: true };
  } catch {
    return { ok: false, error: "save_failed" };
  }
}

export async function createFirmInviteAction(input: {
  email: string;
  role: FirmMemberRole;
}): Promise<{ ok: true; inviteUrl: string } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const membership = await getFirmMembershipForUser(userId);
    if (!membership || !isFirmAdminRole(membership.role)) {
      return { ok: false, error: "forbidden" };
    }

    const { inviteUrl } = await createFirmInvitation({
      email: input.email,
      role: input.role,
      invitedBySub: userId,
      tenantId: membership.tenantId,
    });

    revalidatePath("/firma/equipo");
    return { ok: true, inviteUrl };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "invite_failed" };
  }
}

export async function updateFirmMemberRoleAction(input: {
  membershipId: string;
  role: FirmMemberRole;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const membership = await getFirmMembershipForUser(userId);
    if (!membership || !isFirmAdminRole(membership.role)) {
      return { ok: false, error: "forbidden" };
    }

    await updateFirmMemberRole({
      tenantId: membership.tenantId,
      membershipId: input.membershipId,
      role: input.role,
      actorClerkUserId: userId,
    });

    revalidatePath("/firma/equipo");
    revalidatePath("/firma");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "role_update_failed";
    return { ok: false, error: message };
  }
}

export async function redeemFirmInviteAction(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) return { ok: false, error: "email_required" };

    await redeemFirmInvitation({ token, clerkUserId: userId, email });
    revalidatePath("/firma");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "redeem_failed" };
  }
}
