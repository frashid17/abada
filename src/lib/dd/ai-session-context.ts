import type { FindingRecord } from "@/lib/dd/findings";

const MAX_CONTEXT_CHARS = 3900;

export type DdAiSessionInput = {
  dealName: string;
  dealStatus: string;
  documents: Array<{ title: string; category: string; versionNumber: number }>;
  findings: Array<
    Pick<FindingRecord, "riskCategory" | "riskLevel" | "description" | "recommendedAction">
  >;
  assessmentSummary: string | null;
  assessmentPublished: boolean;
};

/** Compact deal context for `/api/ai/chat` (playbook is injected server-side for `dd_finding`). */
export function buildDdAiSessionContext(input: DdAiSessionInput): string {
  const lines: string[] = [
    `Deal: ${input.dealName}`,
    `Status: ${input.dealStatus}`,
    `Assessment: ${input.assessmentPublished ? "published" : "draft"}${
      input.assessmentSummary ? ` — ${truncate(input.assessmentSummary, 280)}` : " — none yet"
    }`,
    `Documents (${input.documents.length}):`,
  ];

  for (const doc of input.documents.slice(0, 24)) {
    lines.push(`- [${doc.category}] ${doc.title} (v${doc.versionNumber})`);
  }
  if (input.documents.length > 24) {
    lines.push(`- … +${input.documents.length - 24} more`);
  }

  lines.push(`Findings (${input.findings.length}):`);
  for (const finding of input.findings.slice(0, 18)) {
    const action = finding.recommendedAction
      ? ` | Action: ${truncate(finding.recommendedAction, 120)}`
      : "";
    lines.push(
      `- [${finding.riskLevel}/${finding.riskCategory}] ${truncate(finding.description, 180)}${action}`,
    );
  }
  if (input.findings.length > 18) {
    lines.push(`- … +${input.findings.length - 18} more`);
  }

  let text = lines.join("\n");
  if (text.length > MAX_CONTEXT_CHARS) {
    text = `${text.slice(0, MAX_CONTEXT_CHARS - 1)}…`;
  }
  return text;
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
