"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { createDeal } from "@/lib/deals/service";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { deleteFirmDeal } from "@/lib/firm/deals";
import { resolveFounderByEmail } from "@/lib/firm/founder-lookup";
import { resolveFirmReviewTenantScope } from "@/lib/firm/tenant";
import { uploadDataRoomFile } from "@/lib/data-room/upload";
import { createFinding } from "@/lib/dd/findings";
import { upsertDealAssessment } from "@/lib/dd/assessments";
import { requireUserId } from "@/lib/data-room/access";

const DEAL_ACTION_ERRORS = new Set([
  "unauthorized",
  "firm_membership_required",
  "founder_not_found",
  "founder_required",
  "founder_ambiguous",
  "tenant_not_configured",
  "create_failed",
]);

function mapDealActionError(error: unknown): string {
  if (error instanceof Error) {
    if (DEAL_ACTION_ERRORS.has(error.message)) return error.message;

    const message = error.message.toLowerCase();
    if (message.includes("23503") || message.includes("foreign key")) {
      return "tenant_not_configured";
    }
    if (message.includes("pgrst116")) {
      return "founder_ambiguous";
    }
    if (message.includes("row-level security")) {
      return "create_failed";
    }
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message).toLowerCase();
    if (message.includes("23503") || message.includes("foreign key")) {
      return "tenant_not_configured";
    }
    if (message.includes("pgrst116")) {
      return "founder_ambiguous";
    }
  }

  return "create_failed";
}

export async function createFirmDealAction(input: {
  name: string;
  founderClerkId?: string;
  founderEmail?: string;
}): Promise<{ ok: true; dealId: string } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const membership = await getFirmMembershipForUser(userId);
    if (!membership) return { ok: false, error: "firm_membership_required" };

    const { primaryTenantId } = await resolveFirmReviewTenantScope(userId);

    let targetSub = input.founderClerkId?.trim() ?? "";
    if (!targetSub && input.founderEmail?.trim()) {
      const founder = await resolveFounderByEmail(input.founderEmail, { tenantId: primaryTenantId });
      if (!founder) return { ok: false, error: "founder_not_found" };
      targetSub = founder.clerkUserId;
    }

    if (!targetSub) return { ok: false, error: "founder_required" };

    const deal = await createDeal({
      tenantId: primaryTenantId,
      name: input.name.trim(),
      targetSub,
    });

    revalidatePath("/firma/dd");
    return { ok: true, dealId: deal.id };
  } catch (error) {
    console.error("createFirmDealAction failed", error);
    return { ok: false, error: mapDealActionError(error) };
  }
}

export async function deleteFirmDealAction(
  dealId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };

    const membership = await getFirmMembershipForUser(userId);
    if (!membership) return { ok: false, error: "firm_membership_required" };

    await deleteFirmDeal(dealId);

    revalidatePath("/firma/dd");
    revalidatePath(`/firma/dd/${dealId}`);
    return { ok: true };
  } catch (error) {
    console.error("deleteFirmDealAction failed", error);
    return { ok: false, error: mapDealActionError(error) };
  }
}

export async function uploadDataRoomDocumentAction(formData: FormData): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const dealId = String(formData.get("dealId") ?? "");
    const taxonomyCategory = String(formData.get("taxonomyCategory") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const file = formData.get("file");

    if (!dealId || !taxonomyCategory || !title || !(file instanceof File)) {
      return { ok: false, error: "invalid_input" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaderName =
      (formData.get("uploaderName") as string | null) ?? "Target user";

    await uploadDataRoomFile({
      dealId,
      uploaderSub: userId,
      uploaderName,
      taxonomyCategory,
      title,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileBytes: buffer,
      ndaGateRequired: formData.get("ndaGateRequired") === "true",
    });

    revalidatePath(`/fundador/sala/${dealId}`);
    revalidatePath(`/firma/dd/${dealId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "upload_failed" };
  }
}

export async function createFindingAction(input: {
  dealId: string;
  riskCategory: string;
  riskLevel: string;
  description: string;
  sourceDocumentId?: string;
  recommendedAction?: string;
  legalCitation?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await createFinding(input);
    revalidatePath(`/firma/dd/${input.dealId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "finding_failed" };
  }
}

export async function saveAssessmentAction(input: {
  dealId: string;
  summary: string;
  publish?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await upsertDealAssessment(input);
    revalidatePath(`/firma/dd/${input.dealId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "assessment_failed" };
  }
}
