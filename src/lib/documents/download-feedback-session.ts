import type { FeedbackDocumentType } from "@/lib/documents/download-feedback";

export type DownloadFeedbackDraft = {
  easeRating: number | null;
  whatWouldChange: string;
  hardestTopic: string;
  foundersWithoutLawyer: string;
  lawyerTimeNeeded: string;
  respondentName: string;
};

function openKey(documentType: FeedbackDocumentType): string {
  return `abada.downloadFeedback.open.${documentType}`;
}

function draftKey(documentType: FeedbackDocumentType): string {
  return `abada.downloadFeedback.draft.${documentType}`;
}

export function readFeedbackModalOpen(documentType: FeedbackDocumentType): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(openKey(documentType)) === "1";
  } catch {
    return false;
  }
}

export function writeFeedbackModalOpen(
  documentType: FeedbackDocumentType,
  open: boolean,
): void {
  if (typeof window === "undefined") return;
  try {
    if (open) sessionStorage.setItem(openKey(documentType), "1");
    else sessionStorage.removeItem(openKey(documentType));
  } catch {
    // sessionStorage unavailable
  }
}

export function readFeedbackDraft(
  documentType: FeedbackDocumentType,
): DownloadFeedbackDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(draftKey(documentType));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DownloadFeedbackDraft>;
    return {
      easeRating:
        typeof parsed.easeRating === "number" &&
        Number.isInteger(parsed.easeRating) &&
        parsed.easeRating >= 1 &&
        parsed.easeRating <= 5
          ? parsed.easeRating
          : null,
      whatWouldChange: typeof parsed.whatWouldChange === "string" ? parsed.whatWouldChange : "",
      hardestTopic: typeof parsed.hardestTopic === "string" ? parsed.hardestTopic : "",
      foundersWithoutLawyer:
        typeof parsed.foundersWithoutLawyer === "string" ? parsed.foundersWithoutLawyer : "",
      lawyerTimeNeeded:
        typeof parsed.lawyerTimeNeeded === "string" ? parsed.lawyerTimeNeeded : "",
      respondentName: typeof parsed.respondentName === "string" ? parsed.respondentName : "",
    };
  } catch {
    return null;
  }
}

export function writeFeedbackDraft(
  documentType: FeedbackDocumentType,
  draft: DownloadFeedbackDraft,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(draftKey(documentType), JSON.stringify(draft));
  } catch {
    // sessionStorage unavailable
  }
}

export function clearFeedbackSession(documentType: FeedbackDocumentType): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(openKey(documentType));
    sessionStorage.removeItem(draftKey(documentType));
  } catch {
    // sessionStorage unavailable
  }
}
