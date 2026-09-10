import { flattenPrototypeArticles } from "@/lib/documents/prototype/catalog";
import type { PrototypeContentBundle, PrototypeDocId } from "@/lib/documents/prototype/types";
import type { PrototypeStore } from "@/lib/documents/prototype/store";
import type { DocumentStatus } from "@/lib/documents/catalog";

export type FounderPipelineDocStatus = "not_started" | "draft" | "complete";

export type FounderPipelineDocument = {
  id: PrototypeDocId;
  step: number;
  status: FounderPipelineDocStatus;
  href: string;
};

export type FounderPipelineProgress = {
  documents: FounderPipelineDocument[];
  completedCount: number;
  totalCount: number;
  nextDocument: FounderPipelineDocument | null;
  inProgressCount: number;
  remainingCount: number;
};

function mapPrototypeStatus(
  doneDec: number,
  totalDec: number,
  seenCount: number,
): FounderPipelineDocStatus {
  if (totalDec > 0 && doneDec >= totalDec) return "complete";
  if (doneDec > 0 || seenCount > 0) return "draft";
  return "not_started";
}

function docProgress(
  docId: PrototypeDocId,
  content: PrototypeContentBundle,
  store: PrototypeStore,
) {
  const articles = flattenPrototypeArticles(docId, content);
  const totalDec = articles.filter((article) => article.dec).length;
  const doneDec = articles.filter(
    (article) =>
      article.dec &&
      store.decisions[article.dec] !== undefined &&
      String(store.decisions[article.dec]).length > 0,
  ).length;
  const seenCount = Object.keys(store.seen[docId] ?? {}).length;

  return { totalDec, doneDec, seenCount };
}

export function getFounderPipelineProgress(
  content: PrototypeContentBundle,
  store: PrototypeStore,
): FounderPipelineProgress {
  const documents: FounderPipelineDocument[] = content.order.map((id, index) => {
    const { totalDec, doneDec, seenCount } = docProgress(id, content, store);

    return {
      id,
      step: index + 1,
      status: mapPrototypeStatus(doneDec, totalDec, seenCount),
      href: `/fundador/documentos/preparacion/${id}`,
    };
  });

  const completedCount = documents.filter((doc) => doc.status === "complete").length;
  const inProgressCount = documents.filter((doc) => doc.status === "draft").length;
  const remainingCount = documents.filter((doc) => doc.status !== "complete").length;
  const nextDocument = documents.find((doc) => doc.status !== "complete") ?? null;

  return {
    documents,
    completedCount,
    totalCount: documents.length,
    nextDocument,
    inProgressCount,
    remainingCount,
  };
}

export function toDashboardDocumentStatus(
  status: FounderPipelineDocStatus,
): DocumentStatus {
  if (status === "complete") return "complete";
  if (status === "draft") return "draft";
  return "not_started";
}
