import type { DashboardDocument, FounderDashboardData } from "@/lib/documents/dashboard";
import type { DocumentStatus, InvestmentDocumentType } from "@/lib/documents/catalog";

const STATUS_PRIORITY: Record<DocumentStatus, number> = {
  flagged: 0,
  in_review: 1,
  draft: 2,
  not_started: 3,
  complete: 4,
};

export type FounderDashboardInsights = {
  nextDocument: DashboardDocument | null;
  inProgressCount: number;
  needsAttentionCount: number;
  remainingCount: number;
  completionPct: number;
};

export function getFounderDashboardInsights(data: FounderDashboardData): FounderDashboardInsights {
  const sorted = [...data.documents].sort((a, b) => a.step - b.step);
  const nextDocument =
    sorted.find((doc) => doc.status !== "complete") ??
    null;

  const inProgressCount = data.documents.filter((doc) =>
    ["draft", "in_review"].includes(doc.status),
  ).length;

  const needsAttentionCount = data.documents.filter((doc) =>
    ["flagged", "in_review"].includes(doc.status),
  ).length;

  const remainingCount = data.documents.filter((doc) => doc.status !== "complete").length;
  const completionPct =
    data.totalCount > 0 ? Math.round((data.completedCount / data.totalCount) * 100) : 0;

  return {
    nextDocument,
    inProgressCount,
    needsAttentionCount,
    remainingCount,
    completionPct,
  };
}

export function isDocumentFlowReady(_documentType: InvestmentDocumentType): boolean {
  return true;
}

export function sortDocumentsForDisplay(documents: DashboardDocument[]): DashboardDocument[] {
  return [...documents].sort((a, b) => {
    if (a.status === "complete" && b.status !== "complete") return 1;
    if (b.status === "complete" && a.status !== "complete") return -1;
    const priorityDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (priorityDiff !== 0) return priorityDiff;
    return a.step - b.step;
  });
}
