import content from "@/lib/documents/prototype/content.json";

export type PrototypeDocId = "fundadores" | "incentivos" | "pi";

export type PrototypeArticle = {
  id: string;
  n: string;
  t_es: string;
  t_en: string;
  does_es: string;
  does_en: string;
  matters_es: string;
  matters_en: string;
  note_es?: string;
  note_en?: string;
  dec?: string;
  cl?: Array<string | { h: string }>;
};

export type PrototypeGroup = {
  g_es: string;
  g_en: string;
  arts: PrototypeArticle[];
};

export type PrototypeDoc = {
  t_es: string;
  t_en: string;
  sub_es: string;
  sub_en: string;
  full_es?: string;
  full_en?: string;
  groups: PrototypeGroup[];
};

export type PrototypeDecisionOption = {
  v: string;
  t: string;
  te: string;
  c_es?: string;
  c_en?: string;
  rec?: number;
};

export type PrototypeDecision = {
  es: string;
  en: string;
  type: "choice" | "num" | string;
  def?: string | number;
  q_es: string;
  q_en: string;
  hint_es?: string;
  hint_en?: string;
  unit_es?: string;
  unit_en?: string;
  options?: PrototypeDecisionOption[];
};

export const PROTOTYPE_DOC_ORDER = content.order as PrototypeDocId[];

export const PROTOTYPE_DOCS = content.docs as Record<PrototypeDocId, PrototypeDoc>;

export const PROTOTYPE_DECISIONS = content.decisions as Record<string, PrototypeDecision>;

export const PROTOTYPE_TOKENS = content.tokens as Record<
  string,
  { es: string; en: string; ph?: string; type?: string; long?: boolean }
>;

export function isPrototypeDocId(value: string): value is PrototypeDocId {
  return PROTOTYPE_DOC_ORDER.includes(value as PrototypeDocId);
}

export function flattenPrototypeArticles(docId: PrototypeDocId): PrototypeArticle[] {
  return PROTOTYPE_DOCS[docId].groups.flatMap((group) => group.arts);
}

export function countPrototypeDecisions(docId: PrototypeDocId): number {
  return flattenPrototypeArticles(docId).filter((article) => Boolean(article.dec)).length;
}

export function countPrototypeArticles(docId: PrototypeDocId): number {
  return flattenPrototypeArticles(docId).length;
}

export function findDecisionLocation(decisionKey: string): {
  docId: PrototypeDocId;
  article: PrototypeArticle;
} | null {
  for (const docId of PROTOTYPE_DOC_ORDER) {
    for (const article of flattenPrototypeArticles(docId)) {
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

export function listPrototypeDecisionRows(): Array<{
  key: string;
  docId: PrototypeDocId;
  article: PrototypeArticle;
}> {
  return Object.keys(PROTOTYPE_DECISIONS)
    .map((key) => {
      const location = findDecisionLocation(key);
      if (!location) return null;
      return { key, docId: location.docId, article: location.article };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}
