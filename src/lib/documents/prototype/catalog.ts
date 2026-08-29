import { SEED_PROTOTYPE_CONTENT } from "@/lib/documents/prototype/seed";
import type {
  PrototypeArticle,
  PrototypeContentBundle,
  PrototypeDecision,
  PrototypeDocId,
  PrototypeTokenMeta,
} from "@/lib/documents/prototype/types";

export type {
  PrototypeArticle,
  PrototypeContentBundle,
  PrototypeDecision,
  PrototypeDecisionOption,
  PrototypeDoc,
  PrototypeDocId,
  PrototypeGroup,
  PrototypeTokenMeta,
} from "@/lib/documents/prototype/types";

export { SEED_PROTOTYPE_CONTENT };

/** @deprecated Use resolved content from context or getResolvedPrototypeContent(). */
export const PROTOTYPE_DOC_ORDER = SEED_PROTOTYPE_CONTENT.order;
/** @deprecated Use resolved content from context or getResolvedPrototypeContent(). */
export const PROTOTYPE_DOCS = SEED_PROTOTYPE_CONTENT.docs;
/** @deprecated Use resolved content from context or getResolvedPrototypeContent(). */
export const PROTOTYPE_DECISIONS = SEED_PROTOTYPE_CONTENT.decisions;
/** @deprecated Use resolved content from context or getResolvedPrototypeContent(). */
export const PROTOTYPE_TOKENS = SEED_PROTOTYPE_CONTENT.tokens;

export function isPrototypeDocId(value: string): value is PrototypeDocId {
  return SEED_PROTOTYPE_CONTENT.order.includes(value as PrototypeDocId);
}

export function flattenPrototypeArticles(
  docId: PrototypeDocId,
  content: PrototypeContentBundle = SEED_PROTOTYPE_CONTENT,
): PrototypeArticle[] {
  return content.docs[docId].groups.flatMap((group) => group.arts);
}

export function countPrototypeDecisions(
  docId: PrototypeDocId,
  content: PrototypeContentBundle = SEED_PROTOTYPE_CONTENT,
): number {
  return flattenPrototypeArticles(docId, content).filter((article) => Boolean(article.dec))
    .length;
}

export function countPrototypeArticles(
  docId: PrototypeDocId,
  content: PrototypeContentBundle = SEED_PROTOTYPE_CONTENT,
): number {
  return flattenPrototypeArticles(docId, content).length;
}

export function findDecisionLocation(
  decisionKey: string,
  content: PrototypeContentBundle = SEED_PROTOTYPE_CONTENT,
): { docId: PrototypeDocId; article: PrototypeArticle } | null {
  for (const docId of content.order) {
    for (const article of flattenPrototypeArticles(docId, content)) {
      if (article.dec === decisionKey) return { docId, article };
      if (
        (article.cl ?? []).some(
          (block) => typeof block === "string" && block.includes(`[[${decisionKey}]]`),
        )
      ) {
        return { docId, article };
      }
    }
  }
  return null;
}

export function listPrototypeDecisionRows(
  content: PrototypeContentBundle = SEED_PROTOTYPE_CONTENT,
): Array<{ key: string; docId: PrototypeDocId; article: PrototypeArticle }> {
  return Object.keys(content.decisions)
    .map((key) => {
      const location = findDecisionLocation(key, content);
      if (!location) return null;
      return { key, docId: location.docId, article: location.article };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

export function getDecision(
  key: string,
  content: PrototypeContentBundle,
): PrototypeDecision | undefined {
  return content.decisions[key];
}

export function getTokenMeta(
  key: string,
  content: PrototypeContentBundle,
): PrototypeTokenMeta | undefined {
  return content.tokens[key];
}
