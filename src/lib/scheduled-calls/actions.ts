"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { assertDealParticipant } from "@/lib/data-room/access";
import { getFirmMembershipForUser, listFirmMemberSubs } from "@/lib/firm/membership";
import { createNotification } from "@/lib/notifications/service";
import { resolveFirmReviewTenantScope } from "@/lib/firm/tenant";
import {
  listScheduledCallsForRequester,
  listScheduledCallsForTenant,
  requestScheduledCall,
  updateScheduledCallStatus,
  type ScheduledCallStatus,
} from "@/lib/scheduled-calls/service";

export async function requestScheduledCallAction(input: {
  dealId: string;
  scheduledAt: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const { tenantId } = await assertDealParticipant(input.dealId, userId, ["investor", "target"]);

    await requestScheduledCall({
      tenantId,
      requesterSub: userId,
      scheduledAt: input.scheduledAt,
    });

    const firmSubs = await listFirmMemberSubs(tenantId);
    await Promise.all(
      firmSubs.map((sub) =>
        createNotification({
          recipientSub: sub,
          tenantId,
          title: "Nueva solicitud de llamada",
          body: "Un participante solicitó una llamada de seguimiento en una sala de DD.",
        }),
      ),
    );

    await createNotification({
      recipientSub: userId,
      tenantId,
      title: "Llamada solicitada",
      body: "La firma confirmará tu horario de llamada pronto.",
    });

    revalidatePath(`/inversionista/salas/${input.dealId}`);
    revalidatePath("/firma/dd");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "call_failed" };
  }
}

export async function updateScheduledCallStatusAction(input: {
  callId: string;
  status: ScheduledCallStatus;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const membership = await getFirmMembershipForUser(userId);
    if (!membership) return { ok: false, error: "forbidden" };

    const call = await updateScheduledCallStatus({
      callId: input.callId,
      tenantId: membership.tenantId,
      status: input.status,
    });

    await createNotification({
      recipientSub: call.requesterSub,
      tenantId: call.tenantId,
      title: "Actualización de llamada",
      body: `Tu llamada fue marcada como ${input.status}.`,
    });

    revalidatePath("/firma/dd");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "update_failed" };
  }
}

export async function listMyScheduledCallsAction() {
  const { userId } = await auth();
  if (!userId) return [];

  return listScheduledCallsForRequester(userId);
}

export async function listFirmScheduledCallsAction() {
  const { userId } = await auth();
  if (!userId) return [];

  const membership = await getFirmMembershipForUser(userId);
  if (!membership) return [];

  return listScheduledCallsForTenant(membership.tenantId);
}

export async function requestGeneralScheduledCallAction(input: {
  scheduledAt: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const { primaryTenantId } = await resolveFirmReviewTenantScope(userId);

    await requestScheduledCall({
      tenantId: primaryTenantId,
      requesterSub: userId,
      scheduledAt: input.scheduledAt,
    });

    const firmSubs = await listFirmMemberSubs(primaryTenantId);
    await Promise.all(
      firmSubs.map((sub) =>
        createNotification({
          recipientSub: sub,
          tenantId: primaryTenantId,
          title: "Nueva solicitud de llamada",
          body: "Un usuario solicitó una llamada con la firma.",
        }),
      ),
    );

    revalidatePath("/inversionista");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "call_failed" };
  }
}
