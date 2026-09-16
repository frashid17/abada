"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import {
  hasDocumentDownloadFeedback,
  isFeedbackDocumentType,
  submitDocumentDownloadFeedback,
  type DocumentDownloadFeedbackInput,
} from "@/lib/documents/download-feedback";

export type SubmitDownloadFeedbackResult =
  | { ok: true }
  | {
      ok: false;
      error:
        | "unauthorized"
        | "invalid_document"
        | "invalid_email"
        | "invalid_rating"
        | "incomplete"
        | "generic";
    };

export async function hasDownloadFeedbackAction(
  documentType: string,
): Promise<boolean> {
  const { userId } = await auth();
  if (!userId || !isFeedbackDocumentType(documentType)) return false;
  return hasDocumentDownloadFeedback(userId, documentType);
}

export async function submitDownloadFeedbackAction(input: {
  documentType: string;
  easeRating: number;
  whatWouldChange: string;
  hardestTopic: string;
  foundersWithoutLawyer: string;
  lawyerTimeNeeded: string;
  respondentName?: string;
}): Promise<SubmitDownloadFeedbackResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "unauthorized" };
    if (!isFeedbackDocumentType(input.documentType)) {
      return { ok: false, error: "invalid_document" };
    }

    const user = await currentUser();
    const respondentEmail =
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      "";

    if (!respondentEmail) return { ok: false, error: "invalid_email" };

    const payload: DocumentDownloadFeedbackInput = {
      documentType: input.documentType,
      easeRating: input.easeRating,
      whatWouldChange: input.whatWouldChange,
      hardestTopic: input.hardestTopic,
      foundersWithoutLawyer: input.foundersWithoutLawyer,
      lawyerTimeNeeded: input.lawyerTimeNeeded,
      respondentName: input.respondentName,
    };

    await submitDocumentDownloadFeedback({
      ownerSub: userId,
      respondentEmail,
      payload,
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "generic";
    if (
      message === "invalid_email" ||
      message === "invalid_rating" ||
      message === "incomplete"
    ) {
      return { ok: false, error: message };
    }
    console.error("[document-feedback] submit action failed", error);
    return { ok: false, error: "generic" };
  }
}
