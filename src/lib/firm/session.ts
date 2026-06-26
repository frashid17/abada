import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFirmMembershipForUser } from "@/lib/firm/membership";

export async function requireFirmPageAccess(redirectPath = "/firma"): Promise<{
  userId: string;
  tenantId: string;
  role: string;
  tenantName: string;
}> {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/iniciar-sesion?redirect_url=${encodeURIComponent(redirectPath)}`);
  }

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) {
    redirect("/invitacion-firma?error=membership_required");
  }

  return {
    userId,
    tenantId: membership.tenantId,
    role: membership.role,
    tenantName: membership.tenantName,
  };
}
