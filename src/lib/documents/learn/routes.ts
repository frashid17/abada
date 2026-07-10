import type { LearnDocumentType } from "@/lib/documents/learn/render-learn-document";

export const LEARN_DOCUMENT_SLUGS: Record<LearnDocumentType, string> = {
  term_sheet: "term-sheet",
  shareholders: "shareholders",
};

const SLUG_TO_TYPE = Object.fromEntries(
  Object.entries(LEARN_DOCUMENT_SLUGS).map(([type, slug]) => [slug, type]),
) as Record<string, LearnDocumentType>;

export const LEARN_DOCUMENT_TYPES = Object.keys(LEARN_DOCUMENT_SLUGS) as LearnDocumentType[];

export function learnSlugToType(slug: string): LearnDocumentType | null {
  return SLUG_TO_TYPE[slug] ?? null;
}

export function learnTypeToSlug(documentType: LearnDocumentType): string {
  return LEARN_DOCUMENT_SLUGS[documentType];
}

export const TEMPLATES_BASE_PATH = "/fundador/plantillas";

/** @deprecated Use TEMPLATES_BASE_PATH */
export const DOCUMENTATION_BASE_PATH = TEMPLATES_BASE_PATH;

export function templatesPath(documentType: LearnDocumentType): string {
  return `${TEMPLATES_BASE_PATH}/${learnTypeToSlug(documentType)}`;
}

/** @deprecated Use templatesPath */
export function documentationPath(documentType: LearnDocumentType): string {
  return templatesPath(documentType);
}
