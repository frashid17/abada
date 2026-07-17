import { listLegalSources } from "@/lib/legal-corpus";

const SOURCE_IDS = new Set(listLegalSources().map((s) => s.id));

export function isLegalSourceId(value: string): boolean {
  return SOURCE_IDS.has(value);
}

export const LEGAL_LIBRARY_BASE_PATH = "/fundador/leyes";

export function legalSourcePath(sourceId: string): string {
  return `${LEGAL_LIBRARY_BASE_PATH}/${sourceId}`;
}
