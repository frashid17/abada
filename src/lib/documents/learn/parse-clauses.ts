export type DocumentClause = {
  id: string;
  heading: string | null;
  body: string;
};

/** Split rendered plain-text body into scroll-synced clause sections. */
export function parseDocumentClauses(body: string): DocumentClause[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const clauses: DocumentClause[] = [];
  const preambleParts: string[] = [];
  let current: DocumentClause | null = null;

  for (const paragraph of paragraphs) {
    const firstLine = paragraph.split("\n")[0]?.trim() ?? "";
    const sectionMatch = firstLine.match(/^(\d+)\.\s+(.+)$/);

    if (sectionMatch && firstLine.length < 200) {
      if (!current && preambleParts.length > 0) {
        clauses.push({
          id: "preamble",
          heading: preambleParts[0] ?? null,
          body: preambleParts.slice(1).join("\n\n"),
        });
        preambleParts.length = 0;
      }

      if (current) clauses.push(current);

      const remainder = paragraph.includes("\n")
        ? paragraph.split("\n").slice(1).join("\n").trim()
        : "";

      current = {
        id: sectionMatch[1]!,
        heading: firstLine,
        body: remainder,
      };
      continue;
    }

    if (!current) {
      preambleParts.push(paragraph);
      continue;
    }

    current.body = current.body ? `${current.body}\n\n${paragraph}` : paragraph;
  }

  if (!current && preambleParts.length > 0) {
    clauses.push({
      id: "preamble",
      heading: preambleParts[0] ?? null,
      body: preambleParts.slice(1).join("\n\n"),
    });
  } else if (current) {
    clauses.push(current);
  }

  return clauses;
}
