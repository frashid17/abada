/**
 * Split Colombian legal text into article/chapter-sized chunks.
 * Mirrors scripts/ingest-legal-sources.mjs so admin uploads match CLI ingest.
 */

const ARTICLE_SPLIT =
  /(?=\b(?:ART(?:ÍCULO|ICULO|\.|º|°)?\.?\s*\d+|Artículo\s+\d+|ARTICULO\s+\d+|CAPÍTULO\s+[IVXLC\d]+|CAPITULO\s+[IVXLC\d]+|TÍTULO\s+[IVXLC\d]+|TITULO\s+[IVXLC\d]+)\b)/gi;

export type LegalTextChunk = {
  articleRef: string;
  heading: string;
  content: string;
};

export function normalizeLegalWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseArticleRef(heading: string): string | null {
  const art = heading.match(
    /(?:ART(?:ÍCULO|ICULO|\.|º|°)?\.?\s*(\d+)|Artículo\s+(\d+)|ARTICULO\s+(\d+))/i,
  );
  if (art) return `Art. ${art[1] ?? art[2] ?? art[3]}`;
  const chapter = heading.match(/CAP[ÍI]TULO\s+([IVXLC\d]+)/i);
  if (chapter) return `Ch. ${chapter[1]}`;
  const title = heading.match(/T[ÍI]TULO\s+([IVXLC\d]+)/i);
  if (title) return `Title ${title[1]}`;
  return null;
}

export function chunkLegalText(rawText: string): LegalTextChunk[] {
  const text = normalizeLegalWhitespace(rawText);
  if (!text) return [];

  const parts = text.split(ARTICLE_SPLIT).filter((p) => p.trim().length > 40);
  if (parts.length <= 1) {
    return [
      {
        articleRef: "preamble",
        heading: "Preamble",
        content: text.slice(0, 12000),
      },
    ];
  }

  return parts.map((part, index) => {
    const lines = part.trim().split("\n");
    const heading = lines[0]?.trim().slice(0, 200) ?? `Section ${index + 1}`;
    const body = lines.slice(1).join("\n").trim() || part.trim();
    const articleRef = parseArticleRef(heading) ?? `section-${index + 1}`;
    return {
      articleRef,
      heading,
      content: body.slice(0, 12000),
    };
  });
}
